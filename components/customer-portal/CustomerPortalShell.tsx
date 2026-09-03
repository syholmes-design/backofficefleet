"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BofLogo } from "@/components/BofLogo";

const NAV = [
  { href: "/customer-portal", label: "Portal Home", n: "01" },
  { href: "/customer-portal/load-intake", label: "Load Intake", n: "02" },
  { href: "/customer-portal/quotes", label: "Quote", n: "03" },
  { href: "/customer-portal/shipments", label: "Active Shipments", n: "04" },
  { href: "/customer-portal/assignment", label: "Assignment", n: "05" },
  { href: "/customer-portal/documents", label: "BOL Packet", n: "06" },
  { href: "/customer-portal/tracking", label: "Tracking", n: "07" },
  { href: "/customer-portal/billing", label: "Billing / Factoring", n: "08" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/customer-portal") return pathname === "/customer-portal" || pathname === "/customer-portal/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CustomerPortalShell({
  railTitle,
  railValue,
  railNote,
  railValueAttr,
  railNoteAttr,
  children,
}: {
  railTitle: string;
  railValue: string;
  railNote: string;
  railValueAttr?: string;
  railNoteAttr?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/customer-portal";

  useEffect(() => {
    document.documentElement.classList.add("portal-nav-ready");
    const runtime = document.createElement("script");
    runtime.src = `/customer-portal/runtime.js?p=${encodeURIComponent(pathname)}`;
    runtime.async = false;
    const nav = document.createElement("script");
    nav.src = `/customer-portal/nav.js?p=${encodeURIComponent(pathname)}`;
    nav.async = false;
    runtime.onload = () => document.body.appendChild(nav);
    document.body.appendChild(runtime);
    return () => {
      runtime.onload = null;
      runtime.remove();
      nav.remove();
      const bound = document.querySelector("[data-customer-portal]");
      if (bound) bound.removeAttribute("data-portal-bound");
    };
  }, [pathname]);

  return (
    <div className="customer-portal-body">
      <main className="customer-portal-shell" data-customer-portal="">
        <aside aria-label="Customer Portal sections" className="portal-rail">
          <Link aria-label="BackOfficeFleet home" className="portal-brand" href="/">
            <BofLogo variant="light" size="demoLarge" priority />
          </Link>
          <button aria-controls="customer-portal-navigation" aria-expanded="false" className="portal-nav-toggle" type="button">
            <span aria-hidden="true" className="portal-nav-toggle__icon" />
            <span>Menu</span>
          </button>
          <nav aria-label="Customer Portal navigation" className="portal-nav" id="customer-portal-navigation">
            {NAV.map((item) => (
              <a key={item.href} className={isActive(pathname, item.href) ? "is-active" : undefined} href={item.href}>
                <span>{item.n}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="portal-rail-card">
            <span>{railTitle}</span>
            <strong {...(railValueAttr ? { "data-portal-text": railValueAttr } : {})}>{railValue}</strong>
            <p {...(railNoteAttr ? { "data-portal-text": railNoteAttr } : {})}>{railNote}</p>
          </div>
        </aside>
        <section className="portal-workspace">{children}</section>
      </main>
    </div>
  );
}
