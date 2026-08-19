import Link from "next/link";
import { MarketingNavigation } from "@/components/marketing/MarketingNavigation";
import { BOF_RUNTIME_LINKS } from "@/lib/marketing-runtime-links";

/** Marketing layout: no duplicate header — {@link BofHeader} in root layout. */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bof-mkt-root">
      <MarketingNavigation />
      <main className="bof-mkt-main">{children}</main>
      <footer className="bof-mkt-footer">
        <div className="bof-mkt-footer-inner">
          <p className="bof-mkt-footer-tagline">
            Compliance and operations command center for for-hire and fleet
            operations — not a fleet tracker.
          </p>
          <div className="bof-mkt-footer-links">
            <a href={BOF_RUNTIME_LINKS.dashboard}>Product entry</a>
            <a href={BOF_RUNTIME_LINKS.dispatch}>Dispatch runtime</a>
            <Link href="/book-assessment">Book assessment</Link>
            <Link href="/fleet-operations">Fleet operations</Link>
          </div>
          <p className="bof-mkt-footer-tagline">CONTROL • COMPLY • CLEAR</p>
          <p className="bof-mkt-footer-copy">© {new Date().getFullYear()} BackOfficeFleet</p>
        </div>
      </footer>
    </div>
  );
}
