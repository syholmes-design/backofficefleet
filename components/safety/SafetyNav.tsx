"use client";

import {
  AlertTriangle,
  CalendarClock,
  ExternalLink,
  LayoutDashboard,
  Shield,
  UserCircle,
} from "lucide-react";
import { BOF_SAFETY_PROFILE_DASHBOARD_HTML } from "@/lib/bof-demo-profile-dashboards";
import type { SafetyNavId } from "@/types/safety";

const items: { id: SafetyNavId; label: string; icon: typeof LayoutDashboard }[] =
  [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "driver_profile", label: "Driver profile", icon: UserCircle },
    { id: "expirations", label: "Expirations", icon: CalendarClock },
    { id: "risk_claims", label: "Risk & claims", icon: AlertTriangle },
  ];

type Props = {
  active: SafetyNavId;
  onChange: (id: SafetyNavId) => void;
};

export function SafetyNav({ active, onChange }: Props) {
  return (
    <nav
      className="flex h-full min-h-0 w-52 shrink-0 flex-col border-r border-slate-800 bg-slate-950/80 py-4"
      aria-label="Safety module"
    >
      <div className="mb-3 flex items-center gap-2 px-4 pb-2">
        <Shield className="h-4 w-4 text-teal-500" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Safety &amp; Compliance
        </span>
      </div>
      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const sel = active === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange(item.id)}
                className={[
                  "flex w-full appearance-none items-center gap-2 rounded-md border border-transparent bg-transparent px-3 py-2 text-left text-sm font-medium transition-colors",
                  sel
                    ? "bg-teal-900/40 text-teal-50 ring-1 ring-teal-600/50"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto border-t border-slate-800 px-3 pt-3">
        <a
          href={BOF_SAFETY_PROFILE_DASHBOARD_HTML}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-teal-400 hover:bg-slate-900 hover:text-teal-300"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          Supporting profile dashboard
        </a>
      </div>
    </nav>
  );
}
