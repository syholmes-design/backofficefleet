"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentRow } from "@/lib/driver-queries";
import type { DriverMedicalExpanded } from "@/lib/driver-medical-expanded";
import { EMPTY_DRIVER_MEDICAL_EXPANDED } from "@/lib/driver-medical-expanded";
import {
  documentSignal,
  documentSignalClass,
  documentSignalLabel,
  proofHref,
  statusBadgeClass,
} from "@/lib/document-ui";

function dlItem(label: string, value: string) {
  const v = value?.trim();
  return (
    <>
      <dt>{label}</dt>
      <dd>{v ? v : "—"}</dd>
    </>
  );
}

export function DriverMedicalExpandedPanel({
  driverName,
  medicalDoc,
  expanded,
  mcsa5876Signed,
}: {
  driverName: string;
  medicalDoc: DocumentRow;
  expanded: DriverMedicalExpanded | null;
  /** Signed long-form exam (PDF/HTML); opens from the nested MCSA-5876 detail view. */
  mcsa5876Signed?: Pick<DocumentRow, "fileUrl" | "previewUrl"> | null;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const x = expanded ?? EMPTY_DRIVER_MEDICAL_EXPANDED;
  const issue =
    x.medicalIssueDate?.trim() || medicalDoc.issueDate?.trim() || "";
  const exp =
    medicalDoc.expirationDate?.trim() ||
    x.medicalExpirationDate?.trim() ||
    "";

  return (
    <section
      className="bof-doc-section bof-medical-expanded"
      aria-labelledby="medical-expanded-heading"
    >
      <h2 id="medical-expanded-heading" className="bof-h2">
        Medical certificate
      </h2>
      <p className="bof-doc-section-lead">
        Primary DOT medical card summary for {driverName}. Expanded MCSA-5876 line
        items open in a detail view.
      </p>
      <div className="bof-medical-primary bof-medical-card">
        <div className="bof-medical-primary-top">
          <span className="bof-medical-label">Medical Card</span>
          <span className={statusBadgeClass(medicalDoc.status)}>
            {medicalDoc.status}
          </span>
        </div>
        <p className="bof-doc-signal-line">
          <span className={documentSignalClass(documentSignal(medicalDoc))}>
            {documentSignalLabel(documentSignal(medicalDoc))}
          </span>
        </p>
        <dl className="bof-medical-dl bof-medical-dl-primary">
          {dlItem("Issue date", issue)}
          {dlItem("Expiration date", exp)}
          {dlItem("Examiner name", x.medicalExaminerName)}
        </dl>
        <button
          type="button"
          className="bof-btn-medical-detail"
          onClick={() => setOpen(true)}
        >
          View MCSA-5876 details
        </button>
      </div>

      <div className="bof-medical-support-grid">
        <div className="bof-info-block bof-medical-support-block">
          <h3 className="bof-h3">5875 exam</h3>
          <dl className="bof-medical-dl">
            {dlItem("Vision", x.vision5875)}
            {dlItem("Hearing", x.hearing5875)}
            {dlItem("Blood pressure", x.bloodPressure5875)}
          </dl>
        </div>
        <div className="bof-info-block bof-medical-support-block">
          <h3 className="bof-h3">Application</h3>
          <dl className="bof-medical-dl">
            {dlItem("Submission date", x.appSubmissionDate)}
            {dlItem("Status", x.appStatus)}
          </dl>
        </div>
        <div className="bof-info-block bof-medical-support-block">
          <h3 className="bof-h3">Safety acknowledgment</h3>
          <dl className="bof-medical-dl">
            {dlItem("Date", x.safetyAckDate)}
            {dlItem("Status", x.safetyAckStatus)}
          </dl>
        </div>
        <div className="bof-info-block bof-medical-support-block">
          <h3 className="bof-h3">Incident reports</h3>
          <dl className="bof-medical-dl">
            {dlItem("Count", x.incidentReportCount)}
            {dlItem("Last incident", x.lastIncidentDate)}
          </dl>
        </div>
        <div className="bof-info-block bof-medical-support-block">
          <h3 className="bof-h3">Qualification file</h3>
          <dl className="bof-medical-dl">{dlItem("Status", x.qualFileStatus)}</dl>
        </div>
        <div className="bof-info-block bof-medical-support-block">
          <h3 className="bof-h3">BOF medical summary</h3>
          <dl className="bof-medical-dl">
            {dlItem("Status", x.bofMedicalSummaryStatus)}
          </dl>
        </div>
      </div>

      {open && (
        <div
          className="bof-modal-backdrop"
          role="presentation"
          onClick={close}
        >
          <div
            className="bof-modal bof-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mcsa-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="bof-modal-head">
              <h3 id="mcsa-detail-title">MCSA-5876 — examiner &amp; driver</h3>
              <button
                type="button"
                className="bof-modal-close"
                onClick={close}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <div className="bof-modal-body">
              <p className="bof-muted bof-small">
                Demo fields from driver_templates_expanded.xlsx — not a government
                form reproduction.
              </p>
              <dl className="bof-modal-dl">
                <dt>Examiner license</dt>
                <dd>{x.mcsaExaminerLicense || "—"}</dd>
                <dt>Registry number</dt>
                <dd>{x.mcsaRegistryNumber || "—"}</dd>
                <dt>Examiner telephone</dt>
                <dd>{x.mcsaExaminerTelephone || "—"}</dd>
                <dt>Driver license state</dt>
                <dd>{x.driverLicenseState || "—"}</dd>
                <dt>Driver license number</dt>
                <dd>{x.driverLicenseNumber || "—"}</dd>
                <dt>Driver signature date</dt>
                <dd>{x.driverSignatureDate || "—"}</dd>
              </dl>
              {mcsa5876Signed && proofHref(mcsa5876Signed) ? (
                <p className="bof-modal-note">
                  <a
                    href={proofHref(mcsa5876Signed)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bof-link-secondary"
                  >
                    Open signed MCSA-5876 (file)
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
