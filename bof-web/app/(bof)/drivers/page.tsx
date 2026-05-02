import { DriversListPageClient } from "@/components/drivers/DriversListPageClient";

export const metadata = {
  title: "Drivers Command Center | BOF",
  description: "Driver readiness, compliance, safety, dispatch eligibility, and settlement signals",
};

export default function DriversIndexPage() {
  return <DriversListPageClient />;
}
