/**
 * Carrier identity validation shared by the API (authoritative) and the
 * Carrier Monitoring form (immediate, field-level feedback). No server imports.
 */
export const USDOT_FORMAT_MESSAGE = "USDOT number must be 1–8 digits";
export const DOCKET_FORMAT_MESSAGE = "Docket must look like MC123456, MX123456 or FF123456";

export type IdentityField = "usdotNumber" | "mcNumber";
export type FieldValidation = { ok: true; value: string | null } | { ok: false; message: string };

export function validateUsdotInput(value: unknown): FieldValidation {
  if (value === null || value === undefined || String(value).trim() === "") return { ok: true, value: null };
  const text = String(value).trim().replace(/^USDOT\s*#?\s*/i, "").replace(/^DOT\s*#?\s*/i, "");
  if (!/^\d{1,8}$/.test(text)) return { ok: false, message: USDOT_FORMAT_MESSAGE };
  const digits = String(Number(text));
  if (digits === "0") return { ok: false, message: USDOT_FORMAT_MESSAGE };
  return { ok: true, value: digits };
}

export function validateDocketInput(value: unknown): FieldValidation {
  if (value === null || value === undefined || String(value).trim() === "") return { ok: true, value: null };
  const match = /^(MC|MX|FF)[\s-]*#?\s*(\d{1,8})$/i.exec(String(value).trim());
  if (!match) return { ok: false, message: DOCKET_FORMAT_MESSAGE };
  return { ok: true, value: `${match[1].toUpperCase()}${String(Number(match[2]))}` };
}

/** Field-level errors for the identity form; empty when valid. */
export function identityFieldErrors(input: { usdotNumber: string; mcNumber: string }): Partial<Record<IdentityField, string>> {
  const errors: Partial<Record<IdentityField, string>> = {};
  const usdot = validateUsdotInput(input.usdotNumber);
  if (!usdot.ok) errors.usdotNumber = usdot.message;
  const docket = validateDocketInput(input.mcNumber);
  if (!docket.ok) errors.mcNumber = docket.message;
  return errors;
}
