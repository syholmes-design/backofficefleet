# AscendTMS Backend UI Reference For BOF Simulation

Date: 2026-06-08

Use this document before reshaping the BOF `/interactive-demo/`, TMS import workflow, source-system pane, load queue, document review, or simulated handoff surfaces around AscendTMS-like backend behavior.

This is a reference for a static simulation. It is not permission to build a real AscendTMS API integration, backend service, credentials, authentication, webhooks, database writes, or live sync. BOF remains static HTML/CSS/vanilla JS/JSON unless the user explicitly reverses that boundary.

## Current Scope Boundary

- Treat "AscendTMS backend" as the visible source-system control panel and operating workflow that BOF is simulating beside.
- Do not claim to know AscendTMS private backend internals, database schema, private endpoints, auth model, webhook payloads, or API contracts.
- Use the screenshots and public docs to shape the look, module structure, load/document/accounting behavior, and data objects.
- Keep buyer-facing language aligned with the current public-site rule unless the user changes it: neutral phrases such as `TMS import`, `source-system load board`, `partner load import`, `BOF readiness review`, `release review`, and `simulated handoff`.
- Inside the private/demo product shell, named AscendTMS references may be used deliberately if the user's current direction is to show how the demo reflects AscendTMS. Do not scatter named AscendTMS language across public marketing pages without a deliberate positioning pass.

## Sources Reviewed

Local screenshot folder:

`D:\Websites\Sylvester Sr\BOF\AscendTMS Backend Images`

Screens inspected:

- `5dwwfqwalsnk32nntrdwb9ceuy69.png`: Transit Insights map screen.
- `7wpvl3esr66gagpxllznzsgd2zww.png`: Documents attached to a load, with preview/edit pane.
- `CkCF0gBHTpcLpA2RFv4L8qgYecLfEFL6.png`: Load Management grid with shortcuts popover.
- `guf6rh34508hyxsr1gbs8l8bqdcx.png`: Load Management grid, tabs, status columns, bottom preferences/summary.
- `kRhkLxwaltrAWpkRY1D1NC8IJXlfzl0M.png`: Accounting Management archived-load table.
- `o02ff8keo1gq9ouldcge14a4pnqc.png`: Accounting Reports AR/AP aging tables.
- `xll9xx7QslZnEvYq5EkYBMaTkZU8tIj9.png`: Accounting Management bulk-selection banner.
- `I0Os3CnxC6r5Wx6IuCto6YrdmyjT0bAR.png`: Settings page with admin link lists.
- Converted AVIFs in `.codex/tmp/ascendtms-avif-jpg/`: Document Management search/list, full Load Management grid, Dashboard summary cards, Load Posting modal.

Public sources:

- AscendTMS KB home and main menu overview: `https://ascendtms.kayako.com/`
- View Loads: `https://ascendtms.kayako.com/article/2-view-loads`
- Build a Load: `https://ascendtms.kayako.com/article/9-build-a-load`
- Shortcuts Menu: `https://ascendtms.kayako.com/article/103-shortcuts-menu`
- Load Documents: `https://ascendtms.kayako.com/section/22-load-documents`
- Customizing Your Columns: `https://ascendtms.kayako.com/section/18-customizing-your-columns`
- Invoices/Bills: `https://ascendtms.kayako.com/article/38-invoices-bills`
- EDI setup/process: `https://ascendtms.kayako.com/article/100-edi-description-and-the-edi-setup-process`
- DAT/AscendTMS integration release: `https://www.dat.com/company/news-events/news-releases/dat-fully-integrates-convoy-platform-with-ascendtms-to-supercharge-broker-workflows`

## High-Level Product Shape

AscendTMS is not visually presented like a modern brand dashboard. It is practical operations software:

- Permanent left vertical module rail.
- Bright blue module background with white icons/text.
- Dark grey selected module group.
- Grey subnav rows under expanded modules.
- Light grey top utility bar.
- Large white work panels with fine grey borders.
- Dense tables that prioritize operational columns over visual polish.
- Tabbed status queues across the top of data grids.
- Toolbars with small icon/text actions.
- Popovers and modals for work shortcuts.
- Status color blocks in the grid itself, not only pill badges.
- Bottom summary/preference strips for financials, table size, and location display.

