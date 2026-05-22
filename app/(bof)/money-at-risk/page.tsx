/**
 * BOF Route Owner:
 * URL: /money-at-risk
 * Type: DEMO
 * Primary component: MoneyAtRiskPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { MoneyAtRiskPageClient } from "@/components/money-at-risk/MoneyAtRiskPageClient";

export const metadata = {
  title: "Money at Risk | BOF",
  description: "Financial risk register",
};

export default function MoneyAtRiskPage() {
  return <MoneyAtRiskPageClient />;
}
