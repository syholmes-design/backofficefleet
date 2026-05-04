# BOF Load/Dispatch Document Realism Audit

Generated: 2026-05-04T16:21:34.201Z

## Executive Summary

- Audited 184 generated load/dispatch/claim/settlement/factoring documents across L001-L012.
- P1 demo-critical weak/unrealistic items: 0.
- Missing or broken links: 0.
- Duplicate/scattered document entries: 18.
- Core load documents are present and generally realistic; main realism gap is operating docs generated from minimal templates.

## Core and Conditional Definitions

- Core documents: Rate Confirmation, BOL, POD, Work Order/Dispatch Sheet/Load Assignment, Invoice, Shipper/Trip Packet.
- Conditional documents: Lumper, detention, seal discrepancy, claim/insurance stack, settlement/factoring/billing and related notices.

## Currently Linked UI Surfaces

- load-doc-manifest: 143
- operating-doc-manifest: 41
- canonical evidence manifest: 0
- load trip packet: 119
- load proof: 79
- dispatch document library: 184
- claims panel: 32
- settlements drawer: 13

## Full Document Inventory

| Load ID | Title/Type | File Path | Format | Exists | load-doc-manifest | operating-doc-manifest | canonical evidence | load trip packet | load proof | dispatch library | claims panel | settlements drawer | Core/Conditional | Realism | Reason | Recommended Action | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| L003 | Accident Report | `/generated/claims/L003/accident-report.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Claim Intake / Insurance Claim Form | `/generated/claims/L003/claim-intake.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L003 | Claim Packet | `/generated/claims/L003/claim-packet.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Damage Photo Packet | `/generated/claims/L003/damage-photo-packet.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L003 | Driver Statement | `/generated/claims/L003/driver-statement.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Incident Report | `/generated/claims/L003/incident-report.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Insurance Notification / Notice to Insurance Carrier | `/generated/claims/L003/insurance-notification.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Photo Evidence Log | `/generated/claims/L003/photo-evidence-log.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Seal Verification / Seal Discrepancy Report | `/generated/claims/L003/seal-verification.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Accident Report | `/generated/claims/L004/accident-report.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Claim Intake / Insurance Claim Form | `/generated/claims/L004/claim-intake.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L004 | Claim Packet | `/generated/claims/L004/claim-packet.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Damage Photo Packet | `/generated/claims/L004/damage-photo-packet.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L004 | Driver Statement | `/generated/claims/L004/driver-statement.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Incident Report | `/generated/claims/L004/incident-report.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Insurance Notification / Notice to Insurance Carrier | `/generated/claims/L004/insurance-notification.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Photo Evidence Log | `/generated/claims/L004/photo-evidence-log.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Seal Verification / Seal Discrepancy Report | `/generated/claims/L004/seal-verification.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L008 | Accident Report | `/generated/claims/L008/accident-report.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | unrealistic | Conditional document present for load with no matching story trigger. | mark_not_required | P2 credibility/polish |
| L008 | Driver Statement | `/generated/claims/L008/driver-statement.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | unrealistic | Conditional document present for load with no matching story trigger. | mark_not_required | P2 credibility/polish |
| L008 | Incident Report | `/generated/claims/L008/incident-report.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | unrealistic | Conditional document present for load with no matching story trigger. | mark_not_required | P2 credibility/polish |
| L008 | Photo Evidence Log | `/generated/claims/L008/photo-evidence-log.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | unrealistic | Conditional document present for load with no matching story trigger. | mark_not_required | P2 credibility/polish |
| L008 | Seal Verification / Seal Discrepancy Report | `/generated/claims/L008/seal-verification.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Accident Report | `/generated/claims/L009/accident-report.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Claim Intake / Insurance Claim Form | `/generated/claims/L009/claim-intake.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L009 | Claim Packet | `/generated/claims/L009/claim-packet.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Damage Photo Packet | `/generated/claims/L009/damage-photo-packet.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L009 | Driver Statement | `/generated/claims/L009/driver-statement.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Incident Report | `/generated/claims/L009/incident-report.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Insurance Notification / Notice to Insurance Carrier | `/generated/claims/L009/insurance-notification.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Photo Evidence Log | `/generated/claims/L009/photo-evidence-log.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Seal Verification / Seal Discrepancy Report | `/generated/claims/L009/seal-verification.html` | html | yes | no | yes | no | no | no | yes | yes | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L011 | Factoring Notification | `/generated/factoring/L011/factoring-notification.html` | html | yes | no | yes | no | no | no | yes | no | yes | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L011 | Factoring Submission Cover | `/generated/factoring/L011/factoring-submission-cover.html` | html | yes | no | yes | no | no | no | yes | no | yes | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L011 | Invoice | `/generated/factoring/L011/invoice.html` | html | yes | no | yes | no | no | no | yes | no | yes | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L001 | Bill of Lading / BOL | `/generated/loads/L001/bol.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L001 | Claim Intake / Insurance Claim Form | `/generated/loads/L001/claim-intake.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L001 | Claim Packet | `/generated/loads/L001/claim-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L001 | Damage Photo Packet | `/generated/loads/L001/damage-photo-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L001 | Factoring Notification | `/generated/loads/L001/factoring-notification.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L001 | Insurance Notification / Notice to Insurance Carrier | `/generated/loads/L001/insurance-notification.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L001 | Invoice | `/generated/loads/L001/invoice.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L001 | Master Agreement Reference | `/generated/loads/L001/master-agreement-reference.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L001 | Proof of Delivery / POD | `/generated/loads/L001/pod.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L001 | Rate Confirmation | `/generated/loads/L001/rate-confirmation.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L001 | RFID / Dock Validation Record | `/generated/loads/L001/rfid-proof.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L001 | Seal Verification / Seal Discrepancy Report | `/generated/loads/L001/seal-verification.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L001 | Work Order / Dispatch Sheet / Load Assignment | `/generated/loads/L001/work-order.html` | html | yes | yes | no | no | yes | no | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L002 | Bill of Lading / BOL | `/generated/loads/L002/bol.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L002 | Factoring Notification | `/generated/loads/L002/factoring-notification.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L002 | Invoice | `/generated/loads/L002/invoice.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L002 | Master Agreement Reference | `/generated/loads/L002/master-agreement-reference.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L002 | Proof of Delivery / POD | `/generated/loads/L002/pod.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L002 | Rate Confirmation | `/generated/loads/L002/rate-confirmation.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L002 | RFID / Dock Validation Record | `/generated/loads/L002/rfid-proof.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L002 | Seal Verification / Seal Discrepancy Report | `/generated/loads/L002/seal-verification.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L002 | Settlement Hold Notice | `/generated/loads/L002/settlement-hold-notice.html` | html | yes | yes | no | no | yes | no | yes | no | yes | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L002 | Work Order / Dispatch Sheet / Load Assignment | `/generated/loads/L002/work-order.html` | html | yes | yes | no | no | yes | no | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Bill of Lading / BOL | `/generated/loads/L003/bol.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L003 | Claim Intake / Insurance Claim Form | `/generated/loads/L003/claim-intake.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L003 | Claim Packet | `/generated/loads/L003/claim-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Damage Photo Packet | `/generated/loads/L003/damage-photo-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L003 | Factoring Notification | `/generated/loads/L003/factoring-notification.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L003 | Insurance Notification / Notice to Insurance Carrier | `/generated/loads/L003/insurance-notification.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Invoice | `/generated/loads/L003/invoice.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Master Agreement Reference | `/generated/loads/L003/master-agreement-reference.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Proof of Delivery / POD | `/generated/loads/L003/pod.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Rate Confirmation | `/generated/loads/L003/rate-confirmation.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | RFID / Dock Validation Record | `/generated/loads/L003/rfid-proof.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Seal Verification / Seal Discrepancy Report | `/generated/loads/L003/seal-verification.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Work Order / Dispatch Sheet / Load Assignment | `/generated/loads/L003/work-order.html` | html | yes | yes | no | no | yes | no | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Bill of Lading / BOL | `/generated/loads/L004/bol.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L004 | Claim Intake / Insurance Claim Form | `/generated/loads/L004/claim-intake.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L004 | Claim Packet | `/generated/loads/L004/claim-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Damage Photo Packet | `/generated/loads/L004/damage-photo-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L004 | Factoring Notification | `/generated/loads/L004/factoring-notification.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L004 | Insurance Notification / Notice to Insurance Carrier | `/generated/loads/L004/insurance-notification.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Invoice | `/generated/loads/L004/invoice.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Master Agreement Reference | `/generated/loads/L004/master-agreement-reference.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Proof of Delivery / POD | `/generated/loads/L004/pod.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Rate Confirmation | `/generated/loads/L004/rate-confirmation.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | RFID / Dock Validation Record | `/generated/loads/L004/rfid-proof.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Seal Verification / Seal Discrepancy Report | `/generated/loads/L004/seal-verification.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Work Order / Dispatch Sheet / Load Assignment | `/generated/loads/L004/work-order.html` | html | yes | yes | no | no | yes | no | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L005 | Bill of Lading / BOL | `/generated/loads/L005/bol.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L005 | Factoring Notification | `/generated/loads/L005/factoring-notification.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L005 | Invoice | `/generated/loads/L005/invoice.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L005 | Master Agreement Reference | `/generated/loads/L005/master-agreement-reference.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L005 | Proof of Delivery / POD | `/generated/loads/L005/pod.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L005 | Rate Confirmation | `/generated/loads/L005/rate-confirmation.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L005 | RFID / Dock Validation Record | `/generated/loads/L005/rfid-proof.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L005 | Seal Verification / Seal Discrepancy Report | `/generated/loads/L005/seal-verification.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L005 | Settlement Hold Notice | `/generated/loads/L005/settlement-hold-notice.html` | html | yes | yes | no | no | yes | no | yes | no | yes | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L005 | Work Order / Dispatch Sheet / Load Assignment | `/generated/loads/L005/work-order.html` | html | yes | yes | no | no | yes | no | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L006 | Bill of Lading / BOL | `/generated/loads/L006/bol.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L006 | Claim Intake / Insurance Claim Form | `/generated/loads/L006/claim-intake.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L006 | Claim Packet | `/generated/loads/L006/claim-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L006 | Damage Photo Packet | `/generated/loads/L006/damage-photo-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L006 | Factoring Notification | `/generated/loads/L006/factoring-notification.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L006 | Insurance Notification / Notice to Insurance Carrier | `/generated/loads/L006/insurance-notification.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L006 | Invoice | `/generated/loads/L006/invoice.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L006 | Master Agreement Reference | `/generated/loads/L006/master-agreement-reference.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L006 | Proof of Delivery / POD | `/generated/loads/L006/pod.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L006 | Rate Confirmation | `/generated/loads/L006/rate-confirmation.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L006 | RFID / Dock Validation Record | `/generated/loads/L006/rfid-proof.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L006 | Seal Verification / Seal Discrepancy Report | `/generated/loads/L006/seal-verification.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L006 | Work Order / Dispatch Sheet / Load Assignment | `/generated/loads/L006/work-order.html` | html | yes | yes | no | no | yes | no | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L007 | Bill of Lading / BOL | `/generated/loads/L007/bol.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L007 | Claim Intake / Insurance Claim Form | `/generated/loads/L007/claim-intake.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L007 | Claim Packet | `/generated/loads/L007/claim-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L007 | Damage Photo Packet | `/generated/loads/L007/damage-photo-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L007 | Factoring Notification | `/generated/loads/L007/factoring-notification.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L007 | Insurance Notification / Notice to Insurance Carrier | `/generated/loads/L007/insurance-notification.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L007 | Invoice | `/generated/loads/L007/invoice.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L007 | Master Agreement Reference | `/generated/loads/L007/master-agreement-reference.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L007 | Proof of Delivery / POD | `/generated/loads/L007/pod.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L007 | Rate Confirmation | `/generated/loads/L007/rate-confirmation.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L007 | RFID / Dock Validation Record | `/generated/loads/L007/rfid-proof.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L007 | Seal Verification / Seal Discrepancy Report | `/generated/loads/L007/seal-verification.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L007 | Work Order / Dispatch Sheet / Load Assignment | `/generated/loads/L007/work-order.html` | html | yes | yes | no | no | yes | no | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L008 | Bill of Lading / BOL | `/generated/loads/L008/bol.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L008 | Factoring Notification | `/generated/loads/L008/factoring-notification.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L008 | Invoice | `/generated/loads/L008/invoice.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L008 | Master Agreement Reference | `/generated/loads/L008/master-agreement-reference.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L008 | Proof of Delivery / POD | `/generated/loads/L008/pod.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L008 | Rate Confirmation | `/generated/loads/L008/rate-confirmation.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L008 | RFID / Dock Validation Record | `/generated/loads/L008/rfid-proof.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L008 | Seal Verification / Seal Discrepancy Report | `/generated/loads/L008/seal-verification.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L008 | Settlement Hold Notice | `/generated/loads/L008/settlement-hold-notice.html` | html | yes | yes | no | no | yes | no | yes | no | yes | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L008 | Work Order / Dispatch Sheet / Load Assignment | `/generated/loads/L008/work-order.html` | html | yes | yes | no | no | yes | no | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Bill of Lading / BOL | `/generated/loads/L009/bol.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L009 | Claim Intake / Insurance Claim Form | `/generated/loads/L009/claim-intake.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L009 | Claim Packet | `/generated/loads/L009/claim-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Damage Photo Packet | `/generated/loads/L009/damage-photo-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L009 | Factoring Notification | `/generated/loads/L009/factoring-notification.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L009 | Insurance Notification / Notice to Insurance Carrier | `/generated/loads/L009/insurance-notification.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Invoice | `/generated/loads/L009/invoice.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Master Agreement Reference | `/generated/loads/L009/master-agreement-reference.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Proof of Delivery / POD | `/generated/loads/L009/pod.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Rate Confirmation | `/generated/loads/L009/rate-confirmation.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | RFID / Dock Validation Record | `/generated/loads/L009/rfid-proof.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Seal Verification / Seal Discrepancy Report | `/generated/loads/L009/seal-verification.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Work Order / Dispatch Sheet / Load Assignment | `/generated/loads/L009/work-order.html` | html | yes | yes | no | no | yes | no | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L010 | Bill of Lading / BOL | `/generated/loads/L010/bol.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L010 | Claim Intake / Insurance Claim Form | `/generated/loads/L010/claim-intake.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L010 | Claim Packet | `/generated/loads/L010/claim-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L010 | Damage Photo Packet | `/generated/loads/L010/damage-photo-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L010 | Factoring Notification | `/generated/loads/L010/factoring-notification.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L010 | Insurance Notification / Notice to Insurance Carrier | `/generated/loads/L010/insurance-notification.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L010 | Invoice | `/generated/loads/L010/invoice.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L010 | Master Agreement Reference | `/generated/loads/L010/master-agreement-reference.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L010 | Proof of Delivery / POD | `/generated/loads/L010/pod.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L010 | Rate Confirmation | `/generated/loads/L010/rate-confirmation.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L010 | RFID / Dock Validation Record | `/generated/loads/L010/rfid-proof.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L010 | Seal Verification / Seal Discrepancy Report | `/generated/loads/L010/seal-verification.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L010 | Work Order / Dispatch Sheet / Load Assignment | `/generated/loads/L010/work-order.html` | html | yes | yes | no | no | yes | no | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L011 | Bill of Lading / BOL | `/generated/loads/L011/bol.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L011 | Factoring Notification | `/generated/loads/L011/factoring-notification.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L011 | Invoice | `/generated/loads/L011/invoice.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L011 | Master Agreement Reference | `/generated/loads/L011/master-agreement-reference.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L011 | Proof of Delivery / POD | `/generated/loads/L011/pod.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L011 | Rate Confirmation | `/generated/loads/L011/rate-confirmation.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L011 | RFID / Dock Validation Record | `/generated/loads/L011/rfid-proof.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L011 | Seal Verification / Seal Discrepancy Report | `/generated/loads/L011/seal-verification.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L011 | Settlement Hold Notice | `/generated/loads/L011/settlement-hold-notice.html` | html | yes | yes | no | no | yes | no | yes | no | yes | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L011 | Work Order / Dispatch Sheet / Load Assignment | `/generated/loads/L011/work-order.html` | html | yes | yes | no | no | yes | no | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L012 | Bill of Lading / BOL | `/generated/loads/L012/bol.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L012 | Claim Intake / Insurance Claim Form | `/generated/loads/L012/claim-intake.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L012 | Claim Packet | `/generated/loads/L012/claim-packet.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L012 | Factoring Notification | `/generated/loads/L012/factoring-notification.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | acceptable | Document is structured but includes obvious demo phrasing. | keep | P2 credibility/polish |
| L012 | Insurance Notification / Notice to Insurance Carrier | `/generated/loads/L012/insurance-notification.html` | html | yes | yes | no | no | yes | yes | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L012 | Invoice | `/generated/loads/L012/invoice.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L012 | Master Agreement Reference | `/generated/loads/L012/master-agreement-reference.html` | html | yes | yes | no | no | yes | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L012 | Proof of Delivery / POD | `/generated/loads/L012/pod.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L012 | Rate Confirmation | `/generated/loads/L012/rate-confirmation.html` | html | yes | yes | no | no | yes | yes | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L012 | RFID / Dock Validation Record | `/generated/loads/L012/rfid-proof.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L012 | Seal Verification / Seal Discrepancy Report | `/generated/loads/L012/seal-verification.html` | html | yes | yes | no | no | no | no | yes | no | no | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L012 | Work Order / Dispatch Sheet / Load Assignment | `/generated/loads/L012/work-order.html` | html | yes | yes | no | no | yes | no | yes | no | no | core | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Lumper Reimbursement Support | `/generated/settlements/L003/lumper-reimbursement-support.html` | html | yes | no | yes | no | no | no | yes | no | yes | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L003 | Settlement Summary | `/generated/settlements/L003/settlement-summary.html` | html | yes | no | yes | no | no | no | yes | no | yes | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L004 | Settlement Summary | `/generated/settlements/L004/settlement-summary.html` | html | yes | no | yes | no | no | no | yes | no | yes | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L008 | Lumper Reimbursement Support | `/generated/settlements/L008/lumper-reimbursement-support.html` | html | yes | no | yes | no | no | no | yes | no | yes | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L008 | Settlement Summary | `/generated/settlements/L008/settlement-summary.html` | html | yes | no | yes | no | no | no | yes | no | yes | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |
| L009 | Settlement Summary | `/generated/settlements/L009/settlement-summary.html` | html | yes | no | yes | no | no | no | yes | no | yes | conditional | good | Document has realistic structure, sections, and print-oriented formatting. | keep | P3 future library |