The BOF simulation should not copy AscendTMS pixel-for-pixel, but the source-system pane should feel compatible with this world: spreadsheet-dense, tabbed, utilitarian, blue/grey, and full of operational actions.

## Visual System Reference

### Shell

- Left nav width: approximately 150-170 px in screenshots.
- Top bar height: approximately 30-40 px utility row, then a larger title/breadcrumb band.
- Main work surface: very light grey page background with white panels.
- Footer/status strip: blue horizontal band in several screens.
- Logos occupy top-left and top-right corners. For BOF, keep BOF identity in the app shell, but source-system pane can use a small `TMS source` or `AscendTMS source` badge depending on current naming direction.

### Colors

Observed functional palette:

- Primary module blue: bright medium blue, around `#3498d8` to `#2f9bd7`.
- Selected nav dark: charcoal/blue-grey, around `#2f3540`.
- Subnav grey: medium grey, around `#8e8e8e`.
- Work background: `#f4f4f4` to `#f7f7f7`.
- Panel border: `#d5d5d5`.
- Table header: `#f1f1f1`.
- Link blue: standard web blue, often used for load IDs and actions.
- Green success/action: `#3fa34d` to `#56b65c`.
- Red danger/cancel/warning: `#d9534f` or softer red/pink status cells.
- Yellow planning/watch: pale yellow cells.
- Purple/tan/green/blue/pink: load status columns use full-cell pastel blocks.

BOF adaptation:

- Keep the current BOF shell/beveled style for the full interactive demo if desired.
- Make the embedded source-system/load-board region visibly more AscendTMS-like through blue/grey module styling, compact toolbars, dense table headers, and color-blocked status cells.
- Do not make the source-system panel too glossy, dark, or futuristic.

### Typography And Density

- Small fonts dominate: 12-14 px table text, 15-18 px toolbar labels, larger 26-32 px page headings.
- Tables use tight row height and many columns.
- Labels are terse and operational: `Load ID`, `Load Status`, `Truck Status`, `Reference`, `Picks`, `Drops`, `Pick Time`, `Drop Date`, `Carrier`, `Driver`, `Distance`, `Weight`, `Income`, `Expenses`.
- Use ordinary controls: search fields, tabs, dropdowns, checkboxes, pagination, sortable headers, plus icons, gear/settings buttons.

## Module Map To Simulate

The screenshots and docs show these major modules:

- Dashboard.
- Loads.
- EDI / Tenders.
- Customers.
- Assets.
- Carriers.
- Locations.
- Rates.
- Doc Management or Docs/Reports.
- Reporting.
- Accounting.
- Settings.
- Learn.
- Messages.
- Search.
- Help/Feedback.
- Tracking/Text in some versions.

For BOF, the source-system pane does not need every module. It should include enough of the module vocabulary to feel real:

- Source Load Board.
- Load Management.
- Documents.
- Accounting Handoff.
- Transit / Tracking Context.
- Settings or Alerts as non-primary context.

## Load Management Behavior

Official docs say Load Management uses status tabs and customizable columns. Reference images show dense grids, tab rows, toolbar actions, search, status coloring, and right-click/load-number shortcuts.

Required simulated load-board behaviors:

- Status tabs:
  - Active Loads.
  - Planning Loads.
  - Ready for Accounting Loads.
  - Misc. Loads.
  - All Loads.
  - Externally Posted Loads.
- Optional extra tabs seen in screenshots:
  - My Loads.
  - Account/LTL Loads.
- Search field labeled like `Search the Load Board`.
- Filter dropdown such as `Filtered Load Status`.
- Actions toolbar:
  - Build a New Load.
  - Load Reports.
  - Post Loads.
  - Edit Load.
  - Load Documents.
  - Copy Load.
  - Archive Load.
  - Cancel Load.
  - Track / Text Driver.
  - Customize Tabs.
  - Customize Columns.
- Rows should feel dense and sortable, with load IDs as blue links.
- Status should appear as colored row cells:
  - In Transit / Delivered: green or cyan.
  - Needs Driver / Needs Carrier: blue/purple or yellow.
  - Tendered / Upcoming / Dispatched: purple/pink/red/yellow variations.
  - Watch: red/pink in older image.
