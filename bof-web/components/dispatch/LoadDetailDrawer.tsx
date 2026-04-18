"use client";

import type { Load } from "@/types/dispatch";
import { LoadDetailContent } from "./LoadDetailContent";

type Props = {
  load: Load | null;
  open: boolean;
  onClose: () => void;
};

export function LoadDetailDrawer({ load, open, onClose }: Props) {
  if (!open || !load) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-[1px]"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className="flex h-full w-full max-w-xl flex-col border-l border-slate-800 bg-slate-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-load-drawer-title"
      >
        <div id="dispatch-load-drawer-title" className="sr-only">
          Load detail {load.load_id}
        </div>
        <LoadDetailContent load={load} onClose={onClose} />
      </aside>
    </div>
  );
}
