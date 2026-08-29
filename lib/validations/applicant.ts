export type ApplicantSubmissionData = {
  name: string;
  email: string;
  phone: string;
  homeLocation: string;
  positionId: string;
  cdlClass: string;
  cdlState: string;
  cdlNumber: string;
  experienceYears: number;
  endorsements?: string[];
  availabilityDate?: string;
  consentAcknowledged: boolean;
  website_hp?: string;
};

export function validateApplicantSubmission(data: unknown): {
  success: boolean;
  data?: ApplicantSubmissionData;
  errors?: string[];
} {
  const errors: string[] = [];

  if (typeof data !== "object" || data === null) {
    return { success: false, errors: ["Invalid JSON payload"] };
  }

  const obj = data as Record<string, unknown>;

  const name = typeof obj.name === "string" ? obj.name.trim() : "";
  if (name.length < 2) errors.push("Name must be at least 2 characters");

  const email = typeof obj.email === "string" ? obj.email.trim().toLowerCase() : "";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) errors.push("Invalid email address format");

  const phone = typeof obj.phone === "string" ? obj.phone.trim() : "";
  if (phone.length < 7) errors.push("Phone number required");

  const homeLocation = typeof obj.homeLocation === "string" ? obj.homeLocation.trim() : "";
  if (homeLocation.length < 2) errors.push("City/State required");

  const positionId = typeof obj.positionId === "string" ? obj.positionId.trim() : "";
  if (!positionId) errors.push("Position selection required");

  const cdlClass = typeof obj.cdlClass === "string" ? obj.cdlClass.trim() : "";
  if (!cdlClass) errors.push("CDL Class required");

  const cdlState = typeof obj.cdlState === "string" ? obj.cdlState.trim().toUpperCase() : "";
  if (cdlState.length !== 2) errors.push("CDL State must be 2 characters (e.g. OH)");

  const cdlNumber = typeof obj.cdlNumber === "string" ? obj.cdlNumber.trim() : "";
  if (cdlNumber.length < 4) errors.push("CDL Number required");

  const experienceYears = typeof obj.experienceYears === "number" ? obj.experienceYears : Number(obj.experienceYears || 0);
  if (Number.isNaN(experienceYears) || experienceYears < 0) errors.push("Valid years of experience required");

  const consentAcknowledged = Boolean(obj.consentAcknowledged);
  if (!consentAcknowledged) errors.push("You must acknowledge consent to submit an application");

  const website_hp = typeof obj.website_hp === "string" ? obj.website_hp.trim() : "";
  if (website_hp.length > 0) errors.push("Bot submission detected");

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name,
      email,
      phone,
      homeLocation,
      positionId,
      cdlClass,
      cdlState,
      cdlNumber,
      experienceYears,
      endorsements: Array.isArray(obj.endorsements) ? obj.endorsements.map(String) : [],
      availabilityDate: typeof obj.availabilityDate === "string" ? obj.availabilityDate : undefined,
      consentAcknowledged,
      website_hp,
    },
  };
}
