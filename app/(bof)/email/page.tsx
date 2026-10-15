import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EmailInboxClient } from "@/components/email/EmailInboxClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Email | BOF",
  description: "BOF partnership correspondence: inbox, drafts and human approval.",
};

export default async function EmailPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin?callbackUrl=/email");
  return <EmailInboxClient />;
}
