/**
 * Maps BOF auto-check IDs to on-screen fix actions (readiness panel / step 4).
 */

export type FixActionLabel = "Fix now" | "Add missing info" | "Resolve blocker";

export type InlineFixPanel =
  | "shipper"
  | "facility"
  | "load"
  | "appointment"
  | "temperature"
  | "photos";

export type DrawerDocTab = "bol" | "insurance" | "pod" | "accessorial";

export type BlockingFixRoute = {
  actionLabel: FixActionLabel;
  /** Opens inline accordion section on readiness */
  inlinePanel?: InlineFixPanel;
  /** Opens documentation drawer on this tab */
  drawerTab?: DrawerDocTab;
};

const DRAWER_BOL: BlockingFixRoute = {
  actionLabel: "Add missing info",
  drawerTab: "bol",
};
const DRAWER_INS: BlockingFixRoute = {
  actionLabel: "Add missing info",
  drawerTab: "insurance",
};
const DRAWER_POD: BlockingFixRoute = {
  actionLabel: "Add missing info",
  drawerTab: "pod",
};
const DRAWER_ACC: BlockingFixRoute = {
  actionLabel: "Add missing info",
  drawerTab: "accessorial",
};

export function blockingFixRoute(checkId: string): BlockingFixRoute {
  switch (checkId) {
    case "chk-ship-name":
    case "chk-contact-name":
    case "chk-contact-email":
    case "chk-contact-phone":
      return { actionLabel: "Fix now", inlinePanel: "shipper" };
    case "chk-fac-name":
    case "chk-fac-addr":
      return { actionLabel: "Fix now", inlinePanel: "facility" };
    case "chk-commodity":
    case "chk-weight":
    case "chk-equip":
      return { actionLabel: "Fix now", inlinePanel: "load" };
    case "chk-temp":
      return { actionLabel: "Resolve blocker", inlinePanel: "temperature" };
    case "chk-appt-window":
      return { actionLabel: "Fix now", inlinePanel: "appointment" };
    case "chk-seal-rule":
    case "chk-bol":
      return DRAWER_BOL;
    case "chk-insurance":
      return DRAWER_INS;
    case "chk-pod":
    case "chk-photo-pickup":
    case "chk-photo-delivery":
    case "chk-photo-cargo":
      return DRAWER_POD;
    case "chk-accessorial":
      return DRAWER_ACC;
    default:
      return { actionLabel: "Resolve blocker" };
  }
}

export function panelNeededForBlocking(
  checkIds: string[],
  panel: InlineFixPanel
): boolean {
  return checkIds.some((id) => blockingFixRoute(id).inlinePanel === panel);
}

export function drawerTabNeededForBlocking(
  checkIds: string[],
  tab: DrawerDocTab
): boolean {
  return checkIds.some((id) => blockingFixRoute(id).drawerTab === tab);
}
