(function () {
  "use strict";

  var root = document.querySelector("[data-customer-demo-app]");
  if (!root) return;

  var workflowSteps = [
    "Shipper Intake",
    "Load Created",
    "Driver Assigned",
    "Document Requested",
    "Document Uploaded",
    "Exception Resolution",
    "Proof Packet Complete",
    "Billing Ready",
    "Financing Ready",
    "Executive Review"
  ];

  var sidebarItems = [
    { id: "manager", label: "Manager Portal", icon: "manager" },
    { id: "driver", label: "Driver Portal", icon: "driver" },
    { id: "customer", label: "Customer Portal", icon: "customer" },
    { id: "safety", label: "Safety & Compliance", icon: "safety" },
    { id: "maintenance", label: "Maintenance & Equipment", icon: "maintenance" },
    { id: "finance", label: "Finance Readiness", icon: "finance" },
    { id: "vault", label: "BOF Vault", icon: "documents" },
    { id: "policy", label: "Policy Governance", icon: "documents" }
  ];

  var portalAliases = {
    dispatch: "manager",
    dispatcher: "manager",
    documents: "vault",
    document: "vault",
    "document-control": "vault",
    "bof-vault": "vault",
    policies: "policy",
    "policies-procedures": "policy",
    "policy-governance": "policy"
  };

  var publicReturnRoutes = {
    manager: "/dispatch/",
    driver: "/drivers/",
    safety: "/safety/",
    maintenance: "/business-operations/fleet-maintenance/",
    customer: "/customer-portal/",
    finance: "/settlements/",
    vault: "/bof-vault/",
    policy: "/policies-procedures/"
  };

  var publicReturnLabels = {
    manager: "Dispatch & Operations",
    driver: "Drivers",
    safety: "Safety & Compliance",
    maintenance: "Fleet Maintenance",
    customer: "Customer Portal",
    finance: "Settlements & Billing",
    vault: "BOF Vault",
    policy: "Policies & Procedures"
  };

  var personaGroups = [
    {
      label: "Operational Personas",
      items: [
        { id: "driver", label: "Driver", descriptor: "Driver-ready packet and document state", icon: "driver" },
        { id: "dispatcher", label: "Dispatcher", descriptor: "Load timing, release risk, and assignment context", icon: "dispatch" },
        { id: "safety", label: "Safety", descriptor: "Credential exceptions, holds, and corrective action", icon: "safety" },
        { id: "maintenance", label: "Maintenance", descriptor: "Unit readiness, PM due, and defect review", icon: "maintenance" }
      ]
    },
    {
      label: "Business Personas",
      items: [
        { id: "customer", label: "Customer", descriptor: "Shipment visibility, proof expectations, and billing readiness", icon: "customer" },
        { id: "finance", label: "Finance", descriptor: "Receivable quality, readiness score, and hold reasons", icon: "finance" },
        { id: "manager", label: "Manager", descriptor: "Executive summary, activity, and action queue", icon: "manager" }
      ]
    }
  ];

  var scenarioMeta = {
    "BOF-1907": {
      shipmentRef: "SHP-1907-TUL-KCY",
      issueType: "POD Missing",
      urgency: "High",
      age: "18 hrs",
      proofReadiness: "Pending Review",
      effect: "$2,840 settlement held until POD review clears",
      customerStatus: "In transit with proof review notice",
      billingContact: "ap@kccy.example",
      pickupWindow: "Jun 7, 2026 08:00-09:30 CT",
      deliveryWindow: "Jun 7, 2026 16:00-18:00 CT",
      dispatchRestriction: "Delivery complete; closeout waits on POD and support receipts.",
      requiredAction: "Review POD images, signed BOL, and detention support.",
      requiredProof: "Signed POD, receiver stamp, lumper or detention support",
      approvalState: "Packet owner review required before release",
      driverDescriptor: "Assigned with review",
      customerVisibility: "Delivery visible, billing release pending proof confirmation",
      financialEffect: "Invoice release held pending POD and detention support",
      billingReadiness: "Pending proof closeout",
      financingReadiness: "Moderate; packet incomplete",
      urgencyReason: "Customer has delivery confirmation but missing final packet release items.",
      proofItems: {
        bol: "Complete",
        pod: "Pending Review",
        seal: "Complete",
        lumper: "Pending Review",
        scale: "Complete",
        delivery: "Pending Review",
        invoice: "Generated Draft"
      },
      defaultStep: 9,
      detailStep: 5
    },
    "BOF-1931": {
      shipmentRef: "SHP-1931-LIT-STL",
      issueType: "Driver Document",
      urgency: "Blocked",
      age: "26 hrs",
      proofReadiness: "Missing",
      effect: "Dispatch blocked and settlement stays held",
      customerStatus: "Commitment pending operations review",
      billingContact: "carrierdesk@stlreceiver.example",
      pickupWindow: "Jun 7, 2026 07:00-08:00 CT",
      deliveryWindow: "Jun 7, 2026 14:00-15:30 CT",
      dispatchRestriction: "Do not assign until corrected medical card and MVR review clear.",
      requiredAction: "Collect corrected medical card and complete MVR review.",
      requiredProof: "Qualification correction, MVR review, updated assignment clearance",
      approvalState: "Safety hold",
      driverDescriptor: "Administrative hold",
      customerVisibility: "Load review in progress before final scheduling confirmation",
      financialEffect: "No invoice or settlement release while blocked",
      billingReadiness: "Not ready",
      financingReadiness: "Low until packet and assignment clear",
      urgencyReason: "Qualification issue prevents assignment and downstream document generation.",
      proofItems: {
        bol: "Missing",
        pod: "Missing",
        seal: "Missing",
        lumper: "Missing",
        scale: "Missing",
        delivery: "Missing",
        invoice: "Generated Draft"
      },
      defaultStep: 9,
      detailStep: 5
    },
    "BOF-2064": {
      shipmentRef: "SHP-2064-BHM-BNA",
      issueType: "Ready to Bill",
      urgency: "Normal",
      age: "6 hrs",
      proofReadiness: "Complete",
      effect: "$4,850 revenue can progress to invoice release",
      customerStatus: "Delivered and ready for billing",
      billingContact: "billing@nashdist.example",
      pickupWindow: "Jun 7, 2026 05:30-06:15 CT",
      deliveryWindow: "Jun 7, 2026 12:00-13:00 CT",
      dispatchRestriction: "None",
      requiredAction: "Release invoice draft and executive summary update.",
      requiredProof: "Final invoice release and customer packet confirmation",
      approvalState: "Ready for release",
      driverDescriptor: "Assigned",
      customerVisibility: "Delivered with complete packet",
      financialEffect: "Ready to bill and settlement complete",
      billingReadiness: "Ready",
      financingReadiness: "High; packet complete",
      urgencyReason: "Use as the clean reference case in the walkthrough.",
      proofItems: {
        bol: "Customer Released",
        pod: "Complete",
        seal: "Complete",
        lumper: "Complete",
        scale: "Complete",
        delivery: "Customer Released",
        invoice: "Generated Draft"
      },
      defaultStep: 9,
      detailStep: 9
    },
    "BOF-2175": {
      shipmentRef: "SHP-2175-MOB-ATL",
      issueType: "Lumper Receipt",
      urgency: "Review",
      age: "14 hrs",
      proofReadiness: "In Progress",
      effect: "$3,125 invoice draft cannot finalize until rate and receipt review",
      customerStatus: "Delivered with closeout review in progress",
      billingContact: "ap@atlantareceiver.example",
      pickupWindow: "Jun 7, 2026 09:00-10:00 CT",
      deliveryWindow: "Jun 7, 2026 18:30-20:00 ET",
      dispatchRestriction: "Load complete; billing waits on closeout packet.",
      requiredAction: "Match rate confirmation and attach lumper support.",
      requiredProof: "Rate confirmation, lumper receipt, final delivery packet",
      approvalState: "Document desk review",
      driverDescriptor: "Assigned with review",
      customerVisibility: "Delivery confirmed, final billing packet under review",
      financialEffect: "Revenue visible, invoice held for document confirmation",
      billingReadiness: "Review",
      financingReadiness: "Moderate; receivable almost complete",
      urgencyReason: "Closeout friction that does not stop the load itself.",
      proofItems: {
        bol: "Complete",
        pod: "Complete",
        seal: "Complete",
        lumper: "Pending Review",
        scale: "Pending Review",
        delivery: "Complete",
        invoice: "Generated Draft"
      },
      defaultStep: 9,
      detailStep: 7
    },
    "BOF-2258": {
      shipmentRef: "SHP-2258-SHV-JAN",
      issueType: "Safety Review",
      urgency: "Watch",
      age: "11 hrs",
      proofReadiness: "In Progress",
      effect: "Assignment planning at risk until renewal evidence clears",
      customerStatus: "Planning underway with readiness review",
      billingContact: "logistics@jacksonreceiver.example",
      pickupWindow: "Jun 8, 2026 06:00-07:30 CT",
      deliveryWindow: "Jun 8, 2026 11:30-13:00 CT",
      dispatchRestriction: "Do not fully commit until annual review evidence clears.",
      requiredAction: "Collect renewal support and confirm owner-operator packet.",
      requiredProof: "Annual review, packet confirmation, updated assignment release",
      approvalState: "Safety desk review",
      driverDescriptor: "Renewal due",
      customerVisibility: "Pickup planning visible; final assignment still under review",
      financialEffect: "Revenue forecast visible, settlement release not yet relevant",
      billingReadiness: "Future",
      financingReadiness: "Moderate once packet clears",
      urgencyReason: "Shows how BOF flags an at-risk assignment early.",
      proofItems: {
        bol: "Generated Draft",
        pod: "Pending Review",
        seal: "Pending Review",
        lumper: "Internal Only",
        scale: "Pending Review",
        delivery: "Pending Review",
        invoice: "Generated Draft"
      },
      defaultStep: 9,
      detailStep: 5
    }
  };

  var proofDocuments = [
    { id: "bol", label: "BOL", source: "Shipper packet", customer: "Customer Released", billing: "Required" },
    { id: "pod", label: "POD", source: "Delivery closeout", customer: "Customer Released", billing: "Required" },
    { id: "seal", label: "Seal Photo", source: "Pickup mobile upload", customer: "Internal Only", billing: "Conditional" },
    { id: "lumper", label: "Lumper Receipt", source: "Driver receipt upload", customer: "Internal Only", billing: "Required if used" },
    { id: "scale", label: "Scale Ticket", source: "Driver document upload", customer: "Internal Only", billing: "Conditional" },
    { id: "delivery", label: "Delivery Photo", source: "Closeout mobile capture", customer: "Customer Released", billing: "Conditional" },
    { id: "invoice", label: "Invoice Draft", source: "Billing draft engine", customer: "Customer Released", billing: "Required" }
  ];

  var state = {
    data: null,
    selectedLoadId: "BOF-1907",
    selectedPersona: "manager",
    activeView: "manager",
    requestedView: "",
    selectedStepIndex: 9,
    sidebarOpen: false,
    drawerOpen: false,
    drawerMode: "controls",
    actionMessage: ""
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setText(key, value) {
    root.querySelectorAll('[data-demo-text="' + key + '"]').forEach(function (node) {
      node.textContent = value;
    });
  }

  function setHtml(key, value) {
    root.querySelectorAll('[data-demo-render="' + key + '"]').forEach(function (node) {
      node.innerHTML = value;
    });
  }

  function byId(items) {
    return (items || []).reduce(function (map, item) {
      if (item && item.id) map[item.id] = item;
      return map;
    }, {});
  }

  function selectedLoad() {
    return byId(state.data.loads)[state.selectedLoadId] || (state.data.loads || [])[0];
  }

  function currentMeta() {
    return scenarioMeta[state.selectedLoadId];
  }

  function selectedRecords() {
    var load = selectedLoad();
    var drivers = byId(state.data.drivers);
    var units = byId(state.data.units);
    var proofs = byId(state.data.proofRecords);
    var settlements = byId(state.data.settlementRecords);
    var safety = (state.data.safetyRecords || []).filter(function (item) {
      return item.loadId === load.id;
    })[0] || null;
    var payProfile = (state.data.driverPayProfiles || []).filter(function (item) {
      return item.loadId === load.id;
    })[0] || null;
    var exception = (state.data.exceptions || []).filter(function (item) {
      return item.relatedLoadId === load.id;
    })[0] || null;
    return {
      load: load,
      meta: currentMeta(),
      driver: drivers[load.driverId] || null,
      unit: units[load.unitId] || null,
      proof: proofs[load.proofRecordId] || null,
      settlement: settlements[load.settlementRecordId] || null,
      safety: safety,
      payProfile: payProfile,
      exception: exception
    };
  }

  function icon(name) {
    var paths = {
      manager: '<rect x="4" y="4" width="16" height="6"></rect><rect x="4" y="14" width="7" height="6"></rect><rect x="13" y="14" width="7" height="6"></rect>',
      driver: '<circle cx="12" cy="8" r="3"></circle><path d="M6 19c1.4-3 4-4.5 6-4.5S16.6 16 18 19"></path>',
      dispatch: '<path d="M4 12h16"></path><path d="M14 6l6 6-6 6"></path>',
      safety: '<path d="M12 3l7 3v5c0 4.7-2.7 7.9-7 10-4.3-2.1-7-5.3-7-10V6l7-3z"></path>',
      maintenance: '<path d="M14.5 5.5a3 3 0 0 0 4 4L12 16l-4 1 1-4 6.5-7.5z"></path>',
      customer: '<path d="M4 18h16"></path><path d="M6 18V8l6-4 6 4v10"></path>',
      finance: '<path d="M4 16c2.5 0 3.5-2 6-2s3.5 2 6 2 3.5-2 4-2"></path><path d="M6 12l3-3 3 2 4-5"></path>',
      operations: '<path d="M5 18h14"></path><path d="M7 18V10h3v8"></path><path d="M12 18V6h3v12"></path><path d="M17 18v-4h2v4"></path>',
      shared: '<path d="M7 7h10v10H7z"></path><path d="M3 12h4"></path><path d="M17 12h4"></path><path d="M12 3v4"></path><path d="M12 17v4"></path>',
      reports: '<path d="M5 18h14"></path><path d="M7 15l3-3 2 2 5-6"></path>',
      documents: '<path d="M7 3h7l4 4v14H7z"></path><path d="M14 3v4h4"></path>'
    };
    return '<span class="portal-icon-wrap" aria-hidden="true"><svg viewBox="0 0 24 24">' + (paths[name] || paths.documents) + "</svg></span>";
  }

  function badgeTone(value) {
    var text = String(value || "").toLowerCase();
    if (text.indexOf("ready") >= 0 || text.indexOf("complete") >= 0 || text.indexOf("released") >= 0) return "success";
    if (text.indexOf("block") >= 0 || text.indexOf("missing") >= 0 || text.indexOf("hold") >= 0 || text.indexOf("reject") >= 0) return "danger";
    if (text.indexOf("review") >= 0 || text.indexOf("pending") >= 0 || text.indexOf("risk") >= 0 || text.indexOf("watch") >= 0) return "warning";
    return "info";
  }

  function badge(value) {
    return '<span class="portal-badge ' + badgeTone(value) + '">' + escapeHtml(value) + "</span>";
  }

  function money(value) {
    return "$" + Number(value || 0).toLocaleString("en-US");
  }

  function metricCard(title, value, line, iconName) {
    return [
      '<article class="portal-kpi-card">',
      '<div class="portal-kpi-head">' + icon(iconName) + "<span>" + escapeHtml(title) + "</span></div>",
      "<strong>" + escapeHtml(value) + "</strong>",
      "<p>" + escapeHtml(line) + "</p>",
      "</article>"
    ].join("");
  }

  function viewTitleMap() {
    return {
      manager: {
        title: "Manager Portal",
        subtitle: "Daily operating view for loads, dispatch, readiness, proof, and financial posture."
      },
      driver: {
        title: "Driver Portal",
        subtitle: "Driver-specific readiness, assignment context, and document state."
      },
      safety: {
        title: "Safety & Compliance",
        subtitle: "Credential holds, exceptions, incidents, and corrective action readiness."
      },
      maintenance: {
        title: "Maintenance & Equipment",
        subtitle: "Unit readiness, PM due, open defects, and maintenance spend posture."
      },
      customer: {
        title: "Customer Portal",
        subtitle: "Shipment visibility, proof expectations, and billing-facing delivery status."
      },
      finance: {
        title: "Financing Readiness",
        subtitle: "Invoice quality, proof completion, and receivable readiness indicators."
      },
      vault: {
        title: "BOF Vault",
        subtitle: "Document requests, upload workflow, readiness, renewal, and controlled access."
      },
      policy: {
        title: "Policy Governance",
        subtitle: "Controlled policies, acknowledgments, training, exceptions, and audit evidence."
      }
    };
  }

  function portalIdentityMap() {
    return {
      manager: "BOF MANAGER PORTAL",
      dispatcher: "BOF DISPATCH PORTAL",
      driver: "BOF DRIVER PORTAL",
      safety: "BOF SAFETY PORTAL",
      maintenance: "BOF MAINTENANCE PORTAL",
      customer: "BOF CUSTOMER PORTAL",
      finance: "BOF FINANCE PORTAL",
      vault: "BOF VAULT",
      policy: "BOF POLICY GOVERNANCE"
    };
  }

  function renderSidebar() {
    setHtml("sidebarNav", sidebarItems.map(function (item) {
      var active = item.id === state.activeView ? " is-active" : "";
      return '<button class="portal-sidebar-link' + active + '" type="button" data-demo-action="set-view" data-view="' + escapeHtml(item.id) + '">' +
        icon(item.icon) +
        "<span>" + escapeHtml(item.label) + "</span></button>";
    }).join(""));
  }

  function renderHeader(records) {
    var map = viewTitleMap()[state.activeView] || viewTitleMap().manager;
    var identity = portalIdentityMap()[state.activeView] || portalIdentityMap().manager;
    setText("portalIdentity", identity);
    setText("portalTitle", map.title);
    setText("portalSubtitle", map.subtitle);
    setText("headerScenario", records.load.id + " / " + records.load.customer);
    setText("headerPersona", personaLabel(state.selectedPersona));
    setText("headerStep", workflowSteps[state.selectedStepIndex]);
    document.title = "BOF Customer Demo | " + map.title;
    syncReturnLinks();
  }

  function renderKpis() {
    setHtml("kpiRow", [
      metricCard("Active Loads", String(state.data.loads.length), "5 loads in active review", "operations"),
      metricCard("Loads Needing Attention", String(loadsNeedingAttention()), "4 unresolved release blockers", "dispatch"),
      metricCard("Ready for Settlement", String(settlementReadyCount()), "Packets clear for closeout", "finance"),
      metricCard("Safety Exceptions", String(openSafetyExceptions()), "Open compliance actions", "safety"),
      metricCard("Maintenance Issues", String(maintenanceIssues()), "Units with service risk", "maintenance"),
      metricCard("Estimated Weekly Revenue", money(weeklyRevenue()), "Revenue in the active mix", "reports")
    ].join(""));
  }

  function renderSelectedLoad(records) {
    setHtml("selectedLoad", [
      '<div class="portal-selected-load-summary">',
      '<div><p class="portal-eyebrow">Selected load</p><h2>' + escapeHtml(records.load.id + " / " + records.load.customer) + '</h2></div>',
      '<div class="portal-badge-row">' + badge(records.load.dispatchStatus) + badge(records.meta.proofReadiness) + badge(records.meta.urgency) + "</div>",
      '<div class="portal-selected-load-grid">',
      field("Lane", records.load.origin + " to " + records.load.destination),
      field("Driver", records.driver ? records.driver.name : "Assignment pending"),
      field("Issue", records.meta.issueType),
      field("Proof readiness", records.meta.proofReadiness),
      field("Urgency", records.meta.age + " / " + records.meta.urgency),
      field("Billing readiness", records.meta.billingReadiness),
      field("Financial effect", records.meta.effect),
      field("Current step", workflowSteps[state.selectedStepIndex]),
      "</div></div>",
      '<div class="portal-button-row">',
      '<button class="portal-inline-button" type="button" data-demo-action="open-detail">Open selected load detail</button>',
      '<button class="portal-inline-button" type="button" data-demo-action="open-controls">Change scenario</button>',
      "</div>"
    ].join(""));
  }

  function field(label, value) {
    return '<div class="portal-field"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + "</strong></div>";
  }

  function renderMain(records) {
    if (state.activeView === "driver") return setHtml("mainView", renderDriverView(records));
    if (state.activeView === "safety") return setHtml("mainView", renderSafetyView(records));
    if (state.activeView === "maintenance") return setHtml("mainView", renderMaintenanceView(records));
    if (state.activeView === "customer") return setHtml("mainView", renderCustomerView(records));
    if (state.activeView === "finance") return setHtml("mainView", renderFinanceView(records));
    if (state.activeView === "vault") return setHtml("mainView", renderVaultView(records));
    if (state.activeView === "policy") return setHtml("mainView", renderPolicyView(records));
    setHtml("mainView", renderManagerView(records));
  }

  function renderManagerView(records) {
    return [
      '<div class="portal-view-grid">',
      '<div class="portal-executive-grid">',
      '<section class="portal-column">',
      renderAttentionCard(),
      '<div class="portal-row-grid portal-row-three">',
      simpleCard("Load Status Overview", "Current mix", statList([
        ["In Transit", "1"],
        ["Delivered – Proof Pending", "2"],
        ["At Pickup", "1"],
        ["Delivered – Ready to Bill", "1"],
        ["Cancelled", "0"]
      ])),
      revenueCard(records),
      simpleCard("Proof Packet Readiness", "Document status", statList([
        ["Complete", proofPacketStatusCount("Complete")],
        ["In Progress", proofPacketStatusCount("In Progress")],
        ["Not Started", proofPacketStatusCount("Not Started")]
      ])),
      "</div>",
      '<div class="portal-row-grid portal-row-four">',
      simpleCard("Safety Summary", "Safety & Compliance", statList([
        ["Drivers with expiring items", "2"],
        ["Drivers on hold", countDriversByStatus("Blocked")],
        ["Open safety exceptions", openSafetyExceptions()],
        ["Incidents", "1"]
      ])),
      simpleCard("Maintenance Summary", "Maintenance & Equipment", statList([
        ["Units out of service", "1"],
        ["PM due within 7 days", "2"],
        ["Open defects", "3"],
        ["Maintenance spend MTD", "$8,420"]
      ])),
      simpleCard("Shared Services Savings", "Illustrative Network Opportunity", statList([
        ["Fuel savings", "4.8% illustrative opportunity"],
        ["Maintenance & Tires", "Preferred vendor review"],
        ["Other programs", "Roadside and purchasing leverage"]
      ])),
      simpleCard("Financing Readiness", "Illustrative Financing Readiness", statList([
        ["Readiness score", financingScore(records)],
        ["Factors improving score", "Packet completion, days to payment, rejection control"]
      ])),
      "</div>",
      "</section>",
      '<aside class="portal-rail">',
      simpleCard("Driver Readiness", "Personnel", statList([
        ["Ready", countDriversByStatus("Ready")],
        ["Expiring Soon", "2"],
        ["Action Required", String(countDriversByStatus("Review") + countDriversByStatus("At Risk"))],
        ["On Hold", countDriversByStatus("Blocked")],
        ["Inactive", "0"]
      ])),
      collapsibleCard("Recent Activity", "Latest changes", activityList(records), false),
      collapsibleCard("My Action Queue", "Today", statList([
        ["Document Reviews", "3 open"],
        ["Driver Approvals", "2 pending"],
        ["Safety Exceptions", String(openSafetyExceptions())],
        ["Maintenance Issues", "3 active"],
        ["Load Exceptions", String(loadsNeedingAttention())]
      ]), false),
      "</aside>",
      "</div>",
      "</div>"
    ].join("");
  }

  function renderAttentionCard() {
    return [
      '<section class="portal-card">',
      '<div class="portal-card-head"><div><p class="portal-eyebrow">Operational priority</p><h3>Loads Requiring Attention</h3></div>' + badge("Operational queue") + "</div>",
      '<div class="portal-table-wrap"><table class="portal-table"><thead><tr><th scope="col">Load ID</th><th scope="col">Customer</th><th scope="col">Issue Type</th><th scope="col">Description</th><th scope="col">Age</th><th scope="col">Status</th></tr></thead><tbody>',
      attentionRows(),
      "</tbody></table></div>",
      '<div class="portal-mobile-records">',
      attentionMobileCards(),
      "</div>",
      "</section>"
    ].join("");
  }

  function attentionRows() {
    var drivers = byId(state.data.drivers);
    return state.data.loads.map(function (load) {
      var meta = scenarioMeta[load.id];
      return "<tr class=\"is-clickable\" data-demo-action=\"select-load\" data-load-id=\"" + escapeHtml(load.id) + "\">" +
        "<td><strong>" + escapeHtml(load.id) + "</strong></td>" +
        "<td>" + escapeHtml(load.customer) + "</td>" +
        "<td>" + escapeHtml(meta.issueType) + "</td>" +
        "<td>" + escapeHtml(meta.requiredAction) + "</td>" +
        "<td>" + escapeHtml(meta.age) + "</td>" +
        "<td>" + badge(load.dispatchStatus) + "<br><small>" + escapeHtml(drivers[load.driverId] ? drivers[load.driverId].name : "No driver") + "</small></td>" +
        "</tr>";
    }).join("");
  }

  function attentionMobileCards() {
    return state.data.loads.map(function (load) {
      var meta = scenarioMeta[load.id];
      return [
        '<button class="portal-mobile-record" type="button" data-demo-action="select-load" data-load-id="' + escapeHtml(load.id) + '">',
        '<div class="portal-card-head"><strong>' + escapeHtml(load.id + " / " + load.customer) + "</strong>" + badge(load.dispatchStatus) + "</div>",
        '<div class="portal-detail-grid">',
        detailRow("Issue", meta.issueType),
        detailRow("Age", meta.age),
        detailRow("Description", meta.requiredAction),
        "</div>",
        "</button>"
      ].join("");
    }).join("");
  }

  function simpleCard(title, tag, body) {
    return [
      '<section class="portal-card">',
      '<div class="portal-card-head"><div><p class="portal-eyebrow">' + escapeHtml(tag) + "</p><h3>" + escapeHtml(title) + "</h3></div></div>",
      body,
      "</section>"
    ].join("");
  }

  function collapsibleCard(title, tag, body, open) {
    var openClass = open ? " is-open" : "";
    return [
      '<section class="portal-card is-collapsible' + openClass + '">',
      '<div class="portal-card-head"><div><p class="portal-eyebrow">' + escapeHtml(tag) + "</p><h3>" + escapeHtml(title) + '</h3></div><button class="portal-inline-button" type="button" data-demo-action="toggle-card">Toggle</button></div>',
      '<div class="portal-card-body">',
      body,
      "</div></section>"
    ].join("");
  }

  function revenueCard(records) {
    var trend = [52, 61, 58, 73, 69, 82, 76];
    return [
      '<section class="portal-card">',
      '<div class="portal-card-head"><div><p class="portal-eyebrow">Illustrative</p><h3>Revenue Overview</h3></div></div>',
      '<div class="portal-stat-list">',
      '<div class="portal-stat-item"><span>Weekly revenue</span><strong>' + money(weeklyRevenue()) + "</strong></div>",
      '<div class="portal-stat-item"><span>Daily trend</span><strong>' + escapeHtml(records.meta.financialEffect) + "</strong></div>",
      "</div>",
      '<div class="portal-chart">' + trend.map(function (value, index) {
        return '<div class="portal-chart-bar"><i style="height:' + (18 + value) + 'px"></i><span>D' + String(index + 1) + "</span></div>";
      }).join("") + "</div>",
      "</section>"
    ].join("");
  }

  function statList(items) {
    return '<div class="portal-stat-list">' + items.map(function (item) {
      return '<div class="portal-stat-item"><span>' + escapeHtml(item[0]) + '</span><strong>' + escapeHtml(item[1]) + "</strong></div>";
    }).join("") + "</div>";
  }

  function activityList(records) {
    return '<div class="portal-activity-list">' + [
      ["POD uploaded", records.load.id + " closeout packet updated", "10 min ago"],
      ["Medical card approved", "Qualification packet refreshed for next review", "28 min ago"],
      ["Maintenance completed", "Unit inspection released back to dispatch", "49 min ago"],
      ["Exception cleared", "Illustrative closeout flow moved to billing", "1 hr ago"],
      ["New load assigned", records.load.id + " linked to " + (records.driver ? records.driver.name : "driver review"), "2 hrs ago"],
      ["Invoice released", "Previous ready packet moved to customer release", "3 hrs ago"]
    ].map(function (item) {
      return '<div class="portal-activity-item"><div><strong>' + escapeHtml(item[0]) + '</strong><p>' + escapeHtml(item[1]) + '</p></div><time>' + escapeHtml(item[2]) + "</time></div>";
    }).join("") + "</div>";
  }

  function renderDispatchView(records) {
    return [
      '<div class="portal-view-grid">',
      simpleCard("Dispatch Summary", "Current load", detailGrid([
        ["Load status", records.load.dispatchStatus],
        ["Driver", records.driver ? records.driver.name + " / " + records.meta.driverDescriptor : "Assignment pending"],
        ["Equipment", records.unit ? records.unit.label : "No unit assigned"],
        ["Pickup window", records.meta.pickupWindow],
        ["Delivery window", records.meta.deliveryWindow],
        ["Dispatch restriction", records.meta.dispatchRestriction],
        ["Required action", records.meta.requiredAction]
      ])),
      renderAttentionCard(),
      '<div class="portal-row-grid portal-row-three">',
      simpleCard("Proof dependencies", "Release path", statList([
        ["Proof readiness", records.meta.proofReadiness],
        ["Required proof", records.meta.requiredProof],
        ["Approval state", records.meta.approvalState]
      ])),
      simpleCard("Current workflow", "Step " + String(state.selectedStepIndex + 1), workflowStrip()),
      simpleCard("Current customer posture", "External status", statList([
        ["Customer-visible status", records.meta.customerStatus],
        ["Billing readiness", records.meta.billingReadiness],
        ["Urgency", records.meta.urgencyReason]
      ])),
      "</div></div>"
    ].join("");
  }

  function renderDriverView(records) {
    return [
      '<div class="portal-view-grid">',
      simpleCard("Driver Summary", "Driver portal", detailGrid([
        ["Driver", records.driver ? records.driver.name : "No driver"],
        ["Readiness", records.driver ? records.driver.readinessStatus : "Unknown"],
        ["Home base", records.driver ? records.driver.homeBase : "Unknown"],
        ["Assignment", records.driver ? records.driver.assignmentState : "Unknown"],
        ["Current load", records.load.id],
        ["Next action", records.meta.requiredAction]
      ])),
      '<div class="portal-row-grid portal-row-three">',
      simpleCard("Driver Readiness", "Personnel", statList([
        ["Ready", countDriversByStatus("Ready")],
        ["Expiring Soon", "2"],
        ["Action Required", String(countDriversByStatus("Review") + countDriversByStatus("At Risk"))],
        ["On Hold", countDriversByStatus("Blocked")],
        ["Inactive", "0"]
      ])),
      simpleCard("Document State", "Packet view", statList([
        ["Required proof", records.meta.requiredProof],
        ["Proof readiness", records.meta.proofReadiness],
        ["Approval state", records.meta.approvalState]
      ])),
      simpleCard("Assignment Context", "Current lane", statList([
        ["Lane", records.load.origin + " to " + records.load.destination],
        ["Equipment", records.unit ? records.unit.label : "No unit assigned"],
        ["Restriction", records.meta.dispatchRestriction]
      ])),
      "</div></div>"
    ].join("");
  }

  function renderSafetyView(records) {
    return [
      '<div class="portal-view-grid">',
      simpleCard("Safety Focus", "Safety & Compliance", statList([
        ["Drivers with expiring items", "2"],
        ["Drivers on hold", countDriversByStatus("Blocked")],
        ["Open safety exceptions", openSafetyExceptions()],
        ["Incidents", "1 illustrative claim review"]
      ])),
      '<div class="portal-row-grid portal-row-three">',
      simpleCard("Selected load safety", "Current record", detailGrid([
        ["Load", records.load.id],
        ["Driver", records.driver ? records.driver.name : "No driver"],
        ["Safety status", records.safety ? records.safety.status : records.load.safetyStatus],
        ["Corrective action", records.safety ? records.safety.correctiveAction : records.meta.requiredAction]
      ])),
      simpleCard("Compliance readiness", "Credential posture", statList([
        ["Credential expirations", "2 items approaching review"],
        ["Driver holds", countDriversByStatus("Blocked")],
        ["Corrective actions", records.exception ? records.exception.requiredAction : "No current corrective action"]
      ])),
      simpleCard("Incident posture", "Operational effect", statList([
        ["Dispatch consequence", records.safety ? records.safety.dispatchConsequence : records.meta.dispatchRestriction],
        ["Customer visibility", records.meta.customerVisibility],
        ["Settlement effect", records.meta.financialEffect]
      ])),
      "</div>"
    ].join("");
  }

  function renderMaintenanceView(records) {
    return [
      '<div class="portal-view-grid">',
      simpleCard("Maintenance Summary", "Maintenance & Equipment", statList([
        ["Units out of service", "1"],
        ["PM due within 7 days", "2"],
        ["Open defects", "3"],
        ["Maintenance spend MTD", "$8,420"]
      ])),
      '<div class="portal-row-grid portal-row-three">',
      simpleCard("Selected unit", "Current equipment", detailGrid([
        ["Unit", records.unit ? records.unit.label : "No assigned unit"],
        ["Status", records.unit ? records.unit.status : "Unknown"],
        ["Dispatch effect", records.meta.dispatchRestriction],
        ["Repair status", records.unit ? records.unit.notes : "No repair note"]
      ])),
      simpleCard("Equipment readiness", "Release posture", statList([
        ["Out-of-service units", "1"],
        ["PM due", "2"],
        ["Repair activity", "3 open work orders"]
      ])),
      simpleCard("Cost visibility", "Illustrative", statList([
        ["Maintenance spend", "$8,420 MTD"],
        ["Tire condition", "2 review items"],
        ["Readiness effect", "1 unit can affect assignment timing"]
      ])),
      "</div>"
    ].join("");
  }

  function renderCustomerView(records) {
    return [
      '<div class="portal-view-grid">',
      simpleCard("Customer Summary", "Customer portal", detailGrid([
        ["Customer", records.load.customer],
        ["Shipment reference", records.meta.shipmentRef],
        ["Customer-visible status", records.meta.customerStatus],
        ["Required proof", records.meta.requiredProof],
        ["Billing contact", records.meta.billingContact],
        ["Billing readiness", records.meta.billingReadiness]
      ])),
      '<div class="portal-row-grid portal-row-three">',
      simpleCard("Shipment timeline", "Current step", workflowStrip()),
      simpleCard("Proof expectations", "Customer-facing", statList([
        ["POD", records.meta.proofItems.pod],
        ["Delivery photo", records.meta.proofItems.delivery],
        ["Invoice draft", records.meta.proofItems.invoice]
      ])),
      simpleCard("Current message", "BOF update", statList([
        ["Issue", records.meta.issueType],
        ["Next action", records.meta.requiredAction],
        ["Visibility note", records.meta.customerVisibility]
      ])),
      "</div>"
    ].join("");
  }

  function renderFinanceView(records) {
    return [
      '<div class="portal-view-grid">',
      simpleCard("Financing Readiness", "Illustrative Financing Readiness", statList([
        ["Readiness score", financingScore(records)],
        ["Proof packet completion", proofCompletion(records)],
        ["Invoice rejection visibility", "Low when packet complete"],
        ["Days to payment", "Illustrative 23 days"]
      ])),
      '<div class="portal-row-grid portal-row-three">',
      revenueCard(records),
      simpleCard("Settlement posture", "Current record", statList([
        ["Settlement status", records.settlement ? records.settlement.status : records.meta.billingReadiness],
        ["Billing hold", records.settlement ? records.settlement.billingHold : records.meta.financialEffect],
        ["Driver pay posture", records.payProfile ? records.payProfile.payStatus : "No pay record"]
      ])),
      simpleCard("Financing factors", "Receivable quality", statList([
        ["Packet readiness", records.meta.proofReadiness],
        ["Rejection control", "Depends on packet completion"],
        ["Lender document readiness", "Illustrative readiness only"]
      ])),
      "</div>"
    ].join("");
  }

  function renderVaultView(records) {
    return [
      '<div class="portal-view-grid">',
      simpleCard("BOF Vault Dashboard", "Document control", detailGrid([
        ["Driver", records.driver ? records.driver.name : "No driver"],
        ["Selected load", records.load.id],
        ["Document request", records.meta.requiredProof],
        ["Upload workflow", state.requestedView === "upload-request" ? "Upload request selected" : "Request, upload, classify, review, approve"],
        ["Readiness", records.meta.proofReadiness],
        ["Renewal", records.meta.requiredAction],
        ["Access posture", "Role-aware, illustrative demo data only"]
      ])),
      '<div class="portal-row-grid portal-row-three">',
      simpleCard("Upload and Intake", "Vault workflow", statList([
        ["Current state", state.requestedView === "document-intake" ? "Document intake selected" : "Document request review"],
        ["Next action", records.meta.requiredAction],
        ["Review owner", records.safety ? records.safety.owner || "Safety owner" : "Packet owner"]
      ])),
      simpleCard("Document Requests", "Driver self-service", statList([
        ["Open request", records.meta.issueType],
        ["Packet readiness", records.meta.proofReadiness],
        ["Customer visibility", records.meta.customerVisibility]
      ])),
      simpleCard("Audit Trail", "Controlled access", statList([
        ["Version history", "Retained"],
        ["Reviewer note", records.meta.approvalState],
        ["Production note", "No files upload from this public demo"]
      ])),
      "</div>",
      proofTable(records),
      "</div>"
    ].join("");
  }

  function renderPolicyView(records) {
    return [
      '<div class="portal-view-grid">',
      simpleCard("Policy Governance", "Controlled library", detailGrid([
        ["Current policy", "Driver Qualification Policy"],
        ["Version state", "Current approved"],
        ["Audience", "Drivers / safety / dispatch"],
        ["Acknowledgment", records.driver ? records.driver.name + " complete" : "Assigned audience tracked"],
        ["Training", "Required annually"],
        ["Exception path", records.exception ? records.exception.requiredAction : "No open exception"],
        ["Audit posture", "Review, publish, acknowledgment, training, revision, and archive events retained"]
      ])),
      '<div class="portal-row-grid portal-row-three">',
      simpleCard("Acknowledgment Workflow", "Policy evidence", statList([
        ["Pending acknowledgments", "4"],
        ["Training required", "Micro-training assigned"],
        ["Corrective action", "1 open follow-up"]
      ])),
      simpleCard("Version Governance", "Library control", statList([
        ["Current approved", "18"],
        ["Revisions in review", "2"],
        ["Archived evidence", "Retained"]
      ])),
      simpleCard("Operating Link", "Dispatch consequence", statList([
        ["Selected load", records.load.id],
        ["Policy effect", records.meta.dispatchRestriction],
        ["Owner action", records.meta.requiredAction]
      ])),
      "</div>",
      simpleCard("Policy Record Actions", "Illustrative workflow controls", policyActionPanel()),
      "</div>"
    ].join("");
  }

  function policyActionPanel() {
    var actions = [
      "Open Policy",
      "Review Revision",
      "Request Acknowledgment",
      "View Training Status",
      "Approve Version",
      "View Audit History"
    ];
    return [
      '<div class="portal-action-toolbar">',
      actions.map(function (label) {
        return '<button class="portal-inline-button" type="button" data-demo-action="policy-action" data-action-label="' + escapeHtml(label) + '">' + escapeHtml(label) + "</button>";
      }).join(""),
      "</div>",
      state.actionMessage ? '<p class="portal-inline-note portal-action-feedback">' + escapeHtml(state.actionMessage) + "</p>" : ""
    ].join("");
  }

  function workflowStrip() {
    return '<div class="portal-step-strip">' + workflowSteps.map(function (step, index) {
      var tone = index < state.selectedStepIndex ? "success" : index === state.selectedStepIndex ? "info" : "neutral";
      return '<span class="portal-step-pill portal-badge ' + tone + '">' + escapeHtml(String(index + 1) + ". " + step) + "</span>";
    }).join("") + "</div>";
  }

  function detailGrid(rows) {
    return '<dl class="portal-detail-grid">' + rows.map(function (row) {
      return detailRow(row[0], row[1]);
    }).join("") + "</dl>";
  }

  function detailRow(label, value) {
    return "<div><dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd></div>";
  }

  function loadsNeedingAttention() {
    return state.data.loads.filter(function (item) {
      return item.gating !== "proceed";
    }).length;
  }

  function settlementReadyCount() {
    return state.data.settlementRecords.filter(function (item) {
      return item.status === "Complete";
    }).length;
  }

  function weeklyRevenue() {
    return state.data.driverPayProfiles.reduce(function (sum, item) {
      return sum + Number(item.grossRevenue || 0);
    }, 0);
  }

  function openSafetyExceptions() {
    return state.data.exceptions.filter(function (item) {
      return item.originatingModule === "Safety" || item.category === "Qualification";
    }).length;
  }

  function maintenanceIssues() {
    return state.data.units.filter(function (item) {
      return item.status !== "Ready";
    }).length;
  }

  function countDriversByStatus(value) {
    return String(state.data.drivers.filter(function (item) {
      return String(item.readinessStatus || "").toLowerCase() === String(value || "").toLowerCase();
    }).length);
  }

  function proofPacketStatusCount(label) {
    if (label === "Complete") {
      return String(state.data.loads.filter(function (item) {
        return scenarioMeta[item.id].proofReadiness === "Complete";
      }).length);
    }
    if (label === "In Progress") {
      return String(state.data.loads.filter(function (item) {
        var status = scenarioMeta[item.id].proofReadiness;
        return status === "In Progress" || status === "Pending Review";
      }).length);
    }
    return String(state.data.loads.filter(function (item) {
      return scenarioMeta[item.id].proofReadiness === "Missing";
    }).length);
  }

  function financingScore(records) {
    if (records.meta.financingReadiness.indexOf("High") >= 0) return "91 / 100";
    if (records.meta.financingReadiness.indexOf("Low") >= 0) return "54 / 100";
    return "74 / 100";
  }

  function proofCompletion(records) {
    var proofMap = records.meta.proofItems || {};
    var completed = Object.keys(proofMap).filter(function (key) {
      return ["Complete", "Customer Released", "Generated Draft"].indexOf(proofMap[key]) >= 0;
    }).length;
    return String(completed) + " of " + String(proofDocuments.length) + " items at or beyond draft";
  }

  function personaLabel(id) {
    if (id === "vault") return "BOF Vault";
    if (id === "policy") return "Policy Governance";
    for (var i = 0; i < personaGroups.length; i += 1) {
      for (var j = 0; j < personaGroups[i].items.length; j += 1) {
        if (personaGroups[i].items[j].id === id) return personaGroups[i].items[j].label;
      }
    }
    return "Manager";
  }

  function setPersona(id) {
    setActiveView(id === "manager" ? "manager" : id, true);
    state.selectedStepIndex = stepForPersona(id);
    state.actionMessage = "";
    render();
  }

  function normalizePortal(id) {
    var value = String(id || "manager").toLowerCase();
    value = portalAliases[value] || value;
    return viewTitleMap()[value] ? value : "manager";
  }

  function setActiveView(id, updateUrl) {
    state.activeView = normalizePortal(id);
    state.selectedPersona = (state.activeView === "vault" || state.activeView === "policy") ? "manager" : state.activeView;
    state.actionMessage = "";
    if (updateUrl && window.history && window.history.pushState) {
      var params = new URLSearchParams(window.location.search);
      params.set("portal", state.activeView);
      if (state.requestedView) params.set("view", state.requestedView);
      else params.delete("view");
      window.history.pushState(null, "", window.location.pathname + "?" + params.toString());
    }
  }

  function applyRouteState() {
    var params = new URLSearchParams(window.location.search);
    var portal = normalizePortal(params.get("portal"));
    var view = String(params.get("view") || "").toLowerCase();
    state.activeView = portal;
    state.selectedPersona = (portal === "vault" || portal === "policy") ? "manager" : portal;
    state.requestedView = view;
    state.drawerOpen = false;
    state.drawerMode = "controls";
    state.actionMessage = "";

    if (portal === "safety" && view === "credential-hold") {
      state.selectedLoadId = "BOF-1931";
      state.selectedStepIndex = 5;
      state.drawerOpen = true;
      state.drawerMode = "details";
    } else if (portal === "finance" && view === "settlement-hold") {
      state.selectedLoadId = "BOF-1907";
      state.selectedStepIndex = 8;
      state.drawerOpen = true;
      state.drawerMode = "details";
    } else if (portal === "manager" && view === "selected-load") {
      state.selectedLoadId = "BOF-1907";
      state.selectedStepIndex = 9;
      state.drawerOpen = true;
      state.drawerMode = "details";
    } else if (portal === "vault" && (view === "document-intake" || view === "upload-request")) {
      state.selectedLoadId = "BOF-1931";
      state.selectedStepIndex = view === "upload-request" ? 4 : 3;
    } else {
      state.selectedStepIndex = stepForPersona(portal);
    }
  }

  function syncReturnLinks() {
    var route = publicReturnRoutes[state.activeView] || "/";
    var label = publicReturnLabels[state.activeView] || "public site";
    root.querySelectorAll('[data-demo-text="publicReturnLink"]').forEach(function (node) {
      node.setAttribute("href", route);
      node.textContent = route === "/" ? "Back to public site" : "View " + label;
    });
  }

  function stepForPersona(id) {
    if (id === "dispatcher") return 3;
    if (id === "driver") return 4;
    if (id === "safety") return 5;
    if (id === "customer") return 7;
    if (id === "finance") return 8;
    if (id === "vault") return 4;
    if (id === "policy") return 6;
    return 9;
  }

  function renderDrawer(records) {
    var drawer = root.querySelector("[data-drawer]");
    var overlay = root.querySelector(".portal-overlay");
    if (!drawer || !overlay) return;

    drawer.hidden = !state.drawerOpen;
    overlay.hidden = !state.drawerOpen;
    overlay.classList.toggle("is-open", state.drawerOpen);

    if (!state.drawerOpen) return;

    if (state.drawerMode === "details") {
      setText("drawerEyebrow", "Selected load detail");
      setText("drawerTitle", records.load.id + " / " + records.load.customer);
      setHtml("drawerBody", renderDetailDrawer(records));
    } else {
      setText("drawerEyebrow", "Guided Demo");
      setText("drawerTitle", "Guided demo controls");
      setHtml("drawerBody", renderControlsDrawer(records));
    }
  }

  function renderControlsDrawer(records) {
    return [
      drawerSection("Current state", [
        '<div class="portal-detail-grid">',
        detailRow("Role", personaLabel(state.selectedPersona)),
        detailRow("Scenario", records.load.id + " / " + records.load.customer),
        detailRow("Current step", String(state.selectedStepIndex + 1) + " / " + workflowSteps[state.selectedStepIndex]),
        "</div>",
        '<div class="portal-button-row">',
        '<button class="portal-inline-button" type="button" data-demo-action="prev-step">Previous step</button>',
        '<button class="portal-inline-button" type="button" data-demo-action="next-step">Next step</button>',
        '<button class="portal-inline-button" type="button" data-demo-action="reset-demo">Reset</button>',
        "</div>"
      ].join("")),
      drawerSection("Portal role", personaGroups.map(function (group) {
        return "<div><p class=\"portal-card-note\">" + escapeHtml(group.label) + "</p><div class=\"portal-chip-grid\">" + group.items.map(function (item) {
          var active = item.id === state.selectedPersona ? " is-active" : "";
          return '<button class="portal-chip-button' + active + '" type="button" data-demo-action="set-persona" data-persona="' + escapeHtml(item.id) + '">' +
            "<strong>" + escapeHtml(item.label) + "</strong><span>" + escapeHtml(item.descriptor) + "</span></button>";
        }).join("") + "</div></div>";
      }).join("")),
      drawerSection("Scenario selector", '<div class="portal-scenario-list">' + state.data.loads.map(function (load) {
        var meta = scenarioMeta[load.id];
        var active = load.id === state.selectedLoadId ? " is-active" : "";
        return '<button class="portal-scenario-button' + active + '" type="button" data-demo-action="select-load" data-load-id="' + escapeHtml(load.id) + '">' +
          "<strong>" + escapeHtml(load.id + " / " + load.customer) + "</strong><span>" + escapeHtml(meta.issueType + " / " + meta.proofReadiness + " / " + meta.age) + "</span></button>";
      }).join("") + "</div>"),
      '<details class="portal-accordion"><summary>Workflow progress</summary><div class="portal-accordion-body">' + workflowStrip() + "</div></details>",
      '<details class="portal-accordion"><summary>Selected load detail</summary><div class="portal-accordion-body">' +
        detailGrid([
          ["Issue", records.meta.issueType],
          ["Dispatch restriction", records.meta.dispatchRestriction],
          ["Required action", records.meta.requiredAction],
          ["Billing readiness", records.meta.billingReadiness]
        ]) +
        '<div class="portal-detail-actions"><button class="portal-inline-button" type="button" data-demo-action="open-detail">Open full detail</button></div>' +
      "</div></details>",
      drawerSection("Disclosure", "<p class=\"portal-subtext\">Synthetic product demonstration using illustrative data only. Persistence, integrations, and customer-specific configuration are handled during implementation.</p>")
    ].join("");
  }

  function renderDetailDrawer(records) {
    return [
      drawerSection("Dispatch Summary", detailGrid([
        ["Load status", records.load.dispatchStatus],
        ["Driver", records.driver ? records.driver.name + " / " + records.meta.driverDescriptor : "Assignment pending"],
        ["Equipment", records.unit ? records.unit.label : "No unit assigned"],
        ["Pickup window", records.meta.pickupWindow],
        ["Delivery window", records.meta.deliveryWindow],
        ["Dispatch restriction", records.meta.dispatchRestriction],
        ["Required action", records.meta.requiredAction]
      ])),
      drawerSection("Customer Summary", detailGrid([
        ["Customer", records.load.customer],
        ["Shipment reference", records.meta.shipmentRef],
        ["Customer-visible status", records.meta.customerStatus],
        ["Required proof", records.meta.requiredProof],
        ["Billing contact", records.meta.billingContact],
        ["Billing readiness", records.meta.billingReadiness]
      ])),
      drawerSection("Clearance & Proof", detailGrid([
        ["Open exception", records.exception ? records.exception.title : "No open exception"],
        ["Approval state", records.meta.approvalState],
        ["Proof readiness", records.meta.proofReadiness],
        ["Financial effect", records.meta.financialEffect]
      ])),
      drawerSection("Cross-Module Effects", detailGrid([
        ["Dispatch", records.meta.dispatchRestriction],
        ["Safety", records.safety ? records.safety.dispatchConsequence : records.meta.requiredAction],
        ["Documents", records.meta.requiredProof],
        ["Customer visibility", records.meta.customerVisibility]
      ])),
      drawerSection("Proof Packet Detail", proofTable(records)),
      drawerSection("Workflow progress", workflowStrip())
    ].join("");
  }

  function proofTable(records) {
    var times = {
      "BOF-1907": ["08:24", "16:52", "08:36", "17:08", "08:42", "16:58", "17:12"],
      "BOF-1931": ["Draft", "Pending", "Pending", "Pending", "Pending", "Pending", "Draft"],
      "BOF-2064": ["05:58", "12:33", "06:01", "12:38", "06:08", "12:40", "12:44"],
      "BOF-2175": ["09:15", "18:34", "09:18", "18:42", "18:41", "18:36", "18:49"],
      "BOF-2258": ["06:12", "Pending", "Pending", "Pending", "Pending", "Pending", "Draft"]
    }[records.load.id];
    return '<div class="portal-table-wrap"><table class="portal-proof-table"><thead><tr><th>Document</th><th>Status</th><th>Source</th><th>Time</th><th>Review</th><th>Customer</th><th>Billing</th></tr></thead><tbody>' +
      proofDocuments.map(function (item, index) {
        var status = records.meta.proofItems[item.id];
        return "<tr><td>" + escapeHtml(item.label) + "</td><td>" + badge(status) + "</td><td>" + escapeHtml(item.source) + "</td><td>" + escapeHtml(times[index]) + "</td><td>" + escapeHtml(reviewState(status)) + "</td><td>" + escapeHtml(item.customer) + "</td><td>" + escapeHtml(item.billing) + "</td></tr>";
      }).join("") +
      "</tbody></table></div>";
  }

  function reviewState(status) {
    if (status === "Complete" || status === "Customer Released") return "Cleared";
    if (status === "Generated Draft") return "Awaiting release";
    if (status === "Pending Review") return "Owner review";
    if (status === "Internal Only") return "Internal reference";
    return "Missing";
  }

  function drawerSection(title, body) {
    return '<section class="portal-drawer-section"><div class="portal-row-head"><h3>' + escapeHtml(title) + "</h3></div>" + body + "</section>";
  }

  function syncPanels() {
    var sidebar = root.querySelector("[data-sidebar]");
    var menuButton = root.querySelector(".portal-menu-button");
    if (sidebar) sidebar.classList.toggle("is-open", state.sidebarOpen);
    if (menuButton) menuButton.setAttribute("aria-expanded", state.sidebarOpen ? "true" : "false");
  }

  function resetDemo() {
    state.selectedLoadId = "BOF-1907";
    state.selectedPersona = "manager";
    state.activeView = "manager";
    state.requestedView = "";
    state.selectedStepIndex = 9;
    state.drawerOpen = false;
    state.drawerMode = "controls";
    state.actionMessage = "";
    if (window.history && window.history.pushState) {
      window.history.pushState(null, "", window.location.pathname + "?portal=manager");
    }
    render();
  }

  function handleClick(event) {
    var actionNode = event.target.closest("[data-demo-action]");
    if (actionNode) {
      var action = actionNode.getAttribute("data-demo-action");
      if (action === "toggle-sidebar") {
        state.sidebarOpen = !state.sidebarOpen;
        syncPanels();
        return;
      }
      if (action === "close-overlay" || action === "close-drawer") {
        state.drawerOpen = false;
        state.sidebarOpen = false;
        render();
        return;
      }
      if (action === "open-controls") {
        state.drawerOpen = true;
        state.drawerMode = "controls";
        render();
        return;
      }
      if (action === "open-detail") {
        state.drawerOpen = true;
        state.drawerMode = "details";
        render();
        return;
      }
      if (action === "set-persona") {
        setPersona(actionNode.getAttribute("data-persona"));
        state.drawerOpen = true;
        state.drawerMode = "controls";
        return;
      }
      if (action === "set-view") {
        state.requestedView = "";
        setActiveView(actionNode.getAttribute("data-view"), true);
        render();
        return;
      }
      if (action === "reset-demo") {
        resetDemo();
        return;
      }
      if (action === "next-step") {
        state.selectedStepIndex = Math.min(workflowSteps.length - 1, state.selectedStepIndex + 1);
        render();
        return;
      }
      if (action === "prev-step") {
        state.selectedStepIndex = Math.max(0, state.selectedStepIndex - 1);
        render();
        return;
      }
      if (action === "select-load") {
        state.selectedLoadId = actionNode.getAttribute("data-load-id");
        if (state.drawerMode !== "details") state.selectedStepIndex = currentMeta().defaultStep;
        state.drawerOpen = true;
        state.drawerMode = "details";
        render();
        return;
      }
      if (action === "toggle-card") {
        var card = actionNode.closest(".portal-card.is-collapsible");
        if (card) card.classList.toggle("is-open");
        return;
      }
      if (action === "policy-action") {
        state.actionMessage = actionNode.getAttribute("data-action-label") + " selected for Driver Qualification Policy. This demo shows workflow intent with synthetic policy data only.";
        render();
      }
    }
  }

  function handleKeydown(event) {
    if (event.key !== "Escape") return;
    if (!state.drawerOpen && !state.sidebarOpen) return;
    state.drawerOpen = false;
    state.sidebarOpen = false;
    render();
  }

  function render() {
    if (!state.data) return;
    var records = selectedRecords();
    renderSidebar();
    renderHeader(records);
    renderKpis();
    renderSelectedLoad(records);
    renderMain(records);
    renderDrawer(records);
    syncPanels();
  }

  function loadData() {
    fetch("/assets/data/bof-public-operations.json")
      .then(function (response) {
        if (!response.ok) throw new Error("BOF demo data could not be loaded.");
        return response.json();
      })
      .then(function (data) {
        state.data = data;
        applyRouteState();
        render();
      })
      .catch(function (error) {
        root.innerHTML = '<main class="portal-stage"><section class="portal-card"><h1>Customer demo unavailable</h1><p>' + escapeHtml(error.message) + "</p></section></main>";
      });
  }

  root.addEventListener("click", handleClick);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("popstate", function () {
    if (!state.data) return;
    applyRouteState();
    render();
  });
  loadData();
})();
