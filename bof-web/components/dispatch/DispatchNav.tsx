"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  ClipboardList,
  FileInput,
  LayoutGrid,
  Link2,
  UserPlus,
} from "lucide-react";
import type { DispatchNavId } from "@/types/dispatch";

type NavItem = {
  id: DispatchNavId | "intake";
  label: string;
  icon: typeof LayoutGrid;
  href: string;
};

const PRIMARY_ITEMS: NavItem[] = [
  { id: "board", label: "Command Workspace", icon: LayoutGrid, href: "/dispatch" },
  { id: "exceptions", label: "Exception Queue", icon: AlertTriangle, href: "/dispatch?view=exceptions" },
  { id: "load-detail", label: "Load File", icon: ClipboardList, href: "/dispatch?view=load-detail" },
  { id: "assign", label: "Assign Driver & Equipment", icon: UserPlus, href: "/dispatch?view=assign" },
  { id: "settlement", label: "Settlement Release", icon: Banknote, href: "/dispatch?view=settlement" },
];

const SECONDARY_ITEMS: NavItem[] = [
  { id: "intake", label: "Load Intake", icon: FileInput, href: "/dispatch/intake" },
];

function activeItemId(pathname: string, view: string | null): NavItem["id"] {
  if (pathname.startsWith("/dispatch/intake")) return "intake";
  if (pathname !== "/dispatch") return "board";
  if (view === "load-detail" || view === "assign" || view === "exceptions" || view === "settlement") {
    return view;
  }
  return "board";
}

export function DispatchNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const active = activeItemId(pathname, view);

  return (
    <nav
      className="hidden w-56 shrink-0 flex-col gap-0.5 border-r border-slate-800 bg-slate-950/80 p-3 lg:flex"
      aria-label="Dispatch module"
    >
      <div className="mb-3 border-b border-slate-800 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Delta Advanced Trucking
        </p>
        <p className="text-sm font-semibold text-teal-500">Dispatch Control</p>
      </div>
      
      <div className="mb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          Primary
        </p>
        {PRIMARY_ITEMS.map(({ id, label, icon: Icon, href }) => {
          const on = id === active;
          return (
            <Link
              key={id}
              href={href}
              className={[
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                on
                  ? "bg-teal-900/35 text-teal-100 ring-1 ring-teal-600/50"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span className="leading-snug">{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto border-t border-slate-800 pt-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          Secondary
        </p>
        {SECONDARY_ITEMS.map(({ id, label, icon: Icon, href }) => {
          const on = id === active;
          return (
            <Link
              key={id}
              href={href}
              className={[
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors opacity-75",
                on
                  ? "bg-slate-800/50 text-slate-200 ring-1 ring-slate-700/50"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              <span className="leading-snug text-xs">{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto border-t border-slate-800 pt-3 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Link2 className="h-3 w-3" aria-hidden />
          Release packets, proof, route, and settlement
        </span>
      </div>
    </nav>
  );
}
