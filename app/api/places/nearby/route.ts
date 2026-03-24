import { NextRequest, NextResponse } from "next/server";

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

async function fetchPage(params: URLSearchParams): Promise<{ results: unknown[]; next_page_token?: string }> {
  const res = await fetch(`${PLACES_BASE}?${params}`, { next: { revalidate: 300 } });
  return res.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // rankby=distance で距離順に取得（radius は使えないため削除）
  const params = new URLSearchParams({
    location: searchParams.get("location") || "",
    rankby: "distance",       // 距離順 ← これが重要
    type: "movie_theater",
    language: "ja",
    key: API_KEY,
  });

  const allResults: unknown[] = [];

  const first = await fetchPage(params);
  allResults.push(...(first.results || []));

  if (first.next_page_token) {
    await new Promise((r) => setTimeout(r, 2000));
    const p2 = new URLSearchParams({ pagetoken: first.next_page_token, key: API_KEY });
    const second = await fetchPage(p2);
    allResults.push(...(second.results || []));

    if (second.next_page_token) {
      await new Promise((r) => setTimeout(r, 2000));
      const p3 = new URLSearchParams({ pagetoken: second.next_page_token, key: API_KEY });
      const third = await fetchPage(p3);
      allResults.push(...(third.results || []));
    }
  }

  return NextResponse.json({ results: allResults });
}
