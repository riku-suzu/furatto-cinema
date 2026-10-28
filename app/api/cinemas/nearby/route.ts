import { NextRequest, NextResponse } from "next/server";
import { findNearbyTheaters, toPublicCinema } from "@/lib/theaterDirectory";
import { parseCoords } from "@/lib/geo";
import { errorMessage, jsonError } from "@/lib/http";
import { CINEMA_RADII_METERS } from "@/lib/constants";

export const preferredRegion = "hnd1"; // Tokyo — eiga.com requires JP IP
export const maxDuration = 30;

const MAX_RADIUS = Math.max(...CINEMA_RADII_METERS);

// GET /api/cinemas/nearby?lat=&lng=&radius=
// 周辺の映画館のうち、eiga.comに上映作品が載っているものだけを近い順に返す。
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const coords = parseCoords(searchParams);
  if (!coords) return jsonError("lat/lng is required", 400);
  const radius = Math.min(Number(searchParams.get("radius")) || CINEMA_RADII_METERS[0], MAX_RADIUS);

  try {
    const theaters = await findNearbyTheaters(coords, radius);
    return NextResponse.json({ cinemas: theaters.map(toPublicCinema) });
  } catch (err) {
    return jsonError(errorMessage(err, "映画館の取得に失敗しました"), 502);
  }
}
