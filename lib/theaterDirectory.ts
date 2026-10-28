import "server-only";

import { Cinema, Coordinates } from "@/types";
import { EIGA_BASE, EigaTheater, findTheaterByName, getTheaterById, getTheatersByPref } from "@/lib/eigaCom";
import { PREF_NAMES, getNearbyPrefCodes, getPrefCodeFromAddress } from "@/lib/prefectures";
import { findPlace, getPlaceDetails } from "@/lib/placesApi";
import { PlaceResult, cleanAddress, photoUrl } from "@/lib/places";
import { calculateDistance } from "@/lib/geo";

// 映画館は「eiga.comに載っていて上映作品がある館」だけを扱う。
// eiga.comには座標がないので、場所・写真はGoogle Placesから名前で引いて補う。

/** eiga.comの映画館ページと対応付いた映画館 */
export interface TrackedCinema extends Cinema {
  eigaPath: string; // e.g. "/theater/13/130201/3263/"
}

// 県境付近でも取りこぼさないよう、現在地から近い数県の一覧をまとめて見る
const NEARBY_PREF_COUNT = 3;
// Places APIへの同時リクエスト数（初回のキャッシュ作成時に一気に叩かないように）
const PLACE_LOOKUP_CONCURRENCY = 12;

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    })
  );
  return results;
}

/** eiga.comの館をGoogle上の場所に解決する。別の県の場所が返ってきたら誤りとみなす */
async function locateTheater(theater: EigaTheater): Promise<PlaceResult | null> {
  const prefName = PREF_NAMES[theater.prefCode];
  try {
    const place = await findPlace(`${theater.name} ${prefName}`);
    if (!place || !cleanAddress(place.formatted_address || "").includes(prefName)) return null;
    return place;
  } catch {
    return null;
  }
}

function toTrackedCinema(theater: EigaTheater, place: PlaceResult): TrackedCinema {
  return {
    id: theater.id,
    name: theater.name,
    address: cleanAddress(place.formatted_address || ""),
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    photoUrl: photoUrl(place),
    movieCount: theater.movieCount,
    eigaPath: theater.url,
    eigaUrl: `${EIGA_BASE}${theater.url}`,
  };
}

/**
 * 現在地から半径radiusMeters以内で、eiga.comに上映作品が載っている映画館を近い順に返す。
 * eiga.comに一覧を1県も取得できなかったら（サイト障害など）例外を投げる。
 */
export async function findNearbyTheaters(
  coords: Coordinates,
  radiusMeters: number
): Promise<TrackedCinema[]> {
  const prefCodes = getNearbyPrefCodes(coords.lat, coords.lng, NEARBY_PREF_COUNT);
  const lists = await Promise.all(prefCodes.map((code) => getTheatersByPref(code).catch(() => null)));
  if (lists.every((l) => l === null)) {
    throw new Error("eiga.comの映画館一覧を取得できませんでした");
  }

  const showing = lists.flatMap((l) => l ?? []).filter((t) => t.movieCount > 0);
  const places = await mapLimit(showing, PLACE_LOOKUP_CONCURRENCY, locateTheater);

  const radiusKm = radiusMeters / 1000;
  return showing
    .flatMap((theater, i) => {
      const place = places[i];
      if (!place) return [];
      const cinema = toTrackedCinema(theater, place);
      return [{ ...cinema, distance: calculateDistance(coords, cinema) }];
    })
    .filter((c) => c.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

// Google Placesのplace_id（旧バージョンのお気に入り・URL）
const LEGACY_PLACE_ID = /^[A-Za-z0-9_-]{20,}$/;

/**
 * idから映画館を引く。idはeiga.comの館ID（"13-130201-3263"）。
 * 旧バージョンのGoogle place_idが来た場合は名前でeiga.comの館に対応付け直す。
 */
export async function getTheaterCinema(id: string): Promise<TrackedCinema | null> {
  const theater = await getTheaterById(id);
  if (theater) {
    const place = await locateTheater(theater);
    return place ? toTrackedCinema(theater, place) : null;
  }

  if (!LEGACY_PLACE_ID.test(id)) return null;
  const place = await getPlaceDetails(id).catch(() => null);
  const prefCode = place && getPrefCodeFromAddress(cleanAddress(place.formatted_address || ""));
  if (!place || !prefCode) return null;
  const matched = await findTheaterByName(place.name, prefCode);
  return matched ? toTrackedCinema(matched, place) : null;
}
