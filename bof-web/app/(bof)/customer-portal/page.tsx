import type { Metadata } from "next";
import { CustomerPortalClient } from "@/components/customer-portal/CustomerPortalClient";

export const metadata: Metadata = {
  title: "Customer Portal | BackOfficeFleet",
  description: "Simulated customer-facing load intake, shipment tracking, documents, and billing workflow.",
};

export default function CustomerPortalPage() {
  return <CustomerPortalClient page="home" />;
}
