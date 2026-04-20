import { LoadsPageClient } from "@/components/loads/LoadsPageClient";

export const metadata = {
  title: "Loads / Dispatch | BOF",
  description: "Active and recent dispatch loads",
};

export default function LoadsPage() {
  return <LoadsPageClient />;
}
