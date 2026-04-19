import { notFound } from "next/navigation";
import { getBofData } from "@/lib/load-bof-data";
import { getDriverById } from "@/lib/driver-queries";
import { DriverDetailPageClient } from "@/components/drivers/DriverDetailPageClient";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const data = getBofData();
  return data.drivers.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = getBofData();
  const d = getDriverById(data, id);
  return {
    title: d ? `${d.name} | Driver | BOF` : "Driver | BOF",
  };
}

export default async function DriverDetailPage({ params }: Props) {
  const { id } = await params;
  const data = getBofData();
  const driver = getDriverById(data, id);
  if (!driver) notFound();

  return <DriverDetailPageClient driverId={id} />;
}
