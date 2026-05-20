"use client";

import { useEffect, useMemo, useState } from "react";
import type { LoadArtifact, LoadArtifactPacket } from "@/lib/load-artifact-registry";

type PacketMode = "pretrip" | "release";

type SignedRecord = {
  signedBy: string;
  signedAt: string;
};

type Props = {
  packet: LoadArtifactPacket | null;
  mode: PacketMode;
  loadId: string;
  driverName?: string;
  dispatcherName?: string;
};

function statusClass(status: LoadArtifact["status"]) {
  if (status === "ready") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (status === "pending") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  if (status === "not_applicable") return "border-slate-600 bg-slate-900 text-slate-300";
  return "border-red-500/40 bg-red-500/10 text-red-200";
}

function statusLabel(status: LoadArtifact["status"]) {
  if (status === "not_applicable") return "Not required";
  return status.replace(/_/g, " ");
}

function isImage(url?: string) {
  return Boolean(url && /\.(png|jpe?g|webp|gif|svg)$/i.test(url));
}

function isPdf(url?: string) {
  return Boolean(url && /\.pdf(?:$|\?)/i.test(url));
}

function isHtml(url?: string) {
  return Boolean(url && /\.html?(?:$|\?)/i.test(url));
}

function canSign(artifact: LoadArtifact) {
  return artifact.status === "ready" && Boolean(artifact.canonicalUrl);
}

function viewLabel(artifact: LoadArtifact) {
  if (!artifact.canonicalUrl) return "Workflow item";
  if (isImage(artifact.canonicalUrl)) return "Photo evidence";
  if (isPdf(artifact.canonicalUrl)) return "PDF document";
  if (isHtml(artifact.canonicalUrl)) return "Document preview";
  return artifact.kind === "proof" ? "Proof record" : "Registered file";
}

function workflowSteps(mode: PacketMode, signedCount: number, rejectedCount: number) {
  const driverStep = mode === "release" ? "Driver review" : "Driver pre-trip review";
  return [
    { label: "Dispatch certified", active: true },
    { label: "Packet assembled", active: true },
    { label: driverStep, active: signedCount === 0 && rejectedCount === 0 },
    { label: "Driver signed", active: signedCount > 0 },
    { label: "Returned to dispatch", active: rejectedCount > 0 },
  ];
}

function DocumentViewer({ artifact }: { artifact: LoadArtifact }) {
  const url = artifact.canonicalUrl;

  if (!url) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-amber-500/30 bg-amber-950/20 p-8 text-center">
        <div>
          <p className="text-lg font-black text-amber-100">Exact file still needed</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-amber-100/80">
            This packet line stays tied to load {artifact.loadId}. Dispatch can attach the missing file, photo,
            or proof record before the driver signs the packet.
          </p>
          <a
            href={artifact.actionUrl}
            className="mt-5 inline-flex rounded-md border border-amber-400/50 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-500/20"
          >
            {artifact.actionLabel}
          </a>
        </div>
      </div>
    );
  }

  if (isImage(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="max-h-[560px] w-full object-contain" />
      </a>
    );
  }

  if (isPdf(url) || isHtml(url)) {
    return (
      <iframe
        title={`${artifact.label} viewer`}
        src={url}
        className="h-[560px] w-full rounded-lg border border-slate-800 bg-white"
      />
    );
  }

  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-slate-800 bg-slate-950 p-8 text-center">
      <div>
        <p className="text-lg font-black text-white">{artifact.label}</p>
        <p className="mt-2 text-sm text-slate-300">{artifact.sourceLabel}</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-md border border-teal-500/50 bg-teal-500/10 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-500/20"
        >
          Open file
        </a>
      </div>
    </div>
  );
}

