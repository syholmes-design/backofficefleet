import { SERVICE_PILLARS } from "@/lib/marketing-service-pillars";

export const ORGANIZATION_TYPES = [
  { value: "AGGREGATOR", label: "Aggregator" },
  { value: "MOTOR_CARRIER", label: "Motor Carrier" },
  { value: "PRIVATE_FLEET", label: "Private Fleet" },
  { value: "OTHER", label: "Other" },
] as const;

export const CONTACT_SERVICE_OPTIONS = SERVICE_PILLARS.map((pillar) => pillar.title);

const ORGANIZATION_VALUES = new Set<string>(ORGANIZATION_TYPES.map((item) => item.value));
const SERVICE_VALUES = new Set<string>(CONTACT_SERVICE_OPTIONS);

export const SAVED_INQUIRY_MESSAGE =
  "Your inquiry was received and saved for BOF review. An email notification was not sent.";

export type ContactInquiryInput = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string | null;
  organizationType: (typeof ORGANIZATION_TYPES)[number]["value"];
  services: string[];
  message: string;
};

export type ContactInquiryFieldErrors = Partial<Record<keyof ContactInquiryInput | "form", string>>;

export class ContactInquiryError extends Error {
  statusCode: number;
  fields: ContactInquiryFieldErrors;

  constructor(statusCode: number, message: string, fields: ContactInquiryFieldErrors = {}) {
    super(message);
    this.name = "ContactInquiryError";
    this.statusCode = statusCode;
    this.fields = fields;
  }
}

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max + 1);
}

export function parseContactInquiry(body: unknown): ContactInquiryInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ContactInquiryError(422, "Check the form and try again.", { form: "The inquiry could not be read." });
  }
  const record = body as Record<string, unknown>;
  const honeypot = typeof record.website_hp === "string" ? record.website_hp.trim() : "";
  if (honeypot.length > 0) {
    throw new ContactInquiryError(422, "This inquiry could not be accepted.");
  }

  const fields: ContactInquiryFieldErrors = {};
  const fullName = text(record.fullName, 120);
  const companyName = text(record.companyName, 160);
  const email = text(record.email, 254).toLowerCase();
  const phoneRaw = text(record.phone, 40);
  const organizationType = text(record.organizationType, 40);
  const message = text(record.message, 4000);
  const services = Array.isArray(record.services)
    ? record.services.filter((item): item is string => typeof item === "string").map((item) => item.trim())
    : [];

  if (fullName.length < 2 || fullName.length > 120) fields.fullName = "Enter your full name.";
  if (companyName.length < 2 || companyName.length > 160) fields.companyName = "Enter the company name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) fields.email = "Enter a valid email address.";
  if (phoneRaw.length > 40) fields.phone = "Enter a shorter phone number.";
  if (!ORGANIZATION_VALUES.has(organizationType)) fields.organizationType = "Choose an organization type.";
  if (services.length === 0 || services.some((service) => !SERVICE_VALUES.has(service)) || new Set(services).size !== services.length) {
    fields.services = "Choose at least one BOF service.";
  }
  if (message.length < 10 || message.length > 4000) fields.message = "Enter a message of at least 10 characters.";

  if (Object.keys(fields).length > 0) {
    throw new ContactInquiryError(422, "Check the form and try again.", fields);
  }

  return {
    fullName,
    companyName,
    email,
    phone: phoneRaw.length > 0 ? phoneRaw : null,
    organizationType: organizationType as ContactInquiryInput["organizationType"],
    services,
    message,
  };
}

export const CONTACT_INQUIRY_RATE_LIMIT = 5;
export const CONTACT_INQUIRY_RATE_WINDOW_MS = 15 * 60 * 1000;

export function contactInquiryRateLimitReached(savedInWindow: number, limit = CONTACT_INQUIRY_RATE_LIMIT) {
  return savedInWindow >= limit;
}
