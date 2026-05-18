"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  getClientLoadRequests,
  type ClientLoadRequest,
  type ClientLoadRequestStatus,
} from "@/lib/client-load-requests";

function statusBadge(status: ClientLoadRequestStatus) {
  const base = "inline-flex rounded px-2 py-0.5 text-[11px] font-semibold";
  switch (status) {
    case "submitted":
      return `${base} bg-blue-900/30 text-blue-300 ring-1 ring-blue-700/50`;
    case "needs_review":
      return `${base} bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/50`;
    case "approved":
      return `${base} bg-green-900/30 text-green-300 ring-1 ring-green-700/50`;
    case "converted_to_load":
      return `${base} bg-teal-900/30 text-teal-300 ring-1 ring-teal-700/50`;
    case "rejected":
      return `${base} bg-red-900/30 text-red-300 ring-1 ring-red-700/50`;
    default:
      return `${base} bg-slate-800 text-slate-300`;
  }
}

function confidenceBadge(confidence?: number) {
  if (!confidence) return null;
  const base = "inline-flex rounded px-2 py-0.5 text-[11px] font-semibold";
  if (confidence >= 80) {
    return `${base} bg-green-900/30 text-green-300 ring-1 ring-green-700/50`;
  } else if (confidence >= 60) {
    return `${base} bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/50`;
  } else {
    return `${base} bg-red-900/30 text-red-300 ring-1 ring-red-700/50`;
  }
}

export function LoadRequestIntakePanel() {
  const { data } = useBofDemoData();
  const requests = useMemo(() => getClientLoadRequests(data), [data]);

  // Filter for pending requests (submitted, needs_review, approved but not converted)
  const pendingRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.status === "submitted" ||
          r.status === "needs_review" ||
          r.status === "approved"
      ),
    [requests]
  );

  if (pendingRequests.length === 0) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Pending Load Requests</h2>
          <Link
            href="/load-requests"
            className="text-xs text-teal-300 hover:text-teal-200 underline-offset-2 hover:underline"
          >
            Open Load Requests →
          </Link>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">No pending load requests</p>
          <p className="mt-1 text-xs text-slate-500">
            All requests have been processed or converted to loads
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Pending Load Requests</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {pendingRequests.length} pending
          </span>
          <Link
            href="/load-requests"
            className="text-xs text-teal-300 hover:text-teal-200 underline-offset-2 hover:underline"
          >
            Open Load Requests →
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {pendingRequests.map((request) => (
          <div
            key={request.requestId}
            className="rounded border border-slate-800/60 bg-slate-950/40 p-3"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-teal-300">
                  {request.requestId}
                </span>
                <span className={statusBadge(request.status)}>
                  {request.status.replace("_", " ")}
                </span>
                {/* Confidence score not available in ClientLoadRequest type */}
              </div>
              {request.convertedLoadId && (
                <span className="text-xs text-teal-200">
                  → {request.convertedLoadId}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <span className="text-slate-500">Customer:</span>{" "}
                <span className="font-medium">{request.companyName}</span>
              </div>
              <div>
                <span className="text-slate-500">Contact:</span>{" "}
                <span className="font-medium">{request.contactName}</span>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>{" "}
                <span className="font-medium">{request.contactEmail}</span>
              </div>
              <div>
                <span className="text-slate-500">Pickup:</span>{" "}
                <span className="font-medium">
                  {request.pickupCity}, {request.pickupState}
                </span>
                <span className="text-slate-400 ml-1">
                  {request.pickupDate}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Delivery:</span>{" "}
                <span className="font-medium">
                  {request.deliveryCity}, {request.deliveryState}
                </span>
                <span className="text-slate-400 ml-1">
                  {request.deliveryDate}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Commodity:</span>{" "}
                <span className="font-medium">{request.commodity}</span>
              </div>
              <div>
                <span className="text-slate-500">Equipment:</span>{" "}
                <span className="font-medium">{request.equipmentType}</span>
              </div>
              <div>
                <span className="text-slate-500">Weight:</span>{" "}
                <span className="font-medium">
                  {request.weight ? `${request.weight} lbs` : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Rate:</span>{" "}
                <span className="font-medium">
                  {request.quotedRate ? `$${request.quotedRate}` : "—"}
                </span>
              </div>
            </div>

            {request.warnings && request.warnings.length > 0 && (
              <div className="mt-2 rounded border border-amber-800/30 bg-amber-950/20 p-2">
                <p className="text-xs font-medium text-amber-300">Warnings:</p>
                <ul className="mt-1 text-xs text-amber-200">
                  {request.warnings.slice(0, 2).map((warning, idx) => (
                    <li key={idx} className="truncate">
                      • {warning}
                    </li>
                  ))}
                  {request.warnings.length > 2 && (
                    <li className="text-amber-400">
                      • {request.warnings.length - 2} more...
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/load-requests?requestId=${request.requestId}`}
                className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Review Intake
              </Link>
              <Link
                href="/load-requests"
                className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Open Load Requests
              </Link>
              {request.convertedLoadId && (
                <Link
                  href={`/generated/loads/${request.convertedLoadId}`}
                  className="rounded border border-teal-700 bg-teal-800 px-2 py-1 text-xs font-medium text-teal-300 hover:bg-teal-700"
                >
                  View Generated Documents
                </Link>
              )}
              {!request.convertedLoadId && request.status === "approved" && (
                <button
                  className="rounded border border-amber-700 bg-amber-800 px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-700"
                  disabled
                >
                  Generate Documents (Coming Soon)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded border border-teal-800/30 bg-teal-950/20 p-3">
        <p className="text-xs font-medium text-teal-300">
          Next phase: approved intake can be converted into a V4 dispatch load with route intelligence, driver assignment, proof requirements, and generated packet.
        </p>
      </div>
    </section>
  );
}
