(function () {
  var root = document.querySelector("[data-customer-portal]");
  if (!root) return;
  if (root.getAttribute("data-portal-bound") === "true") return;
  root.setAttribute("data-portal-bound", "true");

  var form = root.querySelector("[data-load-form]");
  var activeDoc = "rate";
  var selectedShipment = "BOF-LD-86240";
  var selectedStage = "In Transit";
  var stateKey = "bofCustomerLoadIntakeState";

  var dispatchState = {
    driver: "John Carter - DRV-001",
    tractor: "TR-4812",
    trailer: "RF-2207",
    quoteApproved: false,
    packetGenerated: true,
    complianceReady: true
  };

  function loadSavedState() {
    try {
      var saved = JSON.parse(localStorage.getItem(stateKey) || "{}");
      if (saved && saved.loadId === selectedShipment) {
        dispatchState.quoteApproved = !!saved.quoteApproved;
        dispatchState.packetGenerated = saved.packetGenerated !== false;
        dispatchState.driver = saved.driver || dispatchState.driver;
        dispatchState.tractor = saved.tractor || dispatchState.tractor;
        dispatchState.trailer = saved.trailer || dispatchState.trailer;
      }
    } catch (error) {
      dispatchState.quoteApproved = false;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(stateKey, JSON.stringify({
        loadId: selectedShipment,
        quoteApproved: dispatchState.quoteApproved,
        packetGenerated: dispatchState.packetGenerated,
        driver: dispatchState.driver,
        tractor: dispatchState.tractor,
        trailer: dispatchState.trailer
      }));
    } catch (error) {
      // Local storage is only used to keep this static demo coherent between pages.
    }
  }

  var portal = {
    customer: "Prairie View Foods",
    contact: "Elena Brooks",
    contactLine: "ops@pvfoods.example / 214-782-1184",
    po: "PVF-86240",
    loadId: "BOF-LD-86240",
    reviewId: "BOF-RR-86240",
    shipmentId: "SHP-86240-DAL-MEM",
    invoiceId: "INV-86240-PVF",
    bolId: "BOL-86240-PVF",
    rateId: "RC-86240-DAL-MEM",
    sealId: "SEAL-806240",
    origin: "Dallas, TX",
    destination: "Memphis, TN",
    pickupFacility: "Prairie View Cold Dock",
    deliveryFacility: "Riverbend Grocery DC",
    pickupAddress: "1420 Commerce Loop, Dallas, TX 75212",
    deliveryAddress: "3100 Distribution Way, Memphis, TN 38118",
    pickupWindow: "Jun 19, 2026 08:00-10:00 CT",
    deliveryWindow: "Jun 20, 2026 13:00-15:00 CT",
    pickupNotes: "Dock 3, appointment required, check in with shipping office",
    deliveryNotes: "Receiver requires seal match, signed BOL, and dock photo",
    commodity: "Packaged refrigerated grocery freight",
    equipment: "53 ft reefer",
    tempRequirement: "34-38 F continuous",
    hazmat: false,
    highValue: false,
    fragile: false,
    weight: 34200,
    pallets: 22,
    pieces: 1840,
    dimensions: "Standard 48x40 pallets",
    stops: 2,
    lumper: "Possible receiver lumper, receipt required",
    accessorials: "Detention, reefer pre-cool, seal record, cargo photos",
    miles: 452,
    driver: "John Carter - DRV-001",
    tractor: "TR-4812",
    trailer: "RF-2207",
    paymentTerms: "Net 30",
    quoteDecision: "Temporary quote - pending dispatch review",
    quoteMessage: "Simulated quote prepared in this browser. Approval updates this walkthrough only; it does not send a live commercial quote."
  };

  loadSavedState();

  var shipments = [
    {
      load: "BOF-LD-86240",
      customer: "Prairie View Foods",
      type: "Food / produce reefer",
      status: "Pending Dispatch Review",
      statusClass: "review",
      lane: "Dallas, TX to Memphis, TN",
      quoteAmount: null,
      driver: "John Carter - TR-4812 / RF-2207",
      next: "Pre-trip packet pending seal photo, loaded cargo proof, and reefer pre-cool check.",
      proof: "Temperature log, seal pickup photo, cargo photo, POD, lumper receipt if used"
    },
    {
      load: "BOF-LD-86241",
      customer: "Summit Retail Group",
      type: "Retail dry van",
      status: "Driver Assignment Needed",
      statusClass: "watch",
      lane: "Tulsa, OK to Kansas City, MO",
      quoteAmount: 1742,
      driver: "Driver assignment needed",
      next: "Assign dry van team and confirm pallet count before release.",
      proof: "Dock appointment, BOL, delivery POD, empty trailer photo"
    },
    {
      load: "BOF-LD-86242",
      customer: "Northstar Medical Devices",
      type: "High-value / fragile",
      status: "Equipment Assignment Needed",
      statusClass: "hold",
      lane: "Little Rock, AR to St. Louis, MO",
      quoteAmount: 3428,
      driver: "High-value team review",
      next: "Add high-value proof controls and validate cargo insurance before dispatch-ready.",
      proof: "Serial photo, seal chain, two checkpoint photos, exception notes, signed POD"
    }
  ];

  var trackingStages = [
    { name: "Submitted", status: "Complete", detail: "Shipment request captured with customer, lane, commodity, equipment, proof, and terms.", owner: "Customer portal" },
    { name: "Quoted", status: "Complete", detail: "Temporary quote prepared with mileage, fuel, accessorials, demo pricing assumptions, and proof requirements.", owner: "BOF quote review" },
    { name: "Approved", status: "Complete", detail: "Simulated approval marks the walkthrough quote as accepted. It does not create a live dispatch load.", owner: "Customer walkthrough" },
    { name: "Assigned", status: "Complete", detail: "Driver, tractor, trailer, and readiness checks are attached.", owner: "Dispatch review" },
    { name: "Picked Up", status: "Watch", detail: "Pickup waits on loaded cargo photo, seal record, securement confirmation, and equipment exception capture.", owner: "Dispatch review" },
    { name: "In Transit", status: "Watch", detail: "Route watch, HOS, temperature/fuel context, and exceptions stay visible.", owner: "BOF operations" },
    { name: "Delivered", status: "Pending", detail: "POD quality review, signed BOL, receiver, timestamp, dock photo, and empty trailer proof are required.", owner: "Driver and closeout review" },
    { name: "Load Packet Complete", status: "Pending", detail: "Rate confirmation, invoice, signed BOL, POD quality review, cargo/seal proof, empty trailer photo, and lumper receipt when used are complete.", owner: "Load packet review" },
    { name: "Settlement Complete", status: "Pending", detail: "Invoice, POD, lumper receipt when used, settlement release, billing/factoring packet, and next-load readiness are reviewed.", owner: "Billing review" }
  ];

  function money(amount) {
    return "$" + Math.round(amount).toLocaleString("en-US");
  }

  function escapeHtml(input) {
    return String(input)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function value(name) {
    if (!form || !form.elements[name]) return "";
    var field = form.elements[name];
    if (field.type === "checkbox") return field.checked;
    return String(field.value || "").trim();
  }

  function readFormData() {
    if (!form) return portal;
    portal.customer = value("companyName") || portal.customer;
    portal.contact = value("contactName") || portal.contact;
    portal.contactLine = [value("contactEmail"), value("contactPhone")].filter(Boolean).join(" / ") || portal.contactLine;
    portal.po = value("poNumber") || portal.po;
    portal.pickupFacility = value("pickupFacility") || portal.pickupFacility;
    portal.deliveryFacility = value("deliveryFacility") || portal.deliveryFacility;
    portal.pickupAddress = value("pickupAddress") || portal.pickupAddress;
    portal.deliveryAddress = value("deliveryAddress") || portal.deliveryAddress;
    portal.pickupWindow = value("pickupWindow") || portal.pickupWindow;
    portal.deliveryWindow = value("deliveryWindow") || portal.deliveryWindow;
    portal.pickupNotes = value("pickupNotes") || portal.pickupNotes;
    portal.deliveryNotes = value("deliveryNotes") || portal.deliveryNotes;
    portal.commodity = value("commodity") || portal.commodity;
    portal.equipment = value("equipmentType") || portal.equipment;
    portal.tempRequirement = value("temperature") || portal.tempRequirement;
    portal.hazmat = !!value("hazmat");
    portal.highValue = !!value("highValue");
    portal.fragile = !!value("fragile");
    portal.weight = Number(value("weight")) || portal.weight;
    portal.pallets = Number(value("palletCount")) || portal.pallets;
    portal.pieces = Number(value("pieceCount")) || portal.pieces;
    portal.dimensions = value("dimensions") || portal.dimensions;
    portal.stops = Number(value("stopCount")) || portal.stops;
    portal.lumper = value("lumper") || portal.lumper;
    portal.accessorials = value("accessorials") || portal.accessorials;
    portal.miles = Number(value("laneMiles")) || portal.miles;
    portal.paymentTerms = value("paymentTerms") || portal.paymentTerms;
    return portal;
  }

  function quote() {
    var data = readFormData();
    var equipmentText = data.equipment.toLowerCase();
    var baseRate = equipmentText.indexOf("flatbed") >= 0 ? 3.35 : equipmentText.indexOf("reefer") >= 0 ? 3.2 : equipmentText.indexOf("box") >= 0 ? 2.55 : 2.85;
    var base = Math.max(850, data.miles * baseRate);
    var fuel = data.miles * 0.46;
    var equipment = equipmentText.indexOf("reefer") >= 0 ? 325 : equipmentText.indexOf("flatbed") >= 0 ? 240 : equipmentText.indexOf("box") >= 0 ? 125 : 0;
    var accessorial = 150 + (data.stops > 2 ? (data.stops - 2) * 85 : 0) + (/yes|possible/i.test(data.lumper) ? 95 : 0);
    var premiumMultiplier = data.highValue || data.fragile || data.hazmat ? 1.12 : /today|expedite|urgent/i.test(data.pickupWindow + " " + data.accessorials) ? 1.08 : 1;
    var subtotal = (base + fuel + equipment + accessorial) * premiumMultiplier;
    var discount = subtotal * 0.035;
    var margin = subtotal * 0.11;
    var total = subtotal - discount;
    return [
      { label: "Estimated mileage", value: data.miles + " mi" },
      { label: "Base rate per mile", value: "$" + baseRate.toFixed(2) + " / mi" },
      { label: "Base linehaul estimate", value: money(base), amount: base },
      { label: "Fuel surcharge", value: money(fuel), amount: fuel },
      { label: "Equipment surcharge", value: money(equipment), amount: equipment },
      { label: "Accessorial charges", value: money(accessorial), amount: accessorial },
      { label: "Premium / urgency multiplier", value: premiumMultiplier.toFixed(2) + "x" },
      { label: "Customer discount", value: "-" + money(discount), amount: -discount },
      { label: "Estimated BOF margin", value: money(margin), amount: margin },
      { label: "Temporary quote total", value: money(total), amount: total, total: true }
    ];
  }

  function quoteTotal() {
    var lines = quote();
    return lines[lines.length - 1].amount;
  }

  function quoteForShipment(item) {
    return item.load === portal.loadId ? money(quoteTotal()) : money(item.quoteAmount);
  }

  function statusForShipment(item) {
    if (item.load !== portal.loadId || !dispatchState.quoteApproved) {
      return { label: item.status, className: item.statusClass };
    }
    return { label: "Approved", className: "ready" };
  }

  function setText(key, text) {
    root.querySelectorAll('[data-portal-text="' + key + '"]').forEach(function (node) {
      node.textContent = text;
    });
  }

  function setHtml(key, html) {
    root.querySelectorAll('[data-portal-render="' + key + '"]').forEach(function (node) {
      node.innerHTML = html;
    });
  }

  function field(label, text) {
    return '<div class="paper-field"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(text) + '</strong></div>';
  }

  function check(label, text) {
    return '<div class="paper-check"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(text) + '</strong></div>';
  }

  function renderQuoteLines() {
    var lines = quote();
    var total = lines[lines.length - 1].value;
    setText("quoteTotal", total);
    var html = lines.map(function (line) {
      return '<div class="quote-line' + (line.total ? " quote-total-line" : "") + '"><span>' + escapeHtml(line.label) + '</span><strong>' + escapeHtml(line.value) + '</strong></div>';
    }).join("");
    setHtml("quoteLines", html);
    setHtml("billingLines", html + '<div class="quote-line"><span>Payment terms</span><strong>' + escapeHtml(portal.paymentTerms) + '</strong></div>');
  }

  function renderIds() {
    var rows = [
      ["Load ID", portal.loadId],
      ["Shipment number", portal.shipmentId],
      ["BOF review", portal.reviewId],
      ["Draft BOL", portal.bolId],
      ["Draft rate confirmation", portal.rateId],
      ["Draft invoice", portal.invoiceId],
      ["Seal number", portal.sealId],
      ["Load packet readiness", documentReadiness().status]
    ];
    setText("shipmentId", portal.shipmentId);
    setText("loadId", portal.loadId);
    setText("invoiceId", portal.invoiceId);
    setText("lane", portal.origin + " to " + portal.destination);
    setHtml("idSummary", rows.map(function (row) {
      return '<div><dt>' + escapeHtml(row[0]) + '</dt><dd>' + escapeHtml(row[1]) + '</dd></div>';
    }).join(""));
  }

  function documentReadiness() {
    var ready = dispatchState.quoteApproved && dispatchState.packetGenerated;
    return {
      status: ready ? "Pre-trip packet generated" : "Pre-trip packet pending",
      items: [
        ["Load ID", portal.loadId],
        ["Shipment number", portal.shipmentId],
        ["Draft rate confirmation", dispatchState.packetGenerated ? portal.rateId : "Pending"],
        ["Draft invoice", dispatchState.packetGenerated ? portal.invoiceId : "Pending"],
        ["Draft bill of lading", dispatchState.packetGenerated ? portal.bolId : "Pending"],
        ["Seal number", portal.sealId],
        ["Cargo photo record", "Attached to intake packet"],
        ["Pickup / delivery instructions", "Included"],
        ["Readiness status", ready ? "Ready for dispatch review" : "Waits on quote approval and packet generation"]
      ]
    };
  }

  function dispatchGate() {
    var data = readFormData();
    var required = [
      ["Required load fields complete", data.customer && data.contact && data.contactLine && data.pickupAddress && data.deliveryAddress && data.pickupWindow && data.deliveryWindow && data.commodity && data.weight > 0 && data.equipment],
      ["Quote approved", dispatchState.quoteApproved],
      ["Driver assigned", dispatchState.driver],
      ["Tractor assigned", dispatchState.tractor],
      ["Trailer assigned", dispatchState.trailer],
      ["Compliance readiness passes", dispatchState.complianceReady],
      ["Pre-trip packet generated", dispatchState.packetGenerated]
    ];
    var missing = required.filter(function (item) { return !item[1]; }).map(function (item) { return item[0]; });
    return {
      ready: missing.length === 0,
      missing: missing,
      message: missing.length ? "Blocked: " + missing.join(", ") : "Dispatch gates clear for BOF release review"
    };
  }

  function documentData() {
    var q = quote();
    return {
      rate: {
        watermark: "Rate",
        title: "Draft Rate Confirmation",
        fields: [
          ["Rate confirmation", portal.rateId],
          ["Customer", portal.customer],
          ["Lane", portal.origin + " to " + portal.destination],
          ["Equipment", portal.equipment],
          ["Temperature", portal.tempRequirement],
          ["Estimated total", money(quoteTotal())],
          ["Payment terms", portal.paymentTerms],
          ["Accessorials", portal.accessorials]
        ],
        checks: [["Review owner", "BOF quote review"], ["Release effect", "Controls dispatch release packet"], ["Approval state", portal.quoteDecision]]
      },
      invoice: {
        watermark: "Invoice",
        title: "Draft Invoice",
        fields: [
          ["Invoice", portal.invoiceId],
          ["Bill to", portal.customer],
          ["PO / reference", portal.po],
          ["Shipment", portal.shipmentId],
          ["Linehaul and equipment", money((q[2].amount || 0) + (q[4].amount || 0))],
          ["Fuel and accessorials", money((q[3].amount || 0) + (q[5].amount || 0))],
          ["Estimated total", money(quoteTotal())],
          ["Terms", portal.paymentTerms]
        ],
        checks: [["POD", "Required before settlement release"], ["Signed BOL", "Required"], ["Lumper receipt", "Required when used"]]
      },
      bol: {
        watermark: "BOL",
        title: "Draft Bill Of Lading",
        fields: [
          ["BOL", portal.bolId],
          ["Shipper", portal.pickupFacility],
          ["Origin", portal.pickupAddress],
          ["Consignee", portal.deliveryFacility],
          ["Destination", portal.deliveryAddress],
          ["Commodity", portal.commodity],
          ["Weight / pallets", portal.weight.toLocaleString("en-US") + " lb / " + portal.pallets + " pallets"],
          ["Seal", portal.sealId]
        ],
        checks: [["Pickup window", portal.pickupWindow], ["Delivery window", portal.deliveryWindow], ["Receiver proof", "Signature, timestamp, dock photo"]]
      },
      seal: {
        watermark: "Proof",
        title: "Seal And Cargo Record",
        fields: [
          ["Seal", portal.sealId],
          ["Cargo photo", "Attached for intake review"],
          ["Loaded proof", "Cargo photo and equipment inspection"],
          ["Delivery proof", "Dock photo and empty trailer proof"],
          ["Claims support", "Seal, notes, photos, receiver, location context"],
          ["Owner", "BOF document review"],
          ["Shipment", portal.shipmentId],
          ["Load", portal.loadId]
        ],
        checks: [["Release effect", "Missing proof keeps the load in review"], ["Settlement", "Controls billing closeout"], ["Claim readiness", "Supports dispute packet"]]
      },
      pod: {
        watermark: "POD",
        title: "POD-Ready Proof Checklist",
        fields: [
          ["POD", "Required after delivery"],
          ["Signed BOL", "Required"],
          ["Receiver", "Receiver name and signature required"],
          ["Timestamp", "Delivery timestamp required"],
          ["Dock photo", "Required"],
          ["Empty trailer photo", "Required"],
          ["Lumper receipt", "Required when used"],
          ["Settlement effect", "Controls invoice release"]
        ],
        checks: [["Customer view", "Shows delivery proof status"], ["Billing", "Waits on POD"], ["Claims", "Proof packet retained for review"]]
      },
      factoring: {
        watermark: "Factor",
        title: "Billing/Factoring Packet Preview",
        fields: [
          ["Shipment", portal.shipmentId],
          ["Invoice", portal.invoiceId],
          ["Rate confirmation", portal.rateId],
          ["Signed BOL / POD", "Required after delivery"],
          ["Lumper receipt", "Attached when used"],
          ["Settlement support", "Proof and exception notes retained"],
          ["Claim hold", "Visible if exception exists"],
          ["Packet status", "Waits on delivery proof"]
        ],
        checks: [["Billing effect", "Supports closeout"], ["Factoring support", "Packet assembled after POD"], ["Customer view", "Document status visible"]]
      }
    };
  }

  function renderPaper() {
    var docs = documentData();
    var doc = docs[activeDoc] || docs.rate;
    setText("documentTitle", doc.title);
    root.querySelectorAll('[data-portal-render="paperDocument"]').forEach(function (node) {
      node.setAttribute("data-watermark", doc.watermark);
      if (activeDoc === "bol") {
        node.innerHTML =
          '<header><div><span class="portal-kicker">BackOfficeFleet Shipment Documents</span><h3>Draft Bill Of Lading</h3></div><strong>' + escapeHtml(portal.bolId) + '</strong></header>' +
          '<div class="document-status-row"><span class="portal-status review">Draft</span><span class="portal-status watch">BOF review</span><span class="portal-status ready">Ready when approved</span></div>' +
          '<section class="bol-id-grid">' +
            field("Load ID", portal.loadId) +
            field("Shipment number", portal.shipmentId) +
            field("BOL number", portal.bolId) +
            field("Seal number", portal.sealId) +
            field("Approved quote", money(quoteTotal())) +
          '</section>' +
          '<section class="bol-party-grid">' +
            '<article><h4>Shipper</h4>' + field("Facility", portal.pickupFacility) + field("Address", portal.pickupAddress) + field("Pickup window", portal.pickupWindow) + field("Pickup instructions", portal.pickupNotes) + '</article>' +
            '<article><h4>Consignee</h4>' + field("Facility", portal.deliveryFacility) + field("Address", portal.deliveryAddress) + field("Delivery window", portal.deliveryWindow) + field("Delivery instructions", portal.deliveryNotes) + '</article>' +
            '<article><h4>Carrier / BOF review</h4>' + field("Driver", dispatchState.driver || "Assignment needed") + field("Tractor / trailer", (dispatchState.tractor || "Assignment needed") + " / " + (dispatchState.trailer || "Assignment needed")) + field("Equipment", portal.equipment) + field("Load packet readiness", documentReadiness().status) + '</article>' +
          '</section>' +
          '<section class="bol-commodity-section"><h4>Commodity</h4><table><thead><tr><th>Description</th><th>Weight</th><th>Pallets</th><th>Dimensions</th><th>Temp</th></tr></thead><tbody><tr><td>' + escapeHtml(portal.commodity) + '</td><td>' + escapeHtml(portal.weight.toLocaleString("en-US")) + ' lb</td><td>' + escapeHtml(portal.pallets) + '</td><td>' + escapeHtml(portal.dimensions) + '</td><td>' + escapeHtml(portal.tempRequirement) + '</td></tr></tbody></table></section>' +
          '<section class="bol-proof-grid">' +
            '<article class="bol-photo-placeholder"><img src="/assets/images/documents/load-proof/pretrip-10482-loaded-cargo.webp" alt="Cargo photo record for BOL review"><span>Cargo photo record attached</span></article>' +
            '<article class="bol-readiness"><h4>BOF load packet readiness</h4><div>' + documentReadiness().items.map(function (item) { return '<span><strong>' + escapeHtml(item[0]) + '</strong><em>' + escapeHtml(item[1]) + '</em></span>'; }).join("") + '</div></article>' +
            '<article class="bol-checklist"><h4>Required pickup proof</h4><div>' + ["Driver arrival record", "Seal pickup photo", "Loaded cargo photo", "Equipment inspection", "Shipper signoff", "Temperature check when reefer"].map(function (item) { return '<span>' + escapeHtml(item) + '</span>'; }).join("") + '</div></article>' +
          '</section>' +
          '<section class="bol-instructions">' + field("Special instructions", portal.deliveryNotes + " " + portal.accessorials) + '</section>' +
          '<div class="signature-grid"><div>Shipper signature / date</div><div>Driver signature / date</div><div>Receiver signature / date</div></div>' +
          '<footer><span>Draft BOL packet</span><strong>' + escapeHtml(portal.shipmentId) + '</strong></footer>';
        return;
      }
      node.innerHTML =
        '<header><div><span class="portal-kicker">BackOfficeFleet</span><h3>' + escapeHtml(doc.title) + '</h3></div><strong>' + escapeHtml(portal.reviewId) + '</strong></header>' +
        '<div class="paper-grid">' + doc.fields.map(function (item) { return field(item[0], item[1]); }).join("") + '</div>' +
        '<div class="paper-check-grid">' + doc.checks.map(function (item) { return check(item[0], item[1]); }).join("") + '</div>' +
        '<div class="signature-grid"><div>Customer confirmation</div><div>BOF review</div><div>Operations approval</div></div>' +
        '<footer><span>Shipment packet</span><strong>' + escapeHtml(portal.shipmentId) + '</strong></footer>';
    });
  }

  function renderProofRegistry() {
    var proof = [
      ["Rate confirmation", "Prepared", "Release and billing"],
      ["Invoice preview", "Prepared", "Billing review"],
      ["Bill of lading", "Prepared", "Pickup and delivery proof"],
      ["Cargo photo", "Attached", "Pre-trip release"],
      ["Seal record", portal.sealId, "Pickup, delivery, claim"],
      ["POD quality review / signed BOL", "Required post-trip", "Settlement closeout"],
      ["Dock and empty trailer photo", "Required post-trip", "Claims defense"],
      ["Billing/factoring packet", "Built after POD", "Invoice, rate con, BOL, POD, lumper, claim clearance, settlement support"]
    ];
    setHtml("proofRegistry", proof.map(function (item) {
      return '<div class="proof-item"><strong>' + escapeHtml(item[0]) + '<em>' + escapeHtml(item[1]) + '</em></strong><span>' + escapeHtml(item[2]) + '</span></div>';
    }).join(""));
  }

  function renderShipments() {
    setHtml("shipmentRows", shipments.map(function (item) {
      var selected = item.load === selectedShipment ? ' class="is-selected"' : "";
      var status = statusForShipment(item);
      return '<tr' + selected + '><td><button type="button" data-shipment-row="' + escapeHtml(item.load) + '">' + escapeHtml(item.load) + '</button></td><td>' + escapeHtml(item.customer) + '<small>' + escapeHtml(item.type) + '</small></td><td><span class="portal-status ' + escapeHtml(status.className) + '">' + escapeHtml(status.label) + '</span></td><td>' + escapeHtml(item.lane) + '</td><td>' + escapeHtml(quoteForShipment(item)) + '</td><td>' + escapeHtml(item.driver) + '<small>' + escapeHtml(item.next) + '</small></td></tr>';
    }).join(""));
    setHtml("shipmentCards", shipments.map(function (item) {
      var selected = item.load === selectedShipment ? " is-selected" : "";
      var status = statusForShipment(item);
      return '<article class="dispatch-load-card' + selected + '"><button type="button" data-shipment-row="' + escapeHtml(item.load) + '"><span>' + escapeHtml(item.load) + '</span><strong>' + escapeHtml(item.customer) + '</strong></button><div><span class="portal-status ' + escapeHtml(status.className) + '">' + escapeHtml(status.label) + '</span><strong>' + escapeHtml(quoteForShipment(item)) + '</strong></div><dl><div><dt>Lane</dt><dd>' + escapeHtml(item.lane) + '</dd></div><div><dt>Load type</dt><dd>' + escapeHtml(item.type) + '</dd></div><div><dt>Driver / equipment</dt><dd>' + escapeHtml(item.driver) + '</dd></div><div><dt>Next action</dt><dd>' + escapeHtml(item.next) + '</dd></div></dl></article>';
    }).join(""));
    var item = shipments.filter(function (row) { return row.load === selectedShipment; })[0] || shipments[0];
    var selectedStatus = statusForShipment(item);
    setText("selectedShipmentTitle", item.load);
    setText("selectedShipmentStatus", selectedStatus.label);
    setHtml("shipmentDetail", '<dl class="summary-dl"><div><dt>Customer</dt><dd>' + escapeHtml(item.customer) + '</dd></div><div><dt>Load type</dt><dd>' + escapeHtml(item.type) + '</dd></div><div><dt>Lane</dt><dd>' + escapeHtml(item.lane) + '</dd></div><div><dt>Quote</dt><dd>' + escapeHtml(quoteForShipment(item)) + '</dd></div><div><dt>Proof requirements</dt><dd>' + escapeHtml(item.proof) + '</dd></div><div><dt>Next action</dt><dd>' + escapeHtml(item.next) + '</dd></div></dl>');
    setHtml("assignmentSummary", '<dl class="summary-dl"><div><dt>Driver</dt><dd>' + escapeHtml(dispatchState.driver || "Assignment needed") + '</dd></div><div><dt>Tractor</dt><dd>' + escapeHtml(dispatchState.tractor || "Assignment needed") + '</dd></div><div><dt>Trailer</dt><dd>' + escapeHtml(dispatchState.trailer || "Assignment needed") + '</dd></div><div><dt>Readiness</dt><dd>' + escapeHtml(dispatchGate().message) + '</dd></div></dl>');
  }

  function renderTracking() {
    setHtml("trackingTimeline", trackingStages.map(function (stage) {
      var cls = stage.name === selectedStage ? " is-active" : "";
      var mark = stage.status === "Complete" ? "OK" : stage.status === "Watch" ? "!" : "...";
      return '<button class="' + cls.trim() + '" type="button" data-tracking-stage="' + escapeHtml(stage.name) + '"><i>' + mark + '</i><strong>' + escapeHtml(stage.name) + '</strong><span>' + escapeHtml(stage.status) + '</span></button>';
    }).join(""));
    var stage = trackingStages.filter(function (item) { return item.name === selectedStage; })[0] || trackingStages[0];
    setText("trackingCurrent", stage.name);
    setText("trackingStageTitle", stage.name);
    setText("trackingStageStatus", stage.status);
    setText("trackingNext", stage.detail);
    setHtml("trackingDetail", '<div class="tracking-detail-card"><strong>' + escapeHtml(stage.name) + '</strong><p>' + escapeHtml(stage.detail) + '</p><dl class="summary-dl"><div><dt>Owner</dt><dd>' + escapeHtml(stage.owner) + '</dd></div><div><dt>Shipment</dt><dd>' + escapeHtml(portal.shipmentId) + '</dd></div><div><dt>Proof dependency</dt><dd>Documents and photos stay tied to dispatch, billing, settlement, factoring, and claim readiness.</dd></div></dl></div>');
  }

  function renderAssumptions() {
    var assumptions = [
      "Configurable demo pricing, not proprietary production logic",
      "Mileage: " + portal.miles + " lane miles",
      "Base rate changes by equipment class and load risk",
      "Fuel surcharge included as a visible line item",
      "Accessorials: " + portal.accessorials,
      "Lumper receipt required when used",
      "Cargo insurance, hazmat, high-value, and fragile flags reviewed before release"
    ];
    setHtml("quoteAssumptions", assumptions.map(function (item) { return '<span>' + escapeHtml(item) + '</span>'; }).join(""));
  }

  function renderDocumentReadiness() {
    var readiness = documentReadiness();
    setText("documentReadiness", readiness.status);
    setHtml("documentReadinessList", readiness.items.map(function (item) {
      return '<span><strong>' + escapeHtml(item[0]) + '</strong><em>' + escapeHtml(item[1]) + '</em></span>';
    }).join(""));
  }

  function renderDispatchGate() {
    var gate = dispatchGate();
    setText("dispatchGateStatus", gate.ready ? "Release review ready" : "Dispatch-ready blocked");
    setHtml("dispatchGateList", (gate.missing.length ? gate.missing : ["All required gates clear"]).map(function (item) {
      return '<span>' + escapeHtml(item) + '</span>';
    }).join(""));
  }

  function renderLifecycle() {
    var items = [
      ["Pre-trip", "Rate con, BOL, seal, equipment check, and loaded cargo photo"],
      ["Pickup proof", "Arrival, seal pickup photo, cargo photo, and pickup notes"],
      ["In-route monitoring", "Status, appointment risk, temperature, and exception watch"],
      ["Delivery proof / POD quality review", "Signed BOL, POD, receiver, dock photo, empty trailer photo"],
      ["Claims workflow", "Opened only if proof, condition, shortage, or timing exception exists"],
      ["Settlement", "Invoice, proof, lumper receipt, claim clearance, and settlement review"],
      ["Billing/factoring packet", "Rate con, invoice, signed BOL/POD, proof, claim clearance, settlement support"],
      ["Next-load readiness", "Driver availability, equipment status, unresolved defects, and open exceptions"]
    ];
    setHtml("lifecycleGrid", items.map(function (item, index) {
      return '<article class="lifecycle-card"><span>' + String(index + 1).padStart(2, "0") + '</span><strong>' + escapeHtml(item[0]) + '</strong><p>' + escapeHtml(item[1]) + '</p></article>';
    }).join(""));
  }

  function renderAll() {
    readFormData();
    if (dispatchState.quoteApproved) {
      portal.quoteDecision = "Approved - pending dispatch review";
      portal.quoteMessage = "Simulated approval saved in this browser. BOF dispatch still has to clear assignment, compliance, equipment, and pre-trip packet gates on a real load.";
    }
    renderQuoteLines();
    renderIds();
    renderPaper();
    renderProofRegistry();
    renderShipments();
    renderTracking();
    renderAssumptions();
    renderDocumentReadiness();
    renderDispatchGate();
    renderLifecycle();
    setText("quoteDecision", portal.quoteDecision);
    setText("quoteMessage", portal.quoteMessage);
    setText("requestStatus", "Required review open");
  }

  function fillSample() {
    if (!form) return;
    var sample = {
      companyName: "Prairie View Foods",
      contactName: "Elena Brooks",
      contactEmail: "ops@pvfoods.example",
      contactPhone: "214-782-1184",
      poNumber: "PVF-86240",
      pickupFacility: "Prairie View Cold Dock",
      pickupAddress: "1420 Commerce Loop, Dallas, TX 75212",
      pickupWindow: "Jun 19, 2026 08:00-10:00 CT",
      pickupNotes: "Dock 3, appointment required, check in with shipping office",
      deliveryFacility: "Riverbend Grocery DC",
      deliveryAddress: "3100 Distribution Way, Memphis, TN 38118",
      deliveryWindow: "Jun 20, 2026 13:00-15:00 CT",
      deliveryNotes: "Receiver requires seal match, signed BOL, and dock photo",
      commodity: "Packaged refrigerated grocery freight",
      weight: "34200",
      palletCount: "22",
      pieceCount: "1840",
      dimensions: "Standard 48x40 pallets",
      stopCount: "2",
      temperature: "34-38 F continuous",
      insuranceMinimum: "$100,000 cargo",
      detention: "2 hours free, billable after",
      layoverTonu: "Reviewed if appointment cancels after dispatch commitment",
      lumper: "Possible receiver lumper, receipt required",
      accessorials: "Detention, reefer pre-cool, seal record, cargo photos",
      fuelSurcharge: "Current BOF review fuel line",
      laneMiles: "452"
    };
    Object.keys(sample).forEach(function (name) {
      if (form.elements[name]) form.elements[name].value = sample[name];
    });
    if (form.elements.loadType) form.elements.loadType.value = "Refrigerated food";
    if (form.elements.equipmentType) form.elements.equipmentType.value = "53 ft reefer";
    if (form.elements.paymentTerms) form.elements.paymentTerms.value = "Net 30";
    ["sealRequired", "cargoPhotoRequired", "insuranceRequired"].forEach(function (name) {
      if (form.elements[name]) form.elements[name].checked = true;
    });
    ["highValue", "hazmat", "fragile"].forEach(function (name) {
      if (form.elements[name]) form.elements[name].checked = false;
    });
    renderAll();
  }

  root.addEventListener("click", function (event) {
    var action = event.target.closest("[data-portal-action]");
    if (action) {
      var kind = action.getAttribute("data-portal-action");
      if (kind === "load-sample") fillSample();
      if (kind === "reset-request" && form) {
        form.reset();
        dispatchState.quoteApproved = false;
        dispatchState.packetGenerated = true;
        portal.quoteDecision = "Temporary quote - pending dispatch review";
        portal.quoteMessage = "Draft reset. Complete required fields, calculate the quote, and approve it before dispatch review.";
        saveState();
        renderAll();
      }
      if (kind === "calculate-quote") {
        if (!form || form.reportValidity()) renderAll();
      }
      if (kind === "prepare-packet") {
        if (!form || form.reportValidity()) {
          dispatchState.packetGenerated = true;
          portal.quoteMessage = "Shipment packet prepared for BOF review.";
          saveState();
          renderAll();
        }
      }
      if (kind === "approve-quote") {
        if (!form || form.reportValidity()) {
          dispatchState.quoteApproved = true;
          portal.quoteDecision = "Approved - pending dispatch review";
          portal.quoteMessage = "Simulated approval saved in this browser. BOF dispatch still has to clear assignment, compliance, equipment, and pre-trip packet gates on a real load.";
          saveState();
          renderAll();
        }
      }
      if (kind === "request-quote-change") {
        dispatchState.quoteApproved = false;
        portal.quoteDecision = "Review requested";
        portal.quoteMessage = "BOF quote review will revisit accessorials, timing, equipment, and proof requirements.";
        saveState();
        renderAll();
      }
      if (kind === "hold-quote") {
        dispatchState.quoteApproved = false;
        portal.quoteDecision = "Draft saved";
        portal.quoteMessage = "Draft saved for customer follow-up. The load is not dispatch-ready until the quote is approved.";
        saveState();
        renderAll();
      }
      if (kind === "refresh-generator") renderAll();
    }

    var docTab = event.target.closest("[data-doc-tab]");
    if (docTab) {
      activeDoc = docTab.getAttribute("data-doc-tab");
      root.querySelectorAll("[data-doc-tab]").forEach(function (button) {
        button.classList.toggle("is-active", button === docTab);
      });
      renderPaper();
    }

    var row = event.target.closest("[data-shipment-row]");
    if (row) {
      selectedShipment = row.getAttribute("data-shipment-row");
      renderShipments();
    }

    var stage = event.target.closest("[data-tracking-stage]");
    if (stage) {
      selectedStage = stage.getAttribute("data-tracking-stage");
      renderTracking();
    }
  });

  root.addEventListener("change", function (event) {
    var select = event.target.closest("[data-dispatch-select]");
    if (select) {
      dispatchState[select.getAttribute("data-dispatch-select")] = select.value;
      saveState();
      renderAll();
    }
  });

  if (form) {
    form.addEventListener("input", renderAll);
    form.addEventListener("change", renderAll);
  }

  var photoInput = root.querySelector("[data-cargo-photo]");
  if (photoInput) {
    photoInput.addEventListener("change", function () {
      var file = photoInput.files && photoInput.files[0];
      if (!file || !file.type || file.type.indexOf("image/") !== 0) return;
      var reader = new FileReader();
      reader.addEventListener("load", function () {
        var preview = root.querySelector('[data-portal-image="photoPreview"]');
        if (preview) preview.setAttribute("src", reader.result);
        setText("photoStatus", "Cargo photo selected for intake review.");
        setText("photoCaption", "Customer cargo photo is visible in the shipment packet preview.");
        renderAll();
      });
      reader.readAsDataURL(file);
    });
  }

  if (location.hash === "#bol") {
    activeDoc = "bol";
    root.querySelectorAll("[data-doc-tab]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-doc-tab") === "bol");
    });
  }

  renderAll();
})();
