// 上映（Screening）の判定・まとめ方。サーバーとクライアントの両方で使う。

import { Screening } from "@/types";

/** まだ観られる回か（始まっておらず、満席でもない） */
export function isStillAvailable(s: Screening): boolean {
  return !s.isPast && s.availableSeats !== 0;
}

/** 「今すぐ観れる映画」に出す回か（購入ページへのリンクがあり、まだ観られる） */
export function isBookableNow(s: Screening): boolean {
  return !!s.ticketUrl && isStillAvailable(s);
}
/** キーごとにまとめる（キーも各グループ内も出現順を維持） */
function groupBy<K>(screenings: Screening[], key: (s: Screening) => K): Map<K, Screening[]> {
  const groups = new Map<K, Screening[]>();
  for (const s of screenings) {
    const k = key(s);
    const group = groups.get(k);
    if (group) group.push(s);
    else groups.set(k, [s]);
  }
  return groups;
}

/** 上映を映画ごとにまとめる */
export function groupByMovie(screenings: Screening[]): Screening[][] {
  return [...groupBy(screenings, (s) => s.movieId).values()];
}

/** 上映を言語（字幕版 / 日本語吹替 / 指定なし = ""）ごとにまとめる */
export function groupByLanguage(screenings: Screening[]): Map<string, Screening[]> {
  return groupBy(screenings, (s) => s.language ?? "");
}
