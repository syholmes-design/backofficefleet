/**
 * Canonical ID Mappings
 *
 * This file contains explicit, verified mappings between demo identifiers
 * and authoritative Prisma CUID identifiers.
 *
 * IMPORTANT:
 * - Do NOT invent mappings
 * - Only add mappings that are verified against actual database records
 * - Use "UNRESOLVED" status for unknown mappings
 * - This file is source-controlled and must be reviewed before changes
 */

export type IdentityMappingStatus = "VERIFIED" | "ASSUMED" | "UNRESOLVED";

export type IdentityMapping = {
  demoId: string;
  canonicalId: string | null; // null for UNRESOLVED
  status: IdentityMappingStatus;
  notes?: string;
  lastVerifiedAt?: Date;
  fleetId?: string;
};

/**
 * DRIVER IDENTITY MAPPINGS
 *
 * Demo IDs like "DRV-001" map to Prisma Driver CUID.
 * These mappings should be verified by correlating demo driver names/emails
 * with Prisma driver records.
 */
export const driverMappings: Map<string, IdentityMapping> = new Map([
  [
    "DRV-001",
    {
      demoId: "DRV-001",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "John Carter - Known demo driver. Mapping to Prisma Driver ID requires database verification.",
    },
  ],
  [
    "DRV-002",
    {
      demoId: "DRV-002",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Maria Lopez - Known demo driver. Mapping to Prisma Driver ID requires database verification.",
    },
  ],
  [
    "DRV-003",
    {
      demoId: "DRV-003",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Alex Kim - Known demo driver. Mapping to Prisma Driver ID requires database verification.",
    },
  ],
  [
    "DRV-004",
    {
      demoId: "DRV-004",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Priya Patel - Known demo driver. Mapping to Prisma Driver ID requires database verification.",
    },
  ],
  [
    "DRV-005",
    {
      demoId: "DRV-005",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Kenji Tanaka - Known demo driver. Mapping to Prisma Driver ID requires database verification.",
    },
  ],
]);

/**
 * LOAD IDENTITY MAPPINGS
 *
 * Demo IDs like "L-501" map to Prisma Load CUID.
 * LoadV2 data includes driverId references which can be used for correlation.
 */
export const loadMappings: Map<string, IdentityMapping> = new Map([
  [
    "L-501",
    {
      demoId: "L-501",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Peachtree Foods / Cleveland OH → Dallas TX. Driver: DRV-001 (John Carter). Prisma mapping requires DB query.",
    },
  ],
  [
    "L-502",
    {
      demoId: "L-502",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Lakeside Plastics / Chicago IL → Memphis TN. Driver: DRV-002 (Maria Lopez). Prisma mapping requires DB query.",
    },
  ],
  [
    "L-503",
    {
      demoId: "L-503",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Midwest Paper Co. / Columbus OH → Indianapolis IN. Driver: DRV-003 (Alex Kim). Prisma mapping requires DB query.",
    },
  ],
  [
    "L-504",
    {
      demoId: "L-504",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Gateway Supply / St. Louis MO → Kansas City MO. Driver: DRV-004 (Priya Patel). Prisma mapping requires DB query.",
    },
  ],
  [
    "L-505",
    {
      demoId: "L-505",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Pacific Retail / San Francisco CA → Los Angeles CA. Driver: DRV-005 (Kenji Tanaka). Prisma mapping requires DB query.",
    },
  ],
  [
    "L-506",
    {
      demoId: "L-506",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Midwest Auto / Detroit MI → Buffalo NY. Driver: DRV-006. Prisma mapping requires DB query.",
    },
  ],
  [
    "L-507",
    {
      demoId: "L-507",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Northern Steel / Minneapolis MN → Milwaukee WI. Driver: DRV-007. Prisma mapping requires DB query.",
    },
  ],
  [
    "L-508",
    {
      demoId: "L-508",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Southeast Distributors / Atlanta GA → Charlotte NC. Driver: DRV-008. Prisma mapping requires DB query.",
    },
  ],
  [
    "L-509",
    {
      demoId: "L-509",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Mountain Logistics / Denver CO → Salt Lake City UT. Driver: DRV-009. Prisma mapping requires DB query.",
    },
  ],
  [
    "L-510",
    {
      demoId: "L-510",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Texas Transport / Houston TX → Dallas TX. Driver: DRV-010. Prisma mapping requires DB query.",
    },
  ],
  [
    "L-511",
    {
      demoId: "L-511",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Coastal Shipping / Miami FL → Fort Lauderdale FL. Driver: DRV-011. Prisma mapping requires DB query.",
    },
  ],
  [
    "L-512",
    {
      demoId: "L-512",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Northwest Freight / Seattle WA → Portland OR. Driver: DRV-012. Prisma mapping requires DB query.",
    },
  ],
]);

