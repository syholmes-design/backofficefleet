import Link from "next/link";
import { getBofData } from "@/lib/load-bof-data";
import { LoadsDispatchTable } from "@/components/LoadsDispatchTable";

export const metadata = {
  title: "Dispatch | BOF",
  description: "Dispatch loads and assigned drivers",
};

export default function DispatchPage() {
  const data = getBofData();

  return (
    <div className="bof-page">
      <h1 className="bof-title">Dispatch</h1>
      <p className="bof-lead">
        Same load board as Loads / dispatch — driver identity and assignment at
        a glance.
      </p>

      <LoadsDispatchTable data={data} />

      <p className="bof-muted bof-small">
        <Link href="/loads" className="bof-link-secondary">
          Open Loads / dispatch view →
        </Link>
      </p>
    </div>
  );
}
