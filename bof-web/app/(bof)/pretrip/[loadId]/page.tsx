import Link from "next/link";
import { notFound } from "next/navigation";
import { getBofData } from "@/lib/load-bof-data";
import { buildPretripTabletModel } from "@/lib/pretrip-tablet";
import { listEngineDocumentsForLoad } from "@/lib/document-engine";
import { PretripTabletDashboard } from "@/components/PretripTabletDashboard";

type Props = { params: Promise<{ loadId: string }> };

export async function generateStaticParams() {
  const data = getBofData();
  return data.loads.map((l) => ({ loadId: l.id }));
}

export async function generateMetadata({ params }: Props) {
  const { loadId } = await params;
  const data = getBofData();
  const load = data.loads.find((l) => l.id === loadId);
  return {
    title: load ? `Pre-trip · Load ${load.number} | BOF` : "Pre-trip | BOF",
  };
}

export default async function PretripTabletPage({ params }: Props) {
  const { loadId } = await params;
  const data = getBofData();
  const model = buildPretripTabletModel(data, loadId);
  if (!model) notFound();

  const pending = model.loadStatus === "Pending";
  const startDisabled =
    !pending || model.overall === "BLOCKED" || model.blockReasons.length > 0;

  const pretripEngineDocs = listEngineDocumentsForLoad(data, loadId).filter(
    (d) =>
      /\bRF\b|dispatch|pretrip|seal|rate|bol|cargo|gps|weather|hos|camera|lumper|fuel|maintenance|tire|pod|empty/i.test(
        d.type
      )
  );

  return (
    <div className="bof-page bof-tablet-page">
      <nav className="bof-breadcrumb bof-tablet-breadcrumb" aria-label="Breadcrumb">
        <Link href="/loads">Loads</Link>
        <span aria-hidden> / </span>
        <Link href={`/loads/${model.loadId}`}>Load {model.loadNumber}</Link>
        <span aria-hidden> / </span>
        <span>Pre-trip tablet</span>
      </nav>

      <PretripTabletDashboard
        model={model}
        loadId={loadId}
        pretripEngineDocs={pretripEngineDocs}
        startDisabled={startDisabled}
      />
    </div>
  );
}
