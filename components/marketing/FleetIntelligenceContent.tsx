import Link from "next/link";
import type { ReactNode } from "react";

const NEWS_SOURCE_HREF =
  "https://www.msn.com/en-us/news/other/i-ll-kill-you-truck-driver-hours-late-delivering-payload-chokes-shoots-warehouse-employee-who-called-him-out-for-tardiness-cops-say/ar-AA2bLc4L?ocid=socialshare";

export type FleetIntelligenceCallout = {
  kicker: string;
  title: string;
  caption: string;
  rows: Array<{ label: string; value: string }>;
};

export type FleetIntelligenceArticle = {
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  category: string;
  date: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    workflow?: string[];
    callout?: FleetIntelligenceCallout;
  }>;
  relatedLinks: Array<{
    label: string;
    href: string;
  }>;
};

const DSP_CARGO_THEFT_HREF =
  "https://dsp.delaware.gov/2026/09/18/state-police-arrest-california-man-after-stealing-680000-cargo-shipment-from-new-castle-warehouse/";
const FBI_CARGO_THEFT_HREF = "https://www.fbi.gov/investigate/transnational-organized-crime/cargo-theft";
const IC3_STRATEGIC_CARGO_THEFT_HREF = "https://www.ic3.gov/PSA/2026/PSA260430";
const FMCSA_FRAUD_HREF = "https://www.fmcsa.dot.gov/mission/help/broker-and-carrier-fraud-and-identity-theft";
const FMCSA_SAFER_HREF = "https://safer.fmcsa.dot.gov/CompanySnapshot.aspx";

