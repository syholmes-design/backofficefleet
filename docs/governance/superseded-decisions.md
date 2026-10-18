# Superseded decisions

Decisions the owner has replaced. Do not reintroduce them on public BOF pages. Each entry names what
replaced it. `npm run check:preservation` fails when superseded public wording reappears.

| Date | Superseded | Replaced by | Notes |
|---|---|---|---|
| 2026-10-18 | **Book a Working Session** (and variants: "working session", "Book a workflow review", "Request a working session", "Book a demo") | **Take the Assessment** → `/assessment` (For-Hire, Private Fleet, Government, BOF Vault/Drivers; category → questions → results → inquiry → confirmation, recorded durably) | Historical pages keep their text otherwise; the replacement is applied by `OWNER_REPLACEMENTS` in `scripts/recovery/recover_business_operations.py` and listed per page in `docs/recovery/business-operations-recovery-report.md`. The contact page's "Fleet operations working session" topic was removed, and the unused `components/BookDemoLink.tsx` ("Book a Demo") was deleted. |
| 2026-10-18 | Developer heading on `/business-operations` ("The dropdown choices are now visible on the page and lead to real operating pages.") | Removed; eyebrow and intro remain | `OWNER_REMOVALS` in the generator. |
| 2026-10-18 | Commit IDs and source paths shown on public recovered pages | Provenance kept in `docs/recovery/` only | Archive banner shows the version date. |
