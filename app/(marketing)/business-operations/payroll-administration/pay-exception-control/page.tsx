import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BusinessOperationsSectionNav } from "@/components/business-operations/BusinessOperationsSectionNav";

export const metadata: Metadata = {
  title: "Pay Exception Control | Business Operations",
  description: "Recovered BOF pay exception control experience for payroll issue review and proof-based resolution.",
};

export default function PayExceptionControlPage() {
  return (
    <>
      <BusinessOperationsSectionNav activeHref="/business-operations/payroll-administration" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <Image
            src="/assets/images/cinematic/business-operations--payroll-administration--pay-exception-control-desktop.webp"
            alt="Pay exception review and evidence control interface"
            width={1536}
            height={864}
            priority
            className="h-72 w-full object-cover"
          />
          <div className="p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Pay Exception Control</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Resolve exceptions with evidence, ownership, and a clean state handoff.</h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              BOF keeps payroll questions tied to approval records, supporting documents, and the person accountable for final resolution so review does not silently stall.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/business-operations/payroll-administration" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">
            Back to payroll administration
          </Link>
          <Link href="/dashboard" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            See current operations
          </Link>
        </div>
      </main>
    </>
  );
}
