import * as cheerio from "cheerio";
import { Screening } from "@/types";
import { addMinutes, compareTime, isPastJst } from "@/lib/time";

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

/** 都道府県コード → 都道府県名 */
export const PREF_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(PREF_CODE_MAP).map(([name, code]) => [code, name])
);

/** 住所文字列から都道府県コードを抽出 */
export function getPrefCodeFromAddress(address: string): string | null {
  for (const [pref, code] of Object.entries(PREF_CODE_MAP)) {
    if (address.includes(pref)) return code;
  }
  return null;
}

// 各都道府県の代表座標（重心付近）
const PREF_CENTROIDS: [string, number, number][] = [
  ["01",43.06,141.35],["02",40.82,140.74],["03",39.70,141.15],["04",38.27,140.87],
  ["05",39.72,140.10],["06",38.24,140.36],["07",37.75,140.47],["08",36.34,140.45],
  ["09",36.57,139.88],["10",36.39,139.06],["11",35.86,139.65],["12",35.61,140.12],
  ["13",35.69,139.69],["14",35.45,139.64],["15",37.90,139.02],["16",36.70,137.21],
  ["17",36.59,136.63],["18",36.07,136.22],["19",35.66,138.57],["20",36.65,138.18],
  ["21",35.39,136.72],["22",34.98,138.38],["23",35.18,136.91],["24",34.73,136.51],
  ["25",35.00,135.87],["26",35.02,135.75],["27",34.69,135.50],["28",34.69,135.19],
  ["29",34.69,135.83],["30",34.23,135.17],["31",35.50,134.24],["32",35.47,133.05],
  ["33",34.66,133.93],["34",34.40,132.46],["35",34.19,131.47],["36",34.07,134.56],
  ["37",34.34,134.04],["38",33.84,132.77],["39",33.56,133.53],["40",33.61,130.42],
  ["41",33.25,130.30],["42",32.74,129.87],["43",32.79,130.74],["44",33.24,131.61],
  ["45",31.91,131.42],["46",31.56,130.56],["47",26.21,127.68],
];

