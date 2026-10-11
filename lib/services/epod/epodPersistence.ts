import { createHash, randomUUID } from "crypto";

import type { Prisma } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { recordLoadDelivery } from "@/lib/process-intelligence/load-to-cash-service";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import type { SessionUserLike } from "@/lib/authorization";
import { assertCargoPhoto, type CargoPhotoRole } from "@/lib/services/epod/cargoPhotoEvidence";
import { assertAssignedDriver, assertDeliveryReader } from "@/lib/services/epod/deliveryAuthorization";
import {
  assertDeliveryTransition,
  assertEpodEnabled,
  assertEpodFleetMembership,
  assertLiveLoadKey,
  isDeliveryStage,
  type DeliveryStage,
} from "@/lib/services/epod/deliveryLifecycle";
import { describeEvidenceStorage, removeEvidenceFile, writeEvidenceFile, readEvidenceFile } from "@/lib/services/epod/evidenceStore";
import { assembleEpod, assertEpodReady, type EpodAcknowledgment, type EpodView } from "@/lib/services/epod/epodAssembly";
import { assertRecipientAcknowledgment } from "@/lib/services/epod/recipientAcknowledgment";
import { findLoadByOperatorKey } from "@/lib/services/loadService";
import { submitReceivedLoadProof } from "@/lib/services/proofSettlementHoldService";

function noteFor(role: string) {
  return `bof-epod:${role}`;
}

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2002");
}

async function createLockedEvidence(
  loadId: string,
  notes: string,
  storageKey: string,
  write: (tx: Prisma.TransactionClient) => Promise<unknown>,
) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${loadId}:${notes}`}))`;
      const existing = await tx.operationalEvidence.findFirst({
        where: { loadId, notes },
        select: { id: true },
      });
      if (existing) {
        throw Object.assign(new Error("This evidence is already stored."), { statusCode: 409, code: "EPOD_EXISTS" });
      }
      await write(tx);
    });
  } catch (error) {
    await removeEvidenceFile(storageKey);
    if (isUniqueConflict(error) || (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "EPOD_EXISTS")) {
      throw Object.assign(new Error("This evidence is already stored and cannot be silently replaced."), { statusCode: 409 });
    }
    throw error;
  }
}

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function writeStoredFile(fleetId: string, evidenceId: string, fileName: string, bytes: Uint8Array) {
  return writeEvidenceFile(fleetId, evidenceId, fileName, bytes);
}

export async function readStoredEvidenceFile(storageKey: string) {
  return readEvidenceFile(storageKey);
}

function decodeImage(value: string, mimeType: string) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    throw Object.assign(new Error("A web address is not delivery evidence."), { statusCode: 422 });
  }
  if (trimmed.length > 12_000_000) {
    throw Object.assign(new Error("Image is too large."), { statusCode: 422 });
  }
  const payload = trimmed.replace(/^data:image\/(?:png|jpeg|jpg);base64,/i, "");
  const bytes = new Uint8Array(Buffer.from(payload, "base64"));
  if (bytes.byteLength === 0) {
    throw Object.assign(new Error("Image content is required."), { statusCode: 422 });
  }
  return { bytes, mimeType };
}

