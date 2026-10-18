#!/usr/bin/env python3
"""
Recover BOF's Business Operations pages from Git history into the Next.js site.

Source content is copied VERBATIM from the historical page's <main> element.
Nothing is paraphrased. Each page records its provenance (commit + path).
Optional "merge" sources contribute only top-level sections whose text is not
already present in the base page (sections a later version dropped); every
merged section is logged in the report.

Outputs (committed):
  content/recovered-site/business-operations/<key>.json   page content + provenance
  content/recovered-site/business-operations/manifest.json
  public/recovered-assets/<generation>/assets/...           referenced images/PDFs/JS/data
  docs/recovery/business-operations-recovery-report.md     sources, merges, link resolution

Run from the repo root:  python3 scripts/recovery/recover_business_operations.py
"""
import html
import json
import os
import re
import subprocess
import sys
from html.parser import HTMLParser
from urllib.parse import urljoin

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "content", "recovered-site", "business-operations")
ASSET_OUT = os.path.join(ROOT, "public", "recovered-assets")
REPORT = os.path.join(ROOT, "docs", "recovery", "business-operations-recovery-report.md")

# Generations: where a page's HTML, stylesheet and assets come from.
GENERATIONS = {
    "static-20260729": {"commit": "66929e67", "root": "Website", "label": "Static BOF site, 2026-07-29 (origin/codex/public-site-deployment-candidate)"},
    "static-20260701": {"commit": "46b2c464", "root": "Website", "label": "Static BOF site, 2026-07-01 (origin/feature/cta-language-cleanup)"},
    "fork-20260819": {"commit": "e901e6cb", "root": "recovered/fork-restored-20260819", "label": "Recovered fork, 2026-08-19 (recovered/fork-restored-20260819)"},
}

S29 = "static-20260729"
FORK = "fork-20260819"


def src(gen, rel, merges=None):
    return {"gen": gen, "path": rel, "merges": merges or []}


def merge(commit, rel, only=None):
    """A section donor. The donor's hero and call-to-action sections (by class) are never merged.
    `only` restricts merging to sections whose heading starts with one of the given strings."""
    return {"commit": commit, "path": f"Website/{rel}", "only": only}


BO = "business-operations"

# Owner-directed removals (2026-10-18): exact recovered markup taken off the public page.
# Nothing is reworded or added; the removal is recorded on the page and in the recovery report.
OWNER_REMOVALS = {
    "/business-operations": [
        # Development note shown as the directory heading in f254f4e3; the eyebrow and intro remain.
        "<h2>The dropdown choices are now visible on the page and lead to real operating pages.</h2>",
    ],
}

