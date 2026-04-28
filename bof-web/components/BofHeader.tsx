"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BofLogo } from "@/components/BofLogo";

const marketingNav = [
  { href: "/private-fleets", label: "Private Fleets" },
  { href: "/government", label: "Government" },
  { href: "/bof-vault", label: "BOF Vault" },
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
  if (!marketingOnlyHeader) return null;

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
