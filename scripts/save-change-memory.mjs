import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CHANGE_MEMORY_ROOT = path.join(ROOT, ".codex", "change-memory");
const DIRS = {
  sessions: path.join(CHANGE_MEMORY_ROOT, "sessions"),
  patches: path.join(CHANGE_MEMORY_ROOT, "patches"),
  reverse: path.join(CHANGE_MEMORY_ROOT, "reverse-instructions"),
  reconstruction: path.join(CHANGE_MEMORY_ROOT, "reconstruction-notes"),
};
const INDEX_PATH = path.join(CHANGE_MEMORY_ROOT, "index.md");

const IGNORED_PREFIXES = [
  "node_modules/",
  ".next/",
  ".vercel/",
  "coverage/",
  "playwright-report/",
  "test-results/",
  ".codex/reports/visual-smoke/",
];

function parseArgs(argv) {
  const args = {
    area: "unspecified-area",
    reason: "Meaningful Codex change",
    session: "Codex",
    files: [],
    id: "",
    difficulty: "Moderate",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--area" && next) {
      args.area = next;
      i++;
    } else if (arg === "--reason" && next) {
      args.reason = next;
      i++;
    } else if (arg === "--session" && next) {
      args.session = next;
      i++;
    } else if (arg === "--id" && next) {
      args.id = next;
      i++;
    } else if (arg === "--difficulty" && next) {
      args.difficulty = next;
      i++;
    } else if (arg === "--files" && next) {
      args.files = next.split(",").map((item) => normalizePath(item)).filter(Boolean);
      i++;
    }
  }

  const hasNamedArgs = argv.some((arg) => String(arg).startsWith("--"));
  if (!hasNamedArgs && argv.length) {
    args.area = argv[0] || args.area;
    args.reason = argv[1] || args.reason;
    args.difficulty = argv[2] || args.difficulty;
    args.files = argv[3]
      ? argv[3].split(",").map((item) => normalizePath(item)).filter(Boolean)
      : args.files;
    args.session = argv[4] || args.session;
    args.id = argv[5] || args.id;
  }

  return args;
}

function normalizePath(value) {
  return String(value || "").trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

function slugify(value) {
  const slug = String(value || "change")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "change";
}

function runGit(args, options = {}) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", options.allowError ? "pipe" : "inherit"],
  });
}

function ensureDirs() {
  mkdirSync(CHANGE_MEMORY_ROOT, { recursive: true });
  for (const dir of Object.values(DIRS)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(INDEX_PATH)) {
    writeFileSync(
      INDEX_PATH,
      "# Change Memory Index\n\nThis index records meaningful Codex changes as reconstruction recipes.\n\n",
      "utf8",
    );
  }
}

function isIgnored(file) {
  const normalized = normalizePath(file);
  return IGNORED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function getChangedFilesFromGit() {
  const output = runGit(["status", "--porcelain"], { allowError: true });
  return output
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => normalizePath(line.slice(3).trim()))
    .filter((file) => file && !isIgnored(file));
}

function getPatch(files) {
  const trackedFiles = [];
  const untrackedFiles = [];

  for (const file of files) {
    try {
      runGit(["ls-files", "--error-unmatch", file], { allowError: true });
      trackedFiles.push(file);
    } catch {
      if (existsSync(path.join(ROOT, file))) {
        untrackedFiles.push(file);
      }
    }
  }

  const patchParts = [];

  if (trackedFiles.length) {
    try {
      const diff = runGit(["diff", "--binary", "--", ...trackedFiles], { allowError: true });
      if (diff.trim()) {
        patchParts.push(diff.trimEnd());
      }
    } catch (error) {
      patchParts.push(`# Failed to create git diff: ${error.message}`);
    }
  }

  for (const file of untrackedFiles) {
    patchParts.push(createNewFileDiff(file));
  }

  return patchParts.length
    ? `${patchParts.join("\n\n")}\n`
    : "# No patch content was available for the selected files.\n";
}

function createNewFileDiff(file) {
  const absolutePath = path.join(ROOT, file);
  let content = "";
  try {
    content = readFileSync(absolutePath, "utf8");
  } catch {
    return `# Untracked file could not be included as text: ${file}`;
  }

  const normalized = normalizePath(file);
  const lines = content.split(/\r?\n/);
  if (lines.at(-1) === "") {
    lines.pop();
  }

  const body = lines.map((line) => `+${line}`).join("\n");
  return [
    `diff --git a/${normalized} b/${normalized}`,
    "new file mode 100644",
    "index 0000000..0000000",
    "--- /dev/null",
    `+++ b/${normalized}`,
    `@@ -0,0 +1,${lines.length} @@`,
    body,
  ].join("\n");
}

function fileStatus(file) {
  try {
    const output = runGit(["status", "--porcelain", "--", file], { allowError: true }).trim();
    return output ? output.slice(0, 2).trim() || "modified" : "modified";
  } catch {
    return "unknown";
  }
}

