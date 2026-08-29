export type BofTrainingOwnership = "FMCSA" | "BOF_INTERNAL";
export type BofTrainingAssignmentStatus = "RECOMMENDED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "REVIEW_REQUIRED";

export type BofTrainingKnowledgeCheck = {
  question: string;
  answers: string[];
  correctAnswer?: string;
};

export type BofTrainingModule = {
  trainingId: string;
  title: string;
  category: string;
  ownership: BofTrainingOwnership;
  fmcsaTopic?: string;
  bofPolicyTopic?: string;
  description: string;
  audience: string;
  resourceUrl: string;
  resourceLabel: string;
  required: boolean;
  completionRequirements: string[];
  version: string;
  effectiveDate: string;
  knowledgeCheck?: BofTrainingKnowledgeCheck[];
};

export type BofTrainingAssignment = {
  assignmentId: string;
  trainingId: string;
  driverId?: string;
  safetyEventId?: string;
  resolutionId?: string;
  reason: string;
  assignedBy?: string;
  dueDate?: string;
  priority: "STANDARD" | "HIGH";
  status: BofTrainingAssignmentStatus;
  completedAt?: string;
  supervisorReview?: "PENDING" | "ACCEPTED" | "ADDITIONAL_COACHING_REQUIRED";
};

export const BOF_TRAINING_LIBRARY: readonly BofTrainingModule[] = [
  {
    trainingId: "fmcsa-cargo-securement",
    title: "Cargo Securement Rules",
    category: "Cargo securement",
    ownership: "FMCSA",
    fmcsaTopic: "Cargo securement",
    description: "Official FMCSA cargo securement guidance for drivers and operations teams.",
    audience: "Drivers and safety operations",
    resourceUrl: "https://www.fmcsa.dot.gov/regulations/cargo-securement/cargo-securement-rules",
    resourceLabel: "Open FMCSA guidance",
    required: false,
    completionRequirements: ["Review the external FMCSA resource"],
    version: "external-current",
    effectiveDate: "2026-05-21",
  },
  {
    trainingId: "bof-hos-coaching",
    title: "HOS Planning and Break Management",
    category: "Hours of service",
    ownership: "BOF_INTERNAL",
    bofPolicyTopic: "HOS and fatigue planning",
    description: "BOF coaching module for documenting break planning, fatigue follow-up, and next-dispatch review.",
    audience: "Drivers, supervisors, and safety operations",
    resourceUrl: "/generated/company-operations-vault/hr-templates/driver-coaching-corrective-action-form.html",
    resourceLabel: "Open BOF coaching form",
    required: true,
    completionRequirements: ["Review coaching requirements", "Submit driver acknowledgment", "Pass knowledge check"],
    version: "1.0",
    effectiveDate: "2026-05-21",
    knowledgeCheck: [
      {
        question: "Who verifies completion before a related resolution can close?",
        answers: ["The driver alone", "A supervisor or safety reviewer", "The customer"],
        correctAnswer: "A supervisor or safety reviewer",
      },
    ],
  },
  {
    trainingId: "bof-pretrip-securement",
    title: "Pre-Trip Securement Verification",
    category: "Pre-trip and equipment",
    ownership: "BOF_INTERNAL",
    bofPolicyTopic: "Pre-trip inspection and cargo securement",
    description: "BOF process for attaching securement proof, acknowledgment, and exception context before dispatch.",
    audience: "Drivers and dispatch operations",
    resourceUrl: "/safety",
    resourceLabel: "Review BOF Safety workflow",
    required: true,
    completionRequirements: ["Review securement checklist", "Attach required proof", "Acknowledge the dispatch gate"],
    version: "1.0",
    effectiveDate: "2026-05-21",
  },
];

export function trainingModulesForSafetyEvent(eventLabel: string): BofTrainingModule[] {
  const label = eventLabel.toLowerCase();
  return BOF_TRAINING_LIBRARY.filter((module) => {
    if (label.includes("hos") || label.includes("hours") || label.includes("fatigue")) {
      return module.trainingId === "bof-hos-coaching";
    }
    if (label.includes("cargo") || label.includes("securement") || label.includes("damage")) {
      return ["fmcsa-cargo-securement", "bof-pretrip-securement"].includes(module.trainingId);
    }
    if (label.includes("tire") || label.includes("pre-trip") || label.includes("inspection")) {
      return module.trainingId === "bof-pretrip-securement";
    }
    return false;
  });
}

export function recommendTrainingForSafetyEvent(event: {
  eventId: string;
  driverId: string;
  eventType: string;
  linkedLoadId?: string;
}): BofTrainingAssignment[] {
  return trainingModulesForSafetyEvent(event.eventType).map((module) => ({
    assignmentId: `recommendation:${event.eventId}:${module.trainingId}`,
    trainingId: module.trainingId,
    driverId: event.driverId,
    safetyEventId: event.eventId,
    resolutionId: `safety:${event.eventId}`,
    reason: `Recommended because of Safety event ${event.eventId}${event.linkedLoadId ? ` on load ${event.linkedLoadId}` : ""}.`,
    priority: module.ownership === "BOF_INTERNAL" ? "HIGH" : "STANDARD",
    status: "RECOMMENDED",
  }));
}