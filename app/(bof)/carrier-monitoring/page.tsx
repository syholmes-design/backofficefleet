import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CarrierMonitoringClient } from "@/components/fmcsa/CarrierMonitoringClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Carrier Monitoring | BOF",
  description: "FMCSA carrier compliance monitoring for BOF fleets.",
};

export default async function CarrierMonitoringPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin?callbackUrl=/carrier-monitoring");
  return <CarrierMonitoringClient />;
}
