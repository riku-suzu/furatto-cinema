import { NextRequest, NextResponse } from "next/server";
import { scrapeSchedule } from "@/lib/eigaCom";
import { TrackedCinema, findNearbyTheaters, toPublicCinema } from "@/lib/theaterDirectory";
import { parseCoords } from "@/lib/geo";
import { errorMessage, jsonError } from "@/lib/http";
import { isBookableNow } from "@/lib/screenings";
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
  if (!coords) return jsonError("lat/lng is required", 400);

  let theaters: TrackedCinema[];
  try {
    theaters = await findNearbyTheaters(coords, NOW_RADIUS_METERS);
  } catch (err) {
    return jsonError(errorMessage(err, "映画館の取得に失敗しました"), 502);
  }

  const today = todayJst();
  const screenings = (await Promise.all(theaters.map((t) => bookableScreenings(t, today)))).flat();
  screenings.sort(
    (a, b) =>
      compareTime(a.startTime, b.startTime) ||
      (a.cinema.distance ?? 0) - (b.cinema.distance ?? 0)
  );

  return NextResponse.json({ screenings: screenings.slice(0, MAX_RESULTS) });
}

/** 1館分の、指定日のまだ購入できる上映（取得に失敗した館は空） */
async function bookableScreenings(theater: TrackedCinema, date: string): Promise<NearbyScreening[]> {
  const cinema = toPublicCinema(theater);
  try {
    const screenings = await scrapeSchedule(theater.eigaPath, date);
    return screenings.filter(isBookableNow).map((s) => ({ ...s, cinema }));
  } catch {
    return [];
  }
}
