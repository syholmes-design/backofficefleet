# Document control architecture

Locked lifecycle:

DOCUMENT FAMILY → BOF MASTER DOCUMENT → CARRIER CANONICAL INSTANCE → RECORD / FILLED COPY

BOF master approval is not carrier adoption. Carrier adoption is not a record signature. The current master is not the effective version for every existing carrier. ACTIVE v1 may coexist with in-flight v2. An existing carrier adoption may remain pinned to a superseded master. New adoption against a superseded master is prohibited.

Phase 2D records the qualification gate. It does not create a candidate, a master, an approval, a carrier instance, an adoption, an effectiveness state, or a record.

`RELEASED_TO_MASTER_REVIEW` is not a master, not an approval, not an adoption, not an effective version, and not an operational record.

## States

| Result | Meaning |
| --- | --- |
| BLOCKED | A blocking posture is present. Citation cannot promote it. |
| UNREVIEWED | No passing citation. This is the live state of every non-blocked family. |
| CANDIDATE | Every candidate-gate condition passed. Still not a master. |
| RELEASED_TO_MASTER_REVIEW | A candidate was released into a separately authorized master-review workflow. This is not a master, not approval, not adoption, not effectiveness, and not a record. |

Allowed transitions:

- UNREVIEWED → CANDIDATE, only when every candidate-gate condition passes.
- CANDIDATE → RELEASED_TO_MASTER_REVIEW, only with a valid release entry and a still-valid citation.

No other transition is implemented. There is no automatic transition, no demotion, and no promotion of a BLOCKED, Delta, or held family.

## Candidate evidence

A citation promotes a family only when all seven conditions hold:

1. The source file exists in the repository.
2. The citation `compatibilityMasterId` equals the canonical `familyKey@version` from the qualification row. The family is not derived from an untrusted master id. Extra suffixes, a missing version, a bad separator, a different family, and case or padding that is not already canonical are rejected. The value is not trimmed, case-folded, or repaired.
3. `provenanceCommit` is a full 40-character lowercase commit SHA, the commit is an ancestor of HEAD, and `sourceSha1` is the SHA-1 of that exact path's bytes at that commit. `HEAD`, branch names, tags, abbreviated SHAs, and non-commit objects are rejected.
4. Condition 4 is three sequential parts. All three are required. 4A plus 4B only makes a source eligible for human review. It does not establish carrier neutrality.
   - 4A, admissible source. The extension is case-sensitive and must be `.txt` or `.md`. The bytes are valid UTF-8, non-empty after trim, and contain only tab, LF, CR, and ASCII `0x20–0x7E`, with no `<`, `>`, or `&`. Markup is not stripped, entities are not decoded, and Unicode is not rewritten.
   - 4B, automated carrier screen, runs only after 4A. It matches recorded Delta names and streets with ordinary separators and as a lowercase alphanumeric projection, including `Delta Advanced Trucking`, `DeltaAdvancedTrucking`, `Del*t*a Advanced Trucking`, `D e l t a`, and `Delta.Advanced.Trucking`. Recorded USDOT, MC, and phone values match as digit runs, including a leading country code `1` on a recorded phone, so `8045550148` and `+18045550148` match the recorded phone. A formatted phone is also matched as a phrase. Consecutive digit groups separated only by phone punctuation are joined, including every sub-run, so an unrelated digit beside the phone does not hide it. A longer single digit run is not treated as the recorded number. `DAT` matches case-insensitively when a separator and an identifier follow, including `DAT-MSA-001`, `DAT_MSA_001`, `DAT MSA 001`, `X_DAT-MSA-001`, `file_DAT_SOP_CLM_001`, and `2025DAT-MSA-001`. A word boundary is not required before `DAT`. Encoded facts, separator-free DAT codes, unrecorded variants, and Unicode lookalikes are outside 4B. Those forms still cannot become a candidate when 4A rejects them.
   - 4C, named human neutrality determination. `neutralityDetermination` must be `CARRIER_NEUTRAL`. `neutralityBasis` must be a trimmed printable-ASCII string that says what was reviewed, states `BOF-authored` or `carrier-originated`, and states why the source is `carrier-neutral`. This determination is not a master approval, not carrier adoption, not effectiveness, and not a record. It cannot override a 4A or 4B failure.
