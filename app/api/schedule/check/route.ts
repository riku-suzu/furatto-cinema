import { NextRequest, NextResponse } from "next/server";
import {
  getPrefCodeFromAddress,
  getPrefCodeFromCoords,
  getTheatersByPref,
  similarity,
} from "@/lib/eigaCom";

export const preferredRegion = "hnd1"; // Tokyo — eiga.com requires JP IP
export const maxDuration = 30;

interface CinemaInput {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

// POST /api/schedule/check  body: { cinemas: CinemaInput[] }
// Reports which of the given (Google Places-sourced) cinemas are actually
// listed on eiga.com at all — used to filter out places Google tags as
// "movie_theater" that eiga.com doesn't track (indie screening rooms, etc).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const cinemas: CinemaInput[] = body?.cinemas ?? [];

  if (cinemas.length === 0) return NextResponse.json({ results: [], checkedPrefs: 0 });

  // Group by prefecture — fall back to coords if address has no prefecture name
  const byPref = new Map<string, CinemaInput[]>();
  for (const c of cinemas) {
    const code = getPrefCodeFromAddress(c.address) ?? getPrefCodeFromCoords(c.lat, c.lng);
    if (!byPref.has(code)) byPref.set(code, []);
    byPref.get(code)!.push(c);
  }

  const matched = new Set<string>();
  let checkedPrefs = 0;

  for (const [prefCode, group] of byPref.entries()) {
    try {
      const theaters = await getTheatersByPref(prefCode);
      if (theaters.length === 0) continue;
      checkedPrefs++;
      for (const cinema of group) {
        const best = theaters
          .map((t) => ({ score: similarity(cinema.name, t.name) }))
          .reduce((a, b) => (a.score >= b.score ? a : b));
        if (best.score >= 0.4) matched.add(cinema.id);
      }
    } catch {
      // prefecture fetch failed — skip
    }
  }

  if (checkedPrefs === 0) {
    return NextResponse.json({ results: [], checkedPrefs: 0 });
  }

  return NextResponse.json({
    results: cinemas.map((c) => ({ id: c.id, matched: matched.has(c.id) })),
    checkedPrefs,
  });
}
