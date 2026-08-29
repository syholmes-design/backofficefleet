import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How BOF Works | BackOfficeFleet",
  description:
    "Follow the complete BackOfficeFleet operating system step-by-step — from workforce recruiting, qualification, and onboarding through load intake, readiness, dispatch, proof, and settlement.",
};

export default function HowBofWorksPage() {
  return (
    <main className="bof-service-page bof-how-bof-works-page">
      <div className="bof-mkt-container">
        {/* HERO SECTION */}
        <header className="bof-service-page__hero text-left">
          <p className="bof-home-eyebrow">BOF Product Walkthrough</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-6xl">
            HOW BOF WORKS
          </h1>
          <p className="mt-4 text-xl font-medium text-slate-700 dark:text-slate-200">
            Follow the complete fleet lifecycle — from workforce recruiting and onboarding to operational dispatch and settlement closeout.
          </p>
        </header>

        {/* CORE CONCEPT SUMMARY */}
        <section className="bof-service-page__section bof-service-page__section--dark rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            One Connected Operating Capability — Workforce to Settlement
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-200">
            BOF is not a collection of disconnected software modules. BOF follows the complete lifecycle of a fleet operation.
            From defining a driver opening and qualifying candidates through pre-trip inspections, dispatch release, proof verification, and payroll settlement,
            information flows continuously without manual re-entry.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-5 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Step 01–07</span>
              <strong className="mt-2 block text-lg font-extrabold text-white">RECRUIT &amp; ONBOARD</strong>
              <p className="mt-1 text-xs text-slate-300">Position, applicant screening, offer &amp; driver activation</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-5 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Step 08–09</span>
              <strong className="mt-2 block text-lg font-extrabold text-white">INTAKE &amp; MATCH</strong>
              <p className="mt-1 text-xs text-slate-300">Load intake, rate extraction &amp; driver/truck assignment</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-5 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Step 10–13</span>
              <strong className="mt-2 block text-lg font-extrabold text-white">READINESS &amp; DISPATCH</strong>
              <p className="mt-1 text-xs text-slate-300">Pre-trip evaluation, release gates &amp; in-transit tracking</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-5 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Step 14–16</span>
              <strong className="mt-2 block text-lg font-extrabold text-white">PROOF &amp; SETTLEMENT</strong>
              <p className="mt-1 text-xs text-slate-300">Post-trip POD, exception resolution &amp; payroll closeout</p>
            </div>
          </div>
        </section>

        {/* SIXTEEN-STEP PRODUCT WALKTHROUGH */}
        <section className="mt-12 space-y-12">
          {/* STEP 1 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 01 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  WORKFORCE NEED
                </h2>
              </div>
              <Link href="/recruiting" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                OPEN RECRUITING &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              Identify driver openings based on fleet growth and lane commitments. Define home terminal, freight type, equipment, primary lanes, and schedule.
            </p>
          </article>

          {/* STEP 2 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 02 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  RECRUIT
                </h2>
              </div>
              <Link href="/recruiting" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                VIEW PIPELINE &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              Manage the active recruitment pipeline across open positions, applicants, screening, qualification, interviews, offers, and onboarding.
            </p>
          </article>

          {/* STEP 3 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 03 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  JOB DESCRIPTION &amp; POSTING PACKAGE
                </h2>
              </div>
              <Link href="/recruiting" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                CREATE POSITION &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              Generate structured job descriptions and distribution packages ready for external job board posting and career site integration.
            </p>
          </article>

          {/* STEP 4 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 04 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  APPLICANT SCREENING
                </h2>
              </div>
              <Link href="/recruiting" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                SCREEN CANDIDATES &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              Review applicant experience, CDL class, state, and home location against position requirements.
            </p>
          </article>

          {/* STEP 5 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 05 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  DRIVER QUALIFICATION REVIEW
                </h2>
              </div>
              <Link href="/recruiting" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                QUALIFY DRIVER &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              Organize driver qualification documents (CDL, Medical Card MCSA-5876, MVR, FMCSA Clearinghouse consent).
            </p>
          </article>

          {/* STEP 6 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 06 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  ONBOARDING &amp; CHECKLIST
                </h2>
              </div>
              <Link href="/recruiting" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                ONBOARD DRIVER &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              Track 10-point onboarding progress: I-9 verification, tax forms, direct deposit, safety policy acknowledgments, and equipment orientation.
            </p>
          </article>

          {/* STEP 7 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 07 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  DRIVER ACTIVATION &amp; BOF VAULT HANDOFF
                </h2>
              </div>
              <Link href="/recruiting" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                ACTIVATE DRIVER &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              Activate driver in BOF Driver Master and transition qualifying documents into the driver&apos;s permanent BOF Vault record. Driver becomes available to Operations.
            </p>
          </article>

          {/* STEP 8 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 08 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  LOAD INTAKE
                </h2>
              </div>
              <Link href="/dispatch/intake" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                OPEN LOAD INTAKE &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              Bring the load into BOF and establish the operational record. Upload a Rate Confirmation or customer tender document to extract rate, commodity, appointment times, shipper, consignee, and special equipment requirements into an active load file.
            </p>
          </article>

          {/* STEP 9 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 09 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  LOAD, DRIVER &amp; EQUIPMENT MATCH
                </h2>
              </div>
              <Link href="/loads/L001" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                SEE THE ASSIGNMENT &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              BOF connects the load to the appropriate driver, truck, and trailer. This creates a bound operational spine tying together driver qualifications, equipment inspection logs, and customer requirements.
            </p>
          </article>

          {/* STEP 10 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 10 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  READINESS EVALUATION
                </h2>
              </div>
              <Link href="/loads/L001/readiness-summary" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                CHECK READINESS &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              BOF evaluates driver credentials (CDL, medical card, MVR, Clearinghouse), equipment maintenance status, required customer documents, and load requirements before the trip begins.
            </p>
          </article>

          {/* STEP 11 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 11 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  PRE-TRIP INSPECTION
                </h2>
              </div>
              <Link href="/pretrip/L009" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                OPEN PRE-TRIP &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              Pre-Trip turns inspection results into an operational release decision. Drivers complete pre-trip checklists on mobile/tablet devices with timestamped photo evidence. Defects automatically lock release.
            </p>
          </article>

          {/* STEP 12 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 12 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  DISPATCH RELEASE GATE
                </h2>
              </div>
              <Link href="/dispatch" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                OPEN DISPATCH &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              BOF determines whether the load can be released, requires review, or must remain blocked. Dispatchers operate with full readiness visibility, preventing illegal or unready releases.
            </p>
          </article>

          {/* STEP 13 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 13 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  IN-TRANSIT TRACKING
                </h2>
              </div>
              <Link href="/operational-chat" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                FOLLOW THE TRIP &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              Once released, BOF keeps the operational record connected to the trip. Monitor route progress, telematics events, RFID dock scans, weather alerts, and driver operational chat messages in real time.
            </p>
          </article>

          {/* STEP 14 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 14 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  DELIVERY &amp; POST-TRIP CLOSEOUT
                </h2>
              </div>
              <Link href="/loads/L001" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                OPEN POST-TRIP &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              Delivery does not end the operational record. BOF carries the load into post-trip closeout, organizing Proof of Delivery (POD), Bill of Lading (BOL), pickup/delivery seal photos, lumper receipts, and scale tickets.
            </p>
          </article>

          {/* STEP 15 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 15 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  PROOF &amp; BILLING PACKET
                </h2>
              </div>
              <Link href="/documents/template-packs" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                REVIEW PROOF &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              BOF organizes the evidence required to close the operational record and support factoring or direct customer billing. Complete proof bundles release settlement holds automatically.
            </p>
          </article>

          {/* STEP 16 */}
          <article className="bof-service-page__section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Step 16 of 16
                </span>
                <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  SETTLEMENT &amp; PAYROLL CLOSEOUT
                </h2>
              </div>
              <Link href="/settlements-v2" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                OPEN SETTLEMENTS &rarr;
              </Link>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
              BOF carries the operational outcome into settlement without losing the connection to the original load. Driver compensation, fuel reimbursements, deductions, and gross margins calculate instantly.
            </p>
          </article>
        </section>

        {/* CLOSING STATEMENT */}
        <section className="mt-16 rounded-2xl bg-slate-950 p-10 text-center text-white shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-400">BOF Complete Fleet System</p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">ONE CONNECTED FLEET OPERATING SYSTEM.</h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
            BOF connects the entire lifecycle — from workforce need and recruiting through dispatch, delivery, proof, and settlement.
          </p>
          <div className="mt-8">
            <Link href="/recruiting" className="inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              START WITH RECRUITING &rarr;
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
