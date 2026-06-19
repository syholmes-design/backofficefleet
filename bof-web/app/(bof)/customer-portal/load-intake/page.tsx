import type { Metadata } from "next";
import { CustomerPortalClient } from "@/components/customer-portal/CustomerPortalClient";

export const metadata: Metadata = {
  title: "Load Intake | Customer Portal | BackOfficeFleet",
  description: "Customer-facing load intake simulation for shipment requests and configurable demo quotes.",
};

export default function CustomerLoadIntakePage() {
  return <CustomerPortalClient page="load-intake" />;
}
