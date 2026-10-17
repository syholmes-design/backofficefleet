> **STATUS: DRAFT, NOT SENT.** Requires owner approval. Send from partnerships@nathson.com. Log the send in `../outreach-register.md`.
**Register ID:** F1 · **To:** fmctechsup@dot.gov (FMCSA developer/API support) · **Prerequisite:** request the webKey first (Login.gov) and include the Login.gov email in the message, as FMCSA's support page asks. Never include the key itself.

[Internal notes, not part of the letter:
- An undated FMCSA page said QCMobile and SaferBus were down; the current status is unconfirmed (verify). A trade report says public feeds were missing some carrier data after the 2026-05-14 Motus cutover (verify).
- Dataset ids are confirmed: inys-ebih (Motus Carrier – All With History), nakq-58th (Motus daily changes), az4n-8mr2 (Company Census). The legacy L&I datasets (qh9u-swkp, sa6p-acbp) are frozen.]

**Subject:** QCMobile API: availability and usage guidance for a carrier compliance platform

Hello FMCSA Technical Support,

I'm the founder of BackOfficeFleet, a Nathson company. We provide a compliance platform that motor carriers use to manage driver qualification files and verify the carriers they work with. We have registered for a QCMobile webKey under the Login.gov account [LOGIN.GOV EMAIL]. We plan to use it to verify carrier authority, insurance and out-of-service status for the fleets we support.

To use the service responsibly, could you confirm:

1. **Availability:** is QCMobile fully available now? Is there a status page or notice list we should follow for outages and changes?
2. **Usage terms:** are there rate limits or usage terms we should design around for a multi-tenant platform that looks up carriers on behalf of many client fleets?
3. **After Motus:** following the May 14, 2026 transition to Motus, does QCMobile return complete authority and insurance data? How quickly do registration and insurance updates appear?
4. **Bulk refreshes:** for daily bulk refreshes, does FMCSA recommend the data.transportation.gov datasets instead of the API? Specifically, are the Motus carrier datasets (inys-ebih, and nakq-58th for daily changes) together with the Company Census File (az4n-8mr2) the recommended source now that the legacy licensing and insurance files are no longer updated?

Thank you for your help.

Best regards,

Sylvester Holmes
Founder | BackOfficeFleet
A Nathson Company
partnerships@nathson.com
backofficefleet.com
