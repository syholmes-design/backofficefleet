"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookDemoLink } from "@/components/BookDemoLink";
import { BofLogo } from "@/components/BofLogo";
import { getSectorLinks } from "@/lib/site-links";

const productNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/command-center", label: "Command Center" },
  { href: "/drivers", label: "Drivers" },
  { href: "/documents", label: "Documents" },
  { href: "/settlements", label: "Settlements" },
  { href: "/safety", label: "Safety" },
  { href: "/dispatch", label: "Dispatch" },
  { href: "/load-requests", label: "Load Requests" },
];

export function BofHeader() {
  const pathname = usePathname();
  const marketingOnlyPaths = new Set([
    "/",
    "/for-hire-carriers",
    "/private-fleets",
    "/government",
    "/bof-vault",
    "/book-assessment",
    "/apply",
    "/fleet-savings",
  ]);
  const marketingOnlyHeader = marketingOnlyPaths.has(pathname);
  const isActiveProductNav = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  if (!marketingOnlyHeader) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="flex w-full max-w-none flex-wrap items-center gap-4 px-6 py-3">
          <Link href="/dashboard" className="mr-2 inline-flex shrink-0 items-center text-slate-100">
            <BofLogo variant="light" size="demoLarge" priority />
          </Link>
          <nav
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2 overflow-x-auto text-sm"
            aria-label="Product demo"
          >
            {productNav.map((item) => {
              const selected = isActiveProductNav(item.href);
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
            {getSectorLinks().map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/bof-vault">BOF Vault</Link>
          </div>
          <div className="bof-global-header-nav-group" aria-label="Demo">
            <Link href="/dashboard" className="bof-global-header-nav-link">Product Demo</Link>
            <Link href="/book-assessment?source=header-marketing">Fleet assessment</Link>
          </div>
          <div className="bof-global-header-ctas">
            <Link href="/apply" className="bof-global-header-cta bof-global-header-cta--primary">
              Become a Founding Member
            </Link>
            <BookDemoLink className="bof-global-header-cta bof-global-header-cta--secondary">
              Book a Demo
            </BookDemoLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
