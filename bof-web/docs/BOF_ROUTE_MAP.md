# BOF Route Map (Source of Truth)

Purpose: prevent edits from landing in stale or non-rendered files by mapping each URL to the active Next.js route and component wiring.

## Status Labels

- `MARKETING`
- `DEMO`
- `DRIVER_DOCS`
- `DISPATCH`
- `SETTLEMENTS`
- `LEGACY`
- `SHARED`

## High-Traffic Route Map

| URL | Route File | Primary Component | Page Type | Hero/Image Source | Data Source | Status | Notes |
|---|---|---|---|---|---|---|---|
| `/` | `app/(marketing)/page.tsx` | `components/marketing/MarketingHomeAccountable.tsx` | MARKETING | `Image src="/generated/marketing/demoheroimage-v2.png"` in `MarketingHomeAccountable` | Marketing/static copy; no `getBofData()` | ACTIVE_ROUTE | Public marketing homepage route entrypoint is a re-export. |
| `/for-hire-carriers` | `app/(marketing)/for-hire-carriers/page.tsx` | `ForHireCarriersPage` | MARKETING | No hero image component | Marketing funnel links only | ACTIVE_ROUTE | Lightweight entry page. |
| `/private-fleets` | `app/(marketing)/private-fleets/page.tsx` | `PrivateFleetsPage` + `MarketingPrivateFleetsHero` | MARKETING | `imageSrc="/assets/images/private-fleets-hero-new.png"` passed from route | Marketing/static + funnel clients | ACTIVE_ROUTE | Hero image is page-owned via props (good separation). |
| `/government` | `app/(marketing)/government/page.tsx` | `GovernmentPage` + `MarketingGovernmentHero` | MARKETING | `imageSrc="/assets/images/government-hero2.png"` passed from route | Marketing/static + funnel clients | ACTIVE_ROUTE | Hero image is page-owned via props. |
| `/bof-vault` | `app/(marketing)/bof-vault/page.tsx` | `BofVaultPage` + `MarketingBofVaultHero` | MARKETING | `imageSrc="/assets/images/BofVaultHero2.png"` passed from route | Marketing/static + funnel clients | ACTIVE_ROUTE | Hero image is page-owned via props. |
| `/book-assessment` | `app/(marketing)/book-assessment/page.tsx` | `BookAssessmentPage` + `FleetAssessmentWizardClient` | MARKETING | No hero image | Funnel wizard client | ACTIVE_ROUTE | Query param `sector` supported. |
| `/fleet-savings` | `app/(marketing)/fleet-savings/page.tsx` | `FleetSavingsPage` + `FleetSavingsCalculatorClient` | MARKETING | No hero image | Funnel calculator client | ACTIVE_ROUTE | Standalone tool page. |
| `/apply` | `app/(marketing)/apply/page.tsx` | `ApplyPage` + `FleetApplicationWizardClient` | MARKETING | No hero image | Funnel application client | ACTIVE_ROUTE | Standalone qualification page. |
| `/dashboard` | `app/(bof)/dashboard/page.tsx` | `DashboardPage` -> `DashboardPageClient` | DEMO | In-component product preview (`DashboardHeroProductPreview`), no hero image asset | `useBofDemoData()` from `BofDemoDataShell` seed; no direct `getBofData()` in route | ACTIVE_ROUTE | Demo app dashboard; separate from marketing home route. |
| `/command-center` | `app/(bof)/command-center/page.tsx` | `CommandCenterPage` -> `CommandCenterPageClient` | DEMO | `CommandCenterExecutiveHeader` | `useBofDemoData()` | ACTIVE_ROUTE | Core demo operations queue. |
| `/loads` | `app/(bof)/loads/page.tsx` | `LoadsPage` -> `LoadsPageClient` | DISPATCH | None | `useBofDemoData()` | ACTIVE_ROUTE | Dispatch/loads operational list. |
| `/dispatch` | `app/(bof)/dispatch/page.tsx` | `DispatchPage` -> `DispatchShell` | DISPATCH | None | `useBofDemoData()` + dispatch store | ACTIVE_ROUTE | Canonical dispatch board shell. |
| `/drivers` | `app/(bof)/drivers/page.tsx` | `DriversIndexPage` -> `DriversListPageClient` -> `DriversRosterTable` | DEMO | Drivers command header in `DriversRosterTable` | `useBofDemoData()` + canonical helpers | ACTIVE_ROUTE | Driver readiness command roster. |
| `/documents` | `app/(bof)/documents/page.tsx` | `DocumentsPage` -> `DocumentsPageClient` | DRIVER_DOCS | None | `useBofDemoData()` + vault/doc helpers | ACTIVE_ROUTE | Fleet-wide document hub. |
| `/documents/vault` | `app/(bof)/documents/vault/page.tsx` | `DriverVaultWorkspacePage` -> `DriverVaultWorkspaceClient` | DRIVER_DOCS | None | `useBofDemoData()` + vault workspace store | ACTIVE_ROUTE | Driver vault workspace route. |
| `/settlements` | `app/(bof)/settlements/page.tsx` | `SettlementsPage` -> `SettlementsPayrollPageClient` | SETTLEMENTS | Settlements shell sections; no image hero asset | `useBofDemoData()` through client shells | ACTIVE_ROUTE | Payroll/settlement operations page. |
| `/safety` | `app/(bof)/safety/page.tsx` | `SafetyPage` -> `SafetyShell` | DEMO | `SafetyCommandHero` (in safety dashboard screen) | `useBofDemoData()` + safety store | ACTIVE_ROUTE | Safety command center flow. |
| `/load-requirements` | `app/(bof)/load-requirements/page.tsx` | `LoadRequirementsPage` redirect | LEGACY | N/A | N/A | ACTIVE_ROUTE | Deprecated alias redirecting to `/dispatch/intake`. |
| `/rf-actions` | `app/(bof)/rf-actions/page.tsx` | `RfActionsPage` -> `RfActionsPageClient` | DEMO | None | `useBofDemoData()` + `buildRfActions` | ACTIVE_ROUTE | Still active route. |

