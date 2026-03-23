import { NextRequest, NextResponse } from "next/server";

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place/details/json";
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const params = new URLSearchParams(searchParams.toString());
  params.set("key", API_KEY);

  const res = await fetch(`${PLACES_BASE}?${params}`, {
    next: { revalidate: 3600 }, // cache 1 hour
  });

  const data = await res.json();
  return NextResponse.json(data);
}
