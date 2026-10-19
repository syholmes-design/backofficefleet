/**
 * BOF Shared Component:
 * Used by: / (via app/(marketing)/page.tsx)
 * Do not edit for one page unless props/page-specific overrides are used.
 * See docs/BOF_ROUTE_MAP.md.
 */
import Link from "next/link";
import {
  MarketingHomeCommandPreview,
  MarketingHomeHeroExperience,
  MarketingHomeLifecycle,
  MarketingHomeWorkflowCards,
} from "@/components/marketing/MarketingHomeExperience";
import {
  MarketingHomeBusinessModel,
  MarketingHomeCapabilities,
  MarketingHomeTripPhases,
  MarketingHomeValueIntro,
} from "@/components/marketing/MarketingHomeOperations";
import { MarketingServiceModel } from "@/components/marketing/MarketingServiceModel";
import { FleetAssessmentWizardClient } from "@/components/marketing/funnel/FleetAssessmentWizardClient";
import { FleetSavingsCalculatorClient } from "@/components/marketing/funnel/FleetSavingsCalculatorClient";
import { SERVICE_PILLARS } from "@/lib/marketing-service-pillars";

const audiences = [
  ["Aggregator / carrier network", "Centralize back-office execution across affiliated carriers without rebuilding admin in every entity."],
  ["Affiliated independent carrier", "Stay focused on dispatch and equipment while BOF administers qualification, documentation, and settlements support."],
  ["Private fleet operator", "Add disciplined recruiting, compliance, dispatch administration, and financial processing without enterprise headcount."],
  ["Broker / 3PL with carrier relationships", "Align carrier operations to customer commitments with shared back-office infrastructure."],
] as const;

const providerCategories = [
  "Driver verification", "Compliance", "DQF", "Inspections", "Telematics / ELD", "HR / Payroll",
  "Accounting / ERP", "Insurance / Risk", "Dispatch", "Documentation", "Settlements",
] as const;

const exceptionRows = [
  ["Missing POD", "Settlement hold", "Document owner assigned"],
  ["Expired insurance", "Assignment restriction", "Carrier packet review"],
  ["Equipment defect", "Trip release blocked", "Maintenance review"],
  ["Carrier packet gap", "Assignment restricted", "Packet owner assigned"],
] as const;

const managedServices = [
  "HR / onboarding administration", "Driver qualification workflows", "Compliance administration",
  "Carrier onboarding", "Safety workflow support", "Maintenance monitoring", "Documentation / proof administration",
  "Settlement administration", "Financial workflow coordination", "Exception management", "Operational support",
] as const;

