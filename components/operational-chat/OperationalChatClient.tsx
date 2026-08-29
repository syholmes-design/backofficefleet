"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Thread = {
  id: string;
  subject: string;
  type: string;
  visibility: string;
  status: string;
  recordType?: string | null;
  recordId?: string | null;
  ownerId?: string | null;
  nextAction?: string | null;
  dueAt?: string | null;
  unreadCount?: number;
  messages: Array<{ id: string; body: string; visibility: string; state: string; createdAt: string; editedAt?: string | null; deletedAt?: string | null; sender: { name?: string | null; email: string } }>;
  citations: Array<{ id: string; title: string; recordType: string; recordId: string; route?: string | null }>;
};

type Props = { initialFleetId: string; initialRecordType?: string; initialRecordId?: string };

const RECORD_TYPES = new Set(["LOAD", "DRIVER", "DOCUMENT_REQUEST", "PROOF", "EXCEPTION", "SAFETY_EVENT", "COMPLIANCE_ISSUE", "MAINTENANCE_ISSUE"]);

function threadTypeForRecord(recordType: string) {
  if (recordType === "LOAD") return "LOAD_THREAD";
  if (recordType === "DRIVER") return "DRIVER_THREAD";
  if (recordType === "DOCUMENT_REQUEST" || recordType === "PROOF") return "DOCUMENT_THREAD";
  if (recordType === "SAFETY_EVENT" || recordType === "COMPLIANCE_ISSUE") return "SAFETY_COMPLIANCE_THREAD";
  if (recordType === "MAINTENANCE_ISSUE") return "MAINTENANCE_THREAD";
  return "EXCEPTION_THREAD";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function OperationalChatClient({ initialFleetId, initialRecordType, initialRecordId }: Props) {
  const hasRecordContext = Boolean(initialRecordType && initialRecordId && RECORD_TYPES.has(initialRecordType));
  const [fleetId, setFleetId] = useState(initialFleetId);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [newSubject, setNewSubject] = useState(hasRecordContext ? `Conversation about ${initialRecordType?.replaceAll("_", " ").toLowerCase()}` : "");
  const [newType, setNewType] = useState(hasRecordContext ? threadTypeForRecord(initialRecordType!) : "GENERAL_INTERNAL_THREAD");
  const [newVisibility, setNewVisibility] = useState("INTERNAL");
  const [recordType, setRecordType] = useState(hasRecordContext ? initialRecordType! : "");
  const [recordId, setRecordId] = useState(hasRecordContext ? initialRecordId! : "");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const selected = threads.find((thread) => thread.id === selectedId) ?? null;

  const loadThreads = useCallback(async () => {
    if (!fleetId.trim()) return;
    const recordQuery = hasRecordContext ? `&recordType=${encodeURIComponent(recordType)}&recordId=${encodeURIComponent(recordId)}` : "";
    const response = await fetch(`/api/operational-chat/threads?fleetId=${encodeURIComponent(fleetId)}${recordQuery}`, { cache: "no-store" });
    if (!response.ok) throw new Error((await response.json()).error ?? "Unable to load conversations");
    const nextThreads = await response.json() as Thread[];
    setThreads(nextThreads);
    if (!selectedId && nextThreads[0]) setSelectedId(nextThreads[0].id);
  }, [fleetId, hasRecordContext, recordId, recordType, selectedId]);

  useEffect(() => {
    loadThreads().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load conversations"));
  }, [loadThreads]);

  async function createThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch("/api/operational-chat/threads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fleetId, subject: newSubject, type: newType, visibility: newVisibility, recordType: recordType || undefined, recordId: recordId || undefined }) });
      if (!response.ok) throw new Error((await response.json()).error ?? "Unable to create thread");
      const thread = await response.json() as Thread;
      setThreads((current) => [thread, ...current]);
      setSelectedId(thread.id);
      setNewSubject("");
      if (!hasRecordContext) {
        setRecordType("");
        setRecordId("");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create thread");
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !body.trim()) return;
    setError(null);
    try {
      const response = await fetch(`/api/operational-chat/threads/${selected.id}/messages?fleetId=${encodeURIComponent(fleetId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, visibility: selected.visibility }) });
      if (!response.ok) throw new Error((await response.json()).error ?? "Unable to send message");
      const message = await response.json();
      setThreads((current) => current.map((thread) => thread.id === selected.id ? { ...thread, messages: [...thread.messages, message], updatedAt: new Date().toISOString() } : thread));
      setBody("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send message");
    }
  }

  async function markRead(threadId: string) {
    await fetch(`/api/operational-chat/threads/${threadId}?fleetId=${encodeURIComponent(fleetId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read" }) });
  }

  async function resolveThread() {
    if (!selected) return;
    const response = await fetch(`/api/operational-chat/threads/${selected.id}?fleetId=${encodeURIComponent(fleetId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "resolve" }) });
    if (!response.ok) { setError((await response.json()).error ?? "Unable to resolve thread"); return; }
    const resolved = await response.json() as Thread;
    setThreads((current) => current.map((thread) => thread.id === resolved.id ? resolved : thread));
  }

  async function editMessage(messageId: string) {
    const response = await fetch(`/api/operational-chat/messages/${messageId}?fleetId=${encodeURIComponent(fleetId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: editingBody }) });
    if (!response.ok) { setError((await response.json()).error ?? "Unable to edit message"); return; }
    const updated = await response.json();
    setThreads((current) => current.map((thread) => thread.id === selected?.id ? { ...thread, messages: thread.messages.map((message) => message.id === messageId ? { ...message, ...updated } : message) } : thread));
    setEditingMessageId(null);
    setEditingBody("");
  }

  async function deleteMessage(messageId: string) {
    const response = await fetch(`/api/operational-chat/messages/${messageId}?fleetId=${encodeURIComponent(fleetId)}`, { method: "DELETE" });
    if (!response.ok) { setError((await response.json()).error ?? "Unable to delete message"); return; }
    setThreads((current) => current.map((thread) => thread.id === selected?.id ? { ...thread, messages: thread.messages.map((message) => message.id === messageId ? { ...message, deletedAt: new Date().toISOString(), body: "Message deleted" } : message) } : thread));
  }

  return (
    <main className="bof-chat-page">
      <div className="bof-chat-shell">
        <header className="bof-chat-header">
          <div><p className="bof-home-eyebrow">BOF operational communication</p><h1>Conversations</h1><p>Communication becomes action, record, accountability, and resolution.</p></div>
          <label className="bof-chat-fleet-selector">Authorized fleet ID<input value={fleetId} onChange={(event) => setFleetId(event.target.value)} /></label>
        </header>
        {error ? <p className="bof-chat-error" role="alert">{error}</p> : null}
        <div className="bof-chat-layout">
          <aside className="bof-chat-sidebar">
            <div className="bof-chat-sidebar-head"><h2>Conversations</h2><span>{threads.length}</span></div>
            <form className="bof-chat-new-thread" onSubmit={createThread}>
              <input aria-label="Conversation subject" placeholder="New conversation subject" value={newSubject} onChange={(event) => setNewSubject(event.target.value)} required />
              {hasRecordContext ? <p className="bof-chat-linked-record">Linked to {recordType.replaceAll("_", " ").toLowerCase()}: <strong>{recordId}</strong></p> : <select aria-label="Conversation type" value={newType} onChange={(event) => setNewType(event.target.value)}><option value="GENERAL_INTERNAL_THREAD">General internal</option><option value="LOAD_THREAD">Load</option><option value="DRIVER_THREAD">Driver</option><option value="DOCUMENT_THREAD">Document</option><option value="EXCEPTION_THREAD">Exception</option><option value="SAFETY_COMPLIANCE_THREAD">Safety / compliance</option><option value="SETTLEMENT_THREAD">Settlement</option><option value="MAINTENANCE_THREAD">Maintenance</option></select>}
              <select aria-label="Conversation visibility" value={newVisibility} onChange={(event) => setNewVisibility(event.target.value)}><option value="INTERNAL">Internal only</option><option value="CUSTOMER_VISIBLE">Customer visible</option></select>
              {!hasRecordContext ? <div className="bof-chat-record-fields"><input aria-label="Record type" placeholder="Record type" value={recordType} onChange={(event) => setRecordType(event.target.value)} /><input aria-label="Record ID" placeholder="Record ID" value={recordId} onChange={(event) => setRecordId(event.target.value)} /></div> : null}
              <button type="submit">Create conversation</button>
            </form>
            <div className="bof-chat-thread-list">{threads.map((thread) => <button key={thread.id} type="button" className={thread.id === selectedId ? "is-selected" : ""} onClick={() => { setSelectedId(thread.id); void markRead(thread.id); }}><strong>{thread.subject}</strong><span>{thread.type.replaceAll("_", " ")} · {thread.status}</span><small>{thread.messages.length} messages {thread.unreadCount ? `· ${thread.unreadCount} unread` : ""}</small></button>)}{threads.length === 0 ? <p className="bof-chat-empty">No authorized conversations for this fleet.</p> : null}</div>
          </aside>
          <section className="bof-chat-conversation" aria-label="Operational conversation">
            {selected ? <>
              <header className="bof-chat-context"><div><span className={`bof-chat-status bof-chat-status--${selected.status.toLowerCase()}`}>{selected.status}</span><h2>{selected.subject}</h2><p>{selected.type.replaceAll("_", " ")} · {selected.visibility === "INTERNAL" ? "Internal only" : "Customer visible"}</p></div><div className="bof-chat-context-actions"><button type="button" onClick={resolveThread} disabled={selected.status === "RESOLVED"}>Resolve</button><button type="button" onClick={() => markRead(selected.id)}>Mark read</button></div><dl><div><dt>Record</dt><dd>{selected.citations[0]?.title ?? (selected.recordType && selected.recordId ? `${selected.recordType}: ${selected.recordId}` : "Not associated")}</dd></div><div><dt>Owner</dt><dd>{selected.ownerId ?? "Unassigned"}</dd></div><div><dt>Next action</dt><dd>{selected.nextAction ?? "Not set"}</dd></div></dl></header>
              <div className="bof-chat-messages">{selected.messages.map((message) => <article key={message.id} className={`bof-chat-message bof-chat-message--${message.visibility.toLowerCase()}`}><div className="bof-chat-message-meta"><strong>{message.sender.name ?? message.sender.email}</strong><span>{message.visibility === "INTERNAL" ? "Internal" : "Customer visible"} · {formatDate(message.createdAt)}</span></div>{editingMessageId === message.id ? <div className="bof-chat-message-edit"><textarea value={editingBody} onChange={(event) => setEditingBody(event.target.value)} /><div><button type="button" onClick={() => void editMessage(message.id)}>Save edit</button><button type="button" onClick={() => { setEditingMessageId(null); setEditingBody(""); }}>Cancel</button></div></div> : <><p>{message.deletedAt ? "Message deleted" : message.body}{message.editedAt && !message.deletedAt ? " (edited)" : ""}</p>{!message.deletedAt ? <div className="bof-chat-message-actions"><button type="button" onClick={() => { setEditingMessageId(message.id); setEditingBody(message.body); }}>Edit</button><button type="button" onClick={() => void deleteMessage(message.id)}>Delete</button></div> : null}</>}</article>)}{selected.messages.length === 0 ? <p className="bof-chat-empty">No messages yet. Start the operational record here.</p> : null}</div>
              <form className="bof-chat-composer" onSubmit={sendMessage}><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={selected.visibility === "INTERNAL" ? "Write an internal operational update..." : "Write a customer-visible update..."} /><button type="submit">Send message</button></form>
            </> : <div className="bof-chat-empty-state"><span>BOF</span><h2>Select an authorized conversation</h2><p>Choose a conversation or create one linked to a durable operational record.</p></div>}
          </section>
        </div>
      </div>
    </main>
  );
}
