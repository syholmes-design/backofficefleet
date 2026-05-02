import { Suspense } from "react";
import Link from "next/link";
import { LoadRequirementsWizard } from "@/components/load-intake/LoadRequirementsWizard";

export const metadata = {
  title: "BOF Load Intake | BOF",
  description:
    "Canonical load intake: manual entry, document extraction when configured, client request import, validation, and save to BOF loads with dispatch sync.",
};

export default function LoadIntakePage() {
  return (
    <div className="bof-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/dispatch" className="bof-link-secondary">
          Dispatch
        </Link>
        <span aria-hidden> / </span>
        <span>Load intake</span>
      </nav>
      <Suspense fallback={<p className="bof-muted bof-small">Loading intake…</p>}>
        <LoadRequirementsWizard />
      </Suspense>
    </div>
  );
}
