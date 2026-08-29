import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BusinessOperationsSectionNav } from "@/components/business-operations/BusinessOperationsSectionNav";

export const metadata: Metadata = {
  title: "Billing & AR Control | Business Operations",
  description: "Recovered BOF billing and AR control experience for packet readiness and customer follow-through.",
};

export default function BillingArControlPage() {
  return (
    <>
      <BusinessOperationsSectionNav activeHref="/business-operations/customer-billing" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <Image
            src="/assets/images/cinematic/business-operations--customer-billing--billing-ar-control-desktop.webp"
            alt="Billing and account receivables control interface"
            width={1536}
            height={864}
            priority
            className="h-72 w-full object-cover"
          />
          <div className="p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Billing &amp; AR Control</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Give every invoice context, evidence, and next action.</h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              BOF organizes invoice readiness, delivery proof, customer follow-up, and open receivable status so the office can resolve billing questions before they become collections issues.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/business-operations/customer-billing" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">
            Back to customer billing
          </Link>
          <Link href="/settlements" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            View settlements
          </Link>
        </div>
      </main>
    </>
  );
}
