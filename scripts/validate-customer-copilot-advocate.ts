import { getBofData } from "../lib/load-bof-data";
import { DEMO_CUSTOMER_PROFILE, getCustomerVisibleLoads } from "../lib/demo-portals";
import { buildLoadPacketRegistry } from "../lib/load-artifact-registry";
import { buildCustomerCopilotAdvocateView } from "../lib/copilot/customer-copilot-advocate-display";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function logScenario(id: string, source: string, fact: string, interpretation: string, recommendation: string, workflow: string) {
  console.log(`SCENARIO ${id}`);
  console.log(`  SOURCE: ${source}`);
  console.log(`  FACT: ${fact}`);
  console.log(`  INTERPRETATION: ${interpretation}`);
  console.log(`  RECOMMENDATION: ${recommendation}`);
  console.log(`  WORKFLOW: ${workflow}`);
}

function serialized(view: ReturnType<typeof buildCustomerCopilotAdvocateView>): string {
  return JSON.stringify(view);
}

const data = getBofData();
const visible = getCustomerVisibleLoads(data);
assert(visible.length > 0, "Existing demo data must include customer-visible loads");

const named = data.loads.find((row) => typeof row.customerName === "string" && row.customerName.trim());
assert(named, "Existing demo data must include a recorded customerName");

{
  const view = buildCustomerCopilotAdvocateView({ data, v3: null, scope: { loadId: named!.id } });
  const fact = view.facts.find((row) => row.id === `fact-customer-${named!.id}`);
  const rec = view.guidance.find((row) => row.id === `rec-shipment-${named!.id}`);
  assert(fact, "A: recorded customerName fact missing");
  assert(fact!.fact.includes(String(named!.customerName).trim()), "A: must copy recorded customerName");
  assert(rec, "A: shipment recommendation missing");
  assert(view.guidance.every((row) => row.executable === false), "A: recommendations must be non-executable");
  assert(!/assign (driver|unit|truck|equipment)/i.test(view.guidance.map((row) => row.recommendedAction).join(" ")), "A: must not assign");
  assert(!/release load/i.test(view.guidance.map((row) => row.recommendedAction).join(" ")), "A: must not release");
  logScenario("A recorded customerName", fact!.source, fact!.fact, rec!.interpretation, rec!.recommendedAction, rec!.href);
  console.log("SCENARIO A PASS");
}

const exceptionLoad = data.loads.find((row) => row.sealStatus === "Mismatch" || row.dispatchExceptionFlag);
if (exceptionLoad) {
  const view = buildCustomerCopilotAdvocateView({ data, v3: null, scope: { loadId: exceptionLoad.id } });
  const fact = view.facts.find((row) => row.id === `fact-exception-${exceptionLoad.id}`);
  const rec = view.guidance.find((row) => row.id.startsWith("rec-proof-") || row.id.startsWith("rec-shipment-"));
  assert(fact, "B: customer-visible exception fact missing");
  assert(rec, "B: existing workflow recommendation missing");
  assert(view.guidance.every((row) => row.executable === false), "B: recommendations must be non-executable");
  logScenario("B customer-visible exception", fact!.source, fact!.fact, rec!.interpretation, rec!.recommendedAction, rec!.href);
  console.log("SCENARIO B PASS");
} else {
  console.log("SCENARIO B SKIP — no seal mismatch / dispatchExceptionFlag in existing loads; demo JSON was not modified");
}

{
  const view = buildCustomerCopilotAdvocateView({ data, v3: null, scope: { loadId: "CUST-COPILOT-ABSENT-007" } });
  assert(
    view.unsupported.some((row) => /CUST-COPILOT-ABSENT-007/.test(row) && /honest empty/i.test(row)),
    "C: missing load must be honest empty",
  );
  logScenario("C missing load honest empty", "canonical loads", "no row", view.unsupported[0], "none", "n/a");
  console.log("SCENARIO C PASS");
}

