import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { resolveSecurePickupTestDatabaseUrl } from "../lib/test/assertTestDatabaseTarget";

const root = resolve(process.cwd());

let testDatabaseUrl: string;
try {
  testDatabaseUrl = resolveSecurePickupTestDatabaseUrl(root);
} catch {
  console.error("REFUSING_UNSAFE_TEST_DATABASE");
  process.exit(1);
}

process.env.DATABASE_URL = testDatabaseUrl;

const files = [
  "lib/test/assertTestDatabaseTarget.test.ts",
  "lib/services/pickupReconciliation.test.ts",
  "lib/services/pickupAuthorization.certification.test.ts",
];

const child = spawn("npx", ["--yes", "tsx", "--test", ...files], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
  },
  shell: process.platform === "win32",
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
