"use client";

import React, { useState, useRef, useEffect } from "react";
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
];

const portalsNav = [
  {
    href: "/portals/manager",
    label: "Owner Portal",
    description: "Executive visibility, operations control, settlements, compliance, and accountability."
  },
  {
    href: "/portals/customer",
    label: "Customer Portal", 
    description: "Shipment visibility, proof of delivery, load documents, and service accountability."
  },
  {
    href: "/portals/driver",
    label: "Driver Portal",
    description: "Assignments, documents, settlement visibility, and readiness."
  }
];

function PortalsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isPortalsActive = pathname.startsWith('/portals');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openDropdown = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const closeDropdown = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={openDropdown}
        onMouseLeave={closeDropdown}
        className={[
          "rounded-lg border px-4 py-2 font-medium transition-all duration-200 flex items-center gap-2 text-sm whitespace-nowrap",
          isPortalsActive
            ? "border-teal-600/50 bg-teal-900/40 text-teal-50 shadow-sm"
            : "border-transparent bg-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 hover:text-white hover:shadow-sm"
        ].join(" ")}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Portals
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-lg"
          style={{ zIndex: 9999 }}
          onMouseEnter={openDropdown}
          onMouseLeave={closeDropdown}
        >
          <div className="py-2">
            {portalsNav.map((portal) => (
              <Link
                key={portal.href}
                href={portal.href}
                className="block px-4 py-3 hover:bg-slate-800 transition-colors duration-200 group"
                onClick={() => setIsOpen(false)}
              >
                <div className="font-medium text-white mb-1 group-hover:text-teal-400 transition-colors duration-200">
                  {portal.label}
                </div>
                <div className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-200">
                  {portal.description}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-6 px-6 py-3.5 sm:px-8 lg:px-12 xl:px-16">
          <Link href="/dashboard" className="inline-flex shrink-0 items-center text-slate-100">
            <BofLogo variant="light" size="demoLarge" priority />
          </Link>
          <nav
            className="flex min-w-0 flex-1 flex-wrap items-center gap-3 overflow-x-auto text-sm"
            aria-label="Product demo"
          >
            {productNav.map((item) => {
              const selected = isActiveProductNav(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-lg border px-4 py-2 font-medium transition-all duration-200",
                    selected
                      ? "border-teal-600/50 bg-teal-900/40 text-teal-50 shadow-sm"
                      : "border-transparent bg-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-800/50 hover:text-white hover:shadow-sm",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
            <PortalsDropdown />
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
            <Link href="/dashboard" className="bof-global-header-nav-link">Product Demo</Link>
            <Link href="/portals" className="bof-global-header-nav-link">Portals</Link>
            <Link href="/book-assessment?source=header-marketing">Fleet Assessment</Link>
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