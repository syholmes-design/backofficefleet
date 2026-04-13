import Link from "next/link";

/** Marketing layout: no duplicate header — {@link BofHeader} in root layout. */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bof-mkt-root">
      <main className="bof-mkt-main">{children}</main>
      <footer className="bof-mkt-footer">
        <div className="bof-mkt-footer-inner">
          <p className="bof-mkt-footer-tagline">
            Compliance and operations command center for for-hire and fleet
            operations — not a fleet tracker.
          </p>
          <div className="bof-mkt-footer-links">
            <Link href="/dashboard">Product demo</Link>
            <Link href="/book-assessment">Book assessment</Link>
            <Link href="/for-hire-carriers">For-hire carriers</Link>
          </div>
          <p className="bof-mkt-footer-copy">© {new Date().getFullYear()} BackOfficeFleet</p>
        </div>
      </footer>
    </div>
  );
}
