/**
 * BOF Route Owner:
 * URL: /source-of-truth
 * Type: DEMO
 * Primary component: SourceOfTruthPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { SourceOfTruthApp } from "@/components/source-of-truth/SourceOfTruthApp";

export const metadata = {
  title: "Source of Truth | BOF",
  description: "Demo data control center — edit canonical drivers, documents, and loads",
};

export default function SourceOfTruthPage() {
  return <SourceOfTruthApp />;
}
