(function () {
  "use strict";

  var STORAGE_KEY = "bofPublicIntakeDraft";
  var sensitivePattern = /<\s*script|javascript:|<\/?[a-z][\s\S]*>/i;

  var typeConfig = {
    contact: {
      label: "Contact inquiry",
      heading: "Prepare a BOF inquiry.",
      description: "Use this public intake for business contact only. Do not include sensitive documents, credentials, private driver data, account numbers, or protected records.",
      audience: "General business inquiry",
      extra: "contact"
    },
    demo_request: {
      label: "Demo request",
      heading: "Prepare a guided BOF review request.",
      description: "Tell BOF which operating workflow you want to review. Public intake is not a document upload or secure records channel.",
      audience: "Demo request",
      extra: "demo"
    },
    priority_fleet: {
      label: "Priority Fleet consideration",
      heading: "Request Priority Fleet consideration.",
      description: "Share the operating fit and implementation readiness BOF should review. Consideration is not acceptance.",
      audience: "Priority Fleet Program",
      extra: "priority"
    },
    assessment_roadmap: {
      label: "Assessment roadmap request",
      heading: "Request a detailed readiness roadmap.",
      description: "Your preliminary assessment summary can be included with this request. Public intake is not a legal, compliance, or certification channel.",
      audience: "Readiness assessment",
      extra: "assessment"
    },
    government_inquiry: {
      label: "Government fleet inquiry",
      heading: "Discuss government fleet preparedness.",
      description: "Use this for public-fleet preparedness, procurement, vendor, policy, continuity, or audit-readiness questions.",
      audience: "Government or public fleet",
      extra: "government"
    },
    aggregator_inquiry: {
      label: "Aggregator inquiry",
      heading: "Discuss network readiness.",
      description: "Use this for carrier networks, associations, freight aggregators, and multi-entity operating readiness.",
      audience: "Aggregator or carrier network",
      extra: "aggregator"
    },
    driver_inquiry: {
      label: "Driver or Vault inquiry",
      heading: "Prepare a driver support or BOF Vault inquiry.",
      description: "Use this for public support routing only. Do not upload, paste, or describe CDL, medical-card, tax, identity, settlement, or protected driver records.",
      audience: "Driver or document operation",
      extra: "driver"
    }
  };

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }

  function parseJson(value) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function backendEndpoint(form) {
    var config = window.BOFPublicIntakeConfig || {};
    return form.getAttribute("data-intake-endpoint") || config.endpoint || "";
  }

  function backendEnabled(form) {
    return !!backendEndpoint(form);
  }

  function sourceCampaign() {
    var params = new URLSearchParams(window.location.search);
    var allowed = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
    var parts = [];
    allowed.forEach(function (key) {
      var value = params.get(key);
      if (value) parts.push(key + "=" + value.slice(0, 80));
    });
    return parts.join("&");
  }

  function loadDraft() {
    try {
      var saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch (error) {
      return {};
    }
  }

  function saveDraft(data) {
    var allowed = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "preferred_contact_method",
      "organization_name",
      "job_title",
      "fleet_type",
      "fleet_size",
      "operating_regions",
      "audience_type"
    ];
    var draft = {};
    allowed.forEach(function (key) {
      if (data[key]) draft[key] = data[key];
    });
    draft.updated_at = new Date().toISOString();
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      return;
    }
  }

  function optionList(options, selected) {
    return options.map(function (option) {
      var isSelected = option === selected ? " selected" : "";
      return '<option value="' + escapeHtml(option) + '"' + isSelected + ">" + escapeHtml(option) + "</option>";
    }).join("");
  }

  function checkboxList(name, options) {
    return options.map(function (option) {
      return '<label><input type="checkbox" name="' + escapeHtml(name) + '" value="' + escapeHtml(option) + '"> ' + escapeHtml(option) + "</label>";
    }).join("");
  }

  function assessmentSummary(context) {
    if (!context) return "";
    var sections = Array.isArray(context.sections) ? context.sections : [];
    var gaps = Array.isArray(context.gaps) ? context.gaps : [];
    var modules = Array.isArray(context.modules) ? context.modules : [];
    return [
      '<div class="public-intake-summary" data-assessment-summary>',
        '<p class="public-intake-kicker">Assessment summary included</p>',
        '<div class="public-intake-summary-grid">',
          '<span><strong>' + escapeHtml(context.audience || "Audience") + '</strong> Audience</span>',
          '<span><strong>' + escapeHtml(context.band || "Not calculated") + '</strong> Readiness band</span>',
          '<span><strong>' + escapeHtml(context.pct || "0") + '%</strong> Overall indicator</span>',
        '</div>',
        sections.length ? '<p><strong>Section indicators:</strong> ' + sections.map(function (section) { return escapeHtml(section.name) + " " + escapeHtml(section.pct) + "%"; }).join(", ") + ".</p>" : "",
        gaps.length ? '<p><strong>Top gaps:</strong> ' + gaps.map(function (gap) { return escapeHtml(gap.section) + ": " + escapeHtml(gap.text); }).join(" | ") + ".</p>" : "",
        modules.length ? '<p><strong>Recommended workflows:</strong> ' + modules.map(escapeHtml).join(", ") + ".</p>" : "",
      "</div>"
    ].join("");
  }

  function extraFields(kind) {
    if (kind === "contact") {
      return [
        '<label>Inquiry reason <select name="inquiry_reason" required><option value="">Choose one</option>',
          optionList(["Fleet assessment", "Demo request", "Priority Fleet Program", "Aggregator or network inquiry", "Government or preparedness inquiry", "Driver or BOF Vault inquiry", "General business inquiry"], ""),
        "</select></label>"
      ].join("");
    }
    if (kind === "demo") {
      return [
        '<fieldset><legend>Demo focus areas</legend><div class="wave4-option-grid public-intake-option-grid">',
          checkboxList("demo_focus", ["Driver readiness", "Dispatch and operations", "Safety and compliance", "Settlements and billing", "Business Operations", "BOF Vault", "Policy Governance", "Network readiness", "Government preparedness", "Priority Fleet Program"]),
        "</div></fieldset>"
      ].join("");
    }
    if (kind === "priority") {
      return [
        '<label>Implementation readiness <select name="implementation_readiness" required><option value="">Choose one</option>',
          optionList(["Need discovery", "Assessing fit", "Ready for workflow review", "Ready for pilot planning", "Other"], ""),
        "</select></label>",
        '<fieldset><legend>Collaboration interest</legend><div class="wave4-option-grid public-intake-option-grid">',
          checkboxList("collaboration_interest", ["Readiness assessment", "Workflow configuration", "Implementation planning", "Product feedback", "Pilot participation"]),
        "</div></fieldset>"
      ].join("");
    }
    if (kind === "government") {
      return [
        '<label>Agency or public fleet type <select name="agency_type" required><option value="">Choose one</option>',
          optionList(["Municipal fleet", "County fleet", "State agency", "Public authority", "Emergency management", "Public works", "Other public organization"], ""),
        "</select></label>",
        '<fieldset><legend>Preparedness interests</legend><div class="wave4-option-grid public-intake-option-grid">',
          checkboxList("government_interest", ["Fleet availability", "Emergency response", "Procurement records", "Vendor readiness", "Policy governance", "Audit history"]),
        "</div></fieldset>"
      ].join("");
    }
    if (kind === "aggregator") {
      return [
        '<label>Network structure <select name="network_structure" required><option value="">Choose one</option>',
          optionList(["Carrier network", "Association", "Freight aggregator", "Multi-entity operator", "Partner ecosystem", "Other"], ""),
        "</select></label>",
        '<label>Approximate operating units <select name="operating_units"><option value="">Choose one</option>',
          optionList(["1-5", "6-20", "21-50", "51-100", "100+"], ""),
        "</select></label>",
        '<fieldset><legend>Coordination needs</legend><div class="wave4-option-grid public-intake-option-grid">',
          checkboxList("coordination_needs", ["Carrier readiness", "Proof standards", "Exception control", "Shared reporting", "Business operations", "Customer requirements"]),
        "</div></fieldset>"
      ].join("");
    }
    if (kind === "driver") {
      return [
        '<label>Support category <select name="support_category" required><option value="">Choose one</option>',
          optionList(["Driver readiness question", "BOF Vault information", "Document request status", "General driver support", "Other"], ""),
        "</select></label>",
        '<p class="public-intake-warning">Do not attach, paste, or summarize CDL, medical-card, identity, tax, payroll, settlement, government-record, or protected driver details in this public form.</p>'
      ].join("");
    }
    return "";
  }

  function renderForm(mount) {
    if (mount.getAttribute("data-public-intake-rendered") === "true") return;
    var type = mount.getAttribute("data-intake-type") || "contact";
    var config = typeConfig[type] || typeConfig.contact;
    var draft = loadDraft();
    var heading = mount.getAttribute("data-intake-heading") || config.heading;
    var description = mount.getAttribute("data-intake-description") || config.description;
    var sourcePage = mount.getAttribute("data-source-page") || window.location.pathname;
    var context = parseJson(mount.getAttribute("data-assessment-context"));
    var startedAt = String(Date.now());
    var audience = draft.audience_type || mount.getAttribute("data-audience-type") || config.audience;

    mount.setAttribute("data-public-intake-rendered", "true");
    mount.innerHTML = [
      '<form class="wave4-form public-intake-form" data-public-intake-form data-intake-type="' + escapeHtml(type) + '" data-source-page="' + escapeHtml(sourcePage) + '" data-started-at="' + escapeHtml(startedAt) + '" novalidate>',
        '<div class="public-intake-head">',
          '<p class="eyebrow public-intake-kicker">' + escapeHtml(config.label) + "</p>",
          '<h2>' + escapeHtml(heading) + "</h2>",
          '<p>' + escapeHtml(description) + "</p>",
        "</div>",
        assessmentSummary(context),
        '<div class="wave4-form-grid public-intake-grid">',
          '<label>First name <input name="first_name" autocomplete="given-name" maxlength="80" value="' + escapeHtml(draft.first_name) + '" required></label>',
          '<label>Last name <input name="last_name" autocomplete="family-name" maxlength="80" value="' + escapeHtml(draft.last_name) + '" required></label>',
          '<label>Work email <input name="email" type="email" autocomplete="email" maxlength="160" value="' + escapeHtml(draft.email) + '" required></label>',
          '<label>Phone <input name="phone" type="tel" autocomplete="tel" maxlength="40" value="' + escapeHtml(draft.phone) + '"></label>',
          '<label>Preferred contact method <select name="preferred_contact_method"><option value="">Choose one</option>' + optionList(["Email", "Phone", "Either"], draft.preferred_contact_method) + "</select></label>",
          '<label>Organization or fleet <input name="organization_name" autocomplete="organization" maxlength="140" value="' + escapeHtml(draft.organization_name) + '" required></label>',
          '<label>Role or title <input name="job_title" autocomplete="organization-title" maxlength="120" value="' + escapeHtml(draft.job_title) + '"></label>',
          '<label>Audience type <select name="audience_type" required><option value="">Choose one</option>' + optionList(["Private fleet", "For-hire fleet", "Aggregator or carrier network", "Government or public fleet", "Driver or document operation", "Demo request", "Priority Fleet Program", "General business inquiry"], audience) + "</select></label>",
          '<label>Fleet or network type <select name="fleet_type"><option value="">Choose one</option>' + optionList(["Private fleet", "For-hire fleet", "Aggregator or carrier network", "Government or public fleet", "Driver or document operation", "Vendor or partner", "Other"], draft.fleet_type) + "</select></label>",
          '<label>Fleet or network size <select name="fleet_size"><option value="">Choose one</option>' + optionList(["1-10 units", "11-50 units", "51-250 units", "251-1,000 units", "1,000+ units", "Not applicable"], draft.fleet_size) + "</select></label>",
          '<label>Operating region(s) <input name="operating_regions" maxlength="180" value="' + escapeHtml(draft.operating_regions) + '" placeholder="States, regions, or service area"></label>',
          extraFields(config.extra),
        "</div>",
        '<label>Requested next step <select name="requested_next_step" required><option value="">Choose one</option>' + optionList(["General follow-up", "Guided demo", "Readiness roadmap review", "Priority Fleet consideration", "Government preparedness discussion", "Aggregator readiness discussion", "Driver or Vault support routing"], "") + "</select></label>",
        '<label>What should BOF understand first? <textarea name="request_summary" rows="6" maxlength="1500" required></textarea></label>',
        '<label class="public-intake-checkbox"><input type="checkbox" name="privacy_acknowledgment" value="acknowledged" required> I understand this public intake is not a secure document-upload, CDL, medical-card, authenticated portal, payment, production chat, or protected-record channel.</label>',
        '<label class="public-intake-honeypot" aria-hidden="true">Leave this field blank <input name="website" tabindex="-1" autocomplete="off"></label>',
        '<p class="wave4-form-note" data-public-intake-note>Current status: ' + (backendEndpoint({ getAttribute: function () { return mount.getAttribute("data-intake-endpoint"); } }) || (window.BOFPublicIntakeConfig && window.BOFPublicIntakeConfig.endpoint) ? 'secure backend submission is configured for this page. BOF receives the request only after the server stores it and returns a reference.' : 'front-end intake is ready, but secure backend submission is not configured. The form can validate a request for review; no data is transmitted to BOF from this page.') + '</p>',
        '<button class="button primary" type="submit">' + (backendEndpoint({ getAttribute: function () { return mount.getAttribute("data-intake-endpoint"); } }) || (window.BOFPublicIntakeConfig && window.BOFPublicIntakeConfig.endpoint) ? 'Submit Intake Request' : 'Review Intake Request') + '</button>',
        '<div class="wave4-form-status" data-public-intake-status role="status" aria-live="polite" tabindex="-1"></div>',
      "</form>"
    ].join("");
    mount._bofAssessmentContext = context;
  }

  function valuesFor(form) {
    var data = {};
    var formData = new FormData(form);
    formData.forEach(function (value, key) {
      if (key === "website") return;
      if (data[key]) {
        if (!Array.isArray(data[key])) data[key] = [data[key]];
        data[key].push(String(value).trim());
      } else {
        data[key] = String(value).trim();
      }
    });
    return data;
  }

  function setStatus(form, message, isError) {
    var status = form.querySelector("[data-public-intake-status]");
    if (!status) return;
    status.textContent = message;
    status.classList.add("is-visible");
    status.classList.toggle("is-error", !!isError);
    status.focus && status.focus();
  }

  function validateSafeText(values) {
    return Object.keys(values).every(function (key) {
      var value = values[key];
      var list = Array.isArray(value) ? value : [value];
      return list.every(function (item) { return !sensitivePattern.test(item); });
    });
  }

  function buildRecord(form, values) {
    var mount = form.closest("[data-public-intake]");
    return {
      intake_id: "draft-" + Date.now(),
      intake_type: form.getAttribute("data-intake-type"),
      submission_type: form.getAttribute("data-intake-type"),
      source_page: form.getAttribute("data-source-page"),
      source_referrer: document.referrer || "",
      source_campaign: sourceCampaign(),
      status: backendEnabled(form) ? "ready_to_submit" : "backend_disabled",
      started_at: new Date(Number(form.getAttribute("data-started-at"))).toISOString(),
      reviewed_at: new Date().toISOString(),
      contact: {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone,
        preferred_contact_method: values.preferred_contact_method
      },
      organization: {
        name: values.organization_name,
        job_title: values.job_title,
        audience_type: values.audience_type,
        fleet_type: values.fleet_type,
        fleet_size: values.fleet_size,
        operating_regions: values.operating_regions
      },
      request: values,
      assessment_context: mount && mount._bofAssessmentContext ? mount._bofAssessmentContext : null,
      metadata: {
        test_submission: /^localhost$|^127\.0\.0\.1$/.test(window.location.hostname),
        viewport: window.innerWidth + "x" + window.innerHeight
      }
    };
  }

  function submitLabel(form, pending) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (!button.getAttribute("data-ready-label")) button.setAttribute("data-ready-label", button.textContent);
    button.textContent = pending ? "Submitting..." : button.getAttribute("data-ready-label");
    button.disabled = !!pending;
  }

  async function submitToBackend(form, record) {
    var endpoint = backendEndpoint(form);
    if (!endpoint) {
      return {
        ok: false,
        disabled: true,
        message: "Online submission is not configured yet. No data was transmitted. Backend configuration is required before BOF can receive this request online."
      };
    }
    var response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(record),
        credentials: "omit"
      });
    } catch (error) {
      return { ok: false, error: "service_unavailable", message: "Public intake is temporarily unavailable. Please try again later." };
    }
    var payload = {};
    try {
      payload = await response.json();
    } catch (error) {
      payload = {};
    }
    if (!response.ok || !payload.ok) {
      return {
        ok: false,
        error: payload.error || "service_unavailable",
        message: payload.message || "Public intake could not be submitted. Please review the fields and try again."
      };
    }
    return payload;
  }

  async function handleSubmit(event) {
    var form = event.target.closest("[data-public-intake-form]");
    if (!form) return;
    event.preventDefault();
    var trap = form.querySelector('input[name="website"]');
    if (trap && trap.value) {
      setStatus(form, "This request could not be reviewed online. Please use a direct BOF contact path.", true);
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus(form, "Please complete the required public-intake fields and privacy acknowledgment before review.", true);
      return;
    }
    var values = valuesFor(form);
    if (!validateSafeText(values)) {
      setStatus(form, "Please remove markup, scripts, links, or protected-record details before this public request can be reviewed.", true);
      return;
    }
    if (String(values.request_summary || "").length > 1500) {
      setStatus(form, "Please shorten the request summary to 1,500 characters or fewer.", true);
      return;
    }
    saveDraft(values);
    form._bofPublicIntakeRecord = buildRecord(form, values);
    submitLabel(form, true);
    setStatus(form, backendEnabled(form) ? "Submitting public intake request..." : "Validating request locally...", false);
    var result = await submitToBackend(form, form._bofPublicIntakeRecord);
    submitLabel(form, false);
    if (!result.ok) {
      setStatus(form, result.message, true);
      return;
    }
    form.reset();
    setStatus(form, "Your request was received. Reference: " + result.reference + ".", false);
  }

  function renderAll() {
    document.querySelectorAll("[data-public-intake]").forEach(renderForm);
  }

  document.addEventListener("submit", handleSubmit);
  document.addEventListener("DOMContentLoaded", renderAll);

  window.BOFPublicIntake = {
    renderAll: renderAll,
    buildRecord: buildRecord,
    backendEnabled: backendEnabled
  };
})();
