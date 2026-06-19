import type { Metadata } from "next";
import { CustomerPortalClient } from "@/components/customer-portal/CustomerPortalClient";

export const metadata: Metadata = {
  title: "Tracking | Customer Portal | BackOfficeFleet",
  description: "Customer shipment tracking simulation for BOF load intake.",
};

export default function CustomerTrackingPage() {
  return <CustomerPortalClient page="tracking" />;
}
