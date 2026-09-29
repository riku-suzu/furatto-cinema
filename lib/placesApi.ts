// Server-only helpers for calling the Google Places API with our key.
import "server-only";

import { PlaceResult } from "@/lib/places";

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

// 映画館の場所・写真はほぼ変わらないので長めにキャッシュする（Places APIの課金も抑えられる）
const PLACE_CACHE_SECONDS = 60 * 60 * 24 * 30;

export function placesUrl(
  endpoint: "findplacefromtext/json" | "details/json" | "photo",
  params: Record<string, string> | URLSearchParams
): string {
  const p = new URLSearchParams(params);
  p.set("key", API_KEY);
  return `${PLACES_BASE}/${endpoint}?${p}`;
}

async function getPlacesJson(url: string) {
  const res = await fetch(url, { next: { revalidate: PLACE_CACHE_SECONDS } });
  if (!res.ok) throw new Error(`Places API HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API ${data.status}`);
  }
  return data;
}

const FIELDS = "place_id,name,formatted_address,geometry,rating,photos";

/** テキスト（例: "TOHOシネマズ 新宿 東京都"）から場所を1件引く */
export async function findPlace(query: string): Promise<PlaceResult | null> {
  const data = await getPlacesJson(
    placesUrl("findplacefromtext/json", { input: query, inputtype: "textquery", fields: FIELDS, language: "ja" })
  );
  return data.candidates?.[0] ?? null;
}

/** place_idから場所を引く（旧形式のお気に入りの移行用） */
export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  const data = await getPlacesJson(
    placesUrl("details/json", { place_id: placeId, fields: FIELDS, language: "ja" })
  );
  return data.result ?? null;
}
