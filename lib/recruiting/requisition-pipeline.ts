/**
 * Requisition fill tracking: how many of the requested positions are in process, screened,
 * interviewed, offered, accepted and activated, and the requisition's recruiting pipeline state.
 * Pure: shared by the signed-in workspace and the public demonstration.
 */

export type PipelineCandidateFacts = {
  dispositionStatus: "ACTIVE" | "REJECTED" | "WITHDRAWN";
  applicationStatus: string;
  interviewCompleted: boolean;
  offerStatus: string;
  activationStatus: string;
};

export type RequisitionPipelineCounts = {
  requested: number;
  candidates: number;
  inProcess: number;
  screened: number;
  interviewed: number;
  offered: number;
  accepted: number;
  activated: number;
  rejected: number;
  remaining: number;
};

export type RecruitingPipelineState = "NOT_OPEN" | "READY_FOR_RECRUITING" | "RECRUITING" | "PARTIALLY_FILLED" | "FILLED";

export function requisitionPipelineCounts(requested: number, candidates: PipelineCandidateFacts[]): RequisitionPipelineCounts {
  const active = candidates.filter((c) => c.dispositionStatus === "ACTIVE");
  const activated = candidates.filter((c) => c.activationStatus === "ACTIVE").length;
  return {
    requested,
    candidates: candidates.length,
    inProcess: active.filter((c) => c.activationStatus !== "ACTIVE").length,
    screened: candidates.filter((c) => c.applicationStatus === "COMPLETE" || c.applicationStatus === "READY").length,
    interviewed: candidates.filter((c) => c.interviewCompleted).length,
    offered: candidates.filter((c) => ["SENT", "ACCEPTED", "DECLINED"].includes(c.offerStatus)).length,
    accepted: candidates.filter((c) => c.offerStatus === "ACCEPTED").length,
    activated,
    rejected: candidates.filter((c) => c.dispositionStatus !== "ACTIVE").length,
    remaining: Math.max(0, requested - activated),
  };
}

/** Pipeline state of an approved requisition, from its candidates. Unapproved requisitions keep NOT_OPEN. */
export function recruitingPipelineState(approved: boolean, counts: RequisitionPipelineCounts): RecruitingPipelineState {
  if (!approved) return "NOT_OPEN";
  if (counts.requested > 0 && counts.activated >= counts.requested) return "FILLED";
  if (counts.activated > 0) return "PARTIALLY_FILLED";
  if (counts.candidates > 0) return "RECRUITING";
  return "READY_FOR_RECRUITING";
}
