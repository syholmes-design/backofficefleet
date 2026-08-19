import type { Metadata } from "next";
import Link from "next/link";
import { BOF_RUNTIME_LINKS } from "@/lib/marketing-runtime-links";

export const metadata: Metadata = {
  title: "Driver Experience | BackOfficeFleet",
  description:
    "Driver experience in BackOfficeFleet: readiness visibility, assignment clarity, pre-trip workflow, and document control.",
};

export default function DriverExperiencePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Driver experience</p>
      <h1 className="mt-3 text-4xl font-extrabold text-slate-950">Drivers get one trusted operating path, not five disconnected systems.</h1>
      <p className="mt-5 max-w-4xl text-lg text-slate-700">
        BOF ties driver readiness, assignment state, pre-trip execution, and vault evidence into one accountable record so
        a driver knows what is ready, what is blocked, and what clears the block.
      </p>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { title: "Readiness state", body: "Readable eligibility and hold reasons before dispatch." },
          { title: "Assignment clarity", body: "Active assignment linked to the specific load and equipment." },
          { title: "Evidence continuity", body: "Pre-trip and vault records remain tied to the same operating decision." },
        ].map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-slate-600">{item.body}</p>
          </article>
        ))}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <a href={BOF_RUNTIME_LINKS.pretrip} className="inline-flex rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800">
          Open pre-trip runtime
        </a>
        <a href={BOF_RUNTIME_LINKS.vault} className="inline-flex rounded-md border border-teal-700 px-5 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-50">
          Open driver vault runtime
        </a>
        <Link href="/assessment" className="inline-flex rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Start assessment
        </Link>
      </div>
    </main>
  );
}