## Weak / Unrealistic Documents

- L008 `/generated/claims/L008/accident-report.html` (Accident Report) → unrealistic; Conditional document present for load with no matching story trigger. | action: mark_not_required | P2 credibility/polish
- L008 `/generated/claims/L008/driver-statement.html` (Driver Statement) → unrealistic; Conditional document present for load with no matching story trigger. | action: mark_not_required | P2 credibility/polish
- L008 `/generated/claims/L008/incident-report.html` (Incident Report) → unrealistic; Conditional document present for load with no matching story trigger. | action: mark_not_required | P2 credibility/polish
- L008 `/generated/claims/L008/photo-evidence-log.html` (Photo Evidence Log) → unrealistic; Conditional document present for load with no matching story trigger. | action: mark_not_required | P2 credibility/polish

## Missing / Broken Files

- None.

## Duplicates or Scattered Paths

- L003|Claim Intake / Insurance Claim Form: `/generated/claims/L003/claim-intake.html`, `/generated/loads/L003/claim-intake.html`
- L003|Claim Packet: `/generated/claims/L003/claim-packet.html`, `/generated/loads/L003/claim-packet.html`
- L003|Damage Photo Packet: `/generated/claims/L003/damage-photo-packet.html`, `/generated/loads/L003/damage-photo-packet.html`
- L003|Insurance Notification / Notice to Insurance Carrier: `/generated/claims/L003/insurance-notification.html`, `/generated/loads/L003/insurance-notification.html`
- L003|Seal Verification / Seal Discrepancy Report: `/generated/claims/L003/seal-verification.html`, `/generated/loads/L003/seal-verification.html`
- L004|Claim Intake / Insurance Claim Form: `/generated/claims/L004/claim-intake.html`, `/generated/loads/L004/claim-intake.html`
- L004|Claim Packet: `/generated/claims/L004/claim-packet.html`, `/generated/loads/L004/claim-packet.html`
- L004|Damage Photo Packet: `/generated/claims/L004/damage-photo-packet.html`, `/generated/loads/L004/damage-photo-packet.html`
- L004|Insurance Notification / Notice to Insurance Carrier: `/generated/claims/L004/insurance-notification.html`, `/generated/loads/L004/insurance-notification.html`
- L004|Seal Verification / Seal Discrepancy Report: `/generated/claims/L004/seal-verification.html`, `/generated/loads/L004/seal-verification.html`
- L008|Seal Verification / Seal Discrepancy Report: `/generated/claims/L008/seal-verification.html`, `/generated/loads/L008/seal-verification.html`
- L009|Claim Intake / Insurance Claim Form: `/generated/claims/L009/claim-intake.html`, `/generated/loads/L009/claim-intake.html`
- L009|Claim Packet: `/generated/claims/L009/claim-packet.html`, `/generated/loads/L009/claim-packet.html`
- L009|Damage Photo Packet: `/generated/claims/L009/damage-photo-packet.html`, `/generated/loads/L009/damage-photo-packet.html`
- L009|Insurance Notification / Notice to Insurance Carrier: `/generated/claims/L009/insurance-notification.html`, `/generated/loads/L009/insurance-notification.html`
- L009|Seal Verification / Seal Discrepancy Report: `/generated/claims/L009/seal-verification.html`, `/generated/loads/L009/seal-verification.html`
- L011|Factoring Notification: `/generated/factoring/L011/factoring-notification.html`, `/generated/loads/L011/factoring-notification.html`
- L011|Invoice: `/generated/factoring/L011/invoice.html`, `/generated/loads/L011/invoice.html`