## Full Active Route Inventory (`app/**/page.tsx`)

All discovered routes are active Next.js routes unless marked legacy redirect.

| URL | Route File | Primary Component | Page Type | Status | Notes |
|---|---|---|---|---|---|
| `/` | `app/(marketing)/page.tsx` | `components/marketing/MarketingHomeAccountable.tsx` | MARKETING | ACTIVE_ROUTE | Re-export route. |
| `/apply` | `app/(marketing)/apply/page.tsx` | `ApplyPage` | MARKETING | ACTIVE_ROUTE |  |
| `/bof-vault` | `app/(marketing)/bof-vault/page.tsx` | `BofVaultPage` | MARKETING | ACTIVE_ROUTE |  |
| `/book-assessment` | `app/(marketing)/book-assessment/page.tsx` | `BookAssessmentPage` | MARKETING | ACTIVE_ROUTE |  |
| `/command-center` | `app/(bof)/command-center/page.tsx` | `CommandCenterPage` | DEMO | ACTIVE_ROUTE |  |
| `/dashboard` | `app/(bof)/dashboard/page.tsx` | `DashboardPage` | DEMO | ACTIVE_ROUTE |  |
| `/dispatch` | `app/(bof)/dispatch/page.tsx` | `DispatchPage` | DISPATCH | ACTIVE_ROUTE |  |
| `/dispatch/intake` | `app/(bof)/dispatch/intake/page.tsx` | `DispatchIntakePage` | DISPATCH | ACTIVE_ROUTE |  |
| `/documents` | `app/(bof)/documents/page.tsx` | `DocumentsPage` | DRIVER_DOCS | ACTIVE_ROUTE |  |
| `/documents/compliance-flow` | `app/(bof)/documents/compliance-flow/page.tsx` | `ComplianceFlowPage` | DRIVER_DOCS | ACTIVE_ROUTE |  |
| `/documents/template-packs` | `app/(bof)/documents/template-packs/page.tsx` | `BofTemplatePacksWorkspaceClient` | DRIVER_DOCS | ACTIVE_ROUTE | Internal workspace path. |
| `/documents/template-packs/artifact` | `app/(bof)/documents/template-packs/artifact/page.tsx` | `BofTemplateArtifactPageClient` | DRIVER_DOCS | ACTIVE_ROUTE | Internal workspace path. |
| `/documents/template-packs/view` | `app/(bof)/documents/template-packs/view/page.tsx` | `BofDocumentViewerPage` | DRIVER_DOCS | ACTIVE_ROUTE | Internal workspace path. |
| `/documents/vault` | `app/(bof)/documents/vault/page.tsx` | `DriverVaultWorkspacePage` | DRIVER_DOCS | ACTIVE_ROUTE |  |
| `/documents/vault/final` | `app/(bof)/documents/vault/final/page.tsx` | `DriverVaultFinalArtifactPageClient` | DRIVER_DOCS | ACTIVE_ROUTE | Internal workspace path. |
| `/drivers` | `app/(bof)/drivers/page.tsx` | `DriversIndexPage` | DEMO | ACTIVE_ROUTE |  |
| `/drivers/:id` | `app/(bof)/drivers/[id]/page.tsx` | `DriverDetailsPageClient` | DEMO | ACTIVE_ROUTE | Calls `getBofData()`. |
| `/drivers/:id/bank-info` | `app/(bof)/drivers/[id]/bank-info/page.tsx` | `DriverBankInfoPageClient` | DRIVER_DOCS | ACTIVE_ROUTE | Calls `getBofData()`. |
| `/drivers/:id/dispatch` | `app/(bof)/drivers/[id]/dispatch/page.tsx` | `DriverDispatchPageClient` | DISPATCH | ACTIVE_ROUTE | Calls `getBofData()`. |
| `/drivers/:id/hr` | `app/(bof)/drivers/[id]/hr/page.tsx` | `DriverHRPage` | DEMO | ACTIVE_ROUTE |  |
| `/drivers/:id/profile` | `app/(bof)/drivers/[id]/profile/page.tsx` | `DriverProfilePage` | DEMO | ACTIVE_ROUTE |  |
| `/drivers/:id/safety` | `app/(bof)/drivers/[id]/safety/page.tsx` | `DriverSafetyPage` | DEMO | ACTIVE_ROUTE |  |
| `/drivers/:id/settlements` | `app/(bof)/drivers/[id]/settlements/page.tsx` | `DriverSettlementsPage` | SETTLEMENTS | ACTIVE_ROUTE |  |
| `/drivers/:id/vault` | `app/(bof)/drivers/[id]/vault/page.tsx` | `DriverVaultPage` | DRIVER_DOCS | ACTIVE_ROUTE |  |
| `/emergency-contacts` | `app/(bof)/emergency-contacts/page.tsx` | `EmergencyContactsPage` | DEMO | ACTIVE_ROUTE |  |
| `/emergency-contacts/:driverId` | `app/(bof)/emergency-contacts/[driverId]/page.tsx` | `EmergencyContactCard` route wrapper | DEMO | ACTIVE_ROUTE |  |
| `/fleet-savings` | `app/(marketing)/fleet-savings/page.tsx` | `FleetSavingsPage` | MARKETING | ACTIVE_ROUTE |  |
| `/for-hire-carriers` | `app/(marketing)/for-hire-carriers/page.tsx` | `ForHireCarriersPage` | MARKETING | ACTIVE_ROUTE |  |
| `/government` | `app/(marketing)/government/page.tsx` | `GovernmentPage` | MARKETING | ACTIVE_ROUTE |  |
| `/intake` | `app/(bof)/intake/page.tsx` | `IntakeEnginePage` | DEMO | ACTIVE_ROUTE |  |
| `/intake/:intakeId` | `app/(bof)/intake/[intakeId]/page.tsx` | `IntakeEngineDetailPage` | DEMO | ACTIVE_ROUTE |  |
| `/load-intake` | `app/(bof)/load-intake/page.tsx` | redirect page | LEGACY | ACTIVE_ROUTE | Redirects to `/dispatch/intake`. |
| `/load-request` | `app/(bof)/load-request/page.tsx` | `LoadRequestPage` | LEGACY | ACTIVE_ROUTE | LEGACY_DO_NOT_USE for issue triage links; keep only for explicit intake workflow. |
| `/load-requests` | `app/(bof)/load-requests/page.tsx` | `LoadRequestsPage` | LEGACY | ACTIVE_ROUTE | LEGACY_DO_NOT_USE for operational issue links; avoid primary nav entry. |
| `/load-requirements` | `app/(bof)/load-requirements/page.tsx` | redirect page | LEGACY | ACTIVE_ROUTE | Redirects to `/dispatch/intake`. |
| `/loads` | `app/(bof)/loads/page.tsx` | `LoadsPage` | DISPATCH | ACTIVE_ROUTE |  |
| `/loads/:id` | `app/(bof)/loads/[id]/page.tsx` | `LoadDetailsPage` | DISPATCH | ACTIVE_ROUTE | Calls `getBofData()`. |
| `/loads/:id/readiness-summary` | `app/(bof)/loads/[id]/readiness-summary/page.tsx` | `LoadReadinessSummaryArtifactPageClient` | DISPATCH | ACTIVE_ROUTE |  |
| `/maintenance` | `app/(bof)/maintenance/page.tsx` | `MaintenanceDashboardPage` | DEMO | ACTIVE_ROUTE |  |
| `/maintenance/:assetId` | `app/(bof)/maintenance/[assetId]/page.tsx` | `MaintenanceAssetDetailClient` route wrapper | DEMO | ACTIVE_ROUTE |  |
| `/maintenance/costs` | `app/(bof)/maintenance/costs/page.tsx` | `MaintenanceCostsPage` | DEMO | ACTIVE_ROUTE |  |
| `/maintenance/pm-inspections` | `app/(bof)/maintenance/pm-inspections/page.tsx` | `MaintenancePmPage` | DEMO | ACTIVE_ROUTE |  |
| `/maintenance/repairs` | `app/(bof)/maintenance/repairs/page.tsx` | `MaintenanceRepairsPage` | DEMO | ACTIVE_ROUTE |  |
| `/money-at-risk` | `app/(bof)/money-at-risk/page.tsx` | `MoneyAtRiskPage` | SETTLEMENTS | ACTIVE_ROUTE |  |
| `/pretrip/:loadId` | `app/(bof)/pretrip/[loadId]/page.tsx` | `DriverPretripPage` | DISPATCH | ACTIVE_ROUTE | Calls `getBofData()`. |
| `/private-fleets` | `app/(marketing)/private-fleets/page.tsx` | `PrivateFleetsPage` | MARKETING | ACTIVE_ROUTE |  |
| `/rf-actions` | `app/(bof)/rf-actions/page.tsx` | `RfActionsPage` | DEMO | ACTIVE_ROUTE |  |
| `/safety` | `app/(bof)/safety/page.tsx` | `SafetyPage` | DEMO | ACTIVE_ROUTE |  |
| `/settlements` | `app/(bof)/settlements/page.tsx` | `SettlementsPage` | SETTLEMENTS | ACTIVE_ROUTE |  |
| `/settlements/workbook` | `app/(bof)/settlements/workbook/page.tsx` | `SettlementsWorkbookPage` | SETTLEMENTS | ACTIVE_ROUTE |  |
| `/shipper-portal/:loadId` | `app/(bof)/shipper-portal/[loadId]/page.tsx` | `ShipperLoadPortalClient` route wrapper | DISPATCH | ACTIVE_ROUTE | Calls `getBofData()`. |
| `/source-of-truth` | `app/(bof)/source-of-truth/page.tsx` | `SourceOfTruthPage` | DEMO | ACTIVE_ROUTE |  |
| `/trip-release/:loadId` | `app/(bof)/trip-release/[loadId]/page.tsx` | `DriverTripReleaseClient` route wrapper | DISPATCH | ACTIVE_ROUTE | Calls `getBofData()`. |

