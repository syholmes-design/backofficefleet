"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Capability = "read" | "draft" | "approve" | "admin";
type DraftStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";

type MailboxRow = { id: string; address: string; displayName: string; scope: string; status: string; capabilities: Capability[] };
type Overview = {
  mailbox: { id: string; address: string; displayName: string; status: string; sendEnabled: boolean; recipientDomainAllowlist: string[] };
  capabilities: Capability[];
  sendingGloballyEnabled: boolean;
  sync: { lastAttemptAt: string | null; lastError: string | null };
};
type ThreadSummary = { id: string; subject: string; lastMessageAt: string; messageCount: number; lastFromAddress: string | null; snippet: string; partner: string | null };
type Message = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  messageIdHeader: string;
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  textBody: string;
  receivedAt: string;
};
type Draft = {
  id: string;
  threadId: string | null;
  inReplyTo: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  textBody: string;
  status: DraftStatus;
  contentHash: string;
  createdByKind: "USER" | "AGENT" | "SYSTEM";
  lastError: string | null;
  updatedAt: string;
};
type ThreadDetail = {
  thread: { id: string; subject: string };
  messages: Message[];
  drafts: Draft[];
  links: Array<{ entityType: string; entityId: string }>;
  suggestedPartner: { partnerId: string; name: string } | null;
};
type DraftDetail = {
  draft: Draft;
  approval: { decision: string; decidedAt: string; expiresAt: string; note: string | null } | null;
  sendCheck: { allowed: true } | { allowed: false; reasons: string[] };
};
type Composer = { draftId: string | null; threadId: string | null; inReplyTo: string | null; to: string; cc: string; subject: string; body: string };

type Tab = "inbox" | "approvals" | "drafts";

