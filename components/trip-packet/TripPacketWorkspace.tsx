"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  buildTripPacketWorkspaceModel,
  TRIP_PACKET_CATEGORIES,
  TRIP_PACKET_ROLES,
  visibleItemsForRole,
  type TripPacketRole,
  type TripPacketWorkspaceItem,
} from "@/lib/trip-packet-workspace";

type ExtractionResponse = {
  providerName: "local";
  status: "success" | "needs_review" | "failed";
  confidence: number;
  normalizedFields: Record<string, unknown>;
  extractedTextPreview: string;
  warnings: string[];
  fieldConfidence: Record<string, number>;
};

type PacketActivity = {
  id: string;
  label: string;
  detail: string;
};

const ROLE_STAGE_COPY: Record<TripPacketRole, { stage: string; primary: string; secondary: string }> = {
  dispatcher: {
    stage: "Dispatch assembly",
    primary: "Release packet to driver",
    secondary: "Return selected docs for correction",
  },
  driver: {
    stage: "Driver pre-trip signoff",
    primary: "Sign driver-ready packet",
    secondary: "Reject selected docs to dispatch",
  },
  manager: {
    stage: "Fleet-owner review",
    primary: "Approve operating release",
    secondary: "Escalate selected item",
  },
  customer: {
    stage: "Customer proof view",
    primary: "Confirm shipment documents",
    secondary: "Request corrected document",
  },
};

function isImage(url?: string) {
  return Boolean(url && /\.(png|jpe?g|webp|gif|svg)$/i.test(url));
}

function isPdf(url?: string) {
  return Boolean(url && /\.pdf(?:$|\?)/i.test(url));
}

function isHtml(url?: string) {
  return Boolean(url && /\.html?(?:$|\?)/i.test(url));
}

function statusClass(status: TripPacketWorkspaceItem["status"]) {
  if (status === "ready") return "border-emerald-400/45 bg-emerald-500/10 text-emerald-200";
  if (status === "pending") return "border-amber-400/45 bg-amber-500/10 text-amber-100";
  if (status === "not_applicable") return "border-slate-700 bg-slate-950 text-slate-400";
  return "border-red-400/45 bg-red-500/10 text-red-100";
}

function statusLabel(status: TripPacketWorkspaceItem["status"]) {
  if (status === "not_applicable") return "Not required";
  return String(status).replace(/_/g, " ");
}

function roleLabel(role: TripPacketRole) {
  return TRIP_PACKET_ROLES.find((item) => item.role === role)?.label ?? role;
}

