import Link from "next/link";

export type FleetIntelligenceArticle = {
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  category: string;
  date: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
  relatedLinks: Array<{
    label: string;
    href: string;
  }>;
};

export const FLEET_INTELLIGENCE_ARTICLES: FleetIntelligenceArticle[] = [
  {
    slug: "enforcement-engine-trucking-back-office",
    title: "Why Trucking Back Offices Need Enforcement, Not More Dashboards",
    subtitle:
      "The next generation of trucking operations will not be won by better dashboards. It will be won by systems that enforce readiness, proof, accountability, and cash-flow control.",
    summary:
      "Dashboards show what happened. Enforcement engines stop operational drift before it becomes lost revenue, missing proof, or settlement disputes.",
    category: "Enforcement Philosophy",
    date: "May 22, 2026",
    relatedLinks: [
      { label: "Open Operational Overview", href: "/dashboard" },
      { label: "Explore Dispatch Proof Workflow", href: "/dispatch" },
    ],
    sections: [
      {
        heading: "Dashboards show the problem too late",
        paragraphs: [
          "Most back-office tools tell a fleet what already happened: a driver was not ready, a proof packet was late, a settlement was held, or a customer escalated. That visibility is useful, but it is not enough. By the time the issue appears on a dashboard, the operation may already be exposed.",
          "Trucking needs systems that prevent drift before it becomes failure. That means readiness gates, proof requirements, ownership, and release decisions must be part of the workflow itself.",
        ],
      },
      {
        heading: "Enforcement prevents operational drift",
        paragraphs: [
          "An enforcement engine does not simply display a missing document. It blocks the next step, assigns an owner, and keeps the issue attached to the load, driver, settlement, or customer record until it is resolved.",
          "Dispatch, compliance, documents, settlements, safety, and finance cannot operate as disconnected teams if the fleet wants consistent execution. Every workflow needs a gate. Every gate needs an owner. Every owner must be accountable.",
        ],
      },
      {
        heading: "Where BOF fits",
        paragraphs: [
          "BackOfficeFleet is built around that operating principle. The Command Center turns open risk into a priority queue. The Dispatch Proof Workflow shows which loads are blocked, which proof is missing, and which release decisions need attention.",
          "The result is not another dashboard. It is a back-office operating system that helps a fleet enforce the work before the work drifts.",
        ],
      },
    ],
  },
  {
    slug: "proof-packets-settlements-cash-flow",
    title: "Why Proof Packets Control Settlement and Cash Flow",
    subtitle: "In trucking, the difference between revenue earned and revenue collected is often the proof packet.",
    summary:
      "BOLs, PODs, invoices, seal records, accessorials, and claim evidence are not paperwork. They are the controls that determine whether cash moves.",
    category: "Fleet Profitability",
    date: "May 22, 2026",
    relatedLinks: [
      { label: "View Settlements & Factoring", href: "/settlements" },
      { label: "Open Document Vault", href: "/documents" },
    ],
    sections: [
      {
        heading: "Proof is operational currency",
        paragraphs: [
          "A load can be delivered and still fail financially if the proof packet is incomplete. Rate confirmations, BOLs, PODs, invoices, seal records, RFID proof, lumper support, accessorial records, and claim evidence all determine whether billing, factoring, and settlement can move cleanly.",
          "When proof lives in email threads, phone photos, shared drives, and memory, the fleet loses time. The question is no longer whether the load moved. The question becomes whether the back office can prove it moved correctly.",
        ],
      },
      {
        heading: "Missing proof delays money",
        paragraphs: [
          "Settlement holds and factoring delays often begin as small proof gaps: a missing POD, a mismatched seal record, an unresolved accessorial, or claim evidence that is not tied to the load. Those gaps create downstream friction for drivers, finance teams, customers, and insurers.",
          "A serious fleet needs proof requirements to be part of the load lifecycle, not a cleanup task after delivery.",
        ],
      },
      {
        heading: "Where BOF fits",
        paragraphs: [
          "BackOfficeFleet connects dispatch proof to settlement and finance readiness. The proof packet is visible before the load becomes a billing problem, and the settlement view can show exactly what is ready, what is held, and what evidence supports release.",
          "That is how a back office protects cash flow without turning every load into a manual audit.",
        ],
      },
    ],
  },
  {
    slug: "driver-readiness-dispatch-failure",
    title: "How Driver Readiness Prevents Dispatch Failure",
    subtitle: "A truck can be available and a load can be booked, but dispatch still fails if the driver is not ready.",
    summary:
      "A load is not ready if the driver is not ready. Dispatch eligibility depends on documents, safety, maintenance, and proof obligations.",
    category: "Compliance Modernization",
    date: "May 22, 2026",
    relatedLinks: [
      { label: "Review Driver Readiness", href: "/drivers" },
      { label: "Open Operational Overview", href: "/dashboard" },
    ],
    sections: [
      {
        heading: "Readiness is more than availability",
        paragraphs: [
          "A driver may be physically available and still be operationally blocked. CDL status, medical card readiness, MVR posture, policy acknowledgments, open safety events, maintenance defects, and pre-trip requirements all affect whether dispatch should release the load.",
          "Treating driver readiness as an HR filing task creates preventable dispatch failure. The readiness signal belongs in dispatch, safety, compliance, and management views.",
        ],
      },
      {
        heading: "Readiness should gate dispatch",
        paragraphs: [
          "If a driver has an unresolved safety action, expired credential, missing policy acknowledgment, or open equipment defect, the system should surface the issue before the load moves. Pre-trip proof and safety checks reduce risk because they make readiness visible at the moment of dispatch.",
          "The point is not to slow the fleet down. The point is to keep preventable failures from moving into the customer lane.",
        ],
      },
      {
        heading: "Where BOF fits",
        paragraphs: [
          "BackOfficeFleet connects the driver vault, dispatch eligibility, safety events, maintenance status, and command center queue. That lets managers see why a driver is ready, why a driver is blocked, and who owns the next action.",
          "Dispatch readiness becomes a controlled workflow instead of a last-minute scramble.",
        ],
      },
    ],
  },
];

