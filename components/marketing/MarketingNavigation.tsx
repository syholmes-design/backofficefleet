"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MarketingBrandMark } from "@/components/marketing/MarketingBrandMark";
import { BOF_RUNTIME_LINKS } from "@/lib/marketing-runtime-links";

const sectors = [
  ["For-Hire Carriers", "/for-hire-carriers"],
  ["Private Fleets", "/private-fleets"],
  ["Aggregators", "/aggregators"],
  ["Government", "/government"],
] as const;

const whatWeDo = [
  ["What We Do overview", "/what-we-do"],
  ["People & HR", "/what-we-do/people-hr"],
  ["Finance", "/what-we-do/finance"],
  ["Operations & Compliance", "/what-we-do/operations-compliance"],
  ["Procurement & Savings", "/what-we-do/procurement-savings"],
] as const;

const businessOperations = [
  ["Business Operations overview", "/business-operations"],
  ["Driver Onboarding", "/business-operations/driver-onboarding"],
  ["Document & Records Control", "/business-operations/document-records-control"],
  ["Operational Reporting", "/business-operations/operational-reporting"],
  ["Customer Billing", "/business-operations/customer-billing"],
  ["Payroll Administration", "/business-operations/payroll-administration"],
  ["Accounting & Finance", "/business-operations/accounting-finance"],
] as const;

const documents = [
  ["Documents", "/documents"],
  ["Driver Vault", BOF_RUNTIME_LINKS.vault],
  ["BOF Vault", "/bof-vault"],
] as const;

const moreSite = [
  ["Careers", "/careers"],
  ["Team Briefing", "/team-briefing"],
  ["Founding Fleet", "/founding-fleet"],
] as const;

type MenuName = "sectors" | "what-we-do" | "business-operations" | "documents" | "more";
type MenuLink = readonly [string, string];

function MenuLinks({ links, onSelect }: { links: readonly MenuLink[]; onSelect: () => void }) {
  return (
    <div className="absolute left-0 top-full z-50 mt-2 min-w-52 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
      {links.map(([label, href]) => (
        <Link
          key={`${label}-${href}`}
          href={href}
          className="block whitespace-nowrap px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
          onClick={onSelect}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function MarketingNavigation() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return path === "/" ? pathname === "/" : pathname.startsWith(path);
  };

  const toggleMenu = (menu: MenuName) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  const closeMenus = () => setOpenMenu(null);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2 xl:flex-nowrap">
          <Link href="/" className="flex shrink-0 items-center" onClick={closeMenus}>
            <MarketingBrandMark />
          </Link>

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <HeaderLink href="/book-assessment?source=header-marketing" label="Request a BOF Assessment" active={isActive("/book-assessment")} />
            <a
              href={BOF_RUNTIME_LINKS.dashboard}
              className="inline-flex shrink-0 whitespace-nowrap rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              See BOF in Action
            </a>
          </div>

          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Close marketing menu" : "Open marketing menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="p-2 text-gray-700 hover:text-blue-600 xl:hidden"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <div className="hidden w-full flex-wrap items-center gap-x-0.5 gap-y-1 border-t border-gray-100 py-1.5 xl:flex">
          <DesktopMenu label="Sectors" name="sectors" links={sectors} openMenu={openMenu} onToggle={toggleMenu} onSelect={closeMenus} />
          <HeaderLink href="/how-bof-works" label="How BOF Works" active={isActive("/how-bof-works")} />
          <DesktopMenu label="What We Do" name="what-we-do" links={whatWeDo} openMenu={openMenu} onToggle={toggleMenu} onSelect={closeMenus} />
          <DesktopMenu label="Business Operations" name="business-operations" links={businessOperations} openMenu={openMenu} onToggle={toggleMenu} onSelect={closeMenus} />
          <DesktopMenu label="Documents" name="documents" links={documents} openMenu={openMenu} onToggle={toggleMenu} onSelect={closeMenus} />
          <HeaderLink href="/qa" label="Q&A" active={isActive("/qa")} />
          <HeaderLink href="/company" label="Who Are We?" active={isActive("/company")} />
          <HeaderLink href="/blog" label="Insights" active={isActive("/blog")} />
          <DesktopMenu label="More" name="more" links={moreSite} openMenu={openMenu} onToggle={toggleMenu} onSelect={closeMenus} />
        </div>

        {isMobileMenuOpen ? (
          <div className="border-t border-gray-200 py-3 xl:hidden">
            <MobileMenuGroup label="Sectors" links={sectors} onSelect={closeMobileMenu} />
            <MobileMenuGroup label="What We Do" links={whatWeDo} onSelect={closeMobileMenu} />
            <MobileMenuGroup label="Business Operations" links={businessOperations} onSelect={closeMobileMenu} />
            <MobileMenuGroup label="Documents" links={documents} onSelect={closeMobileMenu} />
            <MobileMenuGroup label="More" links={moreSite} onSelect={closeMobileMenu} />
            <div className="grid gap-1 pt-2">
              <MobileLink href="/how-bof-works" label="How BOF Works" onSelect={closeMobileMenu} />
              <MobileLink href="/qa" label="Q&A" onSelect={closeMobileMenu} />
              <MobileLink href="/company" label="Who Are We?" onSelect={closeMobileMenu} />
              <MobileLink href="/blog" label="Insights" onSelect={closeMobileMenu} />
              <MobileLink href="/book-assessment?source=header-marketing" label="Request a BOF Assessment" onSelect={closeMobileMenu} />
              <a href={BOF_RUNTIME_LINKS.dashboard} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white" onClick={closeMobileMenu}>
                See BOF in Action
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

function DesktopMenu({
  label,
  name,
  links,
  openMenu,
  onToggle,
  onSelect,
}: {
  label: string;
  name: MenuName;
  links: readonly MenuLink[];
  openMenu: MenuName | null;
  onToggle: (menu: MenuName) => void;
  onSelect: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={openMenu === name}
        onClick={() => onToggle(name)}
        className="flex items-center whitespace-nowrap px-2 py-2 text-xs font-semibold text-gray-700 hover:text-blue-600"
      >
        {label} <ChevronDown className="ml-1 h-3.5 w-3.5" />
      </button>
      {openMenu === name ? <MenuLinks links={links} onSelect={onSelect} /> : null}
    </div>
  );
}

function HeaderLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`whitespace-nowrap px-2 py-2 text-xs font-semibold ${active ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}>
      {label}
    </Link>
  );
}

function MobileMenuGroup({ label, links, onSelect }: { label: string; links: readonly MenuLink[]; onSelect: () => void }) {
  return (
    <div className="border-b border-gray-100 py-2 last:border-b-0">
      <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      {links.map(([linkLabel, href]) => (
        <Link key={`${linkLabel}-${href}`} href={href} className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600" onClick={onSelect}>
          {linkLabel}
        </Link>
      ))}
    </div>
  );
}

function MobileLink({ href, label, onSelect }: { href: string; label: string; onSelect: () => void }) {
  return (
    <Link href={href} className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600" onClick={onSelect}>
      {label}
    </Link>
  );
}