function itemPreview(item: TripPacketWorkspaceItem, size: "small" | "large" = "small") {
  const url = item.canonicalUrl;
  const height = size === "large" ? "h-[420px]" : "h-28";

  if (url && isImage(url)) {
    return (
      <div className={`${height} overflow-hidden rounded-lg border border-slate-800 bg-slate-950`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  if (url && (isPdf(url) || isHtml(url))) {
    return (
      <div className={`${height} overflow-hidden rounded-lg border border-slate-800 bg-white`}>
        <iframe
          title={`${item.title} preview`}
          src={url}
          className={size === "large" ? "h-full w-full bg-white" : "h-[420px] w-full origin-top scale-[0.34] bg-white pointer-events-none"}
          tabIndex={-1}
        />
      </div>
    );
  }

  return (
    <div className={`${height} flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 px-4 text-center`}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{item.kind}</p>
        <p className="mt-2 text-sm font-black text-slate-200">{item.sourceLabel}</p>
      </div>
    </div>
  );
}

function TripPacketParserPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResponse | null>(null);

  async function runParser() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/load-intake/extract", {
        method: "POST",
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Parser failed");
      setResult(payload as ExtractionResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parser failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Packet parser</p>
          <h2 className="mt-2 text-xl font-black text-white">Upload a rate con, BOL, or load packet PDF</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
            Parse a customer or broker packet, review extracted fields, then attach the document to the shared packet workflow.
          </p>
        </div>
        <Link href="/load-requests" className="rounded-md border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200 hover:border-teal-400 hover:text-teal-100">
          Request queue
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="max-w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded file:border-0 file:bg-teal-500 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-slate-950"
        />
        <button
          type="button"
          disabled={!file || busy}
          onClick={runParser}
          className="rounded-md bg-teal-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {busy ? "Parsing..." : "Parse into packet"}
        </button>
      </div>
      {error && <p className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>}
      {result && (
        <div className="mt-4 grid gap-3 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-sm font-black text-white">Parser result</p>
            <p className="mt-2 text-sm text-slate-300">
              Status: <span className="font-bold text-teal-200">{result.status}</span>
            </p>
            <p className="text-sm text-slate-300">
              Confidence: <span className="font-bold text-teal-200">{Math.round(result.confidence * 100)}%</span>
            </p>
            {result.warnings.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-amber-100">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-sm font-black text-white">Extracted preview</p>
            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">{result.extractedTextPreview}</pre>
          </div>
        </div>
      )}
    </section>
  );
}

export function TripPacketWorkspace() {
  const { data } = useBofDemoData();
  const initialLoadId = data.loads.find((load) => load.status === "Pending")?.id ?? data.loads[0]?.id ?? "L001";
  const [selectedLoadId, setSelectedLoadId] = useState(initialLoadId);
  const [role, setRole] = useState<TripPacketRole>("dispatcher");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [returned, setReturned] = useState<Record<string, string>>({});
  const [released, setReleased] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activity, setActivity] = useState<PacketActivity[]>([
    {
      id: "init",
      label: "Workspace opened",
      detail: "Dispatcher is assembling the shared packet before driver release.",
    },
  ]);

  const model = useMemo(() => buildTripPacketWorkspaceModel(data, selectedLoadId), [data, selectedLoadId]);
  const roleInfo = TRIP_PACKET_ROLES.find((item) => item.role === role) ?? TRIP_PACKET_ROLES[0];
  const visibleItems = useMemo(() => (model ? visibleItemsForRole(model, role) : []), [model, role]);
  const activeItem = visibleItems.find((item) => item.key === activeKey) ?? visibleItems[0] ?? null;
  const signableItems = visibleItems.filter((item) => item.signatureRequiredBy.includes(role));
  const selectedItems = visibleItems.filter((item) => selected[item.key]);
  const missingOrPending = visibleItems.filter((item) => item.status !== "ready" && item.status !== "not_applicable");
  const signatureCount = signableItems.filter((item) => signed[item.key]).length;
  const readinessPct = Math.round((model ? model.readiness.ready / Math.max(model.readiness.required, 1) : 0) * 100);
  const roleCopy = ROLE_STAGE_COPY[role];

  const grouped = TRIP_PACKET_CATEGORIES.map((category) => ({
    ...category,
    rows: visibleItems.filter((item) => item.category === category.category),
  })).filter((category) => category.rows.length > 0);

  function addActivity(label: string, detail: string) {
    setActivity((current) => [{ id: `${Date.now()}-${current.length}`, label, detail }, ...current].slice(0, 8));
  }

  function resetForLoad(loadId: string) {
    setSelectedLoadId(loadId);
    setSelected({});
    setSigned({});
    setReturned({});
    setReleased(false);
    setActiveKey(null);
    setActivity([
      {
        id: "load-change",
        label: "Load packet selected",
        detail: `${loadId} packet opened for role-based document control.`,
      },
    ]);
  }

  function toggle(key: string) {
    setSelected((current) => ({ ...current, [key]: !current[key] }));
  }

  function signItems(items: TripPacketWorkspaceItem[]) {
    if (items.length === 0) return;
    const label = `${roleLabel(role)} signed`;
    setSigned((current) => {
      const next = { ...current };
      items.forEach((item) => {
        next[item.key] = label;
      });
      return next;
    });
    addActivity(label, `${items.length} packet item${items.length === 1 ? "" : "s"} signed in the ${roleInfo.label} view.`);
  }

  function returnSelected() {
    const rows = selectedItems.length > 0 ? selectedItems : activeItem ? [activeItem] : [];
    if (rows.length === 0) return;
    setReturned((current) => {
      const next = { ...current };
      rows.forEach((item) => {
        next[item.key] = `${roleInfo.label} returned for correction`;
      });
      return next;
    });
    addActivity(roleCopy.secondary, `${rows.length} item${rows.length === 1 ? "" : "s"} sent back with role-specific review notes.`);
  }

  function releasePacket() {
    setReleased(true);
    addActivity(roleCopy.primary, `${roleInfo.label} completed the current packet handoff for ${model?.load.loadId}.`);
  }

  if (!model) return null;

  return (
    <div className="space-y-5 p-5">
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/30">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.1fr)_420px]">
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-300">Dispatch packet control</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">One live packet, four operating views</h1>
            <p className="mt-3 max-w-5xl text-base leading-7 text-slate-300">
              Dispatcher, driver, manager, and customer work from the same load packet. The view changes by role:
              signatures, financials, customer proof, internal holds, and driver release all stay in the right lane.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Readiness</p>
                <p className="mt-2 text-3xl font-black text-white">{readinessPct}%</p>
                <p className="text-xs text-slate-400">{model.readiness.ready}/{model.readiness.required} required ready</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Signatures</p>
                <p className="mt-2 text-3xl font-black text-white">{signatureCount}/{signableItems.length}</p>
                <p className="text-xs text-slate-400">{roleInfo.label} requirements</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Exceptions</p>
                <p className="mt-2 text-3xl font-black text-white">{missingOrPending.length}</p>
                <p className="text-xs text-slate-400">Pending or missing in this view</p>
              </div>
              <div className={`rounded-xl border p-4 ${released ? "border-emerald-400/40 bg-emerald-500/10" : "border-amber-400/40 bg-amber-500/10"}`}>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Handoff</p>
                <p className="mt-2 text-xl font-black text-white">{released ? "Released" : roleCopy.stage}</p>
                <p className="text-xs text-slate-300">{released ? "Current role completed" : "Ready for action"}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-400" htmlFor="trip-packet-load">
                  Load packet
                </label>
                <select
                  id="trip-packet-load"
                  value={selectedLoadId}
                  onChange={(event) => resetForLoad(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm font-bold text-white focus:border-teal-400 focus:outline-none"
                >
                  {data.loads.map((load) => (
                    <option key={load.id} value={load.id}>
                      {load.id} - Load {load.number} - {load.status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-black text-teal-200">{model.load.loadId}</p>
                    <h2 className="mt-1 text-xl font-black text-white">Load {model.load.loadNumber} - {model.load.customerName}</h2>
                    <p className="mt-1 text-sm text-slate-400">{model.load.driverName} - {model.load.lane}</p>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm font-bold text-slate-200">
                    {model.load.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <aside className="border-t border-slate-800 bg-slate-950/80 p-6 xl:border-l xl:border-t-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Live handoff log</p>
            <div className="mt-4 space-y-3">
              {activity.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-sm font-black text-white">{entry.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{entry.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        {TRIP_PACKET_ROLES.map((item) => (
          <button
            key={item.role}
            type="button"
            onClick={() => {
              setRole(item.role);
              setSelected({});
              setActiveKey(null);
              addActivity(`${item.label} view opened`, item.description);
            }}
            className={[
              "rounded-xl border p-4 text-left transition hover:border-teal-300 hover:bg-teal-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300",
              role === item.role ? "border-teal-300 bg-teal-500/10 shadow-xl shadow-teal-950/30" : "border-slate-800 bg-slate-900/70",
            ].join(" ")}
          >
            <span className="block text-base font-black text-white">{item.label}</span>
            <span className="mt-2 block text-sm leading-6 text-slate-400">{item.description}</span>
          </button>
        ))}
      </section>

      <section className="grid gap-5 2xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <aside className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">{roleInfo.label} command</p>
          <h2 className="mt-2 text-2xl font-black text-white">{roleCopy.stage}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{roleInfo.description}</p>

          <div className="mt-5 grid gap-2">
            <button
              type="button"
              className="rounded-md bg-teal-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              onClick={() => {
                signItems(signableItems);
                releasePacket();
              }}
              disabled={signableItems.length === 0 && role !== "dispatcher" && role !== "manager"}
            >
              {roleCopy.primary}
            </button>
            <button
              type="button"
              onClick={returnSelected}
              className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-100 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
              disabled={!activeItem && selectedItems.length === 0}
            >
              {roleCopy.secondary}
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 hover:border-teal-400 hover:text-teal-100"
              onClick={() => {
                const next: Record<string, boolean> = {};
                signableItems.forEach((item) => {
                  next[item.key] = true;
                });
                setSelected(next);
              }}
            >
              Select required signatures
            </button>
          </div>

          <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm font-black text-white">Role visibility</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Visible items</dt>
                <dd className="font-bold text-white">{visibleItems.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Needs signature</dt>
                <dd className="font-bold text-white">{signableItems.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Returned</dt>
                <dd className="font-bold text-white">{Object.keys(returned).length}</dd>
              </div>
            </dl>
          </div>
        </aside>

        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Packet documents</p>
              <h2 className="mt-2 text-2xl font-black text-white">Quick-glance thumbnails and signoff</h2>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[24rem]">
              <Link href={`/pretrip/${model.load.loadId}`} className="rounded-md border border-slate-700 px-3 py-2 text-center text-sm font-bold text-slate-200 hover:border-teal-400 hover:text-teal-100">
                Driver tablet
              </Link>
              <Link href={`/trip-release/${model.load.loadId}`} className="rounded-md border border-slate-700 px-3 py-2 text-center text-sm font-bold text-slate-200 hover:border-teal-400 hover:text-teal-100">
                Trip release
              </Link>
              <Link href={`/shipper-portal/${model.load.loadId}`} className="rounded-md border border-slate-700 px-3 py-2 text-center text-sm font-bold text-slate-200 hover:border-teal-400 hover:text-teal-100">
                Customer view
              </Link>
            </div>
          </div>

          <div className="mt-5 space-y-6">
            {grouped.map((category) => (
              <div key={category.category}>
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">{category.label}</h3>
                <div className="mt-3 grid gap-4 lg:grid-cols-2 2xl:grid-cols-1 min-[1760px]:grid-cols-2">
                  {category.rows.map((item) => {
                    const signable = item.signatureRequiredBy.includes(role);
                    const isActive = activeItem?.key === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveKey(item.key)}
                        className={[
                          "min-w-0 rounded-xl border bg-slate-950/70 p-4 text-left transition hover:border-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300",
                          isActive ? "border-teal-300" : "border-slate-800",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-white">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-400">{item.sourceLabel}</p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${statusClass(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <div className="mt-3">{itemPreview(item)}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                            {item.criticality.replace("_", " ")}
                          </span>
                          {signable && (
                            <span className="rounded-full border border-teal-400/40 bg-teal-500/10 px-2 py-0.5 text-[11px] font-bold text-teal-200">
                              Signature required
                            </span>
                          )}
                          {signed[item.key] && (
                            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-200">
                              {signed[item.key]}
                            </span>
                          )}
                          {returned[item.key] && (
                            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-100">
                              Returned
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Selected document</p>
          {activeItem ? (
            <div className="mt-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">{activeItem.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{activeItem.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(selected[activeItem.key])}
                  disabled={!activeItem.signatureRequiredBy.includes(role)}
                  onChange={() => toggle(activeItem.key)}
                  className="mt-1 h-5 w-5 rounded border-slate-600 bg-slate-950 text-teal-500 focus:ring-teal-400"
                  aria-label={`Select ${activeItem.title}`}
                />
              </div>
              <div className="mt-4">{itemPreview(activeItem, "large")}</div>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  disabled={!activeItem.signatureRequiredBy.includes(role)}
                  onClick={() => signItems([activeItem])}
                  className="rounded-md bg-teal-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  Sign this document
                </button>
                <button
                  type="button"
                  onClick={returnSelected}
                  className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-100 hover:bg-amber-500/20"
                >
                  Return this document for correction
                </button>
                <a
                  href={activeItem.actionUrl}
                  target={activeItem.canonicalUrl ? "_blank" : undefined}
                  rel={activeItem.canonicalUrl ? "noreferrer" : undefined}
                  className="rounded-md border border-slate-700 px-4 py-3 text-center text-sm font-bold text-slate-200 hover:border-teal-400 hover:text-teal-100"
                >
                  {activeItem.actionLabel}
                </a>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No packet item is visible in this role.</p>
          )}
        </aside>
      </section>

      <TripPacketParserPanel />
    </div>
  );
}
