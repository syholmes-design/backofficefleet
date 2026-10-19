/**
 * BOF Route Owner:
 * URL: /demo/recruiting/requisitions/[requisitionId]
 * Type: DEMO
 * Primary component: RecruitingDemoRequisition (RequisitionFormClient on the in-browser demo backend)
 */
import { RecruitingDemoRequisition } from "@/components/recruiting/RecruitingDemoClients";

export const metadata = {
  title: "DEMO Requisition | BOF",
  description: "Public demonstration of the 11-section CDL driver requisition and its five approvals, with fictional records.",
};

export default async function DemoRequisitionPage({ params }: { params: Promise<{ requisitionId: string }> }) {
  const { requisitionId } = await params;
  return <RecruitingDemoRequisition requisitionId={requisitionId} />;
}
