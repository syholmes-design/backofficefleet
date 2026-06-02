import { parseRssFeed } from "@/lib/regulatory-feed/normalize";

const DOT_RSS_URL = "https://www.transportation.gov/rss";
const REVALIDATE_SECONDS = 21600;

export async function fetchDotFeedItems() {
  const response = await fetch(DOT_RSS_URL, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml, */*",
      "User-Agent": "BackOfficeFleet/1.0 (+https://backofficefleet.com)",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`DOT RSS returned ${response.status}`);
  }

  return parseRssFeed(await response.text(), "DOT", 5);
}