async function requireLoadContext(sessionUser: SessionUserLike, loadKey: string, mode: "read" | "drive") {
  assertEpodEnabled();
  const key = assertLiveLoadKey(loadKey);
  const load = await findLoadByOperatorKey(key);
  if (!load) throw Object.assign(new Error("Load not found"), { statusCode: 404 });
  assertEpodFleetMembership(sessionUser, load.fleetId);
  const [fleet, activeAssignments, pickup, settlements, stageRow, loaded, empty, signature, generated, proofs] = await Promise.all([
    prisma.fleet.findUnique({ where: { id: load.fleetId }, select: { name: true } }),
    prisma.dispatchAssignment.findMany({
      where: { fleetId: load.fleetId, loadId: load.id, status: "ACTIVE" },
      select: {
        id: true,
        driverId: true,
        tractorEquipmentId: true,
        trailerEquipmentId: true,
        driver: { select: { userId: true, firstName: true, lastName: true } },
        tractorEquipment: { select: { unitNumber: true } },
        trailerEquipment: { select: { unitNumber: true } },
      },
    }),
    prisma.pickupAuthorization.findFirst({
      where: { fleetId: load.fleetId, loadId: load.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true },
    }),
    prisma.settlement.findMany({
      where: { fleetId: load.fleetId, loadId: load.id },
      select: { status: true, holdReason: true },
    }),
    prisma.operationalEvidence.findFirst({
      where: { fleetId: load.fleetId, loadId: load.id, notes: noteFor("DELIVERY_STAGE") },
    }),
    prisma.operationalEvidence.findFirst({
      where: { fleetId: load.fleetId, loadId: load.id, notes: noteFor("LOADED_TRAILER") },
    }),
    prisma.operationalEvidence.findFirst({
      where: { fleetId: load.fleetId, loadId: load.id, notes: noteFor("EMPTY_TRAILER") },
    }),
    prisma.operationalEvidence.findFirst({
      where: { fleetId: load.fleetId, loadId: load.id, notes: noteFor("RECIPIENT_SIGNATURE") },
    }),
    prisma.operationalEvidence.findFirst({
      where: { fleetId: load.fleetId, loadId: load.id, notes: noteFor("GENERATED_POD") },
    }),
    prisma.loadProofOfDelivery.findMany({
      where: { fleetId: load.fleetId, loadId: load.id },
      select: { id: true, status: true, evidenceId: true },
    }),
  ]);
  const stageValue =
    stageRow && typeof stageRow.observationValue === "object" && stageRow.observationValue && "stage" in stageRow.observationValue
      ? String((stageRow.observationValue as { stage?: string }).stage ?? "")
      : "DELIVERY_PENDING";
  if (stageRow && !isDeliveryStage(stageValue)) {
    throw Object.assign(new Error("Stored delivery stage is not recognized."), { statusCode: 409 });
  }
  const stage = isDeliveryStage(stageValue) ? stageValue : "DELIVERY_PENDING";
  if (activeAssignments.length > 1) {
    throw Object.assign(new Error("More than one active driver assignment exists for this load."), { statusCode: 409 });
  }
  const assignment = activeAssignments[0] ?? null;
  const assignedDriverUserId = assignment?.driver.userId ?? null;
  if (mode === "drive" && !assignment) {
    throw Object.assign(new Error("An active driver assignment is required."), { statusCode: 403 });
  }
  if (mode === "drive") {
    assertAssignedDriver(sessionUser, load.fleetId, assignedDriverUserId);
  } else {
    assertDeliveryReader(sessionUser, load.fleetId, assignedDriverUserId);
  }
  return { load, fleet, assignment, pickup, settlements, stageRow, stage, loaded, empty, signature, generated, proofs };
}

function photoSlot(row: { id: string; capturedAt: Date } | null) {
  return row ? { evidenceId: row.id, capturedAt: row.capturedAt.toISOString() } : null;
}

function acknowledgmentFrom(row: {
  id: string;
  capturedAt: Date;
  capturedByUserId: string;
  observationValue: unknown;
} | null): EpodAcknowledgment | null {
  if (!row || typeof row.observationValue !== "object" || row.observationValue === null) return null;
  const value = row.observationValue as Record<string, string>;
  if (!value.name || !value.disposition) return null;
  return {
    evidenceId: row.id,
    name: value.name,
    title: value.title ?? "",
    facility: value.facility ?? "",
    disposition: value.disposition as EpodAcknowledgment["disposition"],
    exceptions: value.exceptions ?? "",
    refusalReason: value.refusalReason ?? "",
    statement: value.statement ?? "",
    channel: "TABLET",
    authority: "SELF_DECLARED",
    receivedAt: row.capturedAt.toISOString(),
    actorId: row.capturedByUserId,
  };
}

