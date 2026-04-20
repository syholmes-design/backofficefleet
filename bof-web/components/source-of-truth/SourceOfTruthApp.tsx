"use client";

/**
 * Internal demo admin: edits persist via BofDemoDataProvider → localStorage and flow
 * to every client surface that reads `useBofDemoData()` — including dashboard & command
 * center summaries, driver hub, document vault, medical expanded panels, money at risk,
 * loads table, RF actions, and settlement drawer proof alignment.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import type { BofData } from "@/lib/load-bof-data";
import type { DocumentRow } from "@/lib/driver-queries";
import { getDriverMedicalExpanded } from "@/lib/driver-queries";

type Tab = "drivers" | "documents" | "dispatch";

function docKey(d: Pick<DocumentRow, "driverId" | "type">) {
  return `${d.driverId}::${d.type}`;
}

export function SourceOfTruthApp() {
  const { data, hydrated, resetDemoData, updateDriver, updateDocument, updateDriverMedicalExpanded } =
    useBofDemoData();

  const [tab, setTab] = useState<Tab>("drivers");
  const [q, setQ] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedDocKey, setSelectedDocKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [auditReason, setAuditReason] = useState("");

  const [driverDraft, setDriverDraft] = useState<Record<string, string>>({});
  const [docDraft, setDocDraft] = useState<Record<string, string>>({});
  const [medDraft, setMedDraft] = useState<Record<string, string>>({});

  const filteredDrivers = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.drivers.filter(
      (d) =>
        !s ||
        d.id.toLowerCase().includes(s) ||
        d.name.toLowerCase().includes(s) ||
        (d.email && d.email.toLowerCase().includes(s))
    );
  }, [data.drivers, q]);

  const filteredDocs = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.documents.filter((d) => {
      if (!s) return true;
      return (
        d.driverId.toLowerCase().includes(s) ||
        d.type.toLowerCase().includes(s) ||
        (d.status && d.status.toLowerCase().includes(s))
      );
    });
  }, [data.documents, q]);

  const selectedDriver = useMemo(
    () => (selectedDriverId ? data.drivers.find((d) => d.id === selectedDriverId) ?? null : null),
    [data.drivers, selectedDriverId]
  );

  const selectedDoc = useMemo(() => {
    if (!selectedDocKey) return null;
    const [driverId, type] = selectedDocKey.split("::");
    return data.documents.find((d) => d.driverId === driverId && d.type === type) ?? null;
  }, [data.documents, selectedDocKey]);

  useEffect(() => {
    if (!selectedDriver) {
      setDriverDraft({});
      return;
    }
    const d = selectedDriver as Record<string, unknown>;
    setDriverDraft({
      id: selectedDriver.id,
      name: selectedDriver.name ?? "",
      phone: selectedDriver.phone ?? "",
      email: selectedDriver.email ?? "",
      address: selectedDriver.address ?? "",
      referenceCdlNumber: selectedDriver.referenceCdlNumber ?? "",
      dateOfBirth: String(d.dateOfBirth ?? ""),
      complianceStatus: String(d.complianceStatus ?? ""),
      assignedAssetId: String(d.assignedAssetId ?? ""),
      photoUrl: String(d.photoUrl ?? ""),
      emergencyContactName: String(selectedDriver.emergencyContactName ?? ""),
      emergencyContactRelationship: String(selectedDriver.emergencyContactRelationship ?? ""),
      emergencyContactPhone: String(selectedDriver.emergencyContactPhone ?? ""),
    });
  }, [selectedDriver]);

  useEffect(() => {
    if (!selectedDoc) {
      setDocDraft({});
      setMedDraft({});
      return;
    }
    const r = selectedDoc as Record<string, unknown>;
    setDocDraft({
      driverId: selectedDoc.driverId,
      type: selectedDoc.type,
      status: selectedDoc.status ?? "",
      issueDate: String(selectedDoc.issueDate ?? ""),
      expirationDate: String(selectedDoc.expirationDate ?? ""),
      fileUrl: String(selectedDoc.fileUrl ?? ""),
      previewUrl: String(selectedDoc.previewUrl ?? ""),
      cdlNumber: String(r.cdlNumber ?? ""),
      licenseClass: String(r.licenseClass ?? ""),
    });
    if (selectedDoc.type === "Medical Card") {
      const ex = getDriverMedicalExpanded(data, selectedDoc.driverId);
      setMedDraft({
        medicalExaminerName: ex?.medicalExaminerName ?? "",
        medicalIssueDate: ex?.medicalIssueDate ?? "",
        medicalExpirationDate: ex?.medicalExpirationDate ?? "",
        mcsaRegistryNumber: ex?.mcsaRegistryNumber ?? "",
        mcsaExaminerLicense: ex?.mcsaExaminerLicense ?? "",
        mcsaExaminerTelephone: ex?.mcsaExaminerTelephone ?? "",
        driverLicenseNumber: ex?.driverLicenseNumber ?? "",
        driverLicenseState: ex?.driverLicenseState ?? "",
        driverSignatureDate: ex?.driverSignatureDate ?? "",
      });
    } else {
      setMedDraft({});
    }
  }, [selectedDoc, data]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const saveDriver = useCallback(() => {
    if (!selectedDriverId) return;
    const patch: Record<string, unknown> = {
      name: driverDraft.name,
      phone: driverDraft.phone,
      email: driverDraft.email,
      address: driverDraft.address,
      referenceCdlNumber: driverDraft.referenceCdlNumber,
      emergencyContactName: driverDraft.emergencyContactName || undefined,
      emergencyContactRelationship: driverDraft.emergencyContactRelationship || undefined,
      emergencyContactPhone: driverDraft.emergencyContactPhone || undefined,
    };
    if (driverDraft.dateOfBirth.trim()) patch.dateOfBirth = driverDraft.dateOfBirth.trim();
    if (driverDraft.complianceStatus.trim()) patch.complianceStatus = driverDraft.complianceStatus.trim();
    if (driverDraft.assignedAssetId.trim()) patch.assignedAssetId = driverDraft.assignedAssetId.trim();
    if (driverDraft.photoUrl.trim()) patch.photoUrl = driverDraft.photoUrl.trim();
    updateDriver(selectedDriverId, patch);
    showToast(
      `Driver ${selectedDriverId} updated${auditReason.trim() ? ` — note: ${auditReason.trim()}` : ""}.`
    );
  }, [selectedDriverId, driverDraft, auditReason, updateDriver, showToast]);

  const saveDocument = useCallback(() => {
    if (!selectedDoc) return;
    const { driverId, type } = selectedDoc;
    const issueDate =
      type === "Medical Card" && medDraft.medicalIssueDate
        ? medDraft.medicalIssueDate
        : docDraft.issueDate || undefined;
    const expirationDate =
      type === "Medical Card" && medDraft.medicalExpirationDate
        ? medDraft.medicalExpirationDate
        : docDraft.expirationDate || undefined;
    updateDocument(driverId, type, {
      status: docDraft.status,
      issueDate,
      expirationDate,
      fileUrl: docDraft.fileUrl || undefined,
      previewUrl: docDraft.previewUrl || undefined,
      cdlNumber: docDraft.cdlNumber || undefined,
      licenseClass: docDraft.licenseClass || undefined,
    });
    if (type === "Medical Card" && Object.keys(medDraft).length > 0) {
      updateDriverMedicalExpanded(driverId, {
        medicalExaminerName: medDraft.medicalExaminerName,
        medicalIssueDate: medDraft.medicalIssueDate,
        medicalExpirationDate: medDraft.medicalExpirationDate,
        mcsaRegistryNumber: medDraft.mcsaRegistryNumber,
        mcsaExaminerLicense: medDraft.mcsaExaminerLicense,
        mcsaExaminerTelephone: medDraft.mcsaExaminerTelephone,
        driverLicenseNumber: medDraft.driverLicenseNumber,
        driverLicenseState: medDraft.driverLicenseState,
        driverSignatureDate: medDraft.driverSignatureDate,
      });
    }
    showToast(
      `Document ${driverId} / ${type} updated${auditReason.trim() ? ` — note: ${auditReason.trim()}` : ""}.`
    );
  }, [selectedDoc, docDraft, medDraft, auditReason, updateDocument, updateDriverMedicalExpanded, showToast]);

  return (
    <div className="bof-page bof-sot-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/dashboard" className="bof-link-secondary">
          Dashboard
        </Link>
        <span aria-hidden> / </span>
        <span>Source of Truth</span>
      </nav>

      <header className="bof-sot-hero">
        <h1 className="bof-title">Source of Truth</h1>
        <p className="bof-lead bof-sot-lead">
          Demo data control center — edit the canonical driver and document records that
          feed the BOF demo. Changes persist in <strong>localStorage</strong> for this browser
          and apply immediately to linked screens that read the shared store.
        </p>
        {!hydrated ? (
          <p className="bof-muted bof-small">Loading persisted demo overrides…</p>
        ) : null}
      </header>

      {toast && (
        <div className="bof-sot-toast" role="status">
          {toast}
        </div>
      )}

      <div className="bof-sot-toolbar">
        <input
          type="search"
          className="bof-sot-search"
          placeholder="Search by driver id, name, email, document type…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search records"
        />
        <button type="button" className="bof-load-intake-btn" onClick={() => resetDemoData()}>
          Reset demo data
        </button>
      </div>

      <div className="bof-sot-tabs" role="tablist" aria-label="Entity">
        {(["drivers", "documents", "dispatch"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`bof-sot-tab ${tab === t ? "bof-sot-tab--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "drivers" ? "Drivers" : t === "documents" ? "Documents" : "Dispatch / loads"}
          </button>
        ))}
      </div>

      <div className="bof-sot-layout">
        <section className="bof-sot-panel bof-sot-panel--list" aria-label="Record list">
          {tab === "drivers" && (
            <ul className="bof-sot-record-list">
              {filteredDrivers.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className={`bof-sot-record ${selectedDriverId === d.id ? "bof-sot-record--sel" : ""}`}
                    onClick={() => {
                      setSelectedDriverId(d.id);
                      setSelectedDocKey(null);
                    }}
                  >
                    <span className="bof-sot-record-title">{d.name}</span>
                    <code className="bof-code">{d.id}</code>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tab === "documents" && (
            <ul className="bof-sot-record-list">
              {filteredDocs.slice(0, 400).map((d) => {
                const k = docKey(d);
                return (
                  <li key={k}>
                    <button
                      type="button"
                      className={`bof-sot-record ${selectedDocKey === k ? "bof-sot-record--sel" : ""}`}
                      onClick={() => {
                        setSelectedDocKey(k);
                        setSelectedDriverId(null);
                      }}
                    >
                      <span className="bof-sot-record-title">{d.type}</span>
                      <code className="bof-code">{d.driverId}</code>
                      <span className="bof-sot-record-meta">{d.status}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {tab === "dispatch" && (
            <ul className="bof-sot-record-list">
              {(data as BofData & { loads?: { id: string; driverId?: string; status?: string }[] }).loads
                ?.slice(0, 80)
                .map((l) => (
                  <li key={l.id} className="bof-sot-record bof-sot-record--static">
                    <span className="bof-sot-record-title">{l.id}</span>
                    <span className="bof-sot-record-meta">
                      {l.driverId ?? "—"} · {l.status ?? "—"}
                    </span>
                  </li>
                )) ?? <li className="bof-muted bof-small">No loads in demo dataset.</li>}
            </ul>
          )}
        </section>

        <section className="bof-sot-panel bof-sot-panel--detail" aria-label="Editor">
          <h2 className="bof-h2 bof-sot-detail-h2">Record editor</h2>
          <p className="bof-muted bof-small">
            Audit trail (optional) — stored only in the toast for this demo build.
          </p>
          <div className="bof-sot-field">
            <label htmlFor="sot-audit">Reason for correction</label>
            <input
              id="sot-audit"
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder="e.g. Medical examiner correction from carrier"
            />
          </div>

          {tab === "drivers" && selectedDriver && (
            <>
              <div className="bof-sot-form-grid">
                <div className="bof-sot-field">
                  <label>Driver ID</label>
                  <input value={driverDraft.id} readOnly className="bof-sot-input-readonly" />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-name">Full name</label>
                  <input
                    id="sot-name"
                    value={driverDraft.name}
                    onChange={(e) => setDriverDraft((x) => ({ ...x, name: e.target.value }))}
                  />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-phone">Phone</label>
                  <input
                    id="sot-phone"
                    value={driverDraft.phone}
                    onChange={(e) => setDriverDraft((x) => ({ ...x, phone: e.target.value }))}
                  />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-email">Email</label>
                  <input
                    id="sot-email"
                    value={driverDraft.email}
                    onChange={(e) => setDriverDraft((x) => ({ ...x, email: e.target.value }))}
                  />
                </div>
                <div className="bof-sot-field bof-sot-field--full">
                  <label htmlFor="sot-addr">Address (full line)</label>
                  <input
                    id="sot-addr"
                    value={driverDraft.address}
                    onChange={(e) => setDriverDraft((x) => ({ ...x, address: e.target.value }))}
                  />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-lic">License / reference CDL number</label>
                  <input
                    id="sot-lic"
                    value={driverDraft.referenceCdlNumber}
                    onChange={(e) =>
                      setDriverDraft((x) => ({ ...x, referenceCdlNumber: e.target.value }))
                    }
                  />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-dob">Date of birth</label>
                  <input
                    id="sot-dob"
                    value={driverDraft.dateOfBirth}
                    onChange={(e) => setDriverDraft((x) => ({ ...x, dateOfBirth: e.target.value }))}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-comp">Compliance status (demo)</label>
                  <input
                    id="sot-comp"
                    value={driverDraft.complianceStatus}
                    onChange={(e) =>
                      setDriverDraft((x) => ({ ...x, complianceStatus: e.target.value }))
                    }
                  />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-asset">Assigned asset id (demo)</label>
                  <input
                    id="sot-asset"
                    value={driverDraft.assignedAssetId}
                    onChange={(e) =>
                      setDriverDraft((x) => ({ ...x, assignedAssetId: e.target.value }))
                    }
                  />
                </div>
                <div className="bof-sot-field bof-sot-field--full">
                  <label htmlFor="sot-photo">Photo URL override</label>
                  <input
                    id="sot-photo"
                    value={driverDraft.photoUrl}
                    onChange={(e) => setDriverDraft((x) => ({ ...x, photoUrl: e.target.value }))}
                    placeholder="/images/drivers/DRV-006.png"
                  />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-ecn">Emergency contact name</label>
                  <input
                    id="sot-ecn"
                    value={driverDraft.emergencyContactName}
                    onChange={(e) =>
                      setDriverDraft((x) => ({ ...x, emergencyContactName: e.target.value }))
                    }
                  />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-ecr">Emergency relationship</label>
                  <input
                    id="sot-ecr"
                    value={driverDraft.emergencyContactRelationship}
                    onChange={(e) =>
                      setDriverDraft((x) => ({ ...x, emergencyContactRelationship: e.target.value }))
                    }
                  />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-ecp">Emergency phone</label>
                  <input
                    id="sot-ecp"
                    value={driverDraft.emergencyContactPhone}
                    onChange={(e) =>
                      setDriverDraft((x) => ({ ...x, emergencyContactPhone: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="bof-sot-actions">
                <button type="button" className="bof-load-intake-btn bof-load-intake-btn--primary" onClick={saveDriver}>
                  Save driver
                </button>
                <Link href={`/drivers/${selectedDriverId}`} className="bof-link-secondary bof-small">
                  Open driver hub →
                </Link>
              </div>
            </>
          )}

          {tab === "documents" && selectedDoc && (
            <>
              <div className="bof-sot-form-grid">
                <div className="bof-sot-field">
                  <label>Driver ID</label>
                  <input value={docDraft.driverId} readOnly className="bof-sot-input-readonly" />
                </div>
                <div className="bof-sot-field">
                  <label>Document type</label>
                  <input value={docDraft.type} readOnly className="bof-sot-input-readonly" />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-dstatus">Status</label>
                  <input
                    id="sot-dstatus"
                    value={docDraft.status}
                    onChange={(e) => setDocDraft((x) => ({ ...x, status: e.target.value }))}
                  />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-iss">Issue date</label>
                  <input
                    id="sot-iss"
                    value={docDraft.issueDate}
                    onChange={(e) => setDocDraft((x) => ({ ...x, issueDate: e.target.value }))}
                  />
                </div>
                <div className="bof-sot-field">
                  <label htmlFor="sot-exp">Expiration date</label>
                  <input
                    id="sot-exp"
                    value={docDraft.expirationDate}
                    onChange={(e) => setDocDraft((x) => ({ ...x, expirationDate: e.target.value }))}
                  />
                </div>
                <div className="bof-sot-field bof-sot-field--full">
                  <label htmlFor="sot-fu">File URL</label>
                  <input
                    id="sot-fu"
                    value={docDraft.fileUrl}
                    onChange={(e) => setDocDraft((x) => ({ ...x, fileUrl: e.target.value }))}
                  />
                </div>
                <div className="bof-sot-field bof-sot-field--full">
                  <label htmlFor="sot-pu">Preview URL</label>
                  <input
                    id="sot-pu"
                    value={docDraft.previewUrl}
                    onChange={(e) => setDocDraft((x) => ({ ...x, previewUrl: e.target.value }))}
                  />
                </div>
              </div>

              {selectedDoc.type === "Medical Card" && (
                <div className="bof-sot-subcard">
                  <h3 className="bof-h3">Medical card — expanded examiner fields</h3>
                  <p className="bof-muted bof-small">
                    These map to <code className="bof-code">driverMedicalExpanded</code> and power the
                    medical certificate panel on the driver hub.
                  </p>
                  <div className="bof-sot-form-grid">
                    <div className="bof-sot-field">
                      <label htmlFor="sot-men">Medical examiner name</label>
                      <input
                        id="sot-men"
                        value={medDraft.medicalExaminerName}
                        onChange={(e) =>
                          setMedDraft((x) => ({ ...x, medicalExaminerName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="bof-sot-field">
                      <label htmlFor="sot-mid">Medical issue date</label>
                      <input
                        id="sot-mid"
                        value={medDraft.medicalIssueDate}
                        onChange={(e) =>
                          setMedDraft((x) => ({ ...x, medicalIssueDate: e.target.value }))
                        }
                      />
                    </div>
                    <div className="bof-sot-field">
                      <label htmlFor="sot-mxd">Medical expiration date</label>
                      <input
                        id="sot-mxd"
                        value={medDraft.medicalExpirationDate}
                        onChange={(e) =>
                          setMedDraft((x) => ({ ...x, medicalExpirationDate: e.target.value }))
                        }
                      />
                    </div>
                    <div className="bof-sot-field">
                      <label htmlFor="sot-reg">National registry number</label>
                      <input
                        id="sot-reg"
                        value={medDraft.mcsaRegistryNumber}
                        onChange={(e) =>
                          setMedDraft((x) => ({ ...x, mcsaRegistryNumber: e.target.value }))
                        }
                      />
                    </div>
                    <div className="bof-sot-field">
                      <label htmlFor="sot-mel">Examiner license / certificate no.</label>
                      <input
                        id="sot-mel"
                        value={medDraft.mcsaExaminerLicense}
                        onChange={(e) =>
                          setMedDraft((x) => ({ ...x, mcsaExaminerLicense: e.target.value }))
                        }
                      />
                    </div>
                    <div className="bof-sot-field">
                      <label htmlFor="sot-met">Examiner telephone</label>
                      <input
                        id="sot-met"
                        value={medDraft.mcsaExaminerTelephone}
                        onChange={(e) =>
                          setMedDraft((x) => ({ ...x, mcsaExaminerTelephone: e.target.value }))
                        }
                      />
                    </div>
                    <div className="bof-sot-field">
                      <label htmlFor="sot-dls">Driver license state</label>
                      <input
                        id="sot-dls"
                        value={medDraft.driverLicenseState}
                        onChange={(e) =>
                          setMedDraft((x) => ({ ...x, driverLicenseState: e.target.value }))
                        }
                      />
                    </div>
                    <div className="bof-sot-field">
                      <label htmlFor="sot-dln">Driver license number</label>
                      <input
                        id="sot-dln"
                        value={medDraft.driverLicenseNumber}
                        onChange={(e) =>
                          setMedDraft((x) => ({ ...x, driverLicenseNumber: e.target.value }))
                        }
                      />
                    </div>
                    <div className="bof-sot-field">
                      <label htmlFor="sot-dsd">Driver signature date</label>
                      <input
                        id="sot-dsd"
                        value={medDraft.driverSignatureDate}
                        onChange={(e) =>
                          setMedDraft((x) => ({ ...x, driverSignatureDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bof-sot-actions">
                <button
                  type="button"
                  className="bof-load-intake-btn bof-load-intake-btn--primary"
                  onClick={saveDocument}
                >
                  Save document
                </button>
                <Link href={`/drivers/${selectedDoc.driverId}`} className="bof-link-secondary bof-small">
                  Open driver hub →
                </Link>
              </div>
            </>
          )}

          {tab === "dispatch" && (
            <p className="bof-muted">
              Dispatch rows are read-only in this build. Extend{" "}
              <code className="bof-code">updateLoad</code> on the shared store when you need inline
              load edits.
            </p>
          )}

          {tab === "drivers" && !selectedDriver && (
            <p className="bof-muted">Select a driver from the list.</p>
          )}
          {tab === "documents" && !selectedDoc && (
            <p className="bof-muted">Select a document from the list.</p>
          )}
        </section>
      </div>
    </div>
  );
}
