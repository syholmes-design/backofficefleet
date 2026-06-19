import type { Metadata } from "next";
import { CustomerPortalClient } from "@/components/customer-portal/CustomerPortalClient";

export const metadata: Metadata = {
  title: "BOL Packet | Customer Portal | BackOfficeFleet",
  description: "Shipment document packet simulation with BOL, rate confirmation, invoice, POD, and factoring previews.",
};

export default function CustomerDocumentsPage() {
  return <CustomerPortalClient page="documents" />;
}
