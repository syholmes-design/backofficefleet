import Link from "next/link";

const items = [
  { href: "/business-operations", label: "Overview" },
  { href: "/business-operations/driver-onboarding", label: "Driver Onboarding" },
  { href: "/business-operations/document-records-control", label: "Document & Records Control" },
  { href: "/business-operations/operational-reporting", label: "Operational Reporting" },
  { href: "/business-operations/customer-billing", label: "Customer Billing" },
  { href: "/business-operations/payroll-administration", label: "Payroll Administration" },
  { href: "/business-operations/accounting-finance", label: "Accounting & Finance" },
] as const;

export function BusinessOperationsSectionNav({ activeHref }: { activeHref: string }) {
  return (
    <nav aria-label="Business Operations section navigation" className="border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
        {items.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-teal-700 bg-teal-700 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
