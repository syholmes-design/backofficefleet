# Stage 0 D-2 — Enforcement / observe-mode implementation

Implements `STAGE0-D2-ENFORCEMENT-POLICY.md` (branch `docs/stage0-d2-enforcement-policy`) under the owner's decisions
7.1–7.8 and ten safeguards, on the certified lineage `cursor/stage0-i9r-remediation` @ `53acec36`.

**Net effect of this change on movement: none, in any mode.** The soft-override classification the owner required is
not available from the evaluator (below), so the safe ENFORCE behavior applies everywhere. What is delivered is the
machinery: mode resolution with a production lock, BOF-only configuration with history, shadow/effective evidence on
every assignment and release, and a fail-safe override gate with an empty allowlist.

## Required report: missing classification (do not infer eligibility from PENDING_COMPLIANCE)

Decision 7.2 permits OBSERVE to pass only an *administrative* `PENDING_COMPLIANCE` deficiency when every mandatory
qualification is independently verified and current. The authoritative result cannot establish that:

- `PENDING_COMPLIANCE` mixes mandatory-credential gaps (`DRIVER_LICENSE_MISSING`, `*_UNVERIFIED`,
  `*_NOT_COMPLIANCE_VERIFIED`, `*_NOT_RECORDED`, `WORK_HISTORY_MISSING/INCOMPLETE`) with generic legacy codes
  (`MISSING_REQUIRED_DOCUMENT`, `DOCUMENT_PENDING_VERIFICATION`, `DRUG_TEST_PENDING`, `MANUAL_REVIEW_REQUIRED`,
  `QUALIFICATION_RULES_NOT_MET`) that are raised for mandatory and non-mandatory evidence alike.
- No reason code, field or finding carries a "mandatory evidence is verified and current" assertion, and the result
  does not say which finding came from which source.

Required to enable any soft override (not done here): the evaluator must report, per finding, a category
(`MANDATORY_CREDENTIAL` / `ADMINISTRATIVE`) and an overall flag that all mandatory registry items are verified and
current, with certification of that classification. Until then `SOFT_OVERRIDE_POLICY.softReasonCodes` is empty:
every denial, including all `PENDING_COMPLIANCE`, is hard (safeguard 3).

## What was implemented

| Component | Behavior |
| --- | --- |
| `stage0EnforcementPolicy.ts` | `resolveStage0EnforcementMode`: production lock → fleet setting → platform default → fail-safe ENFORCE. Never throws; reads the setting in a savepoint so a failed read cannot abort the movement transaction. `decideEffectiveAuthorization` (pure): ENFORCE and `PICKUP_VERIFY`/`PICKUP_ISSUE` never override; only an all-enumerated soft denial in a soft stage can; empty, unknown or mixed codes are hard. |
| Production lock (7.6) | OBSERVE is honored only when `BOF_STAGE0_ENVIRONMENT_CLASS` is explicitly `LOCAL`, `TEST` or `STAGING` and `VERCEL_ENV` is not `production`. Unset or anything else = production-like = ENFORCE, whatever the platform variable or a stored setting says. `PRODUCTION_OBSERVE_PERMITTED` is a code constant (`false`): enabling production OBSERVE requires a separately certified code change (safeguard 10). |
| `authorizeMovement` | Evaluation order, locks (equipment → driver) and the returned result are unchanged; the result gains `enforcement` (`mode`, `modeSource`, `shadowAllowed`, `effectiveAllowed`, `overridden`, reason codes). Callers still decide on `allowed`. |
| Persistence (7.7) | New columns on `DispatchAssignment` and `DispatchRelease`: `enforcementMode`, `shadowAllowed`, `effectiveAllowed`, `enforcementOverridden`, `enforcementPolicyVersion`, `enforcementMetadata` (JSON: source, setting id, configuring user, overridden codes, refusal reason). Written in the same insert as the row. Invalidation releases (I-7/I-8) are always enforced and carry no decision (columns null). The assignment refusal audit, `dispatch.assigned` audit and pickup-issue audit include the decision. |
| Configuration (7.5, §3) | `stage0EnforcementConfigService` + `GET/PUT /api/stage0/enforcement/[fleetId]`. Change: ACTIVE `BOF_OPERATIONS` or `BOF_COMPLIANCE_REVIEW` membership of the fleet, read from the database inside the per-fleet lock. Refused (403, audited): dispatchers, fleet admin, fleet operations/manager, drivers, other fleets, inactive/suspended/no membership, session-claimed roles. Reason required (10–500 chars). OBSERVE cannot be set where unavailable (409). |
| History (safeguard 8) | Append-only `Stage0EnforcementModeChange` (previous/new mode, reason, actor, role, policy version) + audit event `stage0.enforcement_mode_changed` + operational-chat notification, in one transaction with the setting; no-op changes record nothing. |
| Visibility (7.8) | `GET` returns the effective mode and `observeBanner`/`bannerText` ("Safety, qualification and equipment restrictions are NOT waived") to any active fleet member; configuration and history only to BOF roles and the carrier FLEET_ADMIN (read-only). The dispatch-interface banner component is **not** implemented here; the API supplies its content. |

## Safeguards

| # | Safeguard | Status |
| --- | --- | --- |
| 1 | Shadow result preserved | `allowed`/`disposition`/`reasonCodes` unmodified; the persisted release disposition is the shadow result |
| 2 | Overrides only for enumerated soft codes | Gate implemented; allowlist empty |
| 3 | Unknown/mixed/unclassified = hard | Tested |
| 4 | I-7/I-8/I-9R protections preserved | Invalidation, physical STOP, equipment restoration rules unchanged; tested under OBSERVE |
| 5 | Durable evidence when effective ≠ shadow | No such case can occur yet; the decision is persisted with every row regardless |
| 6 | Persistence failure cannot silently authorize | Decision and row are one insert; the config change is one transaction (tested with an injected audit failure) |
| 7 | Override authority limited to BOF roles/fleet scope | Mode authority implemented; per-override authority arrives with the first override |
| 8 | Mode-change history | Implemented |
| 9 | OBSERVE cannot bypass restoration/STOP/identity | Tested under OBSERVE |
| 10 | Separate certification before production OBSERVE | Production lock + constant; requires a code change |

## Deployment notes

- Migration `20261023120000_stage0_d2_enforcement_policy` is additive (1 enum, 2 tables, 12 nullable/defaulted
  columns, indexes, FKs). Not applied to any shared database.
- No environment variable is required: absent configuration = ENFORCE. Staging pilots need
  `BOF_STAGE0_ENVIRONMENT_CLASS=STAGING` and a BOF-set fleet setting.
- Out of scope (unchanged): S0-I9-03…09, the banner UI, external notification (D-5), production OBSERVE.
