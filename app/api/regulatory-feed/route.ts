import { NextResponse } from "next/server";
import { getRegulatoryFeedItems } from "@/lib/regulatory-feed/live-feed";

export const revalidate = 21600;

export async function GET() {
  const items = await getRegulatoryFeedItems();

  return NextResponse.json(items, {
    headers: {
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
}
