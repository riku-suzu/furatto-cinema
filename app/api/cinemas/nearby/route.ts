import { NextRequest, NextResponse } from "next/server";
import { findNearbyTheaters } from "@/lib/theaterDirectory";
import { parseCoords } from "@/lib/geo";
import { CINEMA_RADII_METERS } from "@/lib/constants";

export const preferredRegion = "hnd1"; // Tokyo — eiga.com requires JP IP
export const maxDuration = 30;

const MAX_RADIUS = Math.max(...CINEMA_RADII_METERS);

// GET /api/cinemas/nearby?lat=&lng=&radius=
// 周辺の映画館のうち、eiga.comに上映作品が載っているものだけを近い順に返す。
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const coords = parseCoords(searchParams);
  if (!coords) {
    return NextResponse.json({ error: "lat/lng is required" }, { status: 400 });
  }
  const radius = Math.min(Number(searchParams.get("radius")) || CINEMA_RADII_METERS[0], MAX_RADIUS);

  try {
    const theaters = await findNearbyTheaters(coords, radius);
    return NextResponse.json({ cinemas: theaters.map(({ eigaPath: _, ...cinema }) => cinema) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "映画館の取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
