"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Row = { id: string; employerName: string; startDate: string | null; endDate: string | null; status: string };

const input = "mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white";

function day(value: string | null) {
  return value ? value.slice(0, 10) : "present";
}

/**
 * Employment history on the driver's qualification intake. Saving an employer re-runs qualification
 * and readiness, so the Qualification and Readiness cards above refresh with the new result.
 */
export function WorkHistoryPanel({ intakeId }: { intakeId: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ employerName: "", startDate: "", endDate: "" });

  const load = useCallback(async () => {
    const response = await fetch(`/api/intake/${encodeURIComponent(intakeId)}/work-history`, { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as { workHistory?: Row[]; canEdit?: boolean; error?: string };
    if (!response.ok) {
      setError(body.error ?? `Employment history unavailable (${response.status})`);
      return;
    }
    setRows(body.workHistory ?? []);
    setCanEdit(Boolean(body.canEdit));
  }, [intakeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/intake/${encodeURIComponent(intakeId)}/work-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employerName: form.employerName, startDate: form.startDate, endDate: form.endDate || undefined }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? `Save failed (${response.status})`);
      setForm({ employerName: "", startDate: "", endDate: "" });
      await load();
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4" data-testid="work-history-panel">
      <h2 className="text-sm font-bold text-white">Employment history (qualification file)</h2>
      <p className="mt-1 text-xs text-slate-400">
        Prior employers from the driver&apos;s application, confirmed through employment verification. Qualification stays incomplete until at
        least one is recorded.
      </p>
      {rows === null && !error ? <p className="mt-2 text-xs text-slate-500">Loading…</p> : null}
      {rows && rows.length === 0 ? <p className="mt-2 text-sm text-amber-200">No employment history recorded.</p> : null}
      {rows && rows.length ? (
        <ul className="mt-2 grid gap-1 text-sm text-slate-200">
          {rows.map((row) => (
            <li key={row.id}>
              {row.employerName} <span className="text-xs text-slate-500">· {day(row.startDate)} to {day(row.endDate)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {canEdit ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
          <label className="text-xs text-slate-300">
            Employer
            <input className={input} name="employerName" value={form.employerName} onChange={(e) => setForm({ ...form, employerName: e.target.value })} />
          </label>
          <label className="text-xs text-slate-300">
            Start
            <input className={input} type="date" name="startDate" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </label>
          <label className="text-xs text-slate-300">
            End (blank if current)
            <input className={input} type="date" name="endDate" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </label>
          <button
            type="button"
            disabled={busy || !form.employerName || !form.startDate}
            onClick={() => void save()}
            className="rounded-md border border-teal-600 bg-teal-950/60 px-3 py-2 text-xs font-bold text-teal-100 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Record employer"}
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-rose-300" role="alert">{error}</p> : null}
    </section>
  );
}
