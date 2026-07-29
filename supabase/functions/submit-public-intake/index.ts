import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type JsonMap = Record<string, unknown>;

const allowedSubmissionTypes = [
  "contact",
  "demo_request",
  "priority_fleet",
  "assessment_roadmap",
  "government_inquiry",
  "aggregator_inquiry",
  "driver_inquiry",
] as const;

const labelMaps = {
  audience: new Map<string, string>([
    ["aggregator or carrier network", "aggregator"],
    ["private fleet", "private_fleet"],
    ["for-hire fleet", "for_hire_fleet"],
    ["government or public fleet", "government"],
    ["driver or document operation", "driver"],
    ["demo request", "other"],
    ["priority fleet program", "other"],
    ["general business inquiry", "other"],
  ]),
  fleet: new Map<string, string>([
    ["private fleet", "private_fleet"],
    ["for-hire fleet", "for_hire_fleet"],
    ["aggregator or carrier network", "carrier_network"],
    ["aggregator or network", "carrier_network"],
    ["government or public fleet", "government_fleet"],
    ["driver or document operation", "owner_operator"],
    ["vendor or partner", "other"],
    ["other", "other"],
  ]),
  contactMethod: new Map<string, string>([
    ["email", "email"],
    ["phone", "phone"],
    ["either", "either"],
  ]),
  nextStep: new Map<string, string>([
    ["general follow-up", "general_response"],
    ["guided demo", "guided_demo"],
    ["readiness roadmap review", "detailed_readiness_roadmap"],
    ["priority fleet consideration", "priority_fleet_review"],
    ["government preparedness discussion", "government_consultation"],
    ["aggregator readiness discussion", "aggregator_consultation"],
    ["driver or vault support routing", "driver_readiness_support"],
  ]),
  assessmentType: new Map<string, string>([
    ["aggregator", "aggregator"],
    ["private-fleet", "private_fleet"],
    ["private fleet", "private_fleet"],
    ["for-hire-fleet", "for_hire_fleet"],
    ["for-hire fleet", "for_hire_fleet"],
    ["government", "government"],
    ["government fleet or agency", "government"],
    ["driver", "driver"],
    ["individual driver", "driver"],
  ]),
};

const queueBySubmissionType: Record<string, string> = {
  contact: "general",
  demo_request: "demo",
  priority_fleet: "priority_fleet",
  assessment_roadmap: "assessment",
  government_inquiry: "government",
  aggregator_inquiry: "aggregator",
  driver_inquiry: "driver",
};

const requiredByType: Record<string, string[]> = {
  contact: ["inquiry_reason"],
  demo_request: ["demo_focus"],
  priority_fleet: ["implementation_readiness"],
  assessment_roadmap: [],
  government_inquiry: ["agency_type"],
  aggregator_inquiry: ["network_structure"],
  driver_inquiry: ["support_category"],
};

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const duplicateWindow = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 8;
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;
const MIN_COMPLETION_MS = 2500;

function jsonResponse(body: JsonMap, status = 200, origin = "") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
    },
  });
}

function corsHeaders(origin = "") {
  return {
    "access-control-allow-origin": origin || "null",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, x-client-info, apikey",
    "vary": "Origin",
  };
}

function configuredOrigins() {
  return (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function originAllowed(origin: string | null) {
  const allowed = configuredOrigins();
  if (!allowed.length) return false;
  return !!origin && allowed.includes(origin);
}

function cleanString(value: unknown, max = 240) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function lower(value: unknown) {
  return cleanString(value).toLowerCase();
}

function hasUnsafeMarkup(value: unknown) {
  const text = Array.isArray(value) ? value.join(" ") : String(value ?? "");
  return /<\s*script|javascript:|<\/?[a-z][\s\S]*>/i.test(text);
}

function isObject(value: unknown): value is JsonMap {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => cleanString(item, 120)).filter(Boolean);
  const single = cleanString(value, 120);
  return single ? [single] : [];
}

function pickMapped(map: Map<string, string>, value: unknown) {
  const key = lower(value);
  return map.get(key) || null;
}

function emailDomain(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  if (!domain || ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"].includes(domain)) return null;
  return domain.slice(0, 120);
}

function normalizeOrg(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, 160) || null;
}

function validateAssessment(context: unknown) {
  if (!context) return { ok: true, value: null };
  if (!isObject(context)) return { ok: false, reason: "assessment_context must be an object" };

  const type = pickMapped(labelMaps.assessmentType, context.type || context.audience);
  const band = cleanString(context.band, 80);
  const sections = Array.isArray(context.sections) ? context.sections.slice(0, 8) : [];
  const gaps = Array.isArray(context.gaps) ? context.gaps.slice(0, 3) : [];
  const modules = Array.isArray(context.modules) ? context.modules.slice(0, 8) : [];

  const sectionScores = sections.map((section) => {
    if (!isObject(section)) return null;
    const name = cleanString(section.name, 80);
    const pct = Number(section.pct);
    if (!name || !Number.isFinite(pct) || pct < 0 || pct > 100) return null;
    return { name, pct: Math.round(pct) };
  }).filter(Boolean);

  const topGaps = gaps.map((gap) => {
    if (!isObject(gap)) return cleanString(gap, 240);
    return {
      section: cleanString(gap.section, 80),
      text: cleanString(gap.text, 240),
    };
  }).filter(Boolean);

  const recommendedModules = modules.map((module) => cleanString(module, 80)).filter(Boolean);

  return {
    ok: true,
    value: {
      assessment_type: type,
      assessment_readiness_band: band || null,
      assessment_section_scores: sectionScores,
      assessment_top_gaps: topGaps,
      assessment_recommended_modules: recommendedModules,
    },
  };
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function clientIp(req: Request) {
  return req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const bucket = rateLimit.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT_MAX;
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return { ok: true, configured: false };
  if (!token) return { ok: false, configured: true };

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  });
  if (!response.ok) return { ok: false, configured: true };
  const result = await response.json();
  return { ok: !!result.success, configured: true };
}

