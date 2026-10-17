"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ORGANIZATION_TYPES } from "@/lib/contact/contactInquiry";

type InquiryStatus = "NEW" | "IN_REVIEW" | "CONTACTED" | "QUALIFIED" | "CLOSED";

type StaffMember = { id: string; name: string | null; email: string };

type InquirySummary = {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string | null;
  organizationType: string;
  services: string[];
  message: string;
  department: string | null;
  status: InquiryStatus;
  assignedToUserId: string | null;
  assignedTo: StaffMember | null;
  nextFollowUpAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
};

type Activity = {
  id: string;
  inquiryId: string;
  activityType: string;
  description: string;
  actor: StaffMember | null;
  createdAt: string;
};

type ListResponse = {
  summary: { total: number; byStatus: Record<InquiryStatus, number>; overdueFollowUps: number };
  staff: StaffMember[];
  inquiries: InquirySummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  error?: string;
};

const STATUS_LABELS: Record<InquiryStatus, string> = {
  NEW: "New",
  IN_REVIEW: "In review",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  CLOSED: "Closed",
};

const STATUS_STYLES: Record<InquiryStatus, string> = {
  NEW: "bg-sky-500/20 text-sky-100 ring-sky-400/40",
  IN_REVIEW: "bg-violet-500/20 text-violet-100 ring-violet-400/40",
  CONTACTED: "bg-amber-500/20 text-amber-50 ring-amber-400/40",
  QUALIFIED: "bg-emerald-500/20 text-emerald-50 ring-emerald-400/40",
  CLOSED: "bg-slate-500/20 text-slate-200 ring-slate-400/30",
};

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInputValue(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function followUpInstant(iso: string | null | undefined) {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? null : time;
}

function organizationLabel(value: string) {
  return ORGANIZATION_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function ContactInquiriesDashboard() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | InquiryStatus>("");
  const [sort, setSort] = useState<"createdAt" | "lastActivityAt">("lastActivityAt");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<ListResponse | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ inquiry: InquirySummary; activities: Activity[] } | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (statusFilter) params.set("status", statusFilter);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "25");
    try {
      const response = await fetch(`/api/contact/inquiries?${params.toString()}`, { cache: "no-store" });
      const body = (await response.json()) as ListResponse;
      if (!response.ok) {
        setListError(body.error ?? "Could not load inquiries.");
        setList(null);
        return;
      }
      setList(body);
      setSelectedId((current) => {
        if (body.inquiries.length === 0) return null;
        if (current && body.inquiries.some((row) => row.id === current)) return current;
        return body.inquiries[0]?.id ?? null;
      });
    } catch {
      setListError("Could not load inquiries.");
      setList(null);
    } finally {
      setLoadingList(false);
    }
  }, [page, query, sort, statusFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const response = await fetch(`/api/contact/inquiries/${id}`, { cache: "no-store" });
      const body = (await response.json()) as {
        inquiry?: InquirySummary;
        activities?: Activity[];
        error?: string;
      };
      if (!response.ok || !body.inquiry) {
        setDetailError(body.error ?? "Could not load inquiry.");
        setDetail(null);
        return;
      }
      setDetail({ inquiry: body.inquiry, activities: body.activities ?? [] });
    } catch {
      setDetailError("Could not load inquiry.");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [loadDetail, selectedId]);

  const patchInquiry = async (patch: Record<string, unknown>) => {
    if (!selectedId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/contact/inquiries/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = (await response.json()) as { inquiry?: InquirySummary; error?: string };
      if (!response.ok || !body.inquiry) {
        setSaveError(body.error ?? "Could not save changes.");
        return;
      }
      await Promise.all([loadList(), loadDetail(selectedId)]);
    } catch {
      setSaveError("Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!selectedId || note.trim().length < 2) return;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/contact/inquiries/${selectedId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: note.trim(), activityType: "NOTE" }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setSaveError(body.error ?? "Could not save note.");
        return;
      }
      setNote("");
      await Promise.all([loadList(), loadDetail(selectedId)]);
    } catch {
      setSaveError("Could not save note.");
    } finally {
      setSaving(false);
    }
  };

  const selectedInList = useMemo(
    () => list?.inquiries.find((row) => row.id === selectedId) ?? null,
    [list, selectedId],
  );

  const inquiry = detail?.inquiry ?? selectedInList;

  return (
    <div className="mt-6 space-y-6">
      {list?.summary ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Pipeline summary">
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Open pipeline</p>
            <p className="mt-1 text-2xl font-semibold text-white">{list.summary.total}</p>
            <p className="mt-1 text-xs text-slate-400">All saved inquiries</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Needs first touch</p>
            <p className="mt-1 text-2xl font-semibold text-sky-100">{list.summary.byStatus.NEW}</p>
            <p className="mt-1 text-xs text-slate-400">Status: New</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Qualified opportunities</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-100">{list.summary.byStatus.QUALIFIED}</p>
            <p className="mt-1 text-xs text-slate-400">Ready for proposal / onboarding</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Overdue follow-ups</p>
            <p className="mt-1 text-2xl font-semibold text-amber-100">{list.summary.overdueFollowUps}</p>
            <p className="mt-1 text-xs text-slate-400">Excludes closed inquiries</p>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4 lg:flex-row lg:items-end">
        <label className="flex-1 text-sm text-slate-200">
          Search company, contact, or email
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-white"
            placeholder="North Line, avery@…"
          />
        </label>
        <label className="text-sm text-slate-200">
          Status
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value as "" | InquiryStatus);
            }}
            className="mt-1 w-full min-w-[10rem] rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-white"
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_LABELS) as InquiryStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-200">
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as "createdAt" | "lastActivityAt")}
            className="mt-1 w-full min-w-[10rem] rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-white"
          >
            <option value="lastActivityAt">Last activity</option>
            <option value="createdAt">Submitted date</option>
          </select>
        </label>
      </section>

      {listError ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-rose-50" role="alert">
          {listError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section aria-label="Inquiry list" className="space-y-2">
          {loadingList ? <p className="text-slate-400">Loading inquiries…</p> : null}
          {!loadingList && list && list.inquiries.length === 0 ? (
            <p className="text-slate-300">No inquiries match your filters.</p>
          ) : null}
          <ul className="space-y-2">
            {list?.inquiries.map((row) => {
              const active = row.id === selectedId;
              const overdue =
                row.nextFollowUpAt &&
                row.status !== "CLOSED" &&
                new Date(row.nextFollowUpAt).getTime() < Date.now();
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-teal-400/60 bg-teal-950/30 ring-1 ring-teal-400/30"
                        : "border-slate-700 bg-slate-900 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{row.companyName}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[row.status]}`}
                      >
                        {STATUS_LABELS[row.status]}
                      </span>
                      {overdue ? (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-100">Follow-up due</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-300">
                      {row.fullName} · {row.email}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {organizationLabel(row.organizationType)} · Last activity {formatWhen(row.lastActivityAt)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
          {list && list.pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2 text-sm text-slate-300">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-md border border-slate-600 px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {list.pagination.page} of {list.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= list.pagination.totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-md border border-slate-600 px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </section>

        <section
          aria-label="Inquiry detail"
          className="rounded-xl border border-slate-700 bg-slate-900 p-5 min-h-[24rem]"
        >
          {!inquiry ? (
            <p className="text-slate-400">Select an inquiry to manage the relationship.</p>
          ) : (
            <>
              {loadingDetail ? <p className="mb-3 text-sm text-slate-400">Refreshing…</p> : null}
              {detailError ? (
                <p className="mb-3 rounded-md border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-50">
                  {detailError}
                </p>
              ) : null}
              {saveError ? (
                <p className="mb-3 rounded-md border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-50">
                  {saveError}
                </p>
              ) : null}

              <header className="border-b border-slate-700 pb-4">
                <h2 className="text-xl font-semibold text-white">{inquiry.companyName}</h2>
                <p className="mt-1 text-sm text-slate-300">
                  {inquiry.fullName} ·{" "}
                  <a className="text-teal-300 underline" href={`mailto:${inquiry.email}`}>
                    {inquiry.email}
                  </a>
                  {inquiry.phone ? (
                    <>
                      {" "}
                      ·{" "}
                      <a className="text-teal-300 underline" href={`tel:${inquiry.phone}`}>
                        {inquiry.phone}
                      </a>
                    </>
                  ) : null}
                </p>
                <p className="mt-2 text-sm text-teal-200">{organizationLabel(inquiry.organizationType)}</p>
                <p className="mt-2 text-sm text-slate-200">{inquiry.services.join(", ")}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-100">{inquiry.message}</p>
                <p className="mt-3 text-xs text-slate-400">Submitted {formatWhen(inquiry.createdAt)}</p>
              </header>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-slate-200">
                  Status
                  <select
                    disabled={saving}
                    value={inquiry.status}
                    onChange={(event) => void patchInquiry({ status: event.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-white"
                  >
                    {(Object.keys(STATUS_LABELS) as InquiryStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-200">
                  Assigned reviewer
                  <select
                    disabled={saving}
                    value={inquiry.assignedToUserId ?? ""}
                    onChange={(event) =>
                      void patchInquiry({
                        assignedToUserId: event.target.value ? event.target.value : null,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="">Unassigned</option>
                    {(list?.staff ?? []).map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name ?? member.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-200">
                  Department / lane
                  <input
                    disabled={saving}
                    defaultValue={inquiry.department ?? ""}
                    key={`dept-${inquiry.id}-${inquiry.updatedAt}`}
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value === (inquiry.department ?? "")) return;
                      void patchInquiry({ department: value || null });
                    }}
                    className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-white"
                    placeholder="Sales, onboarding, compliance…"
                  />
                </label>
                <label className="text-sm text-slate-200">
                  Next follow-up
                  <input
                    disabled={saving}
                    type="datetime-local"
                    defaultValue={toLocalInputValue(inquiry.nextFollowUpAt)}
                    key={`follow-${inquiry.id}-${inquiry.nextFollowUpAt ?? "none"}`}
                    onChange={(event) => {
                      const next = fromLocalInputValue(event.target.value);
                      const nextMs = followUpInstant(next);
                      const currentMs = followUpInstant(inquiry.nextFollowUpAt);
                      if (nextMs === currentMs) return;
                      void patchInquiry({ nextFollowUpAt: next });
                    }}
                    onBlur={(event) => {
                      const next = fromLocalInputValue(event.target.value);
                      const nextMs = followUpInstant(next);
                      const currentMs = followUpInstant(inquiry.nextFollowUpAt);
                      if (nextMs === currentMs) return;
                      void patchInquiry({ nextFollowUpAt: next });
                    }}
                    className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-white"
                  />
                </label>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Activity & notes</h3>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    disabled={saving}
                    placeholder="Log a call, email, or internal note…"
                    className="min-h-[4.5rem] flex-1 rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                  <button
                    type="button"
                    disabled={saving || note.trim().length < 2}
                    onClick={() => void addNote()}
                    className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-40"
                  >
                    Add note
                  </button>
                </div>
                <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                  {(detail?.activities ?? []).length === 0 ? (
                    <li className="text-sm text-slate-400">No activity recorded yet.</li>
                  ) : (
                    detail?.activities.map((activity) => (
                      <li key={activity.id} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">
                        <p className="text-xs text-slate-400">
                          {formatWhen(activity.createdAt)}
                          {activity.actor ? ` · ${activity.actor.name ?? activity.actor.email}` : ""}
                          {" · "}
                          {activity.activityType.replace(/_/g, " ").toLowerCase()}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-100">{activity.description}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
