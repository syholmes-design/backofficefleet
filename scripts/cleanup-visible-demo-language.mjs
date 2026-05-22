import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const roots = ["app", "components", "lib", "scripts", "public"];
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".tsx",
]);

const ignoredSegments = new Set([".git", ".next", "node_modules"]);
const selfFile = join(root, "scripts", "cleanup-visible-demo-language.mjs");

const replacements = [
  [/BOF Demo\s*Ã¢â‚¬â€\s*Safety evidence/g, "BackOfficeFleet Safety Evidence"],
  [/BOF Demo\s*â€”\s*Safety evidence/g, "BackOfficeFleet Safety Evidence"],
  [/BOF Demo Evidence/g, "BackOfficeFleet Evidence"],
  [/Generated demo evidence/g, "BackOfficeFleet evidence record"],
  [/Generated for BOF demo/g, "BackOfficeFleet operations record"],
  [/BOF Demo Linehaul/g, "BackOfficeFleet Linehaul"],
  [/BOF Demo/g, "BackOfficeFleet"],
  [/BOF DEMO/g, "BOF OPS"],
  [/BOF-DEMO/g, "BOF-OPS"],
  [/Status \(demo\)/g, "Status"],
  [/demo-banner/g, "ops-banner"],
  [/\(demo HTML placeholder\)/g, ""],
  [/\(demo HTML\)/g, ""],
  [/\(demo\)/g, ""],
  [/ \(demo\)/g, ""],
  [/ \(Demo\)/g, ""],
  [/Executed \(synthetic\)/g, "Executed"],
  [/Electronic signature on file \(synthetic\)/g, "Electronic signature on file"],
  [/Claimant<\/td><td>BackOfficeFleet Linehaul \(synthetic\)/g, "Claimant</td><td>BackOfficeFleet Linehaul"],
  [/A\. R\. Demo/g, "A. R. Morales"],
  [/Synthetic BOF operations document for load/g, "BackOfficeFleet operations document for load"],
  [/Synthetic BackOfficeFleet operations document for load/g, "BackOfficeFleet operations document for load"],
  [/BOF operations document\s*Ã¢â‚¬â€\s*Not for legal filing, payroll processing, benefits enrollment, or employee use\./g, "BackOfficeFleet operations document."],
  [/BOF operations document\s*â€”\s*Not for legal filing, payroll processing, benefits enrollment, or employee use\./g, "BackOfficeFleet operations document."],
  [/BOF operations document\s*Ã¢â‚¬â€\s*For demonstration and internal workflow preview only\. Worker classification decisions must be reviewed by authorized HR, payroll, legal\/admin, and operations personnel before operational use\. This is not legal, tax, payroll, insurance, or employment classification advice\./g, "BackOfficeFleet operations document. Review routed to HR, payroll, legal/admin, and operations stakeholders."],
  [/BOF operations document\s*â€”\s*For demonstration and internal workflow preview only\. Worker classification decisions must be reviewed by authorized HR, payroll, legal\/admin, and operations personnel before operational use\. This is not legal, tax, payroll, insurance, or employment classification advice\./g, "BackOfficeFleet operations document. Review routed to HR, payroll, legal/admin, and operations stakeholders."],
  [/BOF operations document\s*Ã¢â‚¬â€\s*For demonstration and internal workflow preview only\. Review before operational use\./g, "BackOfficeFleet operations document. Routed for internal workflow review."],
  [/BOF operations document\s*â€”\s*For demonstration and internal workflow preview only\. Review before operational use\./g, "BackOfficeFleet operations document. Routed for internal workflow review."],
  [/BOF Demo\s*Ã¢â‚¬â€\s*Enterprise fleet management system with role-based access/g, "BackOfficeFleet enterprise fleet management system with role-based access"],
  [/BOF Demo\s*â€”\s*Enterprise fleet management system with role-based access/g, "BackOfficeFleet enterprise fleet management system with role-based access"],
  [/Not binding\. No real brokerÃ¢â‚¬â€œcarrier agreement\./g, "Broker-carrier terms tracked for operations review."],
  [/Not binding\. No real broker-carrier agreement\./g, "Broker-carrier terms tracked for operations review."],
  [/Not binding\. No real brokerâ€“carrier agreement\./g, "Broker-carrier terms tracked for operations review."],
  [/Not a legal tender of service/g, "Tender terms and operational proof"],
  [/Template placeholder language; not a realistic compliance form\./g, "Template language; requires completion before filing."],
  [/Template shell placeholder language; not a realistic compliance form\./g, "Template language; requires completion before filing."],
  [/Synthetic placeholder shell \(not a production scan\)\./g, "Structured document awaiting uploaded scan."],
  [/Only evidence placeholder is available; replace with a canonical file\./g, "Evidence packet is routed for final proof review."],
  [/Only evidence shell is available; replace with a canonical file\./g, "Evidence packet is routed for final proof review."],
  [/Structured claim evidence placeholder/g, "Structured claim evidence packet"],
  [/Synthetic checkpoint log/g, "Checkpoint log"],
  [/SYNTHETIC DEMO EVIDENCE/g, "EVIDENCE PACKET"],
  [/SYNTHETIC DEMO COMPOSITION/g, "DOCUMENTED COMPLETION VIEW"],
  [/DEMO CARRIER CLAIM FILE/g, "CARRIER CLAIM FILE"],
  [/DEMO DRAFT ONLY/g, "WORKSPACE DRAFT"],
  [/FUEL\s*â€”\s*DEMO RECEIPT/g, "FUEL RECEIPT"],
  [/FUEL\s*Ã¢â‚¬â€\s*DEMO RECEIPT/g, "FUEL RECEIPT"],
  [/BACKOFFICEFLEET TRANSPORT Ã‚Â· DEMO/g, "BACKOFFICEFLEET TRANSPORT"],
  [/BACKOFFICEFLEET TRANSPORT Â· DEMO/g, "BACKOFFICEFLEET TRANSPORT"],
  [/Ã‚Â· BOF Demo/g, "Â· BackOfficeFleet"],
  [/Â· BOF Demo/g, "Â· BackOfficeFleet"],
  [/ \(synthetic\)/g, ""],
  [/\(synthetic\)/g, ""],
  [/Synthetic /g, ""],
  [/synthetic /g, ""],
  [/ \(fictitious\)/g, ""],
  [/fictitious/g, "policy reference"],
  [/@boftransport\.demo/g, "@boftransport.com"],
  [/@backofficefleet\.demo/g, "@backofficefleet.com"],
  [/BOF Demo Group/g, "BackOfficeFleet Group"],
  [/BOF Demo Clearing/g, "BackOfficeFleet Clearing"],
];

function shouldSkip(path) {
  if (path === selfFile) return true;
  const parts = path.split(/[\\/]+/);
  if (parts.some(part => ignoredSegments.has(part))) return true;
  if (path.toLowerCase().endsWith(".pdf")) return true;
  return false;
}

function extensionOf(path) {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index).toLowerCase();
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (shouldSkip(fullPath)) continue;
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      yield* walk(fullPath);
    } else if (stats.isFile() && textExtensions.has(extensionOf(fullPath))) {
      yield fullPath;
    }
  }
}

let filesChanged = 0;
let replacementCount = 0;

for (const folder of roots) {
  const start = join(root, folder);

  for (const file of walk(start)) {
    const before = readFileSync(file, "utf8");
    let after = before;

    for (const [pattern, value] of replacements) {
      after = after.replace(pattern, (...args) => {
        replacementCount += 1;
        return typeof value === "function" ? value(...args) : value;
      });
    }

    if (after !== before) {
      writeFileSync(file, after, "utf8");
      filesChanged += 1;
    }
  }
}

console.log(`Cleaned visible demo/document language in ${filesChanged} files (${replacementCount} replacements).`);
