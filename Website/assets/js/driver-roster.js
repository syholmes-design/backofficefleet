(function () {
  var DATA_URL = "/assets/data/bof-public-operations.json";
  var rosterMount = document.querySelector("[data-driver-roster]");
  var summaryMount = document.querySelector("[data-driver-summary]");
  var filters = Array.prototype.slice.call(document.querySelectorAll("[data-driver-filter]"));
  var state = {
    data: null,
    filter: "all"
  };

  if (!rosterMount || !summaryMount) return;

  function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function byId(items) {
    return (items || []).reduce(function (map, item) {
      if (item && item.id) map[item.id] = item;
      return map;
    }, {});
  }

  function statusClass(value) {
    var normalized = String(value || "none").toLowerCase().replace(/\s+/g, "-");
    return "driver-status-" + normalized;
  }

  function driverInitials(name) {
    return String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); })
      .join("");
  }

  function lookupSets(data) {
    return {
      loads: byId(data.loads),
      units: byId(data.units),
      exceptions: byId(data.exceptions),
      safety: byId(data.safetyRecords),
      settlements: byId(data.settlementRecords)
    };
  }

  function firstBy(items, key, value) {
    return (items || []).find(function (item) { return item && item[key] === value; }) || null;
  }

  function hosText(driver, load, safety, exception) {
    if (driver.gating === "blocked") return "Hold: credential or safety record blocks assignment.";
    if (exception && exception.severity === "Blocked") return "Hold until safety clears the exception.";
    if (load && load.dispatchStatus === "At Risk") return "Watch: confirm HOS and proof before final release.";
    if (load && load.dispatchStatus === "Review") return "Review: confirm load instructions before release.";
    if (safety && safety.status === "Ready") return "HOS clear for current release path.";
    if (load) return "No HOS blocker shown in canonical record.";
    return "Available hours not tied to an active load.";
  }

  function safetyText(driver, safety, exception) {
    if (safety) return safety.status + ": " + safety.dispatchConsequence;
    if (exception && exception.originatingModule === "Safety") return exception.currentStatus + ": " + exception.requiredAction;
    if (driver.readinessStatus === "Blocked") return "Blocked: safety owner action required.";
    return "No active safety blocker in canonical roster.";
  }

  function payText(settlement) {
    if (!settlement) return "No active settlement";
    if (settlement.status === "Complete") return "Pay clear: settlement complete";
    if (settlement.status === "Held") return "Pay held: " + settlement.billingHold;
    return "Pay review: " + settlement.billingStatus;
  }

  function renderSummary(drivers) {
    var counts = drivers.reduce(function (map, driver) {
      map[driver.readinessStatus] = (map[driver.readinessStatus] || 0) + 1;
      return map;
    }, {});
    var activeLoads = drivers.filter(function (driver) { return driver.activeLoadId; }).length;
    var exceptions = drivers.filter(function (driver) { return driver.activeExceptionId; }).length;
    summaryMount.innerHTML = [
      ["Roster", drivers.length],
      ["Ready", counts.Ready || 0],
      ["Review", counts.Review || 0],
      ["At Risk", counts["At Risk"] || 0],
      ["Blocked", counts.Blocked || 0],
      ["Active loads", activeLoads],
      ["Exceptions", exceptions]
    ].map(function (item) {
      return "<span><strong>" + escapeHtml(item[1]) + "</strong>" + escapeHtml(item[0]) + "</span>";
    }).join("");
  }

  function renderCard(driver, lookups, data) {
    var load = driver.activeLoadId ? lookups.loads[driver.activeLoadId] : null;
    var unit = driver.unitId ? lookups.units[driver.unitId] : null;
    var exception = driver.activeExceptionId ? lookups.exceptions[driver.activeExceptionId] : null;
    var safety = load ? firstBy(data.safetyRecords, "loadId", load.id) : firstBy(data.safetyRecords, "driverId", driver.id);
    var settlement = load ? firstBy(data.settlementRecords, "loadId", load.id) : null;
    var primaryDocs = "Primary docs " + driver.documentCounts.primary + "/8";
    var secondaryDocs = "Supporting docs " + driver.documentCounts.secondary + "/8";
    var loadReadiness = load ? load.id + " / " + load.dispatchStatus : "No active load";
    var unitText = unit ? unit.label : "No active unit";
    var recordHref = load ? "/operations-record/#" + load.id.toLowerCase() : "/operations-record/#canonical-operations-record";
    var payHref = settlement ? "/settlements/#canonical-settlement-records" : "/business-operations/payroll-administration/";
    var safetyHref = safety ? "/safety/#canonical-safety-records" : "/safety/";

    return [
      '<article class="driver-roster-card ' + statusClass(driver.readinessStatus) + '" data-driver-status="' + escapeHtml(driver.readinessStatus) + '">',
      '  <div class="driver-card-top">',
      '    <a class="driver-photo-link" href="' + escapeHtml(driver.profileRoute) + '">',
      '      <img src="' + escapeHtml(driver.portrait) + '" alt="' + escapeHtml(driver.name) + ' driver profile portrait" loading="lazy" decoding="async">',
      '    </a>',
      '    <div class="driver-card-title">',
      '      <span>' + escapeHtml(driver.id) + ' / ' + escapeHtml(driver.employmentType) + '</span>',
      '      <h3>' + escapeHtml(driver.name) + '</h3>',
      '      <p>' + escapeHtml(driver.homeBase) + '</p>',
      '    </div>',
      '    <strong class="driver-status-pill">' + escapeHtml(driver.readinessStatus) + '</strong>',
      '  </div>',
      '  <div class="driver-doc-strip" aria-label="Driver document counts">',
      '    <a href="' + escapeHtml(driver.licenseImage) + '">' + escapeHtml(primaryDocs) + '</a>',
      '    <span>' + escapeHtml(secondaryDocs) + '</span>',
      '    <span>Evidence ' + escapeHtml(driver.documentCounts.operatingEvidence) + '</span>',
      '  </div>',
      '  <dl class="driver-record-list">',
      '    <div><dt>Assignment</dt><dd>' + escapeHtml(driver.assignmentState) + '</dd></div>',
      '    <div><dt>Load readiness</dt><dd><a href="' + escapeHtml(recordHref) + '">' + escapeHtml(loadReadiness) + '</a></dd></div>',
      '    <div><dt>Unit</dt><dd>' + escapeHtml(unitText) + '</dd></div>',
      '    <div><dt>Pay</dt><dd><a href="' + escapeHtml(payHref) + '">' + escapeHtml(payText(settlement)) + '</a></dd></div>',
      '    <div><dt>HOS / release</dt><dd>' + escapeHtml(hosText(driver, load, safety, exception)) + '</dd></div>',
      '    <div><dt>Safety</dt><dd><a href="' + escapeHtml(safetyHref) + '">' + escapeHtml(safetyText(driver, safety, exception)) + '</a></dd></div>',
      '  </dl>',
      '  <p class="driver-warning">' + escapeHtml(driver.primaryWarning) + '</p>',
      '  <div class="driver-card-actions">',
      '    <a href="' + escapeHtml(driver.profileRoute) + '">Profile</a>',
      '    <a href="' + escapeHtml(recordHref) + '">Load record</a>',
      '    <a href="' + escapeHtml(payHref) + '">Pay context</a>',
      '  </div>',
      '  <span class="driver-initials" aria-hidden="true">' + escapeHtml(driverInitials(driver.name)) + '</span>',
      '</article>'
    ].join("");
  }

  function renderRoster() {
    var data = state.data;
    var lookups = lookupSets(data);
    var drivers = data.drivers || [];
    var visible = state.filter === "all" ? drivers : drivers.filter(function (driver) {
      return driver.readinessStatus === state.filter;
    });
    renderSummary(drivers);
    rosterMount.innerHTML = visible.length
      ? visible.map(function (driver) { return renderCard(driver, lookups, data); }).join("")
      : '<article class="driver-loading-card">No drivers match this filter.</article>';
  }

  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      state.filter = button.getAttribute("data-driver-filter") || "all";
      filters.forEach(function (filterButton) {
        filterButton.classList.toggle("is-active", filterButton === button);
      });
      renderRoster();
    });
  });

  fetch(DATA_URL, { credentials: "same-origin" })
    .then(function (response) {
      if (!response.ok) throw new Error("Unable to load driver dataset.");
      return response.json();
    })
    .then(function (data) {
      state.data = data;
      renderRoster();
    })
    .catch(function (error) {
      rosterMount.innerHTML = '<article class="driver-loading-card is-error">' + escapeHtml(error.message) + '</article>';
      summaryMount.innerHTML = '<span><strong>Offline</strong>Roster unavailable</span>';
    });
})();
