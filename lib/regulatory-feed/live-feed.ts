import {
  bofRegulatoryFeedDemoItems,
  getBofRegulatoryFeedDemoItems,
  type BofRegulatoryFeedItem,
} from "@/lib/regulatory-feed-demo";
import { dedupeRegulatoryFeedItems, sortRegulatoryFeedItems } from "@/lib/regulatory-feed/normalize";
import { fetchDotFeedItems } from "@/lib/regulatory-feed/sources/dot";
import { fetchFederalRegisterFeedItems } from "@/lib/regulatory-feed/sources/federal-register";
import { fetchFmcsaFeedItems } from "@/lib/regulatory-feed/sources/fmcsa";

const FULL_FEED_LIMIT = 10;

function getStaticSourceStrategyItems() {
  return bofRegulatoryFeedDemoItems.filter((item) => item.source === "NHTSA" || item.source === "CSA");
}

async function collectSource(sourceLoader: () => Promise<BofRegulatoryFeedItem[]>) {
  try {
    return await sourceLoader();
  } catch {
    return [];
  }
}

export async function getLiveRegulatoryFeedItems() {
  const sourceResults = await Promise.all([
    collectSource(fetchFmcsaFeedItems),
    collectSource(fetchDotFeedItems),
    collectSource(fetchFederalRegisterFeedItems),
  ]);

  return sourceResults.flat();
}

export async function getRegulatoryFeedItems(limit = FULL_FEED_LIMIT) {
  const liveItems = await getLiveRegulatoryFeedItems();

  if (liveItems.length === 0) {
    return sortRegulatoryFeedItems(dedupeRegulatoryFeedItems(getBofRegulatoryFeedDemoItems()), limit);
  }

  return sortRegulatoryFeedItems(
    dedupeRegulatoryFeedItems([...liveItems, ...getStaticSourceStrategyItems()]),
    limit,
  );
}