## Recommended Replacement Templates and Output Paths

- No P1 template replacements required.

## Priority List

- P1 demo-critical (0): None
- P2 credibility/polish (4): L008:accident-report.html, L008:driver-statement.html, L008:incident-report.html, L008:photo-evidence-log.html
- P3 future library (0): None

## Risks and Unknowns

- Some linkage booleans are inferred by code-path consumption rather than explicit manifest flags per surface.
- Existing promoted copies across `/generated/loads` and `/generated/{claims|factoring}` can drift if one side is regenerated and the other is not.
- Conditional document presence for non-claim loads may be intentional demo breadth; replace/remove must preserve current UI expectations.

## Implementation (Phase 2)

- Documents audited: 184 generated load/dispatch/claim/settlement/factoring docs for `L001`-`L012`.
- P1 weak/unrealistic docs found before replacement: 19 (claims operating forms, settlement summaries/support, factoring submission cover).
- P1 replacements created: 19 (same existing linked paths; no UI wiring changes).
- Files created/replaced:
  - Replaced generated docs at:
    - `/generated/claims/L003/{accident-report,incident-report,driver-statement,photo-evidence-log}.html`
    - `/generated/claims/L004/{accident-report,incident-report,driver-statement,photo-evidence-log}.html`
    - `/generated/claims/L009/{accident-report,incident-report,driver-statement,photo-evidence-log}.html`
    - `/generated/settlements/L003/lumper-reimbursement-support.html`
    - `/generated/settlements/L008/lumper-reimbursement-support.html`
    - `/generated/settlements/L003/settlement-summary.html`
    - `/generated/settlements/L004/settlement-summary.html`
    - `/generated/settlements/L008/settlement-summary.html`
    - `/generated/settlements/L009/settlement-summary.html`
    - `/generated/factoring/L011/factoring-submission-cover.html`
