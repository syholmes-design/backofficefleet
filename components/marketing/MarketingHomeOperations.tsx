/**
 * WEB-007 homepage sections: services positioning, capabilities, and trip lifecycle.
 */
import Link from "next/link";

const WHY_OUTSOURCE = [
  {
    title: "Centralize work you would otherwise repeat",
    body: "Aggregators and affiliated carriers often run the same recruiting, qualification, dispatch administration, documentation, and settlement tasks in parallel. BOF consolidates that work into shared workflows and controls.",
  },
  {
    title: "Enterprise capability without enterprise overhead",
    body: "Trained back-office staff, standardized processes, and operational tooling support multiple transportation businesses from one service organization—so each network gains depth without building a full internal admin bench.",
  },
  {
    title: "Technology in support of service delivery",
    body: "BOF uses systems to enforce records, route exceptions, and keep proof attached to movements. The principal offering is managed operations—not a software subscription sold on its own.",
  },
] as const;

const BOF_SERVICE_CAPABILITIES = [
  ["Driver recruiting and onboarding", "/business-operations/driver-onboarding"],
  ["Driver qualification and compliance", "/services/drivers/compliance-documents"],
  ["Fleet activation and operational readiness", "/services/fleet"],
  ["Dispatch and load administration", "/services/dispatch"],
  ["Document collection and management", "/services/documents"],
  ["Safety and regulatory administration", "/services/safety"],
  ["Settlement processing", "/services/settlements"],
  ["Payroll and financial administration", "/business-operations/payroll-administration"],
  ["Accounting and bookkeeping support", "/business-operations/accounting-finance"],
  ["Operational exception management", "/business-operations/operational-reporting"],
  ["Customer communications and administrative support", "/customer-portal"],
] as const;

const TRIP_PHASES = [
  {
    phase: "Pre-trip",
    demo: ["See pre-trip load status", "/demo/loads"],
    summary: "People, equipment, and paperwork are ready before freight moves.",
    items: [
      "Driver qualification and credential tracking",
      "Onboarding and document collection",
      "Equipment readiness and activation checks",
      "Dispatch preparation and assignment administration",
    ],
  },
  {
    phase: "In-route",
    demo: ["Open the interactive dispatch board", "/interactive-demo/dispatch"],
    summary: "Coordination and evidence stay connected while the load is active.",
    items: [
      "Operational coordination and status follow-through",
      "Exception management with accountable owners",
      "Documentation and proof collection",
      "Shipment visibility tied to administrative next steps",
    ],
  },
  {
    phase: "Post-trip",
    demo: ["See settlement holds and proof", "/demo/settlements"],
    summary: "Close the movement in finance and reporting—not in scattered inboxes.",
    items: [
      "Proof-of-delivery and packet administration",
      "Settlements, deductions, and pay alignment",
      "Financial processing and reconciliation support",
      "Reporting inputs for network and carrier leadership",
    ],
  },
] as const;

const MODEL_STEPS = [
  { label: "Transportation aggregator or network", detail: "Owns customer relationships, freight access, and carrier affiliations." },
  { label: "Affiliated independent carriers", detail: "Operate equipment and dispatch; remain responsible for their regulatory obligations." },
  { label: "BackOfficeFleet", detail: "Performs centralized back-office operations—recruiting through settlements—using trained staff, workflows, and supporting technology." },
] as const;

export function MarketingHomeValueIntro() {
  return (
    <section id="why-bof" className="bof-home-section bof-home-section--white" aria-labelledby="why-bof-heading">
      <div className="bof-mkt-container">
        <div className="bof-home-section-head bof-home-section-head--wide">
          <p className="bof-home-eyebrow bof-home-eyebrow--ink">What is BackOfficeFleet?</p>
          <h2 id="why-bof-heading">Outsourced back-office operations for transportation businesses.</h2>
          <p>
            BackOfficeFleet is a service organization—not a software vendor. We perform the administrative work
            transportation aggregators and carriers would otherwise staff, duplicate, and reconcile across disconnected
            tools. Technology helps us enforce standards; trained operators deliver the work.
          </p>
        </div>
        <div className="bof-home-why-grid">
          {WHY_OUTSOURCE.map((card) => (
            <article key={card.title} className="bof-home-why-card bof-home-why-card--elevated">
              <strong>{card.title}</strong>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/contact" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
            Contact BOF
          </Link>
          <Link href="/aggregators" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
            Aggregator networks
          </Link>
          <Link href="/how-bof-works" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
            How BOF works
          </Link>
        </div>
      </div>
    </section>
  );
}

export function MarketingHomeCapabilities() {
  return (
    <section id="capabilities" className="bof-home-section bof-home-section--soft" aria-labelledby="capabilities-heading">
      <div className="bof-mkt-container">
        <div className="bof-home-section-head bof-home-section-head--wide">
          <p className="bof-home-eyebrow bof-home-eyebrow--ink">What BOF performs</p>
          <h2 id="capabilities-heading">Comprehensive back-office functions across the transportation lifecycle.</h2>
          <p>
            Scope is agreed with each customer. BOF does not claim every integration or workflow is live for every
            network on day one—we implement and operate against a defined service plan.
          </p>
        </div>
        <ul className="bof-home-capability-grid">
          {BOF_SERVICE_CAPABILITIES.map(([item, href]) => (
            <li key={item}>
              <Link href={href}>{item}</Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function MarketingHomeTripPhases() {
  return (
    <section id="trip-lifecycle" className="bof-home-section bof-home-section--white" aria-labelledby="trip-lifecycle-heading">
      <div className="bof-mkt-container">
        <div className="bof-home-section-head bof-home-section-head--wide">
          <p className="bof-home-eyebrow bof-home-eyebrow--ink">How work is organized</p>
          <h2 id="trip-lifecycle-heading">Pre-trip, in-route, and post-trip administration—under one service team.</h2>
          <p>
            BOF aligns recruiting, compliance, dispatch support, documentation, and financial administration to the
            same movement record so aggregators and carriers are not chasing parallel spreadsheets.
          </p>
        </div>
        <div className="bof-home-trip-phases">
          {TRIP_PHASES.map((block) => (
            <article key={block.phase} className="bof-home-trip-phase">
              <p className="bof-home-trip-phase__label">{block.phase}</p>
              <h3>{block.summary}</h3>
              <ul>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href={block.demo[1]} className="bof-home-trip-phase__demo">
                {block.demo[0]} →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MarketingHomeBusinessModel() {
  return (
    <section id="business-model" className="bof-home-section bof-home-section--soft" aria-labelledby="business-model-heading">
      <div className="bof-mkt-container bof-home-split bof-home-split--balanced">
        <div>
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow bof-home-eyebrow--ink">Who we serve</p>
            <h2 id="business-model-heading">Built for aggregators, their carriers, and fleet operators.</h2>
            <p>
              Primary customers are transportation aggregators and the independent carriers in their networks. BOF also
              supports fleet operators that need the same depth of back-office execution without building it entirely
              in-house.
            </p>
          </div>
          <Link href="/contact" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
            Start a conversation
          </Link>
        </div>
        <ol className="bof-home-model-steps">
          {MODEL_STEPS.map((step, index) => (
            <li key={step.label}>
              <span>{index + 1}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
