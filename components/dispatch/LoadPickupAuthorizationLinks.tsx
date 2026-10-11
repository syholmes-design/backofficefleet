"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getErrorMessage, requestJson } from "@/lib/dispatch-workflow-ui";

type ListedAuthorization = {
  id: string;
  status: string;
};

export function LoadPickupAuthorizationLinks({ loadId }: { loadId: string }) {
  const [rows, setRows] = useState<ListedAuthorization[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    requestJson<{ authorizations: ListedAuthorization[] }>(
      `/api/dispatch/pickup-authorization?loadId=${encodeURIComponent(loadId)}`,
    )
      .then((body) => {
        if (!cancelled) setRows(body.authorizations ?? []);
      })
      .catch((nextError: unknown) => {
        if (!cancelled) setError(getErrorMessage(nextError));
      });
    return () => {
      cancelled = true;
    };
  }, [loadId]);

  return (
    <div className="space-y-2">
      <Link
        href={`/dispatch/pickup?loadId=${encodeURIComponent(loadId)}`}
        className="inline-block rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
      >
        Pickup authorization
      </Link>
      {error ? <p className="text-xs text-slate-300">{error}</p> : null}
      {rows && rows.length === 0 ? (
        <p className="text-xs text-slate-400">No pickup authorization is stored for this load.</p>
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="space-y-1 text-xs text-slate-300">
          {rows.map((row) => (
            <li key={row.id}>
              <span>{row.status.replaceAll("_", " ")}</span>
              {" · "}
              <Link className="text-teal-200 underline" href={`/dispatch/pickup/dock?authorizationId=${encodeURIComponent(row.id)}`}>
                Open dock
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