function toView(context: Awaited<ReturnType<typeof requireLoadContext>>): EpodView {
  const proof = context.proofs.find((item) => item.evidenceId === context.generated?.id) ?? context.proofs[0] ?? null;
  return assembleEpod({
    loadId: context.load.id,
    loadNumber: context.load.referenceNumber || context.load.id,
    carrierName: context.fleet?.name ?? "",
    driverName: context.assignment ? `${context.assignment.driver.firstName} ${context.assignment.driver.lastName}` : null,
    truckNumber: context.assignment?.tractorEquipment.unitNumber ?? null,
    trailerNumber: context.assignment?.trailerEquipment?.unitNumber ?? null,
    pickupFacility: context.load.origin,
    deliveryFacility: context.load.destination,
    pickupAuthorizationId: context.pickup?.id ?? null,
    stage: context.stage,
    proofStatus: proof?.status ?? null,
    settlementStatus: context.settlements.some((item) => item.status === "HELD") ? "HELD" : context.settlements[0]?.status ?? null,
    loaded: photoSlot(context.loaded),
    empty: photoSlot(context.empty),
    acknowledgment: acknowledgmentFrom(context.signature),
    generatedEvidenceId: context.generated?.id ?? null,
    generatedAt: context.generated?.capturedAt.toISOString() ?? null,
  });
}

async function writeStage(
  context: Awaited<ReturnType<typeof requireLoadContext>>,
  actor: SessionUserLike & { id: string },
  next: DeliveryStage,
) {
  const decision = assertDeliveryTransition(context.stage, next);
  if (decision.idempotent) return false;
  const observationValue = { stage: next, serverReceivedAt: new Date().toISOString(), actorId: actor.id, gpsVerified: false };
  if (context.stageRow) {
    await prisma.operationalEvidence.update({
      where: { id: context.stageRow.id },
      data: { observationValue },
    });
    context.stage = next;
    return true;
  }
  const evidenceId = randomUUID();
  const bytes = new Uint8Array(Buffer.from(JSON.stringify(observationValue)));
  const storageKey = await writeStoredFile(context.load.fleetId, evidenceId, "delivery-stage.json", bytes);
  const notes = noteFor("DELIVERY_STAGE");
  await createLockedEvidence(context.load.id, notes, storageKey, (tx) =>
    tx.operationalEvidence.create({
      data: {
        id: evidenceId,
        fleet: { connect: { id: context.load.fleetId } },
        load: { connect: { id: context.load.id } },
        evidenceKind: "NOTE",
        observationSource: "SYSTEM",
        observationValue,
        provenance: { epodRole: "DELIVERY_STAGE", serverReceivedAt: observationValue.serverReceivedAt, gpsVerified: false },
        storageKey,
        originalFileName: "delivery-stage.json",
        mimeType: "application/json",
        checksum: sha256(bytes),
        notes,
        capturedByUser: { connect: { id: actor.id } },
      },
    }),
  );
  context.stage = next;
  return true;
}

export async function getEpod(sessionUser: SessionUserLike | null | undefined, loadKey: string) {
  if (!sessionUser?.id) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  const context = await requireLoadContext(sessionUser, loadKey, "read");
  return { view: toView(context), connectionRequired: true as const, storage: describeEvidenceStorage() };
}

export async function advanceDelivery(
  sessionUser: SessionUserLike | null | undefined,
  loadKey: string,
  action: "ARRIVE" | "START_UNLOADING" | "READY_FOR_ACKNOWLEDGMENT",
  place: string,
) {
  if (!sessionUser?.id) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  const actor = sessionUser as SessionUserLike & { id: string };
  const context = await requireLoadContext(actor, loadKey, "drive");
  const next: DeliveryStage =
    action === "ARRIVE" ? "ARRIVED" : action === "START_UNLOADING" ? "UNLOADING" : "AWAITING_RECIPIENT_ACKNOWLEDGMENT";
  if (action === "ARRIVE" && !place.trim()) {
    throw Object.assign(new Error("Arrival place is required. This is not a GPS fix."), { statusCode: 422 });
  }
  const changed = await writeStage(context, actor, next);
  if (!changed) return getEpod(actor, context.load.id);
  await createAuditRecord({
    actorId: actor.id,
    actorEmail: actor.email ?? null,
    tenantId: context.load.fleetId,
    action: "UPDATED",
    entityType: "LoadDelivery",
    entityId: context.load.id,
    details: { event: "operator.delivery.stage", loadId: context.load.id, stage: next, gpsVerified: false },
    metadata: { source: "epod-delivery" },
  });
  return getEpod(actor, context.load.id);
}

