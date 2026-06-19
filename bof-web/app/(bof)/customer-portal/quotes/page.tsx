import type { Metadata } from "next";
import { CustomerPortalClient } from "@/components/customer-portal/CustomerPortalClient";

export const metadata: Metadata = {
  title: "Quote Approval | Customer Portal | BackOfficeFleet",
  description: "Customer quote approval simulation for BOF load intake.",
};

export default function CustomerQuotesPage() {
  return <CustomerPortalClient page="quotes" />;
}
