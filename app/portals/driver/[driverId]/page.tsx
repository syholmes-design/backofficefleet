import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAuthenticatedDriver } from "@/lib/services/authenticatedDriverService";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ driverId: string }>;
};

export default async function DriverPortalDriverRoute({ params }: Props) {
  const session = await auth();
  const { driverId } = await params;

  if (!session?.user?.id) {
    redirect("/portals/driver");
  }

  const authenticatedDriver = await getAuthenticatedDriver(session.user);
  if (authenticatedDriver.status !== "LINKED" || authenticatedDriver.driver.id !== driverId) {
    notFound();
  }

  redirect("/portals/driver");
}
