/**
 * BOF Route Owner:
 * URL: /demo/recruiting/workspace
 * Type: DEMO
 * Primary component: RecruitingDemoWorkspace (RecruitingPageClient on the in-browser demo backend)
 * Related: /recruiting/workspace (LIVE)
 */
import { RecruitingDemoWorkspace } from "@/components/recruiting/RecruitingDemoClients";

export const metadata = {
  title: "DEMO Recruiting & Onboarding | BOF",
  description: "Public demonstration of the BOF Recruiting & Onboarding workspace with fictional requisitions and candidates.",
};

export default function DemoRecruitingWorkspacePage() {
  return <RecruitingDemoWorkspace />;
}
