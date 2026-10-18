import type { Metadata } from "next";
import Link from "next/link";

import { ContactInquiryForm } from "@/components/marketing/ContactInquiryForm";
import { getAssessmentTrack } from "@/lib/assessment-tracks";

export const metadata: Metadata = {
  title: "Contact | BackOfficeFleet",
  description:
    "Contact BackOfficeFleet with an operational question about readiness, dispatch, pre-trip, vault, or implementation path.",
};

// "Fleet operations working session" was removed: superseded by the assessment (docs/governance/superseded-decisions.md).
const CONTACT_TOPICS = [
  { label: "Operational readiness assessment", href: "/assessment", action: "Take the Assessment →" },
  { label: "Investor conversation", href: "mailto:demo@backofficefleet.com?subject=BOF%20Investor%20Inquiry", action: "Email BOF →" },
];

type ContactSearchParams = Promise<Record<string, string | string[] | undefined>>;

const SCORE_CATEGORIES = new Set(["Strong", "Needs Attention", "High Risk", "Critical"]);

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/**
 * Assessment hand-off: /contact?source=assessment&track=<id>&score=<0-100>&category=<label>&risks=a|b
 * Values are validated (known track, numeric score, known category, short plain risk labels) and
 * only used as editable default text, which React escapes.
 */
function assessmentMessage(params: Record<string, string | string[] | undefined>): string | undefined {
  if (first(params.source) !== "assessment") return undefined;
  const track = getAssessmentTrack(first(params.track));
  if (!track) return undefined;
  const rawScore = first(params.score);
  const score = rawScore ? Number(rawScore) : Number.NaN;
  const category = first(params.category);
  const risks = first(params.risks)
    .split("|")
    .map((risk) => risk.replace(/[^\w\s&/,().'-]/g, "").trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 8);
  const lines = [`I completed the BOF ${track.title} assessment and would like to review the results with BOF.`];
  if (Number.isFinite(score) && score >= 0 && score <= 100) {
    lines.push(`Score: ${Math.round(score)}%${SCORE_CATEGORIES.has(category) ? ` (${category})` : ""}`);
  }
  if (risks.length) lines.push(`Risk areas: ${risks.join("; ")}`);
  lines.push("", "Workflow pressure or decision we need help with:");
  return lines.join("\n");
}

export default async function ContactPage({ searchParams }: { searchParams?: ContactSearchParams }) {
  const params = searchParams ? await searchParams : {};
  const defaultMessage = assessmentMessage(params);
  return (
    <main className="bof-service-page">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Contact BOF</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-950">Start with the operating question you need resolved.</h1>
        <p className="mt-5 max-w-3xl text-lg text-slate-700">
          Share the workflow pressure, the blocked decision, and the evidence gap. BOF will route your request to the
          appropriate assessment or strategy path.
        </p>

        <ContactInquiryForm defaultMessage={defaultMessage} />

        <section className="mt-10 grid gap-4" aria-label="Email BOF instead">
          <h2 className="text-lg font-bold text-slate-950">Or email BOF</h2>
          {CONTACT_TOPICS.map((item) => (
            <a key={item.label} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-400">
              <span className="text-base font-semibold text-slate-900">{item.label}</span>
              <span className="mt-1 block text-sm text-teal-700">{item.action}</span>
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
      </div>
    </main>
  );
}
