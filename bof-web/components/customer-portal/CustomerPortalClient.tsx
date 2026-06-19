"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BofLogo } from "@/components/BofLogo";
import styles from "./CustomerPortal.module.css";

export type CustomerPortalPage =
  | "home"
  | "load-intake"
  | "quotes"
  | "shipments"
  | "assignment"
  | "documents"
  | "tracking"
  | "billing";

type DocumentTab = "bol" | "rate" | "invoice" | "pod" | "factoring";

type LoadDraft = {
  customerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  pickupLocation: string;
  deliveryLocation: string;
  pickupWindow: string;
  deliveryWindow: string;
  commodity: string;
  weight: number;
  dimensions: string;
  pallets: number;
  equipmentType: "reefer" | "dry van" | "flatbed" | "box truck";
  temperatureRequirement: string;
  hazmat: boolean;
  highValue: boolean;
  fragile: boolean;
  stops: number;
  pickupInstructions: string;
  deliveryInstructions: string;
  specialInstructions: string;
  lumperExpected: "Yes" | "No" | "Possible";
  accessorials: string;
  miles: number;
};

type PortalState = {
  quoteApproved: boolean;
  packetGenerated: boolean;
  driver: string;
  tractor: string;
  trailer: string;
  selectedLoadId: string;
  trackingStage: string;
  draft: LoadDraft;
};

type QuoteBreakdown = {
  base: number;
  fuel: number;
  equipment: number;
  accessorial: number;
  discount: number;
  margin: number;
  total: number;
};

type QueueLoad = {
  loadId: string;
  shipmentNumber: string;
  customerName: string;
  lane: string;
  commodity: string;
  equipment: string;
  status: string;
  nextAction: string;
  quoteTotal: number;
  proofNeeds: string;
  driver?: string;
  tractor?: string;
  trailer?: string;
};

const STORAGE_KEY = "bofCustomerLoadIntakeState";
const MAIN_LOAD_ID = "BOF-LD-86240";
const SHIPMENT_NUMBER = "SHP-86240-DAL-MEM";
const BOL_NUMBER = "BOL-86240-PVF";
const RATE_CONFIRMATION = "RC-86240-DAL-MEM";
const INVOICE_NUMBER = "INV-86240-PVF";
const SEAL_NUMBER = "SEAL-806240";

const defaultDraft: LoadDraft = {
  customerName: "Prairie View Foods",
  contactName: "Elena Brooks",
  contactEmail: "ops@pvfoods.example",
  contactPhone: "214-782-1184",
  pickupLocation: "Prairie View Cold Dock, 1420 Commerce Loop, Dallas, TX 75212",
  deliveryLocation: "Riverbend Grocery DC, 3100 Distribution Way, Memphis, TN 38118",
  pickupWindow: "June 19, 2026, 08:00-10:00 CT",
  deliveryWindow: "June 20, 2026, 13:00-15:00 CT",
  commodity: "Packaged refrigerated grocery freight",
  weight: 34200,
  dimensions: "22 standard 48 x 40 pallets, wrapped and labeled",
  pallets: 22,
  equipmentType: "reefer",
  temperatureRequirement: "34-38 F continuous",
  hazmat: false,
  highValue: false,
  fragile: false,
  stops: 2,
  pickupInstructions: "Dock 3 appointment required. Driver checks in with shipping office and confirms reefer pre-cool before loading.",
  deliveryInstructions: "Receiver requires seal match, signed BOL, dock photo, and temperature record at check-in.",
  specialInstructions: "Maintain continuous temperature. Call BOF dispatch if detention approaches 60 minutes.",
  lumperExpected: "Possible",
  accessorials: "Detention, reefer pre-cool, seal record, cargo photos",
  miles: 452,
};

const defaultState: PortalState = {
  quoteApproved: false,
  packetGenerated: false,
  driver: "John Carter - DRV-001",
  tractor: "TR-4812",
  trailer: "RF-2207",
  selectedLoadId: MAIN_LOAD_ID,
  trackingStage: "Approved",
  draft: defaultDraft,
};

const navItems: Array<{ page: CustomerPortalPage; href: string; label: string }> = [
  { page: "load-intake", href: "/customer-portal/load-intake/", label: "Load Intake" },
  { page: "quotes", href: "/customer-portal/quotes/", label: "Quote" },
  { page: "shipments", href: "/customer-portal/shipments/", label: "Active Shipments" },
  { page: "assignment", href: "/customer-portal/assignment/", label: "Assignment" },
  { page: "documents", href: "/customer-portal/documents/#bol", label: "BOL Packet" },
  { page: "tracking", href: "/customer-portal/tracking/", label: "Tracking" },
  { page: "billing", href: "/customer-portal/billing/", label: "Billing/Factoring" },
];