export async function saveCargoPhoto(
  sessionUser: SessionUserLike | null | undefined,
  loadKey: string,
  role: string,
  image: string,
  mimeType: string,
  extras: { storageKey?: string | null; documentId?: string | null; capturedAt?: string | null },
) {
  if (!sessionUser?.id) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  const actor = sessionUser as SessionUserLike & { id: string };
  const context = await requireLoadContext(actor, loadKey, "drive");
  const decoded = decodeImage(image, mimeType);
  assertCargoPhoto({
    role,
    loadId: context.load.id,
    fleetId: context.load.fleetId,
    mimeType: decoded.mimeType,
    bytes: decoded.bytes,
    callerStorageKey: extras.storageKey,
    callerDocumentId: extras.documentId,
    callerTimestamp: extras.capturedAt,
  });
  if (role === "EMPTY_TRAILER" && !["UNLOADING", "AWAITING_RECIPIENT_ACKNOWLEDGMENT", "ACCEPTED", "ACCEPTED_WITH_EXCEPTIONS", "REFUSED"].includes(context.stage)) {
    throw Object.assign(new Error("Empty-trailer photograph requires unloading to be underway."), { statusCode: 409 });
  }
  if (context.stage === "POD_GENERATED") {
    throw Object.assign(new Error("Photographs cannot be replaced after the POD is generated."), { statusCode: 409 });
  }
  const existing = role === "LOADED_TRAILER" ? context.loaded : context.empty;
  if (existing) {
    throw Object.assign(new Error("This photograph is already stored and cannot be silently replaced."), { statusCode: 409 });
  }
  const evidenceId = randomUUID();
  const fileName = role === "LOADED_TRAILER" ? "loaded-trailer.jpg" : "empty-trailer.jpg";
  const notes = noteFor(role as CargoPhotoRole);
  const storageKey = await writeStoredFile(context.load.fleetId, evidenceId, fileName, decoded.bytes);
  await createLockedEvidence(context.load.id, notes, storageKey, (tx) =>
    tx.operationalEvidence.create({
      data: {
        id: evidenceId,
        fleet: { connect: { id: context.load.fleetId } },
        load: { connect: { id: context.load.id } },
        ...(context.assignment
          ? {
              dispatchAssignment: { connect: { id: context.assignment.id } },
              equipment: { connect: { id: context.assignment.trailerEquipmentId ?? context.assignment.tractorEquipmentId } },
            }
          : {}),
        evidenceKind: "PHOTO",
        observationSource: "DRIVER",
        provenance: {
          epodRole: role,
          channel: "TABLET",
          serverReceivedAt: new Date().toISOString(),
          actorId: actor.id,
          gpsVerified: false,
        },
        storageKey,
        originalFileName: fileName,
        mimeType: decoded.mimeType,
        checksum: sha256(decoded.bytes),
        notes,
        capturedByUser: { connect: { id: actor.id } },
        ...(context.assignment ? { capturedByDriver: { connect: { id: context.assignment.driverId } } } : {}),
      },
    }),
  );
  return getEpod(actor, context.load.id);
}

