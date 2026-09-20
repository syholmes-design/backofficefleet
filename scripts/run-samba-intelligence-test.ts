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

const child = spawn(
  "npx",
  ["--yes", "tsx", "--test", "--test-concurrency=1", "lib/test/assertTestDatabaseTarget.test.ts", "lib/services/samba/sambaIntelligence.certification.test.ts", "lib/services/samba/sambaIntelligence2.certification.test.ts"],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testDatabaseUrl, NODE_TEST_CONCURRENCY: "1" },
    shell: process.platform === "win32",
  },
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
