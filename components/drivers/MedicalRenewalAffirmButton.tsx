"use client";

import { useState } from "react";

export function MedicalRenewalAffirmButton({ driverId }: { driverId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage(null);
        try {
          const response = await fetch(`/api/drivers/${driverId}/medical-renewal/affirm`, { method: "POST" });
          const body = (await response.json()) as { error?: string };
          if (!response.ok) throw new Error(body.error ?? "Unable to affirm appointment");
          setMessage("Medical appointment affirmed. The requirement stays open until the medical card is recorded.");
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Unable to affirm appointment");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-xs text-slate-400">
        This records the existing medical appointment affirmation. It does not set eligibility, release, or pay.
      </p>
      <button
        type="submit"
        disabled={busy}
        className="rounded border border-teal-400/40 px-3 py-1.5 text-xs text-teal-100 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Affirm medical appointment"}
      </button>
      {message ? <p className="text-xs text-slate-200">{message}</p> : null}
    </form>
  );
}