export default function MarketingHomeAccountable() {
  return (
    <main className="bof-home-redesign bg-slate-50 text-slate-950">
      <MarketingHomeHeroExperience />
      <MarketingHomeValueIntro />
      <MarketingHomeCapabilities />
      <MarketingHomeTripPhases />
      <MarketingHomeBusinessModel />
      <MarketingServiceModel />

      <section id="what-we-do" className="bof-home-section bof-home-section--white" aria-labelledby="what-we-do-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Service pillars</p>
            <h2 id="what-we-do-heading">Managed operations across compliance, finance, people, and procurement.</h2>
            <p>BOF connects the systems a customer already uses and performs the administrative work around readiness, proof, settlements, and exceptions. Scope varies by engagement; we do not imply every pillar is fully live for every network on day one.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {SERVICE_PILLARS.map((pillar) => (
              <article key={pillar.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-bold text-slate-950">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{pillar.description}</p>
                <Link href={pillar.href} className="mt-4 inline-flex text-sm font-bold text-cyan-700">
                  Open {pillar.title}
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/what-we-do" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Full operating model</Link>
            <Link href="/how-bof-works" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">How BOF works</Link>
            <Link href="/aggregators" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Aggregator networks</Link>
            <Link href="/contact" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Contact BOF</Link>
            <Link href="/qa" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Questions</Link>
          </div>
        </div>
      </section>

      <section id="we-save-you-money" className="bof-home-section bof-home-section--soft" aria-labelledby="savings-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">We save you money</p>
            <h2 id="savings-heading">Estimate operating drag from your own assumptions.</h2>
            <p>Change the fleet size, load volume, and pain levels. The result is a directional model of insurance posture, dispute exposure, revenue at risk, and settlement drag. It is an estimate, not a verified customer outcome and not a savings guarantee.</p>
          </div>
          <FleetSavingsCalculatorClient embedded />
        </div>
      </section>

      <section id="assess-the-operation" className="bof-home-section bof-home-section--white" aria-labelledby="assess-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Assess the operation</p>
            <h2 id="assess-heading">Walk the operation and keep the answers in this browser.</h2>
            <p>The assessment validates each step and shows a completion summary. There is no verified public intake service on this site, so the answers are stored in this browser and are not sent to BOF. Use the summary with your BOF contact, or continue to the qualification page.</p>
          </div>
          <FleetAssessmentWizardClient embedded />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Take the Assessment
            </Link>
          </div>
        </div>
      </section>

      <MarketingHomeCommandPreview />

      <section id="who-bof-serves" className="bof-home-section bof-home-section--white" aria-labelledby="who-bof-serves-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Who BOF serves</p>
            <h2 id="who-bof-serves-heading">Built for businesses that move, manage, or coordinate transportation</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {audiences.map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3>{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="fragmentation" className="bof-home-section bof-home-section--soft" aria-labelledby="fragmentation-heading">
        <div className="bof-mkt-container grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="bof-home-eyebrow">The fragmentation problem</p>
            <h2 id="fragmentation-heading">Specialized tools multiply. Back-office work still needs owners.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">The problem is rarely a missing login—it is the recruiting, qualification, documentation, settlement, and exception work that must happen between systems, every day, for every carrier.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {providerCategories.map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="operating-layer" className="bof-home-section bof-home-section--ink" aria-labelledby="operating-layer-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">BOF vs specialized providers</p>
            <h2 id="operating-layer-heading">BOF does not replace every specialized provider. We operate the back office around them.</h2>
            <p>Verification, compliance, inspections, telematics, HR, payroll, accounting, ERP, insurance, and dispatch platforms each have a role. BOF supplies trained administrators, workflows, and controls so those signals become completed back-office work.</p>
          </div>
          <div className="grid gap-3 text-center md:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 font-bold text-white">Specialized systems</div>
            <div className="flex items-center justify-center text-2xl text-cyan-300" aria-hidden>↓</div>
            <div className="rounded-2xl border border-cyan-300/40 bg-cyan-300/10 p-5 font-bold text-cyan-50">BOF managed back office</div>
            <div className="flex items-center justify-center text-2xl text-cyan-300" aria-hidden>↓</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 font-bold text-white">People, workflows, readiness, proof, exceptions</div>
          </div>
          <p className="mx-auto mt-5 max-w-3xl text-center text-sm font-semibold text-slate-300">One service team accountable for back-office execution.</p>
        </div>
      </section>

      <MarketingHomeLifecycle />
      <MarketingHomeWorkflowCards />

      <section id="exceptions" className="bof-home-section bof-home-section--white" aria-labelledby="exceptions-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Exception management</p>
            <h2 id="exceptions-heading">Exceptions should trigger action, not an inbox search.</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="min-w-[680px] grid grid-cols-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              <span>Issue</span><span>Consequence</span><span>Owner action</span>
            </div>
            {exceptionRows.map(([issue, consequence, action]) => (
              <div key={issue} className="min-w-[680px] grid grid-cols-3 gap-4 border-b border-slate-100 px-5 py-4 text-sm last:border-b-0">
                <span className="font-bold text-slate-950">{issue}</span>
                <span className="text-slate-600">{consequence}</span>
                <span className="font-semibold text-cyan-700">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="carrier-network" className="bof-home-section bof-home-section--ink" aria-labelledby="carrier-network-heading">
        <div className="bof-mkt-container grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="bof-home-eyebrow">Aggregator / carrier network</p>
            <h2 id="carrier-network-heading">You may already have the freight. BOF provides the back-office capacity.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Aggregators and logistics businesses often already have customers, freight, and carrier relationships. BOF performs the recruiting, qualification, documentation, dispatch administration, and settlement support those networks would otherwise build internally—at scale across affiliates.</p>
            <p className="mt-5 text-sm leading-7 text-slate-400">The underlying carrier remains responsible for its own legal and regulatory obligations. BOF coordinates the operating environment; BOF does not become the carrier.</p>
            <Link href="/contact" className="mt-6 inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Talk to BOF about a carrier network</Link>
          </div>
          <div className="grid gap-3 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 font-bold text-white">Customers / freight</div>
            <div className="text-2xl text-cyan-300" aria-hidden>↓</div>
            <div className="rounded-2xl border border-cyan-300/40 bg-cyan-300/10 p-4 font-bold text-cyan-50">Aggregator / logistics business</div>
            <div className="text-2xl text-cyan-300" aria-hidden>↓</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 font-bold text-white">BOF back-office operations</div>
            <div className="text-2xl text-cyan-300" aria-hidden>↓</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 font-bold text-white">Independent carriers / specialized providers</div>
          </div>
        </div>
      </section>

      <section id="managed-support" className="bof-home-section bof-home-section--soft" aria-labelledby="managed-support-heading">
        <div className="bof-mkt-container grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="bof-home-eyebrow">Managed back-office support</p>
            <h2 id="managed-support-heading">Technology-enabled back-office support when your team needs more operating capacity</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">BOF can support platform access, implementation, workflow configuration, and managed operational functions without becoming the carrier, employer, insurer, law firm, accounting certification provider, or regulatory authority.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {managedServices.map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="deployment" className="bof-home-section bof-home-section--white" aria-labelledby="deployment-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Deployment</p>
            <h2 id="deployment-heading">Deploy an operating environment without building the entire technology stack yourself.</h2>
            <p>BOF can be deployed around the systems a customer already uses or the specialized infrastructure it selects. The objective is one operating environment around the stack that fits the business.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {["Assess", "Configure", "Connect", "Operate"].map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">0{index + 1}</span>
                <h3 className="mt-3">{step}</h3>
              </div>
            ))}
          </div>
          <Link href="/assessment" className="mt-8 inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the Assessment</Link>
        </div>
      </section>

      <section id="fleet-intelligence" className="bof-home-section bof-home-section--soft" aria-labelledby="fleet-intelligence-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Fleet Intelligence</p>
            <h2 id="fleet-intelligence-heading">A late delivery should never be a surprise.</h2>
            <p>GPS tells you where the truck is. BOF tells you what that means for the operation—and what needs to happen next.</p>
          </div>
          <Link href="/blog/late-delivery-should-never-be-a-surprise" className="inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
            Read the article
          </Link>
        </div>
      </section>

      <section id="final-cta" className="bof-home-section bof-home-section--ink" aria-labelledby="final-cta-heading">
        <div className="bof-mkt-container text-center">
          <p className="bof-home-eyebrow">Next step</p>
          <h2 id="final-cta-heading">Tell BOF about your network, carriers, and back-office pressure.</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">Use the contact inquiry form to describe your operation. BOF routes qualified requests through the same intake workflow used for customer inquiries—no separate lead form.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/contact" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Contact BOF</Link>
            <Link href="/assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Take the Assessment</Link>
            <Link href="/aggregators" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Aggregator overview</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
