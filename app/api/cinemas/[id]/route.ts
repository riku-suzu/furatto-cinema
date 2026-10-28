import { NextRequest, NextResponse } from "next/server";
import { getTheaterCinema, toPublicCinema } from "@/lib/theaterDirectory";
import { jsonError } from "@/lib/http";

export const preferredRegion = "hnd1"; // Tokyo — eiga.com requires JP IP

// GET /api/cinemas/:id  — idはeiga.comの館ID（旧形式のGoogle place_idも受け付ける）
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/cinemas/[id]">) {
  const { id } = await ctx.params;
  try {
    const theater = await getTheaterCinema(decodeURIComponent(id));
    if (!theater) return jsonError("映画館が見つかりませんでした", 404);
    return NextResponse.json({ cinema: toPublicCinema(theater) });
  } catch {
    return jsonError("映画館の取得に失敗しました", 502);
  }
}
