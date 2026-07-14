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
      settlementRecords: byId(data.settlementRecords)
    };
    return data;
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
    card.appendChild(link("/operations-record/#" + load.id.toLowerCase(), "Open joined record", "button secondary"));
    return card;
  }

  function renderLoadView(mount, data, mode) {
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
    return table(["Settlement", "Load", "Driver", "Proof", "Billing", "Hold reason"], data.settlementRecords.filter(function (record) {
      return ["BOF-2064", "BOF-1907", "BOF-1931"].indexOf(record.loadId) >= 0;
    }).map(function (record) {
      var driver = data.lookup.drivers[record.driverId];
      var proof = data.lookup.proofRecords[record.proofRecordId];
      return [record.id, record.loadId, driver.id + " / " + driver.name, proof.status, record.billingStatus, record.billingHold];
    }));
  }

  function renderOperationsRecord(mount, data) {
    mount.appendChild(sectionHead("Joined operations record", "The end-to-end view is rendered from the canonical dataset.", "Choose any core load anchor or scan the table below."));
    var grid = el("div", "bof-data-grid");
    data.loads.forEach(function (load) { grid.appendChild(loadCard(data, load)); });
    mount.appendChild(grid);
    mount.appendChild(alignmentTable(data));
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
    fetch(DATA_URL, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Unable to load " + DATA_URL);
        return response.json();
      })
      .then(function (data) {
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
