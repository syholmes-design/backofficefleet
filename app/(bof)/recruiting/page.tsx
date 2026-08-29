import type { Metadata } from "next";
import { RecruitingPageClient } from "@/components/recruiting/RecruitingPageClient";

export const metadata: Metadata = {
  title: "Recruiting & Onboarding | BOF",
  description: "BOF workforce recruitment, job builder, candidate qualification, onboarding, and driver activation.",
};

export default function RecruitingPage() {
  return <RecruitingPageClient />;
}
