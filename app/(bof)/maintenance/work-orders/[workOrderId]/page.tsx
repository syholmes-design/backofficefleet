import { redirect } from "next/navigation";

export default async function MaintenanceWorkOrderRedirect({
  params,
}: {
  params: Promise<{ workOrderId: string }>;
}) {
  const { workOrderId } = await params;
  redirect(`/maintenance?workOrderId=${encodeURIComponent(workOrderId)}`);
}
