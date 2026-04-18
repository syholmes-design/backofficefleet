"use client";

import {
  AlertTriangle,
  Banknote,
  ClipboardList,
  LayoutGrid,
  Link2,
  UserPlus,
} from "lucide-react";
import type { DispatchNavId } from "@/types/dispatch";

const ITEMS: {
  id: DispatchNavId;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
  { id: "board", label: "Dispatch Board", icon: LayoutGrid },
  { id: "load-detail", label: "Load Detail", icon: ClipboardList },
  { id: "assign", label: "Assign Driver & Equipment", icon: UserPlus },
  { id: "exceptions", label: "Exception View", icon: AlertTriangle },
  { id: "settlement", label: "Settlement Readiness", icon: Banknote },
];

type Props = {
  active: DispatchNavId;
  onChange: (id: DispatchNavId) => void;
};

export function DispatchNav({ active, onChange }: Props) {
  return (
    <nav
      className="flex w-56 shrink-0 flex-col gap-0.5 border-r border-slate-800 bg-slate-950/80 p-3"
      aria-label="Dispatch module"
    >
      <div className="mb-3 border-b border-slate-800 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          BOF Dispatch
        </p>
        <p className="text-sm font-semibold text-teal-500">Operations</p>
      </div>
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const on = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={[
              "flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
              on
                ? "bg-teal-900/35 text-teal-100 ring-1 ring-teal-600/50"
                : "text-slate-300 hover:bg-slate-900 hover:text-white",
            ].join(" ")}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            <span className="leading-snug">{label}</span>
          </button>
        );
      })}
      <div className="mt-auto border-t border-slate-800 pt-3 text-[10px] text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Link2 className="h-3 w-3" aria-hidden />
          Linked to BOF demo fleet JSON
        </span>
      </div>
    </nav>
  );
}
