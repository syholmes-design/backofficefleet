"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { RecruitingPageClient } from "@/components/recruiting/RecruitingPageClient";
import { RequisitionFormClient } from "@/components/recruiting/RequisitionFormClient";
import { RequisitionListClient } from "@/components/recruiting/RequisitionListClient";
import { demoRecruitingTransport, resetRecruitingDemo } from "@/lib/recruiting/demo-backend";
import { DEMO_STAGE_VIEW, isDemoStage, stageRecruitingDemo } from "@/lib/recruiting/demo-stages";
import { transportFetch } from "@/lib/recruiting/workspace-transport";
import "./recruiting.css";

/**
 * Public Recruiting & Onboarding demonstration. The same requisition and workspace screens the
 * signed-in fleet uses, answered in this browser by lib/recruiting/demo-backend.ts with fictional
 * records. Nothing here reaches the BOF database or any carrier's records.
 */

const demoFetch = transportFetch(demoRecruitingTransport);

export function RecruitingDemoBanner() {
  return (
    <div className="bof-recruiting-demo-banner" data-testid="recruiting-demo-banner" role="note">
      <div>
        <strong>Demonstration.</strong> Fictional carrier (Lakeshore Regional Carriers) and fictional candidates. Everything you do here
        stays in this browser; no BOF records are created or changed. Driver activation is simulated.
      </div>
      <div className="bof-recruiting-demo-banner__links">
        <Link href="/demo/recruiting">Requisitions</Link>
        <Link href="/demo/recruiting/workspace">Recruiting &amp; Onboarding workspace</Link>
        <Link href="/recruiting-onboarding">How it works</Link>
        <button
          type="button"
          data-testid="reset-demonstration"
          onClick={() => {
            resetRecruitingDemo();
            window.location.assign("/demo/recruiting");
          }}
        >
          Reset demonstration
        </button>
      </div>
    </div>
  );
}

type ListRows = Parameters<typeof RequisitionListClient>[0]["initialRows"];

export function RecruitingDemoRequisitions() {
  const [rows, setRows] = useState<ListRows | null>(null);
  useEffect(() => {
    void demoRecruitingTransport("/api/recruiting/requisitions").then((result) => setRows(result.data as unknown as ListRows));
  }, []);
  return (
    <>
      <RecruitingDemoBanner />
      {rows ? <RequisitionListClient initialRows={rows} fetcher={demoFetch} basePath="/demo/recruiting" /> : <p className="bof-recruiting-note">Loading demonstration…</p>}
    </>
  );
}

type FormRecord = Parameters<typeof RequisitionFormClient>[0]["initial"];

export function RecruitingDemoRequisition({ requisitionId }: { requisitionId: string }) {
  const [record, setRecord] = useState<FormRecord | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    void demoRecruitingTransport(`/api/recruiting/requisitions/${encodeURIComponent(requisitionId)}`).then((result) => {
      if (result.ok) setRecord(result.data as unknown as FormRecord);
      else setMissing(true);
    });
  }, [requisitionId]);
  return (
    <>
      <RecruitingDemoBanner />
      {missing ? (
        <p className="bof-recruiting-note">
          This requisition is not in this browser&apos;s demonstration (it may have been reset). <Link href="/demo/recruiting">Back to requisitions</Link>
        </p>
      ) : record ? (
        <RequisitionFormClient key={requisitionId} initial={record} fetcher={demoFetch} basePath="/demo/recruiting" />
      ) : (
        <p className="bof-recruiting-note">Loading demonstration…</p>
      )}
    </>
  );
}

export function RecruitingDemoWorkspace() {
  // The workspace reads URL state on mount; render it only in the browser, where the demo store lives.
  const [mounted, setMounted] = useState(false);
  const [staged, setStaged] = useState<{ label: string } | { error: string } | null>(null);
  useEffect(() => {
    const stage = new URLSearchParams(window.location.search).get("stage");
    if (!isDemoStage(stage)) {
      setMounted(true);
      return;
    }
    // ?stage=… starts the demonstration at that stage, then opens the workspace on it.
    const view = DEMO_STAGE_VIEW[stage];
    stageRecruitingDemo(stage)
      .then((candidateId) => {
        window.history.replaceState(null, "", `/demo/recruiting/workspace?candidateId=${encodeURIComponent(candidateId)}&tab=${view.tab}${view.workflow ? `&workflow=${view.workflow}` : ""}`);
        setStaged({ label: view.label });
      })
      .catch((error: unknown) => setStaged({ error: error instanceof Error ? error.message : String(error) }))
      .finally(() => setMounted(true));
  }, []);
  const transport = useMemo(() => demoRecruitingTransport, []);
  return (
    <>
      <RecruitingDemoBanner />
      {staged ? (
        <p className="bof-recruiting-demo-stage" data-testid="demo-stage-note" role="note">
          {"label" in staged
            ? `Starting at ${staged.label}: Michael Anderson's earlier steps on BOF-HR-DRV-001 were completed for you, through the same demonstration rules.`
            : `The demonstration could not be staged (${staged.error}). It opens from the start instead.`}
        </p>
      ) : null}
      {mounted ? <RecruitingPageClient transport={transport} demo basePath="/demo/recruiting/workspace" /> : <p className="bof-recruiting-note">Preparing the demonstration…</p>}
    </>
  );
}
