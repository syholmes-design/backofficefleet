import type { OperationalIntelligenceContext } from "@/lib/operational-intelligence/types";

export type OperationalIntent =
  | "SETTLEMENT_HOLDS"
  | "DRIVER_READINESS"
  | "LOADS_AT_RISK"
  | "MISSING_DOCUMENTS"
  | "OPEN_EXCEPTIONS"
  | "LOAD_LIFECYCLE"
  | "LOAD_FINANCE"
  | "LOAD_STATUS"
  | "PAYROLL_STATUS"
  | "TELEMATICS"
  | "GENERAL_HELP";

const LOAD_REF = /\b(L\d{3,4}|load[\s-]?[a-z0-9_-]{4,})\b/i;

export function extractLoadReference(question: string, context?: OperationalIntelligenceContext) {
  if (context?.loadId) return context.loadId;
  if (context?.recordType === "LOAD" && context.recordId) return context.recordId;
  const match = question.match(LOAD_REF);
  if (!match) return null;
  return match[1].toUpperCase().startsWith("LOAD") ? match[1].replace(/^load[\s-]?/i, "") : match[1].toUpperCase();
}

export function classifyOperationalIntent(question: string): OperationalIntent {
  const q = question.trim().toLowerCase();
  if (!q) return "GENERAL_HELP";
  if (/payroll|pay run|pay period/.test(q)) return "PAYROLL_STATUS";
  if (/gps|telematics|where is (the )?(truck|driver|tractor)|location of/.test(q)) return "TELEMATICS";
  if (/settlement.*hold|hold.*settlement|why.*hold|money at risk/.test(q)) return "SETTLEMENT_HOLDS";
  if (/not dispatch.?ready|dispatch.?ready|who (can|cannot) dispatch|drivers? not ready/.test(q)) return "DRIVER_READINESS";
  if (/at risk|deliver(y|ies) (at )?risk|late load|loads? (at )?risk/.test(q)) return "LOADS_AT_RISK";
  if (/missing doc|document(s)? missing|dqf|credential/.test(q)) return "MISSING_DOCUMENTS";
  if (/exception|unresolved|open issue|condition thread/.test(q)) return "OPEN_EXCEPTIONS";
  if (/pod|proof of delivery|invoice|finance handoff|delivery evidence|load to cash|settlement on load/.test(q)) return "LOAD_FINANCE";
  if (/lifecycle|what happened|history|timeline|status of load/.test(q)) return "LOAD_LIFECYCLE";
  if (/status of|where is.*load|find load/.test(q)) return "LOAD_STATUS";
  return "GENERAL_HELP";
}