- Templates created/updated:
  - Updated:
    - `scripts/templates/operating-docs/accident-report.template.html`
    - `scripts/templates/operating-docs/incident-report.template.html`
    - `scripts/templates/operating-docs/driver-statement.template.html`
    - `scripts/templates/operating-docs/photo-evidence-log.template.html`
    - `scripts/templates/operating-docs/settlement-summary.template.html`
    - `scripts/templates/operating-docs/lumper-reimbursement-support.template.html`
    - `scripts/templates/operating-docs/factoring-submission-cover.template.html`
  - Added regeneration helper:
    - `scripts/refresh-p1-operating-doc-realism.mjs`
- Load data source used: canonical BOF demo dataset (`lib/demo-data.json`) consumed deterministically by regeneration script and existing manifests.
- Fallback values used:
  - `settlementId` fallback to `N/A` when missing.
  - Evidence path fallback to `not_available` when specific image file is absent.
  - No random values were introduced.
- Manifests updated: none required (all replacements preserved existing manifest-backed paths).
- UI links preserved: yes (dispatch library, claims panel, settlements drawer continue to resolve same URLs).
- TypeScript result: `npx tsc --noEmit` passed.
- Validation result:
  - `npm run validate:driver-docs` passed.
  - `npm run validate:load-docs` passed.
  - `npm run validate:load-trip-packets` failed on pre-existing missing seal delivery image files for `L002`, `L008`, `L011` (`/evidence/loads/{loadId}/seal-delivery-photo.png`), unrelated to template replacement scope.
- Remaining P2/P3 cleanup:
  - P2: `L008` claim-side operating docs are now realism-upgraded but remain story-optional (`mark_not_required` candidates).
  - P3: retain current core load document set; optional polish could remove “demo” phrasing from acceptable templates without changing structure.

