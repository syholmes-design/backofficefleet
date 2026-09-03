export type ProcessIntelligenceReadiness = "READY" | "PARTIALLY READY" | "NOT READY";

export type ProcessIntelligenceCapabilityRow = {
  capability: string;
  currentImplementation: string;
  persistent: "Yes" | "Partial" | "No";
  tenantScoped: "Yes" | "Partial" | "No";
  sourceLineage: "Yes" | "Partial" | "No";
  processIntelligenceReady: ProcessIntelligenceReadiness;
  requiredAction: string;
};

export const PROCESS_INTELLIGENCE_CAPABILITY_MATRIX: ProcessIntelligenceCapabilityRow[] = [
  {
    capability: "Loads",
    currentImplementation: "Prisma Load + demo-data.json UI spine. Canonical identity exists in the durable layer.",
    persistent: "Partial",
    tenantScoped: "Yes",
    sourceLineage: "Partial",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "Use Load lineage fields and operating events; keep demo UI from rewriting origin.",
  },
  {
    capability: "Dispatch",
    currentImplementation: "Prisma DispatchAssignment is tenant-scoped. Demo dispatch board is localStorage/demo JSON.",
    persistent: "Partial",
    tenantScoped: "Yes",
    sourceLineage: "Partial",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "Emit DISPATCH_ASSIGNED operating events from assignment writes.",
  },
  {
    capability: "Drivers",
    currentImplementation: "Prisma Driver + intake/qualification. Command-center UI is demo JSON.",
    persistent: "Partial",
    tenantScoped: "Yes",
    sourceLineage: "Partial",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "Keep driver records tenant-scoped; do not treat demo roster as production history.",
  },
  {
    capability: "Equipment",
    currentImplementation: "Prisma Equipment linked to assignments and condition threads.",
    persistent: "Yes",
    tenantScoped: "Yes",
    sourceLineage: "No",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "Add equipment origin/lineage when imported from TMS/ELD; condition events already exist.",
  },
  {
    capability: "Documents",
    currentImplementation: "Prisma DriverDocument + OperationalEvidence. File cabinet/demo vault is not the durable load trail.",
    persistent: "Partial",
    tenantScoped: "Yes",
    sourceLineage: "Partial",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "Link load-document evidence IDs onto operating events; do not invent document histories.",
  },
  {
    capability: "Pre-Trip",
    currentImplementation: "Prisma PreTripHeader/Item/Defect with condition/evidence links.",
    persistent: "Yes",
    tenantScoped: "Yes",
    sourceLineage: "Partial",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "Emit PRETRIP_RECORDED events from pre-trip completion.",
  },
  {
    capability: "Readiness",
    currentImplementation: "Prisma DriverReadinessScore is durable. Demo readiness is derived UI state.",
    persistent: "Partial",
    tenantScoped: "Yes",
    sourceLineage: "No",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "Persist readiness decisions as operating events tied to load when a load context exists.",
  },
  {
    capability: "Release",
    currentImplementation: "Prisma DispatchRelease stores disposition, reasons, policy, actor, timestamp.",
    persistent: "Yes",
    tenantScoped: "Yes",
    sourceLineage: "Partial",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "Mirror each release/hold as a RELEASE_EVALUATED operating event. UI Ready is not the record.",
  },
  {
    capability: "POD",
    currentImplementation: "Prisma LoadDelivery + LoadProofOfDelivery. Demo manifests remain DEMO DATA.",
    persistent: "Yes",
    tenantScoped: "Yes",
    sourceLineage: "Yes",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "Do not treat demo POD files as production history. Operator UI still uses demo manifests.",
  },
  {
    capability: "Settlements",
    currentImplementation: "Prisma Settlement is authoritative. Operator settlement UI remains DEMO DATA.",
    persistent: "Yes",
    tenantScoped: "Yes",
    sourceLineage: "Yes",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "Keep demo settlement UI disconnected from Prisma Settlement until a later UI wiring phase.",
  },
  {
    capability: "Invoices",
    currentImplementation: "Prisma Invoice and InvoicePayment are authoritative billing/cash records.",
    persistent: "Yes",
    tenantScoped: "Yes",
    sourceLineage: "Yes",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "Operator billing UI remains demo until it reads Prisma Invoice.",
  },
  {
    capability: "Exceptions",
    currentImplementation: "LoadStatus.EXCEPTION, condition threads, chat EXCEPTION_THREAD, demo issue paths.",
    persistent: "Partial",
    tenantScoped: "Partial",
    sourceLineage: "No",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "Use OperatingException + corrective actions for SEE/CONTROL/DO/VERIFY data.",
  },
  {
    capability: "Audit/Event History",
    currentImplementation: "AuditEvent is tenant-optional. ConditionEvent is equipment-centric. Demo dispatch audit is localStorage.",
    persistent: "Partial",
    tenantScoped: "Partial",
    sourceLineage: "Partial",
    processIntelligenceReady: "PARTIALLY READY",
    requiredAction: "OperatingProcessEvent is the load-centric durable history. Do not use localStorage as authority.",
  },
];
