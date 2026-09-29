import { NextRequest, NextResponse } from "next/server";
import { scrapeSchedule } from "@/lib/eigaCom";
import { findNearbyTheaters } from "@/lib/theaterDirectory";
import { parseCoords } from "@/lib/geo";
import { compareTime, todayJst } from "@/lib/time";
import { NOW_RADIUS_METERS } from "@/lib/constants";
import { NearbyScreening } from "@/types";

export const preferredRegion = "hnd1"; // Tokyo — eiga.com requires JP IP
export const maxDuration = 30;

const MAX_RESULTS = 50;

// GET /api/schedule/nearby?lat=&lng=
// 近隣の映画館をまとめてスクレイピングし、これから始まる購入可能な上映を
// 開始時刻の早い順にフラットなリストで返す。
export async function GET(req: NextRequest) {
  const coords = parseCoords(req.nextUrl.searchParams);
  if (!coords) {
    return NextResponse.json({ error: "lat/lng is required" }, { status: 400 });
  }

  let cinemas;
  try {
    cinemas = await findNearbyTheaters(coords, NOW_RADIUS_METERS);
  } catch (err) {
    const message = err instanceof Error ? err.message : "映画館の取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const today = todayJst();
  const results = await Promise.all(
    cinemas.map(async ({ eigaPath, ...cinema }) => {
      try {
        const screenings = await scrapeSchedule(eigaPath, today);
        return screenings
          .filter((s) => !!s.ticketUrl && !s.isPast && s.availableSeats !== 0)
          .map((s): NearbyScreening => ({ ...s, cinema }));
      } catch {
        return [];
      }
    })
  );

  const flat = results.flat();
  flat.sort(
    (a, b) =>
      compareTime(a.startTime, b.startTime) ||
      (a.cinema.distance ?? 0) - (b.cinema.distance ?? 0)
  );

  return NextResponse.json({ screenings: flat.slice(0, MAX_RESULTS) });
}
