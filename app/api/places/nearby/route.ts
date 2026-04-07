import { NextRequest, NextResponse } from "next/server";

const NEARBY_BASE = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const DETAILS_BASE = "https://maps.googleapis.com/maps/api/place/details/json";
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

const isEnglish = (name: string) => /^[\x00-\x7F\s]+$/.test(name);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const params = new URLSearchParams({
    location: searchParams.get("location") || "",
    rankby: "distance",
    type: "movie_theater",
    language: "ja",
    key: API_KEY,
  });

  const res = await fetch(`${NEARBY_BASE}?${params}`, { next: { revalidate: 300 } });
  const data = await res.json();
  const results: Record<string, unknown>[] = data.results || [];

  // 英語名の映画館だけ並列でDetails APIを叩いて日本語名を取得
  await Promise.all(
    results.map(async (place) => {
      const name = (place.name as string) || "";
      if (!isEnglish(name)) return;
      try {
        const p = new URLSearchParams({
          place_id: place.place_id as string,
          fields: "name",
          language: "ja",
          key: API_KEY,
        });
        const r = await fetch(`${DETAILS_BASE}?${p}`, { next: { revalidate: 3600 } });
        const d = await r.json();
        const jaName = d.result?.name;
        if (jaName && !isEnglish(jaName)) place.name = jaName;
      } catch { /* keep original name */ }
    })
  );

  return NextResponse.json({ results });
}
