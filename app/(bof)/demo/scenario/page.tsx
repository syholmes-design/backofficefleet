import Link from "next/link";
import { EquipmentScenarioDemoClient } from "@/components/demo/EquipmentScenarioDemoClient";

export const metadata = {
  title: "What Happens If? | BOF Demo",
  description: "A controlled BOF DEMO MODE scenario showing how operating conditions affect Equipment availability, readiness, and dispatchability.",
};

export default function EquipmentScenarioPage() {
  return (
    <>
      <div className="bof-page mx-auto max-w-7xl pb-0">
        <Link href="/dashboard" className="text-sm font-bold text-teal-200 hover:text-teal-100">Back to Command Center</Link>
      </div>
      <EquipmentScenarioDemoClient />
    </>
  );
}