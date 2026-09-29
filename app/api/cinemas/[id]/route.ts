import { NextRequest, NextResponse } from "next/server";
import { getTheaterCinema } from "@/lib/theaterDirectory";

export const preferredRegion = "hnd1"; // Tokyo — eiga.com requires JP IP

// GET /api/cinemas/:id  — idはeiga.comの館ID（旧形式のGoogle place_idも受け付ける）
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/cinemas/[id]">) {
  const { id } = await ctx.params;
  try {
    const theater = await getTheaterCinema(decodeURIComponent(id));
    if (!theater) {
      return NextResponse.json({ error: "映画館が見つかりませんでした" }, { status: 404 });
    }
    const { eigaPath: _, ...cinema } = theater;
    return NextResponse.json({ cinema });
  } catch {
    return NextResponse.json({ error: "映画館の取得に失敗しました" }, { status: 502 });
  }
}