const drivers = ["John Carter - DRV-001", "Maya Wells - DRV-014", "Andre Sloan - DRV-026"];
const tractors = ["TR-4812", "TR-5104", "TR-3920"];
const trailers = ["RF-2207", "DV-1188", "FB-7302"];

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateQuote(draft: LoadDraft): QuoteBreakdown {
  const rateByEquipment = {
    reefer: 3.2,
    "dry van": 2.85,
    flatbed: 3.35,
    "box truck": 2.55,
  };
  const base = Math.max(850, draft.miles * rateByEquipment[draft.equipmentType]);
  const fuel = draft.miles * 0.46;
  const equipment =
    draft.equipmentType === "reefer"
      ? 325
      : draft.equipmentType === "flatbed"
        ? 240
        : draft.equipmentType === "box truck"
          ? 125
          : 0;
  const accessorial =
    150 +
    (draft.stops > 2 ? (draft.stops - 2) * 85 : 0) +
    (/yes|possible/i.test(draft.lumperExpected) ? 95 : 0);
  const premiumMultiplier =
    draft.highValue || draft.fragile || draft.hazmat
      ? 1.12
      : /today|expedite|urgent/i.test(`${draft.pickupWindow} ${draft.accessorials}`)
        ? 1.08
        : 1;
  const subtotal = (base + fuel + equipment + accessorial) * premiumMultiplier;
  const discount = subtotal * 0.035;
  const margin = subtotal * 0.11;
  return {
    base,
    fuel,
    equipment,
    accessorial,
    discount,
    margin,
    total: Math.round(subtotal - discount),
  };
}

function loadState(): PortalState {
  if (typeof window === "undefined") return defaultState;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;
    const parsed = JSON.parse(stored) as Partial<PortalState>;
    return {
      ...defaultState,
      ...parsed,
      draft: { ...defaultDraft, ...(parsed.draft ?? {}) },
    };
  } catch {
    return defaultState;
  }
}

function requiredDraftComplete(draft: LoadDraft) {
  return Boolean(
    draft.customerName &&
      draft.contactName &&
      draft.contactEmail &&
      draft.pickupLocation &&
      draft.deliveryLocation &&
      draft.pickupWindow &&
      draft.deliveryWindow &&
      draft.commodity &&
      draft.weight &&
      draft.pallets &&
      draft.equipmentType,
  );
}

