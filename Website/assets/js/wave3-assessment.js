(function () {
  var root = document.querySelector("[data-wave3-assessment] [data-assessment-root]");
  if (!root) return;

  var responseOptions = [
    { value: "in-place", label: "In place", score: 3 },
    { value: "partial", label: "Partially in place", score: 2 },
    { value: "not-in-place", label: "Not in place", score: 0 },
    { value: "unsure", label: "Unsure", score: 1 }
  ];

  var audiences = {
    "aggregator": {
      title: "Aggregator",
      shortTitle: "Aggregator",
      eyebrow: "Network readiness",
      route: "/aggregators/",
      cta: "Request a Network Readiness Assessment",
      learn: "Learn about Aggregators",
      choose: "Choose Aggregator Assessment",
      image: "/assets/images/photos/site-pass/08-carrier-readiness-counter.webp",
      alt: "Carrier network readiness team reviewing operating records",
      description: "Carrier networks, associations, freight aggregators, and organizations coordinating multiple operating entities.",
      categories: ["Network readiness", "Carrier governance", "Proof consistency", "Exception control", "Business operations"],
      modules: ["Business Operations", "BOF Vault", "Documents", "Policy Governance"],
      sections: [
        { name: "Network structure", questions: [
          ["network-roster", "Can your team see all carriers or operating units in one current network roster?"],
          ["carrier-onboarding", "Is carrier onboarding tied to required documents, authority checks, owners, and release criteria?"],
          ["network-reporting", "Can leadership view consolidated readiness and exception reporting without manually combining spreadsheets?"]
        ]},
        { name: "Carrier readiness", questions: [
          ["carrier-authority", "Are authority, insurance, and key carrier packet records verified before network use?"],
          ["driver-asset-readiness", "Can your network see driver and asset readiness before shared capacity is offered?"],
          ["subcontractor-records", "Are subcontractor or operating-unit records standardized and assigned to accountable owners?"]
        ]},
        { name: "Shared capacity", questions: [
          ["shared-load-visibility", "Can teams distinguish available capacity from operationally usable capacity?"],
          ["partner-controls", "Are vendor, partner, or carrier controls visible before a participating entity is assigned?"],
          ["capacity-constraints", "Are customer-specific constraints visible before capacity is committed?"]
        ]},
        { name: "Proof and administrative exceptions", questions: [
          ["proof-standards", "Are standard proof requirements documented across carriers and customer programs?"],
          ["admin-exceptions", "Do network-level administrative exceptions have owners, due dates, and customer impact notes?"],
          ["audit-history", "Is there a retained history of readiness reviews, changes, and exception outcomes?"]
        ]}
      ]
    },
    "private-fleet": {
      title: "Private Fleet",
      shortTitle: "Private Fleet",
      eyebrow: "Internal operating readiness",
      route: "/private-fleets/",
      cta: "Schedule a Private Fleet Operations Review",
      learn: "Learn about Private Fleets",
      choose: "Choose Private Fleet Assessment",
      image: "/assets/images/photos/fleet-office-record-review.webp",
      alt: "Private fleet office team reviewing records with trucks visible outside",
      description: "Companies operating trucks primarily to support their own business, customers, facilities, stores, or distribution network.",
      categories: ["Workforce readiness", "Operational control", "Fleet safety", "Business operations", "Executive visibility"],
      modules: ["Drivers", "Dispatch & Operations", "Safety & Compliance", "Business Operations"],
      sections: [
        { name: "Workforce and driver readiness", questions: [
          ["driver-credentials", "Are driver credentials, medical cards, and readiness records current before assignment?"],
          ["hr-onboarding", "Is HR onboarding tied to required documents, training, policy acknowledgments, and first assignment release?"],
          ["assignment-readiness", "Can dispatch see whether a driver is ready for a specific internal route or service task?"]
        ]},
        { name: "Dispatch and service execution", questions: [
          ["service-failures", "Are missed service commitments tracked with reason, owner, and follow-up path?"],
          ["facility-commitments", "Can teams connect route decisions to facility, branch, store, or customer commitments?"],
          ["dispatch-handoffs", "Are dispatch handoffs documented when work moves between shifts or locations?"]
        ]},
        { name: "Safety and maintenance", questions: [
          ["maintenance-readiness", "Can operations see unit maintenance state before assigning a truck?"],
          ["inspection-proof", "Are inspections, DVIR issues, and return-to-service records easy to retrieve?"],
          ["insurance-records", "Are insurance, incident, and safety exception records tied to the operating record they affect?"]
        ]},
        { name: "Business operations and leadership", questions: [
          ["payroll-exceptions", "Are payroll, reimbursement, or time exceptions connected to the work record that caused them?"],
          ["accounting-controls", "Are accounting controls, vendor records, and internal approvals assigned to owners and review dates?"],
          ["executive-reporting", "Can leadership see internal service, readiness, and control gaps without manual status chasing?"]
        ]}
      ]
    },
    "for-hire-fleet": {
      title: "For-Hire Fleet",
      shortTitle: "For-Hire Fleet",
      eyebrow: "Carrier readiness",
      route: "/for-hire-fleets/",
      cta: "Request a For-Hire Fleet Readiness Review",
      learn: "Learn about For-Hire Fleets",
      choose: "Choose For-Hire Fleet Assessment",
      image: "/assets/images/photos/site-pass/10-carrier-yard-route-packet.webp",
      alt: "For-hire carrier route packet review with trucks in the yard",
      description: "Motor carriers hauling freight for customers under contracts, tenders, rate confirmations, or load agreements.",
      categories: ["Dispatch readiness", "Proof quality", "Billing readiness", "Claims exposure", "Settlement control"],
      modules: ["Dispatch & Operations", "Documents", "Settlements & Billing", "Business Operations"],
      sections: [
        { name: "Customer and load intake", questions: [
          ["rate-confirmation", "Are rate confirmations and customer documentation requirements captured before dispatch release?"],
          ["customer-updates", "Can the office see customer update requirements for each active load?"],
          ["load-history", "Can staff access load history, customer notes, and operating context from one record?"]
        ]},
        { name: "Dispatch execution", questions: [
          ["dispatch-assignment", "Are driver, unit, route, and readiness checks visible before assignment?"],
          ["exception-handling", "Do delivery exceptions create owner, reason, and customer-impact follow-up?"],
          ["driver-readiness", "Can dispatch see driver readiness status without waiting on another department?"]
        ]},
        { name: "Proof, claims, and financial records", questions: [
          ["bol-pod", "Are BOL and POD capture requirements clear before billing depends on them?"],
          ["detention-lumper", "Are detention, lumper, accessorial, and appointment proofs preserved with the load?"],
          ["claims-financial-records", "Can claims evidence, incident notes, and related financial records be found without rebuilding the packet?"]
        ]},
        { name: "Settlements and billing", questions: [
          ["factoring-packets", "Are factoring or billing packet blockers visible before invoice release?"],
          ["settlement-holds", "Are settlement holds tied to load proof, deductions, approvals, and accounting exceptions?"],
          ["driver-pay", "Can driver pay questions be traced back to load, proof, and settlement evidence?"]
        ]}
      ]
    },
    "government": {
      title: "Government Fleet or Agency",
      shortTitle: "Government",
      eyebrow: "Preparedness and public accountability",
      route: "/government/",
      cta: "Request a Fleet Preparedness Consultation",
      learn: "Learn about Government Readiness",
      choose: "Choose Government Fleet Assessment",
      image: "/assets/images/photos/site-pass/13-government-contract-record-review.webp",
      alt: "Government fleet record review with public works documentation",
      description: "Municipal, county, state, public authority, emergency-management, public-works, and government fleet organizations.",
      categories: ["Preparedness", "Procurement readiness", "Emergency coordination", "Policy governance", "Auditability"],
      modules: ["Policy Governance", "BOF Vault", "Business Operations", "Safety & Compliance"],
      sections: [
        { name: "Fleet preparedness", questions: [
          ["asset-inventory", "Is the fleet asset inventory current and tied to readiness status?"],
          ["equipment-readiness", "Can teams see which equipment is ready, review-needed, or unavailable?"],
          ["operator-credentials", "Are operator credentials and training status connected to assignment decisions?"]
        ]},
        { name: "Procurement, budget, and vendor readiness", questions: [
          ["vendor-records", "Are vendor, contract, COI, and procurement records current and assigned to owners?"],
          ["budget-controls", "Are budget controls and purchase approvals connected to fleet readiness decisions?"],
          ["grant-documentation", "Are grant, funding, and purchase records retained with review history where applicable?"]
        ]},
        { name: "Emergency response", questions: [
          ["emergency-resources", "Can authorized staff view emergency-ready resources quickly?"],
          ["mutual-aid", "Are mutual-aid or shared-resource requirements documented and reviewable?"],
          ["incident-documentation", "Are incident response notes, evidence, and follow-up actions retained?"]
        ]},
        { name: "Policy, records, and audit controls", questions: [
          ["policy-approvals", "Are policy versions, approvals, acknowledgments, training status, and exceptions controlled?"],
          ["public-records", "Can public-record-ready documents be located without recreating history?"],
          ["audit-trails", "Are audit trails and continuity plans tied to owners, readiness evidence, and review rhythm?"]
        ]}
      ]
    },
    "driver": {
      title: "Individual Driver",
      shortTitle: "Driver",
      eyebrow: "Driver readiness",
      route: "/drivers/",
      cta: "Start a Driver Readiness Check",
      learn: "Learn about Driver Support",
      choose: "Choose Driver Assessment",
      image: "/assets/images/design-system-2/wave-1/ds2-drivers-hero-clean.png",
      alt: "Commercial driver using a mobile readiness workflow near a truck",
      description: "Drivers managing CDL readiness, document uploads, credential expirations, current requests, and assignment readiness.",
      categories: ["Credential readiness", "Document readiness", "Renewal risk", "Assignment readiness"],
      modules: ["Drivers", "BOF Vault", "Documents", "Safety & Compliance"],
      secondaryCta: { label: "Explore BOF Vault", href: "/customer-demo/?portal=vault&view=document-intake" },
      sections: [
        { name: "Credential readiness", questions: [
          ["cdl", "Is your CDL current and easy to provide when requested?"],
          ["medical-card", "Is your medical card current and tracked before expiration?"],
          ["mvr", "Do you know whether your MVR or safety review is current for assignment?"]
        ]},
        { name: "Document readiness", questions: [
          ["employment-records", "Are employment records, tax forms, and required documents complete?"],
          ["upload-access", "Do you have a clear way to upload requested documents from your phone or tablet?"],
          ["missing-documents", "Can you see which documents are missing, pending review, or accepted?"]
        ]},
        { name: "Employment readiness", questions: [
          ["current-requests", "Are current document or HR requests visible with a next action?"],
          ["renewal-reminders", "Do you receive renewal reminders before credentials block assignment?"],
          ["support-context", "Can support staff see the document or readiness question without asking you to repeat it?"]
        ]},
        { name: "Assignment readiness", questions: [
          ["assignment-status", "Can you tell whether you are ready for assignment today?"],
          ["vault-access", "Can you access your BOF Vault or document intake path when proof is needed?"],
          ["clearance-path", "When you are blocked, is the clearance path specific and understandable?"]
        ]}
      ]
    }
  };

  var order = ["aggregator", "private-fleet", "for-hire-fleet", "government", "driver"];
  var answers = {};
  var state = { type: getTypeFromUrl(), step: getTypeFromUrl() ? "questions" : "landing", index: 0 };
  order.forEach(function (key) { answers[key] = {}; });

  function getTypeFromUrl() {
    var type = new URLSearchParams(window.location.search).get("type");
    return audiences[type] ? type : "";
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function focusSelectedAssessment() {
    var target = document.getElementById("selected-assessment-heading");
    if (!target) return;
    target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    target.focus({ preventScroll: true });
  }

  function setType(type, push, focus) {
    if (!audiences[type]) type = "";
    state.type = type;
    state.step = type ? "questions" : "landing";
    state.index = 0;
    if (push) {
      var url = type ? "/assessment/?type=" + encodeURIComponent(type) : "/assessment/";
      history.pushState({ type: type }, "", url);
    }
    render();
    if (focus && type) window.setTimeout(focusSelectedAssessment, 40);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }

  function questionList(audience) {
    var list = [];
    audience.sections.forEach(function (section, sectionIndex) {
      section.questions.forEach(function (question) {
        list.push({ id: question[0], text: question[1], section: section.name, sectionIndex: sectionIndex });
      });
    });
    return list;
  }

  function answerLabel(value) {
    var found = responseOptions.find(function (item) { return item.value === value; });
    return found ? found.label : "Not answered";
  }

  function scoreValue(value) {
    var found = responseOptions.find(function (item) { return item.value === value; });
    return found ? found.score : 0;
  }

  function completion(type) {
    var list = questionList(audiences[type]);
    var count = list.filter(function (q) { return answers[type][q.id]; }).length;
    return { answered: count, total: list.length, pct: Math.round((count / list.length) * 100) };
  }

  function renderAudienceCards() {
    return [
      '<div class="wave3-assessment-card-grid" aria-label="Choose the fleet profile that best matches your operation">',
      order.map(function (key) {
        var audience = audiences[key];
        var isSelected = key === state.type;
        return '<article class="wave3-assessment-card' + (isSelected ? " is-selected" : "") + '" data-select-audience="' + key + '" role="button" tabindex="0" aria-pressed="' + (isSelected ? "true" : "false") + '">' +
          '<div class="wave3-assessment-card__media"><img src="' + audience.image + '" alt="' + escapeHtml(audience.alt) + '"></div>' +
          '<div class="wave3-audience-card__body">' +
          '<span>' + escapeHtml(audience.eyebrow) + '</span>' +
          '<h3>' + escapeHtml(audience.title) + '</h3>' +
          '<p>' + escapeHtml(audience.description) + '</p>' +
          '<div class="wave3-card-actions">' +
            '<button type="button" data-select-audience="' + key + '">' + (isSelected ? "Selected" : escapeHtml(audience.choose)) + '</button>' +
            '<a href="' + audience.route + '">' + escapeHtml(audience.learn) + '</a>' +
          '</div>' +
          (isSelected ? '<strong class="wave3-selected-badge" aria-label="Selected audience">Selected</strong>' : "") +
          '</div></article>';
      }).join(""),
      '</div>'
    ].join("");
  }

  function renderEmptyState() {
    return '<section class="wave3-assessment-ready" aria-label="Assessment start guidance">' +
      '<p class="wave3-eyebrow">Choose your fleet profile</p>' +
      '<h3>Your assessment will appear directly below these cards.</h3>' +
      '<p>Select the operation that looks most like yours. You will answer 12 practical readiness questions and see a preliminary roadmap before BOF asks for any follow-up.</p>' +
      '</section>';
  }

  function renderAssessment() {
    var audience = audiences[state.type];
    var list = questionList(audience);
    var current = list[state.index];
    var section = audience.sections[current.sectionIndex];
    var complete = completion(state.type);
    var sectionQuestionNumber = section.questions.findIndex(function (q) { return q[0] === current.id; }) + 1;
    root.innerHTML = [
      renderAudienceCards(),
      '<section class="wave3-assessment-shell" id="selected-assessment" aria-labelledby="selected-assessment-heading">',
        '<div class="wave3-assessment-intro">',
          '<p class="wave3-eyebrow">' + escapeHtml(audience.eyebrow) + '</p>',
          '<h3 id="selected-assessment-heading" tabindex="-1">' + escapeHtml(audience.title) + ' Readiness Assessment</h3>',
          '<p><strong>Selected audience:</strong> ' + escapeHtml(audience.title) + '. Answers stay in browser memory during this page session while you compare profiles.</p>',
        '</div>',
        '<div class="wave3-assessment-stage wave3-assessment-stage--single">',
          '<div>',
            '<div class="wave3-progress" aria-live="polite">',
              '<div class="wave3-progress__copy">',
                '<strong>' + escapeHtml(audience.title) + ' Readiness Assessment</strong>',
                '<span>Question ' + (state.index + 1) + ' of ' + list.length + '</span>',
                '<span>' + escapeHtml(section.name) + ' - Section ' + (current.sectionIndex + 1) + ' of ' + audience.sections.length + '</span>',
                '<span>' + complete.pct + '% complete</span>',
              '</div>',
              '<div class="wave3-progress-bar" role="progressbar" aria-label="Assessment completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + complete.pct + '"><span style="width:' + complete.pct + '%"></span></div>',
            '</div>',
            '<form class="wave3-question-card" data-question-form>',
              '<fieldset>',
                '<legend>' + escapeHtml(current.text) + '</legend>',
                '<p id="question-help">' + escapeHtml(section.name) + ', question ' + sectionQuestionNumber + '.</p>',
                '<div class="wave3-option-list">',
                  responseOptions.map(function (option) {
                    var id = "q-" + current.id + "-" + option.value;
                    var checked = answers[state.type][current.id] === option.value ? " checked" : "";
                    return '<label for="' + id + '"><input id="' + id + '" type="radio" name="answer" value="' + option.value + '"' + checked + ' aria-describedby="question-help"> ' + escapeHtml(option.label) + '</label>';
                  }).join(""),
                '</div>',
              '</fieldset>',
              '<div class="wave3-question-actions">',
                '<button class="wave3-button wave3-button--secondary" type="button" data-prev-question' + (state.index === 0 ? " disabled" : "") + '>Previous</button>',
                '<button class="wave3-button wave3-button--ghost" type="button" data-review-answers>Review Answers</button>',
                '<button class="wave3-button wave3-button--primary" type="button" data-next-question>' + (state.index === list.length - 1 ? "Review Answers" : "Next") + '</button>',
              '</div>',
            '</form>',
          '</div>',
        '</div>',
      '</section>'
    ].join("");
  }

  function renderLanding() {
    root.innerHTML = renderAudienceCards() + renderEmptyState();
  }

  function renderReview() {
    var audience = audiences[state.type];
    var list = questionList(audience);
    root.innerHTML = [
      renderAudienceCards(),
      '<section class="wave3-assessment-shell" id="selected-assessment" aria-labelledby="selected-assessment-heading">',
        '<div class="wave3-question-card wave3-question-card--review">',
          '<p class="wave3-eyebrow">Review answers</p>',
          '<h3 id="selected-assessment-heading" tabindex="-1">' + escapeHtml(audience.title) + ' Readiness Assessment</h3>',
          '<ul class="wave3-review-list">',
            list.map(function (q) { return '<li><strong>' + escapeHtml(q.text) + '</strong><span>' + escapeHtml(answerLabel(answers[state.type][q.id])) + '</span></li>'; }).join(""),
          '</ul>',
          '<div class="wave3-question-actions"><button class="wave3-button wave3-button--secondary" type="button" data-back-to-questions>Back to Questions</button><button class="wave3-button wave3-button--primary" type="button" data-calculate-results>See My Readiness Result</button></div>',
        '</div>',
      '</section>'
    ].join("");
  }

  function calculate(type) {
    var audience = audiences[type];
    var list = questionList(audience);
    var total = list.reduce(function (sum, q) { return sum + scoreValue(answers[type][q.id]); }, 0);
    var max = list.length * 3;
    var pct = Math.round((total / max) * 100);
    var band = pct >= 78 ? "Strong foundation" : pct >= 56 ? "Partially controlled" : pct >= 34 ? "Significant gaps" : "Immediate attention recommended";
    var gaps = list.filter(function (q) { return !answers[type][q.id] || answers[type][q.id] === "not-in-place" || answers[type][q.id] === "unsure"; }).slice(0, 3);
    if (!gaps.length) gaps = list.filter(function (q) { return answers[type][q.id] === "partial"; }).slice(0, 3);
    var sectionScores = audience.sections.map(function (section) {
      var qs = section.questions;
      var sectionTotal = qs.reduce(function (sum, q) { return sum + scoreValue(answers[type][q[0]]); }, 0);
      return { name: section.name, pct: Math.round((sectionTotal / (qs.length * 3)) * 100) };
    });
    var strongest = sectionScores.slice().sort(function (a, b) { return b.pct - a.pct; })[0];
    return { pct: pct, band: band, gaps: gaps, sections: sectionScores, strongest: strongest };
  }

  function priorityFleetCta(type) {
    return ["private-fleet", "for-hire-fleet", "aggregator"].indexOf(type) !== -1;
  }

  function renderResults() {
    var audience = audiences[state.type];
    var result = calculate(state.type);
    root.innerHTML = [
      renderAudienceCards(),
      '<section class="wave3-assessment-shell" id="selected-assessment" aria-labelledby="selected-assessment-heading">',
        '<div class="wave3-question-card wave3-question-card--result" aria-live="polite">',
          '<p class="wave3-eyebrow">Preliminary readiness result</p>',
          '<h3 id="selected-assessment-heading" tabindex="-1">' + escapeHtml(result.band) + '</h3>',
          '<p>Overall readiness indicator: ' + result.pct + '%. This is a directional result based only on the answers entered in this browser session.</p>',
          '<div class="wave3-result-highlight"><span>Strongest area</span><strong>' + escapeHtml(result.strongest.name) + '</strong><p>' + result.strongest.pct + '% section readiness indicator.</p></div>',
          '<h3>Top operational gaps</h3>',
          '<ul class="wave3-review-list">' + result.gaps.map(function (gap) { return '<li><strong>' + escapeHtml(gap.section) + '</strong><span>' + escapeHtml(gap.text) + '</span></li>'; }).join("") + '</ul>',
          '<h3>Section-level summary</h3>',
          '<div class="wave3-results-grid">',
            result.sections.map(function (section) { return '<article class="wave3-result-card"><span>' + section.pct + '%</span><h3>' + escapeHtml(section.name) + '</h3><p>Section readiness indicator.</p></article>'; }).join(""),
          '</div>',
          '<h3>Recommended BOF modules or workflows</h3>',
          '<div class="wave3-card-actions wave3-module-list">' + audience.modules.map(function (module) { return '<span>' + escapeHtml(module) + '</span>'; }).join("") + '</div>',
          '<div class="wave3-conversion-panel">',
            '<p class="wave3-eyebrow">Next step</p>',
            '<h3>Get your detailed BOF readiness roadmap.</h3>',
            '<p>Use this preliminary result to request a working review with BOF. Online report delivery is not connected on this page, and no information is sent from this form.</p>',
            '<div class="wave3-actions">',
              '<button class="wave3-button wave3-button--primary" type="button" data-roadmap-request>Send Me My Detailed Readiness Report</button>',
              '<a class="wave3-button wave3-button--secondary" href="' + audience.route + '">' + escapeHtml(audience.cta) + '</a>',
              (priorityFleetCta(state.type) ? '<a class="wave3-button wave3-button--secondary" href="/priority-fleet-program/">Apply for Priority Fleet Consideration</a>' : ''),
              (audience.secondaryCta ? '<a class="wave3-button wave3-button--secondary" href="' + audience.secondaryCta.href + '">' + escapeHtml(audience.secondaryCta.label) + '</a>' : ''),
            '</div>',
            '<p class="wave3-form-note" data-roadmap-note tabindex="-1" hidden>Detailed roadmap requests are handled through a BOF readiness review. This page does not transmit personal data.</p>',
          '</div>',
          '<p class="wave3-disclaimer">This assessment is an operational readiness tool and is not legal, regulatory, tax, accounting, insurance, or compliance certification.</p>',
          '<div class="wave3-question-actions"><button class="wave3-button wave3-button--secondary" type="button" data-reset-audience>Restart Assessment</button></div>',
        '</div>',
      '</section>'
    ].join("");
  }

  function render() {
    if (!state.type) renderLanding();
    else if (state.step === "review") renderReview();
    else if (state.step === "results") renderResults();
    else renderAssessment();
  }

  root.addEventListener("change", function (event) {
    if (event.target && event.target.name === "answer" && state.type) {
      var list = questionList(audiences[state.type]);
      answers[state.type][list[state.index].id] = event.target.value;
    }
  });

  root.addEventListener("keydown", function (event) {
    var card = event.target.closest(".wave3-assessment-card[data-select-audience]");
    if (!card || (event.key !== "Enter" && event.key !== " ")) return;
    if (event.target.closest("a,button,input")) return;
    event.preventDefault();
    setType(card.getAttribute("data-select-audience"), true, true);
  });

  root.addEventListener("click", function (event) {
    if (event.target.closest("a[href]")) return;
    var select = event.target.closest("[data-select-audience]");
    if (select) {
      setType(select.getAttribute("data-select-audience"), true, true);
      return;
    }
    if (event.target.closest("[data-prev-question]")) {
      state.index = Math.max(0, state.index - 1);
      render();
      focusSelectedAssessment();
      return;
    }
    if (event.target.closest("[data-next-question]")) {
      var list = questionList(audiences[state.type]);
      if (state.index < list.length - 1) {
        state.index += 1;
        render();
      } else {
        state.step = "review";
        render();
      }
      focusSelectedAssessment();
      return;
    }
    if (event.target.closest("[data-review-answers]")) {
      state.step = "review";
      render();
      focusSelectedAssessment();
      return;
    }
    if (event.target.closest("[data-back-to-questions]")) {
      state.step = "questions";
      render();
      focusSelectedAssessment();
      return;
    }
    if (event.target.closest("[data-calculate-results]")) {
      state.step = "results";
      render();
      focusSelectedAssessment();
      return;
    }
    if (event.target.closest("[data-reset-audience]")) {
      answers[state.type] = {};
      state.step = "questions";
      state.index = 0;
      render();
      focusSelectedAssessment();
      return;
    }
    if (event.target.closest("[data-roadmap-request]")) {
      var note = root.querySelector("[data-roadmap-note]");
      if (note) {
        note.hidden = false;
        note.focus && note.focus();
      }
    }
  });

  window.addEventListener("popstate", function () {
    state.type = getTypeFromUrl();
    state.step = state.type ? "questions" : "landing";
    state.index = 0;
    render();
  });

  render();
})();
