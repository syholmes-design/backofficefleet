import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { buildSyntheticDemoPdf } from "../lib/recruiting-v2/build-synthetic-demo-pdf";

const documents = [
  {
    fileName: "CAND-001_CDL_DEMO.pdf",
    title: "Michael Anderson — CDL demonstration record",
    lines: [
      "Candidate: Michael Anderson (CAND-001)",
      "Demo license class: Class A (fictional)",
      "Demo issuing state: OH",
      "Demo identifier: OH-DEMO-8821",
      "This is not a commercial driver license.",
    ],
  },
  {
    fileName: "CAND-001_MEDICAL_DEMO.pdf",
    title: "Michael Anderson — medical demonstration record",
    lines: [
      "Candidate: Michael Anderson (CAND-001)",
      "Demo examiner: BOF Demo Medical Review",
      "Demo expiration: 2027-11-01",
      "This is not a DOT medical certificate.",
    ],
  },
  {
    fileName: "CAND-001_MVR_DEMO.pdf",
    title: "Michael Anderson — MVR demonstration record",
    lines: [
      "Candidate: Michael Anderson (CAND-001)",
      "Demo review state: acceptable",
      "This is not a motor vehicle record from a state agency.",
    ],
  },
  {
    fileName: "CAND-001_CLEARINGHOUSE_DEMO.pdf",
    title: "Michael Anderson — clearinghouse demonstration record",
    lines: [
      "Candidate: Michael Anderson (CAND-001)",
      "Demo query result: current",
      "This is not an FMCSA Clearinghouse query result.",
    ],
  },
  {
    fileName: "CAND-001_I9_DEMO.pdf",
    title: "Michael Anderson — I-9 demonstration record",
    lines: [
      "Candidate: Michael Anderson (CAND-001)",
      "Demo section status: completed",
      "This is not Form I-9 and contains no identity documents.",
    ],
  },
  {
    fileName: "CAND-001_W9_DEMO.pdf",
    title: "Michael Anderson — W-9 demonstration record",
    lines: [
      "Candidate: Michael Anderson (CAND-001)",
      "Demo classification: W-2 preview",
      "This is not IRS Form W-9 and contains no taxpayer identification number.",
    ],
  },
  {
    fileName: "CAND-001_ROAD_TEST_DEMO.pdf",
    title: "Michael Anderson — road test demonstration record",
    lines: [
      "Candidate: Michael Anderson (CAND-001)",
      "Demo result: pass",
      "This is not an official road-test certificate.",
    ],
  },
  {
    fileName: "CAND-001_EMPLOYMENT_VERIFICATION_DEMO.pdf",
    title: "Michael Anderson — employment verification demonstration record",
    lines: [
      "Candidate: Michael Anderson (CAND-001)",
      "Demo employers checked: 2 fictional prior employers",
      "This is not a real employment or safety-history verification.",
    ],
  },
];

async function main() {
  const dir = join(process.cwd(), "lib", "recruiting-v2", "synthetic-documents");
  await mkdir(dir, { recursive: true });
  for (const document of documents) {
    const pdf = buildSyntheticDemoPdf(document.title, document.lines);
    await writeFile(join(dir, document.fileName), pdf);
  }
  console.log(`Wrote ${documents.length} synthetic demonstration PDFs to ${dir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
