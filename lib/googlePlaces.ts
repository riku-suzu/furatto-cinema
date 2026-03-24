import { Cinema, Coordinates } from "@/types";

function cleanAddress(addr: string): string {
  return addr
    .replace(/^〒\d{3}-\d{4}\s*/u, "")  // 郵便番号を除去
    .replace(/^日本[、,，\s]*/u, "");     // 先頭の「日本」を除去
}

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

  // ホワイトリスト方式: 映画館キーワードを含むものだけ通す
  const CINEMA_KEYWORDS = [
    "シネマ", "映画館", "映画", "シアター", "スクリーン",
    "cinema", "theater", "theatre", "screen",
    "TOHO", "toho", "イオンシネマ", "109シネマ", "ユナイテッドシネマ",
    "ムービックス", "ミッドランドスクエア", "フォーラム", "ピカデリー",
    "バルト", "ヒューマントラスト", "新宿武蔵野", "テアトル",
    "チネチッタ", "チネ", "キノ", "kino", "シネクイント",
  ];

  const results = (data.results || []).filter((place: Record<string, unknown>) => {
    const name = (place.name as string) || "";
    return CINEMA_KEYWORDS.some((kw) =>
      name.toLowerCase().includes(kw.toLowerCase())
    );
  });

  const radiusKm = radiusMeters / 1000;

  return results
    .map((place: Record<string, unknown>) => {
      const geometry = place.geometry as { location: { lat: number; lng: number } };
      const photos = place.photos as Array<{ photo_reference: string }> | undefined;
      const lat = geometry.location.lat;
      const lng = geometry.location.lng;
      return {
        id: place.place_id as string,
        name: place.name as string,
        address: cleanAddress((place.vicinity as string) || ""),
        lat,
        lng,
        distance: calculateDistance(coords.lat, coords.lng, lat, lng),
        rating: place.rating as number | undefined,
        photoUrl: photos?.[0]
          ? getPhotoUrl(photos[0].photo_reference)
          : undefined,
      };
    })
    .filter((c) => (c.distance ?? Infinity) <= radiusKm);
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
    address: cleanAddress(place.formatted_address || ""),
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    rating: place.rating,
    photoUrl: photos?.[0]
      ? getPhotoUrl(photos[0].photo_reference)
      : undefined,
  };
}