# route -> source. Merge sources: same July lineage (rendered with the 2026-07-29 stylesheet).
PAGES = {
    "/business-operations": src(S29, f"{BO}/index.html", [
        merge("f254f4e3", f"{BO}/index.html", only=["The dropdown choices are now visible"]),  # Business Operations directory (8 second-level pages)
        merge("db03d3be", f"{BO}/index.html", only=["Office follow-up by record", "Every issue needs a reason"]),
    ]),
    "/business-operations/driver-onboarding": src(S29, f"{BO}/driver-onboarding/index.html", [merge("f254f4e3", f"{BO}/driver-onboarding/index.html")]),
    "/business-operations/document-management": src(S29, f"{BO}/document-management/index.html", [merge("f254f4e3", f"{BO}/document-management/index.html")]),
    "/business-operations/operational-reporting": src(S29, f"{BO}/operational-reporting/index.html", [merge("f254f4e3", f"{BO}/operational-reporting/index.html")]),
    "/business-operations/customer-billing": src(S29, f"{BO}/customer-billing/index.html", [merge("f254f4e3", f"{BO}/customer-billing/index.html")]),
    "/business-operations/accounts-receivable": src(S29, f"{BO}/accounts-receivable/index.html", [merge("f254f4e3", f"{BO}/accounts-receivable/index.html")]),
    "/business-operations/payroll-administration": src(S29, f"{BO}/payroll-administration/index.html", [merge("f254f4e3", f"{BO}/payroll-administration/index.html")]),
    "/business-operations/accounting-finance": src(S29, f"{BO}/accounting-finance/index.html", [merge("f254f4e3", f"{BO}/accounting-finance/index.html")]),
    "/business-operations/hr-tier": src(S29, f"{BO}/hr-tier/index.html"),
    # Fourteen functional-area pages (static site, 2026-07-21 to 07-29).
    **{f"/business-operations/{a}": src(S29, f"{BO}/{a}/index.html") for a in [
        "accounting", "cash-flow", "erp", "excise-taxes", "fleet-maintenance", "fuel-management", "human-resources",
        "insurance", "legal-contracts", "operating-authority", "owner-operator", "payroll", "safety-sms", "technology"]},
    # Third level (static originals).
    **{f"/business-operations/{p}": src(S29, f"{BO}/{p}/index.html") for p in [
        "driver-onboarding/assignment-readiness", "document-management/records-control", "operational-reporting/owner-queue-reporting",
        "customer-billing/billing-packet-control", "accounts-receivable/aging-dispute-control", "payroll-administration/pay-exception-control",
        "accounting-finance/ap-vendor-control", "accounting-finance/cash-flow-review", "hr-tier/recruiting-onboarding",
        "hr-tier/compensation-benefits", "hr-tier/talent-management", "hr-tier/employee-relations"]},
    # Pages that exist only in the recovered fork (URLs already used by the current site).
    "/business-operations/document-records-control": src(FORK, f"{BO}/document-records-control/index.html"),
    "/business-operations/customer-billing/billing-ar-control": src(FORK, f"{BO}/customer-billing/billing-ar-control/index.html"),
    # Archive: alternative historical versions kept for owner comparison (noindex, not in public navigation).
    "/business-operations/archive/command-center-2026-07-01": src("static-20260701", f"{BO}/index.html"),
    "/business-operations/archive/business-office-2026-08-19": src(FORK, f"{BO}/index.html"),
    "/business-operations/archive/assignment-readiness-2026-08-19": src(FORK, f"{BO}/driver-onboarding/assignment-readiness/index.html"),
    "/business-operations/archive/owner-queue-reporting-2026-08-19": src(FORK, f"{BO}/operational-reporting/owner-queue-reporting/index.html"),
    "/business-operations/archive/pay-exception-control-2026-08-19": src(FORK, f"{BO}/payroll-administration/pay-exception-control/index.html"),
}

# Historical public links that have no page in the recovered set, mapped to the
# current site's equivalent destination (verified to exist). Decisions documented
# in the report. Keys are normalized paths (no trailing slash).
LINK_MAP = {
    "/scenario-walkthrough": "/book-assessment",
    "/book-demo": "/contact",
    "/book-a-demo": "/contact",
    "/contact": "/contact",
    "/assessment": "/book-assessment",
    "/customer-demo": "/dashboard",
    "/demo": "/dashboard",
    "/dashboard": "/dashboard",
    "/command-center": "/demo/command-center",
    "/command-center/issue": "/demo/command-center",
    "/aggregator-command-center": "/aggregators",
    "/aggregators": "/aggregators",
    "/drivers": "/demo/drivers",
    "/drivers/onboarding": "/business-operations/driver-onboarding",
    "/drivers/compliance-documents": "/documents",
    "/drivers/settlements-payments": "/demo/settlements",
    "/dispatch": "/demo/dispatch",
    "/workflows/dispatch-assignment": "/demo/dispatch",
    "/settlements": "/demo/settlements",
    "/documents": "/documents",
    "/safety": "/safety",
    "/bof-vault": "/bof-vault",
    "/company": "/company",
    "/about": "/company",
    "/how-bof-works": "/how-bof-works",
    "/": "/",
    # Pages of the historical site that no longer exist; nearest current destination (verified to load).
    "/policies-procedures": "/documents/company-operations-vault",
    "/document-readiness-engine": "/documents/compliance-flow",
    "/load-readiness": "/demo/loads",
    "/operations-record": "/demo/command-center",
    "/operational-intelligence": "/demo/command-center",
    "/capacity-intelligence": "/demo/dispatch",
    "/carrier-readiness": "/carriers",
    "/executive-demo": "/dashboard",
    "/animated-demo-business": "/dashboard",
    "/workflows": "/how-bof-works",
    "/workflows/bills-of-lading": "/documents",
    "/workflows/proof-of-delivery": "/documents",
    "/workflows/factoring-packet-preparation": "/demo/settlements",
    "/settlements/exception-visibility": "/demo/settlements",
    "/settlements/single-record-accountability": "/demo/settlements",
    "/settlements/finance-operations-alignment": "/demo/settlements",
}

ASSET_EXT = re.compile(r"\.(png|jpe?g|webp|gif|svg|ico|mp4|webm|mp3|pdf|json|js|css|html|docx?|xlsx?|csv|txt|woff2?|ttf)$", re.I)


