import Link from "next/link";

type Tier = {
  tierLabel: string;
  title: string;
  subtitle: string;
  bullets: string[];
  ctaLabel: string;
  href: string;
};

const TIERS: readonly Tier[] = [
  {
    tierLabel: "Tier 1",
    title: "BOF Core Operations",
    subtitle: "Run the daily fleet back office with one command center.",
    bullets: [
      "Dispatch readiness and driver assignment support",
      "Compliance document tracking",
      "Load proof, BOL, POD, invoice, and photo evidence",
      "Settlement hold visibility",
      "Claims, RFID, and exception workflows",
      "Command Center alerts and operating scorecards",
    ],
    ctaLabel: "Explore Core Operations",
    href: "/for-hire-carriers",
  },
  {
    tierLabel: "Tier 2",
    title: "BOF HR",
    subtitle: "Keep driver records, credentials, and workforce files aligned.",
    bullets: [
      "Driver profile and HR packet management",
      "CDL, medical card, MVR, W-9, I-9, bank info",
      "Emergency contact forms with primary and secondary contacts",
      "Credential expiration and document readiness",
      "Hiring/onboarding support",
      "BOF Vault integration for driver-controlled document readiness",
    ],
    ctaLabel: "Review HR Readiness",
    href: "/bof-vault",
  },
  {
    tierLabel: "Tier 3",
    title: "BOF Financial",
    subtitle: "Tie operational proof directly to payroll and settlement release.",
    bullets: [
      "Driver settlement and payroll review",
      "Backhaul pay and safety bonus tracking",
      "Deductions, reimbursements, and net pay visibility",
      "Settlement holds tied to missing load proof",
      "Payroll period review and historical trend summaries",
      "Export-ready settlement documentation",
    ],
    ctaLabel: "See Financial Controls",
    href: "/settlements",
  },
] as const;

export function MarketingServiceTiers() {
  return (
    <section className="bof-mkt-service-tiers" aria-labelledby="bof-mkt-service-tiers-heading">
      <div className="bof-mkt-container">
        <header className="bof-mkt-section-header">
          <span className="bof-mkt-service-tiers-eyebrow">BOF Service Tiers</span>
          <h2 id="bof-mkt-service-tiers-heading" className="bof-mkt-title">
            Three service tiers. One operating backbone.
          </h2>
          <p className="bof-mkt-lead">
            Start with core fleet operations, then add HR and financial workflows as your
            back office matures.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((tier) => (
            <article
              key={tier.title}
              className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                {tier.tierLabel}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{tier.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{tier.subtitle}</p>
              <ul className="mt-3 flex-1 space-y-2 text-sm text-slate-700">
                {tier.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className="mt-4 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                {tier.ctaLabel} →
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Most fleets start with BOF Core Operations and add HR or Financial workflows as
          the operating relationship expands.
        </p>
      </div>
    </section>
  );
}
