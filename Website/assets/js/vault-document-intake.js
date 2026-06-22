(function () {
  var mount = document.querySelector("[data-vault-document-intake]");
  if (!mount) return;

  var state = {
    selectedDocumentId: "",
    selectedTaskId: "",
    workflowIndex: 0,
    documents: [],
    reviewTasks: [],
    readinessOutcomes: [],
    notice: "Select a sample document or run classification to begin the intake review."
  };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function statusClass(status) {
    var value = String(status || "").toLowerCase();
    if (value.indexOf("ready") >= 0 || value.indexOf("complete") >= 0 || value.indexOf("resolved") >= 0) return "ready";
    if (value.indexOf("blocked") >= 0 || value.indexOf("expired") >= 0 || value.indexOf("mismatch") >= 0) return "blocked";
    if (value.indexOf("risk") >= 0 || value.indexOf("review") >= 0 || value.indexOf("missing") >= 0 || value.indexOf("unclear") >= 0 || value.indexOf("conflict") >= 0) return "review";
    return "watch";
  }

  function selectedDocument() {
    return state.documents.filter(function (doc) {
      return doc.id === state.selectedDocumentId;
    })[0] || state.documents[0];
  }

  function selectedTask() {
    return state.reviewTasks.filter(function (task) {
      return task.id === state.selectedTaskId;
    })[0] || state.reviewTasks[0];
  }

  function tasksForDocument(documentId) {
    return state.reviewTasks.filter(function (task) {
      return task.documentId === documentId;
    });
  }

  function workflowHtml(data) {
    return '<section class="vault-workflow" aria-label="BOF Vault intake workflow">' + data.workflowSteps.map(function (step, index) {
      var active = index === state.workflowIndex ? " is-active" : index < state.workflowIndex ? " is-done" : "";
      return '<button class="vault-step' + active + '" type="button" data-vault-step="' + index + '"><span>' + String(index + 1).padStart(2, "0") + '</span><strong>' + esc(step.label) + '</strong><em>' + esc(step.description) + '</em></button>';
    }).join("") + "</section>";
  }

  function intakePanelHtml() {
    var doc = selectedDocument();
    var docTasks = tasksForDocument(doc.id);
    return [
      '<section class="vault-command-grid">',
      '  <article class="vault-intake-panel">',
      '    <div><span class="mini-status review">Simulated intake</span><h2>Sample document intake panel</h2><p>No file is transmitted, stored, OCR processed, or uploaded. These controls simulate how a BOF Vault intake reviewer would classify and route a document.</p></div>',
      '    <div class="vault-upload-zone" role="group" aria-label="Simulated document upload">',
      '      <strong>' + esc(doc.documentName) + '</strong>',
      '      <span>' + esc(doc.documentType) + ' / ' + esc(doc.assignedEntity) + '</span>',
      '      <em>Sample selected from BOF Vault demo data</em>',
      '    </div>',
      '    <div class="vault-action-row">',
      '      <button type="button" data-vault-action="select-sample">Select sample document</button>',
      '      <button type="button" data-vault-action="classify">Run classification</button>',
      '      <button type="button" data-vault-action="route-exception">Send exception to review</button>',
      '      <button type="button" data-vault-action="resolve-task"' + (docTasks.length ? "" : " disabled") + '>Clear review task</button>',
      '      <button type="button" data-vault-action="update-readiness">Update readiness status</button>',
      '    </div>',
      '    <p class="vault-notice" aria-live="polite">' + esc(state.notice) + '</p>',
      '  </article>',
      '  <article class="vault-selected-record">',
      '    <span class="mini-status ' + statusClass(doc.complianceStatus) + '">' + esc(doc.complianceStatus) + '</span>',
      '    <h2>' + esc(doc.id) + ' / ' + esc(doc.documentType) + '</h2>',
      '    <p>' + esc(doc.readinessEffect) + '</p>',
      '    <dl>',
      '      <div><dt>Assigned to</dt><dd>' + esc(doc.assignedEntity) + '</dd></div>',
      '      <div><dt>Effective date</dt><dd>' + esc(doc.effectiveDate) + '</dd></div>',
      '      <div><dt>Expiration date</dt><dd>' + esc(doc.expirationDate) + '</dd></div>',
      '      <div><dt>Primary / secondary</dt><dd>' + esc(doc.priority) + '</dd></div>',
      '      <div><dt>Required fields</dt><dd><span class="mini-status ' + statusClass(doc.requiredFieldsStatus) + '">' + esc(doc.requiredFieldsStatus) + '</span></dd></div>',
      '      <div><dt>Verification source</dt><dd>' + esc(doc.verificationSource) + '</dd></div>',
      '      <div><dt>Confidence score</dt><dd>' + esc(doc.confidenceScore) + '%</dd></div>',
      '      <div><dt>Issuer / source</dt><dd>' + esc(doc.issuer) + '</dd></div>',
      '    </dl>',
      '  </article>',
      '</section>'
    ].join("");
  }

  function documentCardsHtml() {
    return [
      '<section class="vault-section-block">',
      '  <div class="vault-section-heading"><span>Intake records</span><h2>Sample document cards</h2><p>Each record keeps the document type, owner, dates, verification source, compliance status, confidence, and readiness effect visible before the record affects operations.</p></div>',
      '  <div class="vault-document-grid">',
      state.documents.map(function (doc) {
        var active = doc.id === selectedDocument().id ? " is-active" : "";
        return [
          '<button class="vault-document-card' + active + '" type="button" data-vault-doc="' + esc(doc.id) + '" aria-pressed="' + String(Boolean(active)) + '">',
          '  <header><span>' + esc(doc.id) + '</span><strong>' + esc(doc.documentName) + '</strong><em class="mini-status ' + statusClass(doc.complianceStatus) + '">' + esc(doc.complianceStatus) + '</em></header>',
          '  <p>' + esc(doc.readinessEffect) + '</p>',
          '  <dl>',
          '    <div><dt>Assigned driver/entity</dt><dd>' + esc(doc.assignedEntity) + '</dd></div>',
          '    <div><dt>Document type</dt><dd>' + esc(doc.documentType) + '</dd></div>',
          '    <div><dt>Effective</dt><dd>' + esc(doc.effectiveDate) + '</dd></div>',
          '    <div><dt>Expiration</dt><dd>' + esc(doc.expirationDate) + '</dd></div>',
          '    <div><dt>Primary / secondary</dt><dd>' + esc(doc.priority) + '</dd></div>',
          '    <div><dt>Required fields</dt><dd>' + esc(doc.requiredFieldsStatus) + '</dd></div>',
          '    <div><dt>Verification source</dt><dd>' + esc(doc.verificationSource) + '</dd></div>',
          '    <div><dt>Confidence</dt><dd>' + esc(doc.confidenceScore) + '%</dd></div>',
          '  </dl>',
          '</button>'
        ].join("");
      }).join(""),
      '  </div>',
      '</section>'
    ].join("");
  }

  function reviewQueueHtml() {
    return [
      '<section class="vault-section-block">',
      '  <div class="vault-section-heading"><span>Human review</span><h2>Review queue</h2><p>Exceptions stay routed to a named work queue until a BOF or fleet reviewer clears the issue.</p></div>',
      '  <div class="vault-review-list">',
      state.reviewTasks.map(function (task) {
        var doc = state.documents.filter(function (item) { return item.id === task.documentId; })[0] || {};
        var active = task.id === (selectedTask() || {}).id ? " is-active" : "";
        return [
          '<button class="vault-review-card' + active + '" type="button" data-vault-task="' + esc(task.id) + '" aria-pressed="' + String(Boolean(active)) + '">',
          '  <span class="mini-status ' + statusClass(task.status) + '">' + esc(task.status) + '</span>',
          '  <strong>' + esc(task.type) + '</strong>',
          '  <em>' + esc(task.id) + ' / ' + esc(task.owner) + '</em>',
          '  <p>' + esc(task.nextAction) + '</p>',
          '  <small>' + esc(task.documentId) + ' - ' + esc(doc.documentName || "Document") + '</small>',
          '</button>'
        ].join("");
      }).join(""),
      '  </div>',
      '</section>'
    ].join("");
  }

  function readinessHtml() {
    return [
      '<section class="vault-section-block">',
      '  <div class="vault-section-heading"><span>Readiness effect</span><h2>Driver and document readiness</h2><p>BOF keeps status categories clear so documents do not silently affect dispatch, compliance, settlements, or operational readiness.</p></div>',
      '  <div class="vault-readiness-grid">',
      state.readinessOutcomes.map(function (outcome) {
        return [
          '<article class="vault-readiness-card">',
          '  <span class="mini-status ' + statusClass(outcome.status) + '">' + esc(outcome.status) + '</span>',
          '  <strong>' + esc(outcome.count) + '</strong>',
          '  <p>' + esc(outcome.description) + '</p>',
          '</article>'
        ].join("");
      }).join(""),
      '  </div>',
      '</section>'
    ].join("");
  }

  function checksHtml(data) {
    return [
      '<section class="vault-section-block">',
      '  <div class="vault-section-heading"><span>Rule model</span><h2>Compliance checks and verification sources</h2><p>The demo uses verification source language so each document can point to the right issuer, reviewer, customer, carrier, insurer, or load record validation path.</p></div>',
      '  <div class="vault-check-grid">',
      data.complianceChecks.map(function (check) {
        return '<article><span class="mini-status ready">' + esc(check.status) + '</span><h3>' + esc(check.label) + '</h3><p>' + esc(check.description) + '</p></article>';
      }).join(""),
      '  </div>',
      '</section>',
      '<section class="vault-demo-boundary"><strong>BOF Vault demo workflow</strong><p>The production MVP will use secure storage, authentication, audit logs, backend processing, and controlled document access. This page is a controlled walkthrough of the intake workflow only.</p></section>'
    ].join("");
  }

  function render(data) {
    mount.innerHTML = [
      '<section class="vault-intake-hero">',
      '  <div><span class="mini-status ready">BOF Vault</span><h1>Intake command view</h1><p>Upload, classify, verify, and route driver and fleet documents before they affect readiness.</p></div>',
      '  <dl><div><dt>Documents modeled</dt><dd>' + esc(data.documentTypes.length) + '</dd></div><div><dt>Review tasks</dt><dd>' + esc(state.reviewTasks.length) + '</dd></div><div><dt>Workflow steps</dt><dd>' + esc(data.workflowSteps.length) + '</dd></div></dl>',
      '</section>',
      workflowHtml(data),
      intakePanelHtml(),
      documentCardsHtml(),
      reviewQueueHtml(),
      readinessHtml(),
      checksHtml(data)
    ].join("");
    bind(data);
  }

  function setWorkflow(index) {
    state.workflowIndex = Math.max(0, Math.min(index, 10));
  }

  function setNotice(message) {
    state.notice = message;
  }

  function advanceDocument() {
    var current = state.documents.findIndex(function (doc) { return doc.id === selectedDocument().id; });
    var next = current + 1 >= state.documents.length ? 0 : current + 1;
    state.selectedDocumentId = state.documents[next].id;
    var task = tasksForDocument(state.selectedDocumentId)[0];
    state.selectedTaskId = task ? task.id : state.reviewTasks[0].id;
  }

  function resolveSelectedTask() {
    var task = selectedTask();
    if (!task) return false;
    task.status = "Resolved";
    var doc = state.documents.filter(function (item) { return item.id === task.documentId; })[0];
    if (doc) {
      doc.complianceStatus = doc.complianceStatus === "Blocked" ? "At Risk" : "Ready";
      doc.requiredFieldsStatus = doc.requiredFieldsStatus === "Complete" ? doc.requiredFieldsStatus : "Reviewer cleared";
      doc.readinessEffect = "Reviewer cleared the intake exception and readiness can be updated.";
    }
    return true;
  }

  function updateReadiness() {
    state.readinessOutcomes = state.readinessOutcomes.map(function (outcome) {
      if (outcome.status === "Ready") return Object.assign({}, outcome, { count: outcome.count + 1 });
      if (outcome.status === "Needs Review" && outcome.count > 0) return Object.assign({}, outcome, { count: outcome.count - 1 });
      return outcome;
    });
  }

  function handleAction(action, data) {
    var doc = selectedDocument();
    if (action === "select-sample") {
      advanceDocument();
      setWorkflow(0);
      setNotice("Sample document selected from the static BOF Vault intake queue.");
    }
    if (action === "classify") {
      setWorkflow(8);
      setNotice(doc.documentType + " classified with " + doc.confidenceScore + "% confidence and verification source assigned.");
    }
    if (action === "route-exception") {
      var tasks = tasksForDocument(doc.id);
      setWorkflow(9);
      setNotice(tasks.length ? "Exception routed to " + tasks[0].owner + ": " + tasks[0].type + "." : "No open exception for this document; it remains ready for the next readiness update.");
    }
    if (action === "resolve-task") {
      setWorkflow(9);
      setNotice(resolveSelectedTask() ? "Review task cleared and document status updated in this demo session." : "No review task is selected.");
    }
    if (action === "update-readiness") {
      setWorkflow(10);
      updateReadiness();
      setNotice("Readiness summary updated after the simulated review action.");
    }
    render(data);
  }

  function bind(data) {
    mount.querySelectorAll("[data-vault-doc]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedDocumentId = button.getAttribute("data-vault-doc") || state.selectedDocumentId;
        var task = tasksForDocument(state.selectedDocumentId)[0];
        if (task) state.selectedTaskId = task.id;
        setNotice("Opened " + selectedDocument().documentName + " for intake review.");
        render(data);
      });
    });
    mount.querySelectorAll("[data-vault-task]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedTaskId = button.getAttribute("data-vault-task") || state.selectedTaskId;
        var task = selectedTask();
        if (task) state.selectedDocumentId = task.documentId;
        setNotice("Opened review task " + (task ? task.id : "") + " for simulated human verification.");
        render(data);
      });
    });
    mount.querySelectorAll("[data-vault-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        setWorkflow(Number(button.getAttribute("data-vault-step") || "0"));
        setNotice("Workflow step selected: " + data.workflowSteps[state.workflowIndex].label + ".");
        render(data);
      });
    });
    mount.querySelectorAll("[data-vault-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        handleAction(button.getAttribute("data-vault-action"), data);
      });
    });
  }

  fetch("/assets/data/vault-document-intake.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Unable to load BOF Vault intake data.");
      return response.json();
    })
    .then(function (data) {
      state.documents = data.sampleDocuments.slice();
      state.reviewTasks = data.reviewTasks.slice();
      state.readinessOutcomes = data.readinessOutcomes.slice();
      state.selectedDocumentId = state.documents[0] ? state.documents[0].id : "";
      state.selectedTaskId = state.reviewTasks[0] ? state.reviewTasks[0].id : "";
      render(data);
    })
    .catch(function (error) {
      mount.innerHTML = '<section class="vault-loading-card"><span class="mini-status blocked">Data error</span><h2>BOF Vault intake data did not load</h2><p>' + esc(error.message) + '</p></section>';
    });
})();
