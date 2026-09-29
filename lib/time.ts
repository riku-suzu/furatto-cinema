// 上映時刻はすべて日本時間で扱う。実行環境（Vercel=UTC、ブラウザ=任意）の
// タイムゾーンに依存しないよう、JSTへのオフセットを明示的に足して計算する。

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function nowJst(): { date: string; minutes: number } {
  const d = new Date(Date.now() + JST_OFFSET_MS);
  return {
    date: d.toISOString().slice(0, 10),
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}

/** 今日の日付（JST）"YYYY-MM-DD" */
export function todayJst(): string {
  return nowJst().date;
}

/** "YYYY-MM-DD" に日数を足す */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** "YYYY-MM-DD" → { month: 3, day: 20, weekday: "金", dayOfWeek: 5 } */
export function dateParts(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return {
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    weekday: WEEKDAYS[d.getUTCDay()],
    dayOfWeek: d.getUTCDay(),
  };
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** "HH:MM" 同士の比較（"9:30" のようなゼロ埋めなしにも対応） */
export function compareTime(a: string, b: string): number {
  return toMinutes(a) - toMinutes(b);
}

/** "HH:MM" + 分数 → "HH:MM"。分数が0なら空文字 */
export function addMinutes(time: string, minutes: number): string {
  if (!minutes) return "";
  const total = toMinutes(time) + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** 指定日・時刻の上映がすでに始まっているか（JST基準） */
export function isPastJst(date: string, time: string): boolean {
  const now = nowJst();
  return date === now.date && toMinutes(time) <= now.minutes;
}

/** 今日（JST）の "HH:MM" まであと何分か（過ぎていれば負） */
export function minutesUntilJst(time: string): number {
  return toMinutes(time) - nowJst().minutes;
}
