import fs from "fs";
import path from "path";
import { INVALID_XML_PCDATA_CTRL_RE } from "./sanitize-svg-text.mjs";

/**
 * @param {string} absolutePath
 * @returns {{ ok: true } | { ok: false, line: number, column: number, code: number }}
 */
export function findInvalidPcdataInSvgFile(absolutePath) {
  const raw = fs.readFileSync(absolutePath, "utf8");
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const m = INVALID_XML_PCDATA_CTRL_RE.exec(line);
    if (m && m.index != null) {
      return {
        ok: false,
        line: i + 1,
        column: m.index + 1,
        code: line.codePointAt(m.index) ?? -1,
      };
    }
  }
  return { ok: true };
}

/**
 * @param {string} dir
 * @param {(rel: string) => void} onFile
 */
export function walkSvgFiles(dir, onFile) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkSvgFiles(full, onFile);
      continue;
    }
    if (ent.name.toLowerCase().endsWith(".svg")) {
      onFile(full);
    }
  }
}
