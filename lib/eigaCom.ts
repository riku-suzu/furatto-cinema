import * as cheerio from "cheerio";
import { Screening } from "@/types";
import { addMinutes, compareTime, isPastJst } from "@/lib/time";
import { findClosestByName } from "@/lib/theaterName";
import { prefCodeFromTheaterId, theaterIdFromPath, theaterPathFromId } from "@/lib/theaterId";

export const EIGA_BASE = "https://eiga.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

export interface EigaTheater {
  id: string;         // e.g. "13-130301-3035"（URLの3セグメントを繋いだもの）
  name: string;
  url: string;        // e.g. "/theater/13/130301/3035/"
  prefCode: string;   // "13"
  movieCount: number; // 上映中の作品数（一覧の「（16）」）
}

/** 都道府県内の映画館一覧（上映作品数つき） */
export async function getTheatersByPref(prefCode: string): Promise<EigaTheater[]> {
  // eiga.comのURLはゼロ埋めしない（北海道は /theater/01/ ではなく /theater/1/）
  const urlCode = String(Number(prefCode));
  const html = await fetchHtml(`${EIGA_BASE}/theater/${urlCode}/`);
  const $ = cheerio.load(html);
  const theaters = new Map<string, EigaTheater>();

  // <li><a href="/theater/13/130301/3035/">TOHOシネマズ 渋谷</a> （16）</li>
  $(`a[href^="/theater/${urlCode}/"]`).each((_, el) => {
    const href = $(el).attr("href") || "";
    const id = theaterIdFromPath(href);
    if (!id || theaters.has(href)) return;
    const name = $(el).text().trim();
    if (!name) return;
    const count = $(el).parent().text().normalize("NFKC").match(/\((\d+)\)\s*$/);
    theaters.set(href, {
      id,
      name,
      url: href,
      prefCode: prefCode.padStart(2, "0"),
      movieCount: count ? Number(count[1]) : 0,
    });
  });

  return [...theaters.values()];
}

/** idから映画館を引く */
export async function getTheaterById(id: string): Promise<EigaTheater | null> {
  const path = theaterPathFromId(id);
  if (!path) return null;
  const theaters = await getTheatersByPref(prefCodeFromTheaterId(id));
  return theaters.find((t) => t.url === path) ?? null;
}

/** 名前が最も近いeiga.comの映画館を返す（十分に似ていなければnull） */
export async function findTheaterByName(cinemaName: string, prefCode: string): Promise<EigaTheater | null> {
  return findClosestByName(cinemaName, await getTheatersByPref(prefCode));
}

