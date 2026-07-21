(function () {
  var DATA_URL = "/assets/data/bof-public-operations.json";
  var rosterMount = document.querySelector("[data-driver-roster]");
  var summaryMount = document.querySelector("[data-driver-summary]");
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

  function driverPriority(driver) {
    var status = String(driver && driver.readinessStatus || "");
    if (status === "Blocked") return 0;
    if (status === "At Risk") return 1;
    if (status === "Review") return 2;
    if (driver && driver.activeExceptionId) return 3;
    return 4;
  }

  function commandIssueHref(load, exception, driver) {
    var loadId = String(load && load.id || "");
    var exceptionId = String(exception && exception.id || "");
    if (loadId === "BOF-1907" || exceptionId === "EX-1907-POD") return "/command-center/issue/?case=pod-renewal-evidence";
    if (loadId === "BOF-1931" || exceptionId === "EX-1931-MED") return "/command-center/issue/?case=pre-trip-asset-defect";
    if (loadId === "BOF-2175" || exceptionId === "EX-2175-RATE") return "/command-center/issue/?case=rate-confirmation-review";
    if (loadId === "BOF-2258" || exceptionId === "EX-2258-RENEWAL") return "/command-center/issue/?case=renewal-evidence-review";
    if (driver && /payroll|withholding|hr/i.test(driver.primaryWarning || "")) return "/command-center/issue/?case=driver-payroll-hr-review";
    if (loadId === "BOF-2064") return "/operations-record/#bof-2064";
    return loadId ? "/operations-record/#" + loadId.toLowerCase() : "/command-center/issue/?case=owner-action";
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
      settlements: byId(data.settlementRecords),
      payProfiles: byId(data.driverPayProfiles)
    };
  }

  function firstBy(items, key, value) {
    return (items || []).find(function (item) { return item && item[key] === value; }) || null;
  }

  function hosText(driver, load, safety, exception) {
    if (driver.gating === "blocked") return "Hold: credential or safety record blocks assignment.";
    if (exception && exception.severity === "Blocked") return "Hold until safety clears the exception.";
    if (load && load.dispatchStatus === "At Risk") return "Watch: confirm HOS available time and proof before final release.";
    if (load && load.dispatchStatus === "Review") return "Review: confirm load instructions before release.";
    if (safety && safety.status === "Ready") return "HOS available time is sufficient for the current release path.";
    if (load) return "No HOS availability blocker shown in canonical record.";
    return "Available hours not tied to an active load.";
  }

  function safetyText(driver, safety, exception) {
    if (safety) return safety.status + ": " + safety.dispatchConsequence;
    if (exception && exception.originatingModule === "Safety") return exception.currentStatus + ": " + exception.requiredAction;
    if (driver.readinessStatus === "Blocked") return "Blocked: safety owner action required.";
    return "No active safety blocker in canonical roster.";
  }

  function money(value) {
    var number = Number(value || 0);
    return "$" + number.toLocaleString(undefined, { maximumFractionDigits: number % 1 ? 2 : 0 });
  }

  function payText(settlement, payProfile) {
    if (payProfile) return payProfile.payMethod + " / " + payProfile.rateLabel + " / " + money(payProfile.estimatedPay);
    if (!settlement) return "No active settlement";
    if (settlement.status === "Complete") return "Pay clear: settlement complete";
    if (settlement.status === "Held") return "Pay held: " + settlement.billingHold;
    return "Pay review: " + settlement.billingStatus;
  }

  function driverNumericId(driver) {
    var match = String(driver.id || "").match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  function capabilityFor(driver, load, safety, exception, settlement, unit) {
    var id = driverNumericId(driver);
    var blocked = driver.readinessStatus === "Blocked";
    var review = driver.readinessStatus === "Review" || driver.readinessStatus === "At Risk";
    var loadReview = load && load.dispatchStatus !== "Ready";
    var score = blocked ? 24 : review ? 68 : loadReview ? 82 : load ? 94 : 88;
    var hosHours = blocked ? "0h 00m" : review ? (2 + (id % 4)) + "h " + (id % 2 ? "20m" : "45m") : (6 + (id % 4)) + "h " + (id % 3 ? "30m" : "55m");
    var readyAgain = blocked ? "After safety clearance" : review ? "After owner review" : "Ready now";
    var resetClock = blocked ? "Reset unavailable" : review ? "Reset window monitored" : "Reset not required";
    var equipment = unit ? unit.label : (driver.employmentType === "Owner-operator" ? "Owner tractor / dry van eligible" : "Company tractor pool / dry van eligible");
    var laneFit = driver.homeBase.indexOf("CA") !== -1 ? "Western regional / long-haul" :
      driver.homeBase.indexOf("TX") !== -1 || driver.homeBase.indexOf("AZ") !== -1 ? "Southwest / regional" :
      driver.homeBase.indexOf("IL") !== -1 || driver.homeBase.indexOf("OH") !== -1 ? "Midwest / regional" :
      "OTR / network coverage";
    var endorsements = id % 5 === 0 ? "Dry van, hazmat review, TWIC check" :
      id % 3 === 0 ? "Dry van, tanker eligible, safety review" :
      "Dry van, interstate, standard freight";
    var safetyContext = safety ? safety.status + " safety record" :
      exception && exception.originatingModule === "Safety" ? "Safety exception open" :
      "BOF qualification clear";

    return {
      score: score,
      scoreLabel: score >= 90 ? "High capability" : score >= 75 ? "Usable with watch" : score >= 50 ? "Needs review" : "Do not assign",
      hosAvailable: hosHours,
      readyAgain: readyAgain,
      resetClock: resetClock,
      eldSync: "ELD sync " + (6 + ((id * 7) % 19)) + " min ago",
      equipment: equipment,
      laneFit: laneFit,
      endorsements: endorsements,
      safetyContext: safetyContext,
      safetyLabel: "BOF safety view",
      assignmentFit: load ? load.origin + " to " + load.destination : "Open for next assignment",
      settlementSignal: settlement ? settlement.status : "No settlement hold"
    };
  }

  function actionHrefFor(moduleName, driver, load, safety, exception, settlement) {
    var moduleKey = String(moduleName || "").toLowerCase();
    if (moduleKey.indexOf("safety") !== -1 || safety) return commandIssueHref(load, exception, driver);
    if (moduleKey.indexOf("settlement") !== -1 || settlement) return commandIssueHref(load, exception, driver);
    if (moduleKey.indexOf("dispatch") !== -1 || load) return commandIssueHref(load, exception, driver);
    if (moduleKey.indexOf("payroll") !== -1 || moduleKey.indexOf("hr") !== -1) return "/command-center/issue/?case=driver-payroll-hr-review";
    if (exception && exception.relatedRecordId) return commandIssueHref(load, exception, driver);
    return driver.profileRoute || "/drivers/";
  }

  function clearancePath(driver, load, safety, exception, settlement) {
    var status = driver.readinessStatus || "Ready";
    var path = {
      tone: status,
      heading: "Cleared for active duty",
      reason: driver.primaryWarning || "No active driver blocker.",
      owner: "Dispatch / driver desk",
      action: "Open driver profile",
      href: driver.profileRoute || "/drivers/",
      consequence: load ? load.releaseDecision : "Available for planned assignment review."
    };

    if (exception) {
      path.heading = status === "Blocked" ? "Blocked from active duty" : "Needs review before release";
      path.reason = exception.title || driver.primaryWarning;
      path.owner = exception.assignedOwner || "Operations owner";
      path.action = "Clear " + (exception.category || "exception").toLowerCase();
      path.href = actionHrefFor(exception.originatingModule, driver, load, safety, exception, settlement);
      path.consequence = exception.operationalConsequence || path.consequence;
      path.detailAction = exception.requiredAction || "Resolve exception before release.";
      return path;
    }

    if (status === "Blocked") {
      path.heading = "Blocked from active duty";
      path.owner = safety ? "Safety lead" : "Driver compliance owner";
      path.action = safety ? "Clear safety blocker" : "Open blocker review";
      path.href = actionHrefFor("Safety", driver, load, safety, exception, settlement);
      path.consequence = load ? load.releaseDecision : "Driver cannot be assigned until the record is cleared.";
      path.detailAction = safety && safety.correctiveAction !== "None" ? safety.correctiveAction : "Resolve blocker before assignment.";
      return path;
    }

    if (status === "Review" || status === "At Risk") {
      var isPayroll = /payroll|withholding|hr/i.test(driver.primaryWarning || "");
      path.heading = status === "At Risk" ? "At risk until reviewed" : "Under review";
      path.owner = isPayroll ? "HR / payroll owner" : (safety ? "Safety desk" : "Driver qualification owner");
      path.action = isPayroll ? "Open payroll clearance" : (safety ? "Open safety review" : "Open qualification review");
      path.href = isPayroll ? "/command-center/issue/?case=driver-payroll-hr-review" : actionHrefFor("Safety", driver, load, safety, exception, settlement);
      path.consequence = load ? load.releaseDecision : "Assignment should wait for the named owner to clear the review.";
      path.detailAction = safety && safety.correctiveAction !== "None" ? safety.correctiveAction : (isPayroll ? "Verify HR and payroll packet before presentation." : "Review qualification record before release.");
      return path;
    }

    if (load && load.dispatchStatus !== "Ready") {
      path.heading = "Driver ready; load needs review";
      path.owner = "Dispatch / packet owner";
      path.action = "Open joined load record";
      path.href = commandIssueHref(load, exception, driver);
      path.reason = load.releaseDecision;
      path.consequence = "Driver file is not the blocker; the load record controls release.";
      path.detailAction = "Resolve the load record before final dispatch release.";
      return path;
    }

    return path;
  }

  function renderSummary(drivers) {
    var counts = drivers.reduce(function (map, driver) {
      map[driver.readinessStatus] = (map[driver.readinessStatus] || 0) + 1;
      return map;
    }, {});
    var activeLoads = drivers.filter(function (driver) { return driver.activeLoadId; }).length;
    var exceptions = drivers.filter(function (driver) { return driver.activeExceptionId; }).length;
    var readyNow = drivers.filter(function (driver) { return driver.readinessStatus === "Ready" && !driver.activeExceptionId; }).length;
    summaryMount.innerHTML = [
      ["Roster", drivers.length, "all", true],
      ["Ready now", readyNow, "Ready", true],
      ["Review", counts.Review || 0, "Review", true],
      ["At Risk", counts["At Risk"] || 0, "At Risk", true],
      ["Blocked", counts.Blocked || 0, "Blocked", true],
      ["Active loads", activeLoads, "loads", true],
      ["Exceptions", exceptions, "exceptions", true]
    ].map(function (item) {
      var label = item[0];
      var value = item[1];
      var filter = item[2];
      var enabled = item[3];
      if (!enabled) return '<span class="driver-summary-tile is-static"><strong>' + escapeHtml(value) + '</strong>' + escapeHtml(label) + '</span>';
      return '<button class="driver-summary-tile' + (state.filter === filter ? ' is-active' : '') + '" type="button" data-driver-filter="' + escapeHtml(filter) + '" aria-pressed="' + (state.filter === filter ? 'true' : 'false') + '"><strong>' + escapeHtml(value) + '</strong>' + escapeHtml(label) + '</button>';
    }).join("");
  }

  function renderCard(driver, lookups, data) {
    var load = driver.activeLoadId ? lookups.loads[driver.activeLoadId] : null;
    var unit = driver.unitId ? lookups.units[driver.unitId] : null;
    var exception = driver.activeExceptionId ? lookups.exceptions[driver.activeExceptionId] : null;
    var safety = load ? firstBy(data.safetyRecords, "loadId", load.id) : firstBy(data.safetyRecords, "driverId", driver.id);
    var settlement = load ? firstBy(data.settlementRecords, "loadId", load.id) : null;
    var payProfile = load ? firstBy(data.driverPayProfiles, "loadId", load.id) : firstBy(data.driverPayProfiles, "driverId", driver.id);
    var loadReadiness = load ? load.id + " / " + load.dispatchStatus : "No active load";
    var unitText = unit ? unit.label : "No active unit";
    var recordHref = load ? "/operations-record/#" + load.id.toLowerCase() : "/operations-record/#canonical-operations-record";
    var payHref = payProfile ? "/business-operations/payroll-administration/#driver-pay-profile-workbench" : (settlement ? "/settlements/#canonical-settlement-records" : "/business-operations/payroll-administration/");
    var safetyHref = safety ? "/safety/#canonical-safety-records" : "/safety/";
    var clearance = clearancePath(driver, load, safety, exception, settlement);
    var capability = capabilityFor(driver, load, safety, exception, settlement, unit);
    var docs = window.BOFDemoState && window.BOFDemoState.documentsForDriver
      ? window.BOFDemoState.documentsForDriver(data, driver, payProfile)
      : null;
    var carrierName = docs && docs.carrier ? docs.carrier.name : "No carrier overlay";

    return [
      '<details class="driver-roster-card ' + statusClass(driver.readinessStatus) + '" data-driver-status="' + escapeHtml(driver.readinessStatus) + '">',
      '  <summary class="driver-card-summary">',
      '    <span class="driver-photo-link">',
      '      <img src="' + escapeHtml(driver.portrait) + '" alt="' + escapeHtml(driver.name) + ' driver profile portrait" loading="lazy" decoding="async">',
      '    </span>',
      '    <span class="driver-card-title">',
      '      <span>' + escapeHtml(driver.id) + ' / ' + escapeHtml(driver.employmentType) + '</span>',
      '      <strong>' + escapeHtml(driver.name) + '</strong>',
      '      <small>' + escapeHtml(driver.homeBase) + '</small>',
      '    </span>',
      '    <strong class="driver-status-pill">' + escapeHtml(driver.readinessStatus) + '</strong>',
      '    <span class="driver-scan-metric"><b>' + escapeHtml(capability.score) + '</b>' + escapeHtml(capability.scoreLabel) + '</span>',
      '    <span class="driver-scan-metric"><b>' + escapeHtml(capability.hosAvailable) + '</b>HOS available</span>',
      '    <span class="driver-scan-metric"><b>' + escapeHtml(payProfile ? payProfile.rateLabel : "No active pay") + '</b>' + escapeHtml(payProfile ? payProfile.payMethod : "Pay setup") + '</span>',
      '    <span class="driver-scan-metric driver-scan-wide"><b>' + escapeHtml(capability.equipment) + '</b>' + escapeHtml(clearance.action) + '</span>',
      '    <span class="driver-summary-reason-strip">',
      '      <span><b>Why</b>' + escapeHtml(clearance.reason) + '</span>',
      '      <span><b>Clearance</b>' + escapeHtml(clearance.detailAction || clearance.action) + '</span>',
      '    </span>',
      '    <span class="driver-expand-cue">Details</span>',
      '  </summary>',
      '  <div class="driver-card-detail">',
      '    <section class="driver-clearance-panel" aria-label="Driver clearance path">',
      '    <div class="driver-clearance-head">',
      '      <span>Clearance path</span>',
      '      <strong>' + escapeHtml(clearance.heading) + '</strong>',
      '    </div>',
      '    <p><b>Why:</b> ' + escapeHtml(clearance.reason) + '</p>',
      clearance.detailAction ? '    <p class="driver-clearance-detail"><b>To clear:</b> ' + escapeHtml(clearance.detailAction) + '</p>' : '',
      '    <dl class="driver-clearance-meta">',
      '      <div><dt>Owner</dt><dd>' + escapeHtml(clearance.owner) + '</dd></div>',
      '      <div><dt>Consequence</dt><dd>' + escapeHtml(clearance.consequence) + '</dd></div>',
      '    </dl>',
      '    <a class="driver-clearance-action" href="' + escapeHtml(clearance.href) + '">' + escapeHtml(clearance.action) + '</a>',
      '    </section>',
      '    <dl class="driver-capability-grid" aria-label="Driver capability details">',
      '      <div><dt>HOS available</dt><dd>' + escapeHtml(capability.hosAvailable) + '</dd></div>',
      '      <div><dt>Ready again</dt><dd>' + escapeHtml(capability.readyAgain) + '</dd></div>',
      '      <div><dt>ELD</dt><dd>' + escapeHtml(capability.eldSync) + '</dd></div>',
      '      <div><dt>Reset</dt><dd>' + escapeHtml(capability.resetClock) + '</dd></div>',
      '      <div><dt>Equipment access</dt><dd>' + escapeHtml(capability.equipment) + '</dd></div>',
      '      <div><dt>Endorsements</dt><dd>' + escapeHtml(capability.endorsements) + '</dd></div>',
      '      <div><dt>Lane fit</dt><dd>' + escapeHtml(capability.laneFit) + '</dd></div>',
      '      <div><dt>Safety context</dt><dd>' + escapeHtml(capability.safetyContext) + '</dd></div>',
      '      <div><dt>Carrier rules</dt><dd>' + escapeHtml(carrierName) + '</dd></div>',
      '      <div><dt>Document rule set</dt><dd>' + escapeHtml(docs ? docs.label : "Default driver document set") + '</dd></div>',
      '    </dl>',
      payProfile ? [
      '    <section class="driver-pay-panel" aria-label="Driver pay profile">',
      '      <div><span>Pay profile</span><strong>' + escapeHtml(payProfile.workerClassification) + '</strong><p>' + escapeHtml(payProfile.payMethod) + ' at ' + escapeHtml(payProfile.rateLabel) + '</p></div>',
      '      <dl>',
      '        <div><dt>Calculation</dt><dd>' + escapeHtml(payProfile.calculationLabel) + '</dd></div>',
      '        <div><dt>Estimated pay</dt><dd>' + escapeHtml(money(payProfile.estimatedPay)) + '</dd></div>',
      '        <div><dt>Net after driver pay</dt><dd>' + escapeHtml(money(payProfile.estimatedNetRevenue)) + '</dd></div>',
      '        <div><dt>Status</dt><dd>' + escapeHtml(payProfile.payStatus) + ': ' + escapeHtml(payProfile.reason) + '</dd></div>',
      '      </dl>',
      '    </section>'
      ].join("") : '',
      '    <div class="driver-doc-strip" aria-label="Driver document counts">',
      '    <a href="' + escapeHtml(driver.licenseImage) + '"><b>Required</b>' + escapeHtml(docs ? docs.completeCount : driver.documentCounts.primary) + '/' + escapeHtml(docs ? docs.required.length : 8) + '</a>',
      '    <span><b>Review</b>' + escapeHtml(docs ? docs.reviewCount : 0) + ' items</span>',
      '    <span><b>Carrier</b>' + escapeHtml(carrierName) + '</span>',
      '    </div>',
      '    <dl class="driver-record-list">',
      '    <div><dt>Assignment</dt><dd>' + escapeHtml(driver.assignmentState) + '</dd></div>',
      '    <div><dt>Load readiness</dt><dd><a href="' + escapeHtml(recordHref) + '">' + escapeHtml(loadReadiness) + '</a></dd></div>',
      '    <div><dt>Unit</dt><dd>' + escapeHtml(unitText) + '</dd></div>',
      '    <div><dt>Pay</dt><dd><a href="' + escapeHtml(payHref) + '">' + escapeHtml(payText(settlement, payProfile)) + '</a></dd></div>',
      '    <div><dt>HOS availability note</dt><dd>' + escapeHtml(hosText(driver, load, safety, exception)) + '</dd></div>',
      '    <div><dt>Safety</dt><dd><a href="' + escapeHtml(safetyHref) + '">' + escapeHtml(safetyText(driver, safety, exception)) + '</a></dd></div>',
      '    </dl>',
      '    <div class="driver-card-actions">',
      '    <a href="' + escapeHtml(driver.profileRoute) + '">Profile</a>',
      '    <a href="' + escapeHtml(recordHref) + '">Load record</a>',
      '    <a href="' + escapeHtml(payHref) + '">Pay context</a>',
      '    </div>',
      '  </div>',
      '  <span class="driver-initials" aria-hidden="true">' + escapeHtml(driverInitials(driver.name)) + '</span>',
      '</details>'
    ].join("");
  }

  function renderRoster() {
    var data = state.data;
    var lookups = lookupSets(data);
    var drivers = data.drivers || [];
    var visible = state.filter === "all" ? drivers : drivers.filter(function (driver) {
      if (state.filter === "loads") return Boolean(driver.activeLoadId);
      if (state.filter === "exceptions") return Boolean(driver.activeExceptionId);
      return driver.readinessStatus === state.filter;
    }).sort(function (a, b) {
      return driverPriority(a) - driverPriority(b);
    });
    renderSummary(drivers);
    rosterMount.innerHTML = visible.length
      ? visible.map(function (driver) { return renderCard(driver, lookups, data); }).join("")
      : '<article class="driver-loading-card">No drivers match this filter.</article>';
  }

  summaryMount.addEventListener("click", function (event) {
    var button = event.target.closest("[data-driver-filter]");
    if (!button || !summaryMount.contains(button)) return;
      state.filter = button.getAttribute("data-driver-filter") || "all";
      renderRoster();
  });

  (window.BOFDataLoader ? window.BOFDataLoader.load(DATA_URL) : fetch(DATA_URL, { credentials: "same-origin" }).then(function (response) {
    if (!response.ok) throw new Error("Unable to load driver dataset.");
    return response.json();
  }))
    .then(function (data) {
      if (window.BOFDemoState && window.BOFDemoState.apply) data = window.BOFDemoState.apply(data);
      state.data = data;
      renderRoster();
    })
    .catch(function (error) {
      rosterMount.innerHTML = '<article class="driver-loading-card is-error">' + escapeHtml(error.message) + '</article>';
      summaryMount.innerHTML = '<span><strong>Offline</strong>Roster unavailable</span>';
    });
})();
