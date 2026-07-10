# TMS Vendor Simulation Planning Note

Created: 2026-06-11

Purpose: preserve the June 11 client direction for TMS-style demo realism without turning BOF into a real integration build.

## Decision

BOF should continue to present the public site and demo as a neutral `Partner TMS` / `Connected TMS` workflow.

Do not use public-facing `AscendTMS`, `Ascend`, `Alvys`, `official integration`, `powered by`, `certified`, or partner-approved language unless the user explicitly changes the branding boundary after permission is confirmed.

## Static-Safe Story

The buyer-facing story remains:

- The TMS manages the load.
- BOF manages readiness, driver records, documents, carrier packets, exceptions, settlement holds, audit trail, release decisions, and simulated handoff.
- BOF can mirror familiar TMS workflow areas: load board, dispatch board, document packet, carrier/driver readiness, accounting/settlement, alerts, and reports.
- The current implementation is a static simulation using HTML, CSS, vanilla JavaScript, and synthetic records. It must not add live API calls, credentials, webhooks, sync, backend routes, `.env`, database writes, or real authentication.

## Source Notes

- AscendTMS is a product of InMotion Global and is publicly marketed through AscendTMS/TheFreeTMS pages. TheFreeTMS describes AscendTMS as a TMS where users can begin booking loads quickly and where training/support are offered. Source: https://ascendtms.com/ and https://www.thefreetms.com/
- TheFreeTMS release history references integration support items such as DAT Rateview and integration API key support resources, but this is not permission to build or claim a BOF integration. Source: https://www.thefreetms.com/release-history
- Alvys publicly describes a modern cloud TMS, native EDI, 100+ integrations, a self-serve API, and public API documentation. Source: https://alvys.com/features/integrations and https://docs.alvys.com/

## Demo Implications

The BOF demo should emulate the workflow grammar of a TMS-like backend without using vendor branding:

- compact load queues and tabular source-system views;
- status-colored rows;
- module rail / sidebar navigation;
- load, driver, carrier, document, dispatch, settlement, alert, and report modules;
- record inspectors and document panes;
- accounting/settlement handoff records;
- evidence rows for POD, receipts, receiver signature, GPS/location, dock/cargo photos, holds, and release consequence.

The demo should not pretend to be a pixel clone or use vendor-owned trade dress. It should feel familiar to fleet owners who already use a TMS.

## Internal Outreach Draft

Use this only if the user asks to prepare vendor communication.

Subject: BOF readiness layer for TMS users

Hello,

BackOfficeFleet is building a managed readiness and document-review workflow for trucking fleets that already operate inside a TMS. BOF does not replace the TMS. The TMS manages load creation, dispatch flow, and core freight operations; BOF focuses on driver readiness, document packets, carrier packet review, exceptions, settlement holds, audit trail, and release decisions.

We are preparing a static proof-of-concept workflow that shows how a fleet could review a TMS-imported load before dispatch or settlement release. If there is interest, we would like to understand the appropriate partnership, API, sandbox, and branding path before making any public vendor-specific claim.

The goal is to support more successful TMS customers by helping fleets keep documents, exceptions, and release readiness organized around the load record.

## Guardrail

This note is planning and simulation guidance only. It is not an API implementation plan.
