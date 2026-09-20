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
import { BOF_RUNTIME_LINKS } from "@/lib/marketing-runtime-links";

const audiences = [
  ["Carrier / Private Fleet", "Operate drivers, equipment, loads, compliance, and financial workflows."],
  ["Aggregator / Carrier Network", "Coordinate carrier onboarding, readiness, execution, exceptions, and performance."],
  ["Broker / 3PL", "Connect transportation execution to customer commitments and carrier operations."],
  ["Warehouse / Logistics Business", "Add disciplined transportation infrastructure around existing logistics operations."],
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
            <h2 id="fragmentation-heading">Transportation has more systems than ever. The operating layer is still missing.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">The problem is not that these systems exist. The problem is that someone still has to connect their signals to the next decision.</p>
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
            <h2 id="operating-layer-heading">BOF does not replace every specialized system. It makes them work together.</h2>
            <p>Specialized providers can supply infrastructure for verification, compliance, inspections, telematics, HR, payroll, accounting, ERP, insurance, and other transportation functions. BOF coordinates the operating environment around that infrastructure.</p>
          </div>
          <div className="grid gap-3 text-center md:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 font-bold text-white">Specialized systems</div>
            <div className="flex items-center justify-center text-2xl text-cyan-300" aria-hidden>↓</div>
            <div className="rounded-2xl border border-cyan-300/40 bg-cyan-300/10 p-5 font-bold text-cyan-50">BOF operating layer</div>
            <div className="flex items-center justify-center text-2xl text-cyan-300" aria-hidden>↓</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 font-bold text-white">People, workflows, readiness, proof, exceptions</div>
          </div>
          <p className="mx-auto mt-5 max-w-3xl text-center text-sm font-semibold text-slate-300">One operating environment around the transportation business.</p>
        </div>
      </section>

      <MarketingHomeLifecycle />
      <MarketingHomeCommandPreview />
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
            <h2 id="carrier-network-heading">You may already have the freight. BOF provides the operating infrastructure.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Aggregators, brokers, warehouses, and logistics businesses may already have customers, freight, shipper relationships, warehouse relationships, and access to carriers. BOF provides the operating environment around those relationships.</p>
            <p className="mt-5 text-sm leading-7 text-slate-400">The underlying carrier remains responsible for its own legal and regulatory obligations. BOF coordinates the operating environment; BOF does not become the carrier.</p>
            <Link href="/book-assessment?sector=aggregator" className="mt-6 inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Talk to BOF About a Carrier Network</Link>
          </div>
          <div className="grid gap-3 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 font-bold text-white">Customers / freight</div>
            <div className="text-2xl text-cyan-300" aria-hidden>↓</div>
            <div className="rounded-2xl border border-cyan-300/40 bg-cyan-300/10 p-4 font-bold text-cyan-50">Aggregator / logistics business</div>
            <div className="text-2xl text-cyan-300" aria-hidden>↓</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 font-bold text-white">BOF operating environment</div>
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
          <Link href="/book-assessment" className="mt-8 inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Request a BOF Assessment</Link>
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
          <p className="bof-home-eyebrow">Start with the operating model</p>
          <h2 id="final-cta-heading">Start with the operating model, not another disconnected tool.</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">Tell BOF how your transportation business moves freight, manages people and equipment, handles exceptions, and protects cash flow. We will identify where an operating layer, integration plan, or managed back-office function can create the most leverage.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Request a BOF Assessment</Link>
            <Link href={BOF_RUNTIME_LINKS.dashboard} className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">See BOF in Action</Link>
            <Link href="/founding-fleet" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Founding Fleet</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
