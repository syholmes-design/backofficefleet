import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertPreviewDatabase } from "../preview-seed";

const empty = { foreignUsers: 0, foreignFleets: 0, emailMailboxes: 0 };

describe("preview seed guard", () => {
  it("refuses the production Neon endpoint even if empty", () => {
    assert.throws(() => assertPreviewDatabase("postgresql://u:p@ep-young-sound-axayjjna-pooler.c-4.us-east-2.aws.neon.tech/neondb", empty), /production/);
  });

  it("refuses any database that already holds real users or fleets", () => {
    assert.throws(() => assertPreviewDatabase("postgresql://u:p@ep-other.neon.tech/preview", { ...empty, foreignUsers: 1 }), /non-preview/);
    assert.throws(() => assertPreviewDatabase("postgresql://u:p@localhost/bof_dev", { ...empty, foreignFleets: 2 }), /non-preview/);
  });

  it("refuses non-Postgres URLs and accepts an empty isolated database", () => {
    assert.throws(() => assertPreviewDatabase("file:./dev.db", empty), /PostgreSQL/);
    assert.throws(() => assertPreviewDatabase(undefined, empty), /PostgreSQL/);
    assert.doesNotThrow(() => assertPreviewDatabase("postgresql://u:p@ep-preview-branch.neon.tech/bof_email_preview", empty));
  });
});
