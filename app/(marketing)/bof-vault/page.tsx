import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "BOF Vault | BackOfficeFleet",
  description: "A driver-centered, portable professional document and credential record.",
};

const levelTwoDomains = [
  ["Documents & Credentials", "The driver&apos;s CDL, medical documentation, MVR, certifications, training records, qualification evidence, employment documentation, and supporting professional credentials."],
  ["Verification & Evidence", "The evidence and review context that help an authorized verifier understand what a document represents and whether further attention is required."],
  ["Qualification Status", "The current administrative picture of what documentation is available, current, incomplete, pending review, or not ready to share."],
  ["Sharing & Employer Transfer", "The controlled handoff by which a driver provides appropriate documentation to an employer without surrendering ownership of the portable record."],
  ["Renewal & Maintenance", "The ongoing work of monitoring dates, replacing records, maintaining current versions, and keeping the professional file useful."],
  ["Record History & Continuity", "The connected history of documents, status changes, reviews, replacements, and employer transitions around the driver."],
  ["Identity & Access", "The relationship between the driver, the professional record, and authorized access to appropriate documentation."],
  ["Exceptions & Resolution", "The visible path for missing, incomplete, expired, questionable, or disputed information and the follow-up needed to resolve it."],
] as const;

export default function BofVaultPage() {
  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image
          src="/assets/images/bofvault.png"
          alt="BOF Vault driver-centered professional record and bank vault background"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/20" />
        <div className="bof-mkt-container relative flex min-h-[30rem] items-center py-12 md:min-h-[38rem] md:py-20">
          <div className="max-w-xl pr-6 lg:max-w-[38rem] lg:pr-10">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-teal-300">BOF VAULT</p>
            <h1 className="mt-5 max-w-[14ch] text-4xl font-black uppercase leading-[0.96] tracking-tight text-white md:text-6xl lg:text-7xl">YOUR PROFESSIONAL RECORD.<br className="hidden md:block" />WHEREVER YOUR CAREER TAKES YOU.</h1>
            <p className="mt-6 max-w-[34rem] text-base leading-7 text-slate-100 md:text-xl md:leading-8">BOF Vault is the driver&apos;s personal, portable professional record. Keep credentials and supporting documents organized, current, and ready to share with the next employer without rebuilding the file each time you move.</p>
            <div className="mt-8"><Link href="/assessment/bof-vault" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">TAKE THE BOF VAULT ASSESSMENT</Link></div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy="vault-driver-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-start"><MarketingSectionHeader titleId="vault-driver-heading" title="The Vault belongs to the driver" lead="BOF Vault is a driver-centered, driver-owned, portable professional document and credential record." /><div className="space-y-6 text-lg leading-8 text-slate-700"><p>The driver should have a personal professional record that remains useful regardless of which employer, fleet, or operating environment comes next. The CDL, medical card, MVR, training records, certifications, qualification evidence, employment-related documentation, identity documentation where appropriate, and other professional credentials should not need to be rebuilt from scattered copies each time a career transition occurs.</p><p>BOF provides administrative support around that record. The driver transfers or uploads documents, BOF organizes them, and review or verification can be recorded where applicable. Missing, expired, incomplete, or questionable documentation can become visible so the driver knows what requires attention before sharing the record.</p><p>The core relationship is driver → BOF Vault → verified professional record → employer. The driver remains the center of the model, while the employer receives appropriate documentation for its own qualification and hiring process.</p></div></div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="vault-distinction-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start"><div><p className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Product distinction</p><h2 id="vault-distinction-heading" className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">BOF Vault is not the Operations File Cabinet</h2></div><div className="grid gap-5 md:grid-cols-2"><article className="border border-slate-200 bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Operations File Cabinet</p><h3 className="mt-3 text-2xl font-black text-slate-950">The organization&apos;s administrative record</h3><p className="mt-4 text-base leading-7 text-slate-700">The File Cabinet organizes records generated by the company&apos;s operation: employees, drivers, assets, loads, work, maintenance, safety, settlements, incidents, exceptions, agreements, and operational documentation.</p></article><article className="border border-teal-700 bg-teal-950 p-6 text-white"><p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">BOF Vault</p><h3 className="mt-3 text-2xl font-black">The driver&apos;s portable professional record</h3><p className="mt-4 text-base leading-7 text-teal-50">The Vault organizes the driver&apos;s credentials, qualification evidence, certifications, medical documentation, training evidence, professional records, verification status, expiration information, and document history.</p></article></div></div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="vault-burden-heading">
        <div className="bof-mkt-container"><MarketingSectionHeader titleId="vault-burden-heading" title="One record, maintained over time" lead="The driver should not have to reconstruct a professional file for every employer or qualification request." /><div className="grid gap-5 md:grid-cols-3"><article className="border border-slate-200 bg-white p-6"><h3 className="text-2xl font-black text-slate-950">Organize</h3><p className="mt-4 text-base leading-7 text-slate-700">Keep the CDL, medical documentation, MVR, certifications, training records, and supporting credentials together in a consistent professional record.</p></article><article className="border border-slate-200 bg-white p-6"><h3 className="text-2xl font-black text-slate-950">Maintain</h3><p className="mt-4 text-base leading-7 text-slate-700">Make missing, expired, incomplete, or questionable documentation visible so the driver knows what requires attention.</p></article><article className="border border-slate-200 bg-white p-6"><h3 className="text-2xl font-black text-slate-950">Share</h3><p className="mt-4 text-base leading-7 text-slate-700">Provide appropriate documentation to a prospective employer for its own qualification process while the driver keeps the portable record.</p></article></div></div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="vault-transfer-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start"><div><p className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Employer transfer</p><h2 id="vault-transfer-heading" className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">The record can move with the driver</h2></div><div className="space-y-6 text-lg leading-8 text-slate-700"><p>A driver should be able to provide appropriate Vault documentation to a prospective or current employer. The employer can receive the information necessary for its own qualification and hiring process without the driver starting from an empty file.</p><p>The Vault does not replace the employer&apos;s legal or regulatory responsibilities. It does not make the employer&apos;s decisions, and it does not independently certify compliance. It makes the driver&apos;s documentation more organized, accessible, reviewable, and portable so the employer can apply its own process to a clearer record.</p><p>The relationship is driver → Vault → review / verification → prospective employer → employer qualification process. The employer receives appropriate evidence; the driver retains a professional record that remains useful after the employment relationship changes.</p></div></div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="vault-exceptions-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start"><div><p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Review, status, and resolution</p><h2 id="vault-exceptions-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">A missing document should become a visible next step</h2><p className="mt-5 text-lg leading-8 text-slate-300">The Vault gives uncertainty an administrative path instead of leaving the driver to discover it during the next hiring or qualification request.</p></div><div className="space-y-6 border-l-2 border-amber-400 pl-6 text-lg leading-8 text-white"><p>When information is missing, incomplete, expired, questionable, or changed, BOF can surface the condition and preserve the relationship from <strong>exception</strong> to <strong>owner</strong> to <strong>action</strong> to <strong>follow-up</strong> to <strong>resolution</strong>.</p><p>Reviewers and authorized verifiers can record appropriate outcomes. The driver can then understand what is current, what requires replacement or renewal, and what may be shared for a prospective employer&apos;s process.</p><p className="border-t border-white/15 pt-6 text-slate-300">The result is administrative support around the driver&apos;s record, not ownership of the driver&apos;s identity and not a claim that BOF is the regulator.</p></div></div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="vault-continuity-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><MarketingSectionHeader titleId="vault-continuity-heading" title="Portability is the point of continuity" lead="A document is more valuable when the driver does not lose its professional context at the moment employment changes." /><div className="space-y-6 text-lg leading-8 text-slate-700"><p>The driver&apos;s employer may change. The fleet may change. The next qualification process may involve a different reviewer and different administrative requirements. The driver&apos;s BOF Vault record remains associated with the driver, preserving the available documents, review context, current status, renewal information, and history around those records.</p><p>That is different from retaining a file in an employer&apos;s Operations File Cabinet. The File Cabinet preserves the organization&apos;s operating records. BOF Vault preserves the driver&apos;s portable professional documentation so the record can continue to support the driver&apos;s career.</p><p>Continuity does not mean every document should be shared everywhere. It means the driver has a maintained source from which appropriate documentation can be provided with context and control.</p></div></div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="vault-domains-heading">
        <div className="bof-mkt-container"><MarketingSectionHeader titleId="vault-domains-heading" title="The future BOF Vault Level 2 domains" lead="These driver-centered domains describe the future architecture. They are presented as concepts only; no Level 2 routes or Level 3 routes are created here." /><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{levelTwoDomains.map(([title, description], index) => { const href = title === "Documents & Credentials" ? "/bof-vault/records-documentation" : title === "Verification & Evidence" ? "/bof-vault/verification-evidence" : title === "Record History & Continuity" ? "/bof-vault/continuity-history" : title === "Exceptions & Resolution" ? "/bof-vault/exceptions-disputes" : title === "Identity & Access" ? "/bof-vault/identity-access" : title === "Qualification Status" ? "/bof-vault/administrative-actions" : undefined; const content = <><p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p><h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3><p className="mt-4 text-base leading-7 text-slate-700">{description}</p><p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Future Level 2 concept</p></>; return href ? <Link key={title} href={href} className="block border border-slate-200 bg-slate-50 p-6">{content}</Link> : <article key={title} className="border border-slate-200 bg-slate-50 p-6">{content}</article>; })}</div></div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="vault-final-heading">
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-end"><div><p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">BOF Vault operating layer</p><h2 id="vault-final-heading" className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">A professional record that stays with the person</h2></div><div className="space-y-6 text-lg leading-8 text-slate-200"><p>BOF Vault connects <strong className="text-white">driver</strong> to <strong className="text-white">document</strong>, document to <strong className="text-white">evidence</strong>, evidence to <strong className="text-white">review</strong>, review to <strong className="text-white">status</strong>, status to <strong className="text-white">renewal</strong>, and the maintained record to appropriate <strong className="text-white">employer sharing</strong>.</p><p>It is not the company&apos;s Operations File Cabinet, an ERP, HR system, payroll system, accounting system, specialized fleet system, or regulatory system. It is the administrative support layer for a driver-owned professional record: organized, reviewable, maintainable, and portable.</p><div className="border-t border-white/15 pt-6"><Link href="/assessment/bof-vault" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">TAKE THE BOF VAULT ASSESSMENT</Link></div></div></div>
      </MarketingSection>
    </main>
  );
}
