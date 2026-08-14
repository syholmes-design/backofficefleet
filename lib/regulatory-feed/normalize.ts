import type { BofRegulatoryFeedItem } from "@/lib/regulatory-feed-demo";
import {
  classifyRegulatoryCategory,
  classifyRegulatoryUrgency,
  getBofImpactForCategory,
} from "@/lib/regulatory-feed/tag-news-item";

export type RawRegulatoryFeedItem = {
  title: string;
  source: BofRegulatoryFeedItem["source"];
  sourceUrl: string;
  publishedAt?: string;
  summary?: string;
};

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

export function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (entity, key: string) => ENTITY_MAP[key.toLowerCase()] ?? entity);
}

export function stripHtml(value = "") {
  return decodeHtml(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function normalizeDate(value?: string) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeRegulatoryFeedItem(raw: RawRegulatoryFeedItem): BofRegulatoryFeedItem | null {
  const title = stripHtml(raw.title);
  const sourceUrl = raw.sourceUrl?.trim();

  if (!title || !sourceUrl) {
    return null;
  }

  const sourceSummary = stripHtml(raw.summary ?? "");
  const classificationText = `${title} ${sourceSummary} ${raw.source}`;
  const category = classifyRegulatoryCategory(classificationText);

  return {
    id: `${raw.source.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${slugify(title)}`,
    title,
    source: raw.source,
    sourceUrl,
    publishedAt: normalizeDate(raw.publishedAt),
    category,
    urgency: classifyRegulatoryUrgency(classificationText),
    bofImpact: getBofImpactForCategory(category),
    summary:
      truncate(sourceSummary, 180) ||
      `Public ${raw.source} update surfaced for BOF compliance, safety, dispatch, or document-readiness review.`,
  };
}

export function dedupeRegulatoryFeedItems(items: BofRegulatoryFeedItem[]) {
  const seen = new Set<string>();
  const deduped: BofRegulatoryFeedItem[] = [];

  for (const item of items) {
    const key = item.sourceUrl || item.title.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

export function sortRegulatoryFeedItems(items: BofRegulatoryFeedItem[], limit = 10) {
  return [...items]
    .sort((a, b) => {
      const aTime = new Date(`${a.publishedAt}T00:00:00Z`).getTime();
      const bTime = new Date(`${b.publishedAt}T00:00:00Z`).getTime();
      return bTime - aTime;
    })
    .slice(0, limit);
}

function getRssField(itemXml: string, tag: string) {
  const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeHtml(match[1]).trim() : "";
}

export function parseRssFeed(xml: string, source: BofRegulatoryFeedItem["source"], limit = 5) {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return itemMatches
    .slice(0, limit)
    .map((itemXml) =>
      normalizeRegulatoryFeedItem({
        title: getRssField(itemXml, "title"),
        source,
        sourceUrl: getRssField(itemXml, "link"),
        publishedAt: getRssField(itemXml, "pubDate") || getRssField(itemXml, "updated"),
        summary: getRssField(itemXml, "description"),
      }),
    )
    .filter((item): item is BofRegulatoryFeedItem => Boolean(item));
}