/** 緯度経度から近い順にn件の都道府県コードを返す（住所に都道府県名がない場合のフォールバック） */
export function getNearbyPrefCodes(lat: number, lng: number, n: number): string[] {
  return PREF_CENTROIDS
    .map(([code, cLat, cLng]) => ({ code, d: Math.hypot(lat - cLat, lng - cLng) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((e) => e.code);
}

// 英語チェーン名 → eiga.com表記への正規化マップ
const CHAIN_ALIASES: [RegExp, string][] = [
  [/\baeon\s*cinema\b/i, "イオンシネマ"],
  [/\b109\s*cinemas?\b/i, "109シネマズ"],
  [/\btoho\s*cinemas?\b/i, "TOHOシネマズ"],
  [/\bunited\s*cinemas?\b/i, "ユナイテッドシネマ"],
  [/\bmovix\b/i, "ムービックス"],
  [/\bcine\s*citta\b/i, "チネチッタ"],
  [/\bkino\s*cinema\b/i, "キノシネマ"],
];

// 「シネマ」「シアター」などはほぼ全館に含まれるので、比較前に取り除いて
// 館名の固有部分（地名・ブランド名）だけで比べる。残すと "Cinema 77" と
// "CINEMA NEKO" のような無関係な館同士が高スコアになってしまう。
const GENERIC_WORDS = /シネマズ|シネマ|シアター|cinemas?|theat(?:er|re)s?|映画館|劇場|スクリーン/gi;

/** 比較用に名前を正規化: 全角→半角、アクセント除去、英語チェーン名→日本語、汎用語・記号除去 */
function normalizeName(name: string, keepGeneric = false): string {
  let s = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // "cinéma" → "cinema"
    .normalize("NFKC");                // "１０９" → "109"
  for (const [pattern, ja] of CHAIN_ALIASES) s = s.replace(pattern, ja);
  if (!keepGeneric) s = s.replace(GENERIC_WORDS, "");
  return s.replace(/[\s・()「」【】\-－'’&]/g, "").toLowerCase();
}

/**
 * 映画館名の類似度（0〜1強）。汎用語を除いた固有部分で比べ、完全一致1、包含0.9、
 * それ以外はbigramのDice係数。同点を崩すため、汎用語込みの一致度を小さく加点する
 * （商業施設「なんばパークス」より「なんばパークスシネマ」を優先させる）。
 */
export function similarity(a: string, b: string): number {
  const core = diceSimilarity(normalizeName(a), normalizeName(b));
  if (core === 0) return 0;
  return core + 0.01 * diceSimilarity(normalizeName(a, true), normalizeName(b, true));
}

function diceSimilarity(na: string, nb: string): number {
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const bigrams = (s: string) => new Set(Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2)));
  const sa = bigrams(na);
  const sb = bigrams(nb);
  if (sa.size === 0 || sb.size === 0) return 0;
  const intersection = [...sa].filter((x) => sb.has(x)).length;
  return (2 * intersection) / (sa.size + sb.size);
}

export interface EigaTheater {
  id: string;         // e.g. "13-130301-3035"（URLの3セグメントを繋いだもの）
  name: string;
  url: string;        // e.g. "/theater/13/130301/3035/"
  prefCode: string;   // "13"
  movieCount: number; // 上映中の作品数（一覧の「（16）」）
}

const THEATER_PATH = /^\/theater\/(\d+)\/(\d+)\/(\d+)\/$/;
const THEATER_ID = /^(\d{1,2})-(\d+)-(\d+)$/;

/** "13-130301-3035" → "/theater/13/130301/3035/"（形式が不正ならnull） */
export function theaterPathFromId(id: string): string | null {
  const m = id.match(THEATER_ID);
  return m ? `/theater/${Number(m[1])}/${m[2]}/${m[3]}/` : null;
}

/** これ未満の類似度は別の映画館とみなす */
const MATCH_THRESHOLD = 0.4;

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
    const m = href.match(THEATER_PATH);
    if (!m || theaters.has(href)) return;
    const name = $(el).text().trim();
    if (!name) return;
    const count = $(el).parent().text().normalize("NFKC").match(/\((\d+)\)\s*$/);
    theaters.set(href, {
      id: `${m[1]}-${m[2]}-${m[3]}`,
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
  const prefCode = id.split("-")[0].padStart(2, "0");
  const theaters = await getTheatersByPref(prefCode);
  return theaters.find((t) => t.url === path) ?? null;
}

/** 名前が最も近いeiga.comの映画館を返す（閾値未満ならnull） */
export async function findTheaterByName(cinemaName: string, prefCode: string): Promise<EigaTheater | null> {
  const theaters = await getTheatersByPref(prefCode);
  let best: EigaTheater | null = null;
  let bestScore = -1;
  for (const t of theaters) {
    const score = similarity(cinemaName, t.name);
    if (score > bestScore) {
      best = t;
      bestScore = score;
    }
  }
  return bestScore >= MATCH_THRESHOLD ? best : null;
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

/** eiga.comの映画館ページから指定日のスケジュールをパース */
export async function scrapeSchedule(
  theaterPath: string,
  targetDate: string // "YYYY-MM-DD"
): Promise<Screening[]> {
  const dateKey = targetDate.replace(/-/g, ""); // "YYYYMMDD"
  const html = await fetchHtml(`${EIGA_BASE}${theaterPath}`);
  const $ = cheerio.load(html);

  // 映画ごとにscreeningsと公開日を収集
  const movieGroups: Array<{ releaseDate: string; screenings: Screening[] }> = [];

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

    const movieScreenings: Screening[] = [];

    $(section).find(".movie-schedule").each((_, schedBlock) => {
      const typeEl = $(schedBlock).find(".type-subtitled, .type-dubbed").first();
      const language = typeEl.hasClass("type-subtitled")
        ? "字幕版"
        : typeEl.hasClass("type-dubbed")
        ? "日本語吹替"
        : undefined;

      const td = $(schedBlock).find(`td[data-date="${dateKey}"]`);
      if (!td.length) return;

      // 各スロットは "8:25<small>～10:20</small>" の形（終了時刻はない場合もある）
      const addScreening = (slot: Parameters<typeof $>[0], idSuffix: string, fields: Partial<Screening>) => {
        const el = $(slot);
        const startTime = el.clone().children("small").remove().end().text().trim();
        if (!startTime) return;
        const endRaw = el.find("small").text().replace("～", "").trim();
        movieScreenings.push({
          id: `eiga-${movieId}-${dateKey}-${startTime.replace(":", "")}${idSuffix}`,
          movieId: Number(movieId),
          movieTitle,
          posterPath,
          startTime,
          endTime: endRaw || addMinutes(startTime, runtime),
          screen: "",
          language,
          format: "2D",
          isPast: isPastJst(targetDate, startTime),
          ...fields,
        });
      };

      // 購入可能な上映（eiga.com経由のチケット販売）
      td.find("a.btn[class*='ticket']").each((_, slot) => {
        addScreening(slot, "", { ticketUrl: $(slot).attr("href") });
      });

      // 販売終了（満席 or 上映開始済み）
      td.find("span.btn.off").each((_, slot) => {
        addScreening(slot, "-off", { availableSeats: 0, totalSeats: 1 });
      });

      // Some chains (e.g. AEON Cinema) don't sell through eiga.com at all —
      // they just link out to the theater's own official booking site.
      td.find("a.official").each((_, slot) => {
        addScreening(slot, "-official", { ticketUrl: $(slot).attr("href") });
      });
    });

    if (movieScreenings.length > 0) {
      movieGroups.push({ releaseDate, screenings: movieScreenings });
    }
  });

  // 公開日の新しい順（降順）にソートしてフラット化、各映画内は上映時間順
  movieGroups.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  return movieGroups.flatMap((g) =>
    g.screenings.sort((a, b) => compareTime(a.startTime, b.startTime))
  );
}
