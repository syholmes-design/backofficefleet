#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const defaultRoutes = ["/", "/demo.html", "/dashboard.html", "/documents.html", "/fleet.html", "/book-demo.html"];
const profileMap = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 900 }
};

function parseArgs(argv) {
  const args = {
    baseUrl: "http://localhost:3000",
    routes: defaultRoutes,
    profiles: ["desktop", "mobile"],
    out: "",
    fullPage: false,
    wait: "1200",
    selector: ".site-header"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--base-url" && next) {
      args.baseUrl = next;
      index += 1;
    } else if (arg === "--routes" && next) {
      args.routes = next.split(",").map((route) => route.trim()).filter(Boolean);
      index += 1;
    } else if (arg === "--profiles" && next) {
      args.profiles = next.split(",").map((profile) => profile.trim()).filter(Boolean);
      index += 1;
    } else if (arg === "--out" && next) {
      args.out = next;
      index += 1;
    } else if (arg === "--wait" && next) {
      args.wait = next;
      index += 1;
    } else if (arg === "--selector" && next) {
      args.selector = next;
      index += 1;
    } else if (arg === "--full-page") {
      args.fullPage = true;
    }
  }

  return args;
}

function stamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join("");
}

function routeSlug(route) {
  if (route === "/") return "home";
  return route.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "route";
}

function normalizeUrl(baseUrl, route) {
  const base = baseUrl.replace(/\/+$/, "");
  const suffix = route.startsWith("/") ? route : `/${route}`;
  return `${base}${suffix}`;
}

function run(command, args) {
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";
    const spawnCommand = isWindows ? "cmd.exe" : command;
    const spawnArgs = isWindows ? ["/d", "/s", "/c", [command, ...args].map(quoteCmdArg).join(" ")] : args;

    const child = spawn(spawnCommand, spawnArgs, {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

function quoteCmdArg(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:=,@-]+$/.test(text)) {
    return text;
  }
  return `"${text.replaceAll('"', '\\"')}"`;
}

async function fetchStatus(url) {
  try {
    const response = await fetch(url);
    return response.status;
  } catch {
    return 0;
  }
}

function playwrightArgs(url, file, profile, options) {
  const args = [
    "playwright",
    "screenshot",
    "--viewport-size",
    `${profile.width},${profile.height}`,
    "--wait-for-selector",
    options.selector,
    "--wait-for-timeout",
    options.wait,
    url,
    file
  ];

  if (options.fullPage) {
    args.splice(2, 0, "--full-page");
  }

  return args;
}

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(root, args.out || `.codex/reports/visual-snapshots/${stamp()}`);

  if (!existsSync(path.resolve(root, "Website"))) {
    console.error("Run this script from the BOF project root. Website folder was not found.");
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });

  const captures = [];
  const failures = [];

  for (const route of args.routes) {
    const url = normalizeUrl(args.baseUrl, route);
    const status = await fetchStatus(url);

    for (const profileName of args.profiles) {
      const profile = profileMap[profileName];
      if (!profile) {
        failures.push({ route, profile: profileName, reason: "Unknown profile" });
        continue;
      }

      const fileName = `${routeSlug(route)}-${profileName}.png`;
      const filePath = path.join(outDir, fileName);
      const relativeFilePath = path.relative(root, filePath);
      const screenshotTarget = (relativeFilePath.startsWith("..") ? filePath : relativeFilePath).replaceAll(path.sep, "/");
      const result = await run("npx", ["--yes", ...playwrightArgs(url, screenshotTarget, profile, args)]);

      const record = {
        route,
        url,
        status,
        profile: profileName,
        viewport: profile,
        file: filePath,
        relativeFile: fileName,
        ok: status >= 200 && status < 400 && result.code === 0
      };

      captures.push(record);

      if (!record.ok) {
        failures.push({
          route,
          profile: profileName,
          status,
          code: result.code,
          stderr: result.stderr.trim()
        });
      }
    }
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    baseUrl: args.baseUrl,
    outDir,
    routes: args.routes,
    profiles: args.profiles,
    fullPage: args.fullPage,
    wait: args.wait,
    selector: args.selector,
    captures,
    failures
  };

  await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  const reviewMarkdown = [
    "# BOF Website Visual Snapshot",
    "",
    `Created: ${manifest.createdAt}`,
    `Base URL: ${args.baseUrl}`,
    `Output: ${outDir}`,
    "",
    "## Captures",
    "",
    ...captures.map((capture) => `- ${capture.ok ? "OK" : "FAIL"} ${capture.route} ${capture.profile} ${capture.status}: ${capture.relativeFile}`),
    "",
    "## Review Guidance",
    "",
    "- Inspect only the screenshots relevant to the current task.",
    "- Start with one desktop and one mobile screenshot for the changed route.",
    "- Use `review.html` for a broad local contact sheet before loading images into model context.",
    "- Re-run this script after visual fixes."
  ].join("\n");

  await writeFile(path.join(outDir, "REVIEW.md"), reviewMarkdown);

  const cards = captures
    .map(
      (capture) => `<article>
        <h2>${htmlEscape(capture.route)} · ${htmlEscape(capture.profile)} · ${capture.status}</h2>
        <img src="${htmlEscape(capture.relativeFile)}" alt="${htmlEscape(`${capture.route} ${capture.profile}`)}" />
      </article>`
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BOF Visual Snapshot</title>
  <style>
    body { margin: 0; background: #f6f8f4; color: #16211f; font-family: Inter, system-ui, sans-serif; }
    header { padding: 24px; border-bottom: 1px solid #dce5df; }
    main { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; padding: 18px; }
    article { background: #fff; border: 1px solid #dce5df; border-radius: 8px; overflow: hidden; }
    h1 { margin: 0 0 8px; }
    h2 { font-size: 14px; margin: 0; padding: 12px 14px; border-bottom: 1px solid #dce5df; }
    img { display: block; width: 100%; height: auto; }
    p { color: #5e6d68; margin: 0; }
  </style>
</head>
<body>
  <header>
    <h1>BOF Visual Snapshot</h1>
    <p>${htmlEscape(manifest.createdAt)} · ${htmlEscape(args.baseUrl)}</p>
  </header>
  <main>${cards}</main>
</body>
</html>`;

  await writeFile(path.join(outDir, "review.html"), html);

  console.log(`Snapshot written to ${outDir}`);
  console.log(`Manifest: ${path.join(outDir, "manifest.json")}`);
  console.log(`Review: ${path.join(outDir, "REVIEW.md")}`);
  console.log(`Contact sheet: ${path.join(outDir, "review.html")}`);

  if (failures.length) {
    console.error(`${failures.length} capture(s) failed.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
