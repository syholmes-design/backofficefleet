/**
 * BOF Route Owner:
 * URL: /load-requirements
 * Type: DISPATCH
 * Primary component: LoadRequirementsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { redirect } from "next/navigation";

/** @deprecated Use `/dispatch/intake` — canonical BOF load intake under Dispatch. */
export default function LoadRequirementsPage() {
  redirect("/dispatch/intake");
}
