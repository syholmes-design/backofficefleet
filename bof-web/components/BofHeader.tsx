"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BofLogo } from "@/components/BofLogo";

const marketingNav = [
  { href: "/private-fleets", label: "Private Fleets" },
  { href: "/government", label: "Government" },
  { href: "/bof-vault", label: "BOF Vault" },
];

const productNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/command-center", label: "Command Center" },
  { href: "/drivers", label: "Drivers" },
  { href: "/documents", label: "Documents" },
  { href: "/settlements", label: "Settlements" },
  { href: "/safety", label: "Safety" },
  { href: "/dispatch", label: "Dispatch" },
];

export function BofHeader() {
  const pathname = usePathname();
  const marketingOnlyPaths = new Set([
    "/",
    "/private-fleets",
    "/government",
    "/bof-vault",
    "/book-assessment",
    "/apply",
    "/fleet-savings",
  ]);
  const marketingOnlyHeader = marketingOnlyPaths.has(pathname);
  if (!marketingOnlyHeader) {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-[80rem] flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/dashboard" className="mr-2 inline-flex items-center text-slate-100">
            <BofLogo variant="light" priority />
          </Link>
          <nav
            className="flex flex-1 flex-wrap items-center gap-1 text-sm"
            aria-label="Product demo"
          >
            {productNav.map((item) => {
              const selected = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-md border px-3 py-1.5 font-medium transition-colors",
                    selected
                      ? "border-teal-700/60 bg-teal-900/30 text-teal-100"
                      : "border-transparent bg-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="bof-global-header">
      <div className="bof-global-header-inner">
        <Link href="/" className="bof-global-header-logo">
          <BofLogo variant="light" priority className="bof-global-header-logo-enhanced" />
        </Link>

        <nav
          className="bof-global-header-nav"
          aria-label="Main"
        >
          <div className="bof-global-header-nav-group" aria-label="Solutions">
            {marketingNav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="bof-global-header-nav-group" aria-label="Demo">
            <Link href="/dashboard" className="bof-global-header-nav-link">Product Demo</Link>
          </div>
          <div className="bof-global-header-ctas">
            <Link href="/apply" className="bof-global-header-cta bof-global-header-cta--primary">
              Become a Founding Member
            </Link>
            <Link href="/book-assessment" className="bof-global-header-cta bof-global-header-cta--secondary">
              Assess Your Fleet
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
