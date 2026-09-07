/**
 * Customer Copilot Advocate — domain reasoning over customer-visible BOF facts.
 * Does not create a customer master, portal, packet, intake, or permission engine.
 */

import type { BofData } from "@/lib/load-bof-data";
import {
  DEMO_CUSTOMER_PROFILE,
  PORTAL_VISIBILITY,
  getCustomerPortalProfile,
  getCustomerVisibleLoads,
} from "@/lib/demo-portals";
import { buildLoadPacketRegistry, type LoadPacketItem } from "@/lib/load-artifact-registry";
import type { V3OperationalData } from "@/lib/v3-operational-types";
import {
  classifyCopilotCause,
  type CopilotAdvocateView,
  type CopilotConflict,
  type CopilotFact,
  type CopilotGuidanceItem,
  type CopilotInterpretation,
  type CopilotPriorityBand,
  type CopilotScope,
} from "@/lib/copilot/copilot-shared";

const LIST_CAP = 6;
const CUSTOMER_PORTAL_HREF = "/portals/customer";
const CUSTOMER_WORKSPACE_HREF = "/customer-portal";
const WALKTHROUGH_SHIPMENT = "SHP-86240-DAL-MEM / BOF-LD-86240";

function idKey(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function recordedCustomerName(load: { customerName?: unknown } | undefined): string {
  return typeof load?.customerName === "string" ? load.customerName.trim() : "";
}

function customerVisiblePacketItems(item: LoadPacketItem): boolean {
  return item.visibility.includes("customer");
}

function listScopedLoads(data: BofData, scope?: CopilotScope) {
  const visible = getCustomerVisibleLoads(data);
  const scoped = idKey(scope?.loadId);
  if (!scoped) return visible;
  return visible.filter((row) => row.loadId === scoped);
}

function derivedPriority(load: BofData["loads"][number]): CopilotPriorityBand {
  if (load.sealStatus === "Mismatch" || load.dispatchExceptionFlag) return "hold_or_block";
  if (!/verified|complete/i.test(String(load.podStatus ?? ""))) return "review";
  return "monitor";
}

export function buildCustomerCopilotAdvocateView(args: {
  data: BofData;
  v3: V3OperationalData | null;
  scope?: CopilotScope;
}): CopilotAdvocateView {
  const customerVisibility = PORTAL_VISIBILITY.customer;
  const profile = getCustomerPortalProfile(args.data);
  const visibleLoads = listScopedLoads(args.data, args.scope);
  const facts: CopilotFact[] = [];
  const interpretations: CopilotInterpretation[] = [];
  const conflicts: CopilotConflict[] = [];
  const guidance: CopilotGuidanceItem[] = [];
  const decisionSupport: CopilotInterpretation[] = [];
  const unsupported: string[] = [
    "Customer Copilot does not assign drivers or equipment, release loads, override readiness or safety, or alter settlement or dispatch state.",
    "PORTAL_VISIBILITY.customer restricts driver-hr, driver-payroll, internal-compliance, dispatch-operations, settlements, and company-documents. Copilot does not copy those internal fields merely because they exist on the load record.",
    `${WALKTHROUGH_SHIPMENT} on /customer-portal is a simulated browser walkthrough (REFERENCE / DEMO). Copilot does not join it to BOF fleet load IDs.`,
    "getCustomerVisibleLoads.eta is recorded as N/A. Copilot does not invent GPS or live tracking.",
    "Process Intelligence and Command Center remain internal operator surfaces. Copilot does not publish internal PI timelines to the customer.",
    "V3 operational workbooks are not a customer-visibility authority and are not consumed here.",
  ];

  const scopedMissing = idKey(args.scope?.loadId);
  if (scopedMissing && !args.data.loads.some((row) => row.id === scopedMissing)) {
    unsupported.unshift(
      `No canonical load exists for ${scopedMissing}. That is an honest empty, not a customer shipment status.`,
    );
  }

  facts.push({
    id: "fact-portal-profile-demo",
    domain: "Customer portal demo profile",
    source: "DEMO_CUSTOMER_PROFILE / getCustomerPortalProfile",
    sourceClass: "REFERENCE_DEMO",
    fact: `Demo portal header customerId=${profile.customerId} customerName=${profile.customerName}. This label is not a customer master and is not joined to every load.`,
    ...classifyCopilotCause({}),
  });

  const recordedNames = [...new Set(args.data.loads.map((row) => recordedCustomerName(row)).filter(Boolean))];
  if (recordedNames.length > 0 && !recordedNames.includes(DEMO_CUSTOMER_PROFILE.customerName)) {
    conflicts.push({
      id: "conflict-demo-profile-vs-recorded-name",
      claimClass: "AUTHORITATIVE_FACT",
      sources: [
        {
          name: "Demo customer portal profile",
          authority: "DEMO_CUSTOMER_PROFILE",
          statement: `Header customerName=${DEMO_CUSTOMER_PROFILE.customerName}.`,
        },
        {
          name: "Canonical load customerName",
          authority: "BOF load records",
          statement: `Recorded customerName values include ${recordedNames.slice(0, 4).join(", ")}.`,
        },
      ],
      explanation:
        "The demo portal header and canonical load customer names disagree. Copilot does not invent a customer file or overwrite either source.",
      owner: "Customer portal / Load File",
      resolutionLabel: "Open customer-visible shipments",
      href: `${CUSTOMER_PORTAL_HREF}#active-shipments`,
    });
  }

  for (const row of visibleLoads.slice(0, LIST_CAP)) {
    const load = args.data.loads.find((item) => item.id === row.loadId);
    if (!load) continue;
    const customerName = recordedCustomerName(load);
    const priority = derivedPriority(load);
    const spine = args.data.loadRelationshipSpine?.[load.id];
    const packet = buildLoadPacketRegistry(args.data, load.id);
    const customerPacket = packet?.packetItems.filter(customerVisiblePacketItems) ?? [];
    const internalPacket = packet?.packetItems.filter((item) => !customerVisiblePacketItems(item)) ?? [];

    if (customerName) {
      facts.push({
        id: `fact-customer-${load.id}`,
        domain: "Customer ↔ Load identity",
        source: `Canonical load record ${load.id}`,
        sourceClass: "AUTHORITATIVE",
        fact: `${load.id} recorded customerName=${customerName}.`,
        ...classifyCopilotCause({}),
      });
    } else {
      unsupported.push(`${load.id} has no recorded customerName. Copilot does not invent a customer.`);
    }

    facts.push({
      id: `fact-status-${load.id}`,
      domain: "Customer-visible shipment status",
      source: "getCustomerVisibleLoads (canonical load status / origin / destination)",
      sourceClass: "AUTHORITATIVE",
      fact: `${load.id} status ${row.status}; ${row.pickup} → ${row.delivery}.`,
      ...classifyCopilotCause({}),
    });

    facts.push({
      id: `fact-proof-${load.id}`,
      domain: "Customer-visible proof",
      source: `Canonical load ${load.id} podStatus`,
      sourceClass: "AUTHORITATIVE",
      fact: `${load.id} customer-visible proofStatus/podStatus=${String(row.proofStatus ?? "")}.`,
      ...classifyCopilotCause({}),
    });

    facts.push({
      id: `fact-invoice-${load.id}`,
      domain: "Customer-visible invoice readiness",
      source: "getCustomerVisibleLoads invoiceStatus (derived from podStatus)",
      sourceClass: "DERIVED",
      fact: `${load.id} invoiceStatus=${row.invoiceStatus}. This is the existing portal derivation from POD, not a new AR engine.`,
      ...classifyCopilotCause({}),
    });

    if (row.eta === "N/A") {
      facts.push({
        id: `fact-eta-${load.id}`,
        domain: "Customer-visible ETA",
        source: "getCustomerVisibleLoads.eta",
        sourceClass: "UNSUPPORTED",
        fact: `${load.id} ETA is N/A in the customer-visible helper. Copilot does not invent tracking.`,
        ...classifyCopilotCause({}),
      });
    }

    if (load.sealStatus === "Mismatch" || load.dispatchExceptionFlag || (spine?.claimIds.length ?? 0) > 0) {
      facts.push({
        id: `fact-exception-${load.id}`,
        domain: "Customer-visible exception / claim flag",
        source: "Canonical load sealStatus / dispatchExceptionFlag / loadRelationshipSpine.claimIds (already used by /portals/customer)",
        sourceClass: "AUTHORITATIVE",
        fact: `${load.id} sealStatus=${String(load.sealStatus ?? "")}; dispatchExceptionFlag=${String(Boolean(load.dispatchExceptionFlag))}; claimIds=${spine?.claimIds.join(",") || "none"}.`,
        ...classifyCopilotCause({}),
      });
    }

    if (customerPacket.length > 0) {
      const first = customerPacket[0];
      facts.push({
        id: `fact-packet-${load.id}`,
        domain: "Customer-visible packet items",
        source: "buildLoadPacketRegistry visibility includes customer",
        sourceClass: "AUTHORITATIVE",
        fact: `${load.id} has ${customerPacket.length} customer-visible packet item(s); first ${first.title} status ${first.status}.`,
        ...classifyCopilotCause({}),
      });
    } else {
      unsupported.push(`${load.id} has no customer-visible packet items in the existing registry. Copilot does not invent proof.`);
    }

    if (internalPacket.length > 0) {
      unsupported.push(
        `${load.id} has ${internalPacket.length} non-customer packet item(s) (for example work order, RFID, owner financial). Copilot does not copy them into the customer view.`,
      );
    }

    interpretations.push({
      id: `interp-${load.id}`,
      claimClass: "DERIVED_INTERPRETATION",
      text: customerName
        ? `${load.id} is a customer-visible shipment for recorded customer ${customerName}. Copilot does not change status, proof, or invoice state.`
        : `${load.id} is customer-visible by the existing portal helper, but no customerName is recorded.`,
      basedOnFactIds: [`fact-status-${load.id}`],
    });

    if (priority === "hold_or_block") {
      conflicts.push({
        id: `conflict-exception-action-${load.id}`,
        claimClass: "AUTHORITATIVE_FACT",
        sources: [
          {
            name: "Customer portal exception copy",
            authority: "/portals/customer attention card",
            statement: `${load.id} is listed for customer attention with copy: Customer action required: No.`,
          },
          {
            name: "Canonical exception flags",
            authority: "sealStatus / dispatchExceptionFlag / claimIds",
            statement: `${load.id} has a recorded customer-visible exception or claim flag.`,
          },
        ],
        explanation:
          "The portal already shows the shipment and says no customer action is required. Copilot does not decide the action or clear the exception.",
        owner: "Customer / Load File",
        resolutionLabel: "Review customer-visible exception",
        href: `${CUSTOMER_PORTAL_HREF}#customer-attention`,
      });
    }

    guidance.push({
      id: `rec-shipment-${load.id}`,
      claimClass: "RECOMMENDATION",
      source: `Existing /portals/customer shipment card ${load.id}`,
      fact: `${load.id} is already linked from the customer-visible portal.`,
      interpretation:
        "Open the existing customer-visible shipment/proof path. Copilot does not release the load or change assignment.",
      recommendedAction: "View shipment status and proof",
      workflow: "Customer-visible shipment",
      href: `${CUSTOMER_PORTAL_HREF}#shipment-${encodeURIComponent(load.id)}`,
      owner: "Customer",
      derivedPriority: priority,
      priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Customer priority field.",
      executable: false,
    });

    if (priority !== "monitor") {
      guidance.push({
        id: `rec-proof-${load.id}`,
        claimClass: "RECOMMENDATION",
        source: "Existing customer portal delivery-proof section",
        fact: `${load.id} proof/podStatus=${String(row.proofStatus ?? "")}.`,
        interpretation: "Open the existing proof section. Copilot does not verify POD or create documents.",
        recommendedAction: "Review delivery proof",
        workflow: "Customer-visible proof",
        href: `${CUSTOMER_PORTAL_HREF}#delivery-proof`,
        owner: "Customer",
        derivedPriority: "review",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Customer priority field.",
        executable: false,
      });
    }

    const invoiceItem = customerPacket.find((item) => item.key === "invoice");
    if (invoiceItem || row.invoiceStatus === "Ready") {
      guidance.push({
        id: `rec-invoice-${load.id}`,
        claimClass: "RECOMMENDATION",
        source: "Existing customer portal invoice-status section / customer-visible invoice packet item",
        fact: `${load.id} invoiceStatus=${row.invoiceStatus}.`,
        interpretation:
          "Invoice readiness shown to the customer is POD-derived on the existing portal. Copilot does not alter settlement or AR.",
        recommendedAction: "Review invoice status",
        workflow: "Customer-visible invoice",
        href: `${CUSTOMER_PORTAL_HREF}#invoice-status`,
        owner: "Customer",
        derivedPriority: row.invoiceStatus === "Ready" ? "monitor" : "review",
        priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Customer priority field.",
        executable: false,
      });
    }
  }

  if (visibleLoads.length === 0) {
    unsupported.unshift("No customer-visible loads were returned by getCustomerVisibleLoads for this scope. Honest empty.");
  }

  guidance.push({
    id: "rec-intake-workspace",
    claimClass: "RECOMMENDATION",
    source: "Existing /customer-portal/load-intake workflow",
    fact: "Customer load intake already exists on the walkthrough workspace.",
    interpretation:
      "Open the existing intake surface. Copilot does not create a load, quote, or assignment. Walkthrough values stay REFERENCE / DEMO.",
    recommendedAction: "Open load intake",
    workflow: "Customer load intake",
    href: `${CUSTOMER_WORKSPACE_HREF}/load-intake`,
    owner: "Customer",
    derivedPriority: "monitor",
    priorityNote: "COPILOT DERIVED RECOMMENDATION — not a Customer priority field.",
    executable: false,
  });

  decisionSupport.push({
    id: "decision-customer-boundary",
    claimClass: "DERIVED_INTERPRETATION",
    text: "If the need is customer-visible proof or invoice status, stay on /portals/customer. If the need is simulated intake/quote/tracking, stay on /customer-portal. Internal dispatch, safety, maintenance, and settlement remain operator workflows. Copilot does not choose or execute either path.",
    basedOnFactIds: facts.slice(0, 2).map((row) => row.id),
  });

  return {
    domainLabel: "Customer",
    permissionNote:
      "Customer Copilot reuses PORTAL_VISIBILITY.customer and load-packet customer visibility. It does not add a Copilot permission engine.",
    readOnlyNote:
      "Customer Copilot is read-only. Links navigate to existing customer-permitted workflows. Copilot does not write customers, loads, settlements, safety, dispatch, drivers, equipment, or PI events.",
    assignmentProtectionNote:
      "Copilot may recommend reviewing a customer-visible shipment. It does not assign drivers or equipment, release loads, or override readiness.",
    triageNote:
      "Triage order below is Copilot-derived from customer-visible exception/proof flags already used by /portals/customer. It is not a Customer SLA field.",
    reasoningNote:
      "AUTHORITATIVE FACT is copied from canonical customerName, customer-visible load status/proof, and packet items whose visibility includes customer. DEMO_CUSTOMER_PROFILE and /customer-portal walkthroughs are REFERENCE / DEMO. InvoiceStatus from getCustomerVisibleLoads is DERIVED. Internal-only packet items are UNSUPPORTED for this Copilot.",
    overview:
      visibleLoads.length > 0
        ? `${visibleLoads.length} customer-visible shipment row(s) copied from getCustomerVisibleLoads (capped for display). Restricted sections remain hidden: ${(customerVisibility?.restrictedSections ?? []).join(", ")}.`
        : "No customer-visible shipments were copied for this scope.",
    overviewClass: visibleLoads.length > 0 ? "DERIVED_INTERPRETATION" : "UNSUPPORTED",
    facts,
    interpretations,
    conflicts,
    guidance,
    decisionSupport,
    unsupported,
    crossWorkflow: [
      {
        relationship: "Customer ↔ Load",
        note: "Only recorded customerName plus customer-visible status/proof already published by /portals/customer are copied.",
        relationshipClass: "AUTHORITATIVE",
      },
      {
        relationship: "Customer ↔ Dispatch",
        note: "Customers may see published shipment status. Copilot does not assign, unassign, or release.",
        relationshipClass: "NAVIGATIONAL",
      },
      {
        relationship: "Customer ↔ Safety",
        note: "Seal mismatch / exception flags already shown on the customer portal may be copied. Internal safety events are not.",
        relationshipClass: "AUTHORITATIVE",
      },
      {
        relationship: "Customer ↔ Settlement",
        note: "Settlement is a restricted customer section. Copilot copies only customer-visible invoice/POD derivation, not pay or holds.",
        relationshipClass: "NAVIGATIONAL",
      },
      {
        relationship: "Customer ↔ Driver",
        note: "Internal driver IDs and readiness are not copied. /customer-portal/assignment remains a simulated walkthrough.",
        relationshipClass: "NAVIGATIONAL",
      },
      {
        relationship: "Customer ↔ Equipment",
        note: "Internal equipment readiness/OOS is not copied into the customer view.",
        relationshipClass: "NAVIGATIONAL",
      },
      {
        relationship: "Customer ↔ Process Intelligence",
        note: "PI stays an operator Load File surface. Copilot does not publish internal PI to the customer.",
        relationshipClass: "NAVIGATIONAL",
      },
      {
        relationship: "Customer ↔ Command Center",
        note: "Command Center is not a customer workflow.",
        relationshipClass: "NAVIGATIONAL",
      },
    ],
  };
}
