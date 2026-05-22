"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/maintenance", label: "Dashboard", exact: true },
  { href: "/maintenance/pm-inspections", label: "PM / Inspections" },
  { href: "/maintenance/repairs", label: "Repair issues" },
  { href: "/maintenance/costs", label: "Costs / vendors" },
];

export function MaintenanceSubnav() {
  const pathname = usePathname();
  return (
    <nav className="maint-subnav" aria-label="Maintenance module">
      {links.map((l) => {
        const active = l.exact
          ? pathname === l.href
          : pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={active ? "maint-subnav-link maint-subnav-link-active" : "maint-subnav-link"}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
