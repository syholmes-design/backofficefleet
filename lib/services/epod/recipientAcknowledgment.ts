import { assertSignatureHasInk } from "@/lib/services/epod/signatureInk";

export const ACK_STATEMENT =
  "I represent the receiving facility named here and I am authorized to acknowledge this delivery.";

export const DISPOSITIONS = ["ACCEPTED", "ACCEPTED_WITH_EXCEPTIONS", "REFUSED"] as const;
export type DeliveryDisposition = (typeof DISPOSITIONS)[number];

const MAX_BYTES = 2 * 1024 * 1024;

export function assertRecipientAcknowledgment(input: {
  loadId: string;
  existingLoadId?: string | null;
  name: string;
  title: string;
  facility: string;
  disposition: string;
  exceptions: string;
  refusalReason: string;
  statementAccepted: boolean;
  channel: string;
  signatureBytes: Uint8Array;
  mimeType: string;
  alreadyStored: boolean;
}) {
  if (input.alreadyStored) {
    throw Object.assign(new Error("A completed signature cannot be replaced."), { statusCode: 409 });
  }
  if (input.existingLoadId && input.existingLoadId !== input.loadId) {
    throw Object.assign(new Error("A signature cannot be reassigned to another load."), { statusCode: 409 });
  }
  if (input.channel.trim().toUpperCase() !== "TABLET") {
    throw Object.assign(new Error("Customer portal signing is not authorized."), { statusCode: 403 });
  }
  if (!input.statementAccepted) {
    throw Object.assign(new Error("The receiving acknowledgment statement is required."), { statusCode: 422 });
  }
  const name = input.name.trim();
  const title = input.title.trim();
  const facility = input.facility.trim();
  if (!name || !title || !facility) {
    throw Object.assign(new Error("Recipient name, title, and facility are required."), { statusCode: 422 });
  }
  if (!DISPOSITIONS.includes(input.disposition as DeliveryDisposition)) {
    throw Object.assign(new Error("Delivery disposition is not supported."), { statusCode: 422 });
  }
  const disposition = input.disposition as DeliveryDisposition;
  const exceptions = input.exceptions.trim();
  const refusalReason = input.refusalReason.trim();
  if (disposition === "ACCEPTED_WITH_EXCEPTIONS" && !exceptions) {
    throw Object.assign(new Error("Exception description is required."), { statusCode: 422 });
  }
  if (disposition === "REFUSED" && !refusalReason) {
    throw Object.assign(new Error("Refusal reason is required."), { statusCode: 422 });
  }
  if (disposition === "ACCEPTED" && (exceptions || refusalReason)) {
    throw Object.assign(new Error("An accepted delivery cannot include a shortage or refusal."), { statusCode: 422 });
  }
  const mimeType = input.mimeType.trim().toLowerCase();
  if (mimeType !== "image/png" || /https?:\/\//i.test(mimeType)) {
    throw Object.assign(new Error("Signature must be a PNG captured in BOF."), { statusCode: 422 });
  }
  if (input.signatureBytes.byteLength <= 0 || input.signatureBytes.byteLength > MAX_BYTES) {
    throw Object.assign(new Error("Signature image is missing or too large."), { statusCode: 422 });
  }
  assertSignatureHasInk(input.signatureBytes);
  return {
    name,
    title,
    facility,
    disposition,
    exceptions: disposition === "ACCEPTED_WITH_EXCEPTIONS" ? exceptions : "",
    refusalReason: disposition === "REFUSED" ? refusalReason : "",
    statement: ACK_STATEMENT,
    channel: "TABLET" as const,
    authority: "SELF_DECLARED" as const,
  };
}
