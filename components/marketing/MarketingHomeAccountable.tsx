import Image from "next/image";
import Link from "next/link";
import { IconDispatch, IconLoadProof, IconShield } from "@/components/marketing/MarketingHomeIcons";

const CORE_OPERATIONS = [
  { title: "Driver Readiness", href: "/drivers", description: "Qualifications and documents ready before the driver is released.", icon: <IconShield />, preview: [["Driver", "Driver Record"], ["Medical card", "Current"], ["MVR", "Reviewed"], ["Readiness", "Ready"]] },
  { title: "Dispatch", href: "/dispatch", description: "Release decisions with the operating context attached.", icon: <IconDispatch />, preview: [["Load", "Load Record"], ["Driver", "Assigned Driver"], ["Route", "Route Details"], ["Release", "Ready"]] },
  { title: "File Cabinet", href: "/documents", description: "A structured home for the records behind the work.", icon: <IconLoadProof />, preview: [["Record", "Operating Packet"], ["Proof", "Files Attached"], ["Version", "Current"], ["Status", "Reviewable"]] },
  { title: "Safety & Compliance", href: "/safety", description: "Turn safety events and credential gaps into owned follow-through.", icon: <IconShield />, preview: [["Event", "Safety Event"], ["Severity", "Review"], ["Owner", "Assigned Owner"], ["Next action", "Assigned"]] },
  { title: "Settlements", href: "/settlements", description: "Close the load with proof, deductions, holds, and payment context.", icon: <IconLoadProof />, preview: [["Driver", "Driver Record"], ["Gross", "Settlement Total"], ["Deductions", "Deductions"], ["Payment", "Ready"]] },
  { title: "Exception Management", href: "/rf-actions", description: "Make the blocker, owner, consequence, and next action visible.", icon: <IconDispatch />, preview: [["Exception", "Open Exception"], ["Owner", "Assigned Owner"], ["Consequence", "Review Required"], ["Status", "Open"]] },
] as const;

const WORKFLOW = [
  ["Readiness", "/drivers"],
  ["Dispatch", "/dispatch"],
  ["Delivery", "/loads"],
  ["Proof", "/documents"],
  ["Exceptions", "/rf-actions"],
  ["Settlement", "/settlements"],
] as const;

export default function MarketingHomeAccountable() {
  return (
    <main className="bof-home-redesign bg-slate-50 text-slate-950">
      <section id="hero" className="bof-home-hero" aria-labelledby="bof-mkt-hero-heading">
        <Image src="/approved/bofhero.png" alt="Professional truck driver operating on the road at sunrise" fill priority sizes="100vw" className="bof-home-hero__image" />
        <div className="bof-home-hero__overlay" aria-hidden />
        <div className="bof-mkt-container bof-home-hero__content">
          <div className="bof-home-hero__copy">
            <p className="bof-home-eyebrow">Back-office operations for growing trucking companies</p>
            <h1 id="bof-mkt-hero-heading">The Operating System Behind Your Fleet.</h1>
            <p className="bof-home-hero__lead">BOF is the unified operating record connecting readiness, dispatch, proof, safety, compliance, settlements, and financial control.</p>
            <div className="bof-home-hero__ctas" aria-label="Primary actions">
              <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link>
              <Link href="/dispatch" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Explore the Operating System</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="keep-dispatch" className="bof-home-section bof-home-section--white" aria-labelledby="bof-home-dispatch-heading">
        <div className="bof-mkt-container grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div><p className="bof-home-eyebrow">The BOF operating model</p><h2 id="bof-home-dispatch-heading">KEEP DISPATCH.<br />OUTSOURCE THE BACK OFFICE.</h2></div>
          <p className="text-lg leading-8 text-slate-600">As your fleet grows, the work behind the trucks grows with it. BOF can take responsibility for the back-office work that would otherwise require additional internal staff. You keep control of your fleet and dispatch. BOF becomes the back office.</p>
        </div>
      </section>

      <section id="core-operations" className="bof-home-section bof-home-section--white" aria-labelledby="bof-home-operations-heading">
        <div className="bof-mkt-container"><div className="bof-home-section-head"><p className="bof-home-eyebrow">Core Operations</p><h2 id="bof-home-operations-heading">The back-office work that keeps the fleet moving.</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{CORE_OPERATIONS.map((operation) => <Link key={operation.title} href={operation.href} className="bof-home-operation-card"><div className="bof-home-operation-card__preview" aria-label={`${operation.title} control preview`}><div className="bof-home-operation-card__preview-bar"><span>BOF control</span><strong>Active record</strong></div>{operation.preview.map(([label, value]) => <div key={label} className="bof-home-operation-card__preview-row"><span>{label}</span><strong>{value}</strong></div>)}</div><div className="bof-home-operation-card__body"><span className="bof-home-operation-card__icon">{operation.icon}</span><h3>{operation.title}</h3><p>{operation.description}</p><strong>View Workflow &rarr;</strong></div></Link>)}</div></div>
      </section>

      <section id="workflow" className="bof-home-section bof-home-section--soft" aria-labelledby="bof-home-workflow-heading">
        <div className="bof-mkt-container"><div className="bof-home-section-head"><p className="bof-home-eyebrow">How BOF Connects the Operation</p><h2 id="bof-home-workflow-heading">Readiness to settlement, without the gaps in between.</h2><p>BOF connects the records, people, deadlines, and actions that keep the fleet moving.</p></div><div className="bof-home-timeline">{WORKFLOW.map(([label, href], index) => <div key={label} className="bof-home-timeline__item"><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><Link href={href}>View Workflow &rarr;</Link>{index < WORKFLOW.length - 1 ? <i aria-hidden>&rarr;</i> : null}</div>)}</div></div>
      </section>

      <section id="final-cta" className="bof-home-section bof-home-section--ink" aria-labelledby="bof-mkt-final-cta-heading"><div className="bof-mkt-container text-center"><p className="bof-home-eyebrow">BackOfficeFleet</p><h2 id="bof-mkt-final-cta-heading">Ready to see BOF in action?</h2><Link href="/dashboard" className="mt-8 inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">See BOF in Action</Link></div></section>
    </main>
  );
}
