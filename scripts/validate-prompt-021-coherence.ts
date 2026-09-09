import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { isDemoOperationalKey } from "../lib/uos/demo-operational-keys";
import { prisma } from "../lib/prisma";

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

const prior = spawnSync("npx", ["--yes", "tsx", "scripts/validate-prompt-020-demo-firewall.ts"], {
  cwd: process.cwd(),
  encoding: "utf8",
  shell: true,
});
assert.equal(prior.status, 0, `Prompt 020 boundary recheck failed:\n${prior.stdout}\n${prior.stderr}`);
assert.match(prior.stdout, /PROMPT_020_SOURCE_CHECKS_OK/);

assert.match(read("app/(bof)/command-center/page.tsx"), /ProductionCommandCenter/);
assert.doesNotMatch(read("app/(bof)/command-center/page.tsx"), /CommandCenterV4/);
assert.match(read("components/command-center/ProductionCommandCenter.tsx"), /useLiveOperatingSpine/);
assert.doesNotMatch(read("components/command-center/ProductionCommandCenter.tsx"), /getV3OperationalData/);
assert.match(read("prisma/schema.prisma"), /model Load \{/);
assert.doesNotMatch(read("prisma/schema.prisma"), /commodity_class/);
assert.doesNotMatch(read("prisma/schema.prisma"), /safety_clearance_status/);
assert.doesNotMatch(read("prisma/schema.prisma"), /dispatch_ref/);
assert.match(read("prisma/schema.prisma"), /enum SettlementRecordStatus/);
assert.match(read("components/settlements-payroll/SettlementsPayrollShell.tsx"), /useSettlementsPayrollStore/);
assert.match(read("lib/stores/settlements-payroll-store.ts"), /getBofData/);

type FieldVerdict = "COHERENT" | "TRANSFORMED_EQUIVALENT" | "INCOMPLETE" | "CONFLICTING" | "UNKNOWN";
type FieldRow = {
  field: string;
  liveRepresentation: string;
  verdict: FieldVerdict;
  countsTowardPass: boolean;
  excluded: boolean;
  excludeReason?: string;
  notes: string;
};

const fields: FieldRow[] = [
  {
    field: "load_id",
    liveRepresentation: "Load.id (cuid)",
    verdict: "TRANSFORMED_EQUIVALENT",
    countsTowardPass: true,
    excluded: false,
    notes: "LIVE APIs/spine/assignment/settlement use Load.id. DEMO L00x isolated by Prompt 020.",
  },
  {
    field: "dispatch_ref",
    liveRepresentation: "DispatchAssignment.id when ACTIVE (no dispatch_ref column)",
    verdict: "TRANSFORMED_EQUIVALENT",
    countsTowardPass: true,
    excluded: false,
    notes: "Canonical name absent. LIVE assignment id is the operational dispatch identity.",
  },
  {
    field: "driver_id",
    liveRepresentation: "Driver.id",
    verdict: "TRANSFORMED_EQUIVALENT",
    countsTowardPass: true,
    excluded: false,
    notes: "Eligibility and assignment use Driver.id. Command Center spine does not list drivers.",
  },
  {
    field: "equipment_id",
    liveRepresentation: "Equipment.id",
    verdict: "TRANSFORMED_EQUIVALENT",
    countsTowardPass: true,
    excluded: false,
    notes: "PATCH and assignment use Equipment.id. DEMO T-102 isolated. Maintenance SSG remains DEMO.",
  },
  {
    field: "origin",
    liveRepresentation: "Load.origin",
    verdict: "COHERENT",
    countsTowardPass: true,
    excluded: false,
    notes: "Present on Load and operating-spine payload.",
  },
  {
    field: "destination",
    liveRepresentation: "Load.destination",
    verdict: "COHERENT",
    countsTowardPass: true,
    excluded: false,
    notes: "Present on Load and operating-spine payload.",
  },
  {
    field: "appointment_window",
    liveRepresentation: "pickupWindowStart/End + deliveryWindowStart/End",
    verdict: "TRANSFORMED_EQUIVALENT",
    countsTowardPass: true,
    excluded: false,
    notes: "Split optional DateTimes. Not a single appointment_window column. Not shown on CC KPI strip.",
  },
  {
    field: "commodity_class",
    liveRepresentation: "none",
    verdict: "INCOMPLETE",
    countsTowardPass: false,
    excluded: false,
    notes: "No Prisma Load.commodity or commodity_class. Must not invent the field.",
  },
  {
    field: "settlement_status",
    liveRepresentation: "Settlement.status (CREATED/HELD/REVIEWED/APPROVED/PAID/CLOSED/EXCEPTION)",
    verdict: "CONFLICTING",
    countsTowardPass: false,
    excluded: false,
    notes: "LIVE hold enum is Prisma Settlement.status. Production /settlements still renders workbook payroll zustand status (Hold/review) beside the LIVE hold panel. Product Authority PENDING/INVOICED/DISPUTED are not this enum.",
  },
  {
    field: "safety_clearance_status",
    liveRepresentation: "unassigned (019). No Prisma column.",
    verdict: "INCOMPLETE",
    countsTowardPass: false,
    excluded: true,
    excludeReason: "Prompt 021: validate implemented LIVE safety only; do not treat unsupported Safety mutation as a fail requiring implementation.",
    notes: "/safety remains DEMO/REFERENCE. Dispatch assignment does not read Safety workbook as LIVE clearance.",
  },
];

async function main() {
  const scored = fields.filter((row) => !row.excluded);
  const passed = scored.filter((row) => row.countsTowardPass);
  const percent = (passed.length / scored.length) * 100;

  const snapshot = {
    loadCount: await prisma.load.count(),
    demoKeyLoads: await prisma.load.count({
      where: { OR: [{ id: "L001" }, { id: "T-102" }] },
    }),
    equipmentCount: await prisma.equipment.count(),
    demoKeyEquipment: await prisma.equipment.count({ where: { id: "T-102" } }),
    driverCount: await prisma.driver.count(),
    demoKeyDrivers: await prisma.driver.count({ where: { id: "DRV-001" } }),
  };

  const heldSettlements = await prisma.settlement.count({ where: { status: "HELD" } });
  const sampleLoad = await prisma.load.findFirst({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      origin: true,
      destination: true,
      referenceNumber: true,
      sourceRecordId: true,
      pickupWindowStart: true,
      deliveryWindowStart: true,
      dispatchAssignments: {
        where: { status: "ACTIVE" },
        take: 1,
        select: {
          id: true,
          driverId: true,
          tractorEquipmentId: true,
          trailerEquipmentId: true,
          driver: { select: { id: true } },
          tractorEquipment: { select: { id: true, status: true, unitNumber: true } },
        },
      },
      settlements: { take: 3, select: { id: true, status: true, loadId: true, holdReason: true } },
      proofsOfDelivery: { take: 3, select: { id: true, status: true, loadId: true } },
    },
  });

  assert.equal(isDemoOperationalKey("L001"), true);
  assert.equal(isDemoOperationalKey(sampleLoad?.id ?? ""), false);
  assert.equal(snapshot.demoKeyLoads, 0);
  assert.equal(snapshot.demoKeyEquipment, 0);
  assert.equal(snapshot.demoKeyDrivers, 0);

  if (sampleLoad?.dispatchAssignments[0]) {
    const assignment = sampleLoad.dispatchAssignments[0];
    assert.equal(assignment.driver.id, assignment.driverId);
    assert.equal(assignment.tractorEquipment.id, assignment.tractorEquipmentId);
  }
  for (const row of sampleLoad?.settlements ?? []) {
    assert.equal(row.loadId, sampleLoad!.id);
  }
  for (const row of sampleLoad?.proofsOfDelivery ?? []) {
    assert.equal(row.loadId, sampleLoad!.id);
  }

  const result = {
    prompt: "021",
    canonical: {
      denominator: scored.length,
      numerator: passed.length,
      excluded: fields.filter((row) => row.excluded).map((row) => row.field),
      percent: Number(percent.toFixed(2)),
      threshold: 95,
      gate: percent >= 95 ? "PASS" : "BLOCK",
      fields,
    },
    prismaRead: {
      loadCount: snapshot.loadCount,
      equipmentCount: snapshot.equipmentCount,
      driverCount: snapshot.driverCount,
      heldSettlements,
      sampleLoadId: sampleLoad?.id ?? null,
      sampleLoadStatus: sampleLoad?.status ?? null,
      sampleHasActiveAssignment: Boolean(sampleLoad?.dispatchAssignments[0]),
      sampleSettlementStatuses: (sampleLoad?.settlements ?? []).map((row) => row.status),
    },
    mutation: "NOT_EXECUTED_READ_BASED",
  };

  console.log(JSON.stringify(result, null, 2));
  console.log(
    percent >= 95
      ? "PROMPT_021_CANONICAL_FIELD_COHERENCE_PASS"
      : "PROMPT_021_CANONICAL_FIELD_COHERENCE_BELOW_THRESHOLD",
  );

  await prisma.$disconnect();
}

void main();