export function CustomerPortalClient({ page }: { page: CustomerPortalPage }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<PortalState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocumentTab>("bol");

  useEffect(() => {
    const nextState = loadState();
    setState(nextState);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (page !== "documents" || typeof window === "undefined") return;
    const requested = window.location.hash.replace("#", "") as DocumentTab;
    if (["bol", "rate", "invoice", "pod", "factoring"].includes(requested)) {
      setActiveDoc(requested);
    }
  }, [page]);

  const quote = useMemo(() => calculateQuote(state.draft), [state.draft]);
  const approvedStatus = state.quoteApproved ? "Approved" : "Temporary quote - pending BOF review";
  const complianceReady = Boolean(state.driver && state.tractor && state.trailer);
  const dispatchReady =
    requiredDraftComplete(state.draft) &&
    state.quoteApproved &&
    complianceReady &&
    state.packetGenerated;

  const queueLoads: QueueLoad[] = [
    {
      loadId: MAIN_LOAD_ID,
      shipmentNumber: SHIPMENT_NUMBER,
      customerName: state.draft.customerName,
      lane: "Dallas, TX to Memphis, TN",
      commodity: state.draft.commodity,
      equipment: state.draft.equipmentType === "reefer" ? "53 ft reefer" : state.draft.equipmentType,
      status: state.quoteApproved ? "Approved - pending dispatch review" : "Quoted - customer review",
      nextAction: dispatchReady ? "Ready for pickup release" : "Confirm readiness gates",
      quoteTotal: quote.total,
      proofNeeds: "Seal photo, cargo photo, POD, temperature record",
      driver: state.driver,
      tractor: state.tractor,
      trailer: state.trailer,
    },
    {
      loadId: "BOF-LD-86241",
      shipmentNumber: "SHP-86241-ATL-CLT",
      customerName: "Summit Retail Group",
      lane: "Atlanta, GA to Charlotte, NC",
      commodity: "Retail dry van replenishment",
      equipment: "53 ft dry van",
      status: "Driver assignment needed",
      nextAction: "Dispatch review before release",
      quoteTotal: 1742,
      proofNeeds: "Pickup photos, delivery POD, empty trailer photo",
    },
    {
      loadId: "BOF-LD-86242",
      shipmentNumber: "SHP-86242-PHX-LAX",
      customerName: "Northstar Medical Devices",
      lane: "Phoenix, AZ to Los Angeles, CA",
      commodity: "High-value fragile devices",
      equipment: "Air-ride dry van",
      status: "Equipment assignment needed",
      nextAction: "Confirm high-value proof packet",
      quoteTotal: 3428,
      proofNeeds: "Cargo photos, seal chain, POD, exception review",
    },
  ];

  const selectedLoad = queueLoads.find((load) => load.loadId === state.selectedLoadId) ?? queueLoads[0];

  function commit(next: PortalState) {
    setState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }

  function updateDraft<K extends keyof LoadDraft>(key: K, value: LoadDraft[K]) {
    commit({ ...state, draft: { ...state.draft, [key]: value } });
  }

  function approveQuote() {
    commit({
      ...state,
      quoteApproved: true,
      packetGenerated: true,
      selectedLoadId: MAIN_LOAD_ID,
      trackingStage: "Approved",
    });
    router.push("/customer-portal/shipments/");
  }

  function requestReview() {
    commit({ ...state, trackingStage: "BOF review requested" });
  }

  function quickAssign() {
    commit({
      ...state,
      driver: state.driver || drivers[0],
      tractor: state.tractor || tractors[0],
      trailer: state.trailer || trailers[0],
      selectedLoadId: MAIN_LOAD_ID,
    });
  }

  return (
    <main className={styles.portalShell}>
      <header className={styles.portalHeader}>
        <Link href="/" aria-label="BackOfficeFleet public homepage" className={styles.logoLink}>
          <BofLogo variant="light" priority />
        </Link>
        <div className={styles.headerCopy}>
          <p>Customer portal simulation</p>
          <h1>Load intake to settlement visibility</h1>
        </div>
        <Link href="/customer-portal/load-intake/" className={styles.headerCta}>
          Start Load Intake
        </Link>
      </header>

      <nav className={styles.workflowNav} aria-label="Customer portal workflow">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              styles.navItem,
              item.page === page || pathname === item.href ? styles.navItemActive : "",
            ].join(" ")}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <section className={styles.statusStrip}>
        <StatusPill label="Load" value={MAIN_LOAD_ID} />
        <StatusPill label="Shipment" value={SHIPMENT_NUMBER} />
        <StatusPill label="Quote" value={money(quote.total)} />
        <StatusPill label="Approval" value={state.quoteApproved ? "Approved" : "Pending"} tone={state.quoteApproved ? "good" : "warn"} />
        <StatusPill label="Dispatch" value={dispatchReady ? "Ready for pickup" : "Review gates"} tone={dispatchReady ? "good" : "warn"} />
      </section>

      {page === "home" && (
        <HomePage quoteTotal={quote.total} approved={state.quoteApproved} dispatchReady={dispatchReady} />
      )}
      {page === "load-intake" && (
        <LoadIntakePage draft={state.draft} quote={quote} updateDraft={updateDraft} />
      )}
      {page === "quotes" && (
        <QuotePage
          draft={state.draft}
          quote={quote}
          approvedStatus={approvedStatus}
          approved={state.quoteApproved}
          approveQuote={approveQuote}
          requestReview={requestReview}
        />
      )}
      {page === "shipments" && (
        <ShipmentsPage
          loads={queueLoads}
          selectedLoad={selectedLoad}
          selectLoad={(loadId) => commit({ ...state, selectedLoadId: loadId })}
          dispatchReady={dispatchReady}
          approved={state.quoteApproved}
        />
      )}
      {page === "assignment" && (
        <AssignmentPage
          state={state}
          setDriver={(driver) => commit({ ...state, driver })}
          setTractor={(tractor) => commit({ ...state, tractor })}
          setTrailer={(trailer) => commit({ ...state, trailer })}
          quickAssign={quickAssign}
          complianceReady={complianceReady}
          dispatchReady={dispatchReady}
        />
      )}
      {page === "documents" && (
        <DocumentsPage
          draft={state.draft}
          quoteTotal={quote.total}
          activeDoc={activeDoc}
          setActiveDoc={setActiveDoc}
          approved={state.quoteApproved}
          packetGenerated={state.packetGenerated}
          markPacketReady={() => commit({ ...state, packetGenerated: true })}
        />
      )}
      {page === "tracking" && (
        <TrackingPage quoteTotal={quote.total} approved={state.quoteApproved} dispatchReady={dispatchReady} />
      )}
      {page === "billing" && (
        <BillingPage quoteTotal={quote.total} approved={state.quoteApproved} />
      )}
    </main>
  );
}

function StatusPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <div className={[styles.statusPill, styles[tone]].join(" ")}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function HomePage({
  quoteTotal,
  approved,
  dispatchReady,
}: {
  quoteTotal: number;
  approved: boolean;
  dispatchReady: boolean;
}) {
  const cards = [
    {
      href: "/customer-portal/load-intake/",
      title: "Load Intake",
      body: "Capture shipper details, equipment needs, proof requirements, and special handling notes in one customer-facing request.",
    },
    {
      href: "/customer-portal/quotes/",
      title: "Configurable Demo Quote",
      body: `Show a temporary quote of ${money(quoteTotal)} with BOF review language before the load reaches dispatch.`,
    },
    {
      href: "/customer-portal/documents/#bol",
      title: "BOL Packet",
      body: "Review draft transportation paperwork, proof checklist, seal record, rate confirmation, invoice, POD, and factoring packet previews.",
    },
    {
      href: "/customer-portal/tracking/",
      title: "Shipment Tracking",
      body: "Give the customer a plain-language view of assignment, pickup, transit, delivery, documents, settlement, and factoring status.",
    },
  ];

  return (
    <section className={styles.pageGrid}>
      <div className={styles.heroPanel}>
        <p className={styles.eyebrow}>BOF customer workflow</p>
        <h2>From customer request to dispatch-ready packet without losing the shipment record.</h2>
        <p>
          This simulated customer portal shows how BOF can own the intake layer, keep quote and approval
          status consistent, and hand the same load into dispatch, documents, tracking, settlement, and factoring review.
        </p>
        <div className={styles.actionRow}>
          <Link href="/customer-portal/load-intake/" className={styles.primaryButton}>
            Start Load Intake
          </Link>
          <Link href="/customer-portal/shipments/" className={styles.secondaryButton}>
            View Active Shipments
          </Link>
        </div>
      </div>
      <aside className={styles.summaryPanel}>
        <h3>Current demo load</h3>
        <dl className={styles.summaryList}>
          <div>
            <dt>Load ID</dt>
            <dd>{MAIN_LOAD_ID}</dd>
          </div>
          <div>
            <dt>Quote total</dt>
            <dd>{money(quoteTotal)}</dd>
          </div>
          <div>
            <dt>Approval</dt>
            <dd>{approved ? "Approved and submitted" : "Waiting on customer approval"}</dd>
          </div>
          <div>
            <dt>Dispatch readiness</dt>
            <dd>{dispatchReady ? "Ready for pickup release" : "Readiness gates still visible"}</dd>
          </div>
        </dl>
      </aside>
      <div className={styles.cardGrid}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className={styles.routeCard}>
            <strong>{card.title}</strong>
            <span>{card.body}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function LoadIntakePage({
  draft,
  quote,
  updateDraft,
}: {
  draft: LoadDraft;
  quote: QuoteBreakdown;
  updateDraft: <K extends keyof LoadDraft>(key: K, value: LoadDraft[K]) => void;
}) {
  return (
    <section className={styles.twoColumn}>
      <form className={styles.formPanel}>
        <div className={styles.sectionTitle}>
          <p className={styles.eyebrow}>Customer load intake</p>
          <h2>Shipment request details</h2>
          <span>Core shipment fields are required before BOF can mark the load dispatch-ready.</span>
        </div>
        <div className={styles.formGrid}>
          <TextInput label="Customer name/account" value={draft.customerName} onChange={(value) => updateDraft("customerName", value)} required />
          <TextInput label="Contact name" value={draft.contactName} onChange={(value) => updateDraft("contactName", value)} required />
          <TextInput label="Contact email" value={draft.contactEmail} onChange={(value) => updateDraft("contactEmail", value)} required />
          <TextInput label="Contact phone" value={draft.contactPhone} onChange={(value) => updateDraft("contactPhone", value)} />
          <Textarea label="Pickup location" value={draft.pickupLocation} onChange={(value) => updateDraft("pickupLocation", value)} required />
          <Textarea label="Delivery location" value={draft.deliveryLocation} onChange={(value) => updateDraft("deliveryLocation", value)} required />
          <TextInput label="Pickup date/time window" value={draft.pickupWindow} onChange={(value) => updateDraft("pickupWindow", value)} required />
          <TextInput label="Delivery date/time window" value={draft.deliveryWindow} onChange={(value) => updateDraft("deliveryWindow", value)} required />
          <Textarea label="Commodity/load type" value={draft.commodity} onChange={(value) => updateDraft("commodity", value)} required />
          <TextInput label="Weight" value={String(draft.weight)} onChange={(value) => updateDraft("weight", Number(value) || 0)} type="number" required />
          <Textarea label="Dimensions/details" value={draft.dimensions} onChange={(value) => updateDraft("dimensions", value)} />
          <TextInput label="Pallet count" value={String(draft.pallets)} onChange={(value) => updateDraft("pallets", Number(value) || 0)} type="number" required />
          <label className={styles.field}>
            <span>Equipment type</span>
            <select value={draft.equipmentType} onChange={(event) => updateDraft("equipmentType", event.target.value as LoadDraft["equipmentType"])}>
              <option value="reefer">Reefer</option>
              <option value="dry van">Dry van</option>
              <option value="flatbed">Flatbed</option>
              <option value="box truck">Box truck</option>
            </select>
          </label>
          <TextInput label="Temperature requirement" value={draft.temperatureRequirement} onChange={(value) => updateDraft("temperatureRequirement", value)} />
          <TextInput label="Number of stops" value={String(draft.stops)} onChange={(value) => updateDraft("stops", Number(value) || 1)} type="number" />
          <label className={styles.field}>
            <span>Lumper expected</span>
            <select value={draft.lumperExpected} onChange={(event) => updateDraft("lumperExpected", event.target.value as LoadDraft["lumperExpected"])}>
              <option value="Possible">Possible</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </label>
          <Textarea label="Pickup instructions" value={draft.pickupInstructions} onChange={(value) => updateDraft("pickupInstructions", value)} />
          <Textarea label="Delivery instructions" value={draft.deliveryInstructions} onChange={(value) => updateDraft("deliveryInstructions", value)} />
          <Textarea label="Special instructions" value={draft.specialInstructions} onChange={(value) => updateDraft("specialInstructions", value)} />
          <Textarea label="Accessorials" value={draft.accessorials} onChange={(value) => updateDraft("accessorials", value)} />
        </div>
        <div className={styles.checkboxRow}>
          <Toggle label="Hazmat" checked={draft.hazmat} onChange={(checked) => updateDraft("hazmat", checked)} />
          <Toggle label="High-value" checked={draft.highValue} onChange={(checked) => updateDraft("highValue", checked)} />
          <Toggle label="Fragile" checked={draft.fragile} onChange={(checked) => updateDraft("fragile", checked)} />
        </div>
        <div className={styles.uploadBox}>
          <span>Cargo photo upload</span>
          <strong>Demo placeholder ready</strong>
          <p>In the BOF walkthrough, this becomes the cargo photo record attached to the shipment packet.</p>
        </div>
      </form>
      <QuoteAside quote={quote} />
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  required?: boolean;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <textarea value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.toggle}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function QuoteAside({ quote }: { quote: QuoteBreakdown }) {
  return (
    <aside className={styles.quotePanel}>
      <p className={styles.eyebrow}>Configurable demo pricing</p>
      <h2>{money(quote.total)}</h2>
      <span className={styles.badgeWarn}>Temporary quote - pending dispatch review</span>
      <dl className={styles.quoteBreakdown}>
        <div>
          <dt>Estimated mileage</dt>
          <dd>452 mi</dd>
        </div>
        <div>
          <dt>Base linehaul</dt>
          <dd>{money(quote.base)}</dd>
        </div>
        <div>
          <dt>Fuel surcharge</dt>
          <dd>{money(quote.fuel)}</dd>
        </div>
        <div>
          <dt>Equipment surcharge</dt>
          <dd>{money(quote.equipment)}</dd>
        </div>
        <div>
          <dt>Accessorial estimate</dt>
          <dd>{money(quote.accessorial)}</dd>
        </div>
        <div>
          <dt>Customer discount</dt>
          <dd>-{money(quote.discount)}</dd>
        </div>
        <div>
          <dt>Estimated BOF margin</dt>
          <dd>{money(quote.margin)}</dd>
        </div>
      </dl>
      <Link href="/customer-portal/quotes/" className={styles.primaryButton}>
        Review Quote
      </Link>
    </aside>
  );
}

function QuotePage({
  draft,
  quote,
  approvedStatus,
  approved,
  approveQuote,
  requestReview,
}: {
  draft: LoadDraft;
  quote: QuoteBreakdown;
  approvedStatus: string;
  approved: boolean;
  approveQuote: () => void;
  requestReview: () => void;
}) {
  return (
    <section className={styles.twoColumn}>
      <div className={styles.contentPanel}>
        <p className={styles.eyebrow}>Quote approval</p>
        <h2>{draft.customerName} temporary quote</h2>
        <p>
          BOF displays a customer-safe estimate for this simulated workflow. Final carrier release still depends on
          dispatch review, assignment, compliance readiness, and packet generation.
        </p>
        <div className={styles.quoteHero}>
          <span>{approvedStatus}</span>
          <strong>{money(quote.total)}</strong>
        </div>
        <div className={styles.actionRow}>
          <button className={styles.primaryButton} type="button" onClick={approveQuote}>
            Approve quote and submit load
          </button>
          <button className={styles.secondaryButton} type="button" onClick={requestReview}>
            Request review
          </button>
          <Link href="/customer-portal/load-intake/" className={styles.secondaryButton}>
            Save draft
          </Link>
        </div>
        {approved && <p className={styles.successNote}>Approval is saved for this browser session and carried into dispatch gating.</p>}
      </div>
      <QuoteAside quote={quote} />
    </section>
  );
}

function ShipmentsPage({
  loads,
  selectedLoad,
  selectLoad,
  dispatchReady,
  approved,
}: {
  loads: QueueLoad[];
  selectedLoad: QueueLoad;
  selectLoad: (loadId: string) => void;
  dispatchReady: boolean;
  approved: boolean;
}) {
  return (
    <section className={styles.queueLayout}>
      <div className={styles.contentPanel}>
        <div className={styles.sectionTitle}>
          <p className={styles.eyebrow}>Dispatch queue integration</p>
          <h2>Active shipment requests</h2>
          <span>Each card keeps customer request, quote, assignment, next action, and proof needs in view.</span>
        </div>
        <div className={styles.shipmentGrid}>
          {loads.map((load) => (
            <button
              key={load.loadId}
              type="button"
              className={[styles.shipmentCard, load.loadId === selectedLoad.loadId ? styles.shipmentCardActive : ""].join(" ")}
              onClick={() => selectLoad(load.loadId)}
            >
              <span className={styles.badge}>{load.status}</span>
              <strong>{load.loadId}</strong>
              <span>{load.customerName}</span>
              <small>{load.lane}</small>
              <dl>
                <div>
                  <dt>Quote</dt>
                  <dd>{money(load.quoteTotal)}</dd>
                </div>
                <div>
                  <dt>Equipment</dt>
                  <dd>{load.equipment}</dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
      </div>
      <aside className={styles.summaryPanel}>
        <h3>Selected shipment</h3>
        <dl className={styles.summaryList}>
          <div>
            <dt>Load ID</dt>
            <dd>{selectedLoad.loadId}</dd>
          </div>
          <div>
            <dt>Shipment number</dt>
            <dd>{selectedLoad.shipmentNumber}</dd>
          </div>
          <div>
            <dt>Quote total</dt>
            <dd>{money(selectedLoad.quoteTotal)}</dd>
          </div>
          <div>
            <dt>Next action</dt>
            <dd>{selectedLoad.nextAction}</dd>
          </div>
          <div>
            <dt>Proof package</dt>
            <dd>{selectedLoad.proofNeeds}</dd>
          </div>
        </dl>
        <div className={styles.gateList}>
          <Gate label="Quote approved" passed={approved} />
          <Gate label="Dispatch readiness" passed={dispatchReady} />
        </div>
        <div className={styles.actionRow}>
          <Link href="/customer-portal/assignment/" className={styles.primaryButton}>
            Open Assignment
          </Link>
          <Link href="/customer-portal/documents/#bol" className={styles.secondaryButton}>
            Open BOL Packet
          </Link>
        </div>
      </aside>
    </section>
  );
}

function AssignmentPage({
  state,
  setDriver,
  setTractor,
  setTrailer,
  quickAssign,
  complianceReady,
  dispatchReady,
}: {
  state: PortalState;
  setDriver: (value: string) => void;
  setTractor: (value: string) => void;
  setTrailer: (value: string) => void;
  quickAssign: () => void;
  complianceReady: boolean;
  dispatchReady: boolean;
}) {
  return (
    <section className={styles.twoColumn}>
      <div className={styles.contentPanel}>
        <p className={styles.eyebrow}>Dispatch assignment</p>
        <h2>Driver and equipment readiness</h2>
        <p>
          This simulated dispatch step keeps the buyer focused on the gates BOF reviews before pickup release.
        </p>
        <div className={styles.assignmentGrid}>
          <Select label="Driver" value={state.driver} options={drivers} onChange={setDriver} />
          <Select label="Tractor" value={state.tractor} options={tractors} onChange={setTractor} />
          <Select label="Trailer" value={state.trailer} options={trailers} onChange={setTrailer} />
        </div>
        <div className={styles.actionRow}>
          <button className={styles.primaryButton} type="button" onClick={quickAssign}>
            Run BOF readiness check
          </button>
          <Link href="/customer-portal/documents/#bol" className={styles.secondaryButton}>
            Open BOL Packet
          </Link>
        </div>
      </div>
      <aside className={styles.summaryPanel}>
        <h3>Release gates</h3>
        <div className={styles.gateList}>
          <Gate label="Required load fields complete" passed={requiredDraftComplete(state.draft)} />
          <Gate label="Quote approved" passed={state.quoteApproved} />
          <Gate label="Driver assigned" passed={Boolean(state.driver)} />
          <Gate label="Tractor assigned" passed={Boolean(state.tractor)} />
          <Gate label="Trailer assigned" passed={Boolean(state.trailer)} />
          <Gate label="Compliance readiness passes" passed={complianceReady} />
          <Gate label="Pre-trip packet generated" passed={state.packetGenerated} />
        </div>
        <div className={dispatchReady ? styles.readyBox : styles.warningBox}>
          {dispatchReady ? "Ready for pickup release." : "Keep this load in pending dispatch review until every gate is green."}
        </div>
      </aside>
    </section>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Gate({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className={styles.gate}>
      <span className={passed ? styles.gatePass : styles.gateHold}>{passed ? "Pass" : "Hold"}</span>
      <strong>{label}</strong>
    </div>
  );
}

function DocumentsPage({
  draft,
  quoteTotal,
  activeDoc,
  setActiveDoc,
  approved,
  packetGenerated,
  markPacketReady,
}: {
  draft: LoadDraft;
  quoteTotal: number;
  activeDoc: DocumentTab;
  setActiveDoc: (tab: DocumentTab) => void;
  approved: boolean;
  packetGenerated: boolean;
  markPacketReady: () => void;
}) {
  const tabs: Array<{ id: DocumentTab; label: string }> = [
    { id: "bol", label: "BOL" },
    { id: "rate", label: "Rate Confirmation" },
    { id: "invoice", label: "Invoice" },
    { id: "pod", label: "POD Preview" },
    { id: "factoring", label: "Factoring Packet" },
  ];

  return (
    <section className={styles.documentLayout}>
      <div className={styles.documentToolbar}>
        <div>
          <p className={styles.eyebrow}>Shipment document package</p>
          <h2>Draft packet for {SHIPMENT_NUMBER}</h2>
        </div>
        <div className={styles.tabRow}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={[styles.docTab, activeDoc === tab.id ? styles.docTabActive : ""].join(" ")}
              onClick={() => setActiveDoc(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {activeDoc === "bol" && <BolDocument draft={draft} quoteTotal={quoteTotal} approved={approved} packetGenerated={packetGenerated} />}
      {activeDoc === "rate" && <SimpleDocument title="Draft Rate Confirmation" docId={RATE_CONFIRMATION} quoteTotal={quoteTotal} lines={["Carrier release pending BOF dispatch review.", "Customer-approved temporary quote is carried into the packet.", "Pickup, delivery, equipment, and proof requirements match the load record."]} />}
      {activeDoc === "invoice" && <SimpleDocument title="Draft Invoice" docId={INVOICE_NUMBER} quoteTotal={quoteTotal} lines={["Bill-to: Prairie View Foods", "Terms: Net 30", "Invoice remains draft until delivery proof and settlement review are complete."]} />}
      {activeDoc === "pod" && <SimpleDocument title="Proof of Delivery Preview" docId="POD-86240-DRAFT" quoteTotal={quoteTotal} lines={["Signed POD required at delivery.", "Empty trailer photo required after unload.", "Lumper receipt required if receiver uses lumper service."]} />}
      {activeDoc === "factoring" && <SimpleDocument title="Factoring Packet Preview" docId="FP-86240-DRAFT" quoteTotal={quoteTotal} lines={["Rate confirmation, invoice, BOL, POD, and proof photos are grouped for review.", "Packet is marked demo-ready after documents complete.", "No real factoring submission is performed in this static simulation."]} />}
      {!packetGenerated && (
        <button type="button" className={styles.primaryButton} onClick={markPacketReady}>
          Mark pre-trip packet generated
        </button>
      )}
    </section>
  );
}

function BolDocument({
  draft,
  quoteTotal,
  approved,
  packetGenerated,
}: {
  draft: LoadDraft;
  quoteTotal: number;
  approved: boolean;
  packetGenerated: boolean;
}) {
  return (
    <article className={styles.paper}>
      <div className={styles.paperHeader}>
        <div>
          <p className={styles.eyebrow}>Draft bill of lading</p>
          <h2>{BOL_NUMBER}</h2>
        </div>
        <div className={styles.badgeStack}>
          <span className={styles.badge}>Draft</span>
          <span className={approved ? styles.badgeGood : styles.badgeWarn}>{approved ? "Quote approved" : "Quote pending"}</span>
          <span className={packetGenerated ? styles.badgeGood : styles.badgeWarn}>{packetGenerated ? "Packet ready" : "Packet pending"}</span>
        </div>
      </div>
      <div className={styles.docMetaGrid}>
        <DocBox title="Shipper" lines={["Prairie View Cold Dock", draft.pickupLocation, draft.pickupInstructions]} />
        <DocBox title="Consignee" lines={["Riverbend Grocery DC", draft.deliveryLocation, draft.deliveryInstructions]} />
        <DocBox title="Carrier" lines={["BackOfficeFleet managed dispatch", "Driver: John Carter - DRV-001", "Tractor TR-4812 / Trailer RF-2207"]} />
        <DocBox title="Numbers" lines={[`Load ${MAIN_LOAD_ID}`, `Shipment ${SHIPMENT_NUMBER}`, `Seal ${SEAL_NUMBER}`, `Quote ${money(quoteTotal)}`]} />
      </div>
      <table className={styles.docTable}>
        <thead>
          <tr>
            <th>Commodity</th>
            <th>Weight</th>
            <th>Pallets</th>
            <th>Equipment</th>
            <th>Temperature</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{draft.commodity}</td>
            <td>{draft.weight.toLocaleString()} lb</td>
            <td>{draft.pallets}</td>
            <td>{draft.equipmentType === "reefer" ? "53 ft reefer" : draft.equipmentType}</td>
            <td>{draft.temperatureRequirement || "N/A"}</td>
          </tr>
        </tbody>
      </table>
      <div className={styles.bolLowerGrid}>
        <section>
          <h3>Special instructions</h3>
          <p>{draft.specialInstructions}</p>
          <p>{draft.accessorials}</p>
          <h3>Required pickup proof checklist</h3>
          <ul className={styles.checklist}>
            <li>Seal pickup photo with seal number visible</li>
            <li>Cargo photo before doors close</li>
            <li>Temperature record at pickup</li>
            <li>Signed shipper BOL</li>
          </ul>
        </section>
        <section className={styles.photoRecord}>
          <h3>Cargo photo record</h3>
          <Image src="/mocks/mock_cargo.jpg" alt="Demo cargo photo record" width={640} height={360} />
          <span>Demo image attached to {MAIN_LOAD_ID}</span>
        </section>
      </div>
      <div className={styles.readinessPanel}>
        <h3>BOF document readiness</h3>
        <Gate label="Rate confirmation drafted" passed />
        <Gate label="BOL drafted" passed />
        <Gate label="Seal number created" passed />
        <Gate label="Proof checklist attached" passed />
        <Gate label="Customer quote approved" passed={approved} />
      </div>
      <div className={styles.signatureGrid}>
        <div>
          <span>Shipper signature</span>
          <strong>Pending pickup</strong>
        </div>
        <div>
          <span>Driver signature</span>
          <strong>Pending pickup</strong>
        </div>
        <div>
          <span>Consignee signature</span>
          <strong>Pending delivery</strong>
        </div>
      </div>
    </article>
  );
}

function DocBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <section className={styles.docBox}>
      <h3>{title}</h3>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </section>
  );
}

function SimpleDocument({
  title,
  docId,
  quoteTotal,
  lines,
}: {
  title: string;
  docId: string;
  quoteTotal: number;
  lines: string[];
}) {
  return (
    <article className={styles.paper}>
      <div className={styles.paperHeader}>
        <div>
          <p className={styles.eyebrow}>Document preview</p>
          <h2>{title}</h2>
        </div>
        <span className={styles.badge}>Draft</span>
      </div>
      <div className={styles.docMetaGrid}>
        <DocBox title="Document ID" lines={[docId, MAIN_LOAD_ID, SHIPMENT_NUMBER]} />
        <DocBox title="Approved quote total" lines={[money(quoteTotal)]} />
        <DocBox title="Packet status" lines={["Demo preview", "Pending final BOF review"]} />
      </div>
      <ul className={styles.documentLines}>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </article>
  );
}

function TrackingPage({
  quoteTotal,
  approved,
  dispatchReady,
}: {
  quoteTotal: number;
  approved: boolean;
  dispatchReady: boolean;
}) {
  const steps = [
    ["Submitted", true],
    ["Quoted", true],
    ["Approved", approved],
    ["Assigned", dispatchReady],
    ["Picked Up", false],
    ["In Transit", false],
    ["Delivered", false],
    ["Documents Complete", false],
    ["Settlement Complete", false],
  ] as const;

  return (
    <section className={styles.contentPanel}>
      <p className={styles.eyebrow}>Customer shipment tracking</p>
      <h2>{SHIPMENT_NUMBER}</h2>
      <p>
        The tracking view keeps customer language simple while BOF manages proof collection, exceptions, settlement,
        and factoring packet readiness behind the scenes.
      </p>
      <div className={styles.timeline}>
        {steps.map(([label, done]) => (
          <div key={label} className={done ? styles.timelineDone : styles.timelineStep}>
            <span>{done ? "Complete" : "Pending"}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>
      <div className={styles.trackingGrid}>
        <DocBox title="Current record" lines={[MAIN_LOAD_ID, SHIPMENT_NUMBER, `Quote ${money(quoteTotal)}`]} />
        <DocBox title="Proof workflow" lines={["Pre-trip", "Seal pickup photo", "Cargo photo", "POD", "Empty trailer photo"]} />
        <DocBox title="Post-trip workflow" lines={["Claims review if exception exists", "Settlement review", "Factoring packet preview"]} />
      </div>
    </section>
  );
}

function BillingPage({ quoteTotal, approved }: { quoteTotal: number; approved: boolean }) {
  return (
    <section className={styles.twoColumn}>
      <div className={styles.contentPanel}>
        <p className={styles.eyebrow}>Billing and factoring</p>
        <h2>Draft billing packet</h2>
        <p>
          This page shows how BOF carries the same approved quote into invoice, settlement, and factoring review
          without suggesting a live financial submission.
        </p>
        <div className={styles.billingCards}>
          <DocBox title="Invoice" lines={[INVOICE_NUMBER, `Amount ${money(quoteTotal)}`, "Draft until delivery proof is complete"]} />
          <DocBox title="Settlement" lines={["Driver settlement pending", "Lumper receipt required if used", "Exception review open until delivery"]} />
          <DocBox title="Factoring packet" lines={["Rate confirmation", "Invoice", "BOL", "POD", "Photo proof bundle"]} />
        </div>
      </div>
      <aside className={styles.summaryPanel}>
        <h3>Billing readiness</h3>
        <div className={styles.gateList}>
          <Gate label="Quote total carried forward" passed />
          <Gate label="Customer approval recorded" passed={approved} />
          <Gate label="BOL packet linked" passed />
          <Gate label="POD pending delivery" passed={false} />
          <Gate label="Factoring packet preview ready" passed />
        </div>
        <Link href="/customer-portal/documents/#factoring" className={styles.primaryButton}>
          Open Factoring Preview
        </Link>
      </aside>
    </section>
  );
}
