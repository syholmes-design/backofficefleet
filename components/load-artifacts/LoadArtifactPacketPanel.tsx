import type { LoadArtifact, LoadArtifactPacket } from "@/lib/load-artifact-registry";

function statusClass(status: LoadArtifact["status"]) {
  if (status === "ready") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (status === "pending") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  if (status === "not_applicable") return "border-slate-600 bg-slate-900 text-slate-300";
  return "border-red-500/40 bg-red-500/10 text-red-200";
}

function statusLabel(status: LoadArtifact["status"]) {
  if (status === "not_applicable") return "Not required";
  return status.replace(/_/g, " ");
}

function isImage(url?: string) {
  return Boolean(url && /\.(png|jpe?g|webp|gif|svg)$/i.test(url));
}

function sameTab(url: string) {
  return url.startsWith("/pretrip/") || url.startsWith("/trip-release/") || url.startsWith("/loads/");
}

function ArtifactCard({ artifact }: { artifact: LoadArtifact }) {
  const image = isImage(artifact.canonicalUrl);
  const target = sameTab(artifact.actionUrl) ? undefined : "_blank";
  const rel = target ? "noreferrer" : undefined;

  return (
    <article id={`artifact-${artifact.key}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{artifact.label}</p>
          <p className="mt-1 text-xs text-slate-400">{artifact.sourceLabel}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusClass(artifact.status)}`}>
          {statusLabel(artifact.status)}
        </span>
      </div>

      {image && (
        <a href={artifact.actionUrl} target={target} rel={rel} className="mt-3 block overflow-hidden rounded-md border border-slate-800 bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={artifact.canonicalUrl} alt="" className="h-32 w-full object-cover transition duration-200 hover:scale-[1.02]" />
        </a>
      )}

      <p className="mt-3 min-h-10 text-sm leading-5 text-slate-300">
        {artifact.note ??
          (artifact.isReady
            ? "Available in this load packet."
            : "Needs an exact document, photo, or operations review before release.")}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={artifact.actionUrl}
          target={target}
          rel={rel}
          className="inline-flex min-h-9 items-center rounded-md border border-teal-600/60 bg-teal-950/45 px-3 py-2 text-sm font-bold text-teal-100 hover:border-teal-300 hover:bg-teal-900/70"
        >
          {artifact.actionLabel}
        </a>
        {artifact.requiredForSettlementRelease && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-200">
            Settlement gate
          </span>
        )}
        {artifact.requiredForClaimRelease && (
          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-200">
            Claim gate
          </span>
        )}
      </div>
    </article>
  );
}

export function LoadArtifactPacketPanel({
  packet,
  title = "Load artifact packet",
  lead,
}: {
  packet: LoadArtifactPacket | null;
  title?: string;
  lead?: string;
}) {
  if (!packet) return null;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/55 p-5" aria-labelledby="load-artifact-packet-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Load packet registry</p>
          <h2 id="load-artifact-packet-heading" className="mt-2 text-2xl font-black text-white">
            {title}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
            {lead ??
              `These are the registered documents and photos for ${packet.loadId}. Dispatch, pre-trip, release, settlement, and customer views all resolve to these records.`}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Packet readiness</p>
          <p className="mt-1 text-lg font-black text-white">
            {packet.validation.readyCount}/{packet.validation.requiredCount}
          </p>
          <p className="text-xs text-slate-400">{packet.validation.recommendedAction}</p>
        </div>
      </div>

      <div className="mt-5 space-y-6">
        {packet.groups.map((group) => (
          <div key={group.group}>
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">{group.label}</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.artifacts.map((artifact) => (
                <ArtifactCard key={artifact.key} artifact={artifact} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
