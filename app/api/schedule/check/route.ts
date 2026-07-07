import { NextRequest, NextResponse } from "next/server";
import {
  getPrefCodeFromAddress,
  getPrefCodeFromCoords,
  getTheatersByPref,
  scrapeSchedule,
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
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const cinemas: CinemaInput[] = body?.cinemas ?? [];

  if (cinemas.length === 0) return NextResponse.json({ results: [], checkedPrefs: 0 });

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

  // Group by prefecture — fall back to coords if address has no prefecture name
  const byPref = new Map<string, CinemaInput[]>();
  for (const c of cinemas) {
    const code = getPrefCodeFromAddress(c.address) ?? getPrefCodeFromCoords(c.lat, c.lng);
    if (!byPref.has(code)) byPref.set(code, []);
    byPref.get(code)!.push(c);
  }

  // theaterUrl candidates: id → url
  const theaterUrls = new Map<string, string>();
  let checkedPrefs = 0;

  // Step 1: find theater URLs (sequential per prefecture)
  for (const [prefCode, group] of byPref.entries()) {
    try {
      const theaters = await getTheatersByPref(prefCode);
      if (theaters.length === 0) continue;
      checkedPrefs++;
      for (const cinema of group) {
        const best = theaters
          .map((t) => ({ url: t.url, score: similarity(cinema.name, t.name) }))
          .reduce((a, b) => (a.score >= b.score ? a : b));
        if (best.score >= 0.4) theaterUrls.set(cinema.id, best.url);
      }
    } catch {
      // prefecture fetch failed — skip
    }
  }

  if (checkedPrefs === 0) {
    return NextResponse.json({ results: [], checkedPrefs: 0 });
  }

  // Step 2: check today's screenings in parallel for matched cinemas.
  // `confirmed` = we actually scraped the theater page successfully (so a
  // `found: false` means "confirmed no screenings today", not "unknown").
  const found = new Set<string>();
  const confirmed = new Set<string>();
  await Promise.all(
    [...theaterUrls.entries()].map(async ([id, url]) => {
      try {
        const screenings = await scrapeSchedule(url, today);
        confirmed.add(id);
        if (screenings.length > 0) found.add(id);
      } catch {
        // scrape failed — unknown, don't mark as confirmed-absent
      }
    })
  );

  return NextResponse.json({
    results: cinemas.map((c) => ({
      id: c.id,
      found: found.has(c.id),
      // false only when we positively confirmed this cinema has no screenings today;
      // unmatched/unscraped cinemas stay unknown so callers don't hide them incorrectly
      confirmedAbsent: confirmed.has(c.id) && !found.has(c.id),
    })),
    checkedPrefs,
  });
}
