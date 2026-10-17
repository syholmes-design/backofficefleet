import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { resolveSecurePickupTestDatabaseUrl } from "../lib/test/assertTestDatabaseTarget";

// Same guard as the other persistence suites: only a local `bof_dev` database is accepted.
const root = resolve(process.cwd());
let testDatabaseUrl: string;
try {
  testDatabaseUrl = resolveSecurePickupTestDatabaseUrl(root);
} catch {
  console.error("REFUSING_UNSAFE_TEST_DATABASE");
  process.exit(1);
}

const child = spawn("npx", ["--yes", "tsx", "--test", "lib/services/fmcsa/monitoring.persistence.test.ts"], {
  cwd: root,
  stdio: "inherit",
  // No live FMCSA access in tests: every source is injected.
  env: { ...process.env, DATABASE_URL: testDatabaseUrl, BOF_FMCSA_PROVIDER: "unavailable", FMCSA_QCMOBILE_WEBKEY: "" },
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 1));