export const FLEET_INTELLIGENCE_ARTICLES: FleetIntelligenceArticle[] = [
  {
    slug: "from-document-verification-to-load-release-control",
    title: "From Document Verification to Load Release Control",
    subtitle:
      "A $680,000 cargo-theft case shows why a valid-looking document is not the same thing as authorization to take a load.",
    summary:
      "Delaware State Police reported a New Castle cargo theft in which suspects presented driver's licenses and shipping documents. The operational lesson is not that paperwork is useless. It is that a document can look valid without proving that a particular person is authorized to take a particular shipment.",
    category: "Load Release Control",
    date: "September 18, 2026",
    relatedLinks: [
      { label: "Open Command Center", href: "/command-center" },
      { label: "Open Dispatch", href: "/dispatch" },
      { label: "Open Loads", href: "/loads" },
      { label: "Review Driver Records", href: "/drivers" },
      { label: "Open Documents", href: "/documents" },
    ],
    sections: [
      {
        heading: "What the Delaware case actually shows",
        paragraphs: [
          `According to the [Delaware State Police](${DSP_CARGO_THEFT_HREF}), on September 14, 2026, two people arrived at an electronics warehouse in New Castle, Delaware, identified themselves as FedEx employees, and presented driver's licenses and shipping documents for a trailer containing more than $680,000 in electronics. Police said the suspects attached the trailer to their cab and left.`,
          "A short time later, according to the same DSP release, the shipping documents were determined to be fraudulent. Troopers later located the tractor-trailer, recovered the trailer, and recovered the electronics still inside. DSP said the driver's licenses presented at the warehouse and the registration plate displayed on the tractor-trailer were fraudulent. DSP reported that one suspect was arrested and charged; the investigation remains ongoing. Those charges are allegations, not adjudicated findings.",
          "This article does not claim that any particular software would have prevented the incident. It uses the public facts to isolate a narrower operating problem: a document that looks sufficient at the dock is not, by itself, proof that the person holding it is authorized to take the load.",
        ],
      },
      {
        heading: "Never treat a document as authorization",
        paragraphs: [
          "A shipping paper can describe a shipment. A driver's license can identify a person, or appear to. A carrier packet can look complete. None of those artifacts, standing alone, answers the question that matters at pickup: is this person authorized to take this particular load, for this carrier, with this equipment?",
          "The principle is simple and easy to violate under time pressure: never treat a document as authorization. Document verification asks whether a record looks valid. Operational authorization asks whether the load, carrier, driver, and equipment on the dock match a current operating decision. Those are different questions. Confusing them is how a valid-looking packet becomes a release.",
        ],
      },
      {
        heading: "What federal guidance already asks operations to confirm",
        paragraphs: [
          `The [FBI](${FBI_CARGO_THEFT_HREF}) describes strategic cargo theft as deception used to trick shippers, brokers, and carriers into handing loads to thieves instead of the legitimate carrier. The Bureau lists identity theft, fictitious pick-ups, account takeovers, double brokering, and fraudulent carriers among current methods. Its published protection guidance includes working with shippers to confirm driver, truck, and trailer identifiers at pickup, and using a secure pick-up number.`,
          `The FBI Internet Crime Complaint Center's April 2026 [public service announcement](${IC3_STRATEGIC_CARGO_THEFT_HREF}) on cyber-enabled strategic cargo theft likewise advises independently verifying shipment requests and pickups through secondary methods before releasing loads, and maintaining documentation of drivers, licenses, vehicles, plates, and carrier identifiers. That is investigative and operational hygiene. It is not a claim that any one checklist would have changed the Delaware facts.`,
          `[FMCSA](${FMCSA_FRAUD_HREF}) treats unauthorized use of another carrier's USDOT number, and unregistered brokerage, as fraud and identity theft. Its prevention guidance includes independently confirming broker and carrier phone numbers through [SAFER](${FMCSA_SAFER_HREF}) and confirming that the truck that arrives matches the carrier actually contracted—including tractor and trailer plate information. Federal guidance is pointing at independent verification of people, companies, and equipment—not at trusting the first set of papers presented at the gate.`,
        ],
      },
      {
        heading: "The questions a dock still has to answer",
        paragraphs: [
          "If a pickup is treated as document intake, the dock asks whether the papers look right. If a pickup is treated as load release control, the dock has to answer a tighter set of questions:",
          "WHO is this person? WHO do they work for? WERE they actually dispatched? WHAT equipment are they operating? WAS that equipment assigned to this load? IS this person authorized to take this particular shipment?",
          "Those questions cannot be answered from a photocopy. They require an operating record that already binds driver, carrier, load, and equipment—and a pickup step that reconciles the physical arrival against that record.",
        ],
      },
      {
        heading: "What BOF already connects",
        paragraphs: [
          "BackOfficeFleet already keeps transportation work as related operating records rather than as disconnected files. A canonical Driver identity can carry qualification and readiness. An ACTIVE DispatchAssignment can bind a driver to a load, assign a tractor, and optionally assign a trailer. The load-to-equipment relationship exists through that assignment, not as a label on a document. Trip-release evaluation can produce RELEASED, BLOCKED, HOLD, or CONDITIONALLY_RELEASED from assignment, driver readiness, equipment status, and pre-trip completeness. Execution, delivery/POD, and operating-exception records can remain attached to the load after movement.",
          "That chain already answers a back-office question: which driver and equipment are assigned to this load? [Dispatch](/dispatch) and [Loads](/loads) are where that assignment is made and read. Driver qualification and readiness live with [driver records](/drivers). The [Command Center](/command-center) consumes LIVE operating-spine counts of loads, equipment, and settlement holds. [Documents](/documents), the [Driver Vault](/documents/vault), and [BOF Vault](/bof-vault) hold records and evidence. [Safety](/safety) and [carrier](/carriers) surfaces keep compliance and fleet identity in the same product, not in a separate binder.",
          "That is document-connected operations. It is not yet physical pickup control. BOF can currently say who was assigned. It cannot currently prove that the person standing at the dock is that driver, that the physical tractor or trailer is the assigned equipment, that a shipper-facing pickup authorization or secure pickup code was issued, or that a dock-side RELEASE or STOP was decided against those physical facts.",
        ],
      },
      {
        heading: "Secure Pickup as the next operating step",
        paragraphs: [
          "BOF Secure Pickup—Load Release Control—is the proposed extension of that existing chain to the point where freight changes hands. The conceptual sequence is not a new operating system. It is the current assignment and trip-release record carried one step further:",
        ],
        workflow: [
          "Load created",
          "Carrier verified",
          "Driver assigned",
          "Driver qualified / ready",
          "Tractor / trailer assigned",
          "Trip released",
          "Pickup authorization generated",
          "Driver arrives",
          "Driver identity reconciled",
          "Equipment identity reconciled",
          "Load authorization reconciled",
          "RELEASE or STOP",
          "Execution",
          "Proof",
        ],
      },
      {
        heading: "What still has to be built",
        paragraphs: [
          "Physical identity verification, physical equipment verification, and dock-side RELEASE or STOP are proposed capabilities. They would require additional development and integrations that BOF does not currently perform: identity verification, photo matching, liveness, VIN/plate/QR capture, GPS/geofence or telematics confirmation, a secure pickup code, and a shipper or dock workflow.",
          "Until those steps exist, BOF should not be described as preventing cargo theft or as having stopped a fictitious pickup. The truthful claim is narrower: the operating relationships those checks would bind to already exist inside BOF. Secure Pickup would extend them from the back office to the dock.",
        ],
        callout: {
          kicker: "Current vs proposed",
          title: "ASSIGNED IS NOT RELEASED AT THE DOCK",
          caption: "Illustrative distinction — not a live pickup screen",
          rows: [
            { label: "Current", value: "Who is assigned to this load?" },
            { label: "Proposed", value: "Is this arrival authorized to take it?" },
            { label: "Trip release", value: "Readiness / pre-trip / equipment status" },
            { label: "Pickup STOP", value: "Not currently implemented" },
          ],
        },
      },
      {
        heading: "From records to the point of transfer",
        paragraphs: [
          "BOF began by bringing transportation records and operational workflows together. The next step is to carry that authorization all the way to the point where freight changes hands.",
          'The question is no longer simply: "Are these documents valid?" It becomes: "Is this the right person, working for the right carrier, operating the right equipment, authorized to move the right load?"',
          "That is the difference between document verification and load release control.",
        ],
      },
    ],
  },
  {
    slug: "late-delivery-should-never-be-a-surprise",
    title: "A Late Delivery Should Never Be a Surprise: How BOF Turns Truck Tracking Into Proactive Operations",
    subtitle:
      "GPS tells you where the truck is. BOF tells you what that means for the operation—and what needs to happen next.",
    summary:
      "A late truck is an operational problem. An unmanaged late truck is an operational risk. BOF is built to turn location into context, exceptions, action, and documentation—not another GPS view.",
    category: "Technology in Trucking",
    date: "September 8, 2026",
    relatedLinks: [
      { label: "Open Command Center", href: "/command-center" },
      { label: "Open Dispatch Board", href: "/dispatch" },
      { label: "Open Exception Queue", href: "/dispatch?view=exceptions" },
    ],
    sections: [
      {
        heading: "A late truck is an operational problem",
        paragraphs: [
          "A delivery appointment is a commitment. When a truck is hours late, the receiving dock, the customer, the driver, and dispatch are already working from different facts. That gap is an operational problem before it is anything else.",
          "The harder failure is the unmanaged late truck: no one owns the delay, no one tells the receiver, and no one records what operations did next. A late truck is an operational problem. An unmanaged late truck is an operational risk.",
          `Recent [MSN reporting](${NEWS_SOURCE_HREF}) described an alleged case in which a truck arrived hours late for a delivery and a confrontation followed at a warehouse. This article uses that reporting as a real-world operational lesson. It is not a recap of the incident, and it does not treat violence as a product story.`,
        ],
      },
      {
        heading: "What the news story actually teaches operations",
        paragraphs: [
          `The public account, as [reported by MSN](${NEWS_SOURCE_HREF}), centers on a late arrival at a receiving facility. The operational question for a fleet is not what happened in the last minute at the dock. It is whether the delay was visible, owned, and communicated while there was still time to act.`,
          "If operations only learn that a truck is late when the receiver says so at the gate, the appointment problem has already become a people problem. Visibility, context, and a named next action are how a back office keeps a delay in the operating system instead of leaving it to chance at the dock.",
        ],
      },
      {
        heading: "Tracking Isn’t Enough",
        paragraphs: [
          "GPS answers one question: “Where is my truck?” That is useful. It is not an operating system.",
          "BOF is built around a different question: “Where is my truck, when will it arrive, why is it delayed, who needs to know, and what should operations do next?” Location without appointment, ETA, ownership, communication, and documentation is still a surprise waiting to happen.",
          "BackOfficeFleet is not a fleet tracker. Tracking is an input. The product value is turning operational information into visibility, context, exceptions, action, and a record of what the fleet did.",
        ],
      },
      {
        heading: "How BOF connects the operating picture",
        paragraphs: [
          "The operating model is to keep the load, the delivery appointment, truck location, ETA, driver status, and the operations response on one thread—then document the exception instead of reconstructing it after the fact.",
          "Some of that thread already exists in the BOF product experience. [Dispatch](/dispatch) already carries the load, pickup and delivery times, assigned driver, demo movement/ETA context, and an [exception queue](/dispatch?view=exceptions). The [Command Center](/command-center) already turns blocked or at-risk work into an owned queue with a recommended next action.",
          "Other signals are demonstrated in the demo rather than claimed as live production feeds: map position and ETA on Dispatch are derived from demo route progress, not a live GPS network. Weather, traffic, and HOS appear in demo operating context where they are available in the scenario. They are not presented here as live third-party integrations.",
          "Automatic detection of a delivery-at-risk exception from a live GPS-to-appointment deviation, and automatic driver or receiver notification from that exception, is the conceptual operating model described below—not a current live BOF engine.",
        ],
        workflow: [
          "Load / Appointment",
          "Truck Location",
          "ETA",
          "Delay Detected",
          "Delivery-at-Risk Exception",
          "Operations Intervention",
          "Driver / Receiver Communication",
          "Revised Plan",
          "Documentation",
        ],
      },
      {
        heading: "What BOF Could Have Changed",
        paragraphs: [
          `BOF cannot control human behavior. It cannot guarantee that the alleged incident described in the [MSN report](${NEWS_SOURCE_HREF}) would not have occurred. No operations platform should claim that.`,
          "In a hypothetical situation of this type, the useful change is earlier operational visibility. If a significant ETA deviation is identified before the truck reaches the receiving facility, operations has an opportunity to intervene: talk with the driver, notify the receiver, address the appointment problem, reset the plan, and document the response.",
          "That is not a promise that conflict disappears. It is a narrower, honest claim: unmanaged lateness should not be a surprise at the dock. The exception should be visible while there is still an operations decision to make.",
        ],
        callout: {
          kicker: "Conceptual operating model",
          title: "DELIVERY AT RISK",
          caption: "Illustrative — not a live BOF screen",
          rows: [
            { label: "Scheduled", value: "1:00 PM" },
            { label: "Current ETA", value: "2:42 PM" },
            { label: "Delay", value: "102 minutes" },
            { label: "Status", value: "Operations Action Required" },
          ],
        },
      },
      {
        heading: "Where this already shows up in BOF",
        paragraphs: [
          "You do not need a new module to see the pattern. Open the [Dispatch board](/dispatch) for the load, appointment window, driver assignment, and demo location/ETA context. Open the [exception queue](/dispatch?view=exceptions) for how BOF already attaches an exception to a load and keeps a reason on the record. Open the [Command Center](/command-center) for the owner queue: what needs attention, why it matters, and who acts next.",
          "Those experiences demonstrate exception thinking, movement context, and operational ownership. They do not demonstrate a live GPS-to-appointment Delivery-at-Risk engine. The card above is a conceptual example of how that exception should read if and when that operating model is fully connected.",
        ],
      },
      {
        heading: "Exceptions should become visible before they become emergencies",
        paragraphs: [
          "A late delivery should never be a surprise. Location is not enough. Operations needs the meaning of the location: the appointment, the ETA, the delay, the people who must be told, and the action that follows.",
          "Exceptions should become visible before they become emergencies.",
        ],
      },
    ],
  },
  {
    slug: "enforcement-engine-trucking-back-office",
    title: "Why Trucking Back Offices Need Enforcement, Not More Dashboards",
    subtitle:
      "The next generation of trucking operations will not be won by better dashboards. It will be won by systems that enforce readiness, proof, accountability, and cash-flow control.",
    summary:
      "Dashboards show what happened. Enforcement engines stop operational drift before it becomes lost revenue, missing proof, or settlement disputes.",
    category: "Enforcement Philosophy",
    date: "May 22, 2026",
    relatedLinks: [
      { label: "Open Command Center", href: "/command-center" },
      { label: "Explore Dispatch Proof Workflow", href: "/dispatch" },
    ],
    sections: [
      {
        heading: "Dashboards show the problem too late",
        paragraphs: [
          "Most back-office tools tell a fleet what already happened: a driver was not ready, a proof packet was late, a settlement was held, or a customer escalated. That visibility is useful, but it is not enough. By the time the issue appears on a dashboard, the operation may already be exposed.",
          "Trucking needs systems that prevent drift before it becomes failure. That means readiness gates, proof requirements, ownership, and release decisions must be part of the workflow itself.",
        ],
      },
      {
        heading: "Enforcement prevents operational drift",
        paragraphs: [
          "An enforcement engine does not simply display a missing document. It blocks the next step, assigns an owner, and keeps the issue attached to the load, driver, settlement, or customer record until it is resolved.",
          "Dispatch, compliance, documents, settlements, safety, and finance cannot operate as disconnected teams if the fleet wants consistent execution. Every workflow needs a gate. Every gate needs an owner. Every owner must be accountable.",
        ],
      },
      {
        heading: "Where BOF fits",
        paragraphs: [
          "BackOfficeFleet is built around that operating principle. The Command Center turns open risk into a priority queue. The Dispatch Proof Workflow shows which loads are blocked, which proof is missing, and which release decisions need attention.",
          "The result is not another dashboard. It is a back-office operating system that helps a fleet enforce the work before the work drifts.",
        ],
      },
    ],
  },
  {
    slug: "proof-packets-settlements-cash-flow",
    title: "Why Proof Packets Control Settlement and Cash Flow",
    subtitle: "In trucking, the difference between revenue earned and revenue collected is often the proof packet.",
    summary:
      "BOLs, PODs, invoices, seal records, accessorials, and claim evidence are not paperwork. They are the controls that determine whether cash moves.",
    category: "Fleet Profitability",
    date: "May 22, 2026",
    relatedLinks: [
      { label: "View Settlements & Factoring", href: "/settlements" },
      { label: "Open Document Vault", href: "/documents" },
    ],
    sections: [
      {
        heading: "Proof is operational currency",
        paragraphs: [
          "A load can be delivered and still fail financially if the proof packet is incomplete. Rate confirmations, BOLs, PODs, invoices, seal records, RFID proof, lumper support, accessorial records, and claim evidence all determine whether billing, factoring, and settlement can move cleanly.",
          "When proof lives in email threads, phone photos, shared drives, and memory, the fleet loses time. The question is no longer whether the load moved. The question becomes whether the back office can prove it moved correctly.",
        ],
      },
      {
        heading: "Missing proof delays money",
        paragraphs: [
          "Settlement holds and factoring delays often begin as small proof gaps: a missing POD, a mismatched seal record, an unresolved accessorial, or claim evidence that is not tied to the load. Those gaps create downstream friction for drivers, finance teams, customers, and insurers.",
          "A serious fleet needs proof requirements to be part of the load lifecycle, not a cleanup task after delivery.",
        ],
      },
      {
        heading: "Where BOF fits",
        paragraphs: [
          "BackOfficeFleet connects dispatch proof to settlement and finance readiness. The proof packet is visible before the load becomes a billing problem, and the settlement view can show exactly what is ready, what is held, and what evidence supports release.",
          "That is how a back office protects cash flow without turning every load into a manual audit.",
        ],
      },
    ],
  },
  {
    slug: "driver-readiness-dispatch-failure",
    title: "How Driver Readiness Prevents Dispatch Failure",
    subtitle: "A truck can be available and a load can be booked, but dispatch still fails if the driver is not ready.",
    summary:
      "A load is not ready if the driver is not ready. Dispatch eligibility depends on documents, safety, maintenance, and proof obligations.",
    category: "Compliance Modernization",
    date: "May 22, 2026",
    relatedLinks: [
      { label: "Review Driver Readiness", href: "/drivers" },
      { label: "Open Command Center", href: "/command-center" },
    ],
    sections: [
      {
        heading: "Readiness is more than availability",
        paragraphs: [
          "A driver may be physically available and still be operationally blocked. CDL status, medical card readiness, MVR posture, policy acknowledgments, open safety events, maintenance defects, and pre-trip requirements all affect whether dispatch should release the load.",
          "Treating driver readiness as an HR filing task creates preventable dispatch failure. The readiness signal belongs in dispatch, safety, compliance, and management views.",
        ],
      },
      {
        heading: "Readiness should gate dispatch",
        paragraphs: [
          "If a driver has an unresolved safety action, expired credential, missing policy acknowledgment, or open equipment defect, the system should surface the issue before the load moves. Pre-trip proof and safety checks reduce risk because they make readiness visible at the moment of dispatch.",
          "The point is not to slow the fleet down. The point is to keep preventable failures from moving into the customer lane.",
        ],
      },
      {
        heading: "Where BOF fits",
        paragraphs: [
          "BackOfficeFleet connects the driver vault, dispatch eligibility, safety events, maintenance status, and command center queue. That lets managers see why a driver is ready, why a driver is blocked, and who owns the next action.",
          "Dispatch readiness becomes a controlled workflow instead of a last-minute scramble.",
        ],
      },
    ],
  },
];