/** "3月20日公開" → "2026-03-20" に変換。失敗時は最古（ソート末尾）*/
function parseReleaseDate(text: string): string {
  const m = text.match(/(\d+)月(\d+)日公開/);
  if (!m) return "0000-01-01"; // 不明は末尾へ
  const now = new Date();
  const month = Number(m[1]);
  const year = month < now.getMonth() + 1 - 6 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/** "156分" → 156 */
function parseRuntime(text: string): number {
  const m = text.match(/(\d+)分/);
  return m ? Number(m[1]) : 0;
}

/** 映画館ページに載っている日付ごとのスケジュール（eiga.comは今日から3日分） */
export interface TheaterSchedules {
  dates: string[]; // "YYYY-MM-DD"、昇順
  schedules: Record<string, Screening[]>;
}

/** eiga.comの映画館ページから、載っている全日付のスケジュールをまとめてパース */
export async function scrapeSchedules(theaterPath: string): Promise<TheaterSchedules> {
  const html = await fetchHtml(`${EIGA_BASE}${theaterPath}`);
  const $ = cheerio.load(html);

  // 日付ごとに、映画単位のscreeningsと公開日を集める
  const groupsByDate = new Map<string, Array<{ releaseDate: string; screenings: Screening[] }>>();

  $("section[id^='m']").each((_, section) => {
    const movieId = $(section).attr("id")?.replace("m", "");
    const movieTitle = $(section).attr("data-title") || $(section).find("h2 a").first().text().trim();
    if (!movieId || !movieTitle) return;

    const posterSrc = $(section).find("img").first().attr("src") || "";
    const posterPath = posterSrc.match(/\/images\/movie\/\d+\/photo\/[^/]+\/\d+\.jpg/)?.[0];

    // 公開日・上映時間を取得 (<p class="data"><span>3月20日公開</span><span>156分</span>...)
    const dataSpans = $(section).find("p.data span");
    const releaseText = dataSpans.first().text() || $(section).find(".data").first().text();
    const releaseDate = parseReleaseDate(releaseText);
    const runtime = parseRuntime(dataSpans.eq(1).text() || "");

    const screeningsByDate = new Map<string, Screening[]>();

    $(section).find(".movie-schedule").each((_, schedBlock) => {
      const typeEl = $(schedBlock).find(".type-subtitled, .type-dubbed").first();
      const language = typeEl.hasClass("type-subtitled")
        ? "字幕版"
        : typeEl.hasClass("type-dubbed")
        ? "日本語吹替"
        : undefined;

      $(schedBlock).find("td[data-date]").each((_, cell) => {
        const td = $(cell);
        const dateKey = td.attr("data-date") || ""; // "YYYYMMDD"
        if (!/^\d{8}$/.test(dateKey)) return;
        const date = `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6)}`;
        const list = screeningsByDate.get(date) ?? [];
        screeningsByDate.set(date, list);

        // 各スロットは "8:25<small>～10:20</small>" の形（終了時刻はない場合もある）
        const addScreening = (slot: Parameters<typeof $>[0], idSuffix: string, fields: Partial<Screening>) => {
          const el = $(slot);
          const startTime = el.clone().children("small").remove().end().text().trim();
          if (!startTime) return;
          const endRaw = el.find("small").text().replace("～", "").trim();
          list.push({
            id: `eiga-${movieId}-${dateKey}-${startTime.replace(":", "")}${idSuffix}`,
            movieId: Number(movieId),
            movieTitle,
            posterPath,
            startTime,
            endTime: endRaw || addMinutes(startTime, runtime),
            screen: "",
            language,
            format: "2D",
            isPast: isPastJst(date, startTime),
            ...fields,
          });
        };

        // 購入可能な上映（eiga.com経由のチケット販売）
        td.find("a.btn[class*='ticket']").each((_, slot) => {
          addScreening(slot, "", { ticketUrl: $(slot).attr("href"), booking: "ticket" });
        });

        // 販売終了（満席 or 上映開始済み）
        td.find("span.btn.off").each((_, slot) => {
          addScreening(slot, "-off", { availableSeats: 0, totalSeats: 1 });
        });

        // Some chains (e.g. AEON Cinema) don't sell through eiga.com at all —
        // they just link out to the theater's own official booking site.
        td.find("a.official").each((_, slot) => {
          addScreening(slot, "-official", { ticketUrl: $(slot).attr("href"), booking: "official" });
        });
      });
    });

    for (const [date, screenings] of screeningsByDate) {
      if (!groupsByDate.has(date)) groupsByDate.set(date, []);
      if (screenings.length > 0) groupsByDate.get(date)!.push({ releaseDate, screenings });
    }
  });

  // 公開日の新しい順（降順）にソートしてフラット化、各映画内は上映時間順
  const dates = [...groupsByDate.keys()].sort();
  const schedules: Record<string, Screening[]> = {};
  for (const date of dates) {
    const groups = groupsByDate.get(date)!;
    groups.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
    schedules[date] = groups.flatMap((g) => g.screenings.sort((a, b) => compareTime(a.startTime, b.startTime)));
  }
  return { dates, schedules };
}

/** 指定日のスケジュール（ページに載っていない日なら空） */
export async function scrapeSchedule(theaterPath: string, date: string): Promise<Screening[]> {
  return (await scrapeSchedules(theaterPath)).schedules[date] ?? [];
}
