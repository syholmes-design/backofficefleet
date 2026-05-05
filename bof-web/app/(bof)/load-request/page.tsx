/**
 * BOF Route Owner:
 * URL: /load-request
 * Type: DISPATCH
 * Primary component: LoadRequestPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { ClientLoadRequestPageClient } from "@/components/load-request/ClientLoadRequestPageClient";

export const metadata = {
  title: "Request a Load | BOF",
  description: "Client-facing demo load request submission",
};

export default function LoadRequestPage() {
  return <ClientLoadRequestPageClient />;
}