5. The family is one document, and its evidence category permits candidacy. The seven Phase 2C inspection categories do not.
6. The family has no unresolved collision and no candidacy hold.
7. A named person and a strict ISO timestamp record the qualification decision.

An implementer assessment is not evidence and cannot satisfy any condition.

Citation fields are exactly: `compatibilityMasterId`, `sourcePath`, `sourceSha1`, `provenanceCommit`, `decidedBy`, `decidedAt`, `neutralityDetermination`, `neutralityBasis`. There is no override field. The citation must be one plain data object: `Object.prototype`, no proxy, no getter or setter, no symbol, no inherited property, and no non-enumerable property. Each field is read once into a frozen snapshot. The collector, candidate gate, qualification builder, validator, and release check all use that snapshot. `facts.sourcePath` must equal the snapshot `sourcePath`. On a CANDIDATE or RELEASED_TO_MASTER_REVIEW row, `sourceRef` must equal that same path. Two citations for one canonical master id do not promote; the result stays UNREVIEWED and the duplicate is flagged. Order does not matter. A snapshot failure that still exposes that master id blocks the id, and an entry whose master id cannot be read blocks promotion. A blank or whitespace-only `compatibilityMasterId` is not a master id, is not indexed, and blocks promotion. It is not trimmed into an id. A register citation or release is valid only when that id is the exact canonical identity of an existing qualification row. A noncanonical or orphan id is reported and blocks promotion. It is not trimmed, case-folded, repaired, or attached to a similar row. Neither entry is discarded. The same rule applies to releases.

## Release

Release fields are exactly: `compatibilityMasterId`, `releasedBy`, `releasedAt`, `masterWorkScopeRef`. A release is valid only while its citation is still valid. The live release register is empty.

## Candidacy holds

A hold blocks promotion. It does not change the qualification result. The master id is validated against `familyKey@version` before the hold lookup. Holds are family-level, so `BOF-DRV-002@1.0`, `BOF-DRV-002@2.0`, and `BOF-DRV-002@3.0` all respect a hold on `BOF-DRV-002`. A malformed id cannot select a different family. Phase 2D creates no live candidate.

`RELEASED_TO_MASTER_REVIEW` still requires a valid citation snapshot, provenance, the Condition 4 result, and the hold, collision, and Delta checks. It is not a master, not an approval, not an adoption, not an effective version, and not a record.

| Family | Hold |
| --- | --- |
| BOF-DRV-002 | IDENTITY_UNRESOLVED |
| BOF-VEH-001 | IDENTITY_UNRESOLVED |
| BOF-CUS-AGR-002 | CATALOG_FAMILY, SOURCE_BODY_MISSING |
| BOF-SAF-TPL-001 | CATALOG_FAMILY, SOURCE_BODY_MISSING |
| BOF-DRV-FORM-001 | IDENTITY_UNRESOLVED |
| BOF-EQP-FORM-001 | IDENTITY_UNRESOLVED |
| BOF-SAF-FORM-004 | IDENTITY_UNRESOLVED |

## Live Phase 2D register

30 BLOCKED. 34 UNREVIEWED. 0 CANDIDATE. 0 RELEASED_TO_MASTER_REVIEW. 0 citations. 0 releases. Six Delta families remain BLOCKED.

Approved-master validation applies to a registered family that is not RELEASED_TO_MASTER_REVIEW, and to every Delta family. A family that is not on the Phase 2 register is outside that rule. Record validation follows the record's own family. `candidateRecord` applies to the candidate's own family.

## Phase 2E master review

Master review starts only from a qualification row whose result is exactly `RELEASED_TO_MASTER_REVIEW` for that canonical id. The gate re-runs the Phase 2D citation evaluator and the Phase 2D release evaluator. A caller-supplied issue count cannot make an invalid citation or release valid. `NaN` and a negative count fail closed. The live citation register and the live release register stay empty, so no current family is in review.

