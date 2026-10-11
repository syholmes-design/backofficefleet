-- One electronic POD evidence row per load and role.
-- Partial on purpose: other OperationalEvidence rows may share a load and a null or unrelated note.
CREATE UNIQUE INDEX "OperationalEvidence_epod_role_key"
ON "OperationalEvidence" ("loadId", "notes")
WHERE "notes" LIKE 'bof-epod:%' AND "loadId" IS NOT NULL;
