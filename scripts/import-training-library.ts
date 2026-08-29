import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildTrainingModuleImportPayloads, buildTrainingSegmentImportPayloads } from "@/lib/services/trainingCatalogAdapter";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
const dryRun = process.argv.includes("--dry-run");
let prisma: PrismaClient | undefined;

async function main() {
  const modules = buildTrainingModuleImportPayloads();
  const segments = buildTrainingSegmentImportPayloads();

  if (dryRun) {
    console.log(`Training library dry run: ${modules.length} modules, ${segments.length} knowledge-check segments.`);
    console.log("No assignments, certifications, or completion records will be created.");
    return;
  }

  if (!connectionString) throw new Error("DATABASE_URL is required");
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  let createdModules = 0;
  let updatedModules = 0;
  let createdSegments = 0;
  let updatedSegments = 0;

  await prisma.$transaction(async (transaction) => {
    for (const module of modules) {
      const existing = await transaction.trainingModule.findUnique({ where: { id: module.id }, select: { id: true } });
      await transaction.trainingModule.upsert({
        where: { id: module.id },
        update: module,
        create: module,
      });
      if (existing) updatedModules += 1;
      else createdModules += 1;
    }

    for (const segment of segments) {
      const existing = await transaction.trainingSegment.findUnique({ where: { id: segment.id }, select: { id: true } });
      await transaction.trainingSegment.upsert({
        where: { id: segment.id },
        update: segment,
        create: segment,
      });
      if (existing) updatedSegments += 1;
      else createdSegments += 1;
    }
  });

  const [assignmentCount, certificationCount] = await Promise.all([
    prisma.trainingAssignment.count(),
    prisma.trainingCertification.count(),
  ]);

  console.log(`Imported training library: ${createdModules} modules created, ${updatedModules} modules updated.`);
  console.log(`Imported knowledge checks: ${createdSegments} segments created, ${updatedSegments} segments updated.`);
  console.log(`Completion state untouched: ${assignmentCount} assignments and ${certificationCount} certifications remain unchanged.`);
}

  main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma?.$disconnect());