function writeEntry(args, files) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const stamp = now.toISOString().replace(/[:.]/g, "-").replace("T", "-").slice(0, 19);
  const areaSlug = slugify(args.area);
  const entryId = args.id || `${date}-${areaSlug}`;
  const fileBase = `${stamp}-${areaSlug}`;
  const patchRel = `.codex/change-memory/patches/${fileBase}.patch`;
  const reverseRel = `.codex/change-memory/reverse-instructions/${fileBase}.md`;
  const sessionRel = `.codex/change-memory/sessions/${fileBase}.md`;
  const reconstructionRel = `.codex/change-memory/reconstruction-notes/${fileBase}.md`;

  const patchPath = path.join(DIRS.patches, `${fileBase}.patch`);
  const reversePath = path.join(DIRS.reverse, `${fileBase}.md`);
  const sessionPath = path.join(DIRS.sessions, `${fileBase}.md`);
  const reconstructionPath = path.join(DIRS.reconstruction, `${fileBase}.md`);

  const patch = getPatch(files);
  writeFileSync(patchPath, patch, "utf8");

  const fileRows = files
    .map((file) => `- path: ${file}\n  change type: ${fileStatus(file)}\n  before summary: Fill in prior behavior if rollback is requested.\n  after summary: Fill in current behavior after this change.\n  reverse instruction: Use the patch when possible, or manually restore the prior behavior described here.`)
    .join("\n");

  const reverse = `# Reverse Instructions\n\nID: ${entryId}\nDate: ${now.toISOString()}\nArea changed: ${args.area}\nReason for change: ${args.reason}\n\n## Files touched\n\n${fileRows || "- None detected"}\n\n## Plain-English rollback explanation\n\nIf this change needs to be undone, restore the prior behavior by:\n\n1. Review the patch at \`${patchRel}\`.\n2. If the patch still applies cleanly, reverse it with \`git apply -R ${patchRel}\` from the project root.\n3. If the patch does not apply cleanly, manually restore the behavior described in this note and the reconstruction note.\n\n## Validation after reconstruction\n\n- Page to check: Not specified.\n- Command to run: \`npm run codex:registry-sync\` if Codex operating files changed.\n- Visual behavior expected: Not specified.\n- Links or buttons to test: Not specified.\n`;

  const session = `# Change Memory Entry\n\nID: ${entryId}\nDate: ${now.toISOString()}\nCodex session/person: ${args.session}\nArea changed: ${args.area}\nReason for change: ${args.reason}\n\n## Files touched\n\n${fileRows || "- None detected"}\n\n## Exact change record\n\nPatch file: ${patchRel}\nReverse instruction file: ${reverseRel}\n\n## Plain-English rollback explanation\n\nIf this change needs to be undone, restore the prior behavior by:\n\n1. Review the reverse note at \`${reverseRel}\`.\n2. Reverse-apply the patch if it still matches the current files.\n3. If the patch cannot apply, use the reconstruction note at \`${reconstructionRel}\`.\n\n## Rebuild notes if backup fails\n\nIf the original files are gone, recreate the previous version by:\n\n1. Use the file list and summaries in this entry.\n2. Rebuild the prior behavior from the reverse instructions.\n3. Re-run the listed validation checks.\n\n## Validation after reconstruction\n\n- Page to check: Not specified.\n- Command to run: \`npm run codex:registry-sync\` if Codex operating files changed.\n- Visual behavior expected: Not specified.\n- Links or buttons to test: Not specified.\n`;

  const reconstruction = `# Reconstruction Notes\n\nID: ${entryId}\nArea changed: ${args.area}\nReason for change: ${args.reason}\n\n## How to rebuild previous behavior if backups fail\n\n1. Start with the files listed in \`${sessionRel}\`.\n2. Use \`${reverseRel}\` for the plain-English rollback path.\n3. Use \`${patchRel}\` for exact line-level changes when it still applies.\n\n## Rebuild confidence\n\nModerate. Fill in more detail after reviewing the specific change behavior.\n`;

  writeFileSync(reversePath, reverse, "utf8");
  writeFileSync(sessionPath, session, "utf8");
  writeFileSync(reconstructionPath, reconstruction, "utf8");

  const indexEntry = `\n### Entry ID: ${entryId}\nDate: ${now.toISOString()}\nArea: ${args.area}\nFiles touched: ${files.length ? files.join(", ") : "None detected"}\nPatch: ${patchRel}\nReverse notes: ${reverseRel}\nReason: ${args.reason}\nRollback difficulty: ${args.difficulty}\n\n---\n`;
  appendFileSync(INDEX_PATH, indexEntry, "utf8");

  return { entryId, patchRel, reverseRel, sessionRel, reconstructionRel };
}

const args = parseArgs(process.argv.slice(2));
ensureDirs();
const files = args.files.length ? args.files.filter((file) => !isIgnored(file)) : getChangedFilesFromGit();
const result = writeEntry(args, files);

console.log("## Change Memory Saved");
console.log(`ID: ${result.entryId}`);
console.log(`Area: ${args.area}`);
console.log(`Files touched: ${files.length}`);
console.log(`Patch saved: ${result.patchRel}`);
console.log(`Reverse notes saved: ${result.reverseRel}`);
console.log(`Rebuild confidence: ${args.difficulty}`);
