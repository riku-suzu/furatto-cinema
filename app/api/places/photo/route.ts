import { NextRequest, NextResponse } from "next/server";

const PHOTO_BASE = "https://maps.googleapis.com/maps/api/place/photo";
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const ref = searchParams.get("photoreference");
  const maxWidth = searchParams.get("maxwidth") || "400";

  if (!ref) return new NextResponse("Missing photoreference", { status: 400 });

  const url = `${PHOTO_BASE}?maxwidth=${maxWidth}&photoreference=${ref}&key=${API_KEY}`;
  const res = await fetch(url, { redirect: "follow" });

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