- Some fields can show `Not Set` in italics if the scenario is about source-system incompleteness.
- Horizontal scroll is acceptable in the source-system table, but BOF should still keep the main decision information visible in its own pane.

BOF demo translation:

- The source-system load grid can show the TMS view.
- BOF's adjacent/linked review pane should explain what the TMS status does not decide: driver readiness, document readiness, carrier packet readiness, exception owner, and release decision.

## Shortcuts Menu Behavior

Official docs say the shortcuts menu is accessed by right-clicking a load and exposes common load functions from Load Management.

Shortcut items to mimic:

- Edit Load.
- View or Send Load Docs.
- Request Documents From Driver.
- Assign/Manage Load Roles.
- Send Single Tracking Message.
- Enable Auto-Tracking.
- Send Text Message.
- Log Check Call.
- View Load Log.
- Post Load.
- Search Load Boards.
- Switch Branch.
- Copy Load.
- Send to Accounting Management.
- Archive Load.
- Cancel Load.

Implementation guidance:

- In the BOF demo, clicking a TMS load row or small `Shortcuts` button should open a compact popover, not navigate away.
- Popover actions should either:
  - Select/open the related BOF proof record.
  - Open an in-view modal/drawer.
  - Be visibly disabled/restyled if outside current scenario.
- Do not create dead menu items.

## Document Management Behavior

The document images and docs show two document modes:

1. General Document Management search/list.
2. Documents attached to a specific load with preview/process/edit behavior.

Observed UI:

- Search/filter panel with fields:
  - Attached to.
  - Tags.
  - Date Range.
  - Document Status: Processed / Unprocessed.
  - Upload Date / Modified Date checkboxes.
- Upload link: `Upload a new doc`.
- Document table:
  - Document Name.
  - File Type.
  - Upload Source.
  - Upload Date.
  - Description.
  - Attachments.
  - Document Types.
  - Status.
- Document types are dark chips such as `Carrier Con`, `Signed BOL`, `Customer Setup Packet`.
- Attachment values link to load IDs or customers.
- Specific-load document viewer has:
  - Back to document list.
  - Previous / Next document.
  - PDF/image preview on left.
  - Form fields on right: attach load/entity, document name, document type, full description and uses.
  - Top actions: adjust settings, email document, next document.

Official docs support generated load documents and load document workflows:

- Carrier confirmation.
- Customer confirmation.
- Driver confirmation.
- BOL.
- Invoices.
- Supporting documents.
- Preview/process document.
- Mark paperwork OK.
- Download document.

BOF demo translation:

- Important document clicks should open a large readable document pane, not a tiny card.
- BOF should not use the same site template for documents; document artifacts should look like actual paperwork, images, PDFs, or forms.
- Show source-system uploaded docs and BOF-reviewed docs as separate states.
- Include upload source context such as `via text msg`, `system generated`, `office upload`, or `BOF review`.
- If a document is received by driver text/photo, show that in the log and document table.

## Driver Tracking, Texting, And Load Log Behavior

Official shortcut docs show AscendTMS can:

- Request documents from a driver by text.
- Receive driver photo replies into the load log and load documents.
- Send a single tracking message.
- Enable automatic tracking on intervals and quiet hours.
- Send text messages to the driver.
- Log check calls with status updates, stop locations, and date/time.
- Keep communication, document requests, text messages, logged check calls, and tracking information in the Load Log.

BOF demo translation:

- A realistic source-system context should include a load log or communication trail.
- BOF's value should be shown as readiness interpretation:
  - TMS may have the driver text/document/tracking event.
  - BOF decides whether that event clears, watches, or blocks release.
- If the demo shows GPS, HOS, traffic, fuel, weather, or backhaul, frame it as simulated operating context and make it relevant to the release decision.

## Accounting Behavior

Screens show `Accounting Management` and `Accounting Reports` as core backend modules.

Observed UI:

