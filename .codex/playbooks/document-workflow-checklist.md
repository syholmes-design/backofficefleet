# Document Workflow Checklist

1. Map the source of truth: seed JSON, workbook, generated manifest, generator, or public artifact.
2. Confirm visible links and fallback `/generated/:path*` behavior.
3. Run the relevant existing validation script.
4. Run `npm run audit:bof-links` for broad link coverage.
5. Report missing documents as demo-impact issues.
6. Fix generators or source data before editing generated output manually.
