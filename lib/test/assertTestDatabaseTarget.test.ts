import assert from "node:assert/strict";
import test from "node:test";

import {
  REFUSING_UNSAFE_TEST_DATABASE,
  assertTestDatabaseTarget,
} from "@/lib/test/assertTestDatabaseTarget";

test("assertTestDatabaseTarget allows isolated local bof_dev", () => {
  const url = assertTestDatabaseTarget("postgresql://bof:bof@127.0.0.1:5432/bof_dev");
  assert.match(url, /bof_dev/);
});

test("assertTestDatabaseTarget refuses production Neon hostname", () => {
  assert.throws(
    () =>
      assertTestDatabaseTarget(
        "postgresql://user:pass@ep-young-sound-axayjjna-pooler.c-4.us-east-2.aws.neon.tech/neondb",
      ),
    (error: Error) => error.message === REFUSING_UNSAFE_TEST_DATABASE,
  );
});

test("assertTestDatabaseTarget refuses other neon.tech hosts", () => {
  assert.throws(
    () => assertTestDatabaseTarget("postgresql://user:pass@ep-other-pooler.us-east-2.aws.neon.tech/bof_dev"),
    (error: Error) => error.message === REFUSING_UNSAFE_TEST_DATABASE,
  );
});

test("assertTestDatabaseTarget refuses loopback databases that are not bof_dev", () => {
  assert.throws(
    () => assertTestDatabaseTarget("postgresql://bof:bof@localhost:5432/neondb"),
    (error: Error) => error.message === REFUSING_UNSAFE_TEST_DATABASE,
  );
});
