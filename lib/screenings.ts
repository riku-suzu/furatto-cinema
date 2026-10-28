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
