import type { Metadata } from "next";
import Link from "next/link";
import { BOF_RUNTIME_LINKS } from "@/lib/marketing-runtime-links";

export const metadata: Metadata = {
  title: "Product | BackOfficeFleet",
  description:
    "BackOfficeFleet product overview: intake to readiness, assignment, pre-trip, dispatch, and ongoing operational control.",
};

export default function ProductPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">BackOfficeFleet product</p>
      <h1 className="mt-3 text-4xl font-extrabold text-slate-950">Control the operating record before the load moves.</h1>
      <p className="mt-5 max-w-4xl text-lg text-slate-700">
        BOF runs an execution-critical sequence: intake → readiness/assignment → pre-trip → dispatch/enroute operations,
        with documented ownership and evidence at each gate.
      </p>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        {[
          { title: "Dispatch", body: "Live assignment and movement control", href: BOF_RUNTIME_LINKS.dispatch },
          { title: "Pre-Trip", body: "Checklist and defect enforcement", href: BOF_RUNTIME_LINKS.pretrip },
          { title: "Driver Vault", body: "Driver-owned documents and authorization", href: BOF_RUNTIME_LINKS.vault },
          { title: "Command Center", body: "Operational risk and owner queue", href: BOF_RUNTIME_LINKS.commandCenter },
        ].map((item) => (
          <a key={item.title} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-400">
            <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-slate-600">{item.body}</p>
            <span className="mt-4 inline-flex text-sm font-semibold text-teal-700">Open runtime →</span>
          </a>
        ))}
      </section>

      <div className="mt-10">
        <Link href="/assessment" className="inline-flex rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800">
          Start BOF assessment
        </Link>
      </div>
    </main>
  );
}
