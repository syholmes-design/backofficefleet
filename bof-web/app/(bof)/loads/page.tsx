import Link from "next/link";
import { getBofData } from "@/lib/load-bof-data";
import { LoadsDispatchTable } from "@/components/LoadsDispatchTable";

export const metadata = {
  title: "Loads / Dispatch | BOF",
  description: "Active and recent dispatch loads",
};

export default function LoadsPage() {
  const data = getBofData();

  return (
    <div className="bof-page">
      <h1 className="bof-title">Loads / dispatch</h1>
      <p className="bof-lead">
        Dispatch view — select a driver to open their profile and documents.
      </p>

      <LoadsDispatchTable data={data} />

      <p className="bof-muted bof-small">
        <Link href="/dashboard" className="bof-link-secondary">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
