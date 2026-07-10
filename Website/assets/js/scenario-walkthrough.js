(function () {
  var root = document.querySelector("[data-assessment-intake]");
  if (!root) return;

  var form = root.querySelector("[data-assessment-form]");
  if (!form) return;

  var summaryEl = root.querySelector("[data-assessment-summary]");
  var statusEl = root.querySelector("[data-assessment-status]");
  var copyButton = root.querySelector("[data-copy-summary]");
  var clearButton = root.querySelector("[data-clear-assessment]");
  var sendButton = root.querySelector("[data-send-assessment]");
  var startedAtInput = root.querySelector("[data-started-at]");
  var percentEl = root.querySelector("[data-assessment-percent]");
  var sectionLabelEl = root.querySelector("[data-assessment-section-label]");
  var progressBarEl = root.querySelector("[data-assessment-progress-bar]");
  var endpointUrl = form.getAttribute("action") || "/scenario-walkthrough/submit.php";

  var checkboxNames = [
    "documentStorage",
    "payTypes",
    "desiredBofHelp",
    "permissionToContact"
  ];

  var fieldLabels = [
    ["company", "Company name"],
    ["name", "Contact name"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["trucks", "Number of trucks"],
    ["drivers", "Number of drivers"],
    ["ownerOperators", "Owner-operators / contractors"],
    ["freightType", "Freight type"],
    ["operatingRegions", "Operating states or regions"],
    ["currentSystems", "Current systems used"],
    ["cdlElectronic", "CDL records stored electronically"],
    ["medicalCardsTracked", "Medical cards tracked electronically"],
    ["dqfCentralized", "DQF files centralized"],
    ["mvrRenewalsTracked", "MVR renewals tracked"],
    ["workerRecordsCentralized", "W-9/I-9 or contractor records centralized"],
    ["trainingRecordsTracked", "Training records tracked"],
    ["documentExpirationsFlagged", "Document expirations automatically flagged"],
    ["driverReadinessDelays", "Driver readiness delays"],
    ["documentStorage", "Document storage"],
    ["documentsTiedToRecords", "Documents tied to drivers, loads, and customers"],
    ["documentVersionsControlled", "Document versions controlled"],
    ["requiredRecordsSearchable", "Required records searchable"],
    ["expiredMissingDocsFlagged", "Expired/missing documents flagged"],
    ["loadsReceived", "How loads are received"],
    ["loadIntakeStructured", "Structured load intake form or portal"],
    ["rateConfirmationsStored", "Rate confirmations stored with load"],
    ["loadInstructionsCentralized", "Load instructions centralized"],
    ["pickupDeliveryPhotosTracked", "Pickup/delivery photos tracked"],
    ["dispatchExceptionsDocumented", "Dispatch exceptions documented"],
    ["customerUpdates", "Customer updates"],
    ["podsCaptured", "How PODs are captured"],
    ["podsTiedToLoad", "PODs tied to load record"],
    ["cargoPhotosCaptured", "Cargo photos captured"],
    ["sealPhotosCaptured", "Seal photos captured"],
    ["lumperReceiptsCaptured", "Lumper receipts captured"],
    ["claimEvidencePacketsCreated", "Claim evidence packets created"],
    ["missingPodsBlockBillingSettlement", "Missing PODs blocking billing or settlement"],
    ["payTypes", "Pay types used"],
    ["settlementsTiedToLoads", "Settlements tied to load records"],
    ["settlementHoldsTracked", "Settlement holds tracked"],
    ["missingDocsDelayPay", "Missing documents delaying driver pay"],
    ["employeeContractorWorkflowsDifferent", "Employee and contractor workflows handled differently"],
    ["usesFactoring", "Uses factoring"],
    ["factoringPacketOwner", "Who prepares factoring packets"],
    ["factoringPacketsChecked", "Factoring packet checks before submission"],
    ["incompletePacketsTracked", "Incomplete packets tracked"],
    ["receivablesTracked", "Receivables tracked"],
    ["cashFlowVisibility", "Cash-flow visibility"],
    ["fundingDelays", "Funding delays"],
    ["writtenPayrollPolicies", "Written payroll policies"],
    ["writtenAccountingProcedures", "Written accounting/bookkeeping procedures"],
    ["writtenOperatingProcedures", "Written operating procedures"],
    ["writtenHrPolicies", "Written HR policies"],
    ["policiesLastUpdated", "Policies last updated"],
    ["workflowsAutomated", "Workflows automated"],
    ["remindersAutomated", "Automated reminders and exceptions"],
    ["policyComplianceReviewer", "Policy compliance reviewer"],
    ["hrTierChoice", "HR Tier Review choice"],
    ["hrRecruiting", "How drivers/workers are recruited"],
    ["hrOnboarding", "How new workers are onboarded"],
    ["hrRecordsCentralized", "Employee/contractor records centralized"],
    ["benefitsTracking", "Benefits tracked internally or externally"],
    ["trainingDevelopmentTracking", "Training and development tracking"],
    ["readinessRenewalMonitoring", "Readiness and renewal monitoring"],
    ["hrOwnerPressure", "HR owner-level pressure"],
    ["financeTierChoice", "Finance Tier Review choice"],
    ["bookkeepingOwner", "Bookkeeping owner"],
    ["accountingOwner", "Accounting owner"],
    ["apArTrackedElectronically", "AP and AR tracked electronically"],
    ["payrollSettlementsDocumented", "Payroll and settlements documented"],
    ["financeUsesFactoring", "Finance factoring use"],
    ["exciseTaxItemsTracked", "Federal/state excise tax review items tracked"],
    ["cashFlowReporting", "Cash-flow reporting"],
    ["financeOwnerPressure", "Finance owner-level pressure"],
    ["biggestProblem", "Biggest current back-office problem"],
    ["monthlyAdminHours", "Estimated monthly admin hours"],
    ["desiredBofHelp", "Areas where BOF help is most desired"],
    ["permissionToContact", "Permission to contact"]
  ];

  var requiredFields = [
    ["company", "company name"],
    ["name", "contact name"],
    ["email", "email"],
    ["biggestProblem", "biggest current back-office problem"]
  ];

  if (startedAtInput) {
    startedAtInput.value = String(Date.now());
  }

  function field(name) {
    var node = form.elements[name];
    if (!node) return "";
    if (node instanceof RadioNodeList) {
      return String(node.value || "").trim();
    }
    return String(node.value || "").trim();
  }

  function checkedValues(name) {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (input) {
      return input.value;
    });
  }

  function isMulti(name) {
    return checkboxNames.indexOf(name) >= 0;
  }

  function getValue(name) {
    if (isMulti(name)) return checkedValues(name);
    return field(name);
  }

  function displayValue(value) {
    if (Array.isArray(value)) return value.length ? value.join(", ") : "Not selected";
    return value || "Not provided";
  }

  function isAnsweredControl(control) {
    if (!control || control.disabled || control.type === "hidden" || control.type === "button" || control.type === "submit") {
      return null;
    }
    if (control.name === "website") return null;
    if (control.type === "checkbox" || control.type === "radio") {
      return form.querySelectorAll('input[name="' + control.name + '"]:checked').length > 0;
    }
    return String(control.value || "").trim() !== "";
  }

  function uniqueNamedControls(section) {
    var seen = {};
    return Array.prototype.slice.call(section.querySelectorAll("input, select, textarea")).filter(function (control) {
      if (!control.name || seen[control.name]) return false;
      seen[control.name] = true;
      return isAnsweredControl(control) !== null;
    });
  }

  function optionalSkipped(kind) {
    var choice = kind === "hr" ? field("hrTierChoice") : field("financeTierChoice");
    return choice.toLowerCase().indexOf("skip") === 0;
  }

  function updateOptionalSections() {
    var hr = root.querySelector('[data-optional-section="hr"]');
    var finance = root.querySelector('[data-optional-section="finance"]');
    if (hr) hr.hidden = optionalSkipped("hr");
    if (finance) finance.hidden = optionalSkipped("finance");
  }

  function activeSections() {
    return Array.prototype.slice.call(root.querySelectorAll("[data-assessment-section]")).filter(function (section) {
      var title = String(section.dataset.sectionTitle || "").toLowerCase();
      if (title.indexOf("optional hr") >= 0) return !optionalSkipped("hr");
      if (title.indexOf("optional finance") >= 0) return !optionalSkipped("finance");
      return true;
    });
  }

  function sectionCompletion(section) {
    var controls = uniqueNamedControls(section);
    if (!controls.length) return { total: 0, answered: 0 };
    var answered = controls.filter(function (control) {
      return isAnsweredControl(control) === true;
    }).length;
    return { total: controls.length, answered: answered };
  }

  function updateProgress() {
    updateOptionalSections();
    var sections = activeSections();
    var total = 0;
    var answered = 0;
    var currentIndex = sections.length ? sections.length - 1 : 0;
    var currentTitle = sections.length ? sections[sections.length - 1].dataset.sectionTitle : "Fleet Profile";

    sections.forEach(function (section, index) {
      var completion = sectionCompletion(section);
      total += completion.total;
      answered += completion.answered;
      if (completion.total && completion.answered < completion.total && currentIndex === sections.length - 1) {
        currentIndex = index;
        currentTitle = section.dataset.sectionTitle || currentTitle;
      }
    });

    var percent = total ? Math.round((answered / total) * 100) : 0;
    if (percentEl) percentEl.textContent = "Assessment Progress: " + percent + "%";
    if (sectionLabelEl) sectionLabelEl.textContent = "Section " + (currentIndex + 1) + " of " + sections.length + ": " + currentTitle;
    if (progressBarEl) progressBarEl.style.width = percent + "%";
  }

  function getSummaryText() {
    var lines = [
      "BOF Fleet Assessment",
      "",
      "This assessment is advisory intake only. BOF reviews the submitted records, workflows, access realities, and operating complexity before recommending next steps.",
      ""
    ];
    fieldLabels.forEach(function (item) {
      lines.push(item[1] + ": " + displayValue(getValue(item[0])));
    });
    lines.push("");
    lines.push("Assessment focus: driver records, document workflows, load intake, POD process, settlements, factoring readiness, operating policies, HR workflows, finance workflows, and automation.");
    lines.push("Pricing/timeline note: This form does not guarantee final pricing, implementation scope, or implementation timing.");
    return lines.join("\n");
  }

  function getPayload() {
    var payload = {};
    fieldLabels.forEach(function (item) {
      payload[item[0]] = getValue(item[0]);
    });
    payload.assessmentSummary = getSummaryText();
    payload.website = field("website");
    payload.startedAt = field("startedAt");
    payload.assessmentRoute = "/scenario-walkthrough/";
    payload.assessmentName = "BOF Fleet Assessment";
    return payload;
  }

  function renderSummary() {
    if (!summaryEl) return;
    var highlight = [
      ["company", "Company"],
      ["name", "Contact"],
      ["email", "Email"],
      ["trucks", "Trucks"],
      ["drivers", "Drivers"],
      ["ownerOperators", "Owner-operators / contractors"],
      ["documentStorage", "Document storage"],
      ["payTypes", "Pay types"],
      ["usesFactoring", "Factoring"],
      ["hrTierChoice", "HR review"],
      ["financeTierChoice", "Finance review"],
      ["biggestProblem", "Biggest problem"],
      ["desiredBofHelp", "Desired BOF help"],
      ["permissionToContact", "Permission"]
    ];
    summaryEl.innerHTML = highlight.map(function (item) {
      return '<div class="assessment-summary-row"><span>' + escapeHtml(item[1]) + '</span><strong>' + escapeHtml(displayValue(getValue(item[0]))) + "</strong></div>";
    }).join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.dataset.statusType = type || "neutral";
  }

  function getMissingRequired() {
    return requiredFields.filter(function (item) {
      return !field(item[0]);
    }).map(function (item) {
      return item[1];
    });
  }

  function validateRequired() {
    var missing = getMissingRequired();
    if (missing.length) {
      setStatus("Please complete " + missing.join(", ") + " before submitting the BOF Fleet Assessment.", "warning");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field("email"))) {
      setStatus("Please enter a valid email address before submitting the BOF Fleet Assessment.", "warning");
      return false;
    }
    return true;
  }

  function copySummary() {
    var text = getSummaryText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus("Assessment summary copied.", "success");
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setStatus("Assessment summary copied.", "success");
    } catch (error) {
      setStatus("Copy did not complete. Select the summary text and copy it manually.", "warning");
    }
    document.body.removeChild(textarea);
  }

  function setSending(isSending) {
    if (!sendButton) return;
    sendButton.disabled = !!isSending;
    sendButton.textContent = isSending ? "Submitting Assessment..." : "Submit BOF Fleet Assessment";
  }

  function sendAssessment() {
    if (!validateRequired()) return;
    setSending(true);
    setStatus("Submitting BOF Fleet Assessment...", "neutral");

    fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(getPayload()),
      credentials: "same-origin"
    }).then(function (response) {
      return response.text().then(function (text) {
        var data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (error) {
          data = { ok: false, message: "BOF could not read the server response. Please try again or email demo@backofficefleet.com." };
        }
        if (!response.ok || !data.ok) {
          throw new Error(data.message || "BOF could not submit the assessment. Please try again.");
        }
        return data;
      });
    }).then(function (data) {
      setStatus(data.message || "Your BOF Fleet Assessment has been submitted.", "success");
    }).catch(function (error) {
      setStatus(error.message || "BOF could not submit the assessment. Your answers are still here; please try again.", "error");
    }).finally(function () {
      setSending(false);
    });
  }

  function clearForm() {
    form.reset();
    if (startedAtInput) startedAtInput.value = String(Date.now());
    updateOptionalSections();
    updateProgress();
    renderSummary();
    setStatus("Form cleared. Add your fleet back-office details when you are ready.", "neutral");
  }

  function refresh() {
    updateOptionalSections();
    updateProgress();
    renderSummary();
  }

  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    sendAssessment();
  });
  if (copyButton) copyButton.addEventListener("click", copySummary);
  if (clearButton) clearButton.addEventListener("click", clearForm);
  if (sendButton) sendButton.addEventListener("click", sendAssessment);

  refresh();
})();
