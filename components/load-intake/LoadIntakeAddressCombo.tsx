"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FacilityMatch } from "@/lib/load-intake-intelligence";
import { searchBofLocationMatches } from "@/lib/load-intake-intelligence";

type Parsed = {
  facilityName?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
};

type GooglePred = { placeId: string; description: string };

type Props = {
  variant: "pickup" | "delivery";
  label: string;
  hint?: string;
  sessionToken: string;
  bofCandidates: FacilityMatch[];
  /** When this string changes, the draft resets from `draftFromFields` (programmatic fills). */
  syncSignature: string;
  draftFromFields: string;
  onSelectBof: (m: FacilityMatch) => void;
  onSelectGoogle: (parsed: Parsed) => void;
};

export function LoadIntakeAddressCombo({
  variant,
  label,
  hint,
  sessionToken,
  bofCandidates,
  syncSignature,
  draftFromFields,
  onSelectBof,
  onSelectGoogle,
}: Props) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState(draftFromFields);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [googlePreds, setGooglePreds] = useState<GooglePred[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [externalAvailable, setExternalAvailable] = useState<boolean | null>(null);

  const prevSig = useRef(syncSignature);
  useEffect(() => {
    if (prevSig.current !== syncSignature) {
      prevSig.current = syncSignature;
      setDraft(draftFromFields);
      setOpen(false);
      setGooglePreds([]);
    }
  }, [syncSignature, draftFromFields]);

  const bofRows = useMemo(
    () => searchBofLocationMatches(draft, bofCandidates, 8),
    [draft, bofCandidates]
  );

  const flatRows = useMemo(() => {
    const out: Array<{ kind: "bof"; m: FacilityMatch } | { kind: "google"; p: GooglePred }> = [];
    for (const m of bofRows) out.push({ kind: "bof", m });
    for (const p of googlePreds) out.push({ kind: "google", p });
    return out;
  }, [bofRows, googlePreds]);

  useEffect(() => {
    if (highlight >= flatRows.length) setHighlight(Math.max(0, flatRows.length - 1));
  }, [flatRows.length, highlight]);

  const runGoogle = useCallback(
    async (input: string) => {
      if (input.trim().length < 3) {
        setGooglePreds([]);
        return;
      }
      setGoogleLoading(true);
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input, sessionToken }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          externalAvailable?: boolean;
          predictions?: GooglePred[];
        };
        if (data.externalAvailable === false) {
          setExternalAvailable(false);
          setGooglePreds([]);
          return;
        }
        setExternalAvailable(true);
        setGooglePreds(Array.isArray(data.predictions) ? data.predictions : []);
      } catch {
        setGooglePreds([]);
      } finally {
        setGoogleLoading(false);
      }
    },
    [sessionToken]
  );

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      void runGoogle(draft);
    }, 320);
    return () => window.clearTimeout(t);
  }, [draft, open, runGoogle]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pickGoogle = async (placeId: string) => {
    try {
      const res = await fetch("/api/places/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, sessionToken }),
      });
      const data = (await res.json()) as Parsed & { ok?: boolean };
      if (!res.ok || !data.ok) return;
      onSelectGoogle({
        facilityName: data.facilityName,
        address: data.address ?? "",
        city: data.city ?? "",
        state: (data.state ?? "").slice(0, 5),
        zip: data.zip ?? "",
      });
      setDraft(
        [data.facilityName, data.address, data.city, data.state, data.zip].filter(Boolean).join(" · ")
      );
      setOpen(false);
      setGooglePreds([]);
    } catch {
      /* quiet */
    }
  };

  const showMenu = open && (flatRows.length > 0 || googleLoading);

  return (
    <div className="bof-load-intake-field bof-load-intake-ac-wrap" ref={wrapRef}>
      <label htmlFor={`${baseId}-input`}>{label}</label>
      <input
        ref={inputRef}
        id={`${baseId}-input`}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={showMenu}
        aria-controls={listId}
        aria-autocomplete="list"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!showMenu && (e.key === "ArrowDown" || e.key === "Enter")) {
            setOpen(true);
            return;
          }
          if (e.key === "Escape") {
            setOpen(false);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (flatRows.length === 0) return;
            setHighlight((h) => Math.min(flatRows.length - 1, h + 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            if (flatRows.length === 0) return;
            setHighlight((h) => Math.max(0, h - 1));
          }
          if (e.key === "Enter" && showMenu && flatRows.length > 0 && flatRows[highlight]) {
            e.preventDefault();
            const row = flatRows[highlight];
            if (row.kind === "bof") {
              onSelectBof(row.m);
              setDraft(
                [row.m.facilityName, row.m.address, row.m.city, row.m.state, row.m.zip]
                  .filter(Boolean)
                  .join(" · ")
              );
              setOpen(false);
            } else {
              void pickGoogle(row.p.placeId);
            }
          }
        }}
        placeholder={
          variant === "pickup"
            ? "Search pickup facility or street address…"
            : "Search delivery facility or street address…"
        }
      />
      {hint ? (
        <p className="bof-muted" style={{ marginTop: "0.35rem", fontSize: "0.72rem" }}>
          {hint}
        </p>
      ) : null}
      {externalAvailable === false ? (
        <p className="bof-muted" style={{ marginTop: "0.35rem", fontSize: "0.7rem" }}>
          External address lookup is not configured — BOF demo locations still apply.
        </p>
      ) : null}

      {showMenu ? (
        <ul
          id={listId}
          role="listbox"
          className="bof-load-intake-ac-menu"
          aria-label={`${label} suggestions`}
        >
          {bofRows.length > 0 ? (
            <li className="bof-load-intake-ac-hdr" role="presentation">
              BOF-known
            </li>
          ) : draft.trim().length >= 2 ? (
            <li className="bof-load-intake-ac-empty" role="presentation">
              No BOF demo match — try external results below.
            </li>
          ) : null}
          {bofRows.map((m, i) => (
            <li key={m.key} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={highlight === i}
                className={`bof-load-intake-ac-opt bof-load-intake-ac-opt--bof ${
                  highlight === i ? "bof-load-intake-ac-opt--active" : ""
                }`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelectBof(m);
                  setDraft(
                    [m.facilityName, m.address, m.city, m.state, m.zip].filter(Boolean).join(" · ")
                  );
                  setOpen(false);
                }}
              >
                <span className="bof-load-intake-ac-opt-title">{m.facilityName}</span>
                <span className="bof-load-intake-ac-opt-sub">
                  {[m.address, [m.city, m.state].filter(Boolean).join(", "), m.zip].filter(Boolean).join(" · ")}
                </span>
              </button>
            </li>
          ))}

          {googlePreds.length > 0 || googleLoading ? (
            <li className="bof-load-intake-ac-hdr" role="presentation">
              Google Places
            </li>
          ) : null}
          {googleLoading ? (
            <li className="bof-load-intake-ac-empty" role="presentation">
              Searching…
            </li>
          ) : null}
          {googlePreds.map((p, j) => {
            const idx = bofRows.length + j;
            return (
              <li key={p.placeId} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={highlight === idx}
                  className={`bof-load-intake-ac-opt bof-load-intake-ac-opt--gg ${
                    highlight === idx ? "bof-load-intake-ac-opt--active" : ""
                  }`}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void pickGoogle(p.placeId)}
                >
                  <span className="bof-load-intake-ac-opt-title">{p.description}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
