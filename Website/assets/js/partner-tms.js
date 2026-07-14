(function () {
  var DATA_URL = "/assets/data/tms-mock-loads.json";
  var dataPromise = null;

  function loadData() {
    if (!dataPromise) {
      // Simulation boundary: keep this as local static JSON. The TMS
      // workflow is a demo surface, not a planned live API/sync integration.
      dataPromise = fetch(DATA_URL).then(function (response) {
        if (!response.ok) throw new Error("TMS partner workflow unavailable");
        return response.json();
      });
    }
    return dataPromise;
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function formatStatus(value) {
    var formatted = String(value || "").replace(/_/g, " ").replace(/\b\w/g, function (letter) {
      return letter.toUpperCase();
    });
    return formatted.replace(/\bBof\b/g, "BOF").replace(/\bId\b/g, "ID").replace(/\bTms\b/g, "TMS");
  }

  function statusClass(status) {
    if (status === "clear" || status === "ready_to_release") return "ready";
    if (status === "blocked" || status === "hold_action_required") return "blocked";
    return "watch";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function findDriver(data, predicate) {
    for (var i = 0; i < data.bofDrivers.length; i += 1) {
      if (predicate(data.bofDrivers[i])) return data.bofDrivers[i];
    }
    return null;
  }

  function matchTmsDriverToBofDriver(load, data) {
    var driver = null;
    var method = "none";
    var confidence = "none";

    if (load.mappedBofDriverId) {
      driver = findDriver(data, function (candidate) {
        return candidate.bofDriverId === load.mappedBofDriverId;
      });
      if (driver) {
        method = "bof_driver_id";
        confidence = "high";
      }
    }

    if (!driver && load.assignedDriverEmail) {
      driver = findDriver(data, function (candidate) {
        return normalize(candidate.email) === normalize(load.assignedDriverEmail);
      });
      if (driver) {
        method = "email";
        confidence = "high";
      }
    }

    if (!driver && load.assignedDriverPhone) {
      driver = findDriver(data, function (candidate) {
        return normalize(candidate.phone) === normalize(load.assignedDriverPhone);
      });
      if (driver) {
        method = "phone";
        confidence = "medium";
      }
    }

    if (!driver) {
      driver = findDriver(data, function (candidate) {
        return normalize(candidate.name) === normalize(load.assignedDriverName);
      });
      if (driver) {
        method = "exact_name";
        confidence = "medium";
      }
    }

    return {
      matched: Boolean(driver),
      bofDriverId: driver ? driver.bofDriverId : "",
      driver: driver,
      tmsDriverName: load.assignedDriverName,
      matchConfidence: confidence,
      matchMethod: method,
      requiresManualReview: !driver || confidence === "low"
    };
  }

  function evaluateDriverReadiness(match) {
    if (!match.matched) {
      return {
        status: "blocked",
        title: "Unmatched TMS driver - BOF review required before release.",
        owner: "Safety/Compliance",
        items: [
          ["BOF driver record", "Missing", "blocked"],
          ["Manual review", "Required", "blocked"],
          ["Dispatch eligibility", "Blocked until matched", "blocked"]
        ]
      };
    }

    var driver = match.driver;
    var items = [
      ["CDL valid", driver.cdlValid ? "Clear" : "Blocked", driver.cdlValid ? "ready" : "blocked"],
      ["Medical card valid", driver.medicalCardValid ? "Clear through " + driver.medicalCardExpires : "Expires " + driver.medicalCardExpires, driver.medicalCardValid ? "ready" : "blocked"],
      ["MVR current", driver.mvrCurrent ? "Clear" : "Blocked", driver.mvrCurrent ? "ready" : "blocked"],
      ["Emergency contact", driver.emergencyContactComplete ? "Complete" : "Missing", driver.emergencyContactComplete ? "ready" : "watch"],
      ["I-9/W-9", driver.taxSetupComplete ? "Complete" : "Missing", driver.taxSetupComplete ? "ready" : "blocked"],
      ["Bank/settlement setup", driver.bankSettlementComplete ? "Complete" : "Watch", driver.bankSettlementComplete ? "ready" : "watch"],
      ["Owner-operator packet", driver.ownerOperatorPacketComplete ? "Complete" : "Watch", driver.ownerOperatorPacketComplete ? "ready" : "watch"],
      ["Active safety hold", driver.activeSafetyHold ? driver.dispatchBlockReason : "None", driver.activeSafetyHold ? "blocked" : "ready"]
    ];
    var blocked = items.some(function (item) { return item[2] === "blocked"; });
    var warning = items.some(function (item) { return item[2] === "watch"; });
    return {
      status: blocked ? "blocked" : warning ? "warning" : "clear",
      title: blocked ? "Driver compliance blocks release." : warning ? "Driver can move with watch items visible." : "Driver compliance is clear.",
      owner: "Safety/Compliance",
      items: items
    };
  }

  function evaluateCarrierPacket(load, data) {
    var packet = (data.carrierPackets || []).filter(function (candidate) {
      return normalize(candidate.carrierName) === normalize(load.carrierName);
    })[0];
    if (!packet) {
      return {
        status: "blocked",
        title: "Carrier packet is missing from BOF records.",
        owner: "Carrier operations",
        items: [["Carrier packet", "Missing", "blocked"]]
      };
    }
    var items = [
      ["Authority/MC record", packet.authorityPresent && packet.mcRecordPresent ? "Present" : "Missing", packet.authorityPresent && packet.mcRecordPresent ? "ready" : "blocked"],
      ["Insurance", packet.insurancePresent && packet.insuranceCurrent ? "Current" : "Missing or expired", packet.insurancePresent && packet.insuranceCurrent ? "ready" : "blocked"],
      ["W-9", packet.w9Present ? "Present" : "Missing", packet.w9Present ? "ready" : "blocked"],
      ["Contract/master agreement", packet.agreementPresent ? "Present" : "Missing", packet.agreementPresent ? "ready" : "blocked"],
      ["Carrier packet", packet.packetComplete ? "Complete" : "Needs review", packet.packetComplete ? "ready" : "watch"]
    ];
    var blocked = items.some(function (item) { return item[2] === "blocked"; });
    var warning = items.some(function (item) { return item[2] === "watch"; });
    return {
      status: blocked ? "blocked" : warning ? "warning" : "clear",
      title: blocked ? "Carrier packet blocks release." : warning ? "Carrier packet has watch items." : "Carrier packet is clear.",
      owner: packet.owner,
      items: items
    };
  }

  function evaluateLoadDocuments(load) {
    var items = load.documents.map(function (doc) {
      var state = "ready";
      var label = "Complete";
      if (doc.status === "missing" && doc.requiredBeforeRelease) {
        state = "blocked";
        label = "Missing";
      } else if (doc.status === "needs_review") {
        state = "watch";
        label = "Needs Review";
      } else if (doc.status === "not_yet_required") {
        state = doc.requiredFollowUp ? "watch" : "ready";
        label = "Not Yet Required";
      }
      return [doc.label, label, state, doc.fileName || "Pending later workflow"];
    });
    var blocked = items.some(function (item) { return item[2] === "blocked"; });
    var warning = items.some(function (item) { return item[2] === "watch"; });
    return {
      status: blocked ? "blocked" : warning ? "warning" : "clear",
      title: blocked ? "Required load documents are missing." : warning ? "Post-release documents remain visible." : "Required load documents are present.",
      owner: "Document desk",
      items: items
    };
  }

  function createReleaseDecision(review) {
    var blocking = [];
    var warnings = [];
    [review.driverReadiness, review.carrierPacket, review.loadDocuments].forEach(function (section) {
      section.items.forEach(function (item) {
        if (item[2] === "blocked") blocking.push(item[0] + ": " + item[1]);
        if (item[2] === "watch") warnings.push(item[0] + ": " + item[1]);
      });
    });

    if (blocking.length) {
      return {
        decision: "hold_action_required",
        label: "Hold - Action Required",
        status: "blocked",
        reasons: ["BOF found release blockers that TMS load status alone does not clear."],
        blockingItems: blocking,
        ownerOfFix: review.driverMatch.matched ? "Safety/Compliance" : "Operations lead",
        nextAction: review.driverMatch.matched ? "Resolve the blocking BOF record before dispatch release." : "Match the TMS driver to a BOF driver record or assign an approved driver.",
        reviewedAt: "2026-06-07 07:45 CT",
        auditNote: "BOF release file " + review.load.bofReleaseFile + " held with owner and next action.",
        simulatedHandoffStatus: "ready_to_show"
      };
    }

    if (warnings.length) {
      return {
        decision: "release_with_condition",
        label: "Release With Condition",
        status: "warning",
        reasons: ["No legal or compliance blocker is active, but BOF keeps post-release follow-up visible."],
        blockingItems: warnings,
        ownerOfFix: "Document desk",
        nextAction: "Release the load and keep the post-trip document owner attached.",
        reviewedAt: "2026-06-07 07:45 CT",
        auditNote: "BOF release file " + review.load.bofReleaseFile + " cleared with condition.",
        simulatedHandoffStatus: "ready_to_show"
      };
    }

    return {
      decision: "ready_to_release",
      label: "Ready to Release",
      status: "clear",
      reasons: ["Driver, carrier packet, and required pre-trip documents are clear in BOF."],
      blockingItems: [],
      ownerOfFix: "Operations lead",
        nextAction: "Use the release-ready decision in the simulated handoff.",
      reviewedAt: "2026-06-07 07:45 CT",
      auditNote: "BOF release file " + review.load.bofReleaseFile + " is ready.",
      simulatedHandoffStatus: "ready_to_show"
    };
  }

  function mapTmsLoadToBofReview(load, data) {
    var match = matchTmsDriverToBofDriver(load, data);
    var review = {
      load: load,
      driverMatch: match,
      driverReadiness: evaluateDriverReadiness(match),
      carrierPacket: evaluateCarrierPacket(load, data),
      loadDocuments: evaluateLoadDocuments(load)
    };
    review.releaseDecision = createReleaseDecision(review);
    return review;
  }

  function createSimulatedHandoffPayload(decision, load) {
    return {
      tmsLoadId: load.tmsLoadId,
      bofReleaseFile: load.bofReleaseFile,
      bofReleaseStatus: decision.status,
      releaseDecision: decision.label,
      holdReason: decision.blockingItems.length ? decision.blockingItems.join("; ") : "",
      blockingItems: decision.blockingItems,
      nextAction: decision.nextAction,
      reviewedBy: "BOF Operations Lead",
      reviewedAt: decision.reviewedAt,
      handoffMode: "simulated partner handoff - local demo only"
    };
  }

  function renderItems(items) {
    return items.map(function (item) {
      return '<li><span>' + escapeHtml(item[0]) + '</span><strong>' + escapeHtml(item[1]) + '</strong><em class="status ' + statusClass(item[2]) + '">' + escapeHtml(item[2] === "ready" ? "Ready" : item[2] === "blocked" ? "Blocked" : "Warning") + '</em>' + (item[3] ? '<small>' + escapeHtml(item[3]) + '</small>' : "") + '</li>';
    }).join("");
  }

  function setText(root, name, value) {
    var node = root.querySelector('[data-tms-target="' + name + '"]');
    if (node) node.textContent = value;
  }

  function setHtml(root, name, value) {
    var node = root.querySelector('[data-tms-target="' + name + '"]');
    if (node) node.innerHTML = value;
  }

  function renderReview(root, data, loadId) {
    var load = data.loads.filter(function (item) {
      return item.tmsLoadId === loadId;
    })[0] || data.loads[0];
    var review = mapTmsLoadToBofReview(load, data);
    var decision = review.releaseDecision;
    var handoffPayload = createSimulatedHandoffPayload(decision, load);

    root.querySelectorAll("[data-tms-load]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-tms-load") === load.tmsLoadId);
      button.setAttribute("aria-pressed", String(button.getAttribute("data-tms-load") === load.tmsLoadId));
    });

    setText(root, "tmsLoadId", load.tmsLoadId);
    setText(root, "bofReleaseFile", load.bofReleaseFile);
    setText(root, "loadNumber", load.loadNumber);
    setText(root, "customerName", load.customerName);
    setText(root, "carrierName", load.carrierName);
    setText(root, "driverName", load.assignedDriverName);
    setText(root, "pickup", load.pickupLocation + " - " + load.pickupDateTime);
    setText(root, "delivery", load.deliveryLocation + " - " + load.deliveryDateTime);
    setText(root, "equipment", load.equipmentType);
    setText(root, "commodity", load.commodity);
    setText(root, "tmsStatus", formatStatus(load.loadStatus));
    setText(root, "bofStatus", decision.label);

    setHtml(root, "decisionBadge", '<span class="status ' + statusClass(decision.decision) + '">' + escapeHtml(decision.label) + '</span>');
    setHtml(root, "importedData", [
      ["TMS Load ID", load.tmsLoadId],
      ["Load number", load.loadNumber],
      ["Customer", load.customerName],
      ["Carrier", load.carrierName],
      ["Driver", load.assignedDriverName],
      ["Pickup", load.pickupLocation + " - " + load.pickupDateTime],
      ["Delivery", load.deliveryLocation + " - " + load.deliveryDateTime],
      ["Equipment", load.equipmentType],
      ["Commodity", load.commodity],
      ["TMS status", formatStatus(load.loadStatus)]
    ].map(function (row) {
      return '<div class="field"><span>' + escapeHtml(row[0]) + '</span><strong>' + escapeHtml(row[1]) + '</strong></div>';
    }).join(""));

    setHtml(root, "driverMatch", '<div class="field"><span>Match result</span><strong>' + (review.driverMatch.matched ? "Matched to " + review.driverMatch.bofDriverId : "Manual review required") + '</strong></div>' +
      '<div class="field"><span>Confidence</span><strong>' + escapeHtml(formatStatus(review.driverMatch.matchConfidence)) + '</strong></div>' +
      '<div class="field"><span>Match method</span><strong>' + escapeHtml(formatStatus(review.driverMatch.matchMethod)) + '</strong></div>' +
      '<div class="field"><span>Manual review</span><strong>' + (review.driverMatch.requiresManualReview ? "Required" : "Not required") + '</strong></div>');

    setText(root, "driverReadinessTitle", review.driverReadiness.title);
    setHtml(root, "driverReadiness", renderItems(review.driverReadiness.items));
    setText(root, "carrierPacketTitle", review.carrierPacket.title);
    setHtml(root, "carrierPacket", renderItems(review.carrierPacket.items));
    setText(root, "loadDocumentTitle", review.loadDocuments.title);
    setHtml(root, "loadDocuments", renderItems(review.loadDocuments.items));

    setText(root, "decisionLabel", decision.label);
    setText(root, "decisionReason", decision.reasons.join(" "));
    setText(root, "decisionOwner", decision.ownerOfFix);
    setText(root, "decisionNext", decision.nextAction);
    setText(root, "decisionTimestamp", decision.reviewedAt);
    setText(root, "decisionAudit", decision.auditNote);
    setHtml(root, "decisionBlockingItems", decision.blockingItems.length ? decision.blockingItems.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("") : "<li>No blocking items.</li>");
    setText(root, "handoffStatus", formatStatus(decision.simulatedHandoffStatus));
    setText(root, "handoffPayload", JSON.stringify(handoffPayload, null, 2));
  }

  function initWorkflow(root, data) {
    var selector = root.querySelector("[data-tms-load-selector]");
    if (selector) {
      selector.innerHTML = '<div class="bof-data-loading"><strong>TMS Import Demo Dataset</strong><br><span>These records use separate demo driver IDs and are not the canonical public BOF roster.</span></div>' + data.loads.map(function (load, index) {
        return '<button type="button" data-tms-load="' + escapeHtml(load.tmsLoadId) + '" aria-pressed="' + (index === 0 ? "true" : "false") + '">' +
          '<span>' + escapeHtml(load.tmsLoadId) + '</span>' +
          '<strong>' + escapeHtml(load.customerName) + '</strong>' +
          '<em>' + escapeHtml(load.assignedDriverName) + '</em>' +
          '</button>';
      }).join("");
      selector.querySelectorAll("[data-tms-load]").forEach(function (button) {
        button.addEventListener("click", function () {
          renderReview(root, data, button.getAttribute("data-tms-load"));
        });
      });
    }
    renderReview(root, data, data.loads[0].tmsLoadId);
  }

  window.TmsIntegration = {
    fetchTmsLoads: function () {
      return loadData().then(function (data) { return data.loads; });
    },
    fetchTmsLoadById: function (tmsLoadId) {
      return loadData().then(function (data) {
        return data.loads.filter(function (load) { return load.tmsLoadId === tmsLoadId; })[0] || null;
      });
    },
    fetchTmsDocumentsForLoad: function (tmsLoadId) {
      return window.TmsIntegration.fetchTmsLoadById(tmsLoadId).then(function (load) {
        return load ? load.documents : [];
      });
    },
    simulateBofReleaseDecisionHandoff: function (payload) {
      // Simulation boundary: preserve this helper as a local demo response only.
      // Do not convert it into live TMS API/sync behavior unless the user
      // explicitly changes the project scope.
      return Promise.resolve({
        ok: true,
        mode: "simulation",
        message: "Simulated partner handoff prepared locally.",
        payload: payload
      });
    },
    mapTmsLoadToBofReview: function (load) {
      return loadData().then(function (data) {
        return mapTmsLoadToBofReview(load, data);
      });
    }
  };

  var workflowRoot = document.querySelector("[data-tms-workflow]");
  if (workflowRoot) {
    loadData().then(function (data) {
      initWorkflow(workflowRoot, data);
    }).catch(function () {
      setHtml(workflowRoot, "workflowError", '<article class="card"><span class="status blocked">Unavailable</span><h3>Partner workflow could not load.</h3><p>Refresh the page or confirm the local static server is serving the BOF Website folder.</p></article>');
    });
  }
})();
