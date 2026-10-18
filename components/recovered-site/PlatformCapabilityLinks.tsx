import Link from "next/link";

/**
 * Connects Business Operations explanations to the existing BOF platform.
 * Each capability offers two public demonstrations (fictional records, no sign-in).
 * Real customer records stay in the signed-in, tenant-scoped workspace.
 * Destinations are existing routes; nothing here duplicates an operational system.
 */
export const PLATFORM_CAPABILITIES = {
  "driver-onboarding": {
    title: "Driver Onboarding",
    body: "Applicant intake, document collection, qualification review and administrative activation, kept as separate lifecycle states.",
    demo: { href: "/business-operations/hr-tier/recruiting-onboarding", label: "Try the recruiting and onboarding workspace (sample candidates)" },
    second: { href: "/interactive-demo/drivers/document-intake", label: "Walk through driver document intake" },
  },
  "driver-compliance-documents": {
    title: "Driver Compliance Documents",
    body: "Driver qualification file documents with review status, expirations and the gaps that block assignment readiness.",
    demo: { href: "/documents", label: "Open the driver file cabinet (sample documents)" },
    second: { href: "/interactive-demo/drivers", label: "Open the driver files demo" },
  },
  "dispatch-assignment": {
    title: "Dispatch Assignment",
    body: "Assignment decisions gated by driver qualification, readiness and document evidence before a load is released.",
    demo: { href: "/demo/dispatch", label: "View the dispatch demonstration" },
    second: { href: "/interactive-demo/dispatch", label: "Open the interactive dispatch board" },
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
          Demonstrations use fictional records and need no sign-in. Customer workspaces with real records require a BOF
          account and show only the fleets you are authorized to see.
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
                  <Link href={cap.second.href} className="bof-capability-live">
                    {cap.second.label} →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
        <p className="bof-capabilities-note">
          <Link href="/assessment" className="bof-capability-demo">
            Take the Assessment →
          </Link>
        </p>
      </div>
    </section>
  );
}