{
  const view = buildCustomerCopilotAdvocateView({ data, v3: null });
  const conflict = view.conflicts.find((row) => row.id === "conflict-demo-profile-vs-recorded-name");
  const recordedNames = data.loads.map((row) => String(row.customerName ?? "").trim()).filter(Boolean);
  if (!recordedNames.includes(DEMO_CUSTOMER_PROFILE.customerName)) {
    assert(conflict, "D: demo profile vs recorded customerName conflict missing");
    logScenario(
      "D demo profile vs recorded name",
      conflict!.sources.map((row) => row.authority).join(" vs "),
      conflict!.sources.map((row) => row.statement).join(" | "),
      conflict!.explanation,
      conflict!.resolutionLabel,
      conflict!.href || "",
    );
    console.log("SCENARIO D PASS");
  } else {
    console.log("SCENARIO D SKIP — DEMO_CUSTOMER_PROFILE.customerName already matches a recorded load; demo JSON was not modified");
  }
}

{
  const view = buildCustomerCopilotAdvocateView({ data, v3: null, scope: { loadId: named!.id } });
  const text = serialized(view);
  assert(!/settlementHold/.test(text), "E: must not copy internal settlementHold");
  assert(!/Out of Service/.test(text), "E: must not copy internal equipment OOS");
  assert(!/NOT_ASSIGNABLE/.test(text), "E: must not copy internal assignability");
  assert(!/\/settlements/.test(text), "E: must not send customers to settlements workflow");
  assert(!/\/dispatch/.test(text), "E: must not send customers to dispatch operations");
  assert(!/\/maintenance/.test(text), "E: must not send customers to maintenance");
  const packet = buildLoadPacketRegistry(data, named!.id);
  const internalTitles = (packet?.packetItems ?? [])
    .filter((item) => !item.visibility.includes("customer"))
    .map((item) => item.title);
  for (const title of internalTitles.slice(0, 8)) {
    assert(!text.includes(title), `E: internal packet item leaked: ${title}`);
  }
  logScenario("E internal fields withheld", "packet visibility / PORTAL_VISIBILITY.customer", "internal-only items omitted", "Customer Copilot does not copy internal-only packet items", "none", "n/a");
  console.log("SCENARIO E PASS");
}

{
  const view = buildCustomerCopilotAdvocateView({ data, v3: null });
  assert(
    view.unsupported.some((row) => /SHP-86240/.test(row) && /REFERENCE \/ DEMO/.test(row)),
    "F: walkthrough shipment must be unsupported/demo",
  );
  const intake = view.guidance.find((row) => row.id === "rec-intake-workspace");
  assert(intake?.href === "/customer-portal/load-intake", "F: intake rec must map to existing workflow");
  logScenario("F walkthrough unsupported", " /customer-portal", view.unsupported.find((row) => /SHP-86240/.test(row)) || "", intake!.interpretation, intake!.recommendedAction, intake!.href);
  console.log("SCENARIO F PASS");
}

{
  const view = buildCustomerCopilotAdvocateView({ data, v3: null, scope: { loadId: named!.id } });
  const invoice = view.facts.find((row) => row.id === `fact-invoice-${named!.id}`);
  assert(invoice, "G: invoice fact missing");
  assert(invoice!.sourceClass === "DERIVED", "G: portal invoiceStatus must remain DERIVED");
  logScenario("G derived invoice status", invoice!.source, invoice!.fact, view.interpretations[0]?.text || "", view.guidance.find((row) => row.id.startsWith("rec-invoice-"))?.recommendedAction || "none", "/portals/customer#invoice-status");
  console.log("SCENARIO G PASS");
}

{
  const view = buildCustomerCopilotAdvocateView({ data, v3: null });
  assert(view.guidance.every((row) => row.executable === false), "H: all recs non-executable");
  assert(view.crossWorkflow.some((row) => row.relationship === "Customer ↔ Load"), "H: Load relationship required");
  assert(view.crossWorkflow.some((row) => row.relationship === "Customer ↔ Settlement"), "H: Settlement relationship required");
  logScenario("H cross-workflow + non-executable", "Customer Copilot", `${view.crossWorkflow.length} relationships`, view.decisionSupport?.[0]?.text || "", "n/a", "n/a");
  console.log("SCENARIO H PASS");
}

console.log("CUSTOMER COPILOT ADVOCATE VALIDATION PASS");
