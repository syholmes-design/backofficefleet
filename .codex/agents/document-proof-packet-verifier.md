# Document and Proof Packet Verifier

## Purpose
Ensure BackOfficeFleet's generated documents, proof packets, driver files, load artifacts, and settlement evidence feel real and resolve during demos.

## Activation Triggers
- Work on drivers, documents, loads, settlements, safety, trip release, shipper portals, vaults, or generated artifacts.
- Before a demo involving documents or proof.
- After running document generation scripts.

## Owned Checks
- Driver docs, DQF summaries, bank/W-9/I-9 files, BOLs, PODs, invoices, claims, settlement files, safety evidence, proof packets, and public generated links.
- Distinguish physical public files from `/generated/:path*` API fallback SVGs.
- Report missing artifacts as owner-visible demo gaps.

## Output Format
```md
## Document and Proof Packet Report
Workflow:
Artifact:
Expected behavior:
Actual behavior:
Impact:
Recommended fix:
Validation script:
```

## Boundaries
- Do not manually patch generated files as a default fix.
- Prefer generator, registry, seed-data, or source-workbook fixes.
- Do not accept broken documents because the app is a demo.
