import { NextRequest, NextResponse } from "next/server";
import { scrapeSchedules } from "@/lib/eigaCom";
import { theaterPathFromId } from "@/lib/theaterId";
import { jsonError } from "@/lib/http";

export const preferredRegion = "hnd1"; // Tokyo — eiga.com requires JP IP

// GET /api/schedule?id=13-130201-3263
// 1館分の、eiga.comに載っている全日付のスケジュール。
// 日付の切り替えはクライアント側で行うので、ここは1回呼べば済む。
export async function GET(req: NextRequest) {
  const path = theaterPathFromId(req.nextUrl.searchParams.get("id") || "");
  if (!path) return jsonError("id is required", 400);

  try {
    return NextResponse.json(await scrapeSchedules(path));
  } catch {
    return jsonError("スケジュールの取得に失敗しました", 502);
  }
}
