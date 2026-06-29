(function () {
  var root = document.querySelector("[data-scenario-intake]");
  if (!root) return;

  var form = root.querySelector("[data-scenario-form]");
  var summaryEl = root.querySelector("[data-scenario-summary]");
  var recommendedEl = root.querySelector("[data-recommended-paths]");
  var statusEl = root.querySelector("[data-scenario-status]");
  var copyButton = root.querySelector("[data-copy-summary]");
  var clearButton = root.querySelector("[data-clear-scenario]");
  var sendButton = root.querySelector("[data-send-scenario]");
  var startedAtInput = root.querySelector("[data-started-at]");
  var endpointUrl = form ? form.getAttribute("action") : "/scenario-walkthrough/submit.php";

  if (startedAtInput) {
    startedAtInput.value = String(Date.now());
  }

  var pathSets = {
    aggregator: [
      ["Aggregator Command Center", "/aggregator-command-center/"],
      ["Aggregator Animated Demo", "/animated-demo-aggregator/"],
      ["Capacity Intelligence", "/capacity-intelligence/"],
      ["Carrier Readiness", "/carrier-readiness/"],
      ["Operational Intelligence", "/operational-intelligence/"],
      ["Business Operations", "/business-operations/"]
    ],
    fleet: [
      ["Operations Animated Demo", "/animated-demo/"],
      ["Capacity Intelligence", "/capacity-intelligence/"],
      ["Operational Intelligence", "/operational-intelligence/"],
      ["Settlements", "/settlements/"],
      ["Documents", "/documents/"]
    ],
    business: [
      ["Business Operations", "/business-operations/"],
      ["Animated Business Demo", "/animated-demo-business/"],
      ["Settlements", "/settlements/"],
      ["Trust Governance", "/trust-governance/"]
    ],
    customer: [
      ["Customer Load Intake", "/customer-portal/load-intake/"],
      ["Customer Portal", "/customer-portal/"],
      ["Operations Animated Demo", "/animated-demo/"],
      ["Documents", "/documents/"]
    ]
  };

  function field(name) {
    var node = form.elements[name];
    return node ? String(node.value || "").trim() : "";
  }

  function checkedValues(name) {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (input) {
      return input.value;
    });
  }

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.dataset.statusType = type || "neutral";
  }

  function getPathKey() {
    var organizationType = field("organizationType").toLowerCase();
    var preferredPath = field("preferredDemoPath").toLowerCase();
    var categories = checkedValues("scenarioCategory").join(" ").toLowerCase();

    if (
      organizationType.indexOf("aggregator") >= 0 ||
      organizationType.indexOf("carrier network") >= 0 ||
      organizationType.indexOf("owner-operator") >= 0 ||
      preferredPath.indexOf("aggregator") >= 0
    ) {
      return "aggregator";
    }

    if (
      preferredPath.indexOf("business") >= 0 ||
      categories.indexOf("payroll") >= 0 ||
      categories.indexOf("insurance") >= 0 ||
      categories.indexOf("factoring") >= 0
    ) {
      return "business";
    }

    if (preferredPath.indexOf("customer") >= 0 || categories.indexOf("customer load intake") >= 0) {
      return "customer";
    }

    return "fleet";
  }

  function getPathLabel(key) {
    if (key === "aggregator") return "Aggregator / Carrier Network";
    if (key === "business") return "Business Operations";
    if (key === "customer") return "Customer Load Intake";
    return "Operations Lifecycle";
  }

  function getSizeLine() {
    var trucks = field("trucks") || "Not provided";
    var drivers = field("drivers") || "Not provided";
    var carriers = field("participatingCarriers") || "Not applicable";
    return trucks + " trucks / " + drivers + " drivers / " + carriers + " participating carriers or fleets";
  }

  function getSummaryText() {
    var categories = checkedValues("scenarioCategory");
    var pathKey = getPathKey();
    return [
      "BOF BOF Assessment Request",
      "",
      "Prospect name: " + (field("name") || "Not provided"),
      "Company: " + (field("company") || "Not provided"),
      "Contact email: " + (field("email") || "Not provided"),
      "Phone: " + (field("phone") || "Not provided"),
      "Organization type: " + (field("organizationType") || "Not provided"),
      "Size: " + getSizeLine(),
      "Assessment focus: " + (categories.length ? categories.join(", ") : "Not selected"),
      "Assessment description: " + (field("scenarioDescription") || "Not provided"),
      "Current process: " + (field("currentProcess") || "Not provided"),
      "Urgency: " + (field("urgency") || "Not provided"),
      "Preferred demo path: " + (field("preferredDemoPath") || "Not provided"),
      "Recommended BOF demo path: " + getPathLabel(pathKey),
      "",
      "Requested next step: BOF should use this assessment request to review how the workflow would be handled."
    ].join("\n");
  }

  function getPayload() {
    var pathKey = getPathKey();
    return {
      name: field("name"),
      company: field("company"),
      email: field("email"),
      phone: field("phone"),
      organizationType: field("organizationType"),
      trucks: field("trucks"),
      drivers: field("drivers"),
      participatingCarriers: field("participatingCarriers"),
      scenarioCategory: checkedValues("scenarioCategory"),
      scenarioDescription: field("scenarioDescription"),
      currentProcess: field("currentProcess"),
      urgency: field("urgency"),
      preferredDemoPath: field("preferredDemoPath"),
      recommendedDemoPath: getPathLabel(pathKey),
      scenarioSummary: getSummaryText(),
      website: field("website"),
      startedAt: field("startedAt")
    };
  }

  function renderSummary() {
    if (!summaryEl) return;
    var categories = checkedValues("scenarioCategory");
    var pathKey = getPathKey();
    var sizeLine = getSizeLine();
    summaryEl.innerHTML = [
      '<div class="scenario-summary-row"><span>Prospect name</span><strong>' + escapeHtml(field("name") || "Not provided") + "</strong></div>",
      '<div class="scenario-summary-row"><span>Company</span><strong>' + escapeHtml(field("company") || "Not provided") + "</strong></div>",
      '<div class="scenario-summary-row"><span>Contact email</span><strong>' + escapeHtml(field("email") || "Not provided") + "</strong></div>",
      '<div class="scenario-summary-row"><span>Phone</span><strong>' + escapeHtml(field("phone") || "Not provided") + "</strong></div>",
      '<div class="scenario-summary-row"><span>Organization type</span><strong>' + escapeHtml(field("organizationType") || "Not provided") + "</strong></div>",
      '<div class="scenario-summary-row"><span>Size</span><strong>' + escapeHtml(sizeLine) + "</strong></div>",
      '<div class="scenario-summary-row"><span>Assessment focus</span><strong>' + escapeHtml(categories.length ? categories.join(", ") : "Not selected") + "</strong></div>",
      '<div class="scenario-summary-row scenario-summary-wide"><span>Assessment description</span><strong>' + escapeHtml(field("scenarioDescription") || "Not provided") + "</strong></div>",
      '<div class="scenario-summary-row scenario-summary-wide"><span>Current process</span><strong>' + escapeHtml(field("currentProcess") || "Not provided") + "</strong></div>",
      '<div class="scenario-summary-row"><span>Urgency</span><strong>' + escapeHtml(field("urgency") || "Not provided") + "</strong></div>",
      '<div class="scenario-summary-row"><span>Preferred demo path</span><strong>' + escapeHtml(field("preferredDemoPath") || "Not provided") + "</strong></div>",
      '<div class="scenario-summary-row"><span>Recommended BOF demo path</span><strong>' + escapeHtml(getPathLabel(pathKey)) + "</strong></div>"
    ].join("");
    renderRecommendedLinks(pathKey);
  }

  function renderRecommendedLinks(pathKey) {
    if (!recommendedEl) return;
    var links = pathSets[pathKey] || pathSets.fleet;
    recommendedEl.innerHTML = links.map(function (link) {
      return '<a class="route-chip" href="' + link[1] + '">' + escapeHtml(link[0]) + "</a>";
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

  function getMissingRequired() {
    var required = [
      ["name", "name"],
      ["company", "company"],
      ["email", "email"],
      ["organizationType", "organization type"],
      ["scenarioDescription", "assessment description"]
    ];
    return required.filter(function (item) {
      return !field(item[0]);
    }).map(function (item) {
      return item[1];
    });
  }

  function validateRequired() {
    var missing = getMissingRequired();
    if (missing.length) {
      setStatus("Please complete " + missing.join(", ") + " before sending the assessment request.", "warning");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field("email"))) {
      setStatus("Please enter a valid email address before sending the assessment request.", "warning");
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
    sendButton.textContent = isSending ? "Sending Assessment..." : "Request a BOF Assessment";
  }

  function sendScenario() {
    if (!validateRequired()) return;
    setSending(true);
    setStatus("Sending assessment request to BOF...", "neutral");

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
          throw new Error(data.message || "BOF could not send the assessment request. Please try again.");
        }
        return data;
      });
    }).then(function (data) {
      setStatus(data.message || "Assessment request sent to BOF. We will review it before any BOF Assessment Review or Fleet Operations Review.", "success");
    }).catch(function (error) {
      setStatus(error.message || "BOF could not send the assessment request. Your form data is still here; please try again.", "error");
    }).finally(function () {
      setSending(false);
    });
  }

  function clearForm() {
    form.reset();
    renderSummary();
    setStatus("Form cleared. Add the workflow you want BOF to assess when you are ready.", "neutral");
  }

  form.addEventListener("input", renderSummary);
  form.addEventListener("change", renderSummary);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    sendScenario();
  });
  if (copyButton) copyButton.addEventListener("click", copySummary);
  if (clearButton) clearButton.addEventListener("click", clearForm);
  if (sendButton) sendButton.addEventListener("click", sendScenario);

  renderSummary();
})();
