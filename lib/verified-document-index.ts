import {
  getOperationsFileCabinetItems,
  type OperationsFileCabinetItem,
} from "@/lib/operations-file-cabinet";

export type VerifiedDocumentKind =
  | "generated_html"
  | "pdf"
  | "app_route"
  | "external"
  | "missing"
  | "coming_soon"
  | "needs_review";

export type CanonicalDocumentRecord = {
  id: string;
  title: string;
  description: string;
  href?: string;
  kind: VerifiedDocumentKind;
  fileType?: "HTML" | "PDF";
  category: OperationsFileCabinetItem["category"];
  type: OperationsFileCabinetItem["type"];
  audience: OperationsFileCabinetItem["audience"];
  status: OperationsFileCabinetItem["status"];
  sourceAuthenticity: OperationsFileCabinetItem["sourceAuthenticity"];
  documentOwner: OperationsFileCabinetItem["documentOwner"];
  section?: OperationsFileCabinetItem["section"];
  isBlankTemplate?: boolean;
  isCompletedSample?: boolean;
  canonicalKey: string;
  previewMode: "direct" | "viewer" | "external" | "unavailable";
};

export const FEATURED_DOCUMENT_DEFINITIONS = [
  ["driver-cdl-canonical", "CDL", "Driver Qualification Files", "/generated/drivers/DRV-001/cdl.html", "driver"],
  ["driver-medical-canonical", "Medical Card", "Driver Qualification Files", "/generated/drivers/DRV-001/medical-card.html", "driver"],
  ["driver-mvr-canonical", "MVR", "Driver Qualification Files", "/generated/drivers/DRV-001/mvr.html", "driver"],
  ["driver-fmcsa-canonical", "FMCSA Clearinghouse", "Driver Qualification Files", "/generated/drivers/DRV-001/fmcsa_clearinghouse.html", "driver"],
  ["driver-i9-canonical", "I-9", "Driver Qualification Files", "/generated/drivers/DRV-001/i9.html", "driver"],
  ["driver-w9-canonical", "W-9", "Driver Qualification Files", "/generated/drivers/DRV-001/w9.html", "driver"],
  ["master-agreement-canonical", "Master Agreement", "Contracts / Customer / Legal", "/generated/agreements/DAT-MSA-001/delta-advanced-trucking-master-services-agreement.pdf", "load"],
  ["work-order-canonical", "Work Order", "Dispatch & Load Operations", "/documents/template-packs/view?templateId=service-schedule-work-order&entityId=L001&returnTo=%2Fdocuments", "load"],
  ["rate-confirmation-canonical", "Rate Confirmation", "Dispatch & Load Operations", "/generated/loads/L001/rate-confirmation.html", "load"],
  ["bol-canonical", "Bill of Lading", "Dispatch & Load Operations", "/generated/loads/L001/bol.html", "load"],
  ["pod-canonical", "Proof of Delivery", "Dispatch & Load Operations", "/generated/loads/L001/pod.html", "load"],
  ["safety-policy-canonical", "Safety Compliance Policy", "Policies & SOPs", "/generated/company-operations-vault/10-safety-compliance-governance-policy.html", "policy"],
  ["claims-escalation-canonical", "Claims / Escalation SOP", "Safety / Claims / Insurance", "/generated/company-operations-vault/DAT_SOP_CLM_001_Rev3_1.pdf", "policy"],
  ["employee-handbook-canonical", "Employee Handbook", "HR / Talent / Performance", "/generated/company-operations-vault/01-employee-handbook-template.html", "policy"],
  ["ai-governance-canonical", "AI Use & Automation Governance", "Policies & SOPs", "/generated/company-operations-vault/17-ai-use-and-automation-governance-policy.html", "policy"],
] as const;

type FeaturedDefinition = (typeof FEATURED_DOCUMENT_DEFINITIONS)[number];

function isAppRoute(href: string): boolean {
  return href.startsWith("/documents/") || href.startsWith("/drivers/") || href.startsWith("/dispatch/") || href.startsWith("/portals/");
}

function classifyHref(href: string | undefined, item: OperationsFileCabinetItem): VerifiedDocumentKind {
  if (item.status === "coming_soon") return "coming_soon";
  if (item.status === "needs_review") return "needs_review";
  if (!href) return "missing";
  if (/^https?:\/\//i.test(href)) return "external";
  if (isAppRoute(href)) return "app_route";
  if (!href.startsWith("/")) return "missing";

  return href.toLowerCase().endsWith(".pdf") ? "pdf" : "generated_html";
}

function previewMode(kind: VerifiedDocumentKind): CanonicalDocumentRecord["previewMode"] {
  if (kind === "generated_html" || kind === "pdf") return "direct";
  if (kind === "app_route") return "viewer";
  if (kind === "external") return "external";
  return "unavailable";
}

function toRecord(item: OperationsFileCabinetItem, kind: VerifiedDocumentKind, canonicalKey = item.id): CanonicalDocumentRecord {
  const href = item.href;
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    href,
    kind,
    fileType: kind === "pdf" ? "PDF" : kind === "generated_html" ? "HTML" : undefined,
    category: item.category,
    type: item.type,
    audience: item.audience,
    status: item.status,
    sourceAuthenticity: item.sourceAuthenticity,
    documentOwner: item.documentOwner,
    section: item.section,
    isBlankTemplate: item.isBlankTemplate,
    isCompletedSample: item.isCompletedSample,
    canonicalKey,
    previewMode: previewMode(kind),
  };
}

export async function buildVerifiedDocumentIndex(): Promise<CanonicalDocumentRecord[]> {
  return getOperationsFileCabinetItems().map((item) => toRecord(item, classifyHref(item.href, item)));
}

export async function buildFeaturedDocumentIndex(): Promise<CanonicalDocumentRecord[]> {
  const registry = getOperationsFileCabinetItems();
  const records: CanonicalDocumentRecord[] = [];
  for (const [id, title, category, href, group] of FEATURED_DOCUMENT_DEFINITIONS as readonly FeaturedDefinition[]) {
    const registryItem = registry.find((item) => item.title.toLowerCase().includes(title.toLowerCase().split(" ")[0]));
    const base: OperationsFileCabinetItem = registryItem ?? {
      id,
      title,
      category: category as OperationsFileCabinetItem["category"],
      cabinet: category as OperationsFileCabinetItem["cabinet"],
      section: "Completed Demo Samples",
      type: group === "driver" ? "driver-file" : group === "policy" ? "policy" : "template",
      audience: ["manager", "owner"],
      status: "available",
      description: `Verified BOF ${title} document.`,
      href,
      sourceAuthenticity: "generated_from_template",
      documentOwner: "employer",
      employerName: "Delta Advanced Trucking, Inc.",
    };
    const kind = classifyHref(href, { ...base, href, status: "available" });
    records.push(toRecord({
      ...base,
      id,
      title,
      href,
      status: "available",
      sourceAuthenticity: "generated_from_template",
      isBlankTemplate: false,
      isCompletedSample: false,
    }, kind, id));
  }
  return records.filter((record) => record.kind !== "missing");
}
