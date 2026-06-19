import type { Metadata } from "next";
import { CustomerPortalClient } from "@/components/customer-portal/CustomerPortalClient";

export const metadata: Metadata = {
  title: "Active Shipments | Customer Portal | BackOfficeFleet",
  description: "Dispatch queue simulation for approved customer load requests.",
};

export default function CustomerShipmentsPage() {
  return <CustomerPortalClient page="shipments" />;
}
