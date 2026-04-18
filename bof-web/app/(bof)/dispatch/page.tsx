import { DispatchShell } from "@/components/dispatch/DispatchShell";

export const metadata = {
  title: "Dispatch | BOF",
  description: "Dispatch board, assignments, exceptions, and settlement readiness",
};

export default function DispatchPage() {
  return (
    <div className="bof-page bof-dispatch-page-wrap">
      <DispatchShell />
    </div>
  );
}
