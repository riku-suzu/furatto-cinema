// eiga.com（映画.com）のページを取得して、映画館一覧と上映スケジュールを読み取る。
import "server-only";

import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { Screening, TheaterSchedules } from "@/types";
import { addMinutes, compareTime, isPastJst } from "@/lib/time";
import { findClosestByName } from "@/lib/theaterName";
import { prefCodeFromTheaterId, theaterIdFromPath, theaterPathFromId } from "@/lib/theaterId";

export const EIGA_BASE = "https://eiga.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
// eiga.comへのリクエストは10分キャッシュする
const REVALIDATE_SECONDS = 600;

/** cheerioで選択した要素（`$(el)` の戻り値） */
type Selection = ReturnType<CheerioAPI>;

async function fetchPage(path: string): Promise<CheerioAPI> {
  const url = `${EIGA_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return cheerio.load(await res.text());
}

// ── 映画館一覧 ───────────────────────────────────────────

export interface EigaTheater {
  id: string;         // e.g. "13-130301-3035"（URLの3セグメントを繋いだもの）
  name: string;
  url: string;        // e.g. "/theater/13/130301/3035/"
  prefCode: string;   // "13"
  movieCount: number; // 上映中の作品数（一覧の「（16）」）
}

/** 一覧の各館の後ろに付く上映作品数 "（16）"（NFKC正規化後は "(16)"） */
const MOVIE_COUNT = /\((\d+)\)\s*$/;

/** 都道府県内の映画館一覧（上映作品数つき） */
export async function getTheatersByPref(prefCode: string): Promise<EigaTheater[]> {
  // eiga.comのURLはゼロ埋めしない（北海道は /theater/01/ ではなく /theater/1/）
  const urlCode = String(Number(prefCode));
  const $ = await fetchPage(`/theater/${urlCode}/`);
  const theaters = new Map<string, EigaTheater>();

  // <li><a href="/theater/13/130301/3035/">TOHOシネマズ 渋谷</a> （16）</li>
  $(`a[href^="/theater/${urlCode}/"]`).each((_, el) => {
    const link = $(el);
    const href = link.attr("href") || "";
    const id = theaterIdFromPath(href);
    if (!id || theaters.has(href)) return;
    const name = link.text().trim();
    if (!name) return;
    const count = link.parent().text().normalize("NFKC").match(MOVIE_COUNT);
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

// ── 上映スケジュール ─────────────────────────────────────
//
// 映画館ページは作品ごとの <section id="m{作品ID}"> の中に、字幕・吹替などの
// 版ごとの .movie-schedule があり、その中の <td data-date="YYYYMMDD"> に
// その日の上映回が並んでいる。

const SCHEDULE = {
  movieSection: "section[id^='m']",
  movieTitleLink: "h2 a",
  poster: "img",
  /** <p class="data"><span>3月20日公開</span><span>156分</span>... */
  movieDataSpans: "p.data span",
  movieData: ".data",
  versionBlock: ".movie-schedule",
  dayCell: "td[data-date]",
} as const;

const POSTER_PATH = /\/images\/movie\/\d+\/photo\/[^/]+\/\d+\.jpg/;
const DATE_KEY = /^\d{8}$/;

/** 版のブロックに付くクラス → 言語（どちらもなければ指定なし） */
const LANGUAGE_CLASSES: [className: string, language: string][] = [
  ["type-subtitled", "字幕版"],
  ["type-dubbed", "日本語吹替"],
];

/** 上映回の種類ごとのセレクタと、上映に付け足す情報 */
const SLOT_KINDS: {
  selector: string;
  idSuffix: string;
  fields: (href: string | undefined) => Partial<Screening>;
}[] = [
  // 購入可能な上映（eiga.com経由のチケット販売）
  { selector: "a.btn[class*='ticket']", idSuffix: "", fields: (href) => ({ ticketUrl: href, booking: "ticket" }) },
  // 販売終了（満席 or 上映開始済み）
  { selector: "span.btn.off", idSuffix: "-off", fields: () => ({ availableSeats: 0, totalSeats: 1 }) },
  // Some chains (e.g. AEON Cinema) don't sell through eiga.com at all —
  // they just link out to the theater's own official booking site.
  { selector: "a.official", idSuffix: "-official", fields: (href) => ({ ticketUrl: href, booking: "official" }) },
];

interface Movie {
  id: string;
  title: string;
  posterPath?: string;
  releaseDate: string; // "YYYY-MM-DD"（並び替え用）
  runtime: number;     // 分。不明なら0
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

/** "20260320" → "2026-03-20" */
function dateKeyToDate(dateKey: string): string {
  return `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6)}`;
}

/** 作品セクションから作品情報を読む（作品IDかタイトルがなければnull） */
function parseMovie(section: Selection): Movie | null {
  const id = section.attr("id")?.replace("m", "");
  const title = section.attr("data-title") || section.find(SCHEDULE.movieTitleLink).first().text().trim();
  if (!id || !title) return null;

  const posterSrc = section.find(SCHEDULE.poster).first().attr("src") || "";
  const dataSpans = section.find(SCHEDULE.movieDataSpans);
  const releaseText = dataSpans.first().text() || section.find(SCHEDULE.movieData).first().text();

  return {
    id,
    title,
    posterPath: posterSrc.match(POSTER_PATH)?.[0],
    releaseDate: parseReleaseDate(releaseText),
    runtime: parseRuntime(dataSpans.eq(1).text() || ""),
  };
}

/** 版のブロックの言語（字幕版 / 日本語吹替 / 指定なし） */
function parseLanguage(versionBlock: Selection): string | undefined {
  const typeEl = versionBlock.find(LANGUAGE_CLASSES.map(([cls]) => `.${cls}`).join(", ")).first();
  return LANGUAGE_CLASSES.find(([cls]) => typeEl.hasClass(cls))?.[1];
}

/**
 * 上映回1つ分。各スロットは "8:25<small>～10:20</small>" の形
 * （終了時刻はない場合もあり、そのときは上映時間から計算する）。
 */
function parseSlot(
  slot: Selection,
  movie: Movie,
  dateKey: string,
  language: string | undefined,
  kind: (typeof SLOT_KINDS)[number]
): Screening | null {
  const startTime = slot.clone().children("small").remove().end().text().trim();
  if (!startTime) return null;
  const endRaw = slot.find("small").text().replace("～", "").trim();
  return {
    id: `eiga-${movie.id}-${dateKey}-${startTime.replace(":", "")}${kind.idSuffix}`,
    movieId: Number(movie.id),
    movieTitle: movie.title,
    posterPath: movie.posterPath,
    startTime,
    endTime: endRaw || addMinutes(startTime, movie.runtime),
    screen: "",
    language,
    format: "2D",
    isPast: isPastJst(dateKeyToDate(dateKey), startTime),
    ...kind.fields(slot.attr("href")),
  };
}

/** 1作品分の上映回を日付ごとに集める（上映回のない日も空の配列で入る） */
function parseMovieScreenings($: CheerioAPI, section: Selection, movie: Movie): Map<string, Screening[]> {
  const screeningsByDate = new Map<string, Screening[]>();

  section.find(SCHEDULE.versionBlock).each((_, blockEl) => {
    const block = $(blockEl);
    const language = parseLanguage(block);

    block.find(SCHEDULE.dayCell).each((_, cellEl) => {
      const cell = $(cellEl);
      const dateKey = cell.attr("data-date") || "";
      if (!DATE_KEY.test(dateKey)) return;
      const date = dateKeyToDate(dateKey);
      const list = screeningsByDate.get(date) ?? [];
      screeningsByDate.set(date, list);

      for (const kind of SLOT_KINDS) {
        cell.find(kind.selector).each((_, slotEl) => {
          const screening = parseSlot($(slotEl), movie, dateKey, language, kind);
          if (screening) list.push(screening);
        });
      }
    });
  });

  return screeningsByDate;
}

/** eiga.comの映画館ページから、載っている全日付のスケジュールをまとめてパース */
export async function scrapeSchedules(theaterPath: string): Promise<TheaterSchedules> {
  const $ = await fetchPage(theaterPath);

  // 日付ごとに、作品単位の上映回と公開日を集める
  const groupsByDate = new Map<string, { releaseDate: string; screenings: Screening[] }[]>();

  $(SCHEDULE.movieSection).each((_, sectionEl) => {
    const section = $(sectionEl);
    const movie = parseMovie(section);
    if (!movie) return;

    for (const [date, screenings] of parseMovieScreenings($, section, movie)) {
      const groups = groupsByDate.get(date) ?? [];
      groupsByDate.set(date, groups);
      if (screenings.length > 0) groups.push({ releaseDate: movie.releaseDate, screenings });
    }
  });

  // 日付は昇順。各日付の中は公開日の新しい作品から並べ、作品内は開始時刻順
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
