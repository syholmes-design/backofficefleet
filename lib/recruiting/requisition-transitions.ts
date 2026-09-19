export const REQUISITION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "ON_HOLD",
  "CANCELLED",
  "FILLED",
] as const;

export type RequisitionStatusValue = (typeof REQUISITION_STATUSES)[number];

export const REQUISITION_APPROVAL_ROLES = [
  "REQUESTING_MANAGER",
  "FLEET_SAFETY_DIRECTOR",
  "FLEET_OWNER_GM",
  "BOF_ACCOUNT_MANAGER",
  "BOF_HR_REVIEW",
] as const;

export type RequisitionApprovalRoleValue = (typeof REQUISITION_APPROVAL_ROLES)[number];

export const REQUISITION_ACTIONS = ["submit", "review", "approve", "hold", "cancel", "fill"] as const;
export type RequisitionAction = (typeof REQUISITION_ACTIONS)[number];

const transitionMap: Record<RequisitionStatusValue, Partial<Record<RequisitionAction, RequisitionStatusValue>>> = {
  DRAFT: { submit: "SUBMITTED", cancel: "CANCELLED" },
  SUBMITTED: { review: "UNDER_REVIEW", hold: "ON_HOLD", cancel: "CANCELLED" },
  UNDER_REVIEW: { approve: "APPROVED", hold: "ON_HOLD", cancel: "CANCELLED" },
  APPROVED: { hold: "ON_HOLD", cancel: "CANCELLED", fill: "FILLED" },
  ON_HOLD: { review: "UNDER_REVIEW", approve: "APPROVED", cancel: "CANCELLED" },
  CANCELLED: {},
  FILLED: {},
};

export function isRequisitionStatus(value: string): value is RequisitionStatusValue {
  return (REQUISITION_STATUSES as readonly string[]).includes(value);
}

export function getRequisitionTransitionError(current: RequisitionStatusValue, action: RequisitionAction): string | null {
  const next = transitionMap[current]?.[action];
  if (!next) {
    return `Illegal Requisition transition: ${action} is not allowed from ${current}`;
  }
  return null;
}

export function nextRequisitionStatus(current: RequisitionStatusValue, action: RequisitionAction): RequisitionStatusValue {
  const next = transitionMap[current]?.[action];
  if (!next) {
    throw Object.assign(new Error(`Illegal Requisition transition: ${action} is not allowed from ${current}`), { statusCode: 422 });
  }
  return next;
}

export function isCdlRequisition(cdlClass: string | null | undefined): boolean {
  return Boolean(cdlClass && cdlClass.trim());
}

export function requiredApprovalRoles(cdlClass: string | null | undefined): RequisitionApprovalRoleValue[] {
  const roles: RequisitionApprovalRoleValue[] = [
    "REQUESTING_MANAGER",
    "FLEET_OWNER_GM",
    "BOF_ACCOUNT_MANAGER",
    "BOF_HR_REVIEW",
  ];
  if (isCdlRequisition(cdlClass)) {
    roles.splice(1, 0, "FLEET_SAFETY_DIRECTOR");
  }
  return roles;
}

export type ApprovalLike = { approvalRole: string; decision: string };

export function missingApprovalsForApprove(
  cdlClass: string | null | undefined,
  approvals: ApprovalLike[],
): RequisitionApprovalRoleValue[] {
  const required = requiredApprovalRoles(cdlClass);
  return required.filter((role) => !approvals.some((row) => row.approvalRole === role && row.decision === "APPROVED"));
}

export const SUBMIT_REQUIRED_FIELDS = ["positionTitle", "numberOfPositions"] as const;

export function getSubmitFieldErrors(input: {
  positionTitle?: string | null;
  numberOfPositions?: number | null;
  targetStartDate?: Date | string | null;
}): string[] {
  const errors: string[] = [];
  if (!input.positionTitle || !input.positionTitle.trim()) {
    errors.push("Position title is required to submit");
  }
  if (!input.numberOfPositions || input.numberOfPositions < 1) {
    errors.push("Number of positions must be at least 1");
  }
  if (!input.targetStartDate) {
    errors.push("Target start date is required to submit");
  }
  return errors;
}

export function rolesAllowedToRecordApproval(approvalRole: RequisitionApprovalRoleValue): string[] {
  switch (approvalRole) {
    case "REQUESTING_MANAGER":
      return ["FLEET_MANAGER", "FLEET_ADMIN", "FLEET_OPERATIONS", "BOF_OPERATIONS"];
    case "FLEET_SAFETY_DIRECTOR":
      return ["FLEET_ADMIN", "BOF_COMPLIANCE_REVIEW", "BOF_OPERATIONS"];
    case "FLEET_OWNER_GM":
      return ["FLEET_ADMIN", "BOF_OPERATIONS"];
    case "BOF_ACCOUNT_MANAGER":
      return ["BOF_OPERATIONS"];
    case "BOF_HR_REVIEW":
      return ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW"];
    default:
      return [];
  }
}

export function canPerformWorkflowAction(action: RequisitionAction, roleCodes: string[]): boolean {
  const fleetStaff = ["FLEET_MANAGER", "FLEET_ADMIN", "FLEET_OPERATIONS", "DISPATCH", "BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW"];
  const reviewers = ["FLEET_ADMIN", "FLEET_MANAGER", "BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW"];
  const closers = ["FLEET_ADMIN", "FLEET_MANAGER", "BOF_OPERATIONS"];
  switch (action) {
    case "submit":
    case "cancel":
      return roleCodes.some((code) => fleetStaff.includes(code));
    case "review":
    case "hold":
      return roleCodes.some((code) => reviewers.includes(code));
    case "approve":
    case "fill":
      return roleCodes.some((code) => closers.includes(code));
    default:
      return false;
  }
}