The gate loads Delta qualification family keys and unresolved collision family keys itself. A caller list may add blocks. It cannot be the only source. Holds stay family-level. The gate does not assign a version number. It accepts only an exact `familyKey@major.minor`. `MAJOR` and `MINOR` are recorded review classes, not a generated sequence.

Eight subjects stay separate: document identity, document function, document content, document version, BOF authorship, carrier neutrality, regulatory or company-policy role, and provenance. A qualified review records a separate genuine-master review state. That state cites the compatibility id that was reviewed. It does not set `genuineBofMaster` on the compatibility identity, and the compatibility roster stays `genuineBofMaster: false`. Qualification is not approval. Approval re-checks the disposition, the empty issue list, authorship, all eight subjects, the canonical id, and the separation from the compatibility identity. `genuineBofMaster: true` on a review object is not approval evidence. Neither decision creates an adoption, a carrier instance, or a record.

`REJECTED` is stored against that exact canonical id in the authoritative review history. The live review register is empty and the gate does not write it. An empty caller history cannot erase a recorded rejection. `INSUFFICIENT_EVIDENCE` is a different disposition. It does not qualify a genuine-master state and it does not block a later review. Evidence, reviewer, rationale, and policy provenance that are empty after Unicode format characters are removed fail closed. The same rule applies inside the Phase 2D evaluators to citation `decidedBy` and release `releasedBy` and `masterWorkScopeRef`. The submitted text is not rewritten.

A carrier policy provision is `BOF_MANDATORY`, `BOF_DEFAULT_CARRIER_CONFIGURABLE`, or `CARRIER_SPECIFIC`. The provision carries the BOF default, the permitted choices, and whether an override is allowed. The carrier supplies only the selection. A mandatory provision cannot be overridden. A null selection fails closed for a configurable or carrier-specific provision. No live policy selection exists. Compatibility identities and Delta instances are unchanged.

## Remaining lifecycle

The lifecycle after a qualified Phase 2E review is one contract:

DOCUMENT FAMILY → BOF MASTER DOCUMENT → MASTER APPROVAL → CARRIER ADOPTION → CARRIER CANONICAL INSTANCE → OPERATIONAL RECORD / FILLED COPY

A compatibility identity is the reviewed `familyKey@version`. A genuine master is a separate `MasterDocument` whose id is also `familyKey@version`, built with `makeMasterId`. That version is an explicit input. It is not minted. Establishment rejects the id when it equals the reviewed compatibility id or any other compatibility id on the roster. Approval re-runs the Phase 2E review. Adoption re-runs approval. A canonical instance re-runs adoption. A caller-built object is not proof that an earlier gate succeeded. One current master is counted from the roster, so an empty caller list cannot hide a roster master. The genuine master cites the reviewed compatibility id, the review decision, the reviewer, and the review evidence. It stays unapproved until the approval gate succeeds. The compatibility roster stays `genuineBofMaster: false`. Evidence reuse removes Unicode format characters before the existing case-insensitive comparison, and each evidence value is read once.

Genuine-master review is not master approval. Master approval is a BOF Master Approval Authority decision with its own timestamp and evidence. `REQUIRES_LEGAL_REVIEW` is not approval. Carrier adoption is a Carrier Adoption Authority decision. Its evidence must be a different reference. Adoption does not rewrite the master. A new adoption after `supersededAt`, or with an unparseable `supersededAt`, fails. An adoption that already exists, and is dated before `supersededAt`, stays effective after the master becomes superseded.

A carrier canonical instance is `familyKey::carrierId`. It pins the approved master id and has its own `instanceVersion`. The two version namespaces are not the same field. An operational record pins `instanceId` and `instanceVersion`. A signed record is an operational copy. It is not adoption, approval, a new master, or a new instance.

Policy classes stay `BOF_MANDATORY`, `BOF_DEFAULT_CARRIER_CONFIGURABLE`, and `CARRIER_SPECIFIC`. A caller cannot replace the BOF default or the permitted choices. This lifecycle does not add withdrawal or expiration states. It does not unblock Delta and it does not merge collisions. The live genuine-master, approval, adoption, instance, and record registers stay empty.
