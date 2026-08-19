(function () {
  "use strict";

  var mount = document.querySelector("[data-vault-document-intake]");
  if (!mount) return;

  var state = {
    data: null,
    presetId: "founding-fleet",
    selectedDocId: "",
    selectedExceptionId: "",
    selectedProfileId: "",
    stageIndex: 0,
    running: false,
    timer: null,
    decisions: {},
    audit: []
  };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function statusClass(status) {
    var value = String(status || "").toLowerCase();
    if (value.indexOf("ready") >= 0 || value.indexOf("accepted") >= 0 || value.indexOf("complete") >= 0) return "ready";
    if (value.indexOf("blocked") >= 0 || value.indexOf("expired") >= 0) return "blocked";
    if (value.indexOf("missing") >= 0 || value.indexOf("duplicate") >= 0 || value.indexOf("review") >= 0 || value.indexOf("conditional") >= 0 || value.indexOf("assign") >= 0) return "review";
    return "watch";
  }

  function findById(list, id) {
    return (list || []).filter(function (item) {
      return item.id === id;
    })[0] || null;
  }

  function presets() {
    return state.data && state.data.presets ? state.data.presets : [];
  }

  function preset() {
    return findById(presets(), state.presetId) || presets()[0] || {};
  }

  function documents() {
    return preset().documents || [];
  }

  function exceptions() {
    return preset().exceptions || [];
  }

  function profiles() {
    return preset().profiles || [];
  }

  function selectedDocument() {
    return findById(documents(), state.selectedDocId) || documents()[0] || {};
  }

  function selectedException() {
    return findById(exceptions(), state.selectedExceptionId) || exceptions()[0] || {};
  }

  function selectedProfile() {
    return findById(profiles(), state.selectedProfileId) || profiles()[0] || {};
  }

  function pipelineStages() {
    return state.data && state.data.pipelineStages ? state.data.pipelineStages : [];
  }

  function decisionFor(doc) {
    return state.decisions[doc.id] || "";
  }

  function documentStatus(doc) {
    var decision = decisionFor(doc);
    if (decision === "accept") return "Accepted";
    if (decision === "replace") return "Replacement Requested";
    if (decision === "block") return "Blocked";
    if (decision === "assign") return "Assigned to Reviewer";
    return doc.status || "Needs Review";
  }

  function documentAction(doc) {
    var decision = decisionFor(doc);
    if (decision === "accept") return "Accepted by reviewer; readiness profile can update.";
    if (decision === "replace") return "Replacement requested from driver, carrier, or record owner.";
    if (decision === "block") return "Blocked until a current, complete, or readable document is supplied.";
    if (decision === "assign") return "Assigned to a human reviewer for ownership, wording, or evidence review.";
    return doc.requiredAction || "Review document and choose next action.";
  }

  function auditTime() {
    return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function addAudit(message) {
    state.audit.unshift(auditTime() + " - " + message);
    state.audit = state.audit.slice(0, 12);
  }

  function resetSelections() {
    var currentPreset = preset();
    state.selectedDocId = currentPreset.documents && currentPreset.documents[0] ? currentPreset.documents[0].id : "";
    state.selectedExceptionId = currentPreset.exceptions && currentPreset.exceptions[0] ? currentPreset.exceptions[0].id : "";
    state.selectedProfileId = currentPreset.profiles && currentPreset.profiles[0] ? currentPreset.profiles[0].id : "";
  }

  function clearTimer() {
    if (state.timer) {
      window.clearTimeout(state.timer);
      state.timer = null;
    }
  }

  function metricCardsHtml() {
    var p = preset();
    var reviewed = Object.keys(state.decisions).length;
    var stage = pipelineStages()[state.stageIndex] || {};
    var cards = [
      ["Files received", p.receivedFiles || 0, "Incoming documents staged for classification.", "Ready"],
      ["Drivers found", p.drivers || 0, "Driver records detected in the intake bundle.", "Ready"],
      ["Auto-classified", p.autoClassified || 0, "Files with enough confidence for system classification.", "Ready"],
      ["Review queue", Math.max((p.reviewItems || 0) - reviewed, 0), "Items still waiting on a reviewer decision.", "Needs Review"],
      ["Ready profiles", (p.readyProfiles || 0) + countAcceptedDecisions(), "Profiles that can move forward after review.", "Ready"],
      ["Blocked profiles", (p.blockedProfiles || 0) + countBlockedDecisions(), "Profiles held until missing or expired records are resolved.", "Blocked"],
      ["Current stage", stage.label || "Intake staged", "Pipeline position for the active scenario.", state.running ? "Needs Review" : "Ready"]
    ];
    return '<section class="vault-kpi-grid" aria-label="Batch intake metrics">' + cards.map(function (card) {
      return '<article class="vault-kpi"><span class="mini-status ' + statusClass(card[3]) + '">' + esc(card[0]) + '</span><strong>' + esc(card[1]) + '</strong><p>' + esc(card[2]) + '</p></article>';
    }).join("") + "</section>";
  }

  function countAcceptedDecisions() {
    return Object.keys(state.decisions).filter(function (key) {
      return state.decisions[key] === "accept";
    }).length;
  }

  function countBlockedDecisions() {
    return Object.keys(state.decisions).filter(function (key) {
      return state.decisions[key] === "block";
    }).length;
  }

  function presetButtonsHtml() {
    return presets().map(function (item) {
      var active = item.id === state.presetId ? " is-active" : "";
      return '<button class="vault-preset' + active + '" type="button" data-vault-action="preset" data-preset-id="' + esc(item.id) + '" aria-pressed="' + String(item.id === state.presetId) + '"><strong>' + esc(item.label) + '</strong><span>' + esc(item.receivedFiles) + ' files / ' + esc(item.reviewItems) + ' review</span></button>';
    }).join("");
  }

  function stageHtml() {
    return '<ol class="vault-pipeline" aria-label="Document intake processing pipeline">' + pipelineStages().map(function (stage, index) {
      var stateClass = index === state.stageIndex ? " is-active" : index < state.stageIndex ? " is-complete" : "";
      return '<li class="vault-stage' + stateClass + '"><span>' + String(index + 1).padStart(2, "0") + '</span><div><strong>' + esc(stage.label) + '</strong><p>' + esc(stage.description) + '</p></div></li>';
    }).join("") + "</ol>";
  }

  function batchPanelHtml() {
    var p = preset();
    return [
      '<section class="vault-batch-grid">',
      '  <article class="vault-panel vault-intake-command">',
      '    <div class="vault-panel-heading"><span>Batch intake simulator</span><h2>' + esc(p.label || "Intake scenario") + '</h2><p>' + esc(p.summary || "") + '</p></div>',
      '    <div class="vault-dropzone" role="group" aria-label="Simulated batch intake source">',
      '      <span>Batch ' + esc(p.batchId || "BVI-00000") + '</span>',
      '      <strong>' + esc(p.receivedFiles || 0) + ' documents staged</strong>',
      '      <p>' + esc(p.source || "Simulated source") + '</p>',
      '      <em>No file is transmitted or stored in this demo surface.</em>',
      '    </div>',
      '    <div class="vault-preset-grid" aria-label="Scenario presets">' + presetButtonsHtml() + '</div>',
      '    <div class="vault-control-row">',
      '      <button type="button" class="button" data-vault-action="run">Run Intake Simulation</button>',
      '      <button type="button" class="button secondary" data-vault-action="summary">Generate Readiness Summary</button>',
      '      <button type="button" class="button ghost" data-vault-action="pause">' + (state.running ? "Pause" : "Pause") + '</button>',
      '      <button type="button" class="button ghost" data-vault-action="reset">Reset</button>',
      '    </div>',
      '    <p class="vault-status-line" aria-live="polite">' + esc(statusMessage()) + '</p>',
      '  </article>',
      '  <article class="vault-panel vault-pipeline-panel">',
      '    <div class="vault-panel-heading"><span>Processing pipeline</span><h2>From document dump to review-ready records</h2><p>BOF moves each record through classification, matching, rule checks, exception routing, and profile updates.</p></div>',
      stageHtml(),
      '  </article>',
      '</section>'
    ].join("");
  }

  function statusMessage() {
    var stage = pipelineStages()[state.stageIndex] || {};
    if (state.running) return "Processing: " + (stage.label || "intake") + ". Review queue will update as each stage completes.";
    if (state.stageIndex >= pipelineStages().length - 1) return "Processing complete. Review exceptions and generated profiles before marking records ready.";
    return "Scenario staged. Run the intake simulation or select records for manual review.";
  }

  function queueTableHtml() {
    var rows = documents().map(function (doc) {
      var selected = doc.id === selectedDocument().id ? " is-selected" : "";
      var status = documentStatus(doc);
      return [
        '<tr class="' + selected + '">',
        '  <td><button type="button" class="vault-row-button" data-vault-action="select-doc" data-doc-id="' + esc(doc.id) + '">' + esc(doc.fileName) + '</button></td>',
        '  <td>' + esc(doc.documentType) + '</td>',
        '  <td>' + esc(doc.owner) + '</td>',
        '  <td><span class="vault-confidence"><i style="width:' + Math.max(0, Math.min(100, Number(doc.confidence || 0))) + '%"></i></span><b>' + esc(doc.confidence || 0) + '%</b></td>',
        '  <td><span class="mini-status ' + statusClass(status) + '">' + esc(status) + '</span></td>',
        '</tr>'
      ].join("");
    }).join("");
    return [
      '<section class="vault-queue-layout">',
      '  <article class="vault-panel vault-table-panel">',
      '    <div class="vault-panel-heading"><span>Document classification queue</span><h2>Files that drive readiness status</h2><p>Select a row to inspect the extracted fields, readiness impact, and next action.</p></div>',
      '    <div class="vault-table-wrap"><table class="vault-queue-table"><thead><tr><th>File</th><th>Type</th><th>Owner</th><th>Confidence</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
      '  </article>',
      documentDetailHtml(),
      '</section>'
    ].join("");
  }

  function documentDetailHtml() {
    var doc = selectedDocument();
    var extracted = doc.extracted || {};
    var status = documentStatus(doc);
    return [
      '<aside class="vault-panel vault-detail-panel" aria-live="polite">',
      '  <div class="vault-panel-heading"><span>Selected document</span><h2>' + esc(doc.fileName || "No document selected") + '</h2><p>' + esc(doc.ruleImpact || "Select a document to review readiness impact.") + '</p></div>',
      '  <dl class="vault-detail-list">',
      '    <div><dt>Owner</dt><dd>' + esc(doc.owner || "") + '</dd></div>',
      '    <div><dt>Driver / record</dt><dd>' + esc(doc.driverId || "") + '</dd></div>',
      '    <div><dt>Carrier / source</dt><dd>' + esc(doc.carrier || "") + '</dd></div>',
      '    <div><dt>Issuer</dt><dd>' + esc(extracted.issuer || "") + '</dd></div>',
      '    <div><dt>Expiration</dt><dd>' + esc(extracted.expires || "") + '</dd></div>',
      '    <div><dt>Status</dt><dd><span class="mini-status ' + statusClass(status) + '">' + esc(status) + '</span></dd></div>',
      '  </dl>',
      '  <div class="vault-review-note"><strong>Review reason</strong><p>' + esc(doc.reviewReason || "") + '</p><strong>Next action</strong><p>' + esc(documentAction(doc)) + '</p></div>',
      '  <div class="vault-action-stack" aria-label="Human review actions for selected document">',
      '    <button type="button" data-vault-action="review" data-review="accept" data-doc-id="' + esc(doc.id || "") + '">Accept Document</button>',
      '    <button type="button" data-vault-action="review" data-review="replace" data-doc-id="' + esc(doc.id || "") + '">Request Replacement</button>',
      '    <button type="button" data-vault-action="review" data-review="assign" data-doc-id="' + esc(doc.id || "") + '">Assign to Reviewer</button>',
      '    <button type="button" data-vault-action="review" data-review="block" data-doc-id="' + esc(doc.id || "") + '">Mark Blocked</button>',
      '  </div>',
      '</aside>'
    ].join("");
  }

  function exceptionHtml() {
    var cards = exceptions().map(function (item) {
      var active = item.id === selectedException().id ? " is-active" : "";
      return [
        '<button class="vault-exception-card' + active + '" type="button" data-vault-action="select-exception" data-exception-id="' + esc(item.id) + '">',
        '  <span class="mini-status ' + statusClass(item.severity) + '">' + esc(item.severity) + '</span>',
        '  <strong>' + esc(item.type) + '</strong>',
        '  <p>' + esc(item.item) + '</p>',
        '  <em>' + esc(item.owner) + '</em>',
        '</button>'
      ].join("");
    }).join("");
    var selected = selectedException();
    return [
      '<section class="vault-two-column">',
      '  <article class="vault-panel">',
      '    <div class="vault-panel-heading"><span>Exception generator</span><h2>Issues BOF refuses to hide</h2><p>Automation does not silently approve unclear records. It creates a visible review item with owner, severity, and impact.</p></div>',
      '    <div class="vault-exception-grid">' + cards + '</div>',
      '    <div class="vault-impact-callout"><strong>' + esc(selected.type || "Selected exception") + '</strong><p>' + esc(selected.impact || "Select an exception to see readiness impact.") + '</p></div>',
      '  </article>',
      humanReviewHtml(),
      '</section>'
    ].join("");
  }

  function humanReviewHtml() {
    var reviewDocs = documents().filter(function (doc) {
      return documentStatus(doc) !== "Ready" || Number(doc.confidence || 0) < 93;
    });
    return [
      '<article class="vault-panel">',
      '  <div class="vault-panel-heading"><span>Human review queue</span><h2>Reviewer decisions update the record</h2><p>Choose an action. The queue, selected document, metrics, and audit trail update immediately.</p></div>',
      '  <div class="vault-review-queue">' + reviewDocs.map(function (doc) {
        var status = documentStatus(doc);
        return [
          '<article class="vault-review-card">',
          '  <header><span class="mini-status ' + statusClass(status) + '">' + esc(status) + '</span><strong>' + esc(doc.documentType) + '</strong></header>',
          '  <p>' + esc(doc.fileName) + '</p>',
          '  <small>' + esc(doc.reviewReason) + '</small>',
          '  <div class="vault-mini-actions">',
          '    <button type="button" data-vault-action="review" data-review="accept" data-doc-id="' + esc(doc.id) + '">Accept</button>',
          '    <button type="button" data-vault-action="review" data-review="replace" data-doc-id="' + esc(doc.id) + '">Request</button>',
          '    <button type="button" data-vault-action="review" data-review="assign" data-doc-id="' + esc(doc.id) + '">Assign</button>',
          '    <button type="button" data-vault-action="review" data-review="block" data-doc-id="' + esc(doc.id) + '">Block</button>',
          '  </div>',
          '</article>'
        ].join("");
      }).join("") + '</div>',
      '</article>'
    ].join("");
  }

  function profileHtml() {
    var cards = profiles().map(function (profile) {
      var active = profile.id === selectedProfile().id ? " is-active" : "";
      return [
        '<button class="vault-profile-card' + active + '" type="button" data-vault-action="select-profile" data-profile-id="' + esc(profile.id) + '">',
        '  <span class="mini-status ' + statusClass(profile.status) + '">' + esc(profile.status) + '</span>',
        '  <strong>' + esc(profile.name) + '</strong>',
        '  <p>' + esc(profile.packet) + '</p>',
        '  <div class="vault-profile-meter"><i style="width:' + Math.max(0, Math.min(100, Number(profile.readiness || 0))) + '%"></i></div>',
        '  <em>' + esc(profile.readiness) + '% readiness</em>',
        '</button>'
      ].join("");
    }).join("");
    var selected = selectedProfile();
    return [
      '<section class="vault-two-column vault-profile-audit-grid">',
      '  <article class="vault-panel">',
      '    <div class="vault-panel-heading"><span>Driver onboarding profiles generated</span><h2>Documents become readiness profiles</h2><p>Profiles show what is ready, what needs review, what is blocked, and who owns the next step.</p></div>',
      '    <div class="vault-profile-grid">' + cards + '</div>',
      '    <div class="vault-impact-callout"><strong>' + esc(selected.name || "Profile") + '</strong><p>' + esc(selected.nextAction || "Select a profile to see the next action.") + '</p></div>',
      '  </article>',
      auditHtml(),
      '</section>'
    ].join("");
  }

  function auditHtml() {
    var p = preset();
    var lines = state.audit.concat(p.audit || []);
    return [
      '<article class="vault-panel vault-audit-panel">',
      '  <div class="vault-panel-heading"><span>Audit trail</span><h2>Every review leaves a record</h2><p>BOF shows who changed status, why an item moved, and which record was affected.</p></div>',
      '  <ol class="vault-audit-list">' + lines.slice(0, 10).map(function (line) {
      return '<li><span></span><p>' + esc(line) + '</p></li>';
    }).join("") + '</ol>',
      '</article>'
    ].join("");
  }

  function render() {
    if (!state.data) return;
    mount.innerHTML = [
      '<section class="vault-workbench">',
      '  <header class="vault-workbench-hero">',
      '    <div><span>BOF Vault Intake Workbench</span><h1>Turn document chaos into review-ready operating records.</h1><p>Simulate how BOF receives a messy batch, classifies files, applies readiness rules, surfaces exceptions, routes human review, and builds driver or carrier profiles without pretending risky records are automatically resolved.</p></div>',
      '    <aside><strong>Human-in-the-loop boundary</strong><p>' + esc(state.data.disclaimer || "") + '</p></aside>',
      '  </header>',
      metricCardsHtml(),
      batchPanelHtml(),
      queueTableHtml(),
      exceptionHtml(),
      profileHtml(),
      '</section>'
    ].join("");
  }

  function runPipeline() {
    clearTimer();
    state.running = true;
    if (state.stageIndex >= pipelineStages().length - 1) state.stageIndex = 0;
    addAudit("Intake simulation started for " + (preset().batchId || "selected batch") + ".");
    render();

    function advance() {
      if (!state.running) return;
      if (state.stageIndex < pipelineStages().length - 1) {
        state.stageIndex += 1;
        var stage = pipelineStages()[state.stageIndex] || {};
        addAudit("Pipeline advanced to " + (stage.label || "next stage") + ".");
        render();
        state.timer = window.setTimeout(advance, 900);
      } else {
        state.running = false;
        addAudit("Readiness profiles generated from classified intake records.");
        render();
      }
    }

    state.timer = window.setTimeout(advance, 700);
  }

  function handleReview(docId, action) {
    if (!docId) return;
    state.selectedDocId = docId;
    state.decisions[docId] = action;
    var doc = findById(documents(), docId) || {};
    var label = {
      accept: "accepted",
      replace: "sent back for replacement",
      assign: "assigned to human review",
      block: "marked blocked"
    }[action] || "updated";
    addAudit((doc.fileName || "Selected document") + " " + label + ".");
    render();
  }

  function handleAction(button) {
    var action = button.getAttribute("data-vault-action");
    if (!action) return;

    if (action === "preset") {
      clearTimer();
      state.running = false;
      state.presetId = button.getAttribute("data-preset-id") || state.presetId;
      state.stageIndex = 0;
      state.decisions = {};
      state.audit = [];
      resetSelections();
      addAudit((preset().label || "Scenario") + " scenario loaded.");
      render();
      return;
    }

    if (action === "run") {
      runPipeline();
      return;
    }

    if (action === "pause") {
      clearTimer();
      state.running = false;
      addAudit("Intake simulation paused for reviewer inspection.");
      render();
      return;
    }

    if (action === "reset") {
      clearTimer();
      state.running = false;
      state.stageIndex = 0;
      state.decisions = {};
      state.audit = [];
      resetSelections();
      addAudit("Workbench reset to the staged intake bundle.");
      render();
      return;
    }

    if (action === "summary") {
      clearTimer();
      state.running = false;
      state.stageIndex = pipelineStages().length - 1;
      addAudit("Readiness summary generated for " + (preset().readyProfiles || 0) + " ready profiles and " + (preset().blockedProfiles || 0) + " blocked profiles.");
      render();
      return;
    }

    if (action === "select-doc") {
      state.selectedDocId = button.getAttribute("data-doc-id") || state.selectedDocId;
      render();
      return;
    }

    if (action === "select-exception") {
      state.selectedExceptionId = button.getAttribute("data-exception-id") || state.selectedExceptionId;
      render();
      return;
    }

    if (action === "select-profile") {
      state.selectedProfileId = button.getAttribute("data-profile-id") || state.selectedProfileId;
      render();
      return;
    }

    if (action === "review") {
      handleReview(button.getAttribute("data-doc-id"), button.getAttribute("data-review"));
    }
  }

  mount.addEventListener("click", function (event) {
    var button = event.target.closest("[data-vault-action]");
    if (!button || !mount.contains(button)) return;
    handleAction(button);
  });

  fetch("/assets/data/vault-document-intake.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Unable to load BOF Vault intake data.");
      return response.json();
    })
    .then(function (data) {
      state.data = data;
      if (!findById(presets(), state.presetId)) state.presetId = presets()[0] ? presets()[0].id : "";
      resetSelections();
      addAudit((preset().label || "Scenario") + " scenario loaded.");
      render();
    })
    .catch(function (error) {
      mount.innerHTML = '<section class="vault-workbench-fallback"><span class="mini-status blocked">Data unavailable</span><h2>BOF Vault Intake Workbench could not load the work queue</h2><p>' + esc(error.message) + '</p><p>The intake workflow still follows this pattern: receive files, classify document types, match records, apply readiness rules, route exceptions to review, and build onboarding profiles.</p></section>';
    });
})();