const EDITABLE: ReadonlySet<DraftStatus> = new Set(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"]);

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string; reason?: string; reasons?: string[] };
  if (!response.ok) {
    const detail = payload.reasons?.join("; ") ?? payload.reason ?? payload.error ?? `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return payload;
}

export function EmailInboxClient() {
  const [mailboxes, setMailboxes] = useState<MailboxRow[] | null>(null);
  const [mailboxId, setMailboxId] = useState<string>("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [tab, setTab] = useState<Tab>("inbox");
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);
  const [draftDetail, setDraftDetail] = useState<DraftDetail | null>(null);
  const [composer, setComposer] = useState<Composer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const caps = useMemo(() => new Set(overview?.capabilities ?? []), [overview]);
  const base = mailboxId ? `/api/email/mailboxes/${encodeURIComponent(mailboxId)}` : "";
  const pendingCount = drafts.filter((d) => d.status === "PENDING_APPROVAL").length;

  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void run(async () => {
      const { mailboxes: rows } = await api<{ mailboxes: MailboxRow[] }>("/api/email/mailboxes");
      setMailboxes(rows);
      if (rows[0]) setMailboxId(rows[0].id);
    });
  }, [run]);

  const loadLists = useCallback(async () => {
    if (!base) return;
    const q = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    const [ov, th, dr] = await Promise.all([
      api<Overview>(base),
      api<{ threads: ThreadSummary[] }>(`${base}/threads${q}`),
      api<{ drafts: Draft[] }>(`${base}/drafts`),
    ]);
    setOverview(ov);
    setThreads(th.threads);
    setDrafts(dr.drafts);
  }, [base, query]);

  useEffect(() => {
    void run(loadLists);
  }, [run, loadLists]);

  const openThread = useCallback(
    (id: string) =>
      run(async () => {
        setDraftDetail(null);
        setComposer(null);
        setThreadDetail(await api<ThreadDetail>(`${base}/threads/${encodeURIComponent(id)}`));
      }),
    [base, run],
  );

  const openDraft = useCallback(
    (id: string) =>
      run(async () => {
        setComposer(null);
        setThreadDetail(null);
        setDraftDetail(await api<DraftDetail>(`${base}/drafts/${encodeURIComponent(id)}`));
      }),
    [base, run],
  );

  function startReply(detail: ThreadDetail) {
    const lastInbound = [...detail.messages].reverse().find((m) => m.direction === "INBOUND");
    const last = detail.messages[detail.messages.length - 1];
    const to = lastInbound?.fromAddress ?? last?.toAddresses[0] ?? "";
    const subject = detail.thread.subject.match(/^re:/i) ? detail.thread.subject : `Re: ${detail.thread.subject}`;
    setComposer({ draftId: null, threadId: detail.thread.id, inReplyTo: (lastInbound ?? last)?.messageIdHeader ?? null, to, cc: "", subject, body: "" });
  }

  function startNew() {
    setThreadDetail(null);
    setDraftDetail(null);
    setComposer({ draftId: null, threadId: null, inReplyTo: null, to: "", cc: "", subject: "", body: "" });
  }

  function editDraft(d: Draft) {
    setDraftDetail(null);
    setComposer({ draftId: d.id, threadId: d.threadId, inReplyTo: d.inReplyTo, to: d.toAddresses.join(", "), cc: d.ccAddresses.join(", "), subject: d.subject, body: d.textBody });
  }

  function saveDraft(event: FormEvent, submit: boolean) {
    event.preventDefault();
    if (!composer) return;
    void run(async () => {
      const payload = { to: composer.to, cc: composer.cc, subject: composer.subject, body: composer.body };
      const { draft } = composer.draftId
        ? await api<{ draft: Draft }>(`${base}/drafts/${composer.draftId}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await api<{ draft: Draft }>(`${base}/drafts`, {
            method: "POST",
            body: JSON.stringify({ ...payload, threadId: composer.threadId, inReplyTo: composer.inReplyTo }),
          });
      if (submit) await api(`${base}/drafts/${draft.id}/submit`, { method: "POST" });
      setNotice(submit ? "Draft submitted for approval. Nothing has been sent." : "Draft saved. Nothing has been sent.");
      setComposer(null);
      await loadLists();
      setDraftDetail(await api<DraftDetail>(`${base}/drafts/${draft.id}`));
    });
  }

  function draftAction(path: string, init: RequestInit, message: string) {
    if (!draftDetail) return;
    const id = draftDetail.draft.id;
    void run(async () => {
      try {
        await api(`${base}/drafts/${id}${path}`, init);
        setNotice(message);
      } finally {
        await loadLists();
        setDraftDetail(await api<DraftDetail>(`${base}/drafts/${id}`).catch(() => null));
      }
    });
  }

  function syncNow() {
    void run(async () => {
      const result = await api<{ folders: Array<{ folder: string; inserted: number; error?: string }> }>(`${base}/sync`, { method: "POST" });
      const inserted = result.folders.reduce((n, f) => n + f.inserted, 0);
      const failed = result.folders.filter((f) => f.error);
      setNotice(failed.length ? `Sync finished with errors: ${failed.map((f) => `${f.folder}: ${f.error}`).join("; ")}` : `Sync complete: ${inserted} new message(s).`);
      await loadLists();
    });
  }

  const listDrafts = tab === "approvals" ? drafts.filter((d) => d.status === "PENDING_APPROVAL") : drafts.filter((d) => d.status !== "CANCELLED");
  const sendingOff = overview ? !overview.sendingGloballyEnabled || !overview.mailbox.sendEnabled : true;

  if (mailboxes && mailboxes.length === 0) {
    return (
      <main className="bof-email-page">
        <div className="bof-email-shell">
          <header className="bof-email-header"><div><p className="bof-home-eyebrow">BOF correspondence</p><h1>Email</h1></div></header>
          <div className="bof-email-empty-state"><h2>No mailboxes available</h2><p>You don&apos;t have access to a BOF mailbox. Ask a BOF administrator to add you as an approver or grant a role.</p></div>
        </div>
      </main>
    );
  }

  return (
    <main className="bof-email-page">
      <div className="bof-email-shell">
        <header className="bof-email-header">
          <div>
            <p className="bof-home-eyebrow">BOF correspondence</p>
            <h1>{overview?.mailbox.displayName ?? "Email"}</h1>
            <p>
              {overview?.mailbox.address} · Last sync: {formatDate(overview?.sync.lastAttemptAt ?? null)}
              {overview?.sync.lastError ? <span className="bof-email-sync-error"> (failed: {overview.sync.lastError})</span> : null}
            </p>
          </div>
          <div className="bof-email-header-actions">
            {mailboxes && mailboxes.length > 1 ? (
              <label className="bof-email-field">Mailbox<select value={mailboxId} onChange={(e) => setMailboxId(e.target.value)}>{mailboxes.map((m) => <option key={m.id} value={m.id}>{m.address}</option>)}</select></label>
            ) : null}
            <span className={`bof-email-chip bof-email-chip--${(overview?.mailbox.status ?? "unknown").toLowerCase()}`}>Mailbox {statusLabel(overview?.mailbox.status ?? "loading")}</span>
            <button type="button" onClick={syncNow} disabled={busy || overview?.mailbox.status !== "ACTIVE"}>Sync now</button>
            {caps.has("draft") ? <button type="button" className="bof-email-primary" onClick={startNew} disabled={busy}>New message</button> : null}
          </div>
        </header>

        {sendingOff ? (
          <p className="bof-email-banner" role="status">
            Outbound sending is disabled{overview && !overview.sendingGloballyEnabled ? " for this BOF environment" : " for this mailbox"}. Drafts can be written and approved; approved text can be copied into Outlook.
          </p>
        ) : null}
        {error ? <p className="bof-email-error" role="alert">{error}</p> : null}
        {notice ? <p className="bof-email-notice" role="status" onClick={() => setNotice(null)}>{notice}</p> : null}

        <div className="bof-email-layout">
          <aside className="bof-email-sidebar">
            <div className="bof-email-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === "inbox"} className={tab === "inbox" ? "is-active" : ""} onClick={() => setTab("inbox")}>Inbox</button>
              <button type="button" role="tab" aria-selected={tab === "approvals"} className={tab === "approvals" ? "is-active" : ""} onClick={() => setTab("approvals")}>Approvals{pendingCount ? <span>{pendingCount}</span> : null}</button>
              <button type="button" role="tab" aria-selected={tab === "drafts"} className={tab === "drafts" ? "is-active" : ""} onClick={() => setTab("drafts")}>Drafts</button>
            </div>
            {tab === "inbox" ? (
              <>
                <form className="bof-email-search" onSubmit={(e) => { e.preventDefault(); void run(loadLists); }}>
                  <input aria-label="Search correspondence" placeholder="Search subject, body, sender…" value={query} onChange={(e) => setQuery(e.target.value)} />
                </form>
                <div className="bof-email-list">
                  {threads.map((t) => (
                    <button key={t.id} type="button" className={threadDetail?.thread.id === t.id ? "is-selected" : ""} onClick={() => void openThread(t.id)}>
                      <strong>{t.subject}</strong>
                      <span>{t.lastFromAddress ?? "—"}{t.partner ? <em className="bof-email-partner">{t.partner}</em> : null}</span>
                      <small>{formatDate(t.lastMessageAt)} · {t.messageCount} message{t.messageCount === 1 ? "" : "s"}</small>
                      <p>{t.snippet}</p>
                    </button>
                  ))}
                  {threads.length === 0 ? <p className="bof-email-empty">{query ? "No matching correspondence." : "No correspondence synced yet."}</p> : null}
                </div>
              </>
            ) : (
              <div className="bof-email-list">
                {listDrafts.map((d) => (
                  <button key={d.id} type="button" className={draftDetail?.draft.id === d.id ? "is-selected" : ""} onClick={() => void openDraft(d.id)}>
                    <strong>{d.subject}</strong>
                    <span>To {d.toAddresses.join(", ")}</span>
                    <small><span className={`bof-email-status bof-email-status--${d.status.toLowerCase()}`}>{statusLabel(d.status)}</span>{d.createdByKind === "AGENT" ? " · drafted by Claude" : ""}</small>
                  </button>
                ))}
                {listDrafts.length === 0 ? <p className="bof-email-empty">{tab === "approvals" ? "Nothing waiting for approval." : "No drafts."}</p> : null}
              </div>
            )}
          </aside>

          <section className="bof-email-main" aria-live="polite">
            {composer ? (
              <form className="bof-email-composer" onSubmit={(e) => saveDraft(e, false)}>
                <h2>{composer.draftId ? "Edit draft" : composer.threadId ? "Reply" : "New message"}</h2>
                <p className="bof-email-hint">Saving creates a draft in BOF. Nothing is sent from this screen.{composer.draftId ? " Editing returns the draft to DRAFT and clears any approval." : ""}</p>
                <label className="bof-email-field">To<input value={composer.to} onChange={(e) => setComposer({ ...composer, to: e.target.value })} required placeholder="partners@checkr.com" /></label>
                <label className="bof-email-field">Cc<input value={composer.cc} onChange={(e) => setComposer({ ...composer, cc: e.target.value })} /></label>
                <label className="bof-email-field">Subject<input value={composer.subject} onChange={(e) => setComposer({ ...composer, subject: e.target.value })} required maxLength={300} /></label>
                <label className="bof-email-field">Message<textarea value={composer.body} onChange={(e) => setComposer({ ...composer, body: e.target.value })} required rows={14} maxLength={20000} /></label>
                {overview?.mailbox.recipientDomainAllowlist.length ? <p className="bof-email-hint">Allowed recipient domains: {overview.mailbox.recipientDomainAllowlist.join(", ")}</p> : null}
                <div className="bof-email-actions">
                  <button type="submit" disabled={busy}>Save draft</button>
                  <button type="button" className="bof-email-primary" disabled={busy} onClick={(e) => saveDraft(e, true)}>Save and submit for approval</button>
                  <button type="button" onClick={() => setComposer(null)}>Discard changes</button>
                </div>
              </form>
            ) : draftDetail ? (
              <article className="bof-email-draft">
                <header>
                  <span className={`bof-email-status bof-email-status--${draftDetail.draft.status.toLowerCase()}`}>{statusLabel(draftDetail.draft.status)}</span>
                  <h2>{draftDetail.draft.subject}</h2>
                  <p>{draftDetail.draft.createdByKind === "AGENT" ? "Drafted by Claude · " : ""}Updated {formatDate(draftDetail.draft.updatedAt)}</p>
                </header>
                <dl className="bof-email-meta">
                  <div><dt>From</dt><dd>{overview?.mailbox.address}</dd></div>
                  <div><dt>To</dt><dd>{draftDetail.draft.toAddresses.join(", ")}</dd></div>
                  {draftDetail.draft.ccAddresses.length ? <div><dt>Cc</dt><dd>{draftDetail.draft.ccAddresses.join(", ")}</dd></div> : null}
                  <div><dt>Content hash</dt><dd><code>{draftDetail.draft.contentHash.slice(0, 16)}</code></dd></div>
                  {draftDetail.approval ? <div><dt>Decision</dt><dd>{statusLabel(draftDetail.approval.decision)} {formatDate(draftDetail.approval.decidedAt)}{draftDetail.approval.decision === "APPROVED" ? ` · expires ${formatDate(draftDetail.approval.expiresAt)}` : ""}{draftDetail.approval.note ? ` · “${draftDetail.approval.note}”` : ""}</dd></div> : null}
                </dl>
                <p className="bof-email-hint">This is the exact text an approver signs off on.</p>
                <pre className="bof-email-body">{draftDetail.draft.textBody}</pre>
                {draftDetail.draft.lastError ? <p className="bof-email-error">Last error: {draftDetail.draft.lastError}</p> : null}
                <div className="bof-email-actions">
                  {caps.has("draft") && EDITABLE.has(draftDetail.draft.status) ? <button type="button" onClick={() => editDraft(draftDetail.draft)}>Edit</button> : null}
                  {caps.has("draft") && draftDetail.draft.status === "DRAFT" ? <button type="button" className="bof-email-primary" disabled={busy} onClick={() => draftAction("/submit", { method: "POST" }, "Submitted for approval.")}>Submit for approval</button> : null}
                  {caps.has("approve") && draftDetail.draft.status === "PENDING_APPROVAL" ? (
                    <>
                      <button type="button" className="bof-email-approve" disabled={busy} onClick={() => draftAction("/decision", { method: "POST", body: JSON.stringify({ decision: "APPROVED" }) }, "Approved. Sending remains disabled until separately authorized.")}>Approve this exact text</button>
                      <button type="button" className="bof-email-reject" disabled={busy} onClick={() => { const note = window.prompt("Reason for rejection (optional)") ?? undefined; draftAction("/decision", { method: "POST", body: JSON.stringify({ decision: "REJECTED", note }) }, "Rejected."); }}>Reject</button>
                    </>
                  ) : null}
                  {caps.has("approve") && draftDetail.draft.status === "APPROVED" ? (
                    <button type="button" className="bof-email-primary" disabled={busy || !draftDetail.sendCheck.allowed} title={draftDetail.sendCheck.allowed ? "Send now" : draftDetail.sendCheck.reasons.join("\n")} onClick={() => { if (window.confirm(`Send to ${draftDetail.draft.toAddresses.join(", ")}?`)) draftAction("/send", { method: "POST" }, "Sent."); }}>Send</button>
                  ) : null}
                  {caps.has("approve") && draftDetail.draft.status === "APPROVED" ? <button type="button" onClick={() => void navigator.clipboard?.writeText(draftDetail.draft.textBody).then(() => setNotice("Approved text copied. Paste it into Outlook to send manually."))}>Copy approved text</button> : null}
                  {caps.has("draft") && EDITABLE.has(draftDetail.draft.status) ? <button type="button" onClick={() => { if (window.confirm("Cancel this draft?")) draftAction("", { method: "DELETE" }, "Draft cancelled."); }}>Cancel draft</button> : null}
                </div>
                {draftDetail.draft.status === "APPROVED" && !draftDetail.sendCheck.allowed ? (
                  <div className="bof-email-gates"><strong>Why Send is unavailable</strong><ul>{draftDetail.sendCheck.reasons.map((r) => <li key={r}>{r}</li>)}</ul></div>
                ) : null}
              </article>
            ) : threadDetail ? (
              <article className="bof-email-thread">
                <header>
                  <h2>{threadDetail.thread.subject}</h2>
                  <p>
                    {threadDetail.messages.length} message{threadDetail.messages.length === 1 ? "" : "s"}
                    {threadDetail.suggestedPartner ? <> · <em className="bof-email-partner">{threadDetail.suggestedPartner.name}</em></> : null}
                    {threadDetail.links.length ? ` · linked: ${threadDetail.links.map((l) => `${l.entityType} ${l.entityId}`).join(", ")}` : ""}
                  </p>
                  <div className="bof-email-actions">
                    {caps.has("draft") ? <button type="button" className="bof-email-primary" onClick={() => startReply(threadDetail)}>Reply (draft)</button> : null}
                    {caps.has("draft") && threadDetail.suggestedPartner && !threadDetail.links.some((l) => l.entityType === "partner") ? (
                      <button type="button" onClick={() => void run(async () => { await api(`${base}/threads/${threadDetail.thread.id}/link`, { method: "POST", body: JSON.stringify({ entityType: "partner", entityId: threadDetail.suggestedPartner!.partnerId }) }); setThreadDetail(await api<ThreadDetail>(`${base}/threads/${threadDetail.thread.id}`)); })}>Link to {threadDetail.suggestedPartner.name}</button>
                    ) : null}
                  </div>
                </header>
                {threadDetail.messages.map((m) => (
                  <section key={m.id} className={`bof-email-message bof-email-message--${m.direction.toLowerCase()}`}>
                    <div className="bof-email-message-meta">
                      <strong>{m.fromName ? `${m.fromName} <${m.fromAddress}>` : m.fromAddress}</strong>
                      <span>{formatDate(m.receivedAt)}</span>
                    </div>
                    <small>To {m.toAddresses.join(", ")}{m.ccAddresses.length ? ` · Cc ${m.ccAddresses.join(", ")}` : ""}</small>
                    <pre className="bof-email-body">{m.textBody}</pre>
                  </section>
                ))}
                {threadDetail.drafts.length ? (
                  <div className="bof-email-thread-drafts"><h3>Drafts in this thread</h3>{threadDetail.drafts.map((d) => <button key={d.id} type="button" onClick={() => void openDraft(d.id)}><span className={`bof-email-status bof-email-status--${d.status.toLowerCase()}`}>{statusLabel(d.status)}</span> {d.subject}{d.createdByKind === "AGENT" ? " · drafted by Claude" : ""}</button>)}</div>
                ) : null}
              </article>
            ) : (
              <div className="bof-email-empty-state"><h2>Select a conversation</h2><p>Choose a thread to read it, or open Approvals to review drafts waiting on you.</p></div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
