/**
 * Ensures the BOF demo uses a single canonical load intake route (`/load-intake`)
 * and that dispatch / client flows point at it — not legacy `/load-requirements` or ad-hoc save paths.
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const issues = [];

function walkDir(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      walkDir(p, out);
    } else if (ent.isFile() && (ent.name.endsWith(".tsx") || ent.name.endsWith(".ts"))) {
      out.push(p);
    }
  }
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function run() {
  const appDir = path.join(ROOT, "app");
  const loadIntakePage = path.join(appDir, "(bof)", "load-intake", "page.tsx");
  const loadReqPage = path.join(appDir, "(bof)", "load-requirements", "page.tsx");

  if (!fs.existsSync(loadIntakePage)) {
    issues.push({ file: loadIntakePage, issue: "missing_canonical_load_intake_page" });
  } else {
    const txt = read(loadIntakePage);
    if (!txt.includes("LoadRequirementsWizard")) {
      issues.push({ file: loadIntakePage, issue: "load_intake_page_missing_wizard" });
    }
    if (!txt.includes("Suspense")) {
      issues.push({ file: loadIntakePage, issue: "load_intake_page_missing_suspense_for_search_params" });
    }
  }

  if (!fs.existsSync(loadReqPage)) {
    issues.push({ file: loadReqPage, issue: "missing_legacy_load_requirements_route" });
  } else {
    const txt = read(loadReqPage);
    if (!txt.includes('redirect("/load-intake")') && !txt.includes("redirect('/load-intake')")) {
      issues.push({ file: loadReqPage, issue: "load_requirements_should_redirect_to_load_intake" });
    }
  }

  const routeScanDirs = [path.join(ROOT, "components"), path.join(ROOT, "app")];
  for (const dir of routeScanDirs) {
    const files = [];
    walkDir(dir, files);
    for (const f of files) {
      const rel = path.relative(ROOT, f).replace(/\\/g, "/");
      const s = read(f);
      if (s.includes('"/load-requirements') || s.includes("'/load-requirements")) {
        issues.push({ file: rel, issue: "stale_route_load_requirements", detail: "Use /load-intake" });
      }
    }
  }

  const dispatchBoard = path.join(ROOT, "components", "dispatch", "DispatchBoardScreen.tsx");
  if (fs.existsSync(dispatchBoard)) {
    const s = read(dispatchBoard);
    if (!s.includes('href="/load-intake"')) {
      issues.push({ file: "components/dispatch/DispatchBoardScreen.tsx", issue: "dispatch_missing_start_load_intake_link" });
    }
  }

  const intakeDetail = path.join(ROOT, "components", "intake-engine", "IntakeEngineDetailClient.tsx");
  if (fs.existsSync(intakeDetail)) {
    const s = read(intakeDetail);
    if (!s.includes("/load-intake?intakeId=")) {
      issues.push({
        file: "components/intake-engine/IntakeEngineDetailClient.tsx",
        issue: "intake_engine_detail_missing_load_intake_deeplink",
      });
    }
  }

  const clientReview = path.join(ROOT, "components", "load-request", "ClientLoadRequestsReviewPageClient.tsx");
  if (fs.existsSync(clientReview)) {
    const s = read(clientReview);
    if (!s.includes("/load-intake?clientRequestId=")) {
      issues.push({
        file: "components/load-request/ClientLoadRequestsReviewPageClient.tsx",
        issue: "client_requests_missing_canonical_intake_link",
      });
    }
    if (s.includes("normalizeLoadIntakeForm")) {
      issues.push({
        file: "components/load-request/ClientLoadRequestsReviewPageClient.tsx",
        issue: "client_review_inline_save_detected",
        detail: "Client conversion should route through /load-intake only",
      });
    }
  }

  const commit = path.join(ROOT, "lib", "load-intake", "commit-intake-to-bof.ts");
  if (!fs.existsSync(commit)) {
    issues.push({ file: commit, issue: "missing_commit_intake_helper" });
  }

  if (issues.length) {
    console.error(`validate-load-intake-routing: ${issues.length} issue(s)`);
    console.error(JSON.stringify(issues, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log("validate-load-intake-routing: OK (canonical /load-intake routing)");
}

run();
