import { NextRequest, NextResponse } from "next/server";
import { getPrefCodeFromAddress, getTheatersByPref } from "@/lib/eigaCom";
import { similarity } from "@/lib/eigaCom";

interface CinemaInput {
  id: string;
  name: string;
  address: string;
}

// POST /api/schedule/check  body: { cinemas: CinemaInput[] }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const cinemas: CinemaInput[] = body?.cinemas ?? [];

  if (cinemas.length === 0) return NextResponse.json({ results: [] });

  // Group by prefecture to minimise eiga.com requests
  const byPref = new Map<string, CinemaInput[]>();
  for (const c of cinemas) {
    const code = getPrefCodeFromAddress(c.address);
    if (!code) continue;
    if (!byPref.has(code)) byPref.set(code, []);
    byPref.get(code)!.push(c);
  }

  const found = new Set<string>();

  await Promise.all(
    [...byPref.entries()].map(async ([prefCode, group]) => {
      try {
        const theaters = await getTheatersByPref(prefCode);
        for (const cinema of group) {
          const best = theaters
            .map((t) => similarity(cinema.name, t.name))
            .reduce((a, b) => Math.max(a, b), 0);
          if (best >= 0.4) found.add(cinema.id);
        }
      } catch {
        // prefecture fetch failed — keep none from this group
      }
    })
  );

  return NextResponse.json({
    results: cinemas.map((c) => ({ id: c.id, found: found.has(c.id) })),
  });
}
