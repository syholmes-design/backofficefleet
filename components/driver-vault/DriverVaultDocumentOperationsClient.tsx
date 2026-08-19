"use client";

import { useMemo, useState } from "react";

import { DRIVER_VAULT_DOCUMENT_TYPES } from "@/lib/driver-vault-document-types";
import type { DriverVaultDocumentSummary } from "@/lib/services/driverVaultDocumentService";

function fileNameForStatus(originalFileName: string) {
  return originalFileName || "document";
}

export function DriverVaultDocumentOperationsClient({
  documents,
  missingDocumentTypes,
}: {
  documents: DriverVaultDocumentSummary[];
  missingDocumentTypes: Array<{ type: string; label: string }>;
}) {
  const [uploadType, setUploadType] = useState<string>("DRIVER_LICENSE");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | "upload" | null>(null);

  const missingLabel = useMemo(() => {
    if (missingDocumentTypes.length === 0) {
      return "No missing documents are currently flagged.";
    }
    return missingDocumentTypes.map((item) => item.label).join(", ");
  }, [missingDocumentTypes]);

  async function submitUpload(file: File | null) {
    if (!file) {
      setUploadError("Choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.set("documentType", uploadType);
    formData.set("file", file);
    setUploadError(null);
    setBusyId("upload");
    const response = await fetch("/api/driver/vault/documents", {
      method: "POST",
      body: formData,
    });
    setBusyId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Upload failed" }));
      setUploadError(body.error ?? "Upload failed");
      return;
    }
    window.location.reload();
  }

  async function submitReplace(documentId: string, documentType: string, file: File | null) {
    if (!file) {
      setUploadError("Choose a replacement file.");
      return;
    }

    const formData = new FormData();
    formData.set("documentType", documentType);
    formData.set("file", file);
    setUploadError(null);
    setBusyId(documentId);
    const response = await fetch(`/api/driver/vault/documents/${documentId}`, {
      method: "PATCH",
      body: formData,
    });
    setBusyId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Replacement failed" }));
      setUploadError(body.error ?? "Replacement failed");
      return;
    }
    window.location.reload();
  }

  return (
    <section className="mt-8 space-y-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Document operations</h2>
        <p className="mt-1 text-sm text-gray-600">{missingLabel}</p>
      </div>

      {uploadError ? (
        <div className="mx-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{uploadError}</div>
      ) : null}

      <div className="grid gap-6 px-6 pb-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">Upload document</div>
          <label className="mt-3 block text-sm text-slate-700">
            Document type
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
              value={uploadType}
              onChange={(event) => setUploadType(event.target.value)}
            >
              {DRIVER_VAULT_DOCUMENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-sm text-slate-700">
            File
            <input
              id="driver-vault-upload"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              className="mt-1 block w-full text-sm"
            />
          </label>
          <button
            type="button"
            className="mt-4 inline-flex rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busyId === "upload"}
            onClick={() => {
              const input = document.getElementById("driver-vault-upload") as HTMLInputElement | null;
              void submitUpload(input?.files?.[0] ?? null);
            }}
          >
            {busyId === "upload" ? "Uploading..." : "Upload"}
          </button>
        </div>

        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
              No documents on file yet.
            </div>
          ) : (
            documents.map((row) => (
              <div key={row.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{row.typeLabel}</div>
                    <div className="text-sm text-slate-600">{fileNameForStatus(row.originalFileName)}</div>
                    <div className="text-xs text-slate-500">
                      Status: {row.status} · Uploaded {new Date(row.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      className="rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
                      href={row.downloadUrl}
                    >
                      Download
                    </a>
                    <label className="text-sm text-slate-700">
                      Replace
                      <input
                        id={`replace-${row.id}`}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        className="mt-1 block w-full text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      className="rounded bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={busyId === row.id}
                      onClick={() => {
                        const input = globalThis.document.getElementById(`replace-${row.id}`) as HTMLInputElement | null;
                        void submitReplace(row.id, row.type, input?.files?.[0] ?? null);
                      }}
                    >
                      {busyId === row.id ? "Replacing..." : "Replace"}
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {row.verificationExpiresAt ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      Expires {new Date(row.verificationExpiresAt).toLocaleDateString()}
                    </span>
                  ) : null}
                  {row.nextVerificationDueAt ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      Due {new Date(row.nextVerificationDueAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
