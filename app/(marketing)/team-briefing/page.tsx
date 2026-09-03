import type { Metadata } from "next";
import Link from "next/link";
import "./team-briefing.css";

export const metadata: Metadata = {
  title: "BOF Team Briefing",
  description:
    "Internal briefing on the gap BOF closes, readiness before dispatch, the operating spine around the TMS, and the decision to treat BOF as operating control.",
};

export default function TeamBriefingPage() {
  return (
    <main className="bof-team-briefing">
      <div className="bof-team-briefing__inner">
        <header className="bof-team-briefing__hero">
          <p className="bof-home-eyebrow">BOF Team Briefing</p>
          <h1>Fleets already own systems. BOF fixes the work between them.</h1>
          <p className="bof-team-briefing__lede">
            This briefing is for BOF team members first, and for prospects with only light edits. It does not change the
            commercial proposition or readiness logic. It restates the operating-system story with a cleaner spine.
          </p>
          <div className="bof-brief-callouts" aria-label="BOF operating concepts">
            <span>Readiness layer</span>
            <span>Operating spine</span>
            <span>Release gate</span>
          </div>
        </header>

        <article className="bof-brief-slide">
          <span className="bof-brief-slide__index">01 — The gap</span>
          <h2>Fleets already own systems. The work between them is still unowned.</h2>
          <p>
            A fleet can have a TMS, ELD, payroll, safety files, and a document folder and still lose hours every day to
            re-entry, missing proof, and unclear ownership. BOF is the operating-control layer that organizes that work
            so the movement the TMS records is actually ready to happen.
          </p>
          <div className="bof-brief-flow">
            <div>
              <strong>People</strong>
              <span>Driver, dispatcher, safety, billing each hold a piece of the same load.</span>
            </div>
            <div>
              <strong>Systems</strong>
              <span>TMS, ELD, accounting, and files already exist. They do not share one record.</span>
            </div>
            <div>
              <strong>The gap</strong>
              <span>Intake, readiness, proof, and closeout sit between those systems.</span>
            </div>
            <div>
              <strong>BOF</strong>
              <span>Owns the administrative work between systems without replacing the TMS.</span>
            </div>
          </div>
        </article>

        <article className="bof-brief-slide">
          <span className="bof-brief-slide__index">02 — The regulatory reality</span>
          <h2>FMCSA defines the rules. BOF organizes the record.</h2>
          <p>
            Qualification, medical, hours, inspection, and proof requirements are not optional. BOF does not rewrite the
            regulation. It keeps the fleet&apos;s record in one place so CDL, medical, DQF, equipment, and delivery proof
            can be found before the truck is asked to roll.
          </p>
          <p>
            Live product surfaces:{" "}
            <Link href="/drivers">Drivers</Link>, <Link href="/safety">Safety</Link>,{" "}
            <Link href="/documents">Documents</Link>.
          </p>
        </article>

        <article className="bof-brief-slide">
          <span className="bof-brief-slide__index">03 — Before the load</span>
          <h2>Readiness begins before dispatch.</h2>
          <p>
            A load is not ready because it exists in a TMS. It is ready when driver eligibility, equipment match,
            documents, appointments, and proof requirements are attached before release. That is the readiness layer:
            work completed before the truck is committed.
          </p>
          <div className="bof-brief-flow">
            <div>
              <strong>Intake</strong>
              <span>Lane, freight, appointments, and proof needs captured once.</span>
            </div>
            <div>
              <strong>Match</strong>
              <span>Driver and equipment checked against the load, not after pickup.</span>
            </div>
            <div>
              <strong>Packet</strong>
              <span>Rate, BOL, seal, and cargo requirements visible before roll.</span>
            </div>
            <div>
              <strong>Release</strong>
              <span>The gate confirms the record, then the TMS movement proceeds.</span>
            </div>
          </div>
        </article>

        <article className="bof-brief-slide">
          <span className="bof-brief-slide__index">04 — TMS vs BOF</span>
          <h2>The TMS moves the freight. BOF makes the work ready to move.</h2>
          <div className="bof-brief-compare">
            <article>
              <h3>TMS</h3>
              <p>Orders, tenders, dispatch entries, and status as freight moves from origin to destination.</p>
            </article>
            <article>
              <h3>BOF</h3>
              <p>
                Readiness, assignment context, pre-trip packet, proof, billing, settlement, and factoring support around
                that movement. BOF sits around the systems the fleet already uses.
              </p>
            </article>
          </div>
          <p>
            This is the same distinction already stated on{" "}
            <Link href="/what-we-do">What we do</Link>: BOF is not a second TMS.
          </p>
        </article>

        <article className="bof-brief-slide">
          <span className="bof-brief-slide__index">05 — One operating spine</span>
          <h2>The shipment record carries the administrative work.</h2>
          <p>
            Intake, quote context, assignment, BOL packet, tracking, invoice, settlement, and factoring notes belong on
            one load. That is the operating spine. When those pieces live in separate inboxes, the fleet pays for the
            chase.
          </p>
          <div className="bof-brief-links">
            <Link href="/load-intake">
              Load intake
              <span>Start the record before dispatch.</span>
            </Link>
            <Link href="/loads">
              Loads
              <span>Open the working load in the fleet workspace.</span>
            </Link>
            <Link href="/customer-portal">
              Customer Portal
              <span>Customer-visible path on the same workflow.</span>
            </Link>
          </div>
        </article>

        <article className="bof-brief-slide">
          <span className="bof-brief-slide__index">06 — The release gate</span>
          <h2>BOF checks readiness before the truck rolls.</h2>
          <p>
            The release gate is the last controlled look: required fields, assignment, compliance, equipment, and the
            pre-trip packet. If a check is open, the load is not treated as ready to move. Dispatch still decides. BOF
            makes the decision visible.
          </p>
          <p>
            Live product surface: <Link href="/dispatch">Dispatch</Link>.
          </p>
        </article>

        <article className="bof-brief-slide">
          <span className="bof-brief-slide__index">07 — The economics</span>
          <h2>Fleets already pay for the back office. BOF replaces friction.</h2>
          <p>
            The cost is already in coordinators, after-hours chasing, re-keyed invoices, delayed POD, and settlement
            holds. BOF does not invent a new spend category. It takes over administrative execution so the fleet keeps
            authority over customers, hiring, equipment, and dispatch decisions.
          </p>
        </article>

        <article className="bof-brief-slide">
          <span className="bof-brief-slide__index">08 — Cost → diagnosis</span>
          <h2>The assessment proves the economics in the fleet&apos;s own work.</h2>
          <p>
            An assessment maps how intake, readiness, proof, and closeout actually run today. It is diagnosis, not a
            slogan. It shows where the fleet already pays for the gap between systems.
          </p>
          <p>
            Live surface: <Link href="/book-assessment">Operating assessment</Link>.
          </p>
        </article>

        <article className="bof-brief-slide">
          <span className="bof-brief-slide__index">09 — Product status</span>
          <h2>BOF is a working operating spine with remaining finish work.</h2>
          <p>
            Dispatch, loads, documents, driver records, customer visibility, and process history already exist as working
            product. Remaining work is finish: tighter customer-facing language, routing consistency, and honest labels
            where a walkthrough is still simulated. This briefing does not claim live GPS, live factoring submission, or
            a production quote engine where those are not supported.
          </p>
          <div className="bof-brief-links">
            <Link href="/how-bof-works">
              How BOF works
              <span>Sixteen-step product walkthrough.</span>
            </Link>
            <Link href="/dispatch">
              Dispatch
              <span>Release and operating board.</span>
            </Link>
            <Link href="/dashboard">
              Dashboard
              <span>Fleet workspace entry.</span>
            </Link>
          </div>
        </article>

        <article className="bof-brief-slide">
          <span className="bof-brief-slide__index">10 — The decision</span>
          <h2>BOF is the operating-control layer around the TMS.</h2>
          <p>
            Keep the TMS. Keep the fleet&apos;s authority. Put readiness, release, proof, and closeout on one spine so
            the work between systems has an owner. That is the decision this briefing asks the team to carry into every
            customer and prospect conversation.
          </p>
          <p className="bof-brief-note">
            Team note: edit names and examples for external use. Do not change the commercial model, readiness engines,
            or TMS-versus-BOF distinction. For the customer-facing walkthrough of intake through billing, use{" "}
            <Link href="/customer-portal">/customer-portal</Link>.
          </p>
        </article>
      </div>
    </main>
  );
}
