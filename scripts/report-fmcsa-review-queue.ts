import { readFileSync } from "node:fs";
import path from "node:path";
import { FMCSA_REGULATORY_REVIEW_QUEUE, getFmcsaReviewQueueSummary } from "@/lib/fmcsa-regulatory-review-queue";

console.log("FMCSA reviewed-ingestion queue");
console.log(JSON.stringify(getFmcsaReviewQueueSummary()));
for (const item of FMCSA_REGULATORY_REVIEW_QUEUE) {
  console.log(`${item.priority}. ${item.citation} | ${item.title} | ${item.workflows.join(", ")} | ${item.sourceUrl}`);
}
try {
  const dossier = JSON.parse(readFileSync(path.join(process.cwd(), "docs", "FMCSA_FIRST_WAVE_REVIEW.json"), "utf8")) as { sectionsVerified: number; sectionsApproved: number; sectionsPublished: number; sectionsStillQueued: number; items: Array<{ citation: string; reviewStatus: string; trainingCoverage: string[] }> };
  console.log(`Review dossier: ${dossier.sectionsVerified} verified, ${dossier.sectionsApproved} approved, ${dossier.sectionsPublished} published, ${dossier.sectionsStillQueued} still queued.`);
  console.log(`Proposed training coverage: ${dossier.items.filter((item) => item.trainingCoverage.length > 0).map((item) => `${item.citation} -> ${item.trainingCoverage.join(", ")}`).join("; ") || "none"}`);
} catch {
  console.log("Review dossier: not generated yet.");
}
console.log("No training links, applicability records, assignments, certifications, or completion records are created by this report.");
