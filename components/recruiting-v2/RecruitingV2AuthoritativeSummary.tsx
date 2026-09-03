"use client";

import { useEffect, useState } from "react";

type Props = { candidateId: string };

type Summary = {
  qualification: string;
  offer: string;
  onboarding: string;
  activation: string;
  documents: string;
  issues: string[];
};

export function RecruitingV2AuthoritativeSummary({ candidateId }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [qualification, offer, onboarding, activation, documents] = await Promise.all([
          fetch(`/api/recruiting-v2/qualification/${encodeURIComponent(candidateId)}`, { cache: "no-store" }),
          fetch(`/api/recruiting-v2/offer/${encodeURIComponent(candidateId)}`, { cache: "no-store" }),
          fetch(`/api/recruiting-v2/onboarding/${encodeURIComponent(candidateId)}`, { cache: "no-store" }),
          fetch(`/api/recruiting-v2/activation/${encodeURIComponent(candidateId)}`, { cache: "no-store" }),
          fetch(`/api/recruiting-v2/documents/${encodeURIComponent(candidateId)}`, { cache: "no-store" }),
        ]);
        const [qualificationBody, offerBody, onboardingBody, activationBody, documentsBody] = await Promise.all([
          qualification.json(),
          offer.json(),
          onboarding.json(),
          activation.json(),
          documents.json(),
        ]);
        if (cancelled) return;
        const issues: string[] = [];
        if (!qualification.ok || !offer.ok || !onboarding.ok || !activation.ok || !documents.ok) {
          setError("Authoritative candidate state could not be loaded from Recruiting V2 APIs.");
          return;
        }
        const documentDecision = documentsBody.summary?.currentDecision ?? "Document state unavailable";
        if (documentsBody.summary?.blocked) issues.push(`${documentsBody.summary.blocked} document gate(s) blocked`);
        if (documentsBody.summary?.open) issues.push(`${documentsBody.summary.open} document gate(s) open`);
        if ((qualificationBody.qualificationSummary?.blockingItems ?? []).length) {
          issues.push(...qualificationBody.qualificationSummary.blockingItems);
        }
        setSummary({
          qualification: qualificationBody.qualificationSummary?.status ?? "UNKNOWN",
          offer: offerBody.offerMetadata?.offerStatus ?? "UNKNOWN",
          onboarding: onboardingBody.onboardingStatus ?? "UNKNOWN",
          activation: activationBody.activationStatus ?? "UNKNOWN",
          documents: documentDecision,
          issues: issues.length ? issues : ["No open document or qualification blockers from the Recruiting V2 APIs."],
        });
      } catch {
        if (!cancelled) setError("Authoritative candidate state could not be loaded from Recruiting V2 APIs.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  if (error) return <p className="text-sm text-amber-100">{error}</p>;
  if (!summary) return <p className="text-sm text-slate-400">Loading API-backed candidate state...</p>;

  return (
    <div className="grid gap-2 text-sm text-slate-200">
      <p><strong className="text-slate-500">Documents:</strong> {summary.documents}</p>
      <p><strong className="text-slate-500">Qualification:</strong> {summary.qualification}</p>
      <p><strong className="text-slate-500">Offer:</strong> {summary.offer}</p>
      <p><strong className="text-slate-500">Onboarding:</strong> {summary.onboarding}</p>
      <p><strong className="text-slate-500">Activation:</strong> {summary.activation}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {summary.issues.map((issue) => <li key={issue} className="break-words">{issue}</li>)}
      </ul>
    </div>
  );
}