function validatePayload(payload: JsonMap) {
  const submissionType = cleanString(payload.submission_type || payload.intake_type, 40);
  if (!allowedSubmissionTypes.includes(submissionType as typeof allowedSubmissionTypes[number])) {
    return { ok: false, error: "validation_failed", message: "Unsupported submission type." };
  }

  const contact = isObject(payload.contact) ? payload.contact : {};
  const organization = isObject(payload.organization) ? payload.organization : {};
  const request = isObject(payload.request) ? payload.request : {};
  const fields = { ...request, ...contact, ...organization };

  if (Object.values(fields).some(hasUnsafeMarkup)) {
    return { ok: false, error: "validation_failed", message: "Remove markup, scripts, or protected-record content." };
  }

  const firstName = cleanString(contact.first_name || request.first_name, 80);
  const lastName = cleanString(contact.last_name || request.last_name, 80);
  const email = cleanString(contact.email || request.email, 254);
  const normalizedEmail = email.toLowerCase();
  const requestSummary = cleanString(request.request_summary, 1500);
  const privacyAcknowledged = request.privacy_acknowledgment === "acknowledged" || request.privacy_acknowledgment === true || payload.privacy_acknowledgment === true;

  const required = [
    ["first_name", firstName],
    ["last_name", lastName],
    ["email", normalizedEmail],
    ["request_summary", requestSummary],
  ];
  for (const [name, value] of required) {
    if (!value) return { ok: false, error: "validation_failed", message: `${name} is required.` };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    return { ok: false, error: "validation_failed", message: "A valid email is required." };
  }
  if (!privacyAcknowledged) {
    return { ok: false, error: "validation_failed", message: "Privacy acknowledgment is required." };
  }

  const typeRequired = requiredByType[submissionType] || [];
  for (const field of typeRequired) {
    const value = request[field];
    if (Array.isArray(value) ? value.length === 0 : !cleanString(value)) {
      return { ok: false, error: "validation_failed", message: `${field} is required for this request type.` };
    }
  }

  const assessment = validateAssessment(payload.assessment_context);
  if (!assessment.ok) {
    return { ok: false, error: "validation_failed", message: assessment.reason || "Invalid assessment summary." };
  }

  const startedAt = Date.parse(cleanString(payload.started_at));
  if (Number.isFinite(startedAt) && Date.now() - startedAt < MIN_COMPLETION_MS) {
    return { ok: false, error: "spam_check_failed", message: "Please review the form before submitting." };
  }

  const sourcePage = cleanString(payload.source_page, 180) || "/";
  const organizationName = cleanString(organization.name || request.organization_name, 160);
  const normalizedOrg = organizationName ? normalizeOrg(organizationName) : null;
  const preferredContactMethod = pickMapped(labelMaps.contactMethod, contact.preferred_contact_method || request.preferred_contact_method);
  const requestedNextStep = pickMapped(labelMaps.nextStep, request.requested_next_step);
  const audienceType = pickMapped(labelMaps.audience, organization.audience_type || request.audience_type);
  const fleetType = pickMapped(labelMaps.fleet, organization.fleet_type || request.fleet_type);
  const operatingRegions = cleanString(organization.operating_regions || request.operating_regions, 180)
    .split(",")
    .map((item) => cleanString(item, 60))
    .filter(Boolean)
    .slice(0, 12);

  return {
    ok: true,
    record: {
      submission_type: submissionType,
      source_page: sourcePage.startsWith("/") ? sourcePage : "/",
      source_referrer: cleanString(payload.source_referrer, 300) || null,
      source_campaign: cleanString(payload.source_campaign, 120) || null,
      audience_type: audienceType,
      first_name: firstName,
      last_name: lastName,
      email,
      normalized_email: normalizedEmail,
      phone: cleanString(contact.phone || request.phone, 40) || null,
      preferred_contact_method: preferredContactMethod,
      organization_name: organizationName || null,
      normalized_organization_name: normalizedOrg,
      organization_domain: emailDomain(normalizedEmail),
      job_title: cleanString(organization.job_title || request.job_title, 120) || null,
      fleet_type: fleetType,
      fleet_size_range: cleanString(organization.fleet_size || request.fleet_size, 40) || null,
      operating_regions: operatingRegions.length ? operatingRegions : null,
      request_summary: requestSummary,
      requested_next_step: requestedNextStep,
      assessment_type: assessment.value?.assessment_type || null,
      assessment_readiness_band: assessment.value?.assessment_readiness_band || null,
      assessment_section_scores: assessment.value?.assessment_section_scores || null,
      assessment_top_gaps: assessment.value?.assessment_top_gaps || null,
      assessment_recommended_modules: assessment.value?.assessment_recommended_modules || null,
      assigned_queue: queueBySubmissionType[submissionType],
      metadata: {
        validation_version: "2026-07-29-public-intake-v1",
        test_submission: !!payload.metadata && isObject(payload.metadata) && payload.metadata.test_submission === true,
        request_fingerprint: "",
        page_specific_fields: request,
        turnstile_configured: false,
        notification_provider: Deno.env.get("INTAKE_NOTIFICATION_PROVIDER") ? "configured" : "unconfigured",
      },
    },
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(originAllowed(origin) ? origin || "" : "") });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405, originAllowed(origin) ? origin || "" : "");
  }
  if (!originAllowed(origin)) {
    return jsonResponse({ ok: false, error: "origin_not_allowed" }, 403, "");
  }

  const ip = clientIp(req);
  if (!enforceRateLimit(ip)) {
    return jsonResponse({ ok: false, error: "rate_limited", message: "Please wait before submitting another request." }, 429, origin || "");
  }

  let payload: JsonMap;
  try {
    payload = await req.json();
  } catch (_error) {
    return jsonResponse({ ok: false, error: "validation_failed", message: "Malformed JSON." }, 400, origin || "");
  }
  if (!isObject(payload)) {
    return jsonResponse({ ok: false, error: "validation_failed", message: "Request body must be an object." }, 400, origin || "");
  }
  if (cleanString(payload.website)) {
    return jsonResponse({ ok: false, error: "spam_check_failed", message: "Request could not be accepted." }, 400, origin || "");
  }

  const turnstile = await verifyTurnstile(cleanString(payload.turnstile_token), ip);
  if (!turnstile.ok) {
    return jsonResponse({ ok: false, error: "spam_check_failed", message: "Anti-spam verification failed." }, 400, origin || "");
  }

  const validated = validatePayload(payload);
  if (!validated.ok) {
    return jsonResponse({ ok: false, error: validated.error, message: validated.message }, 400, origin || "");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, error: "service_unavailable", message: "Public intake is not configured yet." }, 503, origin || "");
  }

  const record = validated.record as JsonMap;
  const fingerprint = await sha256([
    record.submission_type,
    record.normalized_email,
    record.request_summary,
    record.source_page,
  ].join("|"));

  const now = Date.now();
  const duplicateSeenAt = duplicateWindow.get(fingerprint);
  if (duplicateSeenAt && now - duplicateSeenAt < DUPLICATE_WINDOW_MS) {
    return jsonResponse({ ok: false, error: "duplicate_submission", message: "This request was already submitted recently." }, 409, origin || "");
  }
  duplicateWindow.set(fingerprint, now);
  (record.metadata as JsonMap).request_fingerprint = fingerprint;
  (record.metadata as JsonMap).turnstile_configured = turnstile.configured;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: duplicateError } = await supabase
    .schema("intake")
    .from("public_intakes")
    .select("id")
    .eq("metadata->>request_fingerprint", fingerprint)
    .gte("submitted_at", new Date(now - DUPLICATE_WINDOW_MS).toISOString())
    .limit(1);
  if (duplicateError) {
    return jsonResponse({ ok: false, error: "service_unavailable", message: "Public intake is temporarily unavailable." }, 503, origin || "");
  }
  if (existing && existing.length) {
    return jsonResponse({ ok: false, error: "duplicate_submission", message: "This request was already submitted recently." }, 409, origin || "");
  }

  const { data: inserted, error: insertError } = await supabase
    .schema("intake")
    .from("public_intakes")
    .insert(record)
    .select("id, public_reference")
    .single();
  if (insertError || !inserted) {
    return jsonResponse({ ok: false, error: "internal_error", message: "Public intake could not be stored." }, 500, origin || "");
  }

  await supabase.schema("intake").from("intake_events").insert({
    intake_id: inserted.id,
    event_type: "submitted",
    actor_type: "edge_function",
    event_summary: "Public intake submitted through Edge Function.",
    metadata: {
      submission_type: record.submission_type,
      source_page: record.source_page,
    },
  });

  await supabase.schema("intake").from("intake_events").insert({
    intake_id: inserted.id,
    event_type: Deno.env.get("INTAKE_NOTIFICATION_PROVIDER") ? "notification_requested" : "notification_unconfigured",
    actor_type: "system",
    event_summary: Deno.env.get("INTAKE_NOTIFICATION_PROVIDER")
      ? "Notification provider configured; delivery adapter pending implementation."
      : "Notification provider not configured; intake remains stored for review.",
    metadata: {},
  });

  return jsonResponse({
    ok: true,
    reference: inserted.public_reference,
    message: "Your request was received.",
  }, 202, origin || "");
});
