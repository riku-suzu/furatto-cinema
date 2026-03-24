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

  const first = await fetchPage(params);
  const allResults: unknown[] = [...(first.results || [])];

  // rankby=distance は距離順なので、1ページ目(最大20件)で通常は十分。
  // next_page_token がある場合のみ2ページ目を取得（最大40件）。3ページ目は取得しない。
  if (first.next_page_token) {
    await new Promise((r) => setTimeout(r, 2000));
    const p2 = new URLSearchParams({ pagetoken: first.next_page_token, key: API_KEY });
    const second = await fetchPage(p2);
    allResults.push(...(second.results || []));
  }

  return NextResponse.json({ results: allResults });
}
