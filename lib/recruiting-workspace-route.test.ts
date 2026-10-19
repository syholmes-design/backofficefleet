import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the recruiting workspace keeps its query on the page that reads it", () => {
  const client = readFileSync("components/recruiting/RecruitingPageClient.tsx", "utf8");
  const workspace = readFileSync("app/(bof)/recruiting/workspace/page.tsx", "utf8");
  const desk = readFileSync("app/(bof)/recruiting/page.tsx", "utf8");
  assert.match(workspace, /RecruitingPageClient/);
  assert.match(desk, /return <RequisitionListClient/);
  assert.doesNotMatch(desk, /import \{ RecruitingPageClient \}/);
  assert.match(client, /params\.get\("candidateId"\)/);
  assert.match(client, /params\.get\("tab"\)/);
  assert.match(client, /params\.get\("workflow"\)/);
  assert.equal(client.includes("`/recruiting?"), false);
  // URLs are built from basePath, which defaults to the workspace route (the demo passes its own).
  assert.match(client, /basePath = "\/recruiting\/workspace"/);
  assert.match(client, /`\$\{basePath\}\?/);
  assert.doesNotMatch(client, /prisma\.candidate\.create|recordDriverEligibilityReview/);
});
