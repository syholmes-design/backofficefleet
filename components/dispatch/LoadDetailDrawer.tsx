"use client";

import { LoadDetailContent } from "./LoadDetailContent";
import type { DispatchLoadRecord } from "@/lib/dispatch-workflow-ui";

type Props = {
  load: DispatchLoadRecord | null;
  open: boolean;
  onClose: () => void;
  onOpenAssignModal?: (loadId: string) => void;
  refreshKey?: number;
};

export function LoadDetailDrawer({ load, open, onClose, onOpenAssignModal, refreshKey = 0 }: Props) {
  if (!open || !load) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-[1px]"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="flex h-full w-full max-w-xl flex-col border-l border-slate-800 bg-slate-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-load-drawer-title"
      >
        <div id="dispatch-load-drawer-title" className="sr-only">
          Load detail {load.id}
        </div>
        <LoadDetailContent
          load={load}
          onClose={onClose}
          onOpenAssignModal={onOpenAssignModal}
          refreshKey={refreshKey}
        />
      </aside>
    </div>
  );
}
