import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { FMCSA_REGULATORY_REVIEW_QUEUE } from "@/lib/fmcsa-regulatory-review-queue";

config({ path: ".env.local" });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const expectedKeys = FMCSA_REGULATORY_REVIEW_QUEUE.map((item) => `fmcsa:${item.citation.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase()}`);
  const requirements = await prisma.regulatoryRequirement.findMany({
    where: { stableKey: { in: expectedKeys } },
    include: { versions: { select: { citation: true, version: true, status: true, sourceUrl: true, summary: true } } },
  });
  const proposedVersions = requirements.flatMap((requirement) => requirement.versions.filter((version) => version.status === "PROPOSED"));
  const trainingLinks = await prisma.regulatoryTrainingLink.count({ where: { trainingModuleId: { in: ["fmcsa-cargo-securement", "bof-hos-coaching", "bof-pretrip-securement"] } } });
  const applicabilityCount = await prisma.regulatoryApplicability.count();
  const assignmentCount = await prisma.trainingAssignment.count();
  const certificationCount = await prisma.trainingCertification.count();
  const result = {
    sectionsReviewed: FMCSA_REGULATORY_REVIEW_QUEUE.length,
    requirementsFound: requirements.length,
    proposedVersions: proposedVersions.length,
    verifiedTexts: proposedVersions.filter((version) => version.summary.trim().length > 0).length,
    approved: 0,
    published: 0,
    trainingLinksCreated: trainingLinks,
    tenantApplicabilityRecords: applicabilityCount,
    trainingAssignments: assignmentCount,
    trainingCertifications: certificationCount,
    trainingMappedSections: ["49 CFR 393.100", "49 CFR 393.104", "49 CFR 393.106", "49 CFR 395.3", "49 CFR 395.8"],
    trainingUncoveredSections: FMCSA_REGULATORY_REVIEW_QUEUE.filter((item) => !["393.100", "393.104", "393.106", "395.3", "395.8"].includes(item.section)).map((item) => item.citation),
  };
  console.log(JSON.stringify(result, null, 2));
  if (requirements.length !== 27 || proposedVersions.length !== 27 || result.verifiedTexts !== 27 || trainingLinks !== 0 || applicabilityCount !== 0) throw new Error("FMCSA review verification failed");
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
