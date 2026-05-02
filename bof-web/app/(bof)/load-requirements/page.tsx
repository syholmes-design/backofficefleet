import { redirect } from "next/navigation";

/** @deprecated Use `/load-intake` — single canonical BOF load intake pipeline. */
export default function LoadRequirementsIntakeRedirectPage() {
  redirect("/load-intake");
}