const CATEGORIES = [
  "Load Release Control",
  "Enforcement Philosophy",
  "Technology in Trucking",
  "Fleet Profitability",
  "Compliance Modernization",
  "BackOfficeFleet Vision",
] as const;

const LINK_TOKEN = /(\[[^\]]+\]\([^)]+\))/g;

const ALLOWED_ARTICLE_HOSTS = new Set([
  "www.msn.com",
  "dsp.delaware.gov",
  "www.fbi.gov",
  "www.ic3.gov",
  "www.fmcsa.dot.gov",
  "safer.fmcsa.dot.gov",
]);

function isAllowedArticleHref(href: string) {
  if (href.startsWith("/")) return true;
  try {
    const url = new URL(href);
    return url.protocol === "https:" && ALLOWED_ARTICLE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function renderArticleText(text: string): ReactNode {
  const parts = text.split(LINK_TOKEN);
  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) {
      return part;
    }
    const [, label, href] = match;
    if (!isAllowedArticleHref(href)) {
      return part;
    }
    if (href.startsWith("/")) {
      return (
        <Link
          key={`${href}-${index}`}
          href={href}
          className="font-bold text-[#2F80ED] underline-offset-4 hover:underline"
        >
          {label}
        </Link>
      );
    }
    return (
      <a
        key={`${href}-${index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-[#2F80ED] underline-offset-4 hover:underline"
      >
        {label}
      </a>
    );
  });
}

function ConceptualWorkflow({ steps }: { steps: string[] }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        Conceptual operating workflow
      </p>
      <ol className="mt-4 flex flex-col gap-2">
        {steps.map((step, stepIndex) => (
          <li key={step} className="flex items-start gap-3 text-sm font-semibold text-[#0A1A2F]">
            <span className="mt-0.5 inline-flex min-w-6 justify-center text-xs font-bold uppercase tracking-wide text-slate-400">
              {stepIndex + 1}
            </span>
            <span>
              {step}
              {stepIndex < steps.length - 1 ? (
                <span className="mt-1 block text-xs font-medium text-slate-400">↓</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function getFleetIntelligenceArticle(slug: string) {
  return FLEET_INTELLIGENCE_ARTICLES.find((article) => article.slug === slug);
}

export function FleetIntelligenceIndexPage() {
  return (
    <main className="bg-slate-50 text-slate-950">
      <section id="blog-hero" className="bg-[#0A1A2F] text-white">
        <div className="bof-mkt-container py-20 md:py-28">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#2F80ED]">Fleet Intelligence</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Fleet Intelligence</h1>
          <p className="mt-5 max-w-3xl text-xl font-semibold text-slate-200">Insights from the Enforcement Engine</p>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            BackOfficeFleet publishes operational intelligence to help fleets modernize their back office, eliminate
            drift, and enforce workflows that protect profitability.
          </p>
        </div>
      </section>

      <section id="featured-articles" className="bof-home-section bof-home-section--white">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Featured Articles</p>
            <h2>Operational thinking for enforcement-driven fleets.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {FLEET_INTELLIGENCE_ARTICLES.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#2F80ED] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F80ED]"
              >
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#2F80ED]">
                  {article.category}
                </span>
                <h3 className="mt-5 text-2xl font-black leading-tight text-[#0A1A2F]">{article.title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">{article.summary}</p>
                <strong className="mt-6 inline-flex text-sm font-black text-[#2F80ED]">Read article -&gt;</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="categories" className="bof-home-section bof-home-section--soft">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Categories</p>
            <h2>Where the enforcement engine shows up.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((category) => (
              <span key={category} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#2E3A45] shadow-sm">
                {category}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="blog-cta" className="bof-home-section bof-home-section--ink">
        <div className="bof-mkt-container rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center md:p-12">
          <h2>Ready to enforce your back office?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Explore the operating system or apply to help shape the Founding Fleet Program.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Request a BOF Assessment
            </Link>
            <Link href="/command-center" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              See BOF in Action
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export function FleetIntelligenceArticlePage({ article }: { article: FleetIntelligenceArticle }) {
  return (
    <main className="bg-white text-slate-950">
      <article>
        <header className="bg-[#0A1A2F] text-white">
          <div className="bof-mkt-container py-16 md:py-24">
            <Link href="/blog" className="text-sm font-bold uppercase tracking-[0.24em] text-[#2F80ED]">
              Fleet Intelligence
            </Link>
            <p className="mt-5 text-sm font-semibold text-slate-300">{article.category} | {article.date}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">{article.title}</h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-200">{article.subtitle}</p>
          </div>
        </header>

        <div className="bof-mkt-container grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="max-w-3xl">
            {article.sections.map((section) => (
              <section key={section.heading} className="border-b border-slate-200 py-8 first:pt-0 last:border-b-0">
                <h2 className="text-3xl font-black tracking-tight text-[#0A1A2F]">{section.heading}</h2>
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={`${section.heading}-${paragraphIndex}`} className="mt-5 text-lg leading-8 text-[#2E3A45]">
                    {renderArticleText(paragraph)}
                  </p>
                ))}
                {section.workflow ? (
                  <ConceptualWorkflow steps={section.workflow} />
                ) : null}
                {section.callout ? (
                  <aside className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{section.callout.kicker}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{section.callout.caption}</p>
                    <p className="mt-5 text-2xl font-black tracking-[0.08em] text-[#0A1A2F]">{section.callout.title}</p>
                    <dl className="mt-5 grid gap-3">
                      {section.callout.rows.map((row) => (
                        <div key={row.label} className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
                          <dt className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{row.label}</dt>
                          <dd className="text-right text-sm font-bold text-[#0A1A2F]">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </aside>
                ) : null}
              </section>
            ))}
          </div>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2F80ED]">Related demo workflows</p>
            <div className="mt-5 grid gap-3">
              {article.relatedLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#0A1A2F] transition hover:border-[#2F80ED] hover:text-[#2F80ED]">
                  {link.label}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </article>

      <section className="bof-home-section bof-home-section--ink">
        <div className="bof-mkt-container rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center md:p-12">
          <h2>Turn this thinking into an enforced operating system.</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Request a BOF Assessment
            </Link>
            <Link href="/command-center" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              See BOF in Action
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
