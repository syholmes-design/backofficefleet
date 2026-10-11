import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(path, "utf8");
}

test("live driver file affirms an open non-medical requirement without changing eligibility", () => {
  const driverFile = read("components/drivers/OperatorDriverDetail.tsx");
  const button = read("components/drivers/RequirementEvidenceAffirmButton.tsx");
  const service = read("lib/services/requirementService.ts");
  const route = read("app/api/requirements/[requirementId]/affirm/route.ts");
  const repository = read("lib/repositories/requirementRepository.ts");

  assert.match(driverFile, /requirementType !== "MEDICAL"/);
  assert.match(driverFile, /affirmationStatus !== "AFFIRMED"/);
  assert.match(driverFile, /RequirementEvidenceAffirmButton/);
  assert.match(driverFile, /MedicalRenewalAffirmButton/);
  assert.match(button, /\/api\/requirements\/\$\{encodeURIComponent\(id\)\}\/affirm/);
  assert.match(button, /does not set eligibility, release, or pay/);
  assert.match(button, /stays open until evidence is recorded/);
  assert.match(button, /Requirement is required/);
  assert.match(route, /affirmRequirementAction/);
  assert.match(route, /Unauthorized/);
  assert.match(service, /authorizedFleetAccess/);
  assert.match(service, /actionStatus: requirement\.requirementType === "MEDICAL" \? "AWAITING_MEDICAL_CARD" : "AWAITING_EVIDENCE"/);
  assert.match(service, /resolutionStatus: "OPEN"/);
  assert.doesNotMatch(service, /recordDriverEligibilityReview|writeQualificationSnapshot/);
  assert.match(repository, /affirmationStatus: true/);
});
