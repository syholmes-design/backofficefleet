import Link from "next/link";
import { BOF_RUNTIME_LINKS } from "@/lib/marketing-runtime-links";

/** Marketing layout: no duplicate header — {@link BofHeader} in root layout. */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bof-mkt-root">
      <main className="bof-mkt-main">{children}</main>
      <footer className="bof-mkt-footer">
        <div className="bof-mkt-footer-inner">
          <p className="bof-mkt-footer-tagline">
            BackOfficeFleet becomes the back office behind growing fleets.
          </p>
          <div className="bof-mkt-footer-links">
            <a href={BOF_RUNTIME_LINKS.dashboard}>Operating System</a>
            <a href={BOF_RUNTIME_LINKS.dispatch}>Dispatch Runtime</a>
            <Link href="/safety">Safety &amp; Compliance</Link>
            <Link href="/settlements">Settlements</Link>
            <Link href="/rf-actions">Exception Queue</Link>
            <Link href="/documents">File Cabinet</Link>
            <Link href="/driver-experience">Driver Experience</Link>
            <Link href="/investors">Investors</Link>
            <Link href="/book-assessment">Assessment</Link>
          </div>
          <p className="bof-mkt-footer-tagline">CONTROL • COMPLY • CLEAR</p>
          <p className="bof-mkt-footer-copy">© {new Date().getFullYear()} BackOfficeFleet</p>
        </div>
      </footer>
    </div>
  );
}
