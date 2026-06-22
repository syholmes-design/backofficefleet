(function () {
  var mount = document.querySelector("[data-vault-document-intake]");
  if (!mount) return;

  var state = {
    selectedDocumentId: "",
    selectedTaskId: "",
    workflowIndex: 0,
    bulkStage: 0,
    documents: [],
    reviewTasks: [],
    readinessOutcomes: [],
    notice: "Select a sample document or run classification to begin the intake review.",
    bulkNotice: "Aggregator package is staged. Run the simulated bulk workflow to see BOF convert messy files into clean Vault records.",
    hierarchyStage: 0,
    selectedAffiliationId: "",
    showBlockedHierarchy: false,
    hierarchyNotice: "Hierarchy package is staged. Classify the network to see aggregator, carrier, operating unit, driver, and packet readiness."
  };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function statusClass(status) {
    var value = String(status || "").toLowerCase();
    if (value.indexOf("ready") >= 0 || value.indexOf("complete") >= 0 || value.indexOf("resolved") >= 0 || value.indexOf("verified") >= 0) return "ready";
    if (value.indexOf("blocked") >= 0 || value.indexOf("expired") >= 0 || value.indexOf("mismatch") >= 0) return "blocked";
    if (value.indexOf("risk") >= 0 || value.indexOf("review") >= 0 || value.indexOf("missing") >= 0 || value.indexOf("unclear") >= 0 || value.indexOf("conflict") >= 0 || value.indexOf("open") >= 0) return "review";
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

  function firstBulkBatch(data) {
    return data.bulkBatches && data.bulkBatches[0] ? data.bulkBatches[0] : {};
  }

  function metricCardHtml(label, value, detail, status) {
    return '<article class="vault-readiness-card"><span class="mini-status ' + statusClass(status || label) + '">' + esc(label) + '</span><strong>' + esc(value) + '</strong><p>' + esc(detail) + '</p></article>';
  }

  function findById(list, id) {
    return (list || []).filter(function (item) {
      return item.id === id;
    })[0] || {};
  }

  function firstAggregator(data) {
    return data.aggregators && data.aggregators[0] ? data.aggregators[0] : {};
  }

  function selectedAffiliation(data) {
    return findById(data.driverAffiliations || [], state.selectedAffiliationId) || (data.driverAffiliations || [])[0] || {};
  }

  function driverForAffiliation(data, affiliation) {
    return findById(data.drivers || [], affiliation.driverId);
  }

  function carrierForAffiliation(data, affiliation) {
    return findById(data.carriers || [], affiliation.carrierId);
  }

  function unitForAffiliation(data, affiliation) {
    return findById(data.operatingUnits || [], affiliation.operatingUnitId);
  }

  function packetForAffiliation(data, affiliation) {
    return (data.driverDocumentPackets || []).filter(function (packet) {
      return packet.driverId === affiliation.driverId && packet.carrierId === affiliation.carrierId && packet.aggregatorId === affiliation.aggregatorId;
    })[0] || {};
  }

  function listText(list) {
    return (list || []).length ? (list || []).join(", ") : "None";
  }

  function countByReadiness(records) {
    return (records || []).reduce(function (counts, record) {
      var key = record.readinessStatus || "Needs Review";
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  }

  function readinessCardsFromCounts(counts) {
    return [
      metricCardHtml("Ready", counts.Ready || 0, "Ready driver affiliations in the selected hierarchy.", "Ready"),
      metricCardHtml("At Risk", counts["At Risk"] || 0, "Driver affiliations with open risk items but not fully blocked.", "At Risk"),
      metricCardHtml("Blocked", counts.Blocked || 0, "Driver affiliations blocked by missing or expired evidence.", "Blocked"),
      metricCardHtml("Needs Review", counts["Needs Review"] || 0, "Driver affiliations requiring reviewer confirmation.", "Needs Review")
    ].join("");
  }

  function bulkStepHtml(data) {
    return '<div class="vault-workflow" aria-label="Aggregator bulk intake processing steps">' + (data.batchProcessingSteps || []).map(function (step, index) {
      var active = index + 1 === state.bulkStage ? " is-active" : index + 1 < state.bulkStage ? " is-done" : "";
      return '<button class="vault-step' + active + '" type="button" data-vault-bulk-step="' + (index + 1) + '"><span>' + String(index + 1).padStart(2, "0") + '</span><strong>' + esc(step.label) + '</strong><em>' + esc(step.description) + '</em></button>';
    }).join("") + "</div>";
  }

  function bulkIntakeHtml(data) {
    var batch = firstBulkBatch(data);
    var reviewTotal = (data.bulkReviewSummary || []).reduce(function (sum, item) { return sum + Number(item.count || 0); }, 0);
    return [
      '<section class="vault-section-block" id="aggregator-bulk-intake">',
      '  <div class="vault-section-heading"><span>Aggregator batch</span><h2>Aggregator Bulk Intake Simulation</h2><p>Simulate how BOF receives a large aggregator document package, classifies each file, converts it into the BOF Vault naming structure, routes exceptions, and updates readiness across the driver pool.</p></div>',
      '  <div class="vault-command-grid">',
      '    <article class="vault-intake-panel">',
      '      <div><span class="mini-status review">' + esc(batch.batchStatus || "Batch staged") + '</span><h2>' + esc(batch.aggregatorName || "Aggregator batch") + '</h2><p>' + esc(batch.readinessEffect || "") + '</p></div>',
      '      <dl class="selected-details">',
      '        <div><dt>Fleet/customer</dt><dd>' + esc(batch.fleetCustomer) + '</dd></div>',
      '        <div><dt>Drivers submitted</dt><dd>' + esc(batch.driversSubmitted) + '</dd></div>',
      '        <div><dt>Documents submitted</dt><dd>' + esc(batch.documentsSubmitted) + '</dd></div>',
      '        <div><dt>Auto-classified</dt><dd>' + esc(batch.autoClassified) + '</dd></div>',
      '      </dl>',
      '      <div class="vault-action-row">',
      '        <button type="button" data-vault-bulk-action="simulate-upload">Simulate Bulk Upload</button>',
      '        <button type="button" data-vault-bulk-action="run-classification">Run Batch Classification</button>',
      '        <button type="button" data-vault-bulk-action="generate-review">Generate Review Queue</button>',
      '        <button type="button" data-vault-bulk-action="update-readiness">Update Readiness</button>',
      '        <button type="button" data-vault-bulk-action="reset">Reset Demo</button>',
      '      </div>',
      '      <p class="vault-notice" aria-live="polite">' + esc(state.bulkNotice) + '</p>',
      '    </article>',
      '    <article class="vault-selected-record">',
      '      <span class="mini-status ' + statusClass(state.bulkStage >= 4 ? "Ready" : "Review") + '">' + esc(state.bulkStage >= 4 ? "Readiness updated" : "Batch review") + '</span>',
      '      <h2>Batch outcome snapshot</h2>',
      '      <p>BOF turns a messy aggregator submission into clear document counts, exception queues, readiness categories, and canonical Vault records.</p>',
      '      <dl>',
      '        <div><dt>Routed to review</dt><dd>' + esc(batch.routedToReview) + '</dd></div>',
      '        <div><dt>Expired documents</dt><dd>' + esc(batch.expiredDocuments) + '</dd></div>',
      '        <div><dt>Missing required fields</dt><dd>' + esc(batch.missingRequiredFields) + '</dd></div>',
      '        <div><dt>Wrong-driver matches</dt><dd>' + esc(batch.wrongDriverMatches) + '</dd></div>',
      '        <div><dt>Low confidence</dt><dd>' + esc(batch.lowConfidenceClassifications) + '</dd></div>',
      '        <div><dt>Needs verification</dt><dd>' + esc(batch.needsHumanVerification) + '</dd></div>',
      '        <div><dt>Open review total</dt><dd>' + esc(reviewTotal) + '</dd></div>',
      '      </dl>',
      '    </article>',
      '  </div>',
      bulkStepHtml(data),
      '  <div class="vault-readiness-grid">',
      metricCardHtml("Ready", batch.autoClassified || 0, "Files classified without human exception routing.", "Ready"),
      metricCardHtml("Review", batch.routedToReview || 0, "Files needing reviewer confirmation before readiness updates.", "Needs Review"),
      metricCardHtml("Blocked", batch.expiredDocuments || 0, "Expired records that can block readiness until corrected.", "Blocked"),
      metricCardHtml("Human verification", batch.needsHumanVerification || 0, "Records routed to BOF or fleet reviewers.", "Needs Review"),
      '  </div>',
      '</section>'
    ].join("");
  }

  function hierarchyStepHtml(data) {
    return '<div class="vault-workflow" aria-label="Aggregator hierarchy classification steps">' + (data.hierarchyWorkflowSteps || []).map(function (step, index) {
      var active = index + 1 === state.hierarchyStage ? " is-active" : index + 1 < state.hierarchyStage ? " is-done" : "";
      return '<button class="vault-step' + active + '" type="button" data-vault-hierarchy-step="' + (index + 1) + '"><span>' + String(index + 1).padStart(2, "0") + '</span><strong>' + esc(step.label) + '</strong><em>' + esc(step.description) + '</em></button>';
    }).join("") + "</div>";
  }

  function affiliationRowsHtml(data, affiliations) {
    return (affiliations || []).map(function (affiliation) {
      var driver = driverForAffiliation(data, affiliation);
      var carrier = carrierForAffiliation(data, affiliation);
      var unit = unitForAffiliation(data, affiliation);
      var active = affiliation.id === selectedAffiliation(data).id ? ' aria-current="true"' : "";
      return [
        '<tr' + active + '>',
        '  <td><button type="button" data-vault-affiliation="' + esc(affiliation.id) + '">' + esc(driver.id) + ' / ' + esc(driver.name) + '</button></td>',
        '  <td>' + esc(carrier.name) + '</td>',
        '  <td>' + esc(unit.name) + '</td>',
        '  <td>' + esc(affiliation.driverType) + '</td>',
        '  <td>' + esc(affiliation.status) + '</td>',
        '  <td>' + esc(affiliation.documentPacketStatus) + '</td>',
        '  <td><span class="mini-status ' + statusClass(affiliation.readinessStatus) + '">' + esc(affiliation.readinessStatus) + '</span></td>',
        '  <td>' + esc(affiliation.primaryException) + '</td>',
        '</tr>'
      ].join("");
    }).join("");
  }

  function hierarchyClassificationHtml(data) {
    var aggregator = firstAggregator(data);
    var affiliations = data.driverAffiliations || [];
    var visibleAffiliations = state.showBlockedHierarchy ? affiliations.filter(function (item) { return item.readinessStatus === "Blocked"; }) : affiliations;
    var selected = selectedAffiliation(data);
    var driver = driverForAffiliation(data, selected);
    var carrier = carrierForAffiliation(data, selected);
    var unit = unitForAffiliation(data, selected);
    var packet = packetForAffiliation(data, selected);
    var counts = countByReadiness(affiliations);
    var carrierCards = (data.carriers || []).map(function (item) {
      return metricCardHtml(item.name, item.readinessStatus, item.driverCount + " driver affiliations. " + item.primaryException, item.readinessStatus);
    }).join("");
    var unitCards = (data.operatingUnits || []).map(function (item) {
      return metricCardHtml(item.name, item.readinessStatus, item.driverCount + " driver affiliations. " + item.primaryException, item.readinessStatus);
    }).join("");

    return [
      '<section class="vault-section-block" id="aggregator-hierarchy-classification">',
      '  <div class="vault-section-heading"><span>Aggregator hierarchy</span><h2>Aggregator Hierarchy Classification</h2><p>BOF uses hierarchical classification so aggregator uploads can be reviewed by network, carrier, operating unit, driver, and document packet instead of becoming one unstructured file dump.</p></div>',
      '  <div class="vault-command-grid">',
      '    <article class="vault-intake-panel">',
      '      <div><span class="mini-status ' + statusClass(aggregator.readinessStatus) + '">' + esc(aggregator.readinessStatus) + '</span><h2>' + esc(aggregator.name) + '</h2><p>Classify each driver and document inside the aggregator network so BOF can determine readiness by aggregator, carrier, operating unit, driver, and document packet.</p></div>',
      '      <dl class="selected-details">',
      '        <div><dt>Aggregator ID</dt><dd>' + esc(aggregator.id) + '</dd></div>',
      '        <div><dt>Carriers</dt><dd>' + esc(aggregator.carrierCount) + '</dd></div>',
      '        <div><dt>Operating units</dt><dd>' + esc(aggregator.operatingUnitCount) + '</dd></div>',
      '        <div><dt>Driver affiliations</dt><dd>' + esc(aggregator.driverCount) + '</dd></div>',
      '        <div><dt>Primary exception</dt><dd>' + esc(aggregator.primaryException) + '</dd></div>',
      '      </dl>',
      '      <div class="vault-action-row">',
      '        <button type="button" data-vault-hierarchy-action="classify-network">Classify Network</button>',
      '        <button type="button" data-vault-hierarchy-action="match-drivers">Match Drivers to Carriers</button>',
      '        <button type="button" data-vault-hierarchy-action="build-packets">Build Driver Packets</button>',
      '        <button type="button" data-vault-hierarchy-action="calculate-readiness">Calculate Hierarchy Readiness</button>',
      '        <button type="button" data-vault-hierarchy-action="show-blocked">Show Blocked Drivers</button>',
      '        <button type="button" data-vault-hierarchy-action="reset">Reset Hierarchy Demo</button>',
      '      </div>',
      '      <p class="vault-notice" aria-live="polite">' + esc(state.hierarchyNotice) + '</p>',
      '    </article>',
      '    <article class="vault-selected-record">',
      '      <span class="mini-status ' + statusClass(selected.readinessStatus) + '">' + esc(selected.readinessStatus || "Selected path") + '</span>',
      '      <h2>Hierarchy drilldown path</h2>',
      '      <p>' + esc(aggregator.name) + ' -> ' + esc(carrier.name) + ' -> ' + esc(unit.name) + ' -> ' + esc(driver.id) + ' ' + esc(driver.name) + ' -> ' + esc(listText(packet.requiredDocuments)) + ' -> ' + esc(packet.readinessStatus || selected.readinessStatus) + '</p>',
      '      <dl>',
      '        <div><dt>Aggregator</dt><dd>' + esc(aggregator.id) + ' / ' + esc(aggregator.name) + '</dd></div>',
      '        <div><dt>Carrier</dt><dd>' + esc(selected.carrierId) + ' / ' + esc(carrier.name) + '</dd></div>',
      '        <div><dt>Operating unit</dt><dd>' + esc(selected.operatingUnitId) + ' / ' + esc(unit.name) + '</dd></div>',
      '        <div><dt>Driver</dt><dd>' + esc(selected.driverId) + ' / ' + esc(driver.name) + '</dd></div>',
      '        <div><dt>Driver type</dt><dd>' + esc(selected.driverType) + '</dd></div>',
      '        <div><dt>Packet status</dt><dd>' + esc(selected.documentPacketStatus) + '</dd></div>',
      '      </dl>',
      '    </article>',
      '  </div>',
      hierarchyStepHtml(data),
      '  <div class="vault-readiness-grid">',
      readinessCardsFromCounts(counts),
      '  </div>',
      '  <div class="vault-section-heading"><span>Carrier readiness</span><h2>Readiness by carrier</h2><p>Carrier-level rollups reveal whether issues sit with one carrier, one operating unit, or one driver packet.</p></div>',
      '  <div class="vault-readiness-grid">' + carrierCards + '</div>',
      '  <div class="vault-section-heading"><span>Operating units</span><h2>Readiness by operating unit</h2><p>Operating-unit views help aggregator teams isolate regional, equipment, and pooled-driver exceptions.</p></div>',
      '  <div class="vault-readiness-grid">' + unitCards + '</div>',
      '  <div class="vault-section-heading"><span>Driver affiliations</span><h2>Driver readiness list</h2><p>' + esc(state.showBlockedHierarchy ? "Showing blocked driver affiliations only." : "Showing all driver affiliations in the aggregator hierarchy.") + '</p></div>',
      '  <div class="route-table-wrap"><table class="route-table"><thead><tr><th>Driver</th><th>Carrier</th><th>Operating unit</th><th>Driver type</th><th>Status</th><th>Document packet</th><th>Readiness</th><th>Primary exception</th></tr></thead><tbody>',
      affiliationRowsHtml(data, visibleAffiliations),
      '  </tbody></table></div>',
      '  <div class="vault-command-grid">',
      '    <article class="vault-selected-record">',
      '      <span class="mini-status ' + statusClass(packet.readinessStatus) + '">' + esc(packet.readinessStatus || "Packet") + '</span>',
      '      <h2>Selected driver document packet</h2>',
      '      <p>' + esc(driver.name) + ' packet evidence for ' + esc(carrier.name) + ' inside ' + esc(aggregator.name) + '.</p>',
      '      <dl>',
      '        <div><dt>Packet ID</dt><dd>' + esc(packet.id) + '</dd></div>',
      '        <div><dt>Required documents</dt><dd>' + esc(listText(packet.requiredDocuments)) + '</dd></div>',
      '        <div><dt>Missing documents</dt><dd>' + esc(listText(packet.missingDocuments)) + '</dd></div>',
      '        <div><dt>Expired documents</dt><dd>' + esc(listText(packet.expiredDocuments)) + '</dd></div>',
      '        <div><dt>Human review</dt><dd>' + esc(listText(packet.humanReview)) + '</dd></div>',
      '      </dl>',
      '    </article>',
      '    <article class="vault-selected-record">',
      '      <span class="mini-status review">Exceptions by level</span>',
      '      <h2>Document exceptions by hierarchy level</h2>',
      '      <div class="vault-review-list">',
      (data.hierarchyExceptions || []).map(function (item) {
        return '<article class="vault-review-card"><span class="mini-status ' + statusClass(item.status) + '">' + esc(item.status) + '</span><strong>' + esc(item.level) + ' / ' + esc(item.entityId) + '</strong><em>' + esc(item.owner) + '</em><p>' + esc(item.exception) + '</p></article>';
      }).join(""),
      '      </div>',
      '    </article>',
      '  </div>',
      '</section>'
    ].join("");
  }

  function bulkReviewHtml(data) {
    return [
      '<section class="vault-section-block">',
      '  <div class="vault-section-heading"><span>Batch exceptions</span><h2>Bulk review summary</h2><p>BOF groups exception types so aggregator submissions become manageable reviewer queues instead of a folder of ambiguous files.</p></div>',
      '  <div class="vault-review-list">',
      (data.bulkReviewSummary || []).map(function (item) {
        return '<article class="vault-review-card"><span class="mini-status ' + statusClass(item.status) + '">' + esc(item.status) + '</span><strong>' + esc(item.type) + '</strong><em>' + esc(item.owner) + '</em><p>' + esc(item.count) + ' documents routed for follow-up.</p></article>';
      }).join(""),
      '  </div>',
      '</section>',
      '<section class="vault-section-block">',
      '  <div class="vault-section-heading"><span>Driver pool</span><h2>Bulk readiness outcome</h2><p>After the simulated batch review, BOF summarizes readiness across the submitted driver pool.</p></div>',
      '  <div class="vault-readiness-grid">',
      (data.bulkReadinessSummary || []).map(function (outcome) {
        return metricCardHtml(outcome.status, outcome.count, outcome.description, outcome.status);
      }).join(""),
      '  </div>',
      '</section>'
    ].join("");
  }

  function fileConversionHtml(data) {
    return [
      '<section class="vault-section-block">',
      '  <div class="vault-section-heading"><span>BOF naming</span><h2>BOF Vault File Conversion</h2><p>Messy inbound filenames become canonical BOF Vault names that carry owner, document type, primary/secondary role, dates, and review status.</p></div>',
      '  <div class="route-table-wrap"><table class="route-table"><thead><tr><th>Original file name</th><th>Detected type</th><th>Assigned entity</th><th>BOF canonical file name</th><th>Storage category</th><th>Primary / secondary</th><th>Compliance</th><th>Readiness effect</th><th>Review status</th></tr></thead><tbody>',
      (data.fileConversions || []).map(function (item) {
        return '<tr><td>' + esc(item.originalFileName) + '</td><td>' + esc(item.detectedDocumentType) + '</td><td>' + esc(item.assignedEntityType + " / " + item.assignedEntityId + " / " + item.assignedEntityName) + '</td><td>' + esc(item.canonicalFileName) + '</td><td>' + esc(item.storageCategory) + '</td><td>' + esc(item.primarySecondary) + '</td><td><span class="mini-status ' + statusClass(item.complianceStatus) + '">' + esc(item.complianceStatus) + '</span></td><td>' + esc(item.readinessEffect) + '</td><td>' + esc(item.reviewStatus) + '</td></tr>';
      }).join(""),
      '  </tbody></table></div>',
      '</section>'
    ].join("");
  }

  function manifestHtml(data) {
    return [
      '<section class="vault-section-block">',
      '  <div class="vault-section-heading"><span>Aggregator manifest</span><h2>Aggregator Manifest</h2><p>The production MVP will support manifest-assisted matching for large uploads so BOF can connect submitted files to drivers, carriers, loads, dates, and notes more quickly.</p></div>',
      '  <div class="route-table-wrap"><table class="route-table"><thead><tr><th>Manifest field</th><th>Example</th><th>How BOF uses it</th></tr></thead><tbody>',
      (data.manifestFields || []).map(function (field) {
        return '<tr><td>' + esc(field.field) + '</td><td>' + esc(field.example) + '</td><td>' + esc(field.purpose) + '</td></tr>';
      }).join(""),
      '  </tbody></table></div>',
      '</section>'
    ].join("");
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
      '<section class="vault-demo-boundary"><strong>BOF Vault demo workflow</strong><p>This is a static BOF Vault demo. The production MVP will use secure storage, authentication, access controls, audit logs, backend processing, OCR/document extraction, and controlled document retention.</p></section>'
    ].join("");
  }

  function render(data) {
    mount.innerHTML = [
      '<section class="vault-intake-hero">',
      '  <div><span class="mini-status ready">BOF Vault</span><h1>Intake command view</h1><p>Upload, classify, verify, and route driver and fleet documents before they affect readiness.</p></div>',
      '  <dl><div><dt>Documents modeled</dt><dd>' + esc(data.documentTypes.length) + '</dd></div><div><dt>Review tasks</dt><dd>' + esc(state.reviewTasks.length) + '</dd></div><div><dt>Bulk documents</dt><dd>' + esc((firstBulkBatch(data).documentsSubmitted || 0)) + '</dd></div></dl>',
      '</section>',
      workflowHtml(data),
      bulkIntakeHtml(data),
      hierarchyClassificationHtml(data),
      fileConversionHtml(data),
      manifestHtml(data),
      bulkReviewHtml(data),
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

  function handleBulkAction(action, data) {
    var batch = firstBulkBatch(data);
    if (action === "simulate-upload") {
      state.bulkStage = 1;
      state.bulkNotice = batch.documentsSubmitted + " documents received from " + batch.aggregatorName + " for " + batch.driversSubmitted + " submitted drivers.";
    }
    if (action === "run-classification") {
      state.bulkStage = 2;
      state.bulkNotice = batch.autoClassified + " documents auto-classified; BOF canonical naming is ready for review.";
    }
    if (action === "generate-review") {
      state.bulkStage = 3;
      state.bulkNotice = batch.routedToReview + " documents routed into exception queues for expired, missing, wrong-driver, low-confidence, and verification issues.";
    }
    if (action === "update-readiness") {
      state.bulkStage = 4;
      state.bulkNotice = "Driver-pool readiness updated: 63 Ready, 21 At Risk, 5 Blocked, 11 Needs Review.";
    }
    if (action === "reset") {
      state.bulkStage = 0;
      state.bulkNotice = "Aggregator package is staged. Run the simulated bulk workflow to see BOF convert messy files into clean Vault records.";
    }
    render(data);
  }

  function handleHierarchyAction(action, data) {
    var aggregator = firstAggregator(data);
    if (action === "classify-network") {
      state.hierarchyStage = 1;
      state.showBlockedHierarchy = false;
      state.hierarchyNotice = "Network classified: " + aggregator.id + " -> " + aggregator.carrierCount + " carriers -> " + aggregator.operatingUnitCount + " operating units -> " + aggregator.driverCount + " driver affiliations.";
    }
    if (action === "match-drivers") {
      state.hierarchyStage = 2;
      state.showBlockedHierarchy = false;
      state.hierarchyNotice = (data.driverAffiliations || []).length + " canonical driver records matched to carrier and operating-unit affiliations.";
    }
    if (action === "build-packets") {
      state.hierarchyStage = 3;
      state.showBlockedHierarchy = false;
      state.hierarchyNotice = (data.driverDocumentPackets || []).length + " driver document packets built from required, missing, expired, and human-review document lists.";
    }
    if (action === "calculate-readiness") {
      state.hierarchyStage = 4;
      state.showBlockedHierarchy = false;
      state.hierarchyNotice = "Hierarchy readiness calculated by aggregator, carrier, operating unit, driver, and packet.";
    }
    if (action === "show-blocked") {
      var blocked = (data.driverAffiliations || []).filter(function (item) { return item.readinessStatus === "Blocked"; });
      state.hierarchyStage = 5;
      state.showBlockedHierarchy = true;
      if (blocked[0]) state.selectedAffiliationId = blocked[0].id;
      state.hierarchyNotice = "Showing " + blocked.length + " blocked driver affiliations with packet-level exceptions.";
    }
    if (action === "reset") {
      state.hierarchyStage = 0;
      state.showBlockedHierarchy = false;
      state.selectedAffiliationId = (data.driverAffiliations || [])[0] ? data.driverAffiliations[0].id : "";
      state.hierarchyNotice = "Hierarchy package is staged. Classify the network to see aggregator, carrier, operating unit, driver, and packet readiness.";
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
    mount.querySelectorAll("[data-vault-bulk-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        handleBulkAction(button.getAttribute("data-vault-bulk-action"), data);
      });
    });
    mount.querySelectorAll("[data-vault-bulk-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.bulkStage = Number(button.getAttribute("data-vault-bulk-step") || "0");
        var step = (data.batchProcessingSteps || [])[state.bulkStage - 1];
        state.bulkNotice = step ? "Batch step selected: " + step.label + "." : state.bulkNotice;
        render(data);
      });
    });
    mount.querySelectorAll("[data-vault-hierarchy-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        handleHierarchyAction(button.getAttribute("data-vault-hierarchy-action"), data);
      });
    });
    mount.querySelectorAll("[data-vault-hierarchy-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.hierarchyStage = Number(button.getAttribute("data-vault-hierarchy-step") || "0");
        var step = (data.hierarchyWorkflowSteps || [])[state.hierarchyStage - 1];
        state.hierarchyNotice = step ? "Hierarchy step selected: " + step.label + "." : state.hierarchyNotice;
        render(data);
      });
    });
    mount.querySelectorAll("[data-vault-affiliation]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedAffiliationId = button.getAttribute("data-vault-affiliation") || state.selectedAffiliationId;
        state.showBlockedHierarchy = false;
        var affiliation = selectedAffiliation(data);
        var driver = driverForAffiliation(data, affiliation);
        state.hierarchyNotice = "Opened " + driver.name + " inside the aggregator hierarchy.";
        render(data);
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
      state.selectedAffiliationId = data.driverAffiliations && data.driverAffiliations[0] ? data.driverAffiliations[0].id : "";
      render(data);
    })
    .catch(function (error) {
      mount.innerHTML = '<section class="vault-loading-card"><span class="mini-status blocked">Data error</span><h2>BOF Vault intake data did not load</h2><p>' + esc(error.message) + '</p></section>';
    });
})();