## Shared Layout and Data Wiring

- `app/(bof)/layout.tsx` calls `getBofData()` once and seeds `BofDemoDataShell`.
- Most BOF app pages consume data via `useBofDemoData()` client context.
- Marketing pages do not use BOF canonical runtime stores.

## Duplicate / Confusing Components and Static Files

### Component Classification

| File | Classification | Notes |
|---|---|---|
| `components/marketing/MarketingHomeAccountable.tsx` | ACTIVE_COMPONENT | Active homepage component (`/`). |
| `components/marketing/MarketingPrivateFleetsHero.tsx` | SHARED_COMPONENT | Active hero for `/private-fleets`. |
| `components/marketing/MarketingGovernmentHero.tsx` | SHARED_COMPONENT | Active hero for `/government`. |
| `components/marketing/MarketingBofVaultHero.tsx` | SHARED_COMPONENT | Active hero for `/bof-vault`. |
| `components/marketing/MarketingPremiumHero.tsx` | SHARED_COMPONENT | Shared hero shell used by active hero wrappers. |
| `components/marketing/MarketingHeroImagePanel.tsx` | SHARED_COMPONENT | Shared hero image panel used by wrappers. |
| `components/marketing/MarketingHomeIntegratedHero.tsx` | LEGACY_DO_NOT_EDIT | Defined but not imported by any route/component. |
| `components/marketing/MarketingGovernmentIntegratedHero.tsx` | LEGACY_DO_NOT_EDIT | Defined but not imported by any route/component. |
| `components/dashboard/DashboardPageClient.tsx` | ACTIVE_COMPONENT | Active `/dashboard` demo page content. |

### Static HTML Classification

| Path Pattern | Classification | Notes |
|---|---|---|
| `public/generated/**/*.html` | SHARED | Generated artifacts/documents, not Next route components. |
| Repository root `*.html` | LEGACY_DO_NOT_EDIT | None found at repo root (no static homepage shadowing). |

## Homepage vs Demo Landing Separation

- `/` uses `app/(marketing)/page.tsx` -> `MarketingHomeAccountable`.
- `/dashboard` uses `app/(bof)/dashboard/page.tsx` -> `DashboardPageClient`.
- They are different routes and different top-level components.
- Homepage hero uses image asset `/generated/marketing/demoheroimage-v2.png`.
- Dashboard hero is in-code product preview (`DashboardHeroProductPreview`) and does not use that marketing hero image path.

## Route Debugging Aid (Development Only)

- `components/dev/BofRouteBadge.tsx` shows current route identity in development.
- Mounted in both:
  - `app/(marketing)/layout.tsx`
  - `app/(bof)/layout.tsx`
- Hidden in production (`process.env.NODE_ENV !== "development"` gate).
