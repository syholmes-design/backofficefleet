import Link from "next/link";
import { LoadRequirementsWizard } from "@/components/load-intake/LoadRequirementsWizard";

export const metadata = {
  title: "Load requirements intake | BOF",
  description:
    "Pre-dispatch shipper and load requirements capture with BOF auto-checks and dispatch packet readiness",
};

export default function LoadRequirementsIntakePage() {
  return (
    <div className="bof-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/dispatch" className="bof-link-secondary">
          Dispatch
        </Link>
        <span aria-hidden> / </span>
        <span>Load requirements intake</span>
      </nav>
      <LoadRequirementsWizard />
    </div>
  );
}
