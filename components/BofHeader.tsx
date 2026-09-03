"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BofLogo } from "@/components/BofLogo";
import { DemoWalkthroughRibbon } from "@/components/DemoWalkthroughRibbon";

const productNav = [
  { href: "/dispatch", label: "Dispatch" },
  { href: "/loads", label: "Loads" },
  { href: "/drivers", label: "Drivers" },
  { href: "/documents", label: "Documents" },
  { href: "/operational-chat", label: "Conversations" },
  { href: "/rf-actions", label: "RF Actions" },
] as const;

const sectorLinks = [
  ["For-Hire Carriers", "/for-hire-carriers"],
  ["Private Fleets", "/private-fleets"],
  ["Aggregators", "/aggregators"],
  ["Government", "/government"],
] as const;

const serviceGroups = [
  { title: "People & HR", items: ["Recruiting", "Onboarding", "Driver Records", "Performance Management", "Training & Development", "Benefits Administration"], href: "/what-we-do/people-hr" },
  { title: "Finance", items: ["Payroll", "Cash Management", "Excise Taxes", "Invoicing", "Factoring", "Financial Administration"], href: "/what-we-do/finance" },
  { title: "Operations & Compliance", items: ["Driver Qualification", "Credentials", "Safety", "Compliance", "Maintenance Administration", "Settlements", "Exception Management"], href: "/what-we-do/operations-compliance" },
  { title: "Procurement & Savings", items: ["Fuel Discounts", "Supply Chain", "Discount Pricing", "Vendor Programs", "Purchasing", "Cost Management"], href: "/what-we-do/procurement-savings" },
] as const;

function MarketingMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bof-global-header-menu">
      <button type="button" className="bof-global-header-menu-trigger" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        {label} <span aria-hidden>{open ? "↑" : "↓"}</span>
      </button>
      {open ? <div className="bof-global-header-mega-menu">{children}</div> : null}
    </div>
  );
}

export function BofHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (pathname.startsWith("/customer-portal")) return null;
  const marketingOnlyHeader = ["/", "/for-hire-carriers", "/private-fleets", "/government", "/company", "/aggregators", "/qa", "/bof-vault", "/how-bof-works", "/team-briefing", "/recruiting", "/careers", "/business-operations", "/fleet-savings", "/book-assessment", "/assessment", "/apply", "/investors", "/blog", "/contact", "/product", "/driver-experience", "/fleet-operations", "/founding-fleet", "/what-we-do", "/what-we-do/people-hr", "/what-we-do/finance", "/what-we-do/operations-compliance", "/what-we-do/procurement-savings"].some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isActiveProductNav = (href: string) => {
    if (!mounted) return false;
    if (href === "/dispatch") return pathname === "/dispatch" || pathname.startsWith("/dispatch/") || pathname.startsWith("/pretrip/") || pathname.startsWith("/trip-release/");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (!marketingOnlyHeader) {
    return (
      <header className="bof-product-header sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950 shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start gap-3 px-4 py-3 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-12 xl:px-16">
          <Link href="/dispatch" className="inline-flex shrink-0 items-center text-slate-100 no-underline"><BofLogo variant="dark" size="demoLarge" priority /></Link>
          <nav className="bof-product-nav flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1 text-sm lg:flex-1 lg:flex-wrap lg:gap-3 lg:pb-0" aria-label="Authenticated application">
            {productNav.map((item) => <Link key={item.href} href={item.href} className={["shrink-0 rounded-lg border px-4 py-2 font-medium no-underline transition-all duration-200", isActiveProductNav(item.href) ? "border-teal-600/50 bg-teal-900/40 text-teal-50 shadow-sm" : "border-transparent bg-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 hover:text-white"].join(" ")}>{item.label}</Link>)}
          </nav>
        </div>
        <DemoWalkthroughRibbon />
      </header>
    );
  }

  return (
    <header className="bof-global-header">
      <div className="bof-global-header-inner">
        <Link href="/" className="bof-global-header-logo"><BofLogo variant="light" size="demoLarge" priority className="bof-global-header-logo-enhanced" /></Link>
        <nav className="bof-global-header-nav" aria-label="Main">
          <div className="bof-global-header-nav-group" aria-label="Primary site navigation">
            <MarketingMenu label="SECTORS">
              <div className="bof-global-header-menu-grid bof-global-header-menu-grid--sectors">
                {sectorLinks.map(([label, href]) => <Link key={label} href={href}><strong>{label}</strong><span>Explore BOF for {label.toLowerCase()}.</span></Link>)}
              </div>
            </MarketingMenu>
            <MarketingMenu label="WHAT WE DO">
              <div className="bof-global-header-menu-grid">
                {serviceGroups.map((group) => <div key={group.title}><Link href={group.href}><p>{group.title}</p></Link>{group.items.map((item) => <span key={item}>{item}</span>)}</div>)}
              </div>
            </MarketingMenu>
            <Link href="/how-bof-works">HOW BOF WORKS</Link>
            <Link href="/team-briefing">TEAM BRIEFING</Link>
            <Link href="/recruiting">RECRUITING</Link>
            <Link href="/bof-vault">BOF VAULT</Link>
            <Link href="/business-operations">BUSINESS OPERATIONS</Link>
            <Link href="/documents">DOCUMENTS</Link>
            <Link href="/qa">Q&amp;A</Link>
            <Link href="/blog">INSIGHTS</Link>
            <Link href="/company">WHO ARE WE?</Link>
            <Link href="/book-assessment?source=header-marketing">ASSESSMENT</Link>
          </div>
          <div className="bof-global-header-ctas"><Link href="/dashboard" className="bof-global-header-cta bof-global-header-cta--primary">SEE BOF IN ACTION</Link></div>
        </nav>
      </div>
    </header>
  );
}
