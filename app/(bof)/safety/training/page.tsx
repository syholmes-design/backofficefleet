import { SafetyTrainingLibrary } from "@/components/safety-v4/SafetyTrainingLibrary";

export const metadata = {
  title: "Safety Training & Coaching | BOF",
  description: "BOF-owned coaching modules, external FMCSA resources, and event-linked recommendations.",
};

export default async function SafetyTrainingPage() {
  return <SafetyTrainingLibrary assignments={[]} />;
}