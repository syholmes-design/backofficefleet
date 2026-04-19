"use client";

import Link from "next/link";
import { BofLogo } from "@/components/BofLogo";

const marketingNav = [
  { href: "/for-hire-carriers", label: "For-Hire Carriers" },
  { href: "/private-fleets", label: "Private Fleets" },
  { href: "/government", label: "Government" },
  { href: "/bof-vault", label: "BOF Vault" },
];

const productNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/command-center", label: "Command Center" },
  { href: "/drivers", label: "Drivers" },
  { href: "/source-of-truth", label: "Source of Truth" },
  { href: "/documents", label: "Documents" },
  { href: "/safety", label: "Safety" },
  { href: "/dispatch", label: "Dispatch" },
  { href: "/load-requirements", label: "Load intake" },
  { href: "/loads", label: "Loads" },
  { href: "/rf-actions", label: "RF Actions" },
  { href: "/settlements", label: "Settlements" },
  { href: "/money-at-risk", label: "Money at Risk" },
];

export function BofHeader() {
  return (
    <header className="bof-global-header">
      <div className="bof-global-header-inner">
        <Link href="/" className="bof-global-header-logo">
          <BofLogo variant="light" priority />
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
          <span className="bof-global-header-sep" aria-hidden="true" />
          <div className="bof-global-header-nav-group" aria-label="Product demo">
            {productNav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <Link href="/book-assessment" className="bof-global-header-cta">
            Book Assessment
          </Link>
        </nav>
      </div>
    </header>
  );
}
