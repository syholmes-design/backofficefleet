import { redirect } from "next/navigation";

export default async function DriverVaultRedirect({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  const { driverId } = await params;
  redirect(`/documents/vault?driverId=${encodeURIComponent(driverId)}`);
}
