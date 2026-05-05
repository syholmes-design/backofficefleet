/**
 * BOF Route Owner:
 * URL: /load-requests
 * Type: DISPATCH
 * Primary component: LoadRequestsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { ClientLoadRequestsReviewPageClient } from "@/components/load-request/ClientLoadRequestsReviewPageClient";

export const metadata = {
  title: "Client Load Requests | BOF",
  description: "Internal BOF review queue for client intake requests",
};

export default function LoadRequestsPage() {
  return <ClientLoadRequestsReviewPageClient />;
}