- Tabs: Invoices, Bills, Reconcile and Archive, Search Archived Loads.
- Left nav subitems: AR/AP Report, Invoices/Bills, Commissions Mgt, Driver Pay Mgt, QuickBooks.
- Search field by company or load number.
- Expand rows with plus icons.
- Checkboxes for selecting loads.
- Bulk-selection banner: `Selected 3 Loads`, with action buttons.
- Paid status chips such as `1/1 Invoice Paid`, `0/1 Invoice Paid`, `1/1 Bill Paid`.
- Columns:
  - Load #.
  - Company Name(s).
  - Paid Status.
  - Invoice(s) Total.
  - Bill(s) Total.
  - Gross P/L.
- Aging reports:
  - Current.
  - 30+ Days.
  - 60+ Days.
  - 90+ Days.
  - Total.

Official docs support invoices/bills, QuickBooks export, payment tracking, reconciling invoices and bills from loads, viewing invoice PDFs, sending invoices back to load management, reviewing supporting docs, and marking paperwork OK.

BOF demo translation:

- BOF does not need to become accounting software.
- The simulated handoff should show what would be prepared for accounting or held back:
  - Ready to release.
  - Release with condition.
  - Hold - action required.
  - Supporting documents complete / not complete.
  - Settlement or invoice consequence.
  - Send-back/hold reason.
- Use accounting language sparingly, enough to show consequence: invoice readiness, bill readiness, settlement watch, gross P/L context, paperwork OK.

## Dashboard / Summary Behavior

The dashboard image is simple and card-based:

- Financial Quick Look.
- Load Counts.
- Current Rate Index.
- Current Fuel Index.
- Color-coded blocks: green, blue, red/pink, yellow.
- Progress bars for load counts.
- Friendly tenant-specific thank-you message.

BOF demo translation:

- The BOF Command Center can keep its own richer style, but source-system context should include simple count/summary cards when useful.
- Avoid huge decorative analytics; AscendTMS dashboard evidence is compact and operational.

## Transit / Map Behavior

The Transit Insights screenshot shows:

- Left module rail remains.
- Main view dominated by a map.
- Top tabs: Border Crossing, Regional Insights, Port Congestion.
- Light/dark map toggle.
- Last updated timestamp.
- Cluster markers with numbers and truck icons.

BOF demo translation:

- If a map-like operating context is added, keep it utilitarian.
- Show route/current-position evidence in relation to the selected load.
- Include updated timestamp, route status, and meaning for the release/hold/watch decision.

## Settings / Admin Behavior

Settings screen shows:

- Admin-only notice.
- Large panels with link lists.
- Company Settings.
- Report and Document settings.
- Data Import.
- User and Branch settings.
- Links such as company contact info, dropdown lists, upload company logo, currency/units, configure alerts.

BOF demo translation:

- Settings should not be a major demo page unless the scenario involves source-system configuration.
- Useful supporting context: alerts configured, columns customized, branch selected, data import available.

## EDI / Integration Boundary

Official docs describe EDI as data flowing between computer systems, often for transportation load tenders and status updates. Common transportation EDI sets listed include load tender, shipment status, pickup notification, freight invoice, load tender response, and acknowledgements. AscendTMS says EDI setup involves data mapping/testing/certification with trading partners and that, once live, data flows through a custom EDI console.

DAT's public AscendTMS integration release describes a marketplace integration inside AscendTMS workflows covering load posting, bidding, booking, tracking, shipment documentation, and payment.

BOF demo translation:

- Do not invent a private AscendTMS API.
- Model the visible concept as an imported load/workflow record, not a technical endpoint.
- Use local JSON as the source-system record.
- If showing EDI/API/sync language, keep it in internal notes or a clearly simulated handoff panel.
- The demo can show an `Imported`, `Ready to hand off`, or `Handoff prepared` state, but must not imply live production sync.

## Data Shape For Static Simulation

Use or extend local JSON with these groups:

- `sourceLoads`
  - `sourceLoadId`
  - `loadNumber`
  - `loadStatus`
  - `truckStatus`
  - `customer`
  - `carrier`
  - `driver`
  - `picks`
  - `drops`
  - `pickTime`
  - `dropTime`
  - `pickDate`
  - `dropDate`
  - `reference`
  - `equipment`
  - `distance`
  - `weight`
  - `income`
  - `expenses`
  - `grossProfitLoss`
  - `factoringStatus`
  - `branch`
  - `uploadedDocuments`
  - `loadLog`
  - `sourceActions`
