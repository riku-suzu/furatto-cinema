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

/** 緯度経度から最近傍の都道府県コードを返す（vicinityに都道府県名がない場合のフォールバック） */
export function getPrefCodeFromCoords(lat: number, lng: number): string {
  let best = PREF_CENTROIDS[0];
  let minDist = Infinity;
  for (const entry of PREF_CENTROIDS) {
    const d = Math.hypot(lat - entry[1], lng - entry[2]);
    if (d < minDist) { minDist = d; best = entry; }
  }
  return best[0];
}

/** 文字列の類似度スコア（簡易Jaccard） */
export function similarity(a: string, b: string): number {
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

/** "HH:MM" + 分数 → 終了時刻 "HH:MM" */
function calcEndTime(startTime: string, runtimeMin: number): string {
  if (!runtimeMin) return "";
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + runtimeMin;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** "HH:MM" と対象日から、その上映が過去かどうか判定（JST基準） */
function isScreeningPast(targetDate: string, startTime: string): boolean {
  const [h, m] = startTime.split(":").map(Number);
  // JST = UTC+9
  const nowJst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayJst = nowJst.toISOString().slice(0, 10);
  if (targetDate !== todayJst) return false;
  const nowH = nowJst.getUTCHours();
  const nowM = nowJst.getUTCMinutes();
  return h < nowH || (h === nowH && m <= nowM);
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

    const posterMatch = $(section).find("img").first().attr("src") || "";
    const posterPathMatch = posterMatch.match(/\/images\/movie\/\d+\/photo\/[^/]+\/\d+\.jpg/);
    const posterPath = posterPathMatch ? posterPathMatch[0] : undefined;

    // 公開日・上映時間を取得 (<p class="data"><span>3月20日公開</span><span>156分</span>...)
    const dataSpans = $(section).find("p.data span");
    const releaseText = dataSpans.first().text() || $(section).find(".data").first().text();
    const releaseDate = parseReleaseDate(releaseText);
    const runtimeText = dataSpans.eq(1).text() || "";
    const runtime = parseRuntime(runtimeText);

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

      td.find("a.btn[class*='ticket']").each((_, slot) => {
        const el = $(slot);
        const startTime = el.clone().children("small").remove().end().text().trim();
        const endRaw = el.find("small").text().replace("～", "").trim();
        const ticketUrl = el.attr("href");
        if (!startTime) return;

        movieScreenings.push({
          id: `eiga-${movieId}-${dateKey}-${startTime.replace(":", "")}`,
          movieId: Number(movieId),
          movieTitle,
          posterPath,
          startTime,
          endTime: endRaw || calcEndTime(startTime, runtime),
          screen: "",
          language,
          format: "2D",
          ticketUrl,
        } as Screening & { ticketUrl?: string });
      });

      td.find("span.btn.off").each((_, slot) => {
        const startTime = $(slot).text().trim();
        if (!startTime) return;
        const past = isScreeningPast(targetDate, startTime);

        movieScreenings.push({
          id: `eiga-${movieId}-${dateKey}-${startTime.replace(":", "")}-off`,
          movieId: Number(movieId),
          movieTitle,
          posterPath,
          startTime,
          endTime: calcEndTime(startTime, runtime),
          screen: "",
          language,
          format: "2D",
          availableSeats: 0,
          totalSeats: 1,
          isPast: past,
        });
      });
    });

    if (movieScreenings.length > 0) {
      movieGroups.push({ releaseDate, screenings: movieScreenings });
    }
  });

  // 公開日の新しい順（降順）にソートしてフラット化、各映画内は上映時間順
  movieGroups.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  return movieGroups.flatMap((g) =>
    g.screenings.sort((a, b) => a.startTime.localeCompare(b.startTime))
  );
}
