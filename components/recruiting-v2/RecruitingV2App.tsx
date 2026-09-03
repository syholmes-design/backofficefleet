import Link from "next/link";
import { RecruitingV2ActivationApiPanel } from "@/components/recruiting-v2/RecruitingV2ActivationApiPanel";
import { RecruitingV2AuthoritativeSummary } from "@/components/recruiting-v2/RecruitingV2AuthoritativeSummary";
import { RecruitingV2DocumentApiPanel } from "@/components/recruiting-v2/RecruitingV2DocumentApiPanel";
import { RecruitingV2InterviewApiPanel } from "@/components/recruiting-v2/RecruitingV2InterviewApiPanel";
import { RecruitingV2OnboardingApiPanel } from "@/components/recruiting-v2/RecruitingV2OnboardingApiPanel";
import { RecruitingV2OfferApiPanel } from "@/components/recruiting-v2/RecruitingV2OfferApiPanel";
import { RecruitingV2QualificationApiPanel } from "@/components/recruiting-v2/RecruitingV2QualificationApiPanel";
import { RecruitingV2WorkflowRows } from "@/components/recruiting-v2/RecruitingV2WorkflowRows";
import {
  RECRUITING_V2_WORKSPACES,
  getRecruitingV2Candidate,
  getRecruitingV2Position,
  recruitingV2Candidates,
  recruitingV2Positions,
  type RecruitingV2Candidate,
  type RecruitingV2RequirementStatus,
  type RecruitingV2WorkspaceKey,
} from "@/lib/recruiting-v2/recruiting-v2-demo-data";

type Props = {
  candidateId?: string;
  workspace?: RecruitingV2WorkspaceKey;
};

const actionWorkspaces = [
  { label: "Application", workspace: "application" as const },
  { label: "Interview", workspace: "interview" as const },
  { label: "Documents", workspace: "documents" as const },
  { label: "Qualification", workspace: "qualification" as const },
  { label: "Offer", workspace: "offer" as const },
  { label: "Onboarding", workspace: "onboarding" as const },
  { label: "Activation", workspace: "activation" as const },
];

