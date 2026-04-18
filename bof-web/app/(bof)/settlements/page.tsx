import { SettlementsPayrollPageClient } from "@/components/settlements-payroll/SettlementsPayrollPageClient";

export const metadata = {
  title: "Settlements | BOF",
  description: "Payroll operations, export readiness, and settlement detail",
};

export default function SettlementsPage() {
  return (
    <div className="bof-page">
      <SettlementsPayrollPageClient />
    </div>
  );
}
