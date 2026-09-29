// Google Places APIのレスポンス型と整形ヘルパー

import { Coordinates } from "@/types";

/** Places APIのレスポンスのうち使うフィールドだけ */
export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry: { location: Coordinates };
  photos?: Array<{ photo_reference: string }>;
}

export function cleanAddress(addr: string): string {
  return addr
    .normalize("NFKC")                  // "３丁目１５" → "3丁目15"
    .replace(/^日本[、,\s]*/u, "")      // 先頭の「日本」を除去（"日本、〒160-0022 東京都…"）
    .replace(/^〒\d{3}-\d{4}\s*/u, "");  // 郵便番号を除去
}

export function photoUrl(place: PlaceResult, maxWidth = 400): string | undefined {
  const ref = place.photos?.[0]?.photo_reference;
  return ref ? `/api/places/photo?maxwidth=${maxWidth}&photoreference=${encodeURIComponent(ref)}` : undefined;
}