function statusClass(status: RecruitingV2RequirementStatus | string) {
  if (status === "READY" || status === "COMPLETE") return "border-emerald-500/50 bg-emerald-950/40 text-emerald-100";
  if (status === "BLOCKED" || status === "NOT_PROVIDED") return "border-rose-500/50 bg-rose-950/40 text-rose-100";
  if (status === "UNDER_REVIEW" || status === "PENDING") return "border-amber-500/50 bg-amber-950/40 text-amber-100";
  return "border-slate-700 bg-slate-900 text-slate-200";
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function workspaceTitle(workspace: RecruitingV2WorkspaceKey) {
  return `${RECRUITING_V2_WORKSPACES.find((item) => item.key === workspace)?.label ?? workspace} Workspace`;
}

function CandidateActions({ candidate, activeWorkspace }: { candidate: RecruitingV2Candidate; activeWorkspace?: RecruitingV2WorkspaceKey }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actionWorkspaces.map((action) => (
        <Link key={action.workspace} href={`/recruiting-v2/candidates/${candidate.id}/${action.workspace}`} className={`rounded-md border px-3 py-2 text-xs font-black hover:bg-teal-900/50 ${activeWorkspace === action.workspace ? "border-teal-400 bg-teal-900/70 text-white" : "border-teal-700 bg-teal-950/35 text-teal-100"}`}>
          {action.label}
        </Link>
      ))}
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: RecruitingV2Candidate }) {
  const position = getRecruitingV2Position(candidate.positionCode);
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">Candidate</p>
          <h2 className="mt-1 text-xl font-black text-white">{candidate.name}</h2>
          <p className="mt-1 text-sm text-slate-300">{candidate.id} · {candidate.homeLocation} · {candidate.cdlClass} {candidate.cdlState}</p>
          <p className="mt-1 text-xs text-slate-400">{position?.title} · {candidate.positionCode}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(candidate.qualificationStatus)}`}>{formatStatus(candidate.activationStage)}</span>
      </div>
      <div className="mt-4">
        <RecruitingV2AuthoritativeSummary candidateId={candidate.id} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={`/recruiting-v2/candidates/${candidate.id}`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-800">Open Candidate</Link>
        <CandidateActions candidate={candidate} />
      </div>
    </article>
  );
}

export function RecruitingV2App({ candidateId, workspace }: Props) {
  const candidate = candidateId ? getRecruitingV2Candidate(candidateId) : null;
  const position = candidate ? getRecruitingV2Position(candidate.positionCode) : null;

  if (candidate && workspace) {
    return (
      <main className="bof-recruiting-v2-shell min-h-screen overflow-x-hidden bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
        <nav className="bof-breadcrumb mb-5" aria-label="Breadcrumb">
          <Link href="/recruiting-v2">Recruiting V2</Link>
          <span aria-hidden> / </span>
          <Link href={`/recruiting-v2/candidates/${candidate.id}`}>{candidate.name}</Link>
          <span aria-hidden> / </span>
          <span>{workspaceTitle(workspace)}</span>
        </nav>

        <section className="rounded-2xl border border-teal-900/70 bg-slate-900/75 p-5 shadow-2xl md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">BOF Recruiting V2 · You are now in</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">{workspaceTitle(workspace).toUpperCase()}</h1>
              <p className="mt-2 text-sm font-bold text-slate-200">{candidate.name} · {candidate.id} · {position?.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/recruiting-v2/candidates/${candidate.id}`} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-black text-slate-100 hover:bg-slate-800">Back to Candidate</Link>
              <CandidateActions candidate={candidate} activeWorkspace={workspace} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Workspace purpose</p>
              <h2 className="mt-1 text-xl font-black text-white">{workspaceTitle(workspace)}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Operational Question</p><p className="mt-1 text-sm text-slate-100">Can this candidate move from {formatStatus(candidate.activationStage).toLowerCase()} through {workspaceTitle(workspace).toLowerCase()} without hiding missing requirements?</p></div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Operational Briefing</p><p className="mt-1 text-sm text-slate-100">Review candidate-specific records and generic templates separately. Do not treat a template as evidence.</p></div>
                <div className="rounded-lg border border-amber-800/70 bg-amber-950/20 p-3 md:col-span-2"><p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Authoritative API state</p><div className="mt-2"><RecruitingV2AuthoritativeSummary candidateId={candidate.id} /></div></div>
              </div>
            </section>

            <aside className="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Operational summary</p>
              <h2 className="mt-1 text-xl font-black text-white">{candidate.name}</h2>
              <div className="mt-4 grid gap-2 text-sm text-slate-200">
                <p><strong className="text-slate-500">Candidate ID:</strong> {candidate.id}</p>
                <p><strong className="text-slate-500">Position:</strong> {candidate.positionCode}</p>
                <p><strong className="text-slate-500">CDL:</strong> {candidate.cdlClass} {candidate.cdlState} · {candidate.cdlNumberMasked}</p>
              </div>
              <div className="mt-4">
                <RecruitingV2AuthoritativeSummary candidateId={candidate.id} />
              </div>
            </aside>
          </div>

          {workspace === "interview" ? <RecruitingV2InterviewApiPanel candidateId={candidate.id} /> : null}

          {workspace === "documents" ? <RecruitingV2DocumentApiPanel candidateId={candidate.id} /> : null}

          {workspace === "qualification" ? <RecruitingV2QualificationApiPanel candidateId={candidate.id} /> : null}

          {workspace === "offer" ? <RecruitingV2OfferApiPanel candidateId={candidate.id} /> : null}

          {workspace === "activation" ? <RecruitingV2ActivationApiPanel candidateId={candidate.id} /> : null}

          {workspace === "onboarding" ? <RecruitingV2OnboardingApiPanel candidateId={candidate.id} /> : null}

          <section className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-300">Candidate workflow records</p>
                <h2 className="mt-1 text-[22px] font-bold text-white">Template, requirement, document record, actual document, verification, gate</h2>
              </div>
            </div>
            <div className="mt-4"><RecruitingV2WorkflowRows candidateId={candidate.id} /></div>
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Business impact</p><p className="mt-3 text-sm text-slate-200">Candidate progression remains gated by visible document, compliance, offer, and onboarding state from the Recruiting V2 APIs.</p></div>
            <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">API-backed queues</p><div className="mt-3"><RecruitingV2AuthoritativeSummary candidateId={candidate.id} /></div></div>
            <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Audit trail</p><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-200">{candidate.auditTrail.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </section>
        </section>
      </main>
    );
  }

  if (candidate) {
    return (
      <main className="bof-recruiting-v2-shell min-h-screen overflow-x-hidden bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
        <nav className="bof-breadcrumb mb-5" aria-label="Breadcrumb"><Link href="/recruiting-v2">Recruiting V2</Link><span aria-hidden> / </span><span>{candidate.name}</span></nav>
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div><p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Candidate profile</p><h1 className="mt-2 text-3xl font-black text-white">{candidate.name}</h1><p className="mt-2 text-sm text-slate-300">{candidate.id} · {candidate.homeLocation} · {position?.title}</p></div>
            <CandidateActions candidate={candidate} />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Application</p><p className="mt-2 text-[22px] font-bold text-white">{formatStatus(candidate.applicationStatus)}</p><p className="mt-2 text-[16px] leading-6 text-slate-300">{candidate.applicationSummary.employmentHistory}</p><Link href={`/recruiting-v2/candidates/${candidate.id}/application`} className="mt-3 inline-flex text-[16px] font-semibold text-teal-200">Open Candidate Application →</Link></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Current decision</p><div className="mt-2"><RecruitingV2AuthoritativeSummary candidateId={candidate.id} /></div></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Driver activation</p><p className="mt-2 text-[22px] font-bold text-white">{formatStatus(candidate.activationStage)}</p><p className="mt-2 text-[16px] leading-6 text-slate-300">This workspace does not create a driver record. Activation status loads from the Recruiting V2 API in the current-decision panel.</p></div>
          </div>
          <section className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h2 className="text-[22px] font-bold text-white">Workspace tabs</h2>
            <div className="mt-3 flex flex-wrap gap-2">{RECRUITING_V2_WORKSPACES.map((item) => <Link key={item.key} href={`/recruiting-v2/candidates/${candidate.id}/${item.key}`} className="rounded-md border border-slate-700 px-3 py-2 text-[16px] font-semibold text-slate-100 hover:bg-slate-800">{item.label}</Link>)}</div>
          </section>
          <section className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-300">Candidate workflow records</p>
            <h2 className="mt-1 text-[22px] font-bold text-white">Template, requirement, document record, actual document, verification, gate</h2>
            <div className="mt-4"><RecruitingV2WorkflowRows candidateId={candidate.id} /></div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="bof-recruiting-v2-shell min-h-screen overflow-x-hidden bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-teal-900/70 bg-slate-900/75 p-5 shadow-2xl md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Isolated development namespace</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">BOF Recruiting V2</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">Applicant to qualification to interview to document review to compliance to offer to onboarding to driver activation readiness. This is isolated from the current /recruiting system.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">{recruitingV2Positions.map((position) => <div key={position.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><h2 className="font-black text-white">{position.title}</h2><p className="mt-1 text-sm text-slate-300">{position.positionCode} · {position.homeTerminal}</p><p className="mt-2 text-sm text-slate-400">{position.description}</p></div>)}</div>
      </section>
      <section className="mt-5 grid gap-4 lg:grid-cols-2">{recruitingV2Candidates.map((candidateRow) => <CandidateCard key={candidateRow.id} candidate={candidateRow} />)}</section>
    </main>
  );
}