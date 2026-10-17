import { auth } from "@/auth";
import { isBofStaff } from "@/lib/contact/bofStaffAccess";
import type { SessionUserLike } from "@/lib/authorization";
import { ContactInquiriesDashboard } from "@/components/contact-inquiries/ContactInquiriesDashboard";
import { forbidden, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Customer inquiries | BOF",
  description: "Manage prospective-customer inquiries from initial contact through qualification.",
};

export default async function ContactInquiriesPage() {
  const session = await auth();
  const user = session?.user as SessionUserLike | undefined;
  if (!user?.id) {
    redirect("/api/auth/signin?callbackUrl=/contact-inquiries");
  }
  if (!isBofStaff(user)) {
    forbidden();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-slate-100">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-300">BOF staff</p>
      <h1 className="mt-2 text-3xl font-bold">Customer inquiries</h1>
      <p className="mt-3 max-w-3xl text-slate-300">
        Track prospective customers from the public contact form through qualification. Use notes and follow-ups to
        document outreach; email is not sent automatically from this workspace.
      </p>
      <ContactInquiriesDashboard />
    </main>
  );
}
