import { NextRequest, NextResponse } from "next/server";
import { getPrefCodeFromAddress, getTheatersByPref, similarity } from "@/lib/eigaCom";

export const preferredRegion = "hnd1"; // Tokyo — eiga.com requires JP IP
export const maxDuration = 30;

interface CinemaInput {
  id: string;
  name: string;
  address: string;
}

// POST /api/schedule/check  body: { cinemas: CinemaInput[] }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const cinemas: CinemaInput[] = body?.cinemas ?? [];

  if (cinemas.length === 0) return NextResponse.json({ results: [], checkedPrefs: 0 });

  // Group by prefecture to minimise eiga.com requests
  const byPref = new Map<string, CinemaInput[]>();
  for (const c of cinemas) {
    const code = getPrefCodeFromAddress(c.address);
    if (!code) continue;
    if (!byPref.has(code)) byPref.set(code, []);
    byPref.get(code)!.push(c);
  }

  const found = new Set<string>();
  let checkedPrefs = 0;
  const debugLog: string[] = [];

  // Sequential to avoid rate-limiting from eiga.com
  for (const [prefCode, group] of byPref.entries()) {
    try {
      const theaters = await getTheatersByPref(prefCode);
      if (theaters.length === 0) {
        debugLog.push(`pref ${prefCode}: fetched OK but 0 theaters parsed`);
        continue;
      }
      checkedPrefs++;
      debugLog.push(`pref ${prefCode}: ${theaters.length} theaters found`);
      for (const cinema of group) {
        const best = theaters
          .map((t) => similarity(cinema.name, t.name))
          .reduce((a, b) => Math.max(a, b), 0);
        debugLog.push(`  ${cinema.name} → best score ${best.toFixed(2)}`);
        if (best >= 0.4) found.add(cinema.id);
      }
    } catch (e) {
      debugLog.push(`pref ${prefCode}: ERROR ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    results: cinemas.map((c) => ({ id: c.id, found: found.has(c.id) })),
    checkedPrefs,
    debug: debugLog,
  });
}
