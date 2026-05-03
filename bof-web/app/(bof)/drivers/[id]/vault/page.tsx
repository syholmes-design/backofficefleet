"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { DriverVaultDqfPageClient } from "@/components/drivers/DriverVaultDqfPageClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default function DriverVaultPage({ params }: Props) {
  const { id } = use(params);
  const { data } = useBofDemoData();
  const driver = data.drivers.find((d) => d.id === id);

  if (!driver) {
    notFound();
  }

  return <DriverVaultDqfPageClient driverId={id} />;
}
