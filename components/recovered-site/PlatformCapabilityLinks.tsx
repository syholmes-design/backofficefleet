import Link from "next/link";

/**
 * Connects Business Operations explanations to the existing BOF platform.
 * Each capability offers a public demonstration (synthetic data, no sign-in)
 * and a sign-in path to the live, tenant-scoped workspace.
 * Destinations are existing routes; nothing here duplicates an operational system.
 */
export const PLATFORM_CAPABILITIES = {
  "driver-onboarding": {
    title: "Driver Onboarding",
    body: "Applicant intake, document collection, qualification review and administrative activation, kept as separate lifecycle states.",
    demo: { href: "/business-operations/hr-tier/recruiting-onboarding", label: "Try the recruiting and onboarding workspace (sample candidates)" },
    live: { href: "/api/auth/signin?callbackUrl=%2Frecruiting", label: "Sign in to recruiting and onboarding" },
  },
  "driver-compliance-documents": {
    title: "Driver Compliance Documents",
    body: "Driver qualification file documents with review status, expirations and the gaps that block assignment readiness.",
    demo: { href: "/documents", label: "Open the driver file cabinet (sample documents)" },
    live: { href: "/api/auth/signin?callbackUrl=%2Fdrivers", label: "Sign in to driver records" },
  },
  "dispatch-assignment": {
    title: "Dispatch Assignment",
    body: "Assignment decisions gated by driver qualification, readiness and document evidence before a load is released.",
    demo: { href: "/demo/dispatch", label: "View the dispatch demonstration" },
    live: { href: "/api/auth/signin?callbackUrl=%2Fdispatch", label: "Sign in to dispatch" },
  },
} as const;

export type PlatformCapabilityKey = keyof typeof PLATFORM_CAPABILITIES;

export function PlatformCapabilityLinks({
  keys,
  heading,
  currentRoute,
}: {
  keys: PlatformCapabilityKey[];
  heading?: string;
  currentRoute?: string;
}) {
  return (
    <section className="bof-capabilities" aria-labelledby="bof-capabilities-heading" data-testid="platform-capabilities">
      <div className="bof-capabilities-inner">
        <p className="bof-capabilities-eyebrow">In the BOF platform</p>
        <h2 id="bof-capabilities-heading" className="bof-capabilities-heading">
          {heading ?? "See this work in the operating platform."}
        </h2>
        <p className="bof-capabilities-note">
          Demonstrations use synthetic records and need no sign-in. Live workspaces require a BOF account and show only the
          fleets you are authorized to see.
        </p>
        <div className="bof-capabilities-grid">
          {keys.map((key) => {
            const cap = PLATFORM_CAPABILITIES[key];
            return (
              <article key={key} className="bof-capability-card" data-capability={key}>
                <h3>{cap.title}</h3>
                <p>{cap.body}</p>
                <div className="bof-capability-actions">
                  {cap.demo.href === currentRoute ? (
                    <span className="bof-capability-demo-here">The sample workspace is on this page.</span>
                  ) : (
                    <Link href={cap.demo.href} className="bof-capability-demo">
                      {cap.demo.label} →
                    </Link>
                  )}
                  <a href={cap.live.href} className="bof-capability-live">
                    {cap.live.label}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
