import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | BackOfficeFleet",
  description:
    "Contact BackOfficeFleet with an operational question about readiness, dispatch, pre-trip, vault, or implementation path.",
};

const CONTACT_TOPICS = [
  { label: "Operational readiness assessment", href: "mailto:demo@backofficefleet.com?subject=BOF%20Assessment%20Request" },
  { label: "Investor conversation", href: "mailto:demo@backofficefleet.com?subject=BOF%20Investor%20Inquiry" },
  { label: "Fleet operations working session", href: "mailto:demo@backofficefleet.com?subject=BOF%20Working%20Session" },
];

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Contact BOF</p>
      <h1 className="mt-3 text-4xl font-extrabold text-slate-950">Start with the operating question you need resolved.</h1>
      <p className="mt-5 max-w-3xl text-lg text-slate-700">
        Share the workflow pressure, the blocked decision, and the evidence gap. BOF will route your request to the
        appropriate assessment or strategy path.
      </p>

      <section className="mt-10 grid gap-4">
        {CONTACT_TOPICS.map((item) => (
          <a key={item.label} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-400">
            <span className="text-base font-semibold text-slate-900">{item.label}</span>
            <span className="mt-1 block text-sm text-teal-700">Email BOF →</span>
          </a>
        ))}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/assessment" className="inline-flex rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800">
          Start assessment
        </Link>
        <Link href="/investors" className="inline-flex rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Investor brief
        </Link>
      </div>
    </main>
  );
}
