import { SafetyShell } from "@/components/safety/SafetyShell";

export const metadata = {
  title: "Safety Command Center | BOF",
  description:
    "Driver risk, HOS/OOS alerts, proof certification, safety bonus eligibility, and compliance signals for fleet operations",
};

export default function SafetyPage() {
  return (
    <div className="bof-page bof-safety-page-wrap">
      <SafetyShell />
    </div>
  );
}
