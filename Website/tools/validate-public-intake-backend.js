const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const migrationPath = path.join(root, "supabase/migrations/202607290001_public_intake_schema.sql");
const functionPath = path.join(root, "supabase/functions/submit-public-intake/index.ts");
const frontendPath = path.join(root, "Website/assets/js/public-intake.js");

const migration = fs.readFileSync(migrationPath, "utf8");
const edgeFunction = fs.readFileSync(functionPath, "utf8");
const frontend = fs.readFileSync(frontendPath, "utf8");

const errors = [];

function requireMatch(source, pattern, label) {
  if (!pattern.test(source)) errors.push(`Missing ${label}`);
}

[
  "intake.public_intakes",
  "intake.intake_events",
  "intake.intake_notes",
  "intake.intake_assignments",
].forEach((table) => requireMatch(migration, new RegExp(table.replace(".", "\\.")), table));

[
  "contact",
  "demo_request",
  "priority_fleet",
  "assessment_roadmap",
  "government_inquiry",
  "aggregator_inquiry",
  "driver_inquiry",
].forEach((value) => requireMatch(migration, new RegExp(`'${value}'`), `enum ${value}`));

requireMatch(migration, /enable row level security/gi, "RLS enablement");
requireMatch(migration, /revoke all on schema intake from public/i, "public grant revocation");
requireMatch(migration, /public_reference.*BOF-INT/i, "public reference format");
requireMatch(migration, /request_summary.*1500/i, "request summary limit");
requireMatch(edgeFunction, /ALLOWED_ORIGINS/, "allowed origins enforcement");
requireMatch(edgeFunction, /SUPABASE_SERVICE_ROLE_KEY/, "service-role env usage");
requireMatch(edgeFunction, /TURNSTILE_SECRET_KEY/, "Turnstile optional adapter");
requireMatch(edgeFunction, /rateLimit/, "rate limiting");
requireMatch(edgeFunction, /duplicate/i, "duplicate suppression");
requireMatch(frontend, /BOFPublicIntakeConfig/, "frontend endpoint configuration");
requireMatch(frontend, /fetch\(endpoint/, "frontend backend submit adapter");

const forbiddenTables = [
  "document_records",
  "document_versions",
  "credentials",
  "renewal_tasks",
  "evidence_items",
  "proof_packets",
  "proof_packet_items",
  "audit_events",
];
forbiddenTables.forEach((table) => {
  if (new RegExp(`\\b(create|alter|drop|from|join|references)\\s+(table\\s+)?(public\\.|intake\\.)?${table}\\b`, "i").test(migration)) {
    errors.push(`Forbidden MG3 table referenced in migration: ${table}`);
  }
});

const secretPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY=[A-Za-z0-9._-]+/,
  /TURNSTILE_SECRET_KEY=[A-Za-z0-9._-]+/,
  /INTAKE_NOTIFICATION_RECIPIENT=.+@.+/,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
];
[
  ["migration", migration],
  ["edge function", edgeFunction],
  ["frontend", frontend],
].forEach(([label, source]) => {
  secretPatterns.forEach((pattern) => {
    if (pattern.test(source)) errors.push(`Potential committed secret in ${label}`);
  });
});

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Public intake backend static validation passed.");