export async function saveAcknowledgment(
  sessionUser: SessionUserLike | null | undefined,
  loadKey: string,
  body: {
    name: string;
    title: string;
    facility: string;
    disposition: string;
    exceptions: string;
    refusalReason: string;
    statementAccepted: boolean;
    channel: string;
    signaturePng: string;
    evidenceId?: string | null;
  },
) {
  if (!sessionUser?.id) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  const actor = sessionUser as SessionUserLike & { id: string };
  const context = await requireLoadContext(actor, loadKey, "drive");
  if (body.evidenceId) {
    const referenced = await prisma.operationalEvidence.findUnique({
      where: { id: body.evidenceId },
      select: { loadId: true },
    });
    if (referenced && referenced.loadId !== context.load.id) {
      throw Object.assign(new Error("A signature cannot be reassigned to another load."), { statusCode: 409 });
    }
  }
  const decoded = decodeImage(body.signaturePng, "image/png");
  const accepted = assertRecipientAcknowledgment({
    loadId: context.load.id,
    existingLoadId: context.signature?.loadId ?? null,
    name: body.name,
    title: body.title,
    facility: body.facility,
    disposition: body.disposition,
    exceptions: body.exceptions,
    refusalReason: body.refusalReason,
    statementAccepted: body.statementAccepted,
    channel: body.channel,
    signatureBytes: decoded.bytes,
    mimeType: "image/png",
    alreadyStored: false,
  });
  if (context.signature) {
    const stored = acknowledgmentFrom(context.signature);
    if (!stored || stored.disposition !== accepted.disposition) {
      throw Object.assign(new Error("A completed signature cannot be replaced."), { statusCode: 409 });
    }
    if (context.stage !== accepted.disposition) {
      await writeStage(context, actor, accepted.disposition);
      await recordDeliveryOutcome(actor, context, accepted, context.signature.capturedAt);
    }
    return getEpod(actor, context.load.id);
  }
  assertDeliveryTransition(context.stage, accepted.disposition);
  const evidenceId = randomUUID();
  const notes = noteFor("RECIPIENT_SIGNATURE");
  const storageKey = await writeStoredFile(context.load.fleetId, evidenceId, "recipient-signature.png", decoded.bytes);
  const receivedAt = new Date();
  await createLockedEvidence(context.load.id, notes, storageKey, (tx) =>
    tx.operationalEvidence.create({
      data: {
        id: evidenceId,
        fleet: { connect: { id: context.load.fleetId } },
        load: { connect: { id: context.load.id } },
        ...(context.assignment ? { dispatchAssignment: { connect: { id: context.assignment.id } } } : {}),
        evidenceKind: "PHOTO",
        observationSource: "OTHER",
        observationValue: { ...accepted, receivedAt: receivedAt.toISOString(), actorId: actor.id },
        provenance: {
          epodRole: "RECIPIENT_SIGNATURE",
          channel: "TABLET",
          authority: "SELF_DECLARED",
          sessionActorId: actor.id,
          serverReceivedAt: receivedAt.toISOString(),
          actorId: actor.id,
        },
        storageKey,
        originalFileName: "recipient-signature.png",
        mimeType: "image/png",
        checksum: sha256(decoded.bytes),
        notes,
        capturedAt: receivedAt,
        capturedByUser: { connect: { id: actor.id } },
      },
    }),
  );
  await writeStage(context, actor, accepted.disposition);
  await recordDeliveryOutcome(actor, context, accepted, receivedAt);
  return getEpod(actor, context.load.id);
}

async function recordDeliveryOutcome(
  actor: SessionUserLike & { id: string },
  context: Awaited<ReturnType<typeof requireLoadContext>>,
  accepted: { disposition: string; facility: string; refusalReason: string; exceptions: string },
  deliveredAt: Date,
) {
  const deliveryStatus =
    accepted.disposition === "ACCEPTED" ? "DELIVERED" : accepted.disposition === "REFUSED" ? "UNDELIVERED" : "DELIVERY_EXCEPTION";
  await recordLoadDelivery(getOperatingProcessStore(), actor, {
    fleetId: context.load.fleetId,
    loadId: context.load.id,
    status: deliveryStatus,
    deliveredAt,
    deliveryLocation: accepted.facility,
    exceptionStatus: accepted.refusalReason || accepted.exceptions || null,
    idempotencyKey: `bof:epod-delivery:${context.load.id}`,
    lineage: {
      lifecycleClass: "LIVE",
      originKind: "BOF_CREATED",
      verificationClass: "UNVERIFIED",
      derivationKind: "SOURCE",
      sourceSystem: "BOF",
      sourceRecordId: `epod-delivery:${context.load.id}`,
    },
  });
}

