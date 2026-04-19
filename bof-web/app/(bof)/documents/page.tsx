import { DocumentsPageClient } from "@/components/documents/DocumentsPageClient";

export const metadata = {
  title: "Document Vault | BOF",
  description: "Fleet-wide driver credentials and compliance documents",
};

export default function DocumentsPage() {
  return <DocumentsPageClient />;
}
