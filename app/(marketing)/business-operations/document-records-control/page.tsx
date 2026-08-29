import type { Metadata } from "next";
import Link from "next/link";
import { BusinessOperationsSectionNav } from "@/components/business-operations/BusinessOperationsSectionNav";

export const metadata: Metadata = {
  title: "Document & Records Control | Business Operations",
  description: "Recovered BOF document and records control framework for governance, versioning, and operational proof.",
};

export default function DocumentRecordsControlPage() {
  return (
    <>
      <BusinessOperationsSectionNav activeHref="/business-operations/document-records-control" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Document &amp; Records Control</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Keep the business record auditable, organized, and ready for decision-making.</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            The recovered BOF architecture treats records as a business control: documents must be governed, versioned, and connected to the operations they support, not left as disconnected artifacts in static folders.
          </p>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { title: "Records governance", body: "Define ownership, review cycles, retention, and the expected business controls behind each file." },
            { title: "Operational proof", body: "Tie documents to safety, qualification, billing, or settlement workflows where evidence materially affects decisions." },
            { title: "Document vault connection", body: "Link the policy and records narrative to the current BOF document vault and related operational surfaces." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-slate-600">{item.body}</p>
            </div>
          ))}
        </section>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">Current BOF connection</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Company Operations Vault</h2>
            <Link href="/documents/company-operations-vault" className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Open the vault
            </Link>
          </div>
          <p className="mt-3 text-slate-700">
            This recovered page connects cleanly to the existing BOF document vault and policy archive, preserving the relationship between Business Operations and the company’s policy and SOP structure without duplicating the same system.
          </p>
        </div>
      </main>
    </>
  );
}