def git_show(commit, path):
    r = subprocess.run(["git", "-C", ROOT, "show", f"{commit}:{path}"], capture_output=True)
    if r.returncode != 0:
        return None
    return r.stdout


class Tree(HTMLParser):
    """Records element start/end offsets so sections can be sliced verbatim."""

    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

    def __init__(self, text):
        super().__init__(convert_charrefs=False)
        self.text = text
        self.lines = [0]
        for m in re.finditer("\n", text):
            self.lines.append(m.end())
        self.stack = []
        self.nodes = []  # dicts: tag, attrs, start, inner_start, end, depth
        self.feed(text)

    def _pos(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        start = self._pos()
        raw = self.get_starttag_text() or ""
        node = {"tag": tag, "attrs": dict(attrs), "start": start, "inner_start": start + len(raw), "end": None, "depth": len(self.stack)}
        self.nodes.append(node)
        if tag not in self.VOID:
            self.stack.append(node)
        else:
            node["end"] = start + len(raw)

    def handle_startendtag(self, tag, attrs):
        start = self._pos()
        raw = self.get_starttag_text() or ""
        self.nodes.append({"tag": tag, "attrs": dict(attrs), "start": start, "inner_start": start + len(raw), "end": start + len(raw), "depth": len(self.stack)})

    def handle_endtag(self, tag):
        pos = self._pos()
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]["tag"] == tag:
                node = self.stack[i]
                node["inner_end"] = pos
                node["end"] = pos + len(f"</{tag}>")
                del self.stack[i:]
                return


def text_of(fragment):
    fragment = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", fragment)
    t = html.unescape(re.sub(r"<[^>]+>", " ", fragment))
    return re.sub(r"\s+", " ", t).strip()


def main_parts(doc):
    tree = Tree(doc)
    main = next((n for n in tree.nodes if n["tag"] == "main"), None)
    body = next((n for n in tree.nodes if n["tag"] == "body"), None)
    if not main:
        raise RuntimeError("no <main>")
    children = [n for n in tree.nodes if n["depth"] == main["depth"] + 1 and main["inner_start"] <= n["start"] < main["inner_end"]]
    title = re.search(r"(?is)<title>(.*?)</title>", doc)
    desc = re.search(r'(?is)<meta\s+name="description"\s+content="([^"]*)"', doc)
    inline_scripts = []
    external_scripts = []
    for n in tree.nodes:
        if n["tag"] != "script":
            continue
        if n["attrs"].get("src"):
            external_scripts.append(n["attrs"]["src"])
        elif n["attrs"].get("type", "text/javascript") in ("text/javascript", "module", "") and n.get("inner_end"):
            inline_scripts.append(doc[n["inner_start"]:n["inner_end"]])
    return {
        "main_attrs": main["attrs"],
        "inner": doc[main["inner_start"]:main["inner_end"]],
        "children": [{"html": doc[c["start"]:c["end"]], "tag": c["tag"]} for c in children if c["end"]],
        "body_class": (body["attrs"].get("class") if body else "") or "",
        "title": html.unescape(title.group(1).strip()) if title else "",
        "description": html.unescape(desc.group(1)) if desc else "",
        "inline_scripts": inline_scripts,
        "external_scripts": external_scripts,
    }


def norm_path(href):
    path = href.split("#")[0].split("?")[0]
    path = re.sub(r"/index\.html$", "", path)
    if len(path) > 1:
        path = path.rstrip("/")
    return path or "/"


