(function () {
  var DATA_URL = "/assets/data/bof-public-operations.json";
  var mounts = Array.prototype.slice.call(document.querySelectorAll("[data-bof-pay-profiles]"));
  if (!mounts.length) return;

  function esc(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    var number = Number(value || 0);
    return "$" + number.toLocaleString(undefined, { maximumFractionDigits: number % 1 ? 2 : 0 });
  }

  function byId(items) {
    return (items || []).reduce(function (map, item) {
      if (item && item.id) map[item.id] = item;
      return map;
    }, {});
  }

  function statusClass(value) {
    return "pay-status-" + String(value || "none").toLowerCase().replace(/\s+/g, "-");
  }

  function checkbox(label, checked) {
    return '<span class="pay-check ' + (checked ? "is-checked" : "") + '"><i aria-hidden="true">' + (checked ? "x" : "") + '</i>' + esc(label) + '</span>';
  }

  function setupChecks(profile) {
    var type = String(profile.workerClassification || "").toLowerCase();
    var method = String(profile.payMethod || "").toLowerCase();
    return [
      checkbox("Employee", type.indexOf("employee") >= 0),
      checkbox("Independent contractor", type.indexOf("independent") >= 0),
      checkbox("Owner-operator", type.indexOf("owner") >= 0),
      checkbox("Mileage", method.indexOf("mile") >= 0),
      checkbox("Percentage", method.indexOf("percentage") >= 0 || method.indexOf("%") >= 0),
      checkbox("Hourly", method.indexOf("hour") >= 0),
      checkbox("Fixed route", method.indexOf("fixed") >= 0)
    ].join("");
  }

  function option(value, label, selected) {
    return '<option value="' + esc(value) + '"' + (selected ? " selected" : "") + '>' + esc(label) + '</option>';
  }

  function classificationKey(profile) {
    if (window.BOFDemoState && window.BOFDemoState.normalizeType) return window.BOFDemoState.normalizeType(profile.workerClassification);
    var type = String(profile.workerClassification || "").toLowerCase();
    if (type.indexOf("owner") >= 0) return "owner-operator";
    if (type.indexOf("independent") >= 0 || type.indexOf("contractor") >= 0) return "independent";
    return "employee";
  }

  function documentPanel(profile, maps, driver) {
    var docs = window.BOFDemoState && window.BOFDemoState.documentsForDriver
      ? window.BOFDemoState.documentsForDriver(maps.rawData, driver, profile)
      : { label: "Driver document set", required: profile.requiredSetup || [], carrier: null, completeCount: 0, reviewCount: 0, missing: [] };
    var visibleDocs = (docs.required || []).slice(0, 8);
    return [
      '<div class="pay-doc-panel">',
      '  <div><span>Document rule set</span><strong>' + esc(docs.label) + '</strong><p>' + esc(docs.carrier ? docs.carrier.name + " / " + docs.carrier.policySet : "No carrier overlay assigned") + '</p></div>',
      '  <div class="pay-doc-stats"><b>' + esc(docs.completeCount) + '</b><span>complete</span><b>' + esc(docs.reviewCount) + '</b><span>review</span></div>',
      '  <ul>' + visibleDocs.map(function (doc, index) {
        var isOpen = (docs.missing || []).indexOf(doc) >= 0;
        return '<li class="' + (isOpen ? "is-open" : "is-complete") + '"><span>' + esc(isOpen ? "Review" : "Ready") + '</span>' + esc(doc) + '</li>';
      }).join("") + '</ul>',
      '</div>'
    ].join("");
  }

  function adminControls(profile, maps, driver) {
    var carriers = maps.rawData.carrierProfiles || [];
    var carrier = window.BOFDemoState && window.BOFDemoState.carrierForDriver ? window.BOFDemoState.carrierForDriver(maps.rawData, driver) : null;
    var typeKey = classificationKey(profile);
    return [
      '<form class="pay-admin-form" data-pay-admin-form data-profile-id="' + esc(profile.id) + '" data-driver-id="' + esc(profile.driverId) + '">',
      '  <label>Classification<select name="workerClassification">',
      option("employee", "Employee driver", typeKey === "employee"),
      option("independent", "Independent contractor", typeKey === "independent"),
      option("owner-operator", "Owner-operator", typeKey === "owner-operator"),
      '  </select></label>',
      '  <label>Linked carrier<select name="carrierId">',
      carriers.map(function (item) { return option(item.id, item.name, carrier && carrier.id === item.id); }).join(""),
      '  </select></label>',
      '  <label>Pay method<select name="payMethod">',
      option("Mileage plus stop pay", "Mileage plus stop pay", profile.payMethod === "Mileage plus stop pay"),
      option("Hourly with detention review", "Hourly with detention review", profile.payMethod === "Hourly with detention review"),
      option("Percentage of linehaul", "Percentage of linehaul", profile.payMethod === "Percentage of linehaul"),
      option("Percentage of gross revenue", "Percentage of gross revenue", profile.payMethod === "Percentage of gross revenue"),
      option("Fixed route pay", "Fixed route pay", profile.payMethod === "Fixed route pay"),
      '  </select></label>',
      '  <label>Rate<input name="rateLabel" value="' + esc(profile.rateLabel) + '"></label>',
      '  <label>Status<select name="payStatus">',
      ["Ready", "Review", "At Risk", "Blocked"].map(function (status) { return option(status, status, profile.payStatus === status); }).join(""),
      '  </select></label>',
      '  <button type="submit">Apply to demo data</button>',
      '</form>'
    ].join("");
  }

  function profileCard(profile, maps) {
    var driver = maps.drivers[profile.driverId] || {};
    var load = profile.loadId ? maps.loads[profile.loadId] : null;
    var docs = window.BOFDemoState && window.BOFDemoState.documentsForDriver
      ? window.BOFDemoState.documentsForDriver(maps.rawData, driver, profile)
      : { label: "Driver document set", completeCount: 0, reviewCount: 0 };
    var carrier = window.BOFDemoState && window.BOFDemoState.carrierForDriver ? window.BOFDemoState.carrierForDriver(maps.rawData, driver) : null;
    var routeLabel = load ? load.origin + " to " + load.destination : "No active load assigned";
    var reviewLabel = Number(docs.reviewCount || 0) ? docs.reviewCount + " doc review" : "docs ready";
    return [
      '<article class="pay-profile-card pay-roster-card ' + statusClass(profile.payStatus) + '">',
      '  <div class="pay-profile-top">',
      '    <div>',
      '      <p class="eyebrow">' + esc(profile.id) + ' / ' + esc(profile.workerClassification) + '</p>',
      '      <h3>' + esc(driver.name || profile.driverId) + '</h3>',
      '      <p>' + esc(routeLabel) + '</p>',
      '    </div>',
      '    <strong>' + esc(profile.payStatus) + '</strong>',
      '  </div>',
      '  <div class="pay-roster-strip">',
      '    <span><b>Classification</b>' + esc(profile.workerClassification) + '</span>',
      '    <span><b>Carrier rules</b>' + esc(carrier ? carrier.name : "No carrier overlay") + '</span>',
      '    <span><b>Document set</b>' + esc(docs.label) + '</span>',
      '    <span><b>Review</b>' + esc(reviewLabel) + '</span>',
      '  </div>',
      '  <dl class="pay-profile-metrics">',
      '    <div><dt>Pay basis</dt><dd>' + esc(profile.payMethod) + '</dd></div>',
      '    <div><dt>Rate</dt><dd>' + esc(profile.rateLabel) + '</dd></div>',
      '    <div><dt>Calculation</dt><dd>' + esc(profile.calculationLabel) + '</dd></div>',
      '    <div><dt>Estimated pay</dt><dd>' + esc(money(profile.estimatedPay)) + '</dd></div>',
      '    <div><dt>Gross revenue</dt><dd>' + esc(money(profile.grossRevenue)) + '</dd></div>',
      '    <div><dt>Net after driver pay</dt><dd>' + esc(money(profile.estimatedNetRevenue)) + '</dd></div>',
      '  </dl>',
      '  <div class="pay-check-grid">' + setupChecks(profile) + '</div>',
      '  <div class="pay-clearance-box">',
      '    <span>Why ' + esc(profile.payStatus.toLowerCase()) + '</span>',
      '    <p>' + esc(profile.reason) + '</p>',
      '    <ol>' + (profile.clearancePath || []).map(function (step) { return '<li>' + esc(step) + '</li>'; }).join("") + '</ol>',
      '  </div>',
      '  <details class="pay-admin-disclosure">',
      '    <summary><span>Edit pay profile</span><small>Classification, carrier rules, pay method, rate, and status</small></summary>',
      '    <div class="pay-admin-panel">',
      adminControls(profile, maps, driver),
      documentPanel(profile, maps, driver),
      '    </div>',
      '  </details>',
      '</article>'
    ].join("");
  }

  function renderPayrollSummary(profiles) {
    var total = profiles.length;
    var ready = profiles.filter(function (profile) { return String(profile.payStatus).toLowerCase() === "ready"; }).length;
    var review = profiles.filter(function (profile) { return /review|risk/i.test(profile.payStatus); }).length;
    var blocked = profiles.filter(function (profile) { return String(profile.payStatus).toLowerCase() === "blocked"; }).length;
    var net = profiles.reduce(function (sum, profile) { return sum + Number(profile.estimatedNetRevenue || 0); }, 0);
    return [
      '<div class="pay-roster-summary" aria-label="Payroll roster summary">',
      '  <div><span>Total profiles</span><strong>' + esc(total) + '</strong></div>',
      '  <div><span>Ready</span><strong>' + esc(ready) + '</strong></div>',
      '  <div><span>Review</span><strong>' + esc(review) + '</strong></div>',
      '  <div><span>Blocked</span><strong>' + esc(blocked) + '</strong></div>',
      '  <div><span>Net after driver pay</span><strong>' + esc(money(net)) + '</strong></div>',
      '</div>'
    ].join("");
  }

  function renderPayroll(mount, profiles, maps) {
    mount.innerHTML = [
      '<div class="pay-workspace-head">',
      '  <div><p class="eyebrow">Driver pay profile workbench</p><h2>Choose how the driver is paid, then let the record carry through payroll, settlement, and finance.</h2><p>These baked-in demo records show employee, independent-contractor, and owner-operator pay logic tied to the same canonical driver and load records used elsewhere.</p></div>',
      '  <div class="pay-admin-actions"><a class="button secondary" href="/settlements/#canonical-settlement-records">Open settlement impact</a><button type="button" data-reset-demo-overrides>Reset local edits</button></div>',
      '</div>',
      renderPayrollSummary(profiles),
      '<div class="pay-profile-grid">' + profiles.map(function (profile) { return profileCard(profile, maps); }).join("") + '</div>'
    ].join("");
  }

  function renderCompensation(mount, profiles, maps) {
    var cards = profiles.map(function (profile) {
      var driver = maps.drivers[profile.driverId] || {};
      return [
        '<article class="pay-benefit-card">',
        '  <p class="eyebrow">' + esc(profile.workerClassification) + '</p>',
        '  <h3>' + esc(driver.name || profile.driverId) + '</h3>',
        '  <p><strong>' + esc(profile.payMethod) + '</strong> at ' + esc(profile.rateLabel) + '</p>',
        '  <dl>',
        '    <div><dt>Benefits</dt><dd>' + esc(profile.benefitStatus) + '</dd></div>',
        '    <div><dt>Setup</dt><dd>' + esc((profile.requiredSetup || []).join(", ")) + '</dd></div>',
        '    <div><dt>Open issue</dt><dd>' + esc(profile.payStatus) + ': ' + esc(profile.reason) + '</dd></div>',
        '  </dl>',
        '</article>'
      ].join("");
    }).join("");
    mount.innerHTML = '<div class="section-head reveal"><p class="eyebrow">Classification and pay setup</p><h2>Employee and contractor pay rules need different controls.</h2><p>The demo makes classification, pay basis, benefit eligibility, deductions, reimbursements, and owner action visible without pretending BOF makes legal, tax, payroll, or benefits decisions.</p></div><div class="pay-benefit-grid">' + cards + '</div>';
  }

  function renderTalent(mount, profiles, maps) {
    var rows = profiles.map(function (profile) {
      var driver = maps.drivers[profile.driverId] || {};
      return [
        '<article class="talent-signal-card">',
        '  <span>' + esc(profile.payStatus) + '</span>',
        '  <h3>' + esc(driver.name || profile.driverId) + '</h3>',
        '  <p>' + esc(profile.trainingStatus) + '</p>',
        '  <small>' + esc(profile.reason) + '</small>',
        '</article>'
      ].join("");
    }).join("");
    mount.innerHTML = '<div class="section-head reveal"><p class="eyebrow">Training and retention signals</p><h2>Pay, route fit, coaching, and training belong in one worker view.</h2><p>Talent management becomes more credible when it shows the specific operating friction that may slow a driver down.</p></div><div class="talent-signal-grid">' + rows + '</div>';
  }

  function renderFinance(mount, profiles, maps) {
    var rows = profiles.filter(function (profile) { return profile.loadId; }).map(function (profile) {
      var driver = maps.drivers[profile.driverId] || {};
      return [
        '<article class="finance-driver-pay-card">',
        '  <p class="eyebrow">' + esc(profile.loadId) + ' / ' + esc(driver.name || profile.driverId) + '</p>',
        '  <h3>' + esc(money(profile.estimatedNetRevenue)) + ' net after driver pay</h3>',
        '  <p>' + esc(profile.payMethod) + ' at ' + esc(profile.rateLabel) + '. ' + esc(profile.reason) + '</p>',
        '  <dl><div><dt>Gross</dt><dd>' + esc(money(profile.grossRevenue)) + '</dd></div><div><dt>Driver pay</dt><dd>' + esc(money(profile.estimatedPay)) + '</dd></div><div><dt>Status</dt><dd>' + esc(profile.payStatus) + '</dd></div></dl>',
        '</article>'
      ].join("");
    }).join("");
    mount.innerHTML = '<div class="section-head reveal"><p class="eyebrow">Driver pay to finance bridge</p><h2>Finance sees load revenue, driver pay, and margin context together.</h2><p>Changing the shared pay profile data updates these finance cards and the payroll/driver surfaces that read the same dataset.</p></div><div class="finance-driver-pay-grid">' + rows + '</div>';
  }

  (window.BOFDataLoader ? window.BOFDataLoader.load(DATA_URL) : fetch(DATA_URL, { cache: "no-store" }).then(function (response) {
    if (!response.ok) throw new Error("Unable to load BOF pay profile data.");
    return response.json();
  }))
    .then(function (data) {
      if (window.BOFDemoState && window.BOFDemoState.apply) data = window.BOFDemoState.apply(data);
      var maps = { drivers: byId(data.drivers), loads: byId(data.loads), rawData: data };
      var profiles = data.driverPayProfiles || [];
      mounts.forEach(function (mount) {
        var mode = mount.getAttribute("data-bof-pay-profiles");
        if (mode === "compensation") renderCompensation(mount, profiles, maps);
        else if (mode === "talent") renderTalent(mount, profiles, maps);
        else if (mode === "finance") renderFinance(mount, profiles, maps);
        else renderPayroll(mount, profiles, maps);
      });
      document.addEventListener("submit", function (event) {
        var form = event.target.closest("[data-pay-admin-form]");
        if (!form || !window.BOFDemoState || !window.BOFDemoState.saveDriverPayEdit) return;
        event.preventDefault();
        var formData = new FormData(form);
        window.BOFDemoState.saveDriverPayEdit({
          profileId: form.getAttribute("data-profile-id"),
          driverId: form.getAttribute("data-driver-id"),
          workerClassification: formData.get("workerClassification"),
          carrierId: formData.get("carrierId"),
          payMethod: formData.get("payMethod"),
          rateLabel: formData.get("rateLabel"),
          payStatus: formData.get("payStatus")
        });
        window.location.reload();
      });
      document.addEventListener("click", function (event) {
        var reset = event.target.closest("[data-reset-demo-overrides]");
        if (!reset || !window.BOFDemoState || !window.BOFDemoState.reset) return;
        window.BOFDemoState.reset();
        window.location.reload();
      });
    })
    .catch(function (error) {
      mounts.forEach(function (mount) {
        mount.innerHTML = '<article class="pay-profile-card is-error"><h3>Pay profile unavailable</h3><p>' + esc(error.message) + '</p></article>';
      });
    });
})();
