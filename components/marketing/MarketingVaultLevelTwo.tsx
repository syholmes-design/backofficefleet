import Image from "next/image";
import Link from "next/link";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing";

export type VaultLevelTwoConfig = {
  slug: string;
  domain: string;
  title: string;
  description: string;
  realityTitle: string;
  realityLead: string;
  reality: string[];
  mechanicsTitle: string;
  mechanicsLead: string;
  mechanics: readonly [string, string][];
  lifecycleTitle: string;
  lifecycleLead: string;
  lifecycle: readonly [string, string][];
  workflowsTitle: string;
  workflowsLead: string;
  workflows: readonly {
    title: string;
    starting: string;
    record: string;
    actors: string;
    exception: string;
    ownership: string;
    history: string;
  }[];
  exceptionsTitle: string;
  exceptionsLead: string;
  exceptions: string[];
  continuityTitle: string;
  continuityLead: string;
  continuity: string[];
  consequenceTitle: string;
  consequenceLead: string;
  condition: string;
  consequence: string;
  action: string;
  levelThreeTitle: string;
  levelThreeLead: string;
  levelThree: readonly [string, string][];
  ctaTitle: string;
  ctaLead: string;
};

export function MarketingVaultLevelTwo({ config }: { config: VaultLevelTwoConfig }) {
  const id = (name: string) => `vault-${config.slug}-${name}`;

  return (
    <main className="bof-mkt-root">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image
          src="/assets/images/bofvault.png"
          alt="BOF Vault driver-owned professional record"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/25" />
        <div className="bof-mkt-container relative flex min-h-[26rem] items-end py-14 md:min-h-[34rem] md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">BOF VAULT / {config.domain} / LEVEL 2 DOMAIN</p>
            <h1 className="mt-4 text-4xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">{config.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-100 md:text-2xl">{config.description}</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/assessment/bof-vault" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the BOF Vault assessment</Link>
              <Link href="/bof-vault" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Back to BOF Vault</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="white" ariaLabelledBy={id("reality-heading")}>
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <MarketingSectionHeader titleId={id("reality-heading")} title={config.realityTitle} lead={config.realityLead} />
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            {config.reality.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy={id("mechanics-heading")}>
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId={id("mechanics-heading")} title={config.mechanicsTitle} lead={config.mechanicsLead} />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            {config.mechanics.map(([title, body], index) => <article key={title} className="bg-white p-5"><p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p><h3 className="mt-3 text-xl font-black text-slate-950">{title}</h3><p className="mt-3 text-base leading-7 text-slate-700">{body}</p></article>)}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy={id("lifecycle-heading")}>
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId={id("lifecycle-heading")} title={config.lifecycleTitle} lead={config.lifecycleLead} />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {config.lifecycle.map(([stage, body], index) => <article key={stage} className="bg-white p-5"><p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p><h3 className="mt-3 text-xl font-black text-slate-950">{stage}</h3><p className="mt-3 text-base leading-7 text-slate-700">{body}</p></article>)}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy={id("workflows-heading")}>
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId={id("workflows-heading")} title={config.workflowsTitle} lead={config.workflowsLead} />
          <div className="mt-10 space-y-8">
            {config.workflows.map((workflow, index) => <article key={workflow.title} className="border-t-2 border-slate-300 pt-6"><div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:gap-12"><div><p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700">Workflow 0{index + 1}</p><h3 className="mt-3 text-3xl font-black text-slate-950">{workflow.title}</h3></div><div className="grid gap-5 text-lg leading-8 text-slate-700 md:grid-cols-2"><p><strong className="text-slate-950">Starting condition:</strong> {workflow.starting}</p><p><strong className="text-slate-950">Record involved:</strong> {workflow.record}</p><p><strong className="text-slate-950">Actors:</strong> {workflow.actors}</p><p><strong className="text-slate-950">Exception:</strong> {workflow.exception}</p><p><strong className="text-slate-950">Ownership and resolution:</strong> {workflow.ownership}</p><p><strong className="text-slate-950">Historical consequence:</strong> {workflow.history}</p></div></div></article>)}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy={id("exceptions-heading")}>
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div><p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Exceptions and accountability</p><h2 id={id("exceptions-heading")} className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">{config.exceptionsTitle}</h2><p className="mt-5 text-lg leading-8 text-slate-300">{config.exceptionsLead}</p></div>
          <div className="space-y-5 border-l-2 border-amber-400 pl-6 text-lg leading-8 text-white">{config.exceptions.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy={id("continuity-heading")}>
        <div className="bof-mkt-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <MarketingSectionHeader titleId={id("continuity-heading")} title={config.continuityTitle} lead={config.continuityLead} />
          <div className="space-y-5 text-lg leading-8 text-slate-700">{config.continuity.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy={id("consequence-heading")}>
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId={id("consequence-heading")} title={config.consequenceTitle} lead={config.consequenceLead} />
          <div className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-3"><article className="bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Administrative condition</p><p className="mt-4 text-xl font-black leading-8 text-slate-950">{config.condition}</p></article><article className="bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Professional / employment consequence</p><p className="mt-4 text-xl font-black leading-8 text-slate-950">{config.consequence}</p></article><article className="bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Management action</p><p className="mt-4 text-xl font-black leading-8 text-slate-950">{config.action}</p></article></div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy={id("level-three-heading")}>
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId={id("level-three-heading")} title={config.levelThreeTitle} lead={config.levelThreeLead} />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{config.levelThree.map(([title, body], index) => <article key={title} className="border-l-4 border-amber-400 bg-slate-50 p-6"><p className="text-sm font-black tracking-[0.18em] text-teal-700">0{index + 1}</p><h3 className="mt-3 text-2xl font-black text-slate-950">{title}</h3><p className="mt-3 text-base leading-7 text-slate-700">{body}</p><p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-slate-500">Future Level 3 subject</p></article>)}</div>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy={id("cta-heading")}>
        <div className="bof-mkt-container flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">BOF Vault next step</p><h2 id={id("cta-heading")} className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">{config.ctaTitle}</h2><p className="mt-5 text-lg leading-8 text-slate-300">{config.ctaLead}</p></div><Link href="/assessment/bof-vault" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Take the BOF Vault assessment</Link></div>
      </MarketingSection>
    </main>
  );
}