function ArtifactPreview({ artifact, compact = false }: { artifact: LoadArtifact; compact?: boolean }) {
  const url = artifact.canonicalUrl;
  const height = compact ? "h-28" : "h-32";

  if (url && isImage(url)) {
    return (
      <div className={`${height} overflow-hidden rounded-md border border-slate-800 bg-slate-950`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  if (url && (isPdf(url) || isHtml(url))) {
    return (
      <div className={`${height} overflow-hidden rounded-md border border-slate-800 bg-white`}>
        <iframe
          title={`${artifact.label} thumbnail`}
          src={url}
          className="h-[420px] w-full origin-top scale-[0.34] pointer-events-none"
          tabIndex={-1}
        />
      </div>
    );
  }

  return (
    <div className={`${height} flex items-center justify-center rounded-md border border-slate-800 bg-slate-950 px-4 text-center`}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          {artifact.kind}
        </p>
        <p className="mt-2 text-sm font-black text-slate-200">{artifact.status === "not_applicable" ? "Not required" : "Needs review"}</p>
      </div>
    </div>
  );
}

export function LoadPacketControlPanel({
  packet,
  mode,
  loadId,
  driverName,
  dispatcherName = "Dispatch",
}: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [signed, setSigned] = useState<Record<string, SignedRecord>>({});
  const [rejectedKeys, setRejectedKeys] = useState<string[]>([]);
  const [signatureName, setSignatureName] = useState(driverName ?? "");
  const [returnReason, setReturnReason] = useState("");

  const artifacts = useMemo(() => packet?.artifacts ?? [], [packet]);
  const signableArtifacts = useMemo(() => artifacts.filter(canSign), [artifacts]);
  const signableKeys = useMemo(() => signableArtifacts.map((artifact) => artifact.key), [signableArtifacts]);

  useEffect(() => {
    if (!packet) return;
    setActiveKey((current) => current ?? packet.artifacts[0]?.key ?? null);
    setSelectedKeys((current) => (current.length > 0 ? current : signableKeys));
  }, [packet, signableKeys]);

  useEffect(() => {
    setSignatureName((current) => current || driverName || "");
  }, [driverName]);

  if (!packet || artifacts.length === 0) return null;

  const activeArtifact =
    artifacts.find((artifact) => artifact.key === activeKey) ?? artifacts[0];
  const signedCount = Object.keys(signed).length;
  const rejectedCount = rejectedKeys.length;
  const selectedSignableKeys = selectedKeys.filter((key) => signableKeys.includes(key));
  const allSelected = selectedSignableKeys.length === signableKeys.length && signableKeys.length > 0;
  const steps = workflowSteps(mode, signedCount, rejectedCount);
  const header =
    mode === "release"
      ? `${loadId} driver trip-release packet`
      : `${loadId} pre-trip packet control`;
  const lead =
    mode === "release"
      ? "Dispatch has assembled the packet; the driver can inspect every document and photo, sign selected items, sign the full trip packet, or return exceptions for correction."
      : "Dispatch certifies the load file first. The driver then reviews the exact packet, signs the ready documents, and returns only the items that need correction.";

  function toggleSelected(key: string) {
    if (!signableKeys.includes(key)) return;
    setSelectedKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  }

  function signKeys(keys: string[]) {
    const cleanName = signatureName.trim() || driverName || "Driver";
    const signedAt = new Date().toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    setSigned((current) => {
      const next = { ...current };
      keys.forEach((key) => {
        next[key] = { signedBy: cleanName, signedAt };
      });
      return next;
    });
    setRejectedKeys((current) => current.filter((key) => !keys.includes(key)));
  }

  function returnSelected() {
    const keys = selectedKeys.length > 0 ? selectedKeys : [activeArtifact.key];
    setRejectedKeys((current) => Array.from(new Set([...current, ...keys])));
  }

  return (
    <section
      id="load-artifact-packet-heading"
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/30"
      aria-labelledby="packet-control-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-300">Pre-trip packet</p>
          <h2 id="packet-control-heading" className="mt-2 text-2xl font-black text-white">
            {header}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">{lead}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-4 py-3 text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Packet readiness</p>
          <p className="mt-1 text-lg font-black text-white">
            {packet.validation.readyCount}/{packet.validation.requiredCount}
          </p>
          <p className="text-xs text-slate-400">{packet.validation.recommendedAction}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-5">
        {steps.map((step) => (
          <div
            key={step.label}
            className={[
              "rounded-lg border px-3 py-2 text-xs font-bold",
              step.active
                ? "border-teal-400/50 bg-teal-500/10 text-teal-100"
                : "border-slate-800 bg-slate-950/70 text-slate-500",
            ].join(" ")}
          >
            {step.label}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-white">All packet documents and photos</p>
            <p className="mt-1 text-sm text-slate-400">
              Select what the driver accepts, click any thumbnail for the larger view, then sign once or return selected items.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200 hover:border-teal-400 hover:text-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
              onClick={() => setSelectedKeys(allSelected ? [] : signableKeys)}
            >
              {allSelected ? "Clear selection" : "Select all ready docs"}
            </button>
            <button
              type="button"
              className="rounded-md bg-teal-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              disabled={signableKeys.length === 0}
              onClick={() => {
                setSelectedKeys(signableKeys);
                signKeys(signableKeys);
              }}
            >
              Sign all ready documents
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {artifacts.map((artifact) => {
            const selected = selectedKeys.includes(artifact.key);
            const active = activeArtifact.key === artifact.key;
            const signedRecord = signed[artifact.key];
            const rejected = rejectedKeys.includes(artifact.key);
            return (
              <article
                key={artifact.key}
                className={[
                  "rounded-lg border p-3 transition",
                  active ? "border-teal-300 bg-teal-500/10" : "border-slate-800 bg-slate-900/60",
                  rejected ? "ring-1 ring-amber-400/60" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex min-w-0 items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-teal-500 focus:ring-teal-400"
                      checked={selected}
                      disabled={!canSign(artifact)}
                      onChange={() => toggleSelected(artifact.key)}
                      aria-label={`Select ${artifact.label}`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-white">{artifact.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-400">{viewLabel(artifact)}</span>
                    </span>
                  </label>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${statusClass(artifact.status)}`}>
                    {statusLabel(artifact.status)}
                  </span>
                </div>

                <button
                  type="button"
                  className="mt-3 block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
                  onClick={() => setActiveKey(artifact.key)}
                >
                  <ArtifactPreview artifact={artifact} compact />
                </button>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className="text-xs font-bold text-teal-200 underline-offset-4 hover:text-teal-100 hover:underline"
                    onClick={() => setActiveKey(artifact.key)}
                  >
                    Larger view
                  </button>
                  {signedRecord && (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-200">
                      Signed
                    </span>
                  )}
                  {rejected && (
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                      Returned
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">Signing queue</p>
            <button
              type="button"
              className="rounded-md border border-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200 hover:border-teal-400 hover:text-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
              onClick={() => setSelectedKeys(allSelected ? [] : signableKeys)}
            >
              {allSelected ? "Clear" : "Select ready"}
            </button>
          </div>

          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {artifacts.map((artifact) => {
              const selected = selectedKeys.includes(artifact.key);
              const active = activeArtifact.key === artifact.key;
              const signedRecord = signed[artifact.key];
              const rejected = rejectedKeys.includes(artifact.key);
              return (
                <div
                  key={artifact.key}
                  id={`artifact-${artifact.key}`}
                  className={[
                    "rounded-lg border p-3 transition",
                    active ? "border-teal-400/70 bg-teal-500/10" : "border-slate-800 bg-slate-900/65",
                    rejected ? "ring-1 ring-amber-400/50" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-teal-500 focus:ring-teal-400"
                      checked={selected}
                      disabled={!canSign(artifact)}
                      onChange={() => toggleSelected(artifact.key)}
                      aria-label={`Select ${artifact.label}`}
                    />
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
                      onClick={() => setActiveKey(artifact.key)}
                    >
                      <span className="block truncate text-sm font-black text-white">{artifact.label}</span>
                      <span className="mt-1 block text-xs text-slate-400">{viewLabel(artifact)}</span>
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold capitalize ${statusClass(artifact.status)}`}>
                      {statusLabel(artifact.status)}
                    </span>
                    {signedRecord && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-200">
                        Signed
                      </span>
                    )}
                    {rejected && (
                      <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                        Returned
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Larger individual view</p>
              <h3 className="mt-1 text-xl font-black text-white">{activeArtifact.label}</h3>
              <p className="mt-1 text-sm text-slate-400">{activeArtifact.sourceLabel}</p>
            </div>
            <a
              href={activeArtifact.actionUrl}
              target={activeArtifact.canonicalUrl ? "_blank" : undefined}
              rel={activeArtifact.canonicalUrl ? "noreferrer" : undefined}
              className="rounded-md border border-teal-500/50 bg-teal-500/10 px-3 py-2 text-sm font-bold text-teal-100 hover:bg-teal-500/20"
            >
              {activeArtifact.actionLabel}
            </a>
          </div>

          <DocumentViewer artifact={activeArtifact} />

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-sm font-black text-white">Packet signoff</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                One signature can sign all ready documents, or the driver can select only the documents they accept
                and return the rest to {dispatcherName}.
              </p>
              <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-400">
                Signature name
                <input
                  value={signatureName}
                  onChange={(event) => setSignatureName(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                  placeholder={driverName ?? "Driver name"}
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md bg-teal-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  disabled={selectedSignableKeys.length === 0}
                  onClick={() => signKeys(selectedSignableKeys)}
                >
                  Sign selected documents
                </button>
                <button
                  type="button"
                  className="rounded-md border border-teal-500/60 bg-teal-500/10 px-4 py-2 text-sm font-black text-teal-100 hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                  disabled={signableKeys.length === 0}
                  onClick={() => {
                    setSelectedKeys(signableKeys);
                    signKeys(signableKeys);
                  }}
                >
                  Sign all ready documents
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-sm font-black text-white">Return exceptions</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Use this when a document is wrong, missing, unreadable, or does not match the load.
              </p>
              <textarea
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                className="mt-4 min-h-24 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                placeholder="Reason returned to dispatch"
              />
              <button
                type="button"
                className="mt-3 rounded-md border border-amber-400/60 bg-amber-500/10 px-4 py-2 text-sm font-black text-amber-100 hover:bg-amber-500/20"
                onClick={returnSelected}
              >
                Return selected docs to dispatch
              </button>
            </div>
          </div>

          {(signedCount > 0 || rejectedCount > 0) && (
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-sm font-black text-white">Packet activity</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {Object.entries(signed).map(([key, record]) => {
                  const artifact = artifacts.find((item) => item.key === key);
                  return (
                    <li key={key}>
                      {artifact?.label ?? key} signed by {record.signedBy} at {record.signedAt}.
                    </li>
                  );
                })}
                {rejectedKeys.map((key) => {
                  const artifact = artifacts.find((item) => item.key === key);
                  return (
                    <li key={key}>
                      {artifact?.label ?? key} returned to dispatch
                      {returnReason.trim() ? `: ${returnReason.trim()}` : "."}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
