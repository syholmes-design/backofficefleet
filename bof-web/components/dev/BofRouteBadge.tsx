"use client";

import { usePathname } from "next/navigation";
import { getBofPageRegistryItem } from "@/lib/bof-page-registry";

export function BofRouteBadge() {
  const pathname = usePathname();
  if (process.env.NODE_ENV !== "development") return null;
  const item = getBofPageRegistryItem(pathname);
  if (!item) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 9999,
        background: "rgba(2, 6, 23, 0.88)",
        border: "1px solid rgba(45, 212, 191, 0.45)",
        color: "#ccfbf1",
        fontSize: 11,
        lineHeight: 1.35,
        padding: "8px 10px",
        borderRadius: 8,
        maxWidth: 360,
        pointerEvents: "none",
      }}
    >
      <strong>BOF DEV:</strong> {pathname} {"->"} {item.routeFile}
      <br />
      <span>{item.type}</span>
    </div>
  );
}
