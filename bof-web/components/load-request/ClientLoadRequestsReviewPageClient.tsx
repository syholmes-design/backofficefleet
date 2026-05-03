"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  getClientLoadRequests,
  setClientLoadRequests,
  validateClientLoadRequestDraft,
  type ClientLoadRequest,
} from "@/lib/client-load-requests";
import {
  BOF_DEMO_DATA_LEGACY_STORAGE_KEY,
  BOF_DEMO_DATA_STORAGE_KEY,
} from "@/lib/demo-storage-keys";

function latestDataSnapshot(fallback: Parameters<typeof getClientLoadRequests>[0]) {
  try {
    let raw = localStorage.getItem(BOF_DEMO_DATA_STORAGE_KEY);
    if (!raw) raw = localStorage.getItem(BOF_DEMO_DATA_LEGACY_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as typeof fallback;
    if (!parsed || !Array.isArray(parsed.loads) || !Array.isArray(parsed.drivers) || !Array.isArray(parsed.documents)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function persistDirect(next: Parameters<typeof getClientLoadRequests>[0]) {
  try {
    localStorage.setItem(BOF_DEMO_DATA_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Keep setFullData as source of truth; this is a safety write for conversion flows.
  }
}

export function ClientLoadRequestsReviewPageClient() {
  const { data, setFullData } = useBofDemoData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const requests = useMemo(() => getClientLoadRequests(data), [data]);
  const editing = requests.find((r) => r.requestId === editingId) || null;

  const updateRequest = (requestId: string, patch: Partial<ClientLoadRequest>) => {
    const base = latestDataSnapshot(data);
    const currentRequests = getClientLoadRequests(base);
    const nextRequests = currentRequests.map((r) => {
      if (r.requestId !== requestId) return r;
      const merged = { ...r, ...patch };
      const review = validateClientLoadRequestDraft(merged);
      return {
        ...merged,
        warnings: review.warnings,
        missingRequiredFields: review.missingRequiredFields,
        status: patch.status
          ? patch.status
          : merged.status === "converted_to_load" || merged.status === "rejected"
            ? merged.status
            : review.missingRequiredFields.length > 0 || review.warnings.length > 0
              ? "needs_review"
              : "submitted",
      };
    });
    const next = structuredClone(base);
    setClientLoadRequests(next, nextRequests);
    persistDirect(next);
    setFullData(next);
  };

  return (
    <div className="bof-page">
      <h1 className="bof-title">Client Load Requests</h1>
      <p className="bof-lead">Internal BOF review queue for client-submitted load requests.</p>
      <p className="bof-muted bof-small">
        Use <strong>Open in Load Intake</strong> to prefill the canonical BOF load intake wizard; save there
        writes loads and syncs dispatch.
      </p>
      <div className="bof-cc-table-wrap">
        <table className="bof-cc-table">
          <thead>
            <tr>
              <th>Request</th>
              <th>Company / Contact</th>
              <th>Lane</th>
              <th>Pickup Date</th>
              <th>Missing / Warnings</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.requestId}>
                <td>{request.requestId}</td>
                <td>{request.companyName} · {request.contactName}</td>
                <td>{request.pickupCity}, {request.pickupState} → {request.deliveryCity}, {request.deliveryState}</td>
                <td>{request.pickupDate}</td>
                <td>{request.missingRequiredFields.length} / {request.warnings.length}</td>
                <td>{request.status}</td>
                <td>
                  <div className="bof-cc-action-wrap">
                    <button type="button" className="bof-cc-action-btn" onClick={() => setEditingId(request.requestId)}>Review</button>
                    <button type="button" className="bof-cc-action-btn" onClick={() => updateRequest(request.requestId, { status: "approved" })}>Approve</button>
                    <button type="button" className="bof-cc-action-btn bof-cc-action-btn-danger" onClick={() => updateRequest(request.requestId, { status: "rejected" })}>Reject</button>
                    <Link
                      href={`/dispatch/intake?clientRequestId=${encodeURIComponent(request.requestId)}`}
                      className="bof-cc-action-btn bof-cc-action-btn-primary"
                    >
                      Open in Load Intake
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing ? (
        <section className="bof-load-intake-card">
          <h2>Review {editing.requestId}</h2>
          <div className="bof-load-intake-grid-2">
            <EditField request={editing} onChange={(patch) => updateRequest(editing.requestId, patch)} k="companyName" label="Company" />
            <EditField request={editing} onChange={(patch) => updateRequest(editing.requestId, patch)} k="contactEmail" label="Contact Email" />
            <EditField request={editing} onChange={(patch) => updateRequest(editing.requestId, patch)} k="pickupAddress1" label="Pickup Address" />
            <EditField request={editing} onChange={(patch) => updateRequest(editing.requestId, patch)} k="deliveryAddress1" label="Delivery Address" />
            <EditField request={editing} onChange={(patch) => updateRequest(editing.requestId, patch)} k="commodity" label="Commodity" />
            <EditField request={editing} onChange={(patch) => updateRequest(editing.requestId, patch)} k="equipmentType" label="Equipment Type" />
          </div>
          <div className="bof-load-intake-toolbar">
            <button
              type="button"
              className="bof-load-intake-btn"
              onClick={() => updateRequest(editing.requestId, { status: "approved" })}
            >
              Approve
            </button>
            <button
              type="button"
              className="bof-load-intake-btn bof-load-intake-btn--danger"
              onClick={() => updateRequest(editing.requestId, { status: "rejected" })}
            >
              Reject
            </button>
            <Link
              href={`/dispatch/intake?clientRequestId=${encodeURIComponent(editing.requestId)}`}
              className="bof-load-intake-btn bof-load-intake-btn--primary"
            >
              Open in Load Intake
            </Link>
          </div>
        </section>
      ) : null}
      <p className="bof-muted bof-small">
        <Link href="/load-request" className="bof-link-secondary">← New client request</Link>
      </p>
    </div>
  );
}

function EditField({
  request,
  onChange,
  k,
  label,
}: {
  request: ClientLoadRequest;
  onChange: (patch: Partial<ClientLoadRequest>) => void;
  k: keyof ClientLoadRequest;
  label: string;
}) {
  return (
    <div className="bof-load-intake-field">
      <label>{label}</label>
      <input value={String(request[k] ?? "")} onChange={(e) => onChange({ [k]: e.target.value } as Partial<ClientLoadRequest>)} />
    </div>
  );
}

