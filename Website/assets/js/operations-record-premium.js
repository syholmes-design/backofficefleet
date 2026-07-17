(function () {
  var DATA_URL = "/assets/data/bof-public-operations.json";
  var recordMount = document.querySelector("[data-operations-records]");
  var summaryMount = document.querySelector("[data-operations-summary]");
  var tableMount = document.querySelector("[data-operations-table]");
  var state = { data: null, filter: "all" };

  if (!recordMount || !summaryMount || !tableMount) return;

  function esc(value) {
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

  function firstBy(items, key, value) {
    return (items || []).find(function (item) { return item && item[key] === value; }) || null;
  }

  function statusClass(status) {
    return "operations-status-" + String(status || "none").toLowerCase().replace(/\s+/g, "-");
  }

  function statusLabel(label, status) {
    return '<span class="operations-status-pill ' + statusClass(status) + '"><b>' + esc(label) + '</b>' + esc(status || "None") + '</span>';
  }

  function money(value) {
    var number = Number(value || 0);
    return "$" + number.toLocaleString(undefined, { maximumFractionDigits: number % 1 ? 2 : 0 });
  }

  function releaseTone(load) {
    if (load.dispatchStatus === "Blocked" || load.safetyStatus === "Blocked") return "blocked";
    if (load.dispatchStatus === "At Risk" || load.dispatchStatus === "Review" || load.proofStatus === "Review") return "review";
    return "ready";
  }

  function releaseLabel(load) {
    var tone = releaseTone(load);
    if (tone === "blocked") return "Hold";
    if (tone === "review") return "Review";
    return "Release";
  }

  function safetyRecordForLoad(data, load) {
    return firstBy(data.safetyRecords || [], "loadId", load.id);
  }

  function derivedCapacity(driver, load) {
    var number = driver ? Number(String(driver.id || "").replace(/\D/g, "")) || 1 : 1;
    var tone = releaseTone(load);
    if (tone === "blocked") return { score: 24, hos: "0h 00m", readyAgain: "After credential clearance", eld: "Synced, assignment locked", equipment: "Do not release" };
    if (tone === "review") return { score: 68 + (number % 8), hos: (3 + number % 3) + "h 40m", readyAgain: "After owner review", eld: "Current with release note", equipment: "Assigned, verify gate" };
    return { score: 90 + (number % 5), hos: (6 + number % 4) + "h 30m", readyAgain: "Ready now", eld: "Current", equipment: "Assigned unit ready" };
  }

  function exceptionCategory(exception) {
    return String(exception && exception.category || "").toLowerCase();
  }

  function isCargoOrSecurementException(exception) {
    var category = exceptionCategory(exception);
    var title = String(exception && exception.title || "").toLowerCase();
    return /cargo|seal|securement|claim/.test(category + " " + title);
  }

  function evidenceContext(load, driver, proof, settlement, safety, exception, capacity) {
    if (exceptionCategory(exception).indexOf("qualification") >= 0 || String(exception && exception.relatedRecordId || "").indexOf("QUAL-") === 0) {
      return {
        label: "Credential evidence",
        value: exception.relatedRecordId + " / " + (exception.requiredAction || "Qualification review required."),
        stepTitle: "Driver qualification",
        stepBody: (driver ? driver.name + " is blocked because " : "Driver is blocked because ") + (exception.requiredAction || "qualification evidence must be corrected before assignment."),
        image: "",
        caption: ""
      };
    }

    if (isCargoOrSecurementException(exception)) {
      return {
        label: "Securement proof",
        value: "Cargo and seal evidence attached to the joined record.",
        stepTitle: "Cargo securement",
        stepBody: "Cargo, seal, and securement proof must be confirmed before release.",
        image: "/assets/images/partners/freight-brace/freight-brace-trailer-photo.jpeg",
        caption: "Securement evidence stays attached only when cargo, seal, claims, or securement is the actual operating issue."
      };
    }

    if (proof && proof.assetPaths && proof.assetPaths.length) {
      return {
        label: "Proof evidence",
        value: proof.id + " / " + proof.status + " / POD " + proof.pod,
        stepTitle: "Proof packet",
        stepBody: proof.id + " is " + proof.status + "; confirm POD, signed BOL, receiver evidence, and any required photos before release.",
        image: proof.assetPaths[0],
        caption: "This proof image is shown because the record is controlled by proof packet evidence."
      };
    }

    if (proof && proof.status !== "Complete") {
      return {
        label: "Proof evidence",
        value: proof.id + " / " + proof.status,
        stepTitle: "Proof packet",
        stepBody: proof.id + " is " + proof.status + "; no unrelated cargo photo is shown because the controlling issue is not securement.",
        image: "",
        caption: ""
      };
    }

    return {
      label: "Evidence",
      value: "No active evidence blocker.",
      stepTitle: "Evidence check",
      stepBody: "No separate evidence blocker controls this record.",
      image: "",
      caption: ""
    };
  }

  function clearanceSteps(load, driver, proof, settlement, safety, exception, capacity) {
    var evidence = evidenceContext(load, driver, proof, settlement, safety, exception, capacity);
    return [
      ["Dispatch decision", load.releaseDecision],
      ["Driver capability", (driver ? driver.name + " has " : "Driver has ") + capacity.hos + " HOS available before the next required break/reset; clearance timing: " + capacity.readyAgain + "."],
      ["Safety checkpoint", safety ? safety.dispatchConsequence : "No special safety checkpoint is attached."],
      [evidence.stepTitle, evidence.stepBody],
      ["Settlement release", settlement ? settlement.billingStatus + ": " + settlement.billingHold : "No settlement checkpoint is attached."],
      ["Owner action", exception ? exception.assignedOwner + " must " + String(exception.requiredAction || "clear the assigned exception").toLowerCase() : "No exception owner is required."]
    ];
  }

  function renderClearanceSteps(steps) {
    return '<ol class="operations-clearance-route">' + steps.map(function (step, index) {
      return '<li><span>' + esc(index + 1) + '</span><div><strong>' + esc(step[0]) + '</strong><p>' + esc(step[1]) + '</p></div></li>';
    }).join("") + '</ol>';
  }

  function lookups(data) {
    return {
      drivers: byId(data.drivers),
      units: byId(data.units),
      proofRecords: byId(data.proofRecords),
      settlementRecords: byId(data.settlementRecords),
      driverPayProfiles: byId(data.driverPayProfiles),
      exceptions: byId(data.exceptions)
    };
  }

  function payProfileForLoad(data, load) {
    return (data.driverPayProfiles || []).filter(function (profile) {
      return profile.loadId === load.id;
    })[0] || null;
  }

  function renderSummary(data) {
    var loads = data.loads || [];
    var exceptions = data.exceptions || [];
    var ready = loads.filter(function (load) { return releaseTone(load) === "ready"; }).length;
    var atRisk = loads.filter(function (load) { return load.dispatchStatus === "At Risk"; }).length;
    var review = loads.filter(function (load) { return (load.dispatchStatus === "Review" || load.proofStatus === "Review") && load.dispatchStatus !== "At Risk"; }).length;
    var blocked = loads.filter(function (load) { return releaseTone(load) === "blocked"; }).length;
    summaryMount.innerHTML = [
      ["Shared loads", loads.length, "all", true],
      ["Ready to release", ready, "Ready", true],
      ["Need review", review, "Review", true],
      ["At risk", atRisk, "At Risk", true],
      ["Blocked", blocked, "Blocked", true],
      ["Exceptions", exceptions.length, "exceptions", false]
    ].map(function (item) {
      if (!item[3]) return '<span class="operations-summary-tile is-static"><strong>' + esc(item[1]) + '</strong>' + esc(item[0]) + '</span>';
      return '<button class="operations-summary-tile' + (state.filter === item[2] ? ' is-active' : '') + '" type="button" data-operations-filter="' + esc(item[2]) + '" aria-pressed="' + (state.filter === item[2] ? 'true' : 'false') + '"><strong>' + esc(item[1]) + '</strong>' + esc(item[0]) + '</button>';
    }).join("");
  }

  function renderCard(load, maps) {
    var driver = maps.drivers[load.driverId];
    var unit = maps.units[load.unitId];
    var proof = maps.proofRecords[load.proofRecordId];
    var settlement = maps.settlementRecords[load.settlementRecordId];
    var payProfile = state.data ? payProfileForLoad(state.data, load) : null;
    var exception = load.exceptionIds && load.exceptionIds.length ? maps.exceptions[load.exceptionIds[0]] : null;
    var tone = releaseTone(load);
    var exceptionText = exception ? exception.id + " / " + exception.assignedOwner : "No active exception";
    var proofText = proof ? proof.id + " / " + proof.status : "No proof packet";
    var settlementText = settlement ? settlement.id + " / " + settlement.status : "No settlement";
    var safety = state.data ? safetyRecordForLoad(state.data, load) : null;
    var capacity = derivedCapacity(driver, load);
    var evidence = evidenceContext(load, driver, proof, settlement, safety, exception, capacity);
    var driverRoute = driver ? driver.profileRoute : "/drivers/";
    var driverPortrait = driver ? driver.portrait : "/assets/images/logo/boflogo-original.png";
    var driverName = driver ? driver.name : load.driverId;

    return [
      '<article class="operations-record-card is-' + tone + '" id="' + esc(load.id.toLowerCase()) + '">',
      '  <div class="operations-record-top">',
      '    <div>',
      '      <p class="eyebrow">' + esc(load.id) + ' / ' + esc(load.label) + '</p>',
      '      <h3>' + esc(load.origin) + ' to ' + esc(load.destination) + '</h3>',
      '      <p>' + esc(load.releaseDecision) + '</p>',
      '    </div>',
      '    <strong class="operations-release-badge">' + esc(releaseLabel(load)) + '</strong>',
      '  </div>',
      '  <div class="operations-driver-strip">',
      '    <a href="' + esc(driverRoute) + '"><img src="' + esc(driverPortrait) + '" alt="' + esc(driverName) + ' driver portrait" loading="lazy" decoding="async"></a>',
      '    <div><span>Driver</span><strong>' + esc(load.driverId) + ' / ' + esc(driverName) + '</strong><small>' + esc(unit ? unit.label : "No active unit") + '</small></div>',
      '  </div>',
      '  <div class="operations-status-grid">',
      '    ' + statusLabel("Dispatch", load.dispatchStatus),
      '    ' + statusLabel("Safety", load.safetyStatus),
      '    ' + statusLabel("Proof", load.proofStatus),
      '    ' + statusLabel("Settlement", load.settlementStatus),
      '  </div>',
      '  <dl class="operations-record-meta">',
      '    <div><dt>Proof packet</dt><dd>' + esc(proofText) + '</dd></div>',
      '    <div><dt>Settlement</dt><dd>' + esc(settlementText) + '</dd></div>',
      '    <div><dt>Exception owner</dt><dd>' + esc(exceptionText) + '</dd></div>',
      '    <div><dt>Capability</dt><dd>' + esc(capacity.score) + ' score / ' + esc(capacity.hos) + '</dd></div>',
      '    <div><dt>Driver pay profile</dt><dd>' + esc(payProfile ? payProfile.workerClassification + " / " + payProfile.payMethod + " / " + payProfile.rateLabel : "No pay profile attached") + '</dd></div>',
      '    <div><dt>Net after driver pay</dt><dd>' + esc(payProfile ? money(payProfile.estimatedNetRevenue) + " after " + money(payProfile.estimatedPay) + " driver pay" : "No finance bridge attached") + '</dd></div>',
      '    <div><dt>HOS available / ELD</dt><dd>' + esc(capacity.hos) + ' / ' + esc(capacity.eld) + '</dd></div>',
      '    <div><dt>Ready again</dt><dd>' + esc(capacity.readyAgain) + '</dd></div>',
      '    <div><dt>Equipment gate</dt><dd>' + esc(capacity.equipment) + '</dd></div>',
      '    <div><dt>' + esc(evidence.label) + '</dt><dd>' + esc(evidence.value) + '</dd></div>',
      '  </dl>',
      '  <details class="operations-clearance-details">',
      '    <summary>Open reason and clearance path</summary>',
      '    ' + renderClearanceSteps(clearanceSteps(load, driver, proof, settlement, safety, exception, capacity)),
      evidence.image ? '    <figure class="operations-securement-proof"><img src="' + esc(evidence.image) + '" alt="' + esc(evidence.label) + '" loading="lazy" decoding="async"><figcaption>' + esc(evidence.caption) + '</figcaption></figure>' : '',
      '  </details>',
      '  <div class="operations-record-actions">',
      '    <a href="/operations-record/#' + esc(load.id.toLowerCase()) + '">Open record</a>',
      '    <a href="' + esc(driverRoute) + '">Driver file</a>',
      '    <a href="/settlements/#canonical-settlement-records">Settlement context</a>',
      '  </div>',
      '</article>'
    ].join("");
  }

  function renderTable(data, maps) {
    var rows = (data.loads || []).map(function (load) {
      var driver = maps.drivers[load.driverId];
      var exception = load.exceptionIds && load.exceptionIds.length ? load.exceptionIds.join(", ") : "None";
      return [
        load.id,
        driver ? driver.name : load.driverId,
        load.dispatchStatus,
        load.safetyStatus,
        load.proofStatus,
        load.settlementStatus,
        exception,
        releaseLabel(load)
      ];
    });
    tableMount.innerHTML = [
      '<table class="operations-alignment-table">',
      '<thead><tr><th>Load</th><th>Driver</th><th>Dispatch</th><th>Safety</th><th>Proof</th><th>Settlement</th><th>Exception</th><th>Decision</th></tr></thead>',
      '<tbody>',
      rows.map(function (row) {
        return '<tr>' + row.map(function (cell, index) {
          var linked = index === 0 ? '<a href="#' + esc(String(cell).toLowerCase()) + '">' + esc(cell) + '</a>' : esc(cell);
          return '<td>' + linked + '</td>';
        }).join("") + '</tr>';
      }).join(""),
      '</tbody></table>'
    ].join("");
  }

  function render() {
    var data = state.data;
    var maps = lookups(data);
    var loads = data.loads || [];
    var visible = state.filter === "all" ? loads : loads.filter(function (load) {
      if (state.filter === "Ready") return releaseTone(load) === "ready";
      if (state.filter === "Blocked") return releaseTone(load) === "blocked";
      if (state.filter === "Review") return load.dispatchStatus === "Review" || load.proofStatus === "Review";
      if (state.filter === "At Risk") return load.dispatchStatus === "At Risk";
      return true;
    });
    renderSummary(data);
    recordMount.innerHTML = visible.length
      ? visible.map(function (load) { return renderCard(load, maps); }).join("")
      : '<article class="operations-loading-card">No records match this filter.</article>';
    renderTable(data, maps);
  }

  summaryMount.addEventListener("click", function (event) {
    var button = event.target.closest("[data-operations-filter]");
    if (!button || !summaryMount.contains(button)) return;
      state.filter = button.getAttribute("data-operations-filter") || "all";
      render();
  });

  (window.BOFDataLoader ? window.BOFDataLoader.load(DATA_URL) : fetch(DATA_URL, { credentials: "same-origin" }).then(function (response) {
    if (!response.ok) throw new Error("Unable to load canonical operations records.");
    return response.json();
  }))
    .then(function (data) {
      if (window.BOFDemoState && window.BOFDemoState.apply) data = window.BOFDemoState.apply(data);
      state.data = data;
      render();
    })
    .catch(function (error) {
      summaryMount.innerHTML = '<span><strong>Offline</strong>Records unavailable</span>';
      recordMount.innerHTML = '<article class="operations-loading-card is-error">' + esc(error.message) + '</article>';
    });
})();
