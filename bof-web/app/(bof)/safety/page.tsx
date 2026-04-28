import { SafetyShell } from "@/components/safety/SafetyShell";

export const metadata = {
  title: "Safety & Compliance | BOF",
  description:
    "Safety events, driver compliance posture, expirations, and claim exposure for fleet operations",
};

export default function SafetyPage() {
  return (
    <div className="bof-page bof-safety-page-wrap">
      <SafetyShell />
    </div>
  );
}
