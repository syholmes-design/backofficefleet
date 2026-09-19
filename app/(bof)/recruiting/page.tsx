/**
 * BOF Route Owner:
 * URL: /recruiting
 * Type: LIVE
 * Primary component: RequisitionListClient
 * Related: /recruiting/workspace (RecruitingPageClient), /recruiting-v2
 */
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RequisitionListClient } from "@/components/recruiting/RequisitionListClient";
import { listRequisitionsForUser } from "@/lib/services/requisitionService";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recruiting | BOF",
  description: "Fleet workforce requisitions that authorize recruiting before a Driver record exists",
};

export default async function RecruitingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/recruiting");
  }
  const rows = await listRequisitionsForUser(session.user);
  return <RequisitionListClient initialRows={JSON.parse(JSON.stringify(rows))} />;
}
