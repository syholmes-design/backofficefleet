# BOF Template Pack Standardization (v3/v2 import)

Source packs imported from Downloads (originals unchanged):

1. BOF Load Intake Template Pack v3
2. BOF Field Operations Template Pack v3
3. BOF Billing and Settlement Template Pack v3
4. BOF Driver and Dispatch Readiness Template Pack v2
5. BOF Insurance and Claims Template Pack v2

## Global terminology normalization

- Document Type:
  - `Generated / Autofill Output`
  - `Editable Template`
- Approval Status:
  - `not_required | pending_review | approved | rejected`
- Document Status:
  - `ready | at_risk | blocked`
- Command Center Status:
  - `none | watch | action_required`
- Review:
  - `Reviewed By`
  - `Review Outcome` = `not_reviewed | accepted | needs_changes | blocked`
- Dispatch gate terms:
  - `dispatch_hold_active`
  - `dispatch_release_ready`
- Settlement gate terms:
  - `settlement_hold_active`
  - `settlement_release_ready`
- Claims flags:
  - `Claims-Sensitive Load` (yes/no)
  - `Insurance Review Required` (yes/no)
- Escalation formatting:
  - `Escalation / Review Block` single sentence
- Trigger formatting:
  - `What Does This Document Trigger in BOF?`
  - Numbered format only (`1.`, `2.`, `3.` ...)

## Cleanup actions applied in BOF unified system

- Removed repeated variant labels for the same concept (e.g. `Settlement Hold if Missing Proof`, `Settlement Hold Triggered`, `Settlement Hold Active`) by mapping to the normalized settlement gate fields.
- Standardized status naming around `Ready / At Risk / Blocked`.
- Standardized message-oriented readiness fields used in driver/dispatch forms:
  - `Waiting On`
  - `Driver Acknowledgment Received`
  - `Load Ready Notification Sent`
  - `Next Action Required`
- Standardized dispatch hold/release terminology so intake/dispatch/billing/claims documents use the same gate labels.
- Standardized “What Does This Document Trigger in BOF?” structure to one numbered list format.
- Signature blocks and section headings are rendered with BOF workspace formatting instead of mixed docx-specific spacing.

## Role preservation by pack

- Load Intake Pack: intake setup, order intake, service schedule/work order, customer setup.
- Field Operations Pack: execution evidence and proof controls.
- Billing and Settlement Pack: invoice/accessorial/factoring/settlement hold/billing packet.
- Driver and Dispatch Readiness Pack: assignment packet, readiness rollup, release checklist.
- Insurance and Claims Pack: COI/insured/facility insurance, claim/incident controls, high-value cargo review.

