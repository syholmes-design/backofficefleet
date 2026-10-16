import assert from "node:assert/strict";
import test from "node:test";

import { ignoreFixedAuthUrlOnVercelPreview } from "./preview-auth-url";

test("Vercel Preview ignores an inherited AUTH_URL / NEXTAUTH_URL", () => {
  const env: Record<string, string | undefined> = { VERCEL_ENV: "preview", AUTH_URL: "https://backofficefleet.com", NEXTAUTH_URL: "https://backofficefleet.com", AUTH_SECRET: "kept" };
  ignoreFixedAuthUrlOnVercelPreview(env);
  assert.equal(env.AUTH_URL, undefined);
  assert.equal(env.NEXTAUTH_URL, undefined);
  assert.equal(env.AUTH_SECRET, "kept");
});

test("Production, development and local runs keep their configured URL", () => {
  for (const VERCEL_ENV of ["production", "development", undefined]) {
    const env: Record<string, string | undefined> = { VERCEL_ENV, NEXTAUTH_URL: "https://backofficefleet.com" };
    ignoreFixedAuthUrlOnVercelPreview(env);
    assert.equal(env.NEXTAUTH_URL, "https://backofficefleet.com");
  }
});
