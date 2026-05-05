export type BofPageType =
  | "MARKETING"
  | "DEMO"
  | "DRIVER_DOCS"
  | "DISPATCH"
  | "SETTLEMENTS"
  | "LEGACY"
  | "SHARED";

export type BofPageRegistryItem = {
  label: string;
  url: string;
  type: BofPageType;
  routeFile: string;
  primaryComponent: string;
  heroImage?: string;
};

export const BOF_PAGE_REGISTRY: Record<string, BofPageRegistryItem> = {
  home: {
    label: "Marketing Home",
    url: "/",
    type: "MARKETING",
    routeFile: "app/(marketing)/page.tsx",
    primaryComponent: "MarketingHomeAccountable",
    heroImage: "/generated/marketing/demoheroimage-v2.png",
  },
  forHireCarriers: {
    label: "For-Hire Carriers",
    url: "/for-hire-carriers",
    type: "MARKETING",
    routeFile: "app/(marketing)/for-hire-carriers/page.tsx",
    primaryComponent: "ForHireCarriersPage",
  },
  privateFleets: {
    label: "Private Fleets",
    url: "/private-fleets",
    type: "MARKETING",
    routeFile: "app/(marketing)/private-fleets/page.tsx",
    primaryComponent: "PrivateFleetsPage",
    heroImage: "/assets/images/private-fleets-hero-new.png",
  },
  government: {
    label: "Government",
    url: "/government",
    type: "MARKETING",
    routeFile: "app/(marketing)/government/page.tsx",
    primaryComponent: "GovernmentPage",
    heroImage: "/assets/images/government-hero2.png",
  },
  bofVaultMarketing: {
    label: "BOF Vault Marketing",
    url: "/bof-vault",
    type: "MARKETING",
    routeFile: "app/(marketing)/bof-vault/page.tsx",
    primaryComponent: "BofVaultPage",
    heroImage: "/assets/images/BofVaultHero2.png",
  },
  bookAssessment: {
    label: "Book Assessment",
    url: "/book-assessment",
    type: "MARKETING",
    routeFile: "app/(marketing)/book-assessment/page.tsx",
    primaryComponent: "BookAssessmentPage",
  },
  fleetSavings: {
    label: "Fleet Savings",
    url: "/fleet-savings",
    type: "MARKETING",
    routeFile: "app/(marketing)/fleet-savings/page.tsx",
    primaryComponent: "FleetSavingsPage",
  },
  apply: {
    label: "Apply",
    url: "/apply",
    type: "MARKETING",
    routeFile: "app/(marketing)/apply/page.tsx",
    primaryComponent: "ApplyPage",
  },
  dashboard: {
    label: "Dashboard",
    url: "/dashboard",
    type: "DEMO",
    routeFile: "app/(bof)/dashboard/page.tsx",
    primaryComponent: "DashboardPage",
  },
  commandCenter: {
    label: "Command Center",
    url: "/command-center",
    type: "DEMO",
    routeFile: "app/(bof)/command-center/page.tsx",
    primaryComponent: "CommandCenterPage",
  },
  loads: {
    label: "Loads",
    url: "/loads",
    type: "DISPATCH",
    routeFile: "app/(bof)/loads/page.tsx",
    primaryComponent: "LoadsPage",
  },
  dispatch: {
    label: "Dispatch",
    url: "/dispatch",
    type: "DISPATCH",
    routeFile: "app/(bof)/dispatch/page.tsx",
    primaryComponent: "DispatchPage",
  },
  drivers: {
    label: "Drivers",
    url: "/drivers",
    type: "DEMO",
    routeFile: "app/(bof)/drivers/page.tsx",
    primaryComponent: "DriversIndexPage",
  },
  documents: {
    label: "Documents",
    url: "/documents",
    type: "DRIVER_DOCS",
    routeFile: "app/(bof)/documents/page.tsx",
    primaryComponent: "DocumentsPage",
  },
  documentsVault: {
    label: "Documents Vault Workspace",
    url: "/documents/vault",
    type: "DRIVER_DOCS",
    routeFile: "app/(bof)/documents/vault/page.tsx",
    primaryComponent: "DriverVaultWorkspacePage",
  },
  settlements: {
    label: "Settlements",
    url: "/settlements",
    type: "SETTLEMENTS",
    routeFile: "app/(bof)/settlements/page.tsx",
    primaryComponent: "SettlementsPage",
  },
  safety: {
    label: "Safety",
    url: "/safety",
    type: "DEMO",
    routeFile: "app/(bof)/safety/page.tsx",
    primaryComponent: "SafetyPage",
  },
  loadRequirementsLegacy: {
    label: "Load Requirements Redirect",
    url: "/load-requirements",
    type: "LEGACY",
    routeFile: "app/(bof)/load-requirements/page.tsx",
    primaryComponent: "LoadRequirementsPage",
  },
  rfActions: {
    label: "RF Actions",
    url: "/rf-actions",
    type: "DEMO",
    routeFile: "app/(bof)/rf-actions/page.tsx",
    primaryComponent: "RfActionsPage",
  },
};

const DYNAMIC_ROUTES: Array<{ pattern: RegExp; item: BofPageRegistryItem }> = [
  {
    pattern: /^\/drivers\/[^/]+$/,
    item: {
      label: "Driver Detail",
      url: "/drivers/:id",
      type: "DEMO",
      routeFile: "app/(bof)/drivers/[id]/page.tsx",
      primaryComponent: "DriverDetailsPage",
    },
  },
  {
    pattern: /^\/loads\/[^/]+$/,
    item: {
      label: "Load Detail",
      url: "/loads/:id",
      type: "DISPATCH",
      routeFile: "app/(bof)/loads/[id]/page.tsx",
      primaryComponent: "LoadDetailsPage",
    },
  },
];

export function getBofPageRegistryItem(pathname: string): BofPageRegistryItem | null {
  const exact = Object.values(BOF_PAGE_REGISTRY).find((item) => item.url === pathname);
  if (exact) return exact;
  const dynamic = DYNAMIC_ROUTES.find((route) => route.pattern.test(pathname));
  return dynamic?.item ?? null;
}
