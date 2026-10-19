/**
 * BOF Route Owner:
 * URL: /demo/recruiting
 * Type: DEMO
 * Primary component: RecruitingDemoRequisitions (RequisitionListClient on the in-browser demo backend)
 * Related: /recruiting (LIVE), /demo/recruiting/workspace, /recruiting-onboarding
 */
import { RecruitingDemoRequisitions } from "@/components/recruiting/RecruitingDemoClients";

export const metadata = {
  title: "DEMO Recruiting Requisitions | BOF",
  description: "Public demonstration of BOF driver requisitions with fictional records — no sign-in, no BOF records changed.",
};

export default function DemoRecruitingPage() {
  return <RecruitingDemoRequisitions />;
}
