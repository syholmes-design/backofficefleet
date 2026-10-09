import Link from "next/link";
import type { DriverReviewRequirement } from "@/lib/driver-review-explanation";
import type { DriverOperationalSummary } from "@/lib/services/driverOperationalReadModelService";

type DriverFile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  status: string;
  fleetId: string;
};

type CurrentAssignment = {
  id: string;
  loadId: string;
  status: string;
  assignedAt: string;
  load: {
    id: string;
    customerName: string;
    origin: string;
    destination: string;
    status: string;
    referenceNumber: string | null;
  };
};

function formatWhen(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString();
}

export function OperatorDriverDetail({
  driver,
  summary,
  requirements,
  currentAssignment,
}: {
  driver: DriverFile;
  summary: DriverOperationalSummary;
  requirements: DriverReviewRequirement[];
  currentAssignment: CurrentAssignment | null;
}) {
  const openRequirements = requirements.filter((requirement) => requirement.resolutionStatus !== "RESOLVED");

  return (
    <div className="space-y-6 p-6 text-slate-100">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Driver file</p>
        <h1 className="mt-2 text-2xl font-black text-white">
          {driver.firstName} {driver.lastName}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {driver.email || "No email on file"} · {driver.status.replaceAll("_", " ")}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h2 className="text-sm font-bold text-white">Qualification</h2>
          <p className="mt-2 text-sm text-slate-200">
            {summary.qualification?.qualificationStatus?.replaceAll("_", " ") ?? "Not yet evaluated"}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {summary.qualification?.summary ?? "No qualification summary is available for this driver."}
          </p>
          {summary.qualification?.reasonCodes?.length ? (
            <p className="mt-2 text-xs text-slate-500">{summary.qualification.reasonCodes.join(", ")}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            Evaluated {formatWhen(summary.latestEvaluationDates.qualificationEvaluatedAt)}
          </p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h2 className="text-sm font-bold text-white">Readiness</h2>
          <p className="mt-2 text-sm text-slate-200">
            {summary.readiness?.readinessStatus?.replaceAll("_", " ") ?? "Not yet evaluated"}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {summary.readiness?.summary ?? "No readiness summary is available for this driver."}
          </p>
          {summary.readiness?.reasonCodes?.length ? (
            <p className="mt-2 text-xs text-slate-500">{summary.readiness.reasonCodes.join(", ")}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            Evaluated {formatWhen(summary.latestEvaluationDates.readinessEvaluatedAt)}
          </p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <h2 className="text-sm font-bold text-white">Open requirements</h2>
        {openRequirements.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No open requirements on this driver file.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {openRequirements.map((requirement) => (
              <li key={requirement.id} className="border-t border-slate-800 pt-2 first:border-t-0 first:pt-0">
                <p className="font-semibold text-white">{requirement.label}</p>
                <p className="text-xs text-slate-400">
                  {requirement.actionStatus?.replaceAll("_", " ") || "Open"}
                  {requirement.dueDate ? ` · due ${formatWhen(String(requirement.dueDate))}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
        {summary.latestIntakeId ? (
          <p className="mt-4 text-sm">
            <Link className="text-teal-200 underline" href={`/intake/${summary.latestIntakeId}`}>
              Open latest intake
            </Link>
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <h2 className="text-sm font-bold text-white">Current assignment</h2>
        {currentAssignment ? (
          <div className="mt-2 text-sm text-slate-200">
            <p className="font-semibold text-white">{currentAssignment.load.customerName}</p>
            <p className="mt-1 text-slate-300">
              {currentAssignment.load.origin} to {currentAssignment.load.destination}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {currentAssignment.load.status.replaceAll("_", " ")}
              {currentAssignment.load.referenceNumber ? ` · ${currentAssignment.load.referenceNumber}` : ""}
              {` · assigned ${formatWhen(currentAssignment.assignedAt)}`}
            </p>
            <p className="mt-3">
              <Link className="text-teal-200 underline" href={`/dispatch?loadId=${currentAssignment.loadId}`}>
                Open load on dispatch
              </Link>
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No active assignment on this driver file.</p>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Safety score and settlement pay are not shown on this live driver file.
      </p>
      <p className="text-sm">
        <Link className="text-teal-200 underline" href="/drivers">
          Back to drivers
        </Link>
      </p>
    </div>
  );
}
