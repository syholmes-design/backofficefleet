import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const expectedIds = ["fmcsa-cargo-securement", "bof-hos-coaching", "bof-pretrip-securement"];

async function main() {
  const modules = await prisma.trainingModule.findMany({
    where: { id: { in: expectedIds } },
    select: { id: true, title: true, ownership: true, version: true, segments: { select: { id: true, title: true } } },
    orderBy: { id: "asc" },
  });
  const segmentCount = await prisma.trainingSegment.count({ where: { trainingModuleId: { in: expectedIds } } });
  const assignmentCount = await prisma.trainingAssignment.count();
  const certificationCount = await prisma.trainingCertification.count();
  const result = { expectedModuleCount: expectedIds.length, moduleCount: modules.length, segmentCount, assignmentCount, certificationCount, importedModules: modules };
  console.log(JSON.stringify(result, null, 2));
  if (modules.length !== expectedIds.length || segmentCount !== 1) throw new Error("Training import verification failed");
}

main().finally(() => prisma.$disconnect());
