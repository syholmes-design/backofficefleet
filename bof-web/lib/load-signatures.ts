/**
 * Load document signature contracts for the BOF demo.
 *
 * **Canonical implementation** (placeholder values injected at generation time):
 * `scripts/lib/load-signatures.mjs` — keep in sync when adding roles or documents.
 */

export type LoadSignatureRole =
  | "driver"
  | "shipper"
  | "receiver"
  | "dispatcher"
  | "claims"
  | "billing"
  | "carrier"
  | "broker"
  | "settlements";

export type LoadSignatureStatus = "signed" | "pending" | "not_required";

export type LoadSignatureSlot = {
  role: LoadSignatureRole;
  name: string;
  title?: string;
  signedAt?: string;
  signatureText?: string;
  signatureSvgDataUri?: string;
  status: LoadSignatureStatus;
};
