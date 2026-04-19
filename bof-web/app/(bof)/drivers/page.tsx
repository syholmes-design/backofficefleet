import { DriversListPageClient } from "@/components/drivers/DriversListPageClient";

export const metadata = {
  title: "Drivers | BOF",
  description: "Driver roster",
};

export default function DriversIndexPage() {
  return <DriversListPageClient />;
}
