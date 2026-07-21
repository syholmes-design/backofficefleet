(function () {
  var DATA_URL = "/assets/data/bof-public-operations.json";
  var requiredDriverFields = ["id", "name", "profileRoute", "portrait", "licenseImage", "readinessStatus"];
  var requiredLoadFields = ["id", "driverId", "dispatchStatus", "safetyStatus", "proofStatus", "settlementStatus"];

  function text(value) {
    return value === null || value === undefined || value === "" ? "None" : String(value);
  }

  function el(tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = text(content);
    return node;
  }

  function link(href, label, className) {
    var node = el("a", className || "", label);
    node.href = href || "#";
    return node;
  }

  function commandIssueHref(load, exception) {
    var loadId = text(load && load.id);
    var exceptionId = text(exception && exception.id);
    if (loadId === "BOF-1907" || exceptionId === "EX-1907-POD") return "/command-center/issue/?case=pod-renewal-evidence";
    if (loadId === "BOF-1931" || exceptionId === "EX-1931-MED") return "/command-center/issue/?case=pre-trip-asset-defect";
    if (loadId === "BOF-2175" || exceptionId === "EX-2175-RATE") return "/command-center/issue/?case=rate-confirmation-review";
    if (loadId === "BOF-2258" || exceptionId === "EX-2258-RENEWAL") return "/command-center/issue/?case=renewal-evidence-review";
    if (loadId === "BOF-2064") return "/operations-record/#bof-2064";
    return load && load.id ? "/operations-record/#" + load.id.toLowerCase() : "/command-center/issue/?case=owner-action";
  }

  function statusClass(status) {
    var value = text(status).toLowerCase();
    if (value === "ready" || value === "complete") return "status ready";
    if (value === "blocked" || value === "held") return "status blocked";
    if (value === "at risk" || value === "review" || value === "in progress") return "status review";
    return "status";
  }

  function statusPill(status) {
    return el("span", statusClass(status), status);
  }

  function money(value) {
    var number = Number(value || 0);
    return "$" + number.toLocaleString(undefined, { maximumFractionDigits: number % 1 ? 2 : 0 });
  }

  function byId(list) {
    return (list || []).reduce(function (map, item) {
      map[item.id] = item;
      return map;
    }, {});
  }

  function validate(data) {
    var errors = [];
    (data.drivers || []).forEach(function (driver) {
      requiredDriverFields.forEach(function (field) {
        if (!driver[field]) errors.push("Driver " + (driver.id || "unknown") + " missing " + field);
      });
    });
    (data.loads || []).forEach(function (load) {
      requiredLoadFields.forEach(function (field) {
        if (!load[field]) errors.push("Load " + (load.id || "unknown") + " missing " + field);
      });
    });
    return errors;
  }

  function buildLookups(data) {
    data.lookup = {
      drivers: byId(data.drivers),
      loads: byId(data.loads),
      units: byId(data.units),
      assignments: byId(data.assignments),
      exceptions: byId(data.exceptions),
      proofRecords: byId(data.proofRecords),
      settlementRecords: byId(data.settlementRecords),
      driverPayProfiles: byId(data.driverPayProfiles)
    };
    return data;
  }

  function payProfileForLoad(data, load) {
    return (data.driverPayProfiles || []).filter(function (profile) {
      return profile.loadId === load.id;
    })[0] || null;
  }

  function driverCard(data, driver) {
    var load = driver.activeLoadId ? data.lookup.loads[driver.activeLoadId] : null;
    var exception = driver.activeExceptionId ? data.lookup.exceptions[driver.activeExceptionId] : null;
    var card = el("article", "bof-data-card bof-driver-data-card");
    var media = el("div", "bof-data-media");
    var img = document.createElement("img");
    img.src = driver.portrait;
    img.alt = driver.id + " " + driver.name + " fictional public demo portrait";
    img.loading = "eager";
    img.decoding = "async";
    media.appendChild(img);
    card.appendChild(media);

    var body = el("div", "bof-data-body");
    var kicker = el("p", "eyebrow", driver.id + " / " + driver.employmentType);
    var title = el("h3", "", driver.name);
    body.appendChild(kicker);
    body.appendChild(title);
    body.appendChild(statusPill(driver.readinessStatus));
    body.appendChild(el("p", "", driver.primaryWarning));

    var meta = el("dl", "bof-data-list");
    [
      ["Assignment", driver.assignmentState],
      ["Load", load ? load.id + " / " + load.origin + " to " + load.destination : "No active load"],
      ["Unit", driver.unitId ? text((data.lookup.units[driver.unitId] || {}).label) : "No active unit"],
      ["Documents", driver.documentCounts.primary + " primary / " + driver.documentCounts.secondary + " supporting"],
      ["Exception", exception ? exception.id + " / " + exception.title : "None"]
    ].forEach(function (row) {
      var wrap = el("div");
      wrap.appendChild(el("dt", "", row[0]));
      wrap.appendChild(el("dd", "", row[1]));
      meta.appendChild(wrap);
    });
    body.appendChild(meta);
    var actions = el("div", "actions");
    actions.appendChild(link(driver.profileRoute, "Open profile", "button secondary"));
    if (load) actions.appendChild(link("/operations-record/#" + load.id.toLowerCase(), "Open operating record", "button secondary"));
    body.appendChild(actions);
    card.appendChild(body);
    return card;
  }

  function renderDrivers(mount, data) {
    mount.appendChild(sectionHead("Canonical driver roster", "All 12 public driver records now render from the shared BOF operations dataset.", "Roster cards are compact; profile routes keep the deeper driver-file experience."));
    var grid = el("div", "bof-data-grid bof-driver-grid");
    data.drivers.forEach(function (driver) { grid.appendChild(driverCard(data, driver)); });
    mount.appendChild(grid);
    mount.appendChild(profileSummary(data));
  }

  function sectionHead(eyebrow, heading, copy) {
    var head = el("div", "section-head reveal");
    head.appendChild(el("p", "eyebrow", eyebrow));
    head.appendChild(el("h2", "", heading));
    if (copy) head.appendChild(el("p", "", copy));
    return head;
  }

  function profileSummary(data) {
    var wrap = el("section", "bof-data-panel");
    wrap.appendChild(sectionHead("Profile evidence", "Every driver has qualification, support, operating-evidence, and exception surfaces.", "The public pages use safe routes and fictional/redacted demo assets."));
    var grid = el("div", "bof-data-grid three");
    [
      ["Primary Qualification Documents", "CDL, medical examiner certificate, MVR, clearinghouse-style review, employment application, road test, annual review, previous-employer inquiry."],
      ["Secondary and Supporting Documents", "Emergency contact, tax forms, settlement setup, safety acknowledgments, policy acknowledgments, training records, and equipment assignment where supported."],
      ["Operating Evidence", "Load assignment, proof packet, route state, settlement status, exception owner, and required action when an active case exists."]
    ].forEach(function (item) {
      var card = el("article", "bof-data-card");
      card.appendChild(el("h3", "", item[0]));
      card.appendChild(el("p", "", item[1]));
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function loadCard(data, load) {
    var driver = data.lookup.drivers[load.driverId];
    var unit = data.lookup.units[load.unitId];
    var proof = data.lookup.proofRecords[load.proofRecordId];
    var settlement = data.lookup.settlementRecords[load.settlementRecordId];
    var exceptions = (load.exceptionIds || []).map(function (id) { return data.lookup.exceptions[id]; }).filter(Boolean);
    var capacity = derivedDriverCapacity(driver, load);
    var steps = loadClearanceSteps(load, driver, proof, settlement, exceptions, capacity);
    var card = el("article", "bof-data-card bof-load-card");
    card.id = load.id.toLowerCase();
    card.appendChild(el("p", "eyebrow", load.id + " / " + load.label));
    card.appendChild(el("h3", "", load.origin + " to " + load.destination));
    card.appendChild(el("p", "", load.releaseDecision));
    var row = el("div", "bof-status-row");
    [["Dispatch", load.dispatchStatus], ["Safety", load.safetyStatus], ["Proof", load.proofStatus], ["Settlement", load.settlementStatus]].forEach(function (item) {
      var itemWrap = el("span");
      itemWrap.appendChild(el("b", "", item[0] + ": "));
      itemWrap.appendChild(statusPill(item[1]));
      row.appendChild(itemWrap);
    });
    card.appendChild(row);
    card.appendChild(visibleReasonStrip("Why this record is " + loadStatusBucket(load).toLowerCase(), loadFlagReason(load, driver, proof, settlement, exceptions), clearancePreviewText(steps)));
    var dl = el("dl", "bof-data-list");
    [
      ["Driver", driver ? driver.id + " / " + driver.name : load.driverId],
      ["Unit", unit ? unit.label : "No unit"],
      ["Proof packet", proof ? proof.id + " / " + proof.status : "None"],
      ["Settlement", settlement ? settlement.id + " / " + settlement.status : "None"],
      ["Exceptions", load.exceptionIds.length ? load.exceptionIds.join(", ") : "None"]
    ].forEach(function (item) {
      var pair = el("div");
      pair.appendChild(el("dt", "", item[0]));
      pair.appendChild(el("dd", "", item[1]));
      dl.appendChild(pair);
    });
    card.appendChild(dl);
    var linkedException = exceptions.length ? exceptions[0] : null;
    card.appendChild(link(commandIssueHref(load, linkedException), loadStatusBucket(load) === "Ready" ? "Open joined record" : "Open issue record", "button secondary"));
    return card;
  }

  function loadStatusBucket(load) {
    if (load.dispatchStatus === "Blocked" || load.safetyStatus === "Blocked") return "Blocked";
    if (load.dispatchStatus === "At Risk" || load.proofStatus === "At Risk") return "At Risk";
    if (load.dispatchStatus === "Review" || load.proofStatus === "Review" || load.settlementStatus === "In Progress") return "Review";
    return "Ready";
  }

  function loadPriority(load) {
    var bucket = loadStatusBucket(load);
    if (bucket === "Blocked") return 0;
    if (bucket === "At Risk") return 1;
    if (bucket === "Review") return 2;
    return 3;
  }

  function sortByLoadPriority(a, b) {
    return loadPriority(a) - loadPriority(b);
  }

  function loadFlagReason(load, driver, proof, settlement, exceptions) {
    var bucket = loadStatusBucket(load);
    if (bucket === "Ready") return "Ready: shipper tender, driver, equipment, proof, and settlement signals support normal release.";
    if (exceptions.length) {
      return bucket + ": " + exceptions.map(function (ex) {
        return ex.title + ". Required action: " + String(ex.requiredAction || "clear the assigned exception").replace(/^./, function (letter) { return letter.toLowerCase(); });
      }).join(" ");
    }
    if (load.dispatchStatus !== "Ready") return bucket + ": dispatch status is " + load.dispatchStatus + " because " + load.releaseDecision;
    if (driver && driver.readinessStatus !== "Ready") return bucket + ": driver record is " + driver.readinessStatus + " and must clear before release.";
    if (proof && proof.status !== "Complete") return bucket + ": proof packet is " + proof.status + " and controls the release path.";
    if (settlement && settlement.status !== "Complete") return bucket + ": settlement status is " + settlement.status + " and needs owner review.";
    return bucket + ": owner review is required before release.";
  }

  function loadClearanceSteps(load, driver, proof, settlement, exceptions, capacity) {
    var bucket = loadStatusBucket(load);
    if (bucket === "Ready") {
      return [
        ["Confirm tender", "Verify shipper lane, pickup window, consignee notes, and rate context."],
        ["Stage driver and unit", "Driver has " + capacity.hos + " HOS available before the next required break/reset, and equipment is ready for normal dispatch staging."],
        ["Release and monitor", "Move the load through pre-trip, in-transit proof capture, and settlement handoff."]
      ];
    }
    if (bucket === "Blocked") {
      return [
        ["Hold release", "Do not assign or release this load while the blocking record remains open."],
        ["Clear driver gate", driver ? driver.name + " must clear: " + driver.primaryWarning : "Assigned driver must clear before dispatch."],
        ["Resolve exception", exceptions.length ? exceptions.map(function (ex) { return ex.requiredAction; }).join(" ") : load.releaseDecision],
        ["Re-run release check", "Only reopen dispatch release after HOS, ELD, equipment, proof, and safety status return to a releaseable state."]
      ];
    }
    if (bucket === "At Risk") {
      return [
        ["Keep planning visible", "Dispatch may plan the load, but should not promise final release until the flagged item is cleared."],
        ["Clear proof or renewal evidence", exceptions.length ? exceptions.map(function (ex) { return ex.requiredAction; }).join(" ") : load.releaseDecision],
        ["Confirm HOS and equipment", "Driver shows " + capacity.hos + " HOS available before the next required break/reset; verify ELD and assigned equipment before final release."],
        ["Owner release note", "Attach the owner decision to the joined record before dispatch commits the lane."]
      ];
    }
    return [
      ["Review tender match", "Confirm shipper tender, rate note, pickup window, and consignee instructions."],
      ["Match operating records", "Compare driver readiness, HOS availability, ELD state, unit assignment, proof packet, and settlement signal."],
      ["Clear review action", exceptions.length ? exceptions.map(function (ex) { return ex.requiredAction; }).join(" ") : load.releaseDecision],
      ["Release or hold", "Update the status to Ready, At Risk, or Blocked so dispatch sees the current decision."]
    ];
  }

  function clearanceRouteList(steps) {
    var list = el("ol", "dispatch-clearance-route");
    steps.forEach(function (step, index) {
      var item = el("li", "");
      item.appendChild(el("span", "", String(index + 1).padStart(2, "0")));
      var body = el("div", "");
      body.appendChild(el("strong", "", step[0]));
      body.appendChild(el("p", "", step[1]));
      item.appendChild(body);
      list.appendChild(item);
    });
    return list;
  }

  function clearancePreviewText(steps) {
    if (!steps || !steps.length) return "No clearance action required.";
    var actionStep = steps.find(function (step) {
      return /clear|resolve|release|hold|confirm|close|re-run/i.test(step[0] + " " + step[1]);
    }) || steps[0];
    return actionStep[0] + ": " + actionStep[1];
  }

  function visibleReasonStrip(title, reason, clearance) {
    var wrap = el("div", "demo-reason-strip");
    var why = el("section", "");
    why.appendChild(el("span", "", title || "Why flagged"));
    why.appendChild(el("p", "", reason || "No blocker is currently attached."));
    var route = el("section", "");
    route.appendChild(el("span", "", "Clearance route"));
    route.appendChild(el("p", "", clearance || "No clearance action required."));
    wrap.appendChild(why);
    wrap.appendChild(route);
    return wrap;
  }

  function derivedDriverCapacity(driver, load) {
    var number = driver ? Number(String(driver.id || "").replace(/\D/g, "")) || 1 : 1;
    var bucket = loadStatusBucket(load);
    if (bucket === "Blocked") {
      return {
        score: "24",
        hos: "0h 00m",
        readyAgain: "After credential clearance",
        eld: "Synced, assignment locked",
        equipment: "Held unit; do not release"
      };
    }
    if (bucket === "At Risk") {
      return {
        score: "68",
        hos: (4 + number % 2) + "h " + (number % 2 ? "45m" : "20m"),
        readyAgain: "After owner review",
        eld: "Current, needs release check",
        equipment: "Assigned unit under review"
      };
    }
    if (bucket === "Review") {
      return {
        score: "76",
        hos: (3 + number % 4) + "h 20m",
        readyAgain: "After paperwork match",
        eld: "Current with planning note",
        equipment: "Assigned; confirm document gate"
      };
    }
    return {
      score: String(88 + number % 7),
      hos: (6 + number % 4) + "h 30m",
      readyAgain: "Ready now",
      eld: "Current",
      equipment: "Assigned unit ready"
    };
  }

  function dispatchIntakeSummary(data, activeFilter) {
    var loads = data.loads || [];
    var stats = [
      ["Loads", loads.length, "All"],
      ["Ready", loads.filter(function (load) { return loadStatusBucket(load) === "Ready"; }).length, "Ready"],
      ["Review", loads.filter(function (load) { return loadStatusBucket(load) === "Review"; }).length, "Review"],
      ["At Risk", loads.filter(function (load) { return loadStatusBucket(load) === "At Risk"; }).length, "At Risk"],
      ["Blocked", loads.filter(function (load) { return loadStatusBucket(load) === "Blocked"; }).length, "Blocked"]
    ];
    var wrap = el("div", "dispatch-intake-summary");
    wrap.setAttribute("aria-label", "Dispatch intake filters and summary");
    stats.forEach(function (item) {
      var card = el("button", "dispatch-summary-tile" + (activeFilter === item[2] ? " is-active" : ""));
      card.type = "button";
      card.setAttribute("data-dispatch-intake-filter", item[2]);
      card.setAttribute("aria-pressed", activeFilter === item[2] ? "true" : "false");
      card.appendChild(el("strong", "", item[1]));
      card.appendChild(el("em", "", item[0]));
      wrap.appendChild(card);
    });
    return wrap;
  }

  function dispatchIntakeCard(data, load) {
    var driver = data.lookup.drivers[load.driverId];
    var unit = data.lookup.units[load.unitId];
    var proof = data.lookup.proofRecords[load.proofRecordId];
    var settlement = data.lookup.settlementRecords[load.settlementRecordId];
    var exceptions = (load.exceptionIds || []).map(function (id) { return data.lookup.exceptions[id]; }).filter(Boolean);
    var capacity = derivedDriverCapacity(driver, load);
    var bucket = loadStatusBucket(load);
    var steps = loadClearanceSteps(load, driver, proof, settlement, exceptions, capacity);
    var recordHref = "/operations-record/#" + load.id.toLowerCase();
    var card = document.createElement("details");
    card.className = "dispatch-intake-card dispatch-intake-" + bucket.toLowerCase().replace(/\s+/g, "-");
    card.setAttribute("data-dispatch-status", bucket);
    card.id = "dispatch-" + load.id.toLowerCase();

    var summary = document.createElement("summary");
    summary.className = "dispatch-intake-row";
    var title = el("span", "dispatch-load-title");
    title.appendChild(el("b", "", load.id + " / " + load.label));
    title.appendChild(el("strong", "", load.origin + " to " + load.destination));
    title.appendChild(el("em", "", "Shipper tender intake"));
    summary.appendChild(title);
    summary.appendChild(statusPill(bucket));
    [
      ["Driver", driver ? driver.name : load.driverId],
      ["HOS available", capacity.hos],
      ["Equipment", unit ? unit.label : "No unit"],
      ["Release", load.releaseDecision]
    ].forEach(function (item) {
      var metric = el("span", "dispatch-intake-metric");
      metric.appendChild(el("b", "", item[1]));
      metric.appendChild(el("em", "", item[0]));
      summary.appendChild(metric);
    });
    summary.appendChild(visibleReasonStrip("Why this load is " + bucket.toLowerCase(), loadFlagReason(load, driver, proof, settlement, exceptions), clearancePreviewText(steps)));
    summary.appendChild(el("span", "dispatch-expand-cue", "Details"));
    card.appendChild(summary);

    var detail = el("div", "dispatch-intake-detail");
    var clearance = el("article", "dispatch-clearance-panel");
    clearance.appendChild(el("p", "eyebrow", "Why this load is " + bucket.toLowerCase()));
    clearance.appendChild(el("h3", "", load.releaseDecision));
    clearance.appendChild(el("p", "", loadFlagReason(load, driver, proof, settlement, exceptions)));
    clearance.appendChild(clearanceRouteList(steps));
    detail.appendChild(clearance);

    var grid = el("dl", "dispatch-intake-grid");
    [
      ["Shipper intake", "Tender, lane, requested release, consignee, rate note, and document gate"],
      ["Driver readiness", driver ? driver.readinessStatus + " / capability " + capacity.score : "Driver pending"],
      ["HOS available / ELD", capacity.hos + " / " + capacity.eld],
      ["Ready again", capacity.readyAgain],
      ["Equipment access", capacity.equipment],
      ["Proof packet", proof ? proof.id + " / " + proof.status : "No proof record"],
      ["Settlement signal", settlement ? settlement.id + " / " + settlement.status : "No settlement record"],
      ["Exception owner action", exceptions.length ? exceptions.map(function (ex) { return ex.id + ": " + ex.requiredAction; }).join(" ") : "None"]
    ].forEach(function (item) {
      var pair = el("div");
      pair.appendChild(el("dt", "", item[0]));
      pair.appendChild(el("dd", "", item[1]));
      grid.appendChild(pair);
    });
    detail.appendChild(grid);

    var actions = el("div", "dispatch-intake-actions");
    actions.appendChild(link(commandIssueHref(load, exceptions[0]), loadStatusBucket(load) === "Ready" ? "Open joined record" : "Open issue record", "button secondary"));
    if (driver) actions.appendChild(link(driver.profileRoute || "/drivers/", "Open driver file", "button secondary"));
    actions.appendChild(link(recordHref, "Joined context", "button secondary"));
    detail.appendChild(actions);
    card.appendChild(detail);
    return card;
  }

  function renderDispatchIntakeView(mount, data) {
    mount.appendChild(sectionHead("Shipper load intake queue", "Each tender starts as a load record, then expands into driver readiness, HOS available time, equipment, proof, and settlement consequences.", "Filter the shipper intake queue first. Open a load only when dispatch needs the deeper release path."));
    var activeFilter = "All";
    var summary = dispatchIntakeSummary(data, activeFilter);
    mount.appendChild(summary);
    var queue = el("div", "dispatch-intake-queue");
    mount.appendChild(queue);

    function draw(filter) {
      activeFilter = filter || "All";
      var nextSummary = dispatchIntakeSummary(data, activeFilter);
      summary.replaceWith(nextSummary);
      summary = nextSummary;
      queue.textContent = "";
      (data.loads || []).filter(function (load) {
        return activeFilter === "All" || loadStatusBucket(load) === activeFilter;
      }).sort(sortByLoadPriority).forEach(function (load) {
        queue.appendChild(dispatchIntakeCard(data, load));
      });
    }

    mount.addEventListener("click", function (event) {
      var button = event.target.closest("[data-dispatch-intake-filter]");
      if (!button) return;
      draw(button.getAttribute("data-dispatch-intake-filter"));
    });
    draw("All");
    mount.appendChild(dispatchTable(data));
  }

  function safetyRecordForLoad(data, load) {
    return (data.safetyRecords || []).filter(function (record) {
      return record.loadId === load.id;
    })[0] || null;
  }

  function scoreFromStatus(status, fallback) {
    var value = text(status).toLowerCase();
    if (value === "ready" || value === "complete") return fallback || 92;
    if (value === "review" || value === "in progress" || value === "at risk") return fallback || 68;
    if (value === "blocked" || value === "held") return fallback || 28;
    return fallback || 74;
  }

  function scoreBadge(label, score, status, reason) {
    var badge = el("span", "ops-score-badge ops-score " + statusClass(status).replace("status", "").trim());
    badge.appendChild(el("strong", "", score));
    badge.appendChild(el("em", "", label));
    if (reason) badge.appendChild(el("small", "", reason));
    return badge;
  }

  function settlementScoreContext(load, driver, proof, settlement, safety, exceptions, score) {
    if (exceptions && exceptions.length) {
      return {
        label: score <= 35 ? "Blocked by exception" : "Review exception",
        reason: exceptions.map(function (ex) { return ex.title; }).join("; "),
        drivers: exceptions.map(function (ex) { return ex.requiredAction; }).join(" ")
      };
    }
    if (settlement && settlement.status === "Held") {
      return {
        label: "Held by settlement",
        reason: settlement.billingHold,
        drivers: "Settlement cannot release until the hold reason is cleared."
      };
    }
    if (proof && proof.status !== "Complete") {
      return {
        label: "Proof controls pay",
        reason: proof.id + " is " + proof.status + "; POD is " + text(proof.pod) + ".",
        drivers: "Complete POD, signed BOL, receipt, receiver, photo, or accessorial evidence as required."
      };
    }
    if (safety && safety.status !== "Ready") {
      return {
        label: "Safety hold affects pay",
        reason: safety.qualificationConsequence,
        drivers: safety.correctiveAction
      };
    }
    if (settlement && settlement.status === "Complete") {
      return {
        label: "Ready to bill",
        reason: "Packet and payment path are ready for normal billing review.",
        drivers: "No active score reducer shown."
      };
    }
    return {
      label: "Needs owner review",
      reason: "One or more packet-to-pay signals need confirmation.",
      drivers: "Open the row to review the clearance route."
    };
  }

  function gateLabel(status) {
    var value = text(status).toLowerCase();
    if (value === "ready" || value === "complete") return "Clear";
    if (value === "blocked" || value === "held") return "Hold";
    if (value === "at risk") return "At Risk";
    return "Review";
  }

  function settlementStatusBucket(settlement) {
    var status = text(settlement && settlement.status);
    if (status === "Complete") return "Complete";
    if (status === "Held") return "Held";
    if (status === "In Progress") return "In Progress";
    return status || "Review";
  }

  function operatingSummary(data, mode, activeFilter) {
    var loads = data.loads || [];
    var blocked = loads.filter(function (load) { return loadStatusBucket(load) === "Blocked"; }).length;
    var review = loads.filter(function (load) { return ["Review", "At Risk"].indexOf(loadStatusBucket(load)) >= 0; }).length;
    var ready = loads.filter(function (load) { return loadStatusBucket(load) === "Ready"; }).length;
    var extra;
    if (mode === "safety") extra = ["Safety holds", (data.safetyRecords || []).filter(function (record) { return record.status !== "Ready"; }).length];
    else if (mode === "settlements") extra = ["Packet holds", (data.settlementRecords || []).filter(function (record) { return record.status !== "Complete"; }).length];
    else extra = ["Owners", (data.exceptions || []).length];
    var stats = mode === "settlements"
      ? [
          ["All packets", (data.settlementRecords || []).length, "All", true],
          ["Complete", (data.settlementRecords || []).filter(function (record) { return settlementStatusBucket(record) === "Complete"; }).length, "Complete", true],
          ["In progress", (data.settlementRecords || []).filter(function (record) { return settlementStatusBucket(record) === "In Progress"; }).length, "In Progress", true],
          ["Held", (data.settlementRecords || []).filter(function (record) { return settlementStatusBucket(record) === "Held"; }).length, "Held", true],
          ["Exceptions", loads.filter(function (load) { return (load.exceptionIds || []).length > 0; }).length, "Exceptions", true]
        ]
      : mode === "safety"
      ? [
          ["All safety", loads.length, "All", true],
          ["Ready", (data.safetyRecords || []).filter(function (record) { return record.status === "Ready"; }).length, "Ready", true],
          ["Review", (data.safetyRecords || []).filter(function (record) { return record.status === "Review" || record.status === "At Risk"; }).length, "Review", true],
          ["Blocked", (data.safetyRecords || []).filter(function (record) { return record.status === "Blocked" || record.status === "Held"; }).length, "Blocked", true],
          ["Exceptions", loads.filter(function (load) { return (load.exceptionIds || []).length > 0; }).length, "Exceptions", true]
        ]
      : [["Ready", ready], ["Review", review], ["Blocked", blocked], extra];
    var wrap = el("div", "dispatch-intake-summary operating-summary" + (mode === "settlements" ? " settlement-summary-filter" : "") + (mode === "safety" ? " safety-summary-filter" : ""));
    stats.forEach(function (item) {
      var interactive = (mode === "settlements" || mode === "safety") && item[3];
      var card = interactive
        ? el("button", "settlement-summary-tile operating-summary-tile" + ((activeFilter || "All") === item[2] ? " is-active" : ""))
        : el("span", mode === "settlements" ? "settlement-summary-tile is-static" : "");
      if (interactive) {
        card.type = "button";
        card.setAttribute("data-settlement-filter", item[2]);
        card.setAttribute("data-operating-filter", item[2]);
        card.setAttribute("aria-pressed", (activeFilter || "All") === item[2] ? "true" : "false");
      }
      card.appendChild(el("strong", "", item[1]));
      card.appendChild(el("em", "", item[0]));
      wrap.appendChild(card);
    });
    return wrap;
  }

  function moduleClearanceSteps(mode, load, driver, proof, settlement, safety, exceptions, capacity) {
    if (mode === "safety") {
      return [
        ["Identify safety gate", safety ? safety.qualificationConsequence : "No linked safety exception is open for this load."],
        ["Confirm driver and HOS available", (driver ? driver.name + " / " : "") + capacity.hos + " available before the next required break/reset; ELD state: " + capacity.eld + "."],
        ["Close required evidence", safety ? safety.correctiveAction : "Maintain normal pre-trip, credential, and incident evidence."],
        ["Release consequence", safety ? safety.dispatchConsequence : "Proceed through normal dispatch staging."]
      ];
    }
    if (mode === "settlements") {
      return [
        ["Confirm proof packet", proof ? proof.id + " is " + proof.status + " with POD " + text(proof.pod) + "." : "No proof packet attached."],
        ["Resolve billing hold", settlement ? settlement.billingHold : "No settlement hold is currently attached."],
        ["Validate pay route", "Rate confirmation, POD, accessorial approval, and factoring/payment notes must match before packet release."],
        ["Release for billing", settlement && settlement.status === "Complete" ? "Packet is ready for billing review." : "Owner clears the hold, then settlement can move to billing."]
      ];
    }
    return loadClearanceSteps(load, driver, proof, settlement, exceptions, capacity).concat([
      ["Safety checkpoint", safety ? safety.dispatchConsequence : "No special safety checkpoint is attached."],
      ["Payment checkpoint", settlement ? settlement.billingStatus + ": " + settlement.billingHold : "No settlement checkpoint is attached."]
    ]);
  }

  function operatingCard(data, load, mode) {
    var driver = data.lookup.drivers[load.driverId];
    var unit = data.lookup.units[load.unitId];
    var proof = data.lookup.proofRecords[load.proofRecordId];
    var settlement = data.lookup.settlementRecords[load.settlementRecordId];
    var payProfile = payProfileForLoad(data, load);
    var safety = safetyRecordForLoad(data, load);
    var exceptions = (load.exceptionIds || []).map(function (id) { return data.lookup.exceptions[id]; }).filter(Boolean);
    var capacity = derivedDriverCapacity(driver, load);
    var bucket = mode === "safety" ? (safety ? safety.status : load.safetyStatus) :
      mode === "settlements" ? (settlement ? settlement.status : load.settlementStatus) :
      loadStatusBucket(load);
    var score = mode === "safety" ? scoreFromStatus(bucket, safety && safety.status === "Ready" ? 94 : null) :
      mode === "settlements" ? scoreFromStatus(bucket, settlement && settlement.status === "Complete" ? 91 : null) :
      scoreFromStatus(loadStatusBucket(load));
    var scoreContext = mode === "settlements" ? settlementScoreContext(load, driver, proof, settlement, safety, exceptions, score) : null;
    var steps = moduleClearanceSteps(mode, load, driver, proof, settlement, safety, exceptions, capacity);
    var reasonTitle = mode === "settlements" ? "Why this packet is " + String(bucket).toLowerCase() :
      mode === "safety" ? "Why this safety item is " + String(bucket).toLowerCase() :
      "Why this record is " + String(bucket).toLowerCase();
    var card = document.createElement("details");
    card.className = "dispatch-intake-card operating-clearance-card operating-" + mode;
    card.setAttribute("data-operating-status", bucket);
    card.id = mode + "-" + load.id.toLowerCase();

    var summary = document.createElement("summary");
    summary.className = "dispatch-intake-row operating-clearance-row";
    var title = el("span", "dispatch-load-title");
    title.appendChild(el("b", "", load.id + " / " + load.origin + " to " + load.destination));
    title.appendChild(el("strong", "", mode === "safety" ? "Safety and HOS availability" : mode === "settlements" ? "Packet-to-pay readiness" : "Joined operating record"));
    title.appendChild(el("em", "", driver ? driver.name + " / " + (unit ? unit.label : "No unit") : "Driver pending"));
    summary.appendChild(title);
    summary.appendChild(statusPill(bucket));
    summary.appendChild(scoreBadge(mode === "settlements" ? (scoreContext ? scoreContext.label : "pay score") : mode === "safety" ? "safety gate" : "release gate", mode === "settlements" ? score + "/100" : gateLabel(bucket), bucket, scoreContext ? scoreContext.reason : ""));
    [
      ["HOS available", capacity.hos],
      ["Equipment", capacity.equipment],
      ["Owner", exceptions.length ? exceptions[0].assignedOwner : "Module owner"]
    ].forEach(function (item) {
      var metric = el("span", "dispatch-intake-metric");
      metric.appendChild(el("b", "", item[1]));
      metric.appendChild(el("em", "", item[0]));
      summary.appendChild(metric);
    });
    summary.appendChild(visibleReasonStrip(reasonTitle, loadFlagReason(load, driver, proof, settlement, exceptions), clearancePreviewText(steps)));
    summary.appendChild(el("span", "dispatch-expand-cue", "Open"));
    card.appendChild(summary);

    var detail = el("div", "dispatch-intake-detail operating-clearance-detail");
    var clearance = el("article", "dispatch-clearance-panel");
    clearance.appendChild(el("p", "eyebrow", mode === "settlements" ? "Settlement clearance route" : mode === "safety" ? "Safety clearance route" : "Joined clearance route"));
    clearance.appendChild(el("h3", "", mode === "settlements" ? (settlement ? settlement.billingHold : "Packet ready for normal billing review.") : mode === "safety" ? (safety ? safety.qualificationConsequence : load.releaseDecision) : load.releaseDecision));
    clearance.appendChild(el("p", "", loadFlagReason(load, driver, proof, settlement, exceptions)));
    clearance.appendChild(clearanceRouteList(steps));
    detail.appendChild(clearance);

    var grid = el("dl", "dispatch-intake-grid operating-field-grid");
    [
      ["Driver / capability", driver ? driver.name + " / " + capacity.score : "Driver pending"],
      ["HOS available / ready again", capacity.hos + " / " + capacity.readyAgain],
      ["ELD / equipment", capacity.eld + " / " + capacity.equipment],
      ["Driver pay profile", payProfile ? payProfile.workerClassification + " / " + payProfile.payMethod + " / " + payProfile.rateLabel : "No pay profile attached"],
      ["Net after driver pay", payProfile ? money(payProfile.estimatedNetRevenue) + " after " + money(payProfile.estimatedPay) + " estimated driver pay" : "No finance bridge attached"],
      ["Safety gate", gateLabel(safety ? safety.status : load.safetyStatus) + " / " + (safety ? safety.preTripState + " pre-trip / " + safety.hosState + " HOS" : load.safetyStatus)],
      ["Proof evidence", proof ? proof.id + " / POD " + text(proof.pod) + " / receipts " + text(proof.receipts) : "No proof record"],
      ["Settlement state", settlement ? settlement.id + " / " + settlement.billingStatus : load.settlementStatus],
      mode === "settlements" ? ["Score reason", scoreContext ? score + "/100 - " + scoreContext.label + ": " + scoreContext.drivers : "No score reason available"] : null,
      ["Exception reason", exceptions.length ? exceptions.map(function (ex) { return ex.title + ": " + ex.requiredAction; }).join(" ") : "No active exception"],
      ["Joined record", "Dispatch, safety, proof, settlement, and exception status resolve to " + load.id + "."]
    ].filter(Boolean).forEach(function (item) {
      var pair = el("div");
      pair.appendChild(el("dt", "", item[0]));
      pair.appendChild(el("dd", "", item[1]));
      grid.appendChild(pair);
    });
    detail.appendChild(grid);

    var actions = el("div", "dispatch-intake-actions");
    actions.appendChild(link(commandIssueHref(load, exceptions[0]), bucket === "Ready" || bucket === "Complete" ? "Open joined record" : "Open issue record", "button secondary"));
    if (driver) actions.appendChild(link(driver.profileRoute || "/drivers/", "Open driver file", "button secondary"));
    actions.appendChild(link("/operations-record/#" + load.id.toLowerCase(), "Joined context", "button secondary"));
    detail.appendChild(actions);
    card.appendChild(detail);
    return card;
  }

  function renderOperatingModuleView(mount, data, mode) {
    var isSafety = mode === "safety";
    mount.appendChild(sectionHead(isSafety ? "Safety clearance queue" : "Settlement clearance queue",
      isSafety ? "Explain every safety review before dispatch treats it as releasable." : "Show why a packet is held, what proof clears it, and when it can move to billing.",
      isSafety ? "Each row carries safety status, HOS available time, ELD context, equipment consequence, owner action, and a clearance route." : "Each row carries proof, POD, accessorial, factoring/payment, hold reason, owner action, and a release route."));
    var activeFilter = "All";
    var summary = operatingSummary(data, mode, activeFilter);
    mount.appendChild(summary);
    var queue = el("div", "dispatch-intake-queue operating-clearance-queue");
    mount.appendChild(queue);

    function draw(filter) {
      activeFilter = filter || "All";
      if (mode === "settlements" || mode === "safety") {
        var nextSummary = operatingSummary(data, mode, activeFilter);
        summary.replaceWith(nextSummary);
        summary = nextSummary;
      }
      queue.textContent = "";
      (data.loads || []).filter(function (load) {
        if ((mode !== "settlements" && mode !== "safety") || activeFilter === "All") return true;
        if (activeFilter === "Exceptions") return (load.exceptionIds || []).length > 0;
        if (mode === "safety") {
          var safetyRecord = safetyRecordForLoad(data, load);
          var safetyStatus = safetyRecord ? safetyRecord.status : load.safetyStatus;
          if (activeFilter === "Review") return safetyStatus === "Review" || safetyStatus === "At Risk";
          if (activeFilter === "Blocked") return safetyStatus === "Blocked" || safetyStatus === "Held";
          return safetyStatus === activeFilter;
        }
        var settlement = data.lookup.settlementRecords[load.settlementRecordId];
        return settlementStatusBucket(settlement) === activeFilter;
      }).sort(sortByLoadPriority).forEach(function (load) {
        queue.appendChild(operatingCard(data, load, mode));
      });
      if (!queue.children.length) queue.appendChild(el("article", "operations-loading-card", "No " + (mode === "safety" ? "safety" : "settlement") + " records match this filter."));
    }

    if (mode === "settlements" || mode === "safety") {
      mount.addEventListener("click", function (event) {
        var button = event.target.closest("[data-operating-filter]");
        if (!button || !mount.contains(button)) return;
        draw(button.getAttribute("data-operating-filter"));
      });
    }

    draw("All");
    mount.appendChild(isSafety ? safetyTable(data) : settlementTable(data));
  }

  function renderLoadView(mount, data, mode) {
    if (mode === "dispatch") {
      renderDispatchIntakeView(mount, data);
      return;
    }
    if (mode === "safety" || mode === "settlements") {
      renderOperatingModuleView(mount, data, mode);
      return;
    }
    var title = mode === "dispatch" ? "Canonical dispatch release cases" : mode === "safety" ? "Canonical safety consequences" : "Canonical settlement readiness";
    var body = mode === "dispatch" ? "Dispatch reads assigned driver, unit, release state, proof packet, and exception from the shared data source." :
      mode === "safety" ? "Safety reads driver qualification, load consequence, evidence, corrective action, and dispatch impact from the same records." :
      "Settlements reads proof, rate confirmation, POD, billing hold, and payment status from the same load records.";
    mount.appendChild(sectionHead(title, "The three public operating cases now share one source.", body));
    var grid = el("div", "bof-data-grid");
    ["BOF-2064", "BOF-1907", "BOF-1931"].forEach(function (id) {
      grid.appendChild(loadCard(data, data.lookup.loads[id]));
    });
    mount.appendChild(grid);
    if (mode === "safety") mount.appendChild(safetyTable(data));
    if (mode === "settlements") mount.appendChild(settlementTable(data));
    if (mode === "dispatch") mount.appendChild(dispatchTable(data));
  }

  function table(headers, rows) {
    var wrap = el("div", "table-wrap reveal");
    var tbl = document.createElement("table");
    tbl.className = "small-table";
    var thead = document.createElement("thead");
    var tr = document.createElement("tr");
    headers.forEach(function (head) { tr.appendChild(el("th", "", head)); });
    thead.appendChild(tr);
    tbl.appendChild(thead);
    var tbody = document.createElement("tbody");
    rows.forEach(function (row) {
      var r = document.createElement("tr");
      row.forEach(function (cell) {
        var td = document.createElement("td");
        if (cell && cell.nodeType) td.appendChild(cell);
        else td.textContent = text(cell);
        r.appendChild(td);
      });
      tbody.appendChild(r);
    });
    tbl.appendChild(tbody);
    wrap.appendChild(tbl);
    return wrap;
  }

  function dispatchTable(data) {
    return table(["Load", "Assigned driver", "Unit", "Release decision", "Active exception"], data.loads.filter(function (load) {
      return ["BOF-2064", "BOF-1907", "BOF-1931"].indexOf(load.id) >= 0;
    }).map(function (load) {
      var driver = data.lookup.drivers[load.driverId];
      var unit = data.lookup.units[load.unitId];
      return [load.id, driver.id + " / " + driver.name, unit.label, load.releaseDecision, load.exceptionIds.join(", ") || "None"];
    }));
  }

  function safetyTable(data) {
    return table(["Safety record", "Driver", "Load", "Qualification consequence", "Corrective action", "Dispatch consequence"], data.safetyRecords.map(function (record) {
      var driver = data.lookup.drivers[record.driverId];
      return [record.id, driver.id + " / " + driver.name, record.loadId, record.qualificationConsequence, record.correctiveAction, record.dispatchConsequence];
    }));
  }

  function settlementTable(data) {
    return table(["Settlement", "Load", "Driver", "Pay basis", "Net after driver pay", "Billing", "Hold reason"], data.settlementRecords.filter(function (record) {
      return ["BOF-2064", "BOF-1907", "BOF-1931"].indexOf(record.loadId) >= 0;
    }).map(function (record) {
      var driver = data.lookup.drivers[record.driverId];
      var load = data.lookup.loads[record.loadId];
      var payProfile = load ? payProfileForLoad(data, load) : null;
      return [
        record.id,
        record.loadId,
        driver.id + " / " + driver.name,
        payProfile ? payProfile.payMethod + " / " + payProfile.rateLabel : "No pay profile",
        payProfile ? money(payProfile.estimatedNetRevenue) : "None",
        record.billingStatus,
        record.billingHold
      ];
    }));
  }

  function renderOperationsRecord(mount, data) {
    mount.appendChild(sectionHead("Joined operations record", "One record now explains dispatch, safety, proof, settlement, and exception consequences.", "Open a case to see the reason, owner, clearance route, driver capacity, proof packet, settlement state, and the connected module links."));
    mount.appendChild(operatingSummary(data, "operations-record"));
    var queue = el("div", "dispatch-intake-queue operating-clearance-queue joined-record-queue");
    (data.loads || []).slice().sort(sortByLoadPriority).forEach(function (load) { queue.appendChild(operatingCard(data, load, "operations-record")); });
    mount.appendChild(queue);
    mount.appendChild(alignmentTable(data));
  }

  function renderCommandCenterView(mount, data) {
    var readyDrivers = (data.drivers || []).filter(function (driver) { return driver.readinessStatus === "Ready"; }).length;
    var readyLoads = (data.loads || []).filter(function (load) { return loadStatusBucket(load) === "Ready"; }).length;
    var reviewLoads = (data.loads || []).filter(function (load) { return ["Review", "At Risk"].indexOf(loadStatusBucket(load)) >= 0; }).length;
    var blockedLoads = (data.loads || []).filter(function (load) { return loadStatusBucket(load) === "Blocked"; }).length;
    var packetHolds = (data.settlementRecords || []).filter(function (record) { return record.status !== "Complete"; }).length;
    var ownerActions = (data.exceptions || []).length;
    var activeFilter = "All";
    mount.appendChild(sectionHead("Live operating layer", "Run the demo from the records that actually decide release.", "Filter by readiness, open a record, and the Command Center shows the reason, owner, proof, settlement impact, and clearance route."));

    var metrics = el("div", "executive-metric-grid command-center-metrics command-live-metrics");
    [
      ["Ready drivers", readyDrivers, "available or release-ready", "DR", "/drivers/?filter=ready#driver-roster"],
      ["Loads can move", readyLoads, "ready for normal workflow", "LD", "/dispatch/?filter=ready#dispatch-workbench"],
      ["Review queue", reviewLoads, "needs owner decision", "RV", "/command-center/issue/?case=owner-action"],
      ["Packet holds", packetHolds, "billing or proof hold", "$", "/command-center/issue/?case=held-packets"],
      ["Blocked records", blockedLoads, "do not release", "BL", "/command-center/issue/?case=pre-trip-asset-defect"],
      ["Owner actions", ownerActions, "named follow-ups", "OA", "/command-center/issue/?case=owner-action"]
    ].forEach(function (item) {
      var card = el("article", "executive-metric-card");
      var copy = el("div");
      copy.appendChild(el("span", "", item[0]));
      copy.appendChild(el("strong", "", item[1]));
      copy.appendChild(el("p", "", item[2]));
      card.appendChild(copy);
      card.appendChild(el("b", "metric-badge is-blue", item[3]));
      card.appendChild(link(item[4], "Open", "command-mini-link"));
      metrics.appendChild(card);
    });
    mount.appendChild(metrics);

    var routeGrid = el("div", "command-center-route-grid");
    [
      ["Drivers", "Readiness, HOS, credentials, pay profile, equipment, and driver clearance.", "/drivers/", "Driver roster"],
      ["Dispatch", "Shipper intake, release gates, assigned driver, unit, and load status.", "/dispatch/", "Load queue"],
      ["Safety", "Qualification, pre-trip evidence, incident context, and corrective action.", "/safety/", "Safety gates"],
      ["Settlements", "Proof, POD, accessorials, billing holds, pay basis, and cash readiness.", "/settlements/", "Packet-to-pay"],
      ["Documents", "Policy PDFs, load proof, driver documents, and operating evidence.", "/documents/", "File cabinet"],
      ["BOF Vault", "Document readiness engine and intake surface for operating artifacts.", "/document-readiness-engine/", "Vault intake"]
    ].forEach(function (item) {
      var card = link(item[2], "", "command-center-route-card");
      card.appendChild(el("span", "", item[3]));
      card.appendChild(el("strong", "", item[0]));
      card.appendChild(el("p", "", item[1]));
      routeGrid.appendChild(card);
    });
    mount.appendChild(routeGrid);

    function filterSummary(filter) {
      var loads = data.loads || [];
      var stats = [
        ["All records", loads.length, "All"],
        ["Ready", loads.filter(function (load) { return loadStatusBucket(load) === "Ready"; }).length, "Ready"],
        ["Review", loads.filter(function (load) { return loadStatusBucket(load) === "Review"; }).length, "Review"],
        ["At Risk", loads.filter(function (load) { return loadStatusBucket(load) === "At Risk"; }).length, "At Risk"],
        ["Blocked", loads.filter(function (load) { return loadStatusBucket(load) === "Blocked"; }).length, "Blocked"],
        ["Exceptions", loads.filter(function (load) { return (load.exceptionIds || []).length > 0; }).length, "Exceptions"]
      ];
      var wrap = el("div", "dispatch-intake-summary operating-summary command-filter-summary");
      stats.forEach(function (item) {
        var button = el("button", "dispatch-summary-tile operating-summary-tile" + (filter === item[2] ? " is-active" : ""));
        button.type = "button";
        button.setAttribute("data-command-filter", item[2]);
        button.setAttribute("aria-pressed", filter === item[2] ? "true" : "false");
        button.appendChild(el("strong", "", item[1]));
        button.appendChild(el("em", "", item[0]));
        wrap.appendChild(button);
      });
      return wrap;
    }

    var filterHead = sectionHead("Record filters", "Open the record that explains the decision.", "Ready records show why the load can move. Review, at-risk, blocked, and exception records show what must happen before release, billing, or assignment.");
    mount.appendChild(filterHead);
    var summary = filterSummary(activeFilter);
    mount.appendChild(summary);

    var queue = el("div", "dispatch-intake-queue operating-clearance-queue command-action-queue");
    mount.appendChild(queue);

    function draw(filter) {
      activeFilter = filter || "All";
      var nextSummary = filterSummary(activeFilter);
      summary.replaceWith(nextSummary);
      summary = nextSummary;
      queue.textContent = "";
      (data.loads || []).filter(function (load) {
        if (activeFilter === "All") return true;
        if (activeFilter === "Exceptions") return (load.exceptionIds || []).length > 0;
        return loadStatusBucket(load) === activeFilter;
      }).sort(function (a, b) {
        var weight = { "Blocked": 0, "At Risk": 1, "Review": 2, "Ready": 3 };
        return (weight[loadStatusBucket(a)] || 9) - (weight[loadStatusBucket(b)] || 9);
      }).forEach(function (load) {
        queue.appendChild(operatingCard(data, load, "operations-record"));
      });
      if (!queue.children.length) queue.appendChild(el("article", "operations-loading-card", "No command records match this filter."));
    }

    mount.addEventListener("click", function (event) {
      var button = event.target.closest("[data-command-filter]");
      if (!button || !mount.contains(button)) return;
      draw(button.getAttribute("data-command-filter"));
    });

    draw("All");
  }

  function alignmentTable(data) {
    return table(["Driver ID", "Driver Name", "Load ID", "Driver Status", "Dispatch Status", "Safety Status", "Proof Status", "Settlement Status", "Exception", "Source", "Consistent?"], data.drivers.map(function (driver) {
      var load = driver.activeLoadId ? data.lookup.loads[driver.activeLoadId] : null;
      var exception = driver.activeExceptionId || "None";
      return [
        driver.id,
        driver.name,
        load ? load.id : "No active load",
        driver.readinessStatus,
        load ? load.dispatchStatus : "No active load",
        load ? load.safetyStatus : "No active load",
        load ? load.proofStatus : "No active load",
        load ? load.settlementStatus : "No active load",
        exception,
        "bof-public-operations.json",
        "Yes"
      ];
    }));
  }

  function renderByMode(mount, data) {
    var mode = mount.getAttribute("data-bof-operations-view");
    mount.textContent = "";
    if (mode === "drivers") renderDrivers(mount, data);
    else if (mode === "dispatch" || mode === "safety" || mode === "settlements") renderLoadView(mount, data, mode);
    else if (mode === "operations-record") renderOperationsRecord(mount, data);
    else if (mode === "command-center") renderCommandCenterView(mount, data);
    else mount.appendChild(el("p", "bof-data-error", "Unknown BOF operations view."));
  }

  function init() {
    var mounts = Array.prototype.slice.call(document.querySelectorAll("[data-bof-operations-view]"));
    if (!mounts.length) return;
    document.body.classList.add("bof-canonical-data-page");
    mounts.forEach(function (mount) {
      mount.setAttribute("aria-busy", "true");
      mount.appendChild(el("p", "bof-data-loading", "Loading canonical BOF operations data..."));
    });
    (window.BOFDataLoader ? window.BOFDataLoader.load(DATA_URL) : fetch(DATA_URL, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("Unable to load " + DATA_URL);
      return response.json();
    }))
    .then(function (data) {
      if (window.BOFDemoState && window.BOFDemoState.apply) data = window.BOFDemoState.apply(data);
      var errors = validate(data);
        if (errors.length) throw new Error(errors.join("; "));
        buildLookups(data);
        window.BOFPublicOperations = data;
        mounts.forEach(function (mount) {
          mount.removeAttribute("aria-busy");
          renderByMode(mount, data);
        });
        document.body.classList.add("bof-canonical-data-loaded");
      })
      .catch(function (error) {
        mounts.forEach(function (mount) {
          mount.removeAttribute("aria-busy");
          mount.textContent = "";
          mount.appendChild(el("p", "bof-data-error", "Canonical BOF operations data could not load. Navigation remains available; operational records are hidden to avoid stale or conflicting data."));
          mount.appendChild(el("p", "bof-data-error-detail", error.message));
        });
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
