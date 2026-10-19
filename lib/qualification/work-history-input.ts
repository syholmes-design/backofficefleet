/**
 * Employment-history entry for a driver's qualification file (FMCSA 391.21 application history,
 * confirmed under 391.23). Pure validation, shared by the API and its tests.
 */
export type WorkHistoryInput = { employerName: string; startDate: Date | null; endDate: Date | null };

function parseDate(value: unknown, label: string, errors: string[]): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push(`${label} must be a date (YYYY-MM-DD)`);
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) errors.push(`${label} is not a valid date`);
  return date;
}

export function validateWorkHistoryInput(body: unknown, now = new Date()): { input?: WorkHistoryInput; errors: string[] } {
  const errors: string[] = [];
  if (typeof body !== "object" || body === null || Array.isArray(body)) return { errors: ["Request body must be an object"] };
  const raw = body as Record<string, unknown>;
  const employerName = typeof raw.employerName === "string" ? raw.employerName.trim() : "";
  if (employerName.length < 2) errors.push("Employer name is required");
  if (employerName.length > 160) errors.push("Employer name is too long");
  const startDate = parseDate(raw.startDate, "Start date", errors);
  const endDate = parseDate(raw.endDate, "End date", errors);
  if (!startDate && !errors.some((e) => e.startsWith("Start date"))) errors.push("Start date is required");
  if (startDate && startDate > now) errors.push("Start date cannot be in the future");
  if (startDate && endDate && endDate < startDate) errors.push("End date cannot be before the start date");
  return errors.length ? { errors } : { input: { employerName, startDate, endDate }, errors };
}
