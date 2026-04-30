"use client";

import { use, useEffect, useMemo } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  getCanonicalDriverDocuments,
  getDriverDocumentByType,
  getDriverDocumentPacket,
} from "@/lib/driver-doc-registry";
import { getDriverOperationalProfile } from "@/lib/driver-operational-profile";

type Props = {
  params: Promise<{ id: string }>;
};

type HrDocRow = {
  label: string;
  type: string;
  status: string;
  href?: string;
  source?: string;
};

function humanizeStatus(raw?: string) {
  const key = String(raw ?? "").trim().toUpperCase();
  if (key === "VALID") return "Ready";
  if (key === "EXPIRING_SOON") return "Expiring Soon";
  if (key === "EXPIRED") return "Expired";
  if (key === "MISSING") return "Missing / Needs Review";
  if (key === "PENDING_REVIEW" || key === "PENDING") return "Pending Review";
  if (!key) return "Missing / Needs Review";
  return key
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function chipClass(status: string) {
  const key = status.toUpperCase();
  if (key.includes("EXPIRED")) return "border border-rose-700/60 bg-rose-950/40 text-rose-200";
  if (key.includes("EXPIRING")) return "border border-amber-700/60 bg-amber-950/40 text-amber-200";
  if (key.includes("MISSING")) return "border border-rose-700/60 bg-rose-950/35 text-rose-200";
  if (key.includes("PENDING")) return "border border-amber-700/60 bg-amber-950/35 text-amber-200";
  return "border border-emerald-700/60 bg-emerald-950/35 text-emerald-200";
}

function sourceLabel(href?: string): string {
  if (!href) return "No file";
  const ext = href.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "PDF";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "Image";
  if (ext === "html") return "HTML";
  return "File";
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm text-slate-100">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

export default function DriverHRPage({ params }: Props) {
  const { id } = use(params);
  const { data } = useBofDemoData();
  const driver = data.drivers.find((d) => d.id === id);
  const profile = getDriverOperationalProfile(data, id);
  const packet = getDriverDocumentPacket(id);

  if (!driver) {
    notFound();
  }

  const hrDocs = useMemo<HrDocRow[]>(() => {
    const canonical = getCanonicalDriverDocuments(data, id);
    const byType = new Map(canonical.map((doc) => [doc.type, doc]));
    const rows: Array<{ label: string; type: string }> = [
      { label: "Emergency Contact", type: "Emergency Contact" },
      { label: "CDL", type: "CDL" },
      { label: "Insurance Card", type: "Insurance Card" },
      { label: "Medical Card", type: "Medical Card" },
      { label: "Bank Information", type: "Bank Info" },
      { label: "MVR", type: "MVR" },
      { label: "I-9", type: "I-9" },
      { label: "W-9", type: "W-9" },
      { label: "FMCSA Compliance", type: "FMCSA" },
    ];
    return rows.map((row) => {
      const doc = byType.get(row.type);
      const canonicalUrl = getDriverDocumentByType(id, row.type) ?? doc?.fileUrl;
      const status = canonicalUrl
        ? humanizeStatus(doc?.status ?? "VALID")
        : "Missing / Needs Review";
      return {
        label: row.label,
        type: row.type,
        status,
        href: canonicalUrl,
        source: sourceLabel(canonicalUrl),
      };
    });
  }, [data, id]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const keyToType: Array<[keyof typeof packet, string]> = [
      ["i9", "I-9"],
      ["emergencyContact", "Emergency Contact"],
      ["fmcsaCompliance", "FMCSA"],
      ["w9", "W-9"],
      ["bankInformation", "Bank Info"],
      ["medicalCard", "Medical Card"],
      ["cdl", "CDL"],
      ["insuranceCard", "Insurance Card"],
      ["mvr", "MVR"],
    ];
    keyToType.forEach(([key, type]) => {
      const packetUrl = packet[key];
      const canonicalUrl = getDriverDocumentByType(id, type);
      if ((packetUrl ?? "") !== (canonicalUrl ?? "")) {
        console.warn("[hr-doc-registry] URL mismatch between packet and canonical registry", {
          driverId: id,
          type,
          packetUrl,
          canonicalUrl,
        });
      }
    });
  }, [id, packet]);

  return (
    <div className="bof-page space-y-5">
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-white">{driver.name} - HR & Administrative Record</h1>
          <Link
            href={`/drivers/${id}/profile`}
            className="text-sm font-medium text-teal-300 hover:text-teal-200 hover:underline"
          >
            Open Profile
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Canonical HR, emergency, and document readiness details keyed by{" "}
          <span className="font-mono">{id}</span>.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-100">Emergency Contact (Primary)</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name" value={profile?.primaryEmergencyName} />
            <Field label="Relationship" value={profile?.primaryEmergencyRelationship} />
            <Field label="Phone" value={profile?.primaryEmergencyPhone} />
            <Field label="Email" value={profile?.primaryEmergencyEmail} />
            <Field label="Address" value={profile?.primaryEmergencyAddress} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-100">Emergency Contact (Secondary)</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name" value={profile?.secondaryEmergencyName} />
            <Field label="Relationship" value={profile?.secondaryEmergencyRelationship} />
            <Field label="Phone" value={profile?.secondaryEmergencyPhone} />
            <Field label="Email" value={profile?.secondaryEmergencyEmail} />
            <Field label="Address" value={profile?.secondaryEmergencyAddress} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-100">Bank & Direct Deposit</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Bank Name" value={profile?.bankName} />
            <Field label="Account Type" value={profile?.bankAccountType} />
            <Field label="Last 4 Digits" value={profile?.bankAccountLast4} />
            <Field label="Payment Preference" value={profile?.paymentPreference} />
            <Field label="Submission Date" value={profile?.bankSubmissionDate} />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
              <span className="inline-flex rounded px-2 py-0.5 text-xs font-semibold border border-emerald-700/60 bg-emerald-950/35 text-emerald-200">
                {profile?.bankStatus || "Pending Review"}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-100">Tax & Employment</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Tax Classification" value={profile?.taxClassification} />
            <Field label="TIN Type" value={profile?.tinType} />
            <Field label="Employment Status" value="Onboarding Complete" />
            <Field label="Handbook Acknowledgment" value="Signed" />
            <Field label="Orientation Checklist" value="Complete" />
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/45 p-4">
        <h2 className="mb-3 text-base font-semibold text-slate-100">HR Packet Documents</h2>
        <div className="space-y-2">
          {hrDocs.map((doc) => (
            <div
              key={doc.type}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 bg-slate-950/55 px-3 py-2"
            >
              <p className="text-sm font-medium text-slate-100">{doc.label}</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded border border-slate-700/70 bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                  {doc.source}
                </span>
                <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${chipClass(doc.status)}`}>
                  {doc.status}
                </span>
                {doc.href ? (
                  <a
                    href={doc.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-teal-300 hover:text-teal-200 hover:underline"
                  >
                    Open
                  </a>
                ) : (
                  <span className="text-xs text-amber-300">Missing / Needs Review</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
