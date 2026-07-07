import { NextRequest, NextResponse } from "next/server";
import {
  getPrefCodeFromAddress,
  getPrefCodeFromCoords,
  getTheatersByPref,
  scrapeSchedule,
  similarity,
} from "@/lib/eigaCom";
import { Cinema, NearbyScreening } from "@/types";

export const preferredRegion = "hnd1"; // Tokyo — eiga.com requires JP IP
export const maxDuration = 30;

// POST /api/schedule/nearby  body: { cinemas: Cinema[] }
// 近隣の映画館をまとめてスクレイピングし、これから始まる購入可能な上映を
// 開始時刻の早い順にフラットなリストで返す。
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const cinemas: Cinema[] = body?.cinemas ?? [];

  if (cinemas.length === 0) return NextResponse.json({ screenings: [] });

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

  // 都道府県ごとにグループ化（住所から特定できない場合は座標から推定）
  const byPref = new Map<string, Cinema[]>();
  for (const c of cinemas) {
    const code = getPrefCodeFromAddress(c.address) ?? getPrefCodeFromCoords(c.lat, c.lng);
    if (!byPref.has(code)) byPref.set(code, []);
    byPref.get(code)!.push(c);
  }

  const cinemaByEigaId = new Map<string, Cinema>();
  const theaterUrls = new Map<string, string>();

  for (const [prefCode, group] of byPref.entries()) {
    try {
      const theaters = await getTheatersByPref(prefCode);
      if (theaters.length === 0) continue;
      for (const cinema of group) {
        const best = theaters
          .map((t) => ({ url: t.url, score: similarity(cinema.name, t.name) }))
          .reduce((a, b) => (a.score >= b.score ? a : b));
        if (best.score >= 0.4) {
          theaterUrls.set(cinema.id, best.url);
          cinemaByEigaId.set(cinema.id, cinema);
        }
      }
    } catch {
      // prefecture fetch failed — skip
    }
  }

  const results = await Promise.all(
    [...theaterUrls.entries()].map(async ([id, url]) => {
      try {
        const screenings = await scrapeSchedule(url, today);
        const cinema = cinemaByEigaId.get(id)!;
        return screenings
          .filter((s) => !!s.ticketUrl && !s.isPast && s.availableSeats !== 0)
          .map((s): NearbyScreening => ({ ...s, cinema }));
      } catch {
        return [];
      }
    })
  );

  const flat = results.flat();
  flat.sort((a, b) => {
    const t = a.startTime.padStart(5, "0").localeCompare(b.startTime.padStart(5, "0"));
    if (t !== 0) return t;
    return (a.cinema.distance ?? 0) - (b.cinema.distance ?? 0);
  });

  return NextResponse.json({ screenings: flat.slice(0, 50) });
}
