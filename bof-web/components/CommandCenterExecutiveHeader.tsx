import Link from "next/link";
import { BofLogo } from "@/components/BofLogo";

export function CommandCenterExecutiveHeader() {
  return (
    <header className="bof-cc-hero" aria-label="Command Center introduction">
      <div className="bof-cc-hero-main">
        <div className="bof-cc-hero-brand" aria-hidden>
          <BofLogo variant="dark" className="bof-cc-hero-logo" />
        </div>
        <div className="bof-cc-hero-copy">
          <p className="bof-cc-hero-eyebrow">Operations control</p>
          <h1 className="bof-cc-hero-title">Command Center</h1>
          <p className="bof-cc-hero-tagline">
            Real-time operational control across compliance, proof, settlements,
            and risk.
          </p>
        </div>
      </div>
      <div className="bof-cc-hero-actions">
        <Link href="/dispatch" className="bof-cc-hero-cta bof-cc-hero-cta-secondary">
          View Dispatch
        </Link>
        <Link href="/settlements" className="bof-cc-hero-cta bof-cc-hero-cta-primary">
          View Settlements
        </Link>
      </div>
    </header>
  );
}
