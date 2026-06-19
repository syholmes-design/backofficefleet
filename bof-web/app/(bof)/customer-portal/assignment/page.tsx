import type { Metadata } from "next";
import { CustomerPortalClient } from "@/components/customer-portal/CustomerPortalClient";

export const metadata: Metadata = {
  title: "Assignment | Customer Portal | BackOfficeFleet",
  description: "Driver, tractor, trailer, and readiness gate simulation for customer load intake.",
};

export default function CustomerAssignmentPage() {
  return <CustomerPortalClient page="assignment" />;
}
