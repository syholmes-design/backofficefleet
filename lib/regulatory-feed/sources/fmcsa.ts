import { parseRssFeed } from "@/lib/regulatory-feed/normalize";

const FMCSA_RSS_URL = "https://www.fmcsa.dot.gov/newsroom/rss";
const REVALIDATE_SECONDS = 21600;

export async function fetchFmcsaFeedItems() {
  const response = await fetch(FMCSA_RSS_URL, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml, */*",
      "User-Agent": "BackOfficeFleet/1.0 (+https://backofficefleet.com)",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`FMCSA RSS returned ${response.status}`);
  }

  return parseRssFeed(await response.text(), "FMCSA", 5);
}