/**
 * EQUIPMENT IDENTITY MAPPINGS
 *
 * Demo IDs like "T-101", "TRL-2559" map to Prisma Equipment CUID.
 * Equipment uses text identifiers in demo, not structured IDs.
 */
export const equipmentMappings: Map<string, IdentityMapping> = new Map([
  [
    "T-101",
    {
      demoId: "T-101",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Tractor T-101. Prisma Equipment unit_number mapping requires DB query.",
    },
  ],
  [
    "T-102",
    {
      demoId: "T-102",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Tractor T-102. Prisma Equipment unit_number mapping requires DB query.",
    },
  ],
  [
    "T-103",
    {
      demoId: "T-103",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Tractor T-103. Prisma Equipment unit_number mapping requires DB query.",
    },
  ],
  [
    "TRL-2559",
    {
      demoId: "TRL-2559",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Trailer TRL-2559. Demo data uses TRL- prefix. Prisma may use different unit_number format.",
    },
  ],
  [
    "TRL-2854",
    {
      demoId: "TRL-2854",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Trailer TRL-2854. Prisma Equipment mapping requires DB query.",
    },
  ],
]);

/**
 * DOCUMENT IDENTITY MAPPINGS
 *
 * Demo IDs like "DOC-001" map to Prisma DriverDocument CUID.
 * DriverDocuments are linked to Drivers via driverId foreign key.
 */
export const documentMappings: Map<string, IdentityMapping> = new Map([
  [
    "DOC-001",
    {
      demoId: "DOC-001",
      canonicalId: null,
      status: "UNRESOLVED",
      notes: "Demo document 001. Prisma DriverDocument mapping requires DB query with driver correlation.",
    },
  ],
]);

/**
 * Get all mapping groups for audit purposes
 */
export function getAllMappingGroups() {
  return {
    drivers: Object.fromEntries(driverMappings),
    loads: Object.fromEntries(loadMappings),
    equipment: Object.fromEntries(equipmentMappings),
    documents: Object.fromEntries(documentMappings),
  };
}

/**
 * Get mapping statistics
 */
export function getMappingStats() {
  const groups = getAllMappingGroups();
  const stats = {
    drivers: { total: 0, verified: 0, assumed: 0, unresolved: 0 },
    loads: { total: 0, verified: 0, assumed: 0, unresolved: 0 },
    equipment: { total: 0, verified: 0, assumed: 0, unresolved: 0 },
    documents: { total: 0, verified: 0, assumed: 0, unresolved: 0 },
    total: 0,
    verified: 0,
    assumed: 0,
    unresolved: 0,
  };

  type StatsKey = "drivers" | "loads" | "equipment" | "documents";
  const categoryKeys: StatsKey[] = ["drivers", "loads", "equipment", "documents"];

  for (const groupName of categoryKeys) {
    const mappings = groups[groupName];
    const group = stats[groupName];

    for (const mapping of Object.values(mappings) as IdentityMapping[]) {
      group.total++;
      stats.total++;

      if (mapping.status === "VERIFIED") {
        group.verified++;
        stats.verified++;
      } else if (mapping.status === "ASSUMED") {
        group.assumed++;
        stats.assumed++;
      } else {
        group.unresolved++;
        stats.unresolved++;
      }
    }
  }

  return stats;
}
