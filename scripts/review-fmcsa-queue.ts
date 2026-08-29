import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { FMCSA_REGULATORY_REVIEW_QUEUE, type FmcsaReviewQueueItem } from "@/lib/fmcsa-regulatory-review-queue";

config({ path: ".env.local" });

const REVIEW_DATE = "2026-08-24";
const ECFR_VERSION = `ecfr-${REVIEW_DATE}`;
const ECFR_URL = `https://www.ecfr.gov/api/versioner/v1/full/${REVIEW_DATE}/title-49.xml`;
const sourceUrl = "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B";
const dryRun = process.argv.includes("--dry-run");
const connectionString = process.env.DATABASE_URL;
let prisma: PrismaClient | undefined;

type ReviewedItem = Omit<FmcsaReviewQueueItem, "reviewStatus"> & {
  reviewStatus: "VERIFIED";
  effectiveDate: null;
  effectiveDateIssue: string;
  currentText: string;
  trainingCoverage: string[];
  trainingRelationship: "PROPOSED_ONLY";
};

function decodeXml(value: string) {
  return value
    .replace(/&#xA7;/gi, "§")
    .replace(/&#x2014;/gi, "—")
    .replace(/&#x2013;/gi, "–")
    .replace(/&#x2019;/gi, "'")
    .replace(/&#x201c;/gi, '"')
    .replace(/&#x201d;/gi, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function textFromXml(value: string) {
  return decodeXml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractSection(partXml: string, section: string) {
  const escaped = section.replace(".", "\\.");
  const match = partXml.match(new RegExp(`<DIV8 N="${escaped}"[^>]*>([\\s\\S]*?)(?=<DIV8 N=|</DIV7>)`));
  if (!match) throw new Error(`Section ${section} was not found in the official eCFR XML`);
  const headingMatch = match[1].match(/<HEAD>([\s\S]*?)<\/HEAD>/);
  const heading = headingMatch ? textFromXml(headingMatch[1]) : "";
  const title = heading.replace(/^§\s*[^ ]+\s+/, "").replace(/\.$/, "").trim();
  const currentText = textFromXml(match[1].replace(/<HEAD>[\s\S]*?<\/HEAD>/, ""));
  return { heading, title, currentText };
}

function trainingCoverage(item: FmcsaReviewQueueItem) {
  const coverage: string[] = [];
  if (["393.100", "393.104", "393.106"].includes(item.section)) coverage.push("fmcsa-cargo-securement", "bof-pretrip-securement");
  if (["395.3", "395.8"].includes(item.section)) coverage.push("bof-hos-coaching");
  return coverage;
}

async function fetchPart(part: string) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(`${ECFR_URL}?part=${encodeURIComponent(part)}`, { headers: { Accept: "application/xml", "User-Agent": "BackOfficeFleet-reviewed-regulatory-ingestion/1.0" } });
    if (response.ok) return response.text();
    if (attempt === 3) throw new Error(`eCFR returned ${response.status} for Part ${part}`);
  }
  throw new Error(`Unable to retrieve Part ${part} from eCFR`);
}

async function buildReviewedItems() {
  const parts = [...new Set(FMCSA_REGULATORY_REVIEW_QUEUE.map((item) => item.cfrPart))];
  const xmlByPart = new Map(await Promise.all(parts.map(async (part) => [part, await fetchPart(part)] as const)));
  return FMCSA_REGULATORY_REVIEW_QUEUE.map((item) => {
    const extracted = extractSection(xmlByPart.get(item.cfrPart)!, item.section);
    const titleMatches = extracted.title.toLowerCase() === item.title.toLowerCase() || item.section === "391.23";
    if (!titleMatches) throw new Error(`Title mismatch for ${item.citation}: queue=${item.title}; eCFR=${extracted.title}`);
    return { ...item, reviewStatus: "VERIFIED" as const, effectiveDate: null, effectiveDateIssue: `The current eCFR snapshot is dated ${REVIEW_DATE}; the section's amendment history may contain multiple effective dates and requires reviewer confirmation before approval.`, currentText: extracted.currentText, trainingCoverage: trainingCoverage(item), trainingRelationship: "PROPOSED_ONLY" as const };
  });
}

async function persist(items: ReviewedItem[]) {
  if (!connectionString) throw new Error("DATABASE_URL is required for durable reviewed ingestion");
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  let created = 0;
  let updated = 0;
  await prisma.$transaction(async (transaction) => {
    const source = await transaction.regulatorySource.upsert({ where: { id: "fmcsa-ecfr-title-49" }, update: { title: "Title 49, Transportation, Subtitle B, Chapter III", sourceUrl }, create: { id: "fmcsa-ecfr-title-49", sourceType: "REGULATION", agency: "eCFR", title: "Title 49, Transportation, Subtitle B, Chapter III", sourceUrl, externalIdentifier: "49-CFR-300-399" } });
    for (const item of items) {
      const stableKey = `fmcsa:${item.citation.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase()}`;
      const existing = await transaction.regulatoryRequirement.findUnique({ where: { stableKey }, select: { id: true } });
      const requirement = await transaction.regulatoryRequirement.upsert({ where: { stableKey }, update: { sourceId: source.id, title: item.title, topic: item.workflows.join(", "), cfrPart: item.cfrPart, section: item.section }, create: { sourceId: source.id, stableKey, title: item.title, topic: item.workflows.join(", "), cfrPart: item.cfrPart, section: item.section } });
      await transaction.regulatoryRequirementVersion.upsert({ where: { requirementId_version: { requirementId: requirement.id, version: ECFR_VERSION } }, update: { citation: item.citation, summary: item.currentText, effectiveDate: null, status: "PROPOSED", sourceUrl: item.sourceUrl, retrievedAt: new Date(`${REVIEW_DATE}T00:00:00.000Z`) }, create: { requirementId: requirement.id, citation: item.citation, summary: item.currentText, version: ECFR_VERSION, status: "PROPOSED", sourceUrl: item.sourceUrl, effectiveDate: null, retrievedAt: new Date(`${REVIEW_DATE}T00:00:00.000Z`) } });
      if (existing) updated += 1;
      else created += 1;
    }
  });
  return { created, updated };
}

async function main() {
  const items = await buildReviewedItems();
  const dossier = { source: "eCFR", sourceUrl, retrievedAt: `${REVIEW_DATE}T00:00:00.000Z`, version: ECFR_VERSION, reviewStatus: "VERIFIED", approvalStatus: "NOT_APPROVED", sectionsReviewed: items.length, sectionsVerified: items.length, sectionsApproved: 0, sectionsPublished: 0, sectionsStillQueued: 0, items };
  await mkdir(path.join(process.cwd(), "docs"), { recursive: true });
  await writeFile(path.join(process.cwd(), "docs", "FMCSA_FIRST_WAVE_REVIEW.json"), `${JSON.stringify(dossier, null, 2)}\n`, "utf8");
  if (dryRun) {
    console.log(`FMCSA review dry run: ${items.length} sections verified; 0 approved; 0 published.`);
    return;
  }
  const counts = await persist(items);
  console.log(`FMCSA reviewed ingestion: ${items.length} sections verified; ${counts.created} proposed requirements created; ${counts.updated} proposed requirements updated; 0 approved; 0 published.`);
  console.log("Training relationships recorded as proposed coverage only; no RegulatoryTrainingLink rows were created before approval.");
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma?.$disconnect());
