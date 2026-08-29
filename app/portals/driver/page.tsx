import { auth } from "@/auth";
import Link from "next/link";
import { DriverVaultDocumentOperationsClient } from "@/components/driver-vault/DriverVaultDocumentOperationsClient";

export const dynamic = "force-dynamic";
import { DRIVER_VAULT_DOCUMENT_TYPES, driverVaultDocumentTypeLabel } from "@/lib/driver-vault-document-types";
import { getAuthenticatedDriver } from "@/lib/services/authenticatedDriverService";
import { reconcileEmployerDriverRecord } from "@/lib/services/employerDriverRecordService";
import { resolveContext } from "@/lib/services/contextResolver";
import { getDriverOperationalSummary, type DriverOperationalSummary } from "@/lib/services/driverOperationalReadModelService";
import { getAuthenticatedDriverVaultStatus } from "@/lib/services/driverDocumentVersioningService";

function statusTone(status: string) {
  switch (status) {
    case "CERTIFIED":
    case "VERIFIED":
      return "bg-emerald-100 text-emerald-800";
    case "PENDING_VERIFICATION":
    case "RECEIVED":
      return "bg-amber-100 text-amber-800";
    case "EXPIRED":
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString() : "—";
}

function readinessLabel(summary: DriverOperationalSummary | null) {
  if (!summary?.readiness) {
    return "Not yet evaluated";
  }

  return summary.readiness.readinessStatus.replace(/_/g, " ");
}

export default async function DriverPortalPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900">My BOF Vault</h1>
            <p className="mt-3 text-gray-600">Sign in to view your driver vault.</p>
          </div>
        </div>
      </div>
    );
  }

  const driverAccess = await getAuthenticatedDriver(session.user);

  if (driverAccess.status !== "LINKED") {
    if (driverAccess.status === "UNLINKED") {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-900">My BOF Vault</h1>
              <p className="mt-3 text-gray-700">
                Your BOF driver identity is not linked yet. Complete the existing driver claim process to unlock your vault.
              </p>
              <div className="mt-6 text-sm text-gray-600">Status: UNLINKED</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900">My BOF Vault</h1>
            <p className="mt-3 text-gray-600">Sign in to view your driver vault.</p>
          </div>
        </div>
      </div>
    );
  }

  const [summary, vaultStatus, reconciliation, context] = await Promise.all([
    getDriverOperationalSummary(session.user, driverAccess.driver.id, { selfOnly: true }),
    getAuthenticatedDriverVaultStatus(session.user),
    reconcileEmployerDriverRecord({
      sessionUser: session.user,
      driverId: driverAccess.driver.id,
      fleetId: driverAccess.driver.fleetId,
    }),
    resolveContext(session.user),
  ]);

  const documents = vaultStatus.documents;
  const missingDocuments = documents.filter((document) => document.status !== "VERIFIED" && document.status !== "CERTIFIED");
  const missingDocumentTypes = DRIVER_VAULT_DOCUMENT_TYPES.filter(
    (item) => !documents.some((document) => document.type === item.value),
  ).map((item) => ({ type: item.value, label: item.label }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Driver Vault</p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">My BOF Vault</h1>
          <p className="mt-3 max-w-3xl text-gray-600">
            Authenticated driver access for documents, readiness, and qualification records.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Driver identity</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
              {driverAccess.driver.firstName} {driverAccess.driver.lastName}
            </div>
            <div className="mt-2 text-sm text-gray-600">{driverAccess.driver.fleet?.name ?? "Fleet unavailable"}</div>
            <div className="mt-4 text-sm text-gray-600">
              Readiness: <span className="font-semibold text-gray-900">{readinessLabel(summary)}</span>
            </div>
            <div className="text-sm text-gray-600">
              Qualification:{" "}
              <span className="font-semibold text-gray-900">
                {summary.qualification?.qualificationStatus.replace(/_/g, " ") ?? "Not yet evaluated"}
              </span>
            </div>
            <div className="mt-4 text-xs uppercase tracking-wide text-gray-500">Contexts</div>
            <div className="mt-2 space-y-2 text-sm text-gray-700">
              <div>
                Personal: <span className="font-semibold text-gray-900">{context.personal ? "Available" : "Unavailable"}</span>
              </div>
              <div>
                Employment:{" "}
                <span className="font-semibold text-gray-900">
                  {context.employmentContexts.length > 0 ? context.employmentContexts.map((item) => item.fleetId).join(", ") : "None"}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Readiness</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{readinessLabel(summary)}</div>
            <p className="mt-3 text-sm text-gray-600">
              {summary.readiness?.summary ?? "Readiness has not yet been evaluated for this driver."}
            </p>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Exceptions / Missing Documents</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{missingDocuments.length}</div>
            <p className="mt-3 text-sm text-gray-600">
              {missingDocuments.length > 0
                ? "Documents needing attention are listed below."
                : "No missing or non-verified documents are currently flagged."}
            </p>
          </section>
        </div>

        <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="driver-execution-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Driver execution</p>
              <h2 id="driver-execution-heading" className="mt-1 text-2xl font-semibold text-gray-900">Your BOF operating workspaces</h2>
              <p className="mt-2 text-sm text-gray-600">
                These links use your authenticated driver identity. Assignment and release details appear only where the authorized operational record is available.
              </p>
            </div>
            <div className="text-sm font-semibold text-slate-500">Current assignment: Not available in this read model</div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["My dispatch", `/drivers/${driverAccess.driver.id}/dispatch`, "Assignment and dispatch context"],
              ["Pre-trip / release", "/dispatch", "Open the current dispatch workflow"],
              ["My Safety", `/drivers/${driverAccess.driver.id}/safety`, "Safety events and coaching"],
              ["Training & coaching", "/safety/training", "BOF modules and event-linked recommendations"],
              ["My settlements", `/drivers/${driverAccess.driver.id}/settlements`, "Pay, holds, and settlement records"],
            ].map(([label, href, description]) => (
              <Link key={href} href={href} className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-400 hover:bg-teal-50">
                <span className="text-sm font-semibold text-slate-900">{label}</span>
                <span className="mt-2 block text-xs leading-5 text-slate-600">{description}</span>
              </Link>
            ))}
          </div>
        </section>

        <DriverVaultDocumentOperationsClient
          documents={documents.map((document) => ({
            id: document.id,
            type: document.type,
            typeLabel: driverVaultDocumentTypeLabel(document.type),
            status: document.status,
            originalFileName: document.originalFileName,
            uploadedAt: document.uploadedAt,
            verifiedAt: document.verifiedAt,
            verificationExpiresAt: document.verificationExpiresAt,
            nextVerificationDueAt: document.nextVerificationDueAt,
            downloadUrl: `/api/driver/vault/documents/${document.id}/download`,
          }))}
          missingDocumentTypes={missingDocumentTypes}
        />

        <section className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Employer record reconciliation</h2>
            <p className="mt-1 text-sm text-gray-600">
              Your personal Vault stays separate from retained employer evidence.
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {reconciliation.threads.length === 0 ? (
              <div className="px-6 py-10 text-sm text-gray-500">No employer materializations have been recorded yet.</div>
            ) : (
              reconciliation.threads.map((thread) => (
                <div key={thread.sourceDocumentId} className="px-6 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{thread.documentTypeLabel}</div>
                      <div className="text-xs text-gray-500">
                        Personal version {thread.currentPersonalVersionNumber} · current fleet {reconciliation.fleet.name}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {thread.currentEmployerMaterialization
                        ? `Employer retained version ${thread.currentEmployerMaterialization.sourceVersionNumber} on ${formatDate(
                            new Date(thread.currentEmployerMaterialization.materializedAt),
                          )}`
                        : "No employer materialization yet."}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {thread.hasPersonalVersionAheadOfEmployer
                      ? "A newer personal version exists and remains private until separately authorized."
                      : thread.currentEmployerMaterialization
                        ? "Employer evidence is aligned to the last authorized version."
                        : "No employer evidence has been materialized for this document yet."}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Qualification Documents</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {documents.length === 0 ? (
              <div className="px-6 py-10 text-sm text-gray-500">No driver documents are on file yet.</div>
            ) : (
              documents.map((document) => (
                <div key={document.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{document.type}</div>
                    <div className="text-sm text-gray-600">{document.originalFileName}</div>
                    <div className="mt-1 text-xs text-gray-500">Uploaded {formatDate(new Date(document.uploadedAt))}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full px-3 py-1 font-medium ${statusTone(document.status)}`}>
                      {document.status.replace(/_/g, " ")}
                    </span>
                    {document.verifiedAt ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        Verified {formatDate(new Date(document.verifiedAt))}
                      </span>
                    ) : null}
                    {document.verificationExpiresAt ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        Expires {formatDate(new Date(document.verificationExpiresAt))}
                      </span>
                    ) : null}
                    {document.nextVerificationDueAt ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        Due {formatDate(new Date(document.nextVerificationDueAt))}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {missingDocuments.length > 0 ? (
          <section className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Attention Needed</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {missingDocuments.map((document) => (
                <div key={document.id} className="px-6 py-4 text-sm text-gray-700">
                  {document.type} is currently <span className="font-semibold">{document.status.replace(/_/g, " ")}</span>.
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8 text-sm text-gray-500">
          Driver claim status: LINKED
        </div>
      </div>
    </div>
  );
}
