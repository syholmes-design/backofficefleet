"use client";

import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getLoadProofItems } from "@/lib/load-proof";
import { DemoBackButton } from "@/components/navigation/DemoBackButton";

export function RuntimeLoadDetailFallback({ loadId }: { loadId: string }) {
  const { data } = useBofDemoData();
  const load = data.loads.find((l) => l.id === loadId);
  if (!load) {
    return (
      <div className="bof-page">
        <h1 className="bof-title">Load not found</h1>
        <p className="bof-muted">This load is not present in seeded data or the current demo session.</p>
        <p>
          <Link href="/load-intake" className="bof-link-secondary">
            Open Load Intake
          </Link>
        </p>
      </div>
    );
  }
  const proof = getLoadProofItems(data, load.id);
  return (
    <div className="bof-page">
      <div style={{ marginBottom: "0.65rem" }}>
        <DemoBackButton fallbackHref="/loads" />
      </div>
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/loads">Loads / dispatch</Link>
        <span aria-hidden> / </span>
        <span>
          Load {load.number} ({load.id})
        </span>
      </nav>
      <h1 className="bof-title">
        Runtime load <code className="bof-code">{load.id}</code>
      </h1>
      <p className="bof-lead">
        {load.origin} → {load.destination}
      </p>
      <section className="bof-driver-info-grid" aria-label="Runtime load detail">
        <div className="bof-info-block">
          <h2 className="bof-h3">Customer</h2>
          <p>{(load as { customerName?: string }).customerName || load.origin.split(" - ")[0]}</p>
        </div>
        <div className="bof-info-block">
          <h2 className="bof-h3">Driver</h2>
          <p>{load.driverId}</p>
        </div>
        <div className="bof-info-block">
          <h2 className="bof-h3">Status</h2>
          <p>
            {load.status} · POD {load.podStatus}
          </p>
        </div>
      </section>
      <section className="bof-oper-panel bof-oper-panel-tight">
        <h2 className="bof-h3">Proof initialization</h2>
        <ul className="bof-intake-engine-bullet">
          {proof.map((p) => (
            <li key={p.type}>
              {p.type}: {p.status}
            </li>
          ))}
        </ul>
        <p className="bof-muted bof-small">
          Generated docs may be pending for runtime loads. Run `npm run generate:load-docs` and `npm run generate:load-evidence` for static artifacts.
        </p>
      </section>
    </div>
  );
}

