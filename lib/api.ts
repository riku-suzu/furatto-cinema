// Client-side wrappers around our own API routes.

import { Cinema, Coordinates, NearbyScreening, TheaterSchedules } from "@/types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function coordsParams(coords: Coordinates, extra: Record<string, string> = {}): URLSearchParams {
  return new URLSearchParams({ lat: String(coords.lat), lng: String(coords.lng), ...extra });
}

/** 周辺のeiga.com掲載映画館（近い順） */
export async function fetchNearbyCinemas(coords: Coordinates, radiusMeters: number): Promise<Cinema[]> {
  const data = await getJson<{ cinemas: Cinema[] }>(
    `/api/cinemas/nearby?${coordsParams(coords, { radius: String(radiusMeters) })}`
  );
  return data.cinemas;
}

/** 近隣映画館のこれから始まる購入可能な上映（開始時刻順） */
export async function fetchNearbyScreenings(coords: Coordinates): Promise<NearbyScreening[]> {
  const data = await getJson<{ screenings: NearbyScreening[] }>(`/api/schedule/nearby?${coordsParams(coords)}`);
  return data.screenings;
}

/** 映画館1件（idはeiga.comの館ID。旧形式のidなら新しいidの映画館が返る） */
export async function fetchCinema(id: string): Promise<Cinema> {
  const data = await getJson<{ cinema: Cinema }>(`/api/cinemas/${encodeURIComponent(id)}`);
  return data.cinema;
}

/** 1館分の、eiga.comに載っている全日付のスケジュール */
export async function fetchSchedules(cinemaId: string): Promise<TheaterSchedules> {
  return getJson(`/api/schedule?${new URLSearchParams({ id: cinemaId })}`);
}
