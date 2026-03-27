import { NextRequest, NextResponse } from "next/server";
import { getPrefCodeFromAddress, findTheaterUrl } from "@/lib/eigaCom";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name") || "";
  const address = searchParams.get("address") || "";

  if (!name) return NextResponse.json({ found: false });

  const prefCode = getPrefCodeFromAddress(address);
  if (!prefCode) return NextResponse.json({ found: false });

  try {
    const url = await findTheaterUrl(name, prefCode);
    return NextResponse.json({ found: !!url });
  } catch {
    return NextResponse.json({ found: false });
  }
}
