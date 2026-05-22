/**
 * BOF Route Owner:
 * URL: /drivers/:id/bank-info
 * Type: DEMO
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { notFound } from "next/navigation";
import { getBofData } from "@/lib/load-bof-data";
import { DriverBankInfoPageClient } from "@/components/drivers/DriverBankInfoPageClient";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const data = getBofData();
  return data.drivers.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = getBofData();
  const row = data.drivers.find((d) => d.id === id);
  return {
    title: row ? `${row.name} | Bank Info | BOF` : "Bank Info | BOF",
  };
}

export default async function DriverBankInfoPage({ params }: Props) {
  const { id } = await params;
  const data = getBofData();
  if (!data.drivers.find((d) => d.id === id)) notFound();
  return <DriverBankInfoPageClient driverId={id} />;
}

