import type { Metadata } from "next";
import { RecruitingV2App } from "@/components/recruiting-v2/RecruitingV2App";

export const metadata: Metadata = {
  title: "Recruiting V2 | BOF",
  description: "Isolated next-generation BOF recruiting system for applicant, qualification, interview, document, offer, onboarding, and driver activation readiness workflows.",
};

export default function RecruitingV2Page() {
  return <RecruitingV2App />;
}