/**
 * BOF Route Owner:
 * URL: /recruiting/requisitions/[requisitionId]
 * Type: LIVE
 * Primary component: RequisitionFormClient
 */
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { RequisitionFormClient } from "@/components/recruiting/RequisitionFormClient";
import { getAuthorizedRequisition } from "@/lib/services/requisitionService";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Requisition | BOF",
  description: "CDL driver requisition BOF-HR-DRV",
};

export default async function RequisitionDetailPage({ params }: { params: Promise<{ requisitionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/recruiting");
  }
  const { requisitionId } = await params;
  try {
    const record = await getAuthorizedRequisition(session.user, requisitionId);
    return <RequisitionFormClient initial={JSON.parse(JSON.stringify(record))} />;
  } catch (error) {
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 500;
    if (statusCode === 404) notFound();
    if (statusCode === 403) redirect("/recruiting");
    throw error;
  }
}