- `sourceDocuments`
  - `documentId`
  - `documentName`
  - `fileType`
  - `uploadSource`
  - `uploadDate`
  - `description`
  - `attachments`
  - `documentTypes`
  - `status`
  - `previewAsset`
  - `processedByBof`
- `bofReview`
  - `bofReleaseFile`
  - `driverMatch`
  - `driverReadiness`
  - `carrierPacketReadiness`
  - `documentReadiness`
  - `exceptionOwner`
  - `priorityReason`
  - `releaseDecision`
  - `nextAction`
  - `auditTrail`
  - `simulatedHandoff`

## UI Patterns To Bring Into BOF

Must-have patterns for a more AscendTMS-shaped simulation:

- Left source-module strip or compact module label rail inside the app shell.
- Tabbed load queue that uses actual status categories.
- Dense, sortable source load table.
- Row status cells with full-cell colors.
- Load ID links and row-click/shortcut popover behavior.
- Small action toolbar above the table.
- Custom columns/custom tabs buttons as visible-but-contained source-system flavor.
- Document search/list table with processed/unprocessed state.
- Large document preview/edit pane for load documents.
- Load log panel showing text/tracking/document request events.
- Accounting handoff or paperwork status panel that shows why release affects payment/settlement.
- A simulated handoff payload that is visually subordinate to the operational decision.

## UI Patterns To Avoid

- Futuristic dark UI for the source-system pane.
- Big marketing cards where AscendTMS-like data tables are expected.
- Huge hero copy inside the product shell.
- Decorative dashboards that do not answer load/document/accounting questions.
- Empty placeholder actions.
- Using `AscendTMS` visible public wording across the site unless current positioning has been deliberately changed.
- Claiming real API/sync behavior.
- Making BOF look like it replaces the TMS.
- Making BOF subordinate to the TMS.

## BOF-Specific Relationship

The simulated relationship should be:

- TMS/source system manages the load workflow, load board, dispatch status, carrier/driver assignment, uploaded documents, tracking/texting events, and accounting handoff status.
- BOF manages driver readiness, document readiness, carrier packet readiness, exceptions, audit trail, decision owner, release decision, settlement/claim consequences, and next action.

The demo should make this visible by placing source-system evidence and BOF decision logic next to each other. Example:

- Source-system row says `In Transit`, `Needs Driver`, `Tendered`, or `Ready for Accounting`.
- BOF panel says `Ready to Release`, `Hold - Action Required`, or `Release With Condition`, with the reason.

## Future Implementation Checklist

Use this checklist before calling an AscendTMS-shaped demo pass complete:

- [ ] Source-system pane visually uses AscendTMS-like blue/grey/nav/table density.
- [ ] Load queue has status tabs that match official load-management categories.
- [ ] Load table includes realistic columns, status-colored cells, search, filter, pagination or row count.
- [ ] Clicking a source load visibly selects it and updates a BOF readiness panel in the current viewport.
- [ ] Load shortcuts popover exists or equivalent row actions are clearly represented.
- [ ] Shortcut actions are wired, disabled, or intentionally hidden; none are dead.
- [ ] Document list includes upload source, attachments, document types, and processed/unprocessed state.
- [ ] Important documents open a large preview/edit/record panel.
- [ ] Driver text/request/tracking/log behavior is represented when relevant.
- [ ] Accounting/paperwork consequence is represented without turning BOF into accounting software.
- [ ] Simulated handoff clearly shows local/demo state and no live sync.
- [ ] BOF-owned readiness decision remains visually dominant over source-system status.
- [ ] Public pages still respect the neutral TMS language rule unless user explicitly wants named AscendTMS positioning.
- [ ] No real API, credentials, `.env`, database, auth, package framework, or backend route is added.

## Open Unknowns

- Real private AscendTMS API shape is unknown.
- Real customer-specific AscendTMS configuration is unknown.
- Real client account screenshots may differ from these reference images.
- Public docs do not provide enough detail to model production payload schemas safely.
- Any future visual implementation should be described as a faithful source-system simulation, not a real integration.
