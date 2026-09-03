#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chunksDir = path.join(ROOT, ".next", "static", "chunks");

function copyAlias(prefix, aliasName) {
  if (!fs.existsSync(chunksDir)) return;
  const source = fs
    .readdirSync(chunksDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".js") && name !== aliasName)
    .sort((left, right) => fs.statSync(path.join(chunksDir, right)).mtimeMs - fs.statSync(path.join(chunksDir, left)).mtimeMs)[0];
  if (!source) return;
  fs.copyFileSync(path.join(chunksDir, source), path.join(chunksDir, aliasName));
  console.log(`[ensure-next-chunk-aliases] ${aliasName} -> ${source}`);
}

copyAlias("main-app-", "main-app.js");
copyAlias("polyfills-", "polyfills.js");