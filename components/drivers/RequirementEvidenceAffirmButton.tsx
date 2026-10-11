"use client";

import { useState } from "react";

export function RequirementEvidenceAffirmButton({
  requirementId,
  label,
}: {
  requirementId: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [affirmed, setAffirmed] = useState(false);
  const id = requirementId.trim();

  if (!id) return null;

  return (
    <form
      className="mt-2 space-y-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!id) {
          setMessage("Requirement is required.");
          return;
        }
        setBusy(true);
        setMessage(null);
        try {
          const response = await fetch(`/api/requirements/${encodeURIComponent(id)}/affirm`, { method: "POST" });
          const body = (await response.json()) as { error?: string };
          if (!response.ok) throw new Error(body.error ?? "Unable to affirm requirement action");
          setAffirmed(true);
          setMessage(`${label} action affirmed. The requirement stays open until evidence is recorded.`);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Unable to affirm requirement action");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-xs text-slate-400">
        This records the existing requirement action. The requirement stays open until evidence is recorded. It does not set eligibility, release, or pay.
      </p>
      {affirmed ? null : (
        <button
          type="submit"
          disabled={busy}
          className="rounded border border-teal-400/40 px-3 py-1.5 text-xs text-teal-100 disabled:opacity-50"
        >
          {busy ? "Saving…" : `Affirm ${label}`}
        </button>
      )}
      {message ? <p className="text-xs text-slate-200">{message}</p> : null}
    </form>
  );
}