const CATEGORIES = [
  "Enforcement Philosophy",
  "Technology in Trucking",
  "Fleet Profitability",
  "Compliance Modernization",
  "BackOfficeFleet Vision",
] as const;

export function getFleetIntelligenceArticle(slug: string) {
  return FLEET_INTELLIGENCE_ARTICLES.find((article) => article.slug === slug);
}

export function FleetIntelligenceIndexPage() {
  return (
    <main className="bg-slate-50 text-slate-950">
      <section id="blog-hero" className="bg-[#0A1A2F] text-white">
        <div className="bof-mkt-container py-20 md:py-28">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#2F80ED]">Fleet Intelligence</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Fleet Intelligence</h1>
          <p className="mt-5 max-w-3xl text-xl font-semibold text-slate-200">Insights from the Enforcement Engine</p>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            BackOfficeFleet publishes operational intelligence to help fleets modernize their back office, eliminate
            drift, and enforce workflows that protect profitability.
          </p>
        </div>
      </section>

      <section id="featured-articles" className="bof-home-section bof-home-section--white">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Featured Articles</p>
            <h2>Operational thinking for enforcement-driven fleets.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {FLEET_INTELLIGENCE_ARTICLES.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#2F80ED] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F80ED]"
              >
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#2F80ED]">
                  {article.category}
                </span>
                <h3 className="mt-5 text-2xl font-black leading-tight text-[#0A1A2F]">{article.title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">{article.summary}</p>
                <strong className="mt-6 inline-flex text-sm font-black text-[#2F80ED]">Read article -&gt;</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="categories" className="bof-home-section bof-home-section--soft">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Categories</p>
            <h2>Where the enforcement engine shows up.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((category) => (
              <span key={category} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#2E3A45] shadow-sm">
                {category}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="blog-cta" className="bof-home-section bof-home-section--ink">
        <div className="bof-mkt-container rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center md:p-12">
          <h2>Ready to enforce your back office?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Explore the operating system or apply to help shape the Founding Fleet Program.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/founding-fleet" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Apply to Become a Founding Fleet
            </Link>
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              Explore the Demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export function FleetIntelligenceArticlePage({ article }: { article: FleetIntelligenceArticle }) {
  return (
    <main className="bg-white text-slate-950">
      <article>
        <header className="bg-[#0A1A2F] text-white">
          <div className="bof-mkt-container py-16 md:py-24">
            <Link href="/blog" className="text-sm font-bold uppercase tracking-[0.24em] text-[#2F80ED]">
              Fleet Intelligence
            </Link>
            <p className="mt-5 text-sm font-semibold text-slate-300">{article.category} | {article.date}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">{article.title}</h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-200">{article.subtitle}</p>
          </div>
        </header>

        <div className="bof-mkt-container grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="max-w-3xl">
            {article.sections.map((section) => (
              <section key={section.heading} className="border-b border-slate-200 py-8 first:pt-0 last:border-b-0">
                <h2 className="text-3xl font-black tracking-tight text-[#0A1A2F]">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-5 text-lg leading-8 text-[#2E3A45]">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2F80ED]">Related demo workflows</p>
            <div className="mt-5 grid gap-3">
              {article.relatedLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#0A1A2F] transition hover:border-[#2F80ED] hover:text-[#2F80ED]">
                  {link.label}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </article>

      <section className="bof-home-section bof-home-section--ink">
        <div className="bof-mkt-container rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center md:p-12">
          <h2>Turn this thinking into an enforced operating system.</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/founding-fleet" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Apply to Become a Founding Fleet
            </Link>
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              Explore the Demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
