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

  return new NextResponse(await res.arrayBuffer(), {
    headers: {
      "Content-Type": res.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
