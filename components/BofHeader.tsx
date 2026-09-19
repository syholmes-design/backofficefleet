"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BofLogo } from "@/components/BofLogo";
import { DemoWalkthroughRibbon } from "@/components/DemoWalkthroughRibbon";
import { ExistingDocumentNavAnchor } from "@/components/ExistingDocumentNavAnchor";
import { MarketingNavigation } from "@/components/marketing/MarketingNavigation";

const productNav = [
  { href: "/command-center", label: "Command Center" },
  { href: "/dispatch", label: "Dispatch" },
  { href: "/loads", label: "Loads" },
  { href: "/drivers", label: "Drivers" },
  { href: "/recruiting", label: "Recruiting" },
  { href: "/documents", label: "Documents" },
  { href: "/operational-chat", label: "Conversations" },
  { href: "/rf-actions", label: "RF Actions" },
] as const;

export function BofHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [navAriaLabel, setNavAriaLabel] = useState("Operator application");
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const userId =
          payload && typeof payload === "object" && payload.user && typeof payload.user === "object"
            ? (payload.user as { id?: unknown }).id
            : undefined;
        setNavAriaLabel(
          typeof userId === "string" && userId.trim()
            ? "Authenticated application"
            : "Operator application (session not established)",
        );
      })
      .catch(() => {
        if (!cancelled) setNavAriaLabel("Operator application (session not established)");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  if (
    pathname.startsWith("/customer-portal") ||
    pathname === "/customers" ||
    pathname.startsWith("/portals/customer")
  ) {
    return null;
  }
  const marketingOnlyHeader = ["/", "/for-hire-carriers", "/private-fleets", "/government", "/company", "/aggregators", "/qa", "/bof-vault", "/how-bof-works", "/team-briefing", "/careers", "/business-operations", "/fleet-savings", "/book-assessment", "/assessment", "/apply", "/investors", "/blog", "/contact", "/product", "/driver-experience", "/fleet-operations", "/founding-fleet", "/what-we-do", "/what-we-do/people-hr", "/what-we-do/finance", "/what-we-do/operations-compliance", "/what-we-do/procurement-savings"].some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isActiveProductNav = (href: string) => {
    if (!mounted) return false;
    if (href === "/dispatch") return pathname === "/dispatch" || pathname.startsWith("/dispatch/") || pathname.startsWith("/pretrip/") || pathname.startsWith("/trip-release/");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (!marketingOnlyHeader) {
    return (
      <header className="bof-product-header sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950 shadow-sm isolate">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start gap-3 px-4 py-3 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-12 xl:px-16">
          <ExistingDocumentNavAnchor href="/dispatch" className="inline-flex shrink-0 items-center text-slate-100 no-underline"><BofLogo variant="dark" size="demoLarge" priority /></ExistingDocumentNavAnchor>
          <nav className="bof-product-nav flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1 text-sm lg:flex-1 lg:flex-wrap lg:gap-3 lg:pb-0" aria-label={navAriaLabel}>
            {productNav.map((item) => (
              <ExistingDocumentNavAnchor
                key={item.href}
                href={item.href}
                className={["shrink-0 rounded-lg border px-4 py-2 font-medium no-underline transition-all duration-200", isActiveProductNav(item.href) ? "border-teal-600/50 bg-teal-900/40 text-teal-50 shadow-sm" : "border-transparent bg-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 hover:text-white"].join(" ")}
              >
                {item.label}
              </ExistingDocumentNavAnchor>
            ))}
          </nav>
        </div>
        <DemoWalkthroughRibbon />
      </header>
    );
  }

  return <MarketingNavigation />;
}
