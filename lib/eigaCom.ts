import * as cheerio from "cheerio";
import { Screening } from "@/types";

// eiga.com prefecture codes (= JIS prefecture codes)
const PREF_CODE_MAP: Record<string, string> = {
  北海道: "01", 青森県: "02", 岩手県: "03", 宮城県: "04", 秋田県: "05",
  山形県: "06", 福島県: "07", 茨城県: "08", 栃木県: "09", 群馬県: "10",
  埼玉県: "11", 千葉県: "12", 東京都: "13", 神奈川県: "14", 新潟県: "15",
  富山県: "16", 石川県: "17", 福井県: "18", 山梨県: "19", 長野県: "20",
  岐阜県: "21", 静岡県: "22", 愛知県: "23", 三重県: "24", 滋賀県: "25",
  京都府: "26", 大阪府: "27", 兵庫県: "28", 奈良県: "29", 和歌山県: "30",
  鳥取県: "31", 島根県: "32", 岡山県: "33", 広島県: "34", 山口県: "35",
  徳島県: "36", 香川県: "37", 愛媛県: "38", 高知県: "39", 福岡県: "40",
  佐賀県: "41", 長崎県: "42", 熊本県: "43", 大分県: "44", 宮崎県: "45",
  鹿児島県: "46", 沖縄県: "47",
};

const EIGA_BASE = "https://eiga.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

/** 住所文字列から都道府県コードを抽出 */
export function getPrefCodeFromAddress(address: string): string | null {
  for (const [pref, code] of Object.entries(PREF_CODE_MAP)) {
    if (address.includes(pref)) return code;
  }
  return null;
}

/** 文字列の類似度スコア（簡易Jaccard） */
function similarity(a: string, b: string): number {
  // 記号・スペース正規化
  const normalize = (s: string) =>
    s.replace(/[\s　・（）()「」【】\-－]/g, "").toLowerCase();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  // bigram
  const bigrams = (s: string) => new Set(Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2)));
  const sa = bigrams(na);
  const sb = bigrams(nb);
  const intersection = [...sa].filter((x) => sb.has(x)).length;
  return (2 * intersection) / (sa.size + sb.size);
}

export interface EigaTheater {
  name: string;
  url: string;  // e.g. "/theater/13/130301/3035/"
}

/** 都道府県コードから映画館リストを取得 */
export async function getTheatersByPref(prefCode: string): Promise<EigaTheater[]> {
  const html = await fetchHtml(`${EIGA_BASE}/theater/${prefCode}/`);
  const $ = cheerio.load(html);
  const theaters: EigaTheater[] = [];

  $(`a[href^="/theater/${prefCode}/"]`).each((_, el) => {
    const href = $(el).attr("href") || "";
    // Only individual theater URLs (4 segments): /theater/13/130301/3035/
    if (/^\/theater\/\d+\/\d+\/\d+\/$/.test(href)) {
      const name = $(el).text().trim();
      if (name) theaters.push({ name, url: href });
    }
  });

  // Deduplicate
  const seen = new Set<string>();
  return theaters.filter((t) => {
    if (seen.has(t.url)) return false;
    seen.add(t.url);
    return true;
  });
}

/** 映画館名でファジーマッチしてeiga.comのURLを返す */
export async function findTheaterUrl(
  cinemaName: string,
  prefCode: string
): Promise<string | null> {
  const theaters = await getTheatersByPref(prefCode);
  if (theaters.length === 0) return null;

  const scored = theaters
    .map((t) => ({ ...t, score: similarity(cinemaName, t.name) }))
    .sort((a, b) => b.score - a.score);

  // 閾値0.4以上のみ
  return scored[0]?.score >= 0.4 ? scored[0].url : null;
}

/** eiga.comの映画館ページから指定日のスケジュールをパース */
export async function scrapeSchedule(
  theaterPath: string,
  targetDate: string // "YYYY-MM-DD"
): Promise<Screening[]> {
  const dateKey = targetDate.replace(/-/g, ""); // "YYYYMMDD"
  const html = await fetchHtml(`${EIGA_BASE}${theaterPath}`);
  const $ = cheerio.load(html);
  const screenings: Screening[] = [];

  $("section[id^='m']").each((_, section) => {
    const movieId = $(section).attr("id")?.replace("m", "");
    const movieTitle = $(section).attr("data-title") || $(section).find("h2 a").first().text().trim();
    if (!movieId || !movieTitle) return;

    const posterMatch = $(section).find("img").first().attr("src") || "";
    // eiga.com image URL: .../images/movie/{id}/photo/{hash}/320.jpg
    const posterPathMatch = posterMatch.match(/\/images\/movie\/\d+\/photo\/[^/]+\/\d+\.jpg/);
    const posterPath = posterPathMatch ? posterPathMatch[0] : undefined;

    $(section).find(".movie-schedule").each((_, schedBlock) => {
      const typeEl = $(schedBlock).find(".type-subtitled, .type-dubbed").first();
      const language = typeEl.hasClass("type-subtitled")
        ? "字幕版"
        : typeEl.hasClass("type-dubbed")
        ? "日本語吹替"
        : undefined;

      const td = $(schedBlock).find(`td[data-date="${dateKey}"]`);
      if (!td.length) return;

      // Available slots: <a class="btn ticket*">HH:MM<small>～HH:MM</small></a>
      td.find("a.btn[class*='ticket']").each((_, slot) => {
        const el = $(slot);
        const startTime = el.clone().children("small").remove().end().text().trim();
        const endRaw = el.find("small").text().replace("～", "").trim();
        const endTime = endRaw || "";
        const ticketUrl = el.attr("href");

        if (!startTime) return;

        screenings.push({
          id: `eiga-${movieId}-${dateKey}-${startTime.replace(":", "")}`,
          movieId: Number(movieId),
          movieTitle,
          posterPath,
          startTime,
          endTime,
          screen: "",
          language,
          format: "2D",
          ticketUrl,
        } as Screening & { ticketUrl?: string });
      });

      // Sold-out / past slots: <span class="btn off">HH:MM</span>
      td.find("span.btn.off").each((_, slot) => {
        const startTime = $(slot).text().trim();
        if (!startTime) return;

        screenings.push({
          id: `eiga-${movieId}-${dateKey}-${startTime.replace(":", "")}-off`,
          movieId: Number(movieId),
          movieTitle,
          posterPath,
          startTime,
          endTime: "",
          screen: "",
          language,
          format: "2D",
          availableSeats: 0,
          totalSeats: 1,
        });
      });
    });
  });

  return screenings.sort((a, b) => a.startTime.localeCompare(b.startTime));
}