export async function generateEpod(sessionUser: SessionUserLike | null | undefined, loadKey: string) {
  if (!sessionUser?.id) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  const actor = sessionUser as SessionUserLike & { id: string };
  const context = await requireLoadContext(actor, loadKey, "drive");
  const view = toView(context);
  if (context.generated) {
    if (view.stage !== "POD_GENERATED") {
      assertEpodReady(view);
      assertDeliveryTransition(context.stage, "POD_GENERATED");
      await writeStage(context, actor, "POD_GENERATED");
    }
    const linked = context.proofs.some(
      (proof) => proof.evidenceId === context.generated?.id && (proof.status === "RECEIVED" || proof.status === "VERIFIED"),
    );
    if (!linked && context.generated.id) {
      await submitReceivedLoadProof(actor, context.load.id, "POD", context.generated.id);
    }
    return {
      view: view.stage === "POD_GENERATED" ? view : { ...view, stage: "POD_GENERATED" as const },
      duplicate: true as const,
      proofVerified: false as const,
      settlementHoldChanged: false as const,
    };
  }
  assertEpodReady(view);
  assertDeliveryTransition(context.stage, "POD_GENERATED");
  const evidenceId = randomUUID();
  const notes = noteFor("GENERATED_POD");
  const body = Buffer.from(JSON.stringify({ ...view, generatedEvidenceId: evidenceId, proofVerified: false, gpsVerified: false, rfidVerified: false }));
  const storageKey = await writeStoredFile(context.load.fleetId, evidenceId, "electronic-pod.json", new Uint8Array(body));
  await createLockedEvidence(context.load.id, notes, storageKey, (tx) =>
    tx.operationalEvidence.create({
      data: {
        id: evidenceId,
        fleet: { connect: { id: context.load.fleetId } },
        load: { connect: { id: context.load.id } },
        evidenceKind: "DOCUMENT",
        observationSource: "SYSTEM",
        provenance: {
          epodRole: "GENERATED_POD",
          loadedEvidenceId: view.loadedTrailer.evidenceId,
          emptyEvidenceId: view.emptyTrailer.evidenceId,
          signatureEvidenceId: view.acknowledgment?.evidenceId ?? null,
          gpsVerified: false,
          rfidVerified: false,
        },
        storageKey,
        originalFileName: "electronic-pod.json",
        mimeType: "application/json",
        checksum: sha256(new Uint8Array(body)),
        notes,
        capturedByUser: { connect: { id: actor.id } },
      },
    }),
  );
  const proof = await submitReceivedLoadProof(actor, context.load.id, "POD", evidenceId);
  await writeStage(context, actor, "POD_GENERATED");
  return {
    view: (await getEpod(actor, context.load.id)).view,
    duplicate: proof.duplicate,
    proofId: proof.proof.id,
    proofStatus: proof.proof.status,
    proofVerified: false as const,
    settlementHoldChanged: false as const,
  };
}

export async function openEpodEvidence(
  sessionUser: SessionUserLike | null | undefined,
  loadKey: string,
  evidenceId: string,
) {
  if (!sessionUser?.id) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  const context = await requireLoadContext(sessionUser, loadKey, "read");
  const evidence = await prisma.operationalEvidence.findFirst({
    where: { id: evidenceId, fleetId: context.load.fleetId, loadId: context.load.id },
  });
  if (!evidence?.storageKey) throw Object.assign(new Error("Evidence not found."), { statusCode: 404 });
  const bytes = await readStoredEvidenceFile(evidence.storageKey);
  return { bytes, mimeType: evidence.mimeType || "application/octet-stream" };
}
