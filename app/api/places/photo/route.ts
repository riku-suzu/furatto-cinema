import { NextRequest, NextResponse } from "next/server";
import { placesUrl } from "@/lib/placesApi";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const ref = searchParams.get("photoreference");
  if (!ref) return new NextResponse("Missing photoreference", { status: 400 });

  const url = placesUrl("photo", {
    maxwidth: searchParams.get("maxwidth") || "400",
    photoreference: ref,
  });
  const res = await fetch(url, { redirect: "follow" });
  // Places APIのエラー（キーの制限・無効な参照など）を画像として1日キャッシュさせない
  if (!res.ok) return new NextResponse(null, { status: 502 });

  return new NextResponse(await res.arrayBuffer(), {
    headers: {
      "Content-Type": res.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
