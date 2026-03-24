import { Cinema, Coordinates } from "@/types";

export function getPhotoUrl(photoReference: string, maxWidth = 400): string {
  return `/api/places/photo?maxwidth=${maxWidth}&photoreference=${encodeURIComponent(photoReference)}`;
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function searchNearbyCinemas(
  coords: Coordinates,
  radiusMeters = 10000
): Promise<Cinema[]> {
  const params = new URLSearchParams({
    location: `${coords.lat},${coords.lng}`,
    radius: String(radiusMeters),
    type: "movie_theater",
    language: "ja",
  });

  const res = await fetch(`/api/places/nearby?${params}`);
  if (!res.ok) throw new Error("Failed to fetch nearby cinemas");

  const data = await res.json();

  // 映画館以外を除外するキーワード
  const EXCLUDE_KEYWORDS = [
    "美術館", "博物館", "アートセンター", "文化センター", "市民会館",
    "カフェ", "レストラン", "ホテル", "スタジオ", "ギャラリー",
    "図書館", "公民館", "ホール", "劇場", "バー", "居酒屋",
  ];
  const CINEMA_KEYWORDS = [
    "シネマ", "映画", "シアター", "cinema", "theater", "theatre",
    "IMAX", "イオン", "TOHO", "TOHOシネマ", "109", "ユナイテッド",
    "ムービックス", "ミッドランド", "フォーラム", "ピカデリー",
  ];

  const results = (data.results || []).filter((place: Record<string, unknown>) => {
    const name = (place.name as string) || "";
    // 除外キーワードにマッチ かつ 映画館キーワードを含まない場合は除外
    const hasExclude = EXCLUDE_KEYWORDS.some((kw) => name.includes(kw));
    const hasCinema = CINEMA_KEYWORDS.some((kw) =>
      name.toLowerCase().includes(kw.toLowerCase())
    );
    return !hasExclude || hasCinema;
  });

  return results.map((place: Record<string, unknown>) => {
    const geometry = place.geometry as { location: { lat: number; lng: number } };
    const photos = place.photos as Array<{ photo_reference: string }> | undefined;
    const lat = geometry.location.lat;
    const lng = geometry.location.lng;
    return {
      id: place.place_id as string,
      name: place.name as string,
      address: (place.vicinity as string) || "",
      lat,
      lng,
      distance: calculateDistance(coords.lat, coords.lng, lat, lng),
      rating: place.rating as number | undefined,
      photoUrl: photos?.[0]
        ? getPhotoUrl(photos[0].photo_reference)
        : undefined,
    };
  });
}

export async function getCinemaDetails(placeId: string): Promise<Cinema | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "name,formatted_address,geometry,rating,photos,place_id",
    language: "ja",
  });

  const res = await fetch(`/api/places/details?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  const place = data.result;
  if (!place) return null;

  const photos = place.photos as Array<{ photo_reference: string }> | undefined;
  return {
    id: place.place_id,
    name: place.name,
    address: place.formatted_address || "",
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    rating: place.rating,
    photoUrl: photos?.[0]
      ? getPhotoUrl(photos[0].photo_reference)
      : undefined,
  };
}
