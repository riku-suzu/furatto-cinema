import { NextRequest, NextResponse } from "next/server";

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const params = new URLSearchParams(searchParams.toString());

  // Replace client-side key with server-side key
  params.set("key", API_KEY);

  const res = await fetch(`${PLACES_BASE}?${params}`, {
    next: { revalidate: 300 }, // cache 5 min
  });

  const data = await res.json();
  return NextResponse.json(data);
}
