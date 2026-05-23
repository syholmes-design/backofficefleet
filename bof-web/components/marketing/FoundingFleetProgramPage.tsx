import Link from "next/link";
import { IconDispatch, IconLoadProof, IconShield } from "@/components/marketing/MarketingHomeIcons";

const BENEFITS = [
  "Locked-in lifetime pricing",
  "Early access to modules",
  "Co-development sessions",
  "Priority onboarding",
  "Operational insights",
  "Dedicated support",
  "Founding Fleet badge",
  "Direct influence on enforcement workflows",
] as const;

const INCLUDED = [
  {
    title: "Manager Portal",
    body: "A command view for operating risk, dispatch readiness, compliance, settlement holds, and cash flow.",
    href: "/portals/manager",
    icon: <IconDispatch />,
  },
  {
    title: "Driver Portal",
    body: "Assignments, readiness, trip documents, settlement review, and controlled driver communication.",
    href: "/portals/driver",
    icon: <IconShield />,
  },
  {
    title: "Customer Portal",
    body: "Shipment visibility, proof, exceptions, and invoice readiness in a customer-safe view.",
    href: "/portals/customer",
    icon: <IconLoadProof />,
  },
  {
    title: "Enforcement Engine",
    body: "Readiness gates, proof requirements, owners, and action queues that stop operational drift.",
    href: "/command-center",
    icon: <IconShield />,
  },
  {
    title: "Company Operations Vault",
    body: "Centralized SOPs, HR records, compliance controls, policies, and audit-ready documents.",
    href: "/documents",
    icon: <IconLoadProof />,
  },
  {
    title: "Fleet Financials",
    body: "Settlement timing, factoring readiness, billing blockers, profitability, and money at risk.",
    href: "/settlements",
    icon: <IconDispatch />,
  },
  {
    title: "Command Center",
    body: "The real-time priority queue for drivers, loads, claims, compliance, and cash exposure.",
    href: "/command-center",
    icon: <IconDispatch />,
  },
] as const;

const QUALIFICATIONS = [
  "20-75 truck fleets",
  "Clear back-office drift pain",
  "Willing to provide product feedback",
  "Ready to modernize workflows",
  "Seeking a durable operational advantage",
  "Serious about compliance, proof, settlements, and cash-flow control",
] as const;

const COMMITMENTS = [
  "3-6 months of structured feedback",
  "Monthly co-development sessions",
  "Real operational usage",
  "Partnership mindset",
  "Willingness to pressure-test dispatch, proof, settlement, finance, safety, and document workflows",
] as const;

export default function FoundingFleetProgramPage() {
  return (
    <main className="bg-slate-50 text-slate-950">
      <section id="ff-hero" className="bg-[#0A1A2F] text-white">
        <div className="bof-mkt-container grid items-center gap-10 py-20 md:py-28 lg:grid-cols-[1fr_0.78fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#2F80ED]">Founding Fleet Program</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Founding Fleet Program</h1>
            <p className="mt-5 text-xl font-semibold leading-8 text-slate-200">
              Join the 10 Fleets Shaping the Future of Back-Office Operations
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              BackOfficeFleet is building an enforcement-driven operating system for trucking - and we are inviting a
              small group of forward-thinking fleets to help shape it.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#ff-apply" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                Apply for Founding Fleet Review
              </Link>
              <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                Explore the Demo
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="rounded-[1.5rem] border border-[#2F80ED]/40 bg-[#0A1A2F] p-8 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#2F80ED]">Founding Fleet</p>
              <p className="mt-5 text-5xl font-black text-white">10</p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Strategic partners</p>
              <div className="mt-8 grid gap-3 text-left">
                {["Release gates", "Proof standards", "Finance workflows", "Operating reports"].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="ff-benefits" className="bof-home-section bof-home-section--white">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="bof-home-eyebrow">Strategic partnership</p>
            <h2>Premium access for serious operators.</h2>
            <p className="mt-5 text-lg leading-8 text-[#2E3A45]">
              Founding Fleet partnerships are intended for serious operators prepared for a premium operating-system
              relationship. Early founding fleet discussions may involve pricing in the $10k-$15k/month range depending
              on fleet size, scope, onboarding, and support requirements.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-bold text-[#0A1A2F] shadow-sm">
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ff-included" className="bof-home-section bof-home-section--soft">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">What is Included</p>
            <h2>The operating system layers Founding Fleets help shape.</h2>
          </div>
          <div className="bof-home-capability-grid">
            {INCLUDED.map((item) => (
              <Link key={item.title} href={item.href} className="bof-home-capability-card">
                <span className="bof-home-capability-card__icon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <strong>Preview workflow -&gt;</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="ff-qualifications" className="bof-home-section bof-home-section--white">
        <div className="bof-mkt-container grid gap-8 lg:grid-cols-2">
          <div>
            <p className="bof-home-eyebrow">Who Qualifies?</p>
            <h2>Fleets with enough complexity to feel the pain and enough urgency to fix it.</h2>
          </div>
          <div className="grid gap-3">
            {QUALIFICATIONS.map((item) => (
              <p key={item} className="rounded-xl border border-slate-200 bg-white p-4 font-semibold text-[#2E3A45] shadow-sm">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section id="ff-commitment" className="bof-home-section bof-home-section--soft">
        <div className="bof-mkt-container grid gap-8 lg:grid-cols-2">
          <div>
            <p className="bof-home-eyebrow">The Commitment</p>
            <h2>A focused partnership, not a commodity software trial.</h2>
          </div>
          <div className="grid gap-3">
            {COMMITMENTS.map((item) => (
              <p key={item} className="rounded-xl border border-slate-200 bg-white p-4 font-semibold text-[#2E3A45] shadow-sm">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section id="ff-apply" className="bof-home-section bof-home-section--white">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="bof-home-eyebrow">Apply Now</p>
            <h2>Request Founding Fleet Review</h2>
            <p className="mt-5 text-lg leading-8 text-[#2E3A45]">
              Share the operating profile your fleet wants BOF to enforce, then use the review with our team to scope the right founding-fleet partnership.
            </p>
          </div>
          <form className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-xl" aria-label="Demo Founding Fleet application form">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Fleet name", "fleetName", "text"],
                ["Contact name", "contactName", "text"],
                ["Email", "email", "email"],
                ["Phone", "phone", "tel"],
                ["Fleet size", "fleetSize", "text"],
                ["Fleet type", "fleetType", "text"],
              ].map(([label, id, type]) => (
                <label key={id} htmlFor={id} className="text-sm font-bold text-[#0A1A2F]">
                  {label}
                  <input id={id} name={id} type={type} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/20" />
                </label>
              ))}
            </div>
            <label htmlFor="problem" className="mt-4 block text-sm font-bold text-[#0A1A2F]">
              Biggest back-office problem
              <textarea id="problem" name="problem" rows={4} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/20" />
            </label>
            <label htmlFor="modules" className="mt-4 block text-sm font-bold text-[#0A1A2F]">
              Modules of interest
              <input id="modules" name="modules" type="text" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/20" />
            </label>
            <label htmlFor="notes" className="mt-4 block text-sm font-bold text-[#0A1A2F]">
              Notes
              <textarea id="notes" name="notes" rows={4} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/20" />
            </label>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                Request Founding Fleet Review
              </button>
              <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                Explore the Demo
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
