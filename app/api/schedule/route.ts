import { NextRequest, NextResponse } from "next/server";
import { scrapeSchedule, theaterPathFromId } from "@/lib/eigaCom";
import { todayJst } from "@/lib/time";

export const preferredRegion = "hnd1"; // Tokyo — eiga.com requires JP IP

// GET /api/schedule?id=13-130201-3263&date=YYYY-MM-DD
// 1館分の指定日のスケジュール
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const path = theaterPathFromId(searchParams.get("id") || "");
  const date = searchParams.get("date") || todayJst();

  if (!path) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  try {
    return NextResponse.json({ screenings: await scrapeSchedule(path, date) });
  } catch {
    return NextResponse.json({ error: "スケジュールの取得に失敗しました" }, { status: 502 });
  }
}
