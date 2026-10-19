# Release candidate: 2026-10-19

**Status:** ready for owner release. **Not deployed**: this agent environment has no production deploy access and cannot reach production.

## 1. Identify the release

- **Branch:** `claude/website-recovery-20261018`. The release commit is the branch head at release time.
- **Commits** (in order):

  | Commit | Contents |
  |---|---|
  | `112ac93d` | Business Operations corrections |
  | `938f29b8` | Michael Anderson verification report |
  | `a035b9a4` | Recruiting integration |
  | `25fa16be` | Recruiting page by stage |
  | `34408b01` | Phase A |
  | `cfdbd24c` | Phase B consolidation |
  | `9eb9ec2d` | Phase C work history |
  | The commit adding this file | Phase E preflight and release tooling |

- **Ancestry:** the branch descends from `release/web-004-005-prep` (the Contact/CRM work, `47955a46` and `1eb5a855`).
- **`main` is not an ancestor and is not the release path.** It has diverged and uses the old `bof-web/` layout (GAP-016 and GAP-017).

## 2. Before release

1. `npm ci && npx prisma generate`
2. `npm run preflight -- --test`. Infrastructure must pass first.
3. Run the tests:
   - `npm run test:route-access`
   - `npm run test:recruiting-v2-tenancy`
   - `node --import ./scripts/lib/ts-alias-loader.mjs --test lib/recruiting/requisition-integration.test.ts lib/qualification/work-history-input.test.ts lib/recruiting-workspace-route.test.ts`
   - On `bof_dev`: `lib/contact/*.test.ts` and `lib/services/requisition-persistence.test.ts`
   - Under `tsx`: `npx tsx --test lib/services/dispatchAssignment.safety.test.ts`
4. `npm run check:preservation` and `npx tsc --noEmit`, then `next build`.
5. **Migrations: owner approval required.** All three are additive (new tables, enum values and nullable/defaulted columns; nothing dropped):
   - `20261016140000_contact_inquiry`
   - `20261017160000_contact_inquiry_management`
   - `20261019120000_requisition_recruiting_integration`

   Check production first with `npx prisma migrate status`. The Contact migrations may already be applied, since WEB-006 was stabilized in production on Oct 17.

   Without `20261019120000`, the signed-in recruiting pages and `/api/recruiting/openings` fail. The careers page then shows "Openings could not be loaded".
6. **Environment:** `BOF_EPOD_ENABLED=false` must be set explicitly in production (ePOD is disabled by owner policy and fails closed). Preflight warns when it is not exactly `false`.

## 3. Authorization and data-isolation changes in this release

**New public endpoints:**
- `GET /api/recruiting/openings`: blind postings only. No carrier name, DOT/MC numbers, managers or budget; enforced by unit test.
- `POST /api/recruiting/apply`: now persists; still public by method. It returns only the application ID.

**New private endpoint:** `GET`/`POST /api/intake/[intakeId]/work-history`.
- Tenant-scoped; another tenant's request gets 404.
- Writes are limited to BOF operations/compliance and fleet admin/manager; anyone else gets 403.
- Every write is audited.

**Tightened:**
- The workspace no longer sends uploaded file bytes.
- Synthetic demo files are no longer served for real candidates.

**Removed:** the `/recruiting-v2` screens. Their APIs are unchanged.

## 4. Rollback

- **Code:** redeploy the previous production deployment (Vercel "Promote" or "Redeploy" of the prior deployment ID). No data migration needs reversing for a code rollback, because every schema change is additive.
- **Schema:** leaving the additive columns, tables and enum values in place is safe with the previous code. Do not drop them during an incident.

## 5. After release (record each result)

1. Record the deployment ID, the commit SHA, and the time.
2. Run `BASE=https://backofficefleet.com node scripts/release/verify-public-routes.mjs`. It is read-only, makes 16 checks, and was verified here against a local production build.
3. **Signed in** with a non-production test account, if one exists:
   - `/recruiting/workspace` loads;
   - the approved requisition shows its position.
4. **Contact:** submit one clearly-labelled test inquiry, confirm it in `/contact-inquiries`, then close it.
5. **Careers:** apply only to a test requisition, if one exists. Otherwise skip; do not create test candidates on real carrier requisitions.
6. **Database:** confirm `_prisma_migrations` lists the three migrations as finished.
