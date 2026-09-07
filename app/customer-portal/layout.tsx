import type { Metadata } from "next";
import { BofDemoDataShell } from "@/components/BofDemoDataShell";
import { getBofData } from "@/lib/load-bof-data";
import "./customer-portal.css";
import "./customer-portal-bof.css";

export const metadata: Metadata = {
  title: "Customer Portal",
  description:
    "Request a shipment, review a quote, follow assignment, inspect the BOL packet, track status, and review billing and factoring context.",
  alternates: { canonical: "https://backofficefleet.com/customer-portal/" },
};

export default function CustomerPortalLayout({ children }: { children: React.ReactNode }) {
  const seed = getBofData();
  return <BofDemoDataShell seed={seed}>{children}</BofDemoDataShell>;
}
