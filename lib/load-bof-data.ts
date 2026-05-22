/**
 * Static seed from `demo-data.json` (build-time import). Use for server-only surfaces:
 * `generateStaticParams`, API routes that mirror build output, and the initial seed passed
 * into `BofDemoDataProvider`.
 *
 * Interactive demo UI under `(bof)` should read live rows via `useBofDemoData()` after
 * `BofDemoDataShell` hydrates from localStorage (dashboard, command center, drivers,
 * documents, money at risk, loads, RF actions, settlement drawer proof review, etc.).
 */
import raw from "./demo-data.json";
import { reconcileBofSourceOfTruth } from "@/lib/bof-source-of-truth";
import type { BofLoadEvidence } from "@/lib/canonical-load-evidence";

/** Runtime-only demo dispatch blocker acknowledgements (persisted with demo data in localStorage). */
export type DriverDispatchBlockerOverrideRow = {
  resolvedReasonIds: string[];
  resolvedAt: string;
  resolvedBy: "demo-editor";
  note?: string;
};

/** Demo-only “reviewed” markers for non-dispatch issues (persisted with demo data in localStorage). */
export type DriverReviewOverrideRow = {
  resolvedIssueIds: string[];
  resolvedAt: string;
  resolvedBy: "demo-editor";
  note?: string;
};

/** Runtime credential edits from Safety expirations / demo editors (localStorage only). */
export type DriverCredentialOverrideRow = {
  medicalCardExpirationDate?: string;
  cdlExpirationDate?: string;
  mvrReviewDate?: string;
  updatedAt: string;
  updatedBy: "demo-editor";
};

export type BofData = typeof raw & {
  driverDispatchBlockerOverrides?: Record<string, DriverDispatchBlockerOverrideRow>;
  driverReviewOverrides?: Record<string, DriverReviewOverrideRow>;
  /** Demo-only DQF row marks (`dqf:${canonicalType}` ids), keyed by driverId — does not remove real missing/expired signals */
  documentReviewOverrides?: Record<string, DriverReviewOverrideRow>;
  driverCredentialOverrides?: Record<string, DriverCredentialOverrideRow>;
  /** Canonical settlement->load link adapter (typed sidecar when settlement rows do not include loadId). */
  settlementLoadLinks?: Record<string, string>;
  /** Canonical load evidence rows keyed by load id. */
  loadEvidenceRecords?: Record<string, BofLoadEvidence[]>;
};

let reconciledSeed: BofData | null = null;

export function getBofData(): BofData {
  if (reconciledSeed) return reconciledSeed;
  reconciledSeed = reconcileBofSourceOfTruth(raw as BofData);
  return reconciledSeed;
}
