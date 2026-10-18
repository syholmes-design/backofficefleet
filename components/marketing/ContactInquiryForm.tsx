"use client";

import { useState, type FormEvent } from "react";

import { CONTACT_SERVICE_OPTIONS, ORGANIZATION_TYPES, SAVED_INQUIRY_MESSAGE } from "@/lib/contact/contactInquiry";

type FieldErrors = Partial<Record<"fullName" | "companyName" | "email" | "phone" | "organizationType" | "services" | "message" | "form", string>>;

const inputClass = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950";

export function ContactInquiryForm({ defaultMessage }: { defaultMessage?: string } = {}) {
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPending(true);
    setConfirmation(null);
    setFormError(null);
    setFields({});
    const form = new FormData(formElement);
    const services = CONTACT_SERVICE_OPTIONS.filter((service) => form.getAll("services").includes(service));
    try {
      const response = await fetch("/api/contact/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          companyName: form.get("companyName"),
          email: form.get("email"),
          phone: form.get("phone"),
          organizationType: form.get("organizationType"),
          services,
          message: form.get("message"),
          website_hp: form.get("website_hp"),
        }),
      });
      const payload = (await response.json()) as { accepted?: boolean; saved?: boolean; emailed?: boolean; message?: string; error?: string; fields?: FieldErrors };
      if (response.status === 201 && payload.accepted === true && payload.saved === true && payload.emailed === false) {
        setConfirmation(payload.message || SAVED_INQUIRY_MESSAGE);
        formElement.reset();
        return;
      }
      setFields(payload.fields ?? {});
      setFormError(payload.error || "We could not save your inquiry. Nothing was sent.");
    } catch {
      setFormError("We could not save your inquiry. Nothing was sent.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" noValidate>
      <h2 className="text-xl font-bold text-slate-950">Send an inquiry</h2>
      <p className="mt-2 text-sm text-slate-700">BOF saves this inquiry for staff review. Submitting this form does not send an email.</p>
      <input type="text" name="website_hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {formError ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{formError}</p> : null}
      {confirmation ? <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">{confirmation}</p> : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-900">
          Full name
          <input name="fullName" required autoComplete="name" className={inputClass} aria-invalid={Boolean(fields.fullName)} />
          {fields.fullName ? <span className="mt-1 block text-sm font-normal text-red-800">{fields.fullName}</span> : null}
        </label>
        <label className="text-sm font-semibold text-slate-900">
          Company name
          <input name="companyName" required autoComplete="organization" className={inputClass} aria-invalid={Boolean(fields.companyName)} />
          {fields.companyName ? <span className="mt-1 block text-sm font-normal text-red-800">{fields.companyName}</span> : null}
        </label>
        <label className="text-sm font-semibold text-slate-900">
          Email
          <input name="email" type="email" required autoComplete="email" className={inputClass} aria-invalid={Boolean(fields.email)} />
          {fields.email ? <span className="mt-1 block text-sm font-normal text-red-800">{fields.email}</span> : null}
        </label>
        <label className="text-sm font-semibold text-slate-900">
          Phone <span className="font-normal text-slate-600">(optional)</span>
          <input name="phone" type="tel" autoComplete="tel" className={inputClass} aria-invalid={Boolean(fields.phone)} />
          {fields.phone ? <span className="mt-1 block text-sm font-normal text-red-800">{fields.phone}</span> : null}
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold text-slate-900">
        Organization type
        <select name="organizationType" required defaultValue="" className={inputClass} aria-invalid={Boolean(fields.organizationType)}>
          <option value="" disabled>Choose one</option>
          {ORGANIZATION_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        {fields.organizationType ? <span className="mt-1 block text-sm font-normal text-red-800">{fields.organizationType}</span> : null}
      </label>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-slate-900">Services needed</legend>
        <div className="mt-2 grid gap-2">
          {CONTACT_SERVICE_OPTIONS.map((service) => (
            <label key={service} className="flex items-start gap-2 text-sm text-slate-800">
              <input type="checkbox" name="services" value={service} className="mt-1" />
              <span>{service}</span>
            </label>
          ))}
        </div>
        {fields.services ? <span className="mt-1 block text-sm text-red-800">{fields.services}</span> : null}
      </fieldset>
      <label className="mt-4 block text-sm font-semibold text-slate-900">
        Message
        <textarea name="message" required rows={defaultMessage ? 8 : 5} defaultValue={defaultMessage} className={inputClass} aria-invalid={Boolean(fields.message)} />
        {fields.message ? <span className="mt-1 block text-sm font-normal text-red-800">{fields.message}</span> : null}
      </label>
      <button type="submit" disabled={pending} className="mt-5 inline-flex rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
        {pending ? "Saving inquiry..." : "Save inquiry"}
      </button>
    </form>
  );
}