def strip_script_tags(fragment):
    return re.sub(r"(?is)<script\b[^>]*>.*?</script>", "", fragment)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    routes = set(PAGES.keys())
    manifest = {}
    assets_needed = {}  # (gen, asset path) -> set(routes)
    link_report = {}  # normalized link -> {"resolved": x, "from": set()}
    merge_log = []

    for route, spec in PAGES.items():
        gen = GENERATIONS[spec["gen"]]
        raw = git_show(gen["commit"], f"{gen['root']}/{spec['path']}")
        if raw is None:
            sys.exit(f"missing source {gen['commit']}:{gen['root']}/{spec['path']}")
        doc = raw.decode("utf-8")
        parts = main_parts(doc)
        sections = [c["html"] for c in parts["children"]]
        base_text = text_of(parts["inner"])

        for m in spec["merges"]:
            mraw = git_show(m["commit"], m["path"])
            if mraw is None:
                continue
            mparts = main_parts(mraw.decode("utf-8"))
            for child in mparts["children"]:
                # Never merge a donor's hero or closing call-to-action section.
                opening = re.match(r'(?is)<[a-z]+[^>]*\bclass="([^"]*)"', child["html"])
                classes = opening.group(1) if opening else ""
                if re.search(r"hero|cta", classes):
                    continue
                t = text_of(child["html"])
                heading_m = re.search(r"(?is)<h[1-3][^>]*>(.*?)</h[1-3]>", child["html"])
                heading_t = text_of(heading_m.group(1)) if heading_m else ""
                if m.get("only") and not any(heading_t.startswith(o) for o in m["only"]):
                    continue
                words = len(t.split())
                # Keep only substantive sections whose wording the base page does not already contain.
                probe = t[:160]
                if words < 25 or probe in base_text:
                    continue
                # Insert before the base page's closing call-to-action section.
                sections.insert(max(len(sections) - 1, 0), child["html"])
                base_text += " " + t
                heading = re.search(r"(?is)<h[1-3][^>]*>(.*?)</h[1-3]>", child["html"])
                merge_log.append((route, m["commit"], m["path"], text_of(heading.group(1)) if heading else t[:80], words))

        content = strip_script_tags("\n".join(sections))
        prefix = f"/recovered-assets/{spec['gen']}"

        page_url = "/" + os.path.dirname(spec["path"]).strip("/") + "/"

        def rewrite_url(url, route=route, gen_key=spec["gen"], prefix=prefix, page_url=page_url):
            if url.startswith(("#", "mailto:", "tel:", "http://", "https://", "data:", "javascript:")) or url.startswith("//"):
                return url
            if not url.startswith("/"):
                url = urljoin(page_url, url)
            if url.startswith("/assets/"):
                clean = url.split("?")[0].split("#")[0]
                assets_needed.setdefault((gen_key, clean), set()).add(route)
                return prefix + url
            if url.startswith("/") and not url.startswith("//"):
                path = norm_path(url)
                frag = ("#" + url.split("#", 1)[1]) if "#" in url else ""
                if ASSET_EXT.search(path) and not path.startswith("/business-operations"):
                    resolved = LINK_MAP.get(path)
                    entry = link_report.setdefault(path, {"resolved": resolved, "from": set()})
                    entry["from"].add(route)
                    return (resolved + frag) if resolved else url
                if path in routes:
                    resolved = path
                else:
                    resolved = LINK_MAP.get(path)
                entry = link_report.setdefault(path, {"resolved": resolved, "from": set()})
                entry["from"].add(route)
                return (resolved or path) + frag
            return url

        def attr_sub(m):
            return f'{m.group(1)}="{rewrite_url(m.group(2))}"'

        content = re.sub(r'\b(href|src|poster|data-src)="([^"]+)"', attr_sub, content)
        content = re.sub(r'\bsrcset="([^"]+)"', lambda m: 'srcset="' + ", ".join(
            " ".join([rewrite_url(p.strip().split(" ")[0])] + p.strip().split(" ")[1:]) for p in m.group(1).split(",")) + '"', content)
        content = re.sub(r"url\((['\"]?)(/assets/[^)'\"]+)\1\)", lambda m: f"url({m.group(1)}{rewrite_url(m.group(2))}{m.group(1)})", content)

        scripts = [s.strip() for s in parts["inline_scripts"] if s.strip() and "application/ld+json" not in s]
        # External page scripts that implement in-page widgets (navigation-only site.js and the
        # remote Supabase config are intentionally excluded; data loads from the local JSON copy).
        widget_scripts = []
        for s in parts["external_scripts"]:
            path = s.split("?")[0]
            name = os.path.basename(path)
            if not path.startswith("/"):
                path = urljoin(page_url, path)
            if name in ("site.js", "bof-supabase-config.js", "cinematic-nav.js", "fork-path-v2.js"):
                continue
            assets_needed.setdefault((spec["gen"], path), set()).add(route)
            widget_scripts.append(prefix + path)
        if any("bof-driver-pay-profiles.js" in s for s in widget_scripts):
            assets_needed.setdefault((spec["gen"], "/assets/data/bof-public-operations.json"), set()).add(route)

        removals = []
        for snippet in OWNER_REMOVALS.get(route, []):
            if content.count(snippet) != 1:
                raise SystemExit(f"owner removal not found exactly once on {route}: {snippet[:60]}")
            content = content.replace(snippet, "")
            removals.append(snippet)

        key = route.strip("/").replace("/", "__") or "index"
        page = {
            "route": route,
            "generation": spec["gen"],
            "source": {"commit": gen["commit"], "path": f"{gen['root']}/{spec['path']}", "label": gen["label"]},
            "merges": [{"commit": m["commit"], "path": m["path"]} for m in spec["merges"]],
            "ownerRemovals": removals,
            "title": parts["title"],
            "description": parts["description"],
            "bodyClass": parts["body_class"],
            "mainClass": parts["main_attrs"].get("class", ""),
            "mainId": parts["main_attrs"].get("id", ""),
            "html": content,
            "inlineScripts": scripts,
            "widgetScripts": widget_scripts,
            "archive": route.startswith("/business-operations/archive/"),
        }
        with open(os.path.join(OUT_DIR, f"{key}.json"), "w") as fh:
            json.dump(page, fh, ensure_ascii=False, indent=0)
        manifest[route] = {"key": key, "title": parts["title"], "description": parts["description"], "generation": spec["gen"], "archive": page["archive"]}

    with open(os.path.join(OUT_DIR, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)

    # Copy every referenced asset from its generation (Git history or recovered tree).
    copied, missing = 0, []
    for (gen_key, path), used_by in sorted(assets_needed.items()):
        gen = GENERATIONS[gen_key]
        data = git_show(gen["commit"], f"{gen['root']}{path}")
        if data is None:
            # Fall back to any later generation copy of the same asset path.
            for other in ("static-20260729", "fork-20260819"):
                og = GENERATIONS[other]
                data = git_show(og["commit"], f"{og['root']}{path}")
                if data is not None:
                    break
        if data is None:
            missing.append((gen_key, path, sorted(used_by)))
            continue
        if path.endswith(".js"):
            # Recovered widget scripts reference their data by absolute /assets/ path.
            data = re.sub(rb'(["\'])/assets/', lambda m: m.group(1) + f"/recovered-assets/{gen_key}/assets/".encode(), data)
            # Page links inside widget scripts follow the same verified link map as page markup.
            def map_js_link(m):
                path = norm_path(m.group(2).decode())
                target = LINK_MAP.get(path)
                return m.group(1) + (target.encode() if target else m.group(2)) + m.group(1)
            data = re.sub(rb'(["\'])(/(?!recovered-assets|assets|rest/)[a-z][a-z0-9/_?=.-]*)\1', map_js_link, data)
        dest = os.path.join(ASSET_OUT, gen_key, path.lstrip("/"))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as fh:
            fh.write(data)
        copied += 1

    # Report.
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    lines = ["# Business Operations recovery report (generated)", "",
             "Generated by `scripts/recovery/recover_business_operations.py`. Content is copied verbatim from the cited commits.", "",
             "## Pages", "", "| Route | Generation | Source commit:path | Title |", "|---|---|---|---|"]
    for route, spec in PAGES.items():
        g = GENERATIONS[spec["gen"]]
        lines.append(f"| `{route}` | {spec['gen']} | `{g['commit']}:{g['root']}/{spec['path']}` | {manifest[route]['title']} |")
    lines += ["", "## Merged sections (present in an earlier version, dropped later)", "", "| Route | From | Section | Words |", "|---|---|---|---|"]
    for route, commit, path, heading, words in merge_log:
        lines.append(f"| `{route}` | `{commit}:{path}` | {heading[:90]} | {words} |")
    lines += ["", "## Owner-directed removals (not shown on the public page)", "", "| Route | Removed recovered markup |", "|---|---|"]
    for route, snippets in OWNER_REMOVALS.items():
        lines += [f"| `{route}` | `{sn}` |" for sn in snippets]
    lines += ["", f"## Assets: {copied} copied, {len(missing)} missing", ""]
    for gen_key, path, used in missing:
        lines.append(f"- MISSING `{gen_key}{path}` (used by {', '.join(used)})")
    lines += ["", "## Link resolution", "", "| Historical link | Resolved to | Used on |", "|---|---|---|"]
    for path, entry in sorted(link_report.items()):
        lines.append(f"| `{path}` | {('`' + entry['resolved'] + '`') if entry['resolved'] else '**UNRESOLVED**'} | {len(entry['from'])} page(s) |")
    with open(REPORT, "w") as fh:
        fh.write("\n".join(lines) + "\n")

    unresolved = [p for p, e in link_report.items() if not e["resolved"]]
    print(f"pages={len(manifest)} merges={len(merge_log)} assets copied={copied} missing={len(missing)} unresolved links={len(unresolved)}")
    for p in sorted(unresolved):
        print("  UNRESOLVED", p, sorted(link_report[p]["from"])[:3])
    for gen_key, path, used in missing:
        print("  MISSING", gen_key, path)


if __name__ == "__main__":
    main()
