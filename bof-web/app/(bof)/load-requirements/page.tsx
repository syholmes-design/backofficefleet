import { redirect } from "next/navigation";

/** @deprecated Use `/dispatch/intake` — canonical BOF load intake under Dispatch. */
export default function LoadRequirementsPage() {
  redirect("/dispatch/intake");
}
