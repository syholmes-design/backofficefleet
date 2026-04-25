"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BankInfoCard } from "@/components/drivers/BankInfoCard";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getDriverOperationalProfile } from "@/lib/driver-operational-profile";

export function DriverBankInfoPageClient({ driverId }: { driverId: string }) {
  const { data } = useBofDemoData();
  const profile = useMemo(
    () => getDriverOperationalProfile(data, driverId),
    [data, driverId]
  );

  if (!profile) {
    return (
      <div className="bof-page">
        <p className="bof-muted">Bank info is not on file for this driver.</p>
        <Link href="/drivers" className="bof-link-secondary">
          Back to drivers
        </Link>
      </div>
    );
  }

  const [city = "", stateZip = ""] = (profile.address ?? "").split(",").map((s) => s.trim());
  const [state = "", zip = ""] = stateZip.split(/\s+/);

  return (
    <div className="bof-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/drivers">Drivers</Link>
        <span aria-hidden> / </span>
        <Link href={`/drivers/${driverId}`}>{profile.fullName}</Link>
        <span aria-hidden> / </span>
        <span>Bank Info</span>
      </nav>
      <p className="bof-small" style={{ margin: "0 0 0.65rem" }}>
        <Link href={`/drivers/${driverId}`} className="bof-link-secondary">
          Driver profile
        </Link>
        {" · "}
        <Link href="/emergency-contacts" className="bof-link-secondary">
          Emergency contacts
        </Link>
      </p>
      {profile.hasMissingBank ? (
        <p className="bof-muted bof-small">Bank row is missing or incomplete for this driver.</p>
      ) : null}
      <BankInfoCard
        data={{
          driverId: profile.driverId,
          fullName: profile.fullName,
          streetAddress: profile.address.split(",")[0] ?? "",
          city,
          state,
          zip,
          phone: profile.phone || "Not on file",
          email: profile.email || "Not on file",
          bankName: profile.bankName || "Not on file",
          routingNumber: profile.bankRoutingNumber || "Not on file",
          accountNumber: `••••••${(profile.bankAccountLast4 || "").padStart(4, "0")}`,
          accountType:
            profile.bankAccountType.toLowerCase().includes("sav")
              ? "Savings"
              : "Checking",
          paymentPreference: profile.paymentPreference || "Direct Deposit",
          bankInfoStatus: profile.bankStatus || "Not on file",
          submissionDate: profile.bankSubmissionDate || "Not on file",
          taxClassification: profile.taxClassification || "Not on file",
          tinType: profile.tinType || "Not on file",
          w9Status: "Received",
        }}
      />
    </div>
  );
}
