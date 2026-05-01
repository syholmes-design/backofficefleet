import { ClientLoadRequestsReviewPageClient } from "@/components/load-request/ClientLoadRequestsReviewPageClient";

export const metadata = {
  title: "Client Load Requests | BOF",
  description: "Internal BOF review queue for client intake requests",
};

export default function LoadRequestsPage() {
  return <ClientLoadRequestsReviewPageClient />;
}

