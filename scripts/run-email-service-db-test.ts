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

const child = spawn("npx", ["--yes", "tsx", "--test", "lib/email-service/email-service.persistence.test.ts"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: testDatabaseUrl, EMAIL_SENDING_ENABLED: "false" },
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 1));
