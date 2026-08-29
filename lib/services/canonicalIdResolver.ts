/**
 * Canonical ID Resolver Service
 *
 * Centralized mechanism for resolving demo identifiers (like "DRV-001", "L-001")
 * to authoritative Prisma CUID identifiers.
 *
 * This service:
 * - Provides a single controlled point for identity resolution
 * - Returns UNRESOLVED for unknown identities (no guessing)
 * - Does NOT bypass authorization (separate concern)
 * - Is deterministic and explicitly typed
 * - Is NOT used inside components or pages (only at service boundary)
 *
 * USAGE PATTERN:
 * ```typescript
 * const resolved = resolveCanonicalRecord({
 *   recordType: "DRIVER",
 *   sourceSystem: "DEMO",
 *   sourceId: "DRV-001",
 * });
 *
 * if (resolved.status === "RESOLVED") {
 *   // Use resolved.canonicalId for Prisma queries
 *   const driver = await prisma.driver.findUnique({ where: { id: resolved.canonicalId } });
 * } else {
 *   // Handle unresolved identity
 *   throw new Error(`Driver DRV-001 not found in canonical mapping`);
 * }
 * ```
 */

import type {
  IdentityMapping,
  IdentityMappingStatus,
} from "@/lib/canonical-id-mappings";
import {
  driverMappings,
  documentMappings,
  equipmentMappings,
  loadMappings,
} from "@/lib/canonical-id-mappings";

/**
 * Supported record types for identity resolution
 */
export enum RecordType {
  DRIVER = "DRIVER",
  LOAD = "LOAD",
  EQUIPMENT = "EQUIPMENT",
  DOCUMENT = "DOCUMENT",
}

/**
 * Supported source systems
 */
export enum SourceSystem {
  DEMO = "DEMO",
  PRISMA = "PRISMA",
}

/**
 * Request to resolve an identity
 */
export interface CanonicalIdRequest {
  recordType: RecordType | keyof typeof RecordType;
  sourceSystem: SourceSystem | keyof typeof SourceSystem;
  sourceId: string;
}

/**
 * Resolution response for a successful resolution
 */
export interface ResolvedIdentity {
  status: "RESOLVED";
  recordType: RecordType;
  sourceSystem: SourceSystem;
  sourceId: string;
  canonicalId: string;
  mappingStatus: IdentityMappingStatus;
}

/**
 * Resolution response for an unresolved identity
 */
export interface UnresolvedIdentity {
  status: "UNRESOLVED";
  recordType: RecordType;
  sourceSystem: SourceSystem;
  sourceId: string;
  reason: string;
}

/**
 * Error response
 */
export interface ResolutionError {
  status: "ERROR";
  error: string;
  details?: Record<string, unknown>;
}

export type CanonicalIdResolution = ResolvedIdentity | UnresolvedIdentity | ResolutionError;

/**
 * Resolve a demo identifier to its canonical (Prisma) identifier
 *
 * @param request - The resolution request
 * @returns Resolution result (RESOLVED | UNRESOLVED | ERROR)
 */
export function resolveCanonicalRecord(request: CanonicalIdRequest): CanonicalIdResolution {
  try {
    // Normalize inputs
    const recordType = normalizeRecordType(request.recordType);
    const sourceSystem = normalizeSourceSystem(request.sourceSystem);
    const sourceId = (request.sourceId ?? "").trim();

    // Validate inputs
    if (!recordType) {
      return {
        status: "ERROR",
        error: "INVALID_RECORD_TYPE",
        details: { received: request.recordType },
      };
    }

    if (!sourceSystem) {
      return {
        status: "ERROR",
        error: "INVALID_SOURCE_SYSTEM",
        details: { received: request.sourceSystem },
      };
    }

    if (!sourceId) {
      return {
        status: "UNRESOLVED",
        recordType,
        sourceSystem,
        sourceId: request.sourceId ?? "",
        reason: "SOURCE_ID_EMPTY",
      };
    }

    // Only resolve FROM demo TO Prisma for now
    if (sourceSystem !== SourceSystem.DEMO) {
      return {
        status: "ERROR",
        error: "UNSUPPORTED_RESOLUTION_DIRECTION",
        details: { sourceSystem, supportedSystems: [SourceSystem.DEMO] },
      };
    }

    // Get the appropriate mapping
    const mapping = getMappingForRecordType(recordType, sourceId);

    if (!mapping) {
      return {
        status: "UNRESOLVED",
        recordType,
        sourceSystem,
        sourceId,
        reason: "NOT_IN_MAPPING",
      };
    }

    if (!mapping.canonicalId) {
      return {
        status: "UNRESOLVED",
        recordType,
        sourceSystem,
        sourceId,
        reason: `MAPPING_NOT_VERIFIED (status: ${mapping.status})`,
      };
    }

    return {
      status: "RESOLVED",
      recordType,
      sourceSystem,
      sourceId,
      canonicalId: mapping.canonicalId,
      mappingStatus: mapping.status,
    };
  } catch (err) {
    return {
      status: "ERROR",
      error: "RESOLVER_EXCEPTION",
      details: { error: String(err) },
    };
  }
}

/**
 * Normalize record type string to enum
 */
function normalizeRecordType(
  input: RecordType | keyof typeof RecordType | unknown
): RecordType | null {
  if (typeof input !== "string") return null;

  const upper = input.toUpperCase();
  if (upper === "DRIVER") return RecordType.DRIVER;
  if (upper === "LOAD") return RecordType.LOAD;
  if (upper === "EQUIPMENT") return RecordType.EQUIPMENT;
  if (upper === "DOCUMENT") return RecordType.DOCUMENT;

  return null;
}

/**
 * Normalize source system string to enum
 */
function normalizeSourceSystem(
  input: SourceSystem | keyof typeof SourceSystem | unknown
): SourceSystem | null {
  if (typeof input !== "string") return null;

  const upper = input.toUpperCase();
  if (upper === "DEMO") return SourceSystem.DEMO;
  if (upper === "PRISMA") return SourceSystem.PRISMA;

  return null;
}

/**
 * Get mapping for a specific record type and ID
 */
function getMappingForRecordType(
  recordType: RecordType,
  sourceId: string
): IdentityMapping | null {
  switch (recordType) {
    case RecordType.DRIVER:
      return driverMappings.get(sourceId) ?? null;
    case RecordType.LOAD:
      return loadMappings.get(sourceId) ?? null;
    case RecordType.EQUIPMENT:
      return equipmentMappings.get(sourceId) ?? null;
    case RecordType.DOCUMENT:
      return documentMappings.get(sourceId) ?? null;
    default:
      return null;
  }
}

/**
 * Batch resolution for multiple IDs
 */
export function resolveBatch(
  requests: CanonicalIdRequest[]
): CanonicalIdResolution[] {
  return requests.map((req) => resolveCanonicalRecord(req));
}

/**
 * Helper to check if resolution was successful
 */
export function isResolved(resolution: CanonicalIdResolution): resolution is ResolvedIdentity {
  return resolution.status === "RESOLVED";
}

/**
 * Helper to get canonical ID or throw
 */
export function getCanonicalIdOrThrow(
  resolution: CanonicalIdResolution,
  fallbackMessage?: string
): string {
  if (resolution.status === "RESOLVED") {
    return resolution.canonicalId;
  }

  const msg = fallbackMessage ?? `Identity resolution failed: ${JSON.stringify(resolution)}`;
  const err = new Error(msg) as Error & { resolution?: CanonicalIdResolution };
  err.resolution = resolution;
  throw err;
}
