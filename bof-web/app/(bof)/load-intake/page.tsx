/**
 * BOF Route Owner:
 * URL: /load-intake
 * Type: DISPATCH
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { redirect } from "next/navigation";

export const metadata = {
  title: "Load Intake | BOF",
  description: "Redirects to canonical dispatch load intake.",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Compatibility route — canonical intake UI lives at `/dispatch/intake`.
 */
export default async function LoadIntakePage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const key of ["clientRequestId", "intakeId", "templateId"] as const) {
    const raw = sp[key];
    const v = Array.isArray(raw) ? raw[0] : raw;
    if (typeof v === "string" && v.trim()) q.set(key, v.trim());
  }
  const suffix = q.toString();
  redirect(suffix ? `/dispatch/intake?${suffix}` : "/dispatch/intake");
}
