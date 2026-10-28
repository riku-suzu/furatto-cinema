// 画面に出す距離・日付・時間の表記

import { addDays, dateParts, minutesUntilJst, todayJst } from "@/lib/time";

/** 0.35 → "350m", 2.34 → "2.3km" */
export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

/** "2026-09-29" → "今日 9/29" / "明日 9/30" / "木 10/1" */
export function formatDateLabel(date: string): string {
  const { month, day, weekday } = dateParts(date);
  const today = todayJst();
  const prefix = date === today ? "今日" : date === addDays(today, 1) ? "明日" : weekday;
  return `${prefix} ${month}/${day}`;
}

/** 今日の "HH:MM" までの残り時間: "あと12分" / "あと1時間5分" / "あと2時間"（過ぎていればnull） */
export function formatStartsIn(time: string): string | null {
  const min = minutesUntilJst(time);
  if (min < 0) return null;
  if (min < 60) return `あと${min}分`;
  return `あと${Math.floor(min / 60)}時間${min % 60 ? `${min % 60}分` : ""}`;
}
