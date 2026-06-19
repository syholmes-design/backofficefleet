import type { Metadata } from "next";
import { CustomerPortalClient } from "@/components/customer-portal/CustomerPortalClient";

export const metadata: Metadata = {
  title: "Billing and Factoring | Customer Portal | BackOfficeFleet",
  description: "Draft billing, settlement, and factoring packet simulation for BOF customer loads.",
};

export default function CustomerBillingPage() {
  return <CustomerPortalClient page="billing" />;
}
