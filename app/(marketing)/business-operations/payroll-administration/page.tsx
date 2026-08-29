import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BusinessOperationsSectionNav } from "@/components/business-operations/BusinessOperationsSectionNav";

export const metadata: Metadata = {
  title: "Payroll Administration | Business Operations",
  description: "Recovered BOF payroll administration experience for exception review and pay-control workflows.",
};

export default function PayrollAdministrationPage() {
  return (
    <>
      <BusinessOperationsSectionNav activeHref="/business-operations/payroll-administration" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-xl">
          <Image
            src="/assets/images/cinematic/business-operations--payroll-administration--pay-exception-control-desktop.webp"
            alt="Payroll exception check and review screen"
            width={1536}
            height={864}
            priority
            className="h-80 w-full object-cover opacity-80"
          />
          <div className="p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">Payroll Administration</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Give every pay exception evidence, ownership, and a review state.</h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-200">
              BOF helps connect approved work, settlement inputs, deductions, advances, adjustments, supporting records, questions, and accountable follow-through before an exception is closed.
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { title: "Exception review", body: "Surface the unresolved pay issue with the supporting record, owner, and state of review." },
            { title: "Settlement inputs", body: "Align payroll activity with the operational record that created the payment question in the first place." },
            { title: "Closure discipline", body: "Move from question to final disposition with a clear explanation and accountable review step." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-slate-600">{item.body}</p>
            </div>
          ))}
        </section>

        <div className="mt-10 rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Recovered subsection</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Pay Exception Control</h2>
            <Link href="/business-operations/payroll-administration/pay-exception-control" className="inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
              Open pay exception control
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
