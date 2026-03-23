import { NextRequest, NextResponse } from "next/server";
import { getPrefCodeFromAddress, findTheaterUrl, scrapeSchedule } from "@/lib/eigaCom";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cinemaName = searchParams.get("name") || "";
  const address = searchParams.get("address") || "";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (!cinemaName) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const prefCode = getPrefCodeFromAddress(address);
  if (!prefCode) {
    return NextResponse.json(
      { error: "都道府県を特定できませんでした", screenings: [] },
      { status: 200 }
    );
  }

  try {
    const theaterUrl = await findTheaterUrl(cinemaName, prefCode);
    if (!theaterUrl) {
      return NextResponse.json(
        { error: "映画.comで映画館が見つかりませんでした", screenings: [], eigaUrl: null },
        { status: 200 }
      );
    }

    const screenings = await scrapeSchedule(theaterUrl, date);
    return NextResponse.json({
      screenings,
      eigaUrl: `https://eiga.com${theaterUrl}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "スクレイピングに失敗しました";
    return NextResponse.json({ error: message, screenings: [] }, { status: 200 });
  }
}
