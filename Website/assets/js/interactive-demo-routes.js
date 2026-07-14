(function () {
  var mount = document.querySelector("[data-demo-route-page]");
  if (!mount) return;

  var navItems = [
    ["Command Center", "/interactive-demo/", "app-icon-home"],
    ["Load Queue", "/interactive-demo/load-queue/", "app-icon-list"],
    ["Dispatch Board", "/interactive-demo/dispatch/", "app-icon-calendar"],
    ["Drivers", "/interactive-demo/drivers/", "app-icon-user"],
    ["Document Intake", "/interactive-demo/drivers/document-intake/", "app-icon-doc"],
    ["Carriers", "/interactive-demo/carriers/", "app-icon-truck"],
    ["Documents", "/interactive-demo/documents/", "app-icon-doc"],
    ["Safety & Compliance", "/interactive-demo/safety/", "app-icon-shield"],
    ["Settlements", "/interactive-demo/settlements/", "app-icon-report"],
    ["Reports", "/interactive-demo/reports/", "app-icon-report"],
    ["Alerts", "/interactive-demo/alerts/", "app-icon-bell"],
    ["Settings", "/interactive-demo/settings/", "app-icon-settings"]
  ];

  var loads = [
    ["TMS-LD-10482", "High", "Review", "Dallas, TX", "Memphis, TN", "DRV-001", "CAR-118", "Today", "BOF-RR-10482 controls release"],
    ["BOF-1907", "Medium", "Watch", "Tulsa, OK", "Kansas City, MO", "DRV-002", "CAR-204", "Tomorrow", "POD and renewal evidence"],
    ["BOF-1931", "High", "Hold", "Little Rock, AR", "St. Louis, MO", "DRV-003", "CAR-088", "Before assignment", "Medical-card hold"],
    ["BOF-2064", "Low", "Ready", "Birmingham, AL", "Nashville, TN", "DRV-004", "CAR-118", "Today", "Equipment staging only"],
    ["BOF-2175", "Medium", "Review", "Mobile, AL", "Atlanta, GA", "DRV-005", "CAR-204", "Tomorrow", "Rate confirmation match"],
    ["BOF-2258", "Medium", "Watch", "Shreveport, LA", "Jackson, MS", "DRV-006", "CAR-118", "06/08/2026", "Renewal evidence watch"]
  ];

  var driverDocs = [
    ["CDL / license image", "Front and back CDL image with complete credential details.", "Safety desk", "CDL image, identity match, class, endorsements, and expiration are filed.", "Review expiration before dispatch."],
    ["Medical card", "Medical certificate status for dispatch eligibility.", "Safety desk", "Medical card is checked before release.", "Block assignment if expired."],
    ["MCSA exam summary", "Medical examiner certificate and exam summary status.", "Safety desk", "Exam summary supports the medical-card decision.", "Review during safety audit."],
    ["MVR review", "Motor vehicle record review for current assignment.", "Safety desk", "No unresolved violation blocker unless noted.", "Escalate any hold to owner."],
    ["FMCSA / Clearinghouse compliance", "FMCSA compliance and clearinghouse-style review state.", "Safety desk", "Compliance status supports dispatch eligibility.", "Do not release if a hold appears."],
    ["W-9 record", "Tax profile and payer setup record from the driver packet.", "Back office", "Tax readiness is tracked with a complete payer profile.", "Resolve missing setup before settlement."],
    ["I-9 record", "Employment eligibility status from the driver packet.", "Back office", "Employment eligibility record is filed.", "Keep with driver file."],
    ["Emergency contact", "Emergency contact and communication details.", "Back office", "Primary and secondary contacts are filed with names, phone numbers, and dispatch instructions.", "Keep current before dispatch."],
    ["Bank / settlement setup", "Settlement method status with settlement token and pay-cycle details.", "Back office", "Settlement detail is visible without exposing bank data.", "Confirm pay-cycle setup before settlement."],
    ["Insurance card", "Driver insurance card or insurance-related record from the driver packet.", "Back office", "Insurance card is attached when the driver packet includes it.", "Review during owner file check."],
    ["DQF compliance summary", "Driver qualification file compliance summary.", "Safety desk", "DQF status is visible to the fleet owner.", "Escalate missing or expired items."],
    ["Qualification file", "Qualification file status from the driver packet.", "Safety desk", "Qualification file is retained with the driver record.", "Use during safety review."],
    ["Employee handbook acknowledgement", "Employee handbook acknowledgement from the HR packet.", "Compliance desk", "Acknowledgement is filed.", "Refresh during annual packet."],
    ["Benefits enrollment", "Benefits enrollment record from the HR packet.", "Back office", "Enrollment tier, effective date, and payroll deduction status are filed.", "Review during HR file audit."],
    ["Life insurance beneficiary election", "Beneficiary election record from the HR packet.", "Back office", "Beneficiary election, relationship, allocation, and effective date are filed.", "Review beneficiary record during HR file audit."],
    ["Flexible spending account election", "FSA election record from the HR packet.", "Back office", "Election type, plan year, and per-pay deduction are filed.", "Review plan-year election during HR/payroll audit."],
    ["Garnishment withholding summary", "Payroll withholding summary when present in the driver packet.", "Back office", "Payroll withholding status, case reference, and release condition are visible when applicable.", "Keep owner-reviewed before settlement."],
    ["Driver application", "Driver application and hiring review status.", "Back office", "Application record is filed.", "Keep with driver file."],
    ["Resume / work history", "Resume, prior driving history, and equipment experience summary.", "Back office", "Work history is filed with named prior carriers, date ranges, and equipment notes.", "Use during owner file review."],
    ["Prior employer inquiry", "Prior employer safety and employment inquiry status.", "Compliance desk", "Good-faith inquiry and response state are visible.", "Keep inquiry notes with the DQF."],
    ["Road test / annual review", "Road test certificate and annual driver review status.", "Safety desk", "Road test and annual review support dispatch eligibility.", "Escalate expired or missing review."],
    ["Safety acknowledgements", "Safety manual, incident reporting, cargo care, and inspection acknowledgements.", "Compliance desk", "Acknowledgements are filed.", "Review after incident or policy change."],
    ["Dispatch eligibility / assignment", "Final eligibility state and active assignment context.", "Operations lead", "Eligibility explains ready/watch/hold.", "Use before committing release."]
  ];

  var drivers = {
    "drv-001": {
      id: "DRV-001",
      name: "John Carter",
      state: "Ready",
      priority: "High",
      homeBase: "Cleveland, OH",
      route: "Dallas, TX to Memphis, TN",
      load: "TMS-LD-10482",
      owner: "Safety desk",
      emergency: "Primary and secondary emergency contacts filed with current contact details.",
      docCount: "23 driver documents",
      hasGarnishment: false,
      summary: "Fleet driver record with complete DQF, HR, tax, emergency, settlement, and compliance documents.",
      exception: "No driver document blocks the primary release review.",
      photo: "/assets/images/profiles/drivers/driver-ref-001.jpg?v=5"
    },
    "drv-002": {
      id: "DRV-002",
      name: "Carlos Martinez",
      state: "Watch",
      priority: "Medium",
      homeBase: "Chicago, IL",
      route: "Tulsa, OK to Kansas City, MO",
      load: "BOF-1907",
      owner: "Safety desk",
      emergency: "Spouse and secondary family contact filed with current contact details.",
      docCount: "23 driver documents",
      hasGarnishment: true,
      summary: "Driver record with the extra payroll withholding summary present in the driver packet.",
      exception: "POD evidence controls the load watch state; driver file remains inspectable.",
      photo: "/assets/images/profiles/drivers/driver-ref-002.jpg?v=5"
    },
    "drv-003": {
      id: "DRV-003",
      name: "Mara Chen",
      state: "Hold",
      priority: "High",
      homeBase: "Atlanta, GA",
      route: "Little Rock, AR to St. Louis, MO",
      load: "BOF-1931",
      owner: "Safety desk",
      emergency: "Primary and secondary emergency contacts filed with current contact details.",
      docCount: "23 driver documents",
      hasGarnishment: false,
      summary: "Driver file used for the hold example so the medical-card gate and DQF packet remain visible.",
      exception: "Medical card must clear before dispatch assignment.",
      photo: "/assets/images/profiles/drivers/driver-ref-003.jpg?v=5"
    },
    "drv-004": {
      id: "DRV-004",
      name: "Daniel Kim",
      state: "Ready",
      priority: "Low",
      homeBase: "Chicago, IL",
      route: "Birmingham, AL to Nashville, TN",
      load: "BOF-2064",
      owner: "Safety desk",
      emergency: "Emergency contact record filed with current contact details.",
      docCount: "23 driver documents",
      hasGarnishment: false,
      summary: "Driver file is ready; the remaining queue item is normal equipment staging.",
      exception: "No safety document blocker.",
      photo: "/assets/images/profiles/drivers/driver-ref-004.jpg?v=5"
    },
    "drv-005": {
      id: "DRV-005",
      name: "Frank Miller",
      state: "Ready",
      priority: "Medium",
      homeBase: "San Francisco, CA",
      route: "Mobile, AL to Atlanta, GA",
      load: "BOF-2175",
      owner: "Safety desk",
      emergency: "Emergency contact record filed with current contact details.",
      docCount: "23 driver documents",
      hasGarnishment: true,
      summary: "Driver record with payroll withholding summary represented alongside the DQF and HR packet.",
      exception: "Rate record controls release review; driver eligibility does not block.",
      photo: "/assets/images/profiles/drivers/driver-ref-005.jpg?v=5"
    },
    "drv-006": {
      id: "DRV-006",
      name: "Priya Patel",
      state: "Watch",
      priority: "Medium",
      homeBase: "Los Angeles, CA",
      route: "Shreveport, LA to Jackson, MS",
      load: "BOF-2258",
      owner: "Safety desk",
      emergency: "Emergency contact record filed with current contact details.",
      docCount: "23 driver documents",
      hasGarnishment: false,
      summary: "Driver file is usable for planning while renewal evidence remains visible before final assignment.",
      exception: "Renewal evidence controls assignment commitment.",
      photo: "/assets/images/profiles/drivers/driver-ref-006.jpg?v=5"
    },
    "drv-007": {
      id: "DRV-007",
      name: "Marcus Reed",
      state: "Ready",
      priority: "Medium",
      homeBase: "Miami Beach, FL",
      route: "Atlanta, GA to Charlotte, NC",
      load: "BOF-2310",
      owner: "Safety desk",
      emergency: "Emergency contact record filed with current contact details.",
      docCount: "23 driver documents",
      hasGarnishment: true,
      summary: "Driver record with complete DQF, HR, settlement, emergency contact, and payroll withholding surfaces.",
      exception: "No active driver blocker; settlement documents are ready for owner review.",
      photo: "/assets/images/profiles/drivers/driver-ref-010.jpg?v=5"
    },
    "drv-008": {
      id: "DRV-008",
      name: "Liam Smith",
      state: "Ready",
      priority: "Low",
      homeBase: "Boston, MA",
      route: "Columbus, OH to Indianapolis, IN",
      load: "BOF-2388",
      owner: "Safety desk",
      emergency: "Emergency contact record filed with current contact details.",
      docCount: "23 driver documents",
      hasGarnishment: false,
      summary: "Driver file is complete for planning and owner inspection.",
      exception: "No active document blocker.",
      photo: "/assets/images/profiles/drivers/driver-ref-008.jpg?v=5"
    },
    "drv-009": {
      id: "DRV-009",
      name: "Emma Brown",
      state: "Watch",
      priority: "Medium",
      homeBase: "Philadelphia, PA",
      route: "Cleveland, OH to Pittsburgh, PA",
      load: "BOF-2404",
      owner: "Safety desk",
      emergency: "Emergency contact record filed with current contact details.",
      docCount: "23 driver documents",
      hasGarnishment: true,
      summary: "Driver record with extra payroll withholding documentation and a watch-state review path.",
      exception: "Review payroll and HR packet visibility before final owner presentation.",
      photo: "/assets/images/profiles/drivers/driver-ref-009.jpg?v=5"
    },
    "drv-010": {
      id: "DRV-010",
      name: "Noah Wilson",
      state: "Ready",
      priority: "Low",
      homeBase: "Seattle, WA",
      route: "Nashville, TN to Louisville, KY",
      load: "BOF-2442",
      owner: "Safety desk",
      emergency: "Emergency contact record filed with current contact details.",
      docCount: "23 driver documents",
      hasGarnishment: false,
      summary: "Driver file is complete with DQF, HR, emergency, bank, and compliance categories represented.",
      exception: "No active document blocker.",
      photo: "/assets/images/profiles/drivers/driver-ref-007.jpg?v=5"
    },
    "drv-011": {
      id: "DRV-011",
      name: "Olivia Lee",
      state: "Watch",
      priority: "Medium",
      homeBase: "Dallas, TX",
      route: "Dallas, TX to Oklahoma City, OK",
      load: "BOF-2491",
      owner: "Safety desk",
      emergency: "Emergency contact record filed with current contact details.",
      docCount: "23 driver documents",
      hasGarnishment: true,
      summary: "Driver record with payroll withholding summary included and complete owner-review fields.",
      exception: "Payroll withholding summary is ready for buyer inspection.",
      photo: "/assets/images/profiles/drivers/driver-ref-011.jpg?v=5"
    },
    "drv-012": {
      id: "DRV-012",
      name: "Amir Khan",
      state: "Ready",
      priority: "Low",
      homeBase: "Phoenix, AZ",
      route: "Memphis, TN to Birmingham, AL",
      load: "BOF-2515",
      owner: "Safety desk",
      emergency: "Emergency contact record filed with current contact details.",
      docCount: "23 driver documents",
      hasGarnishment: false,
      summary: "Driver file is complete and available for owner inspection.",
      exception: "No active document blocker.",
      photo: "/assets/images/profiles/drivers/driver-ref-012.jpg?v=5"
    }
  };

  var proofArtifacts = [
    ["core", "Core trip documents", "TMS import record", "Ready", "Partner import", "TMS-LD-10482.json", "Required", "No hold", "No claim effect", "Operations lead", "Shows the imported load number, customer, carrier assignment, route, and BOF release file."],
    ["core", "Core trip documents", "Pickup instructions", "Ready", "Customer packet", "pickup-instructions-10482.html", "Required", "No hold", "No claim effect", "Dispatch desk", "Appointment window, pickup location, contact, lane notes, and driver instructions are attached."],
    ["core", "Core trip documents", "Rate confirmation", "Ready", "Document desk", "RC-10482.html", "Required", "No hold", "No claim effect", "Document desk", "Lane, dates, carrier, rate items, accessorial review, and packet match are ready."],
    ["core", "Core trip documents", "BOL image review", "Review", "Upload queue", "BOL-10482-IMG-02.html", "Required", "Release waits", "Supports dispute response", "S. Turner", "BOL image is present but still controls the BOF readiness decision until owner confirmation."],
    ["proof", "Proof and media", "Seal photo", "Ready", "Driver mobile capture", "seal-photo-10482.webp", "Required", "No hold", "Supports seal dispute", "Document desk", "Seal evidence is attached to the load packet before release."],
    ["proof", "Proof and media", "Delivery proof state", "Pending", "Post-trip packet", "POD-pending-10482.html", "Required after delivery", "Settlement watch after delivery", "Required if claim opens", "Dispatch desk", "POD, timestamp, receiver, GPS, dock photo, and empty cargo proof are tracked after delivery."],
    ["proof", "Proof and media", "Dock photo", "Pending", "Post-trip media", "dock-photo-pending-10482.webp", "Required after delivery", "Settlement watch after delivery", "Claim support", "Dispatch desk", "Dock photo is expected with the post-trip delivery proof packet."],
    ["proof", "Proof and media", "Empty cargo photo", "Pending", "Post-trip media", "empty-cargo-pending-10482.webp", "Required after delivery", "Settlement watch after delivery", "Claim support", "Dispatch desk", "Empty cargo/bin image supports clean delivery, settlement, and claim review."],
    ["exceptions", "Exceptions and claims", "Claim evidence folder", "Not applicable", "Exception desk", "claim-folder-10482.html", "Not required", "No hold", "Opens only if delivery exception appears", "Exception desk", "Claim evidence folder stays registered so photos and dispute notes have a home if an exception opens."],
    ["exceptions", "Exceptions and claims", "Corrected BOL request", "Ready on hold path", "Document desk", "corrected-bol-request-10482.html", "Conditional", "Release hold if BOL rejected", "Supports correction trail", "S. Turner", "If the BOL is rejected, this record explains the corrected capture request and owner."],
    ["reference", "Readiness documents", "Driver file link", "Ready", "Safety desk", "DRV-001-file.html", "Required", "No driver hold", "No claim effect", "Safety desk", "Driver DQF is ready and links to the full driver document page."],
    ["reference", "Readiness documents", "Carrier packet", "Ready", "Carrier operations", "CAR-118-packet.html", "Required", "No carrier hold", "No claim effect", "Carrier operations", "Authority, insurance, agreement, W-9, and operations contact are ready."],
    ["reference", "Readiness documents", "Release decision note", "Review", "BOF release desk", "REL-10482-DECISION.html", "Required", "Controls handoff", "Audit support", "S. Turner", "Ready, conditional, or hold decision records owner, consequence, next action, and simulated handoff."]
  ];

  var carrierRecords = {
    "car-118": {
      id: "CAR-118",
      name: "RoadPro Desk",
      state: "Ready",
      owner: "Carrier operations",
      lane: "Dallas, TX to Memphis, TN",
      load: "TMS-LD-10482",
      summary: "Carrier packet is ready for the primary release review. This packet proves carrier readiness without treating outside carrier drivers as fleet employee files.",
      next: "Keep authority, insurance, agreement, W-9, and operations contact attached to the release packet."
    },
    "car-204": {
      id: "CAR-204",
      name: "Crossline Operations",
      state: "Watch",
      owner: "Carrier operations",
      lane: "Tulsa, OK to Kansas City, MO / Mobile, AL to Atlanta, GA",
      load: "BOF-1907 / BOF-2175",
      summary: "Carrier packet can support planning, but renewal and rate-review evidence stay on watch before final commitment.",
      next: "Confirm renewal evidence and rate confirmation match before release."
    },
    "car-088": {
      id: "CAR-088",
      name: "North River Dispatch",
      state: "Ready",
      owner: "Carrier operations",
      lane: "Little Rock, AR to St. Louis, MO",
      load: "BOF-1931",
      summary: "Carrier packet is not the blocker. The lane remains held because the assigned driver credential record controls release.",
      next: "Keep carrier packet ready while safety desk clears the driver hold."
    }
  };

  var carrierDocs = [
    ["Operating authority", "Authority and registration readiness for the carrier packet.", "Carrier operations", "Authority record includes registration, docket, and renewal values.", "No carrier hold if authority remains current."],
    ["Insurance certificate", "Liability and cargo coverage certificate state.", "Carrier operations", "Certificate holder, coverage type, and dates reviewed.", "Escalate renewal if certificate falls out of date."],
    ["Broker-carrier agreement", "Signed agreement and release obligations.", "Carrier operations", "Agreement signature and operating obligations are attached.", "Keep attached before release handoff."],
    ["W-9 / payment setup", "Carrier tax and payment setup status.", "Back office", "Payment setup includes payer profile and settlement token.", "Resolve before settlement if missing."],
    ["Operations contact", "Dispatch, after-hours, and exception contact sheet.", "Dispatch desk", "Carrier operations contact is attached to the release packet.", "Use for exception escalation."],
    ["Lane confirmation", "Lane-specific rate, pickup, delivery, and equipment confirmation.", "Document desk", "Lane confirmation matches the release review.", "Confirm rate and equipment before release."],
    ["Exception escalation note", "Who owns correction if BOL, POD, or delivery proof is rejected.", "Exception desk", "Escalation owner and response path are visible.", "Open claim/exception folder only if needed."]
  ];

  var driverSyntheticProfiles = {
    "DRV-001": ["Parma, OH home-terminal region", "BOF driver channel ext. 2143", "john.carter@deltaadvancedtrucking.example", "OH-CDL-7816-2043", "03/14/1978", "11/30/2027", "Maya Carter", "Spouse", "BOF emergency ext. 3424", "Derek Carter", "Brother", "BOF emergency ext. 1187", "North Coast Freight", "03/2018-04/2024", "Regional dry van / auto parts", "Riverview Logistics", "Elaine Porter"],
    "DRV-002": ["Cicero, IL home-terminal region", "BOF driver channel ext. 6386", "carlos.martinez@deltaadvancedtrucking.example", "IL-CDL-6042-5102", "08/22/1981", "10/31/2027", "Rosa Martinez", "Spouse", "BOF emergency ext. 2208", "Elena Martinez", "Mother", "BOF emergency ext. 0198", "Prairie Line Carriers", "05/2017-05/2024", "Regional dry van / grocery", "Lakeside Transport", "Martin Hale"],
    "DRV-003": ["Morrow, GA home-terminal region", "BOF driver channel ext. 8293", "mara.chen@deltaadvancedtrucking.example", "GA-CDL-3920-1103", "01/09/1986", "Review required", "Noah Chen", "Spouse", "BOF emergency ext. 6741", "Evan Chen", "Brother", "BOF emergency ext. 5529", "Piedmont Freight Group", "06/2019-02/2024", "Regional dry van / packaging", "Red River Cartage", "Dana Morris"],
    "DRV-004": ["Chicago, IL home-terminal region", "BOF driver channel ext. 6387", "daniel.kim@deltaadvancedtrucking.example", "IL-CDL-8824-4104", "04/18/1990", "09/30/2027", "Evan Kim", "Brother", "BOF emergency ext. 0915", "Grace Kim", "Sister", "BOF emergency ext. 3370", "Midwest Bridge Logistics", "07/2018-06/2024", "Regional dry van / appliances", "Bluegrass Transfer", "Renee Walsh"],
    "DRV-005": ["Oakland, CA home-terminal region", "BOF driver channel ext. 9283", "frank.miller@deltaadvancedtrucking.example", "CA-CDL-5448-3305", "02/27/1974", "12/31/2027", "Helen Miller", "Mother", "BOF emergency ext. 7201", "Sam Miller", "Brother", "BOF emergency ext. 7602", "Harbor West Transport", "01/2016-05/2024", "Dry van / port dray support", "Gulf South Freight", "Alisha Grant"],
    "DRV-006": ["Downey, CA home-terminal region", "BOF driver channel ext. 4718", "priya.patel@deltaadvancedtrucking.example", "CA-CDL-9162-7706", "11/05/1988", "Renewal evidence due", "Meena Patel", "Mother", "BOF emergency ext. 1004", "Ravi Patel", "Brother", "BOF emergency ext. 3818", "Pacific Lane Services", "09/2018-03/2024", "Dry van / consumer goods", "Delta Ridge Freight", "Carmen Soto"],
    "DRV-007": ["Doral, FL home-terminal region", "BOF driver channel ext. 2147", "marcus.reed@deltaadvancedtrucking.example", "FL-CDL-4318-6607", "06/30/1979", "08/31/2027", "Tanya Reed", "Sister", "BOF emergency ext. 8874", "Jerome Reed", "Brother", "BOF emergency ext. 4172", "Sun Coast Haulage", "02/2017-06/2024", "Regional dry van / retail", "Carolinas Cartage", "Sean Doyle"],
    "DRV-008": ["Quincy, MA home-terminal region", "BOF driver channel ext. 6908", "liam.smith@deltaadvancedtrucking.example", "MA-CDL-7715-2208", "12/12/1982", "07/31/2027", "Erin Smith", "Sister", "BOF emergency ext. 4408", "Patrick Smith", "Brother", "BOF emergency ext. 0194", "Bay State Freight", "08/2015-05/2024", "Dry van / light manufacturing", "Hoosier Lane Logistics", "Nora Bell"],
    "DRV-009": ["Chester, PA home-terminal region", "BOF driver channel ext. 2769", "emma.brown@deltaadvancedtrucking.example", "PA-CDL-6721-9909", "09/16/1985", "06/30/2027", "Andre Brown", "Brother", "BOF emergency ext. 1802", "Monica Brown", "Sister", "BOF emergency ext. 4309", "Keystone Freight Line", "04/2019-04/2024", "Regional dry van / steel packaging", "Ohio Valley Transport", "Victor Lane"],
    "DRV-010": ["Tacoma, WA home-terminal region", "BOF driver channel ext. 9010", "noah.wilson@deltaadvancedtrucking.example", "WA-CDL-3155-4810", "05/03/1980", "05/31/2027", "Claire Wilson", "Sister", "BOF emergency ext. 6102", "Robert Wilson", "Father", "BOF emergency ext. 8471", "Cascade Freight Partners", "10/2016-05/2024", "Regional dry van / furniture", "Riverbend Transit", "Marisol Vega"],
    "DRV-011": ["Irving, TX home-terminal region", "BOF driver channel ext. 4111", "olivia.lee@deltaadvancedtrucking.example", "TX-CDL-8490-3511", "07/21/1987", "04/30/2027", "Grace Lee", "Sister", "BOF emergency ext. 7731", "Henry Lee", "Brother", "BOF emergency ext. 1820", "Lone Star Freight", "03/2020-05/2024", "Dry van / regional parcel", "Red Dirt Carriers", "Ellen Price"],
    "DRV-012": ["Tempe, AZ home-terminal region", "BOF driver channel ext. 2512", "amir.khan@deltaadvancedtrucking.example", "AZ-CDL-2094-6812", "10/10/1984", "03/31/2028", "Sara Khan", "Spouse", "BOF emergency ext. 1182", "Imran Khan", "Brother", "BOF emergency ext. 9106", "Desert Route Logistics", "11/2017-06/2024", "Regional dry van / food-grade packaging", "Mid-South Transfer", "Felicia King"]
  };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function currentPath() {
    return window.location.pathname.replace(/\/index\.html$/, "/");
  }

  var canonicalOperations = null;

  function loadCanonicalOperations() {
    if (!window.fetch) return Promise.resolve(null);
    return fetch("/assets/data/bof-public-operations.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Canonical operations unavailable");
        return response.json();
      })
      .then(function (data) {
        canonicalOperations = data;
        return data;
      })
      .catch(function () {
        canonicalOperations = null;
        return null;
      });
  }

  function canonicalById(listName, id) {
    if (!canonicalOperations || !id) return null;
    return (canonicalOperations[listName] || []).find(function (item) {
      return item.id === id;
    }) || null;
  }

  function canonicalDriverById(id) {
    return canonicalById("drivers", id);
  }

  function canonicalLoadById(id) {
    return canonicalById("loads", id);
  }

  function canonicalUnitById(id) {
    return canonicalById("units", id);
  }

  function canonicalExceptionById(id) {
    return canonicalById("exceptions", id);
  }

  function canonicalDriverAsset(driverId) {
    if (!canonicalOperations || !canonicalOperations.assetMappings || !canonicalOperations.assetMappings.drivers) return null;
    return canonicalOperations.assetMappings.drivers[driverId] || null;
  }

  function enrichDriver(driver) {
    var canonical = canonicalDriverById(driver.id);
    if (!canonical) return driver;
    var asset = canonicalDriverAsset(canonical.id);
    var load = canonical.activeLoadId ? canonicalLoadById(canonical.activeLoadId) : null;
    var unit = canonical.unitId ? canonicalUnitById(canonical.unitId) : null;
    var exception = canonical.activeExceptionId ? canonicalExceptionById(canonical.activeExceptionId) : null;
    var enriched = {};
    Object.keys(driver).forEach(function (key) {
      enriched[key] = driver[key];
    });
    enriched.name = canonical.name || driver.name;
    enriched.photo = (asset && asset.portrait) || canonical.portrait || driver.photo;
    enriched.employmentType = canonical.employmentType || "Fleet driver";
    enriched.assignmentState = canonical.assignmentState || (load ? "Assigned" : "Available");
    enriched.readinessStatus = canonical.readinessStatus || driver.state;
    enriched.state = canonical.readinessStatus || driver.state;
    enriched.activeLoadId = canonical.activeLoadId || "";
    enriched.load = canonical.activeLoadId || "No active load";
    enriched.route = load ? (load.origin + " to " + load.destination) : "Available for assignment";
    enriched.unitLabel = unit ? unit.label : "Available";
    enriched.exception = exception ? exception.requiredAction : (canonical.primaryWarning || driver.exception);
    enriched.summary = canonical.primaryWarning || driver.summary;
    enriched.canonicalDriver = canonical;
    enriched.canonicalLoad = load;
    enriched.canonicalUnit = unit;
    enriched.canonicalException = exception;
    return enriched;
  }

  function navHtml() {
    var path = currentPath();
    return navItems.map(function (item) {
      var active = path === item[1] ||
        (item[1] === "/interactive-demo/drivers/" && path.indexOf(item[1]) === 0 && path.indexOf("/interactive-demo/drivers/document-intake/") !== 0) ||
        (item[1] !== "/interactive-demo/" && item[1] !== "/interactive-demo/drivers/" && path.indexOf(item[1]) === 0);
      return '<a class="' + (active ? "is-active" : "") + '" href="' + item[1] + '"' + (active ? ' aria-current="page"' : "") + '><svg><use href="#' + esc(item[2]) + '"></use></svg><span>' + esc(item[0]) + "</span>" + (item[0] === "Alerts" ? "<b>4</b>" : "") + "</a>";
    }).join("");
  }

  function appIconSprite() {
    return [
      '<svg class="app-icon-sprite" aria-hidden="true" focusable="false" width="0" height="0">',
      '  <symbol id="app-icon-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>',
      '  <symbol id="app-icon-home" viewBox="0 0 24 24"><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></symbol>',
      '  <symbol id="app-icon-list" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></symbol>',
      '  <symbol id="app-icon-calendar" viewBox="0 0 24 24"><path d="M7 3v4M17 3v4M4 9h18M5 5h17v17H5z"/></symbol>',
      '  <symbol id="app-icon-user" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/></symbol>',
      '  <symbol id="app-icon-truck" viewBox="0 0 24 24"><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></symbol>',
      '  <symbol id="app-icon-doc" viewBox="0 0 24 24"><path d="M6 3h9l4 4v18H6zM14 3v6h5M9 13h6M9 17h6"/></symbol>',
      '  <symbol id="app-icon-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/></symbol>',
      '  <symbol id="app-icon-report" viewBox="0 0 24 24"><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5"/></symbol>',
      '  <symbol id="app-icon-bell" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></symbol>',
      '  <symbol id="app-icon-settings" viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21h-3v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2-2 .1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-3h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-2 .1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h3v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1H21v3h-.1a1.7 1.7 0 0 0-1.5 1z"/></symbol>',
      '  <symbol id="app-icon-chevron-left" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></symbol>',
      '</svg>'
    ].join("");
  }

  function driverSlugFromPath() {
    if (currentPath() === "/interactive-demo/drivers/document-intake/") return "";
    var match = currentPath().match(/\/interactive-demo\/drivers\/([^/]+)\//);
    return match ? match[1].toLowerCase() : "";
  }

  function currentDriverDocIndex() {
    var params = new URLSearchParams(window.location.search || "");
    var index = Number(params.get("doc") || "0");
    return Number.isFinite(index) && index >= 0 && index < driverDocs.length ? index : 0;
  }

  function statusClass(state) {
    var value = String(state || "").toLowerCase();
    if (value.indexOf("block") >= 0 || value.indexOf("hold") >= 0 || value.indexOf("held") >= 0) return "blocked";
    if (value.indexOf("ready") >= 0 || value.indexOf("complete") >= 0 || value.indexOf("available") >= 0) return "ready";
    return "watch";
  }

  function documentStatus(driver, index) {
    if (index === 1 && driver.id === "DRV-003") return "Expired";
    if (index === 3 && driver.id === "DRV-003") return "Failed Review";
    if (index === 4 && driver.id === "DRV-003") return "Hold";
    if (index === 19 && driver.id === "DRV-002") return "Reminder Sent";
    if (index === 20 && driver.id === "DRV-006") return "Due in 14 days";
    if (index === 16 && !driver.hasGarnishment) return "Not applicable";
    if (index === 16 && driver.hasGarnishment) return "Filed";
    if (index === 17 && driver.id === "DRV-003") return "Revised";
    if (index === 22 && (driver.state === "Watch" || driver.state === "Hold" || driver.state === "At Risk" || driver.state === "Review" || driver.state === "Blocked")) return driver.state;
    if (index > 12 && index < 17) return "Filed";
    if ((driver.state === "Hold" || driver.state === "Blocked") && index < 5) return "Needs review";
    return "Filed";
  }

  function documentStatusClass(status) {
    var value = String(status || "").toLowerCase();
    if (value.indexOf("hold") >= 0 || value.indexOf("failed") >= 0 || value.indexOf("missing") >= 0 || value.indexOf("expired") >= 0 || value.indexOf("rejected") >= 0 || value.indexOf("needs") >= 0 || value === "open") return "blocked";
    if (value.indexOf("watch") >= 0 || value.indexOf("review") >= 0 || value.indexOf("requested") >= 0 || value.indexOf("reminder") >= 0 || value.indexOf("due") >= 0 || value.indexOf("revised") >= 0 || value.indexOf("in review") >= 0 || value.indexOf("expiring") >= 0 || value.indexOf("standby") >= 0 || value.indexOf("generated") >= 0) return "watch";
    if (value.indexOf("not applicable") >= 0 || value.indexOf("not required") >= 0 || value.indexOf("none open") >= 0) return "review";
    return "ready";
  }

  function driverDocumentKind(index) {
    return [
      "license-id",
      "medical-card",
      "mcsa-exam",
      "mvr-report",
      "fmcsa-clearinghouse",
      "tax-w9",
      "i9-employment",
      "emergency-contact",
      "settlement-ach",
      "insurance-card",
      "dqf-summary",
      "qualification-file",
      "handbook-ack",
      "benefits-enrollment",
      "beneficiary-election",
      "fsa-election",
      "withholding-summary",
      "driver-application",
      "work-history",
      "prior-employer",
      "road-test",
      "safety-ack",
      "dispatch-eligibility"
    ][index] || "driver-document";
  }

  function driverSyntheticProfile(driver) {
    var row = driverSyntheticProfiles[driver.id] || driverSyntheticProfiles["DRV-001"];
    var licenseState = (driver.homeBase || "OH").split(",").pop().trim() || "OH";
    return {
      address: row[0],
      phone: row[1],
      email: row[2],
      licenseNo: row[3],
      dob: row[4],
      licenseExpiration: row[5],
      primaryContact: row[6],
      primaryRelationship: row[7],
      primaryPhone: row[8],
      secondaryContact: row[9],
      secondaryRelationship: row[10],
      secondaryPhone: row[11],
      priorCarrier: row[12],
      priorDates: row[13],
      equipmentExperience: row[14],
      previousCarrier: row[15],
      reviewerName: row[16],
      taxProfile: "W9-" + driver.id.replace("DRV-", "D") + "-2026",
      i9Case: "I9-" + licenseState + "-" + driver.id.replace("DRV-", "") + "-A",
      achToken: "ACH-" + licenseState + "-" + driver.id.replace("DRV-", "") + "-772",
      benefitPlan: driver.id === "DRV-006" || driver.id === "DRV-009" ? "Family medical / dental tier" : "Employee medical / dental tier",
      beneficiary: row[6] + " / " + row[7] + " / 100%",
      fsaElection: driver.id === "DRV-002" || driver.id === "DRV-011" ? "$1,200 health FSA / $50 per pay" : "$0 health FSA election / declined for 2026",
      garnishmentCase: driver.hasGarnishment ? "PAY-WH-" + driver.id.replace("DRV-", "") + "-2026 / " + row[10] + " court notice" : "No active withholding order",
      medicalExaminer: "Dr. " + row[16] + " / NRCME-" + licenseState + "-" + driver.id.replace("DRV-", "") + "84",
      mvrPull: "MVR-" + licenseState + "-" + driver.id.replace("DRV-", "") + "-060526",
      insuranceCard: "INS-" + driver.id.replace("DRV-", "") + "-NL-2026",
      roadTest: "RT-" + driver.id.replace("DRV-", "") + "-052926",
      handbookVersion: "BOF Safety Handbook 2026.2",
      clearinghouseRef: "CH-" + licenseState + "-" + driver.id.replace("DRV-", "") + "-READY",
      licenseState: licenseState
    };
  }

  function driverRosterDetails(driver) {
    var profile = driverSyntheticProfile(driver);
    return {
      mailingRecord: profile.address,
      phoneRecord: profile.phone,
      emailRecord: profile.email,
      emergencyRelationship: profile.primaryContact + " / " + profile.primaryRelationship + " / " + profile.primaryPhone,
      primaryEmergencyRelationship: profile.primaryContact + " / " + profile.primaryRelationship,
      primaryEmergencyPhone: profile.primaryPhone,
      secondaryEmergencyRelationship: profile.secondaryContact + " / " + profile.secondaryRelationship,
      secondaryEmergencyPhone: profile.secondaryPhone,
      cdlReference: profile.licenseNo,
      privacyNote: "This buyer review shows complete operating fields while keeping protected personnel and financial details private."
    };
  }

  function driverRosterInfoHtml(driver) {
    var info = driverRosterDetails(driver);
    return [
      '<section class="route-table-wrap driver-roster-info">',
      '  <table class="route-table"><thead><tr><th>Roster field</th><th>Record state</th><th>Buyer view</th></tr></thead><tbody>',
      '    <tr><td>Mailing address</td><td>' + esc(info.mailingRecord) + '</td><td>Complete mailing address</td></tr>',
      '    <tr><td>Phone</td><td>' + esc(info.phoneRecord) + '</td><td>Dispatch contact</td></tr>',
      '    <tr><td>Email</td><td>' + esc(info.emailRecord) + '</td><td>Fleet inbox</td></tr>',
      '    <tr><td>Emergency contact</td><td>' + esc(info.emergencyRelationship) + '</td><td>Primary contact</td></tr>',
      '    <tr><td>Primary emergency</td><td>' + esc(info.primaryEmergencyRelationship) + '</td><td>' + esc(info.primaryEmergencyPhone) + '</td></tr>',
      '    <tr><td>Secondary emergency</td><td>' + esc(info.secondaryEmergencyRelationship) + '</td><td>' + esc(info.secondaryEmergencyPhone) + '</td></tr>',
      '    <tr><td>CDL file reference</td><td>' + esc(info.cdlReference) + '</td><td>Credential file</td></tr>',
      '  </tbody></table>',
      '  <p>' + esc(info.privacyNote) + '</p>',
      '</section>'
    ].join("");
  }

  function dqfScore(driver) {
    if (driver.state === "Hold" || driver.state === "Blocked") return 68;
    if (driver.id === "DRV-002") return 88;
    if (driver.id === "DRV-006" || driver.id === "DRV-009" || driver.id === "DRV-011") return 91;
    if (driver.state === "Watch" || driver.state === "At Risk" || driver.state === "Review") return 91;
    return 98;
  }

  function dqfCategoryRows(driver) {
    var annualReview = driver.id === "DRV-006" ? "Due in 14 days" : (driver.state === "Watch" || driver.state === "At Risk" || driver.state === "Review") ? "Watch" : "Complete";
    var priorEmployer = driver.id === "DRV-002" ? "Reminder Sent" : driver.id === "DRV-003" ? "In Review" : "Complete";
    var medical = driver.id === "DRV-003" ? "Expired" : "Complete";
    var mvr = driver.id === "DRV-003" ? "Failed Review" : "Complete";
    var clearinghouse = driver.id === "DRV-003" ? "Hold" : "Complete";
    return [
      ["Employment Application", "Complete", "Signed application, roster contact, work history, and hiring review filed."],
      ["CDL", "Complete", "License image, class, endorsements, expiration, and roster identity match visible."],
      ["Medical Examiner Certificate", medical, driver.id === "DRV-003" ? "Corrected medical card request controls dispatch assignment." : "Certificate reviewed and renewal reminder retained."],
      ["Road Test Certificate", "Complete", "Road test certificate and evaluator note retained in qualification file."],
      ["Annual Review of Driving Record", annualReview, annualReview === "Due in 14 days" ? "Annual review signature request is open before final assignment commitment." : "Annual review timing is visible in safety desk records."],
      ["MVR", mvr, mvr === "Failed Review" ? "MVR review failed; safety manager corrective review is required before dispatch." : "Annual MVR pull is attached with owner review note."],
      ["Safety Performance History", priorEmployer, priorEmployer === "Reminder Sent" ? "Prior employer verification reminder has been sent and is tracked." : "Prior employer inquiry and safety-performance history are retained."],
      ["Drug and Alcohol Clearinghouse Consent", clearinghouse, clearinghouse === "Hold" ? "Clearinghouse consent review remains attached to the hold path." : "Consent and annual query record are filed."],
      ["Drug Test Results", clearinghouse === "Hold" ? "In Review" : "Complete", "Result record is tied to dispatch eligibility and safety audit trail."],
      ["Driver Agreement", "Complete", "Driver agreement and handbook acknowledgement retained."],
      ["Driver Handbook Acknowledgement", "Complete", "Signed handbook receipt and policy version visible."],
      ["ELD Acknowledgement", "Complete", "ELD/mobile workflow acknowledgement retained for dispatch use."],
      ["Accident Register", driver.id === "DRV-003" ? "In Review" : "Complete", "Accident-register review is visible whether clean or escalated."],
      ["Training Records", "Complete", "Training completion certificate and safety modules retained."],
      ["Corrective Actions", driver.id === "DRV-003" ? "Open" : "None open", driver.id === "DRV-003" ? "Corrective action is required before assignment release." : "No active corrective action for this driver."],
      ["Disciplinary Notices", driver.id === "DRV-003" ? "Open" : "None open", driver.id === "DRV-003" ? "Notice generated with safety counseling follow-up." : "No active disciplinary notice."]
    ];
  }

  function documentRequestRows(driver) {
    if (driver.id === "DRV-003") {
      return [
        ["Updated Medical Card", "Requested", "Safety desk", driver.name, "06/07/2026", "Blocks dispatch until corrected card image is approved."],
        ["MVR Corrective Review", "In Review", "Safety manager", "S. Turner", "06/07/2026", "Failed MVR review stays attached to hold record."],
        ["Signed Driver Warning Notice", "Received", "Compliance desk", driver.name, "06/06/2026", "Reviewer must approve before hold clears."]
      ];
    }
    if (driver.id === "DRV-006") {
      return [
        ["Annual Review Signature", "Reminder Sent", "Safety desk", driver.name, "06/08/2026", "Watch item must clear before assignment commitment."],
        ["License Renewal Evidence", "Requested", "Safety desk", driver.name, "06/08/2026", "Renewal evidence controls planning state."]
      ];
    }
    if (driver.id === "DRV-002") {
      return [
        ["Prior Employer Verification", "Reminder Sent", "Compliance desk", "Blue River Freight", "06/10/2026", "Watch state remains visible until response is received."],
        ["Post-trip POD Follow-up", "Received", "Dispatch desk", driver.name, "06/07/2026", "Document packet is in review for settlement watch."]
      ];
    }
    return [
      ["Signed Driver Handbook Receipt", "Approved", "Compliance desk", driver.name, "06/01/2026", "Receipt retained with current policy version."],
      ["Training Completion Certificate", "Approved", "Safety desk", driver.name, "06/02/2026", "No dispatch blocker."]
    ];
  }

  function employerGeneratedForms(driver) {
    var hold = driver.state === "Hold";
    var watch = driver.state === "Watch";
    return [
      ["Annual MVR Review", watch ? "Generated" : hold ? "In Review" : "Approved", "Safety desk", "AMVR-" + driver.id.replace("DRV-", "") + "-2026", watch ? "Owner signature or review timing remains visible." : hold ? "Safety manager review required before dispatch." : "Filed with DQF."],
      ["Driver Warning Notice", hold ? "Generated" : "Not required", "Compliance desk", "DWN-" + driver.id.replace("DRV-", "") + "-2026", hold ? "Notice generated for credential/MVR hold path." : "No warning notice needed for this record."],
      ["Safety Counseling Form", hold ? "Generated" : watch ? "Standby" : "Not required", "Safety desk", "SCF-" + driver.id.replace("DRV-", "") + "-2026", hold ? "Counseling form is attached to corrective action." : "Generated only if watch/hold escalates."],
      ["Accident Review Form", "Not required", "Safety desk", "ARF-" + driver.id.replace("DRV-", "") + "-2026", "No active accident review for this driver file."],
      ["Return-to-Work Form", hold ? "Standby" : "Not required", "Back office", "RTW-" + driver.id.replace("DRV-", "") + "-2026", "Available if safety desk changes driver eligibility."],
      ["Training Completion Certificate", "Approved", "Safety desk", "TRAIN-" + driver.id.replace("DRV-", "") + "-2026", "Training record supports dispatch eligibility."]
    ];
  }

  function dqfWorkflowHtml(driver) {
    var score = dqfScore(driver);
    var requests = documentRequestRows(driver);
    var openRequests = requests.filter(function (row) {
      var cls = documentStatusClass(row[1]);
      return cls === "watch" || cls === "blocked";
    }).length;
    var categories = dqfCategoryRows(driver).map(function (row) {
      return '<tr><td>' + esc(row[0]) + '</td><td><span class="mini-status ' + documentStatusClass(row[1]) + '">' + esc(row[1]) + '</span></td><td>' + esc(row[2]) + '</td></tr>';
    }).join("");
    var requestRows = requests.map(function (row) {
      return '<tr><td>' + esc(row[0]) + '</td><td><span class="mini-status ' + documentStatusClass(row[1]) + '">' + esc(row[1]) + '</span></td><td>' + esc(row[2]) + '</td><td>' + esc(row[3]) + '</td><td>' + esc(row[4]) + '</td><td>' + esc(row[5]) + '</td></tr>';
    }).join("");
    var formRows = employerGeneratedForms(driver).map(function (row) {
      return '<tr><td>' + esc(row[0]) + '</td><td><span class="mini-status ' + documentStatusClass(row[1]) + '">' + esc(row[1]) + '</span></td><td>' + esc(row[2]) + '</td><td>' + esc(row[3]) + '</td><td>' + esc(row[4]) + '</td></tr>';
    }).join("");
    return [
      '<section class="dqf-command-panel">',
      '  <div class="dqf-score-card"><span>DQF Readiness</span><strong>' + score + '%</strong><em>' + esc(driver.exception) + '</em></div>',
      '  <div class="dqf-score-card"><span>Open Requests</span><strong>' + openRequests + '</strong><em>Tracked by document owner, recipient, due date, and next action.</em></div>',
      '  <div class="dqf-score-card"><span>Generated Forms</span><strong>6</strong><em>BOF-created HR and safety documents, not just stored uploads.</em></div>',
      '  <div class="dqf-score-card"><span>Dispatch Effect</span><strong>' + esc(driver.state) + '</strong><em>' + esc(driver.load + " / " + driver.route) + '</em></div>',
      '</section>',
      '<section class="dqf-workflow-grid">',
      '  <article class="dqf-workflow-card dqf-folder-tree">',
      '    <header><span>Driver Qualification File</span><h2>DQF folder structure</h2><p>Folder depth is visible before a buyer opens individual documents.</p></header>',
      '    <div class="route-table-wrap"><table class="route-table"><thead><tr><th>Folder item</th><th>Status</th><th>Back-office note</th></tr></thead><tbody>' + categories + '</tbody></table></div>',
      '  </article>',
      '  <article class="dqf-workflow-card">',
      '    <header><span>Outstanding paperwork</span><h2>Document requests</h2><p>Requests show who is chasing paperwork, who owes it, when it is due, and what clears the state.</p></header>',
      '    <div class="route-table-wrap"><table class="route-table"><thead><tr><th>Request</th><th>Status</th><th>Owner</th><th>Recipient</th><th>Due</th><th>Next action</th></tr></thead><tbody>' + requestRows + '</tbody></table></div>',
      '  </article>',
      '  <article class="dqf-workflow-card">',
      '    <header><span>BOF-created paperwork</span><h2>Generated HR and safety forms</h2><p>BOF is shown creating annual reviews, warning/counseling forms, return-to-work forms, and training certificates.</p></header>',
      '    <div class="route-table-wrap"><table class="route-table"><thead><tr><th>Form</th><th>Status</th><th>Owner</th><th>File</th><th>Use</th></tr></thead><tbody>' + formRows + '</tbody></table></div>',
      '  </article>',
      '</section>'
    ].join("");
  }

  function driverDocumentPaperHtml(driver, doc, index, status) {
    var docId = driver.id + "-DOC-" + String(index + 1).padStart(2, "0");
    var profile = driverSyntheticProfile(driver);
    var kind = driverDocumentKind(index);
    var today = "06/06/2026";
    var reviewDate = index % 3 === 0 ? "06/05/2026" : index % 3 === 1 ? "06/04/2026" : "06/03/2026";
    var expiration = index === 0 ? profile.licenseExpiration : index === 1 ? (driver.id === "DRV-003" ? "Corrected card due 06/07/2026" : "12/31/2026") : index === 22 && driver.id === "DRV-006" ? "Renewal evidence due 06/08/2026" : "Current";
    var specific = driverDocumentSpecificHtml(driver, doc, index, status, expiration);
    return [
      '<article class="driver-document-paper document-kind-' + esc(kind) + '">',
      '  <header>',
      '    <div><span>Fleet operations record</span><strong>Driver Qualification / Personnel Packet</strong><em>Complete driver file opened for buyer review</em></div>',
      '    <div><span>Opened file</span><strong>' + esc(docId) + '</strong><em>' + esc(status) + '</em></div>',
      '  </header>',
      documentStampHtml(docId, status, reviewDate, expiration),
      '  <section class="document-paper-title"><span>' + esc(doc[0]) + '</span><h2>' + esc(driver.id + " - " + driver.name) + '</h2><p>' + esc(doc[1]) + '</p></section>',
      documentUsedMarksHtml(driver, doc, index, status, expiration),
      '  <dl class="document-paper-grid">',
      '    <div><dt>Driver</dt><dd>' + esc(driver.name) + '</dd></div>',
      '    <div><dt>Driver ID</dt><dd>' + esc(driver.id) + '</dd></div>',
      '    <div><dt>Home base</dt><dd>' + esc(driver.homeBase || "Fleet workspace") + '</dd></div>',
      '    <div><dt>CDL</dt><dd>' + esc(profile.licenseNo) + '</dd></div>',
      '    <div><dt>Load / route</dt><dd>' + esc(driver.load + " / " + driver.route) + '</dd></div>',
      '    <div><dt>Document owner</dt><dd>' + esc(doc[2]) + '</dd></div>',
      '    <div><dt>Driver packet</dt><dd>' + esc(driver.docCount || "Driver documents represented") + '</dd></div>',
      '    <div><dt>Review date</dt><dd>' + esc(reviewDate) + '</dd></div>',
      '    <div><dt>Assignment date</dt><dd>' + esc(today) + '</dd></div>',
      '    <div><dt>Status</dt><dd><span class="mini-status ' + documentStatusClass(status) + '">' + esc(status) + '</span></dd></div>',
      '    <div><dt>Expiration / renewal</dt><dd>' + esc(expiration) + '</dd></div>',
      '  </dl>',
      documentHistoryPanel(driver, doc, index, status, reviewDate),
      specific,
      documentReviewerPanel(doc, driver, index),
      documentAuditTrail(driver, doc, reviewDate, status),
      '  <footer><span>Reviewed by ' + esc(doc[2]) + '</span><strong>BOF readiness packet</strong><em>Source file, review decision, owner, and timestamp retained</em></footer>',
      '</article>'
    ].join("");
  }

  function documentStampHtml(docId, status, reviewDate, expiration) {
    return [
      '<section class="document-file-stamp">',
      '  <div><span>File no.</span><strong>' + esc(docId) + '</strong></div>',
      '  <div><span>Review status</span><strong>' + esc(status) + '</strong></div>',
      '  <div><span>Last reviewed</span><strong>' + esc(reviewDate) + '</strong></div>',
      '  <div><span>Expiration / renewal</span><strong>' + esc(expiration) + '</strong></div>',
      '</section>'
    ].join("");
  }

  function documentNextAction(driver, doc, index, status) {
    if (driver.id === "DRV-003" && index === 1) return "Upload corrected medical card image and route to safety desk approval before dispatch assignment.";
    if (driver.id === "DRV-003" && index === 3) return "Safety manager completes corrective MVR review and attaches driver warning notice before hold can clear.";
    if (driver.id === "DRV-003" && index === 4) return "Clear compliance hold and retain annual query note before assignment release.";
    if (driver.id === "DRV-002" && index === 19) return "Send second reminder to prior employer and keep watch state visible until response is received.";
    if (driver.id === "DRV-006" && index === 20) return "Collect annual review signature within 14 days before final assignment commitment.";
    if (status === "Revised") return "Reviewer approves the revised version and keeps the rejected upload in history.";
    if (status === "Requested" || status === "Reminder Sent" || status === "Due in 14 days") return "Document owner follows the request through approval.";
    return index === 1 && driver.id === "DRV-003" ? driver.exception : doc[4];
  }

  function documentHistoryMeta(driver, doc, index, status, reviewDate) {
    var uploadedDate = index % 4 === 0 ? "06/01/2026" : index % 4 === 1 ? "06/02/2026" : index % 4 === 2 ? "06/03/2026" : "06/04/2026";
    var version = "v" + (index % 3 + 1);
    var uploadedBy = index < 5 ? driver.name : index < 12 ? "Safety desk" : index < 17 ? "Back office" : "Compliance desk";
    var note = "Initial upload accepted into BOF driver qualification packet.";
    if (driver.id === "DRV-003" && index === 1) {
      version = "v2";
      note = "v1 rejected for missing examiner registry number; corrected card request is open.";
    } else if (driver.id === "DRV-003" && index === 3) {
      version = "v1";
      note = "MVR failed review and requires safety manager corrective sign-off.";
    } else if (driver.id === "DRV-002" && index === 19) {
      version = "v1";
      note = "Prior employer response is still outstanding after first reminder.";
    } else if (driver.id === "DRV-006" && index === 20) {
      version = "v3";
      note = "Annual review packet is current but signature is due in 14 days.";
    } else if (status === "Revised") {
      version = "v2";
      note = "Reviewer retained original upload and marked revised copy as the active file.";
    }
    return {
      uploadedBy: uploadedBy,
      uploadedDate: uploadedDate,
      reviewedBy: doc[2],
      reviewDate: reviewDate,
      version: version,
      note: note,
      nextAction: documentNextAction(driver, doc, index, status)
    };
  }

  function documentUsedMarksHtml(driver, doc, index, status, expiration) {
    var meta = documentHistoryMeta(driver, doc, index, status, index % 3 === 0 ? "06/05/2026" : index % 3 === 1 ? "06/04/2026" : "06/03/2026");
    var stamp = documentStatusClass(status) === "blocked" ? "REVIEW HOLD" : documentStatusClass(status) === "watch" ? "WATCH / FOLLOW-UP" : "APPROVED";
    var highlight = driver.id === "DRV-003" && index === 1 ? "Expiration and examiner registry number highlighted for correction." :
      driver.id === "DRV-003" && index === 3 ? "Violation finding highlighted for safety manager review." :
      driver.id === "DRV-006" && index === 20 ? "Annual review signature line highlighted." :
      "Reviewer stamp, renewal reminder, and owner note are retained with the file.";
    return [
      '<section class="document-used-marks">',
      '  <div class="review-stamp ' + documentStatusClass(status) + '">' + esc(stamp) + '</div>',
      '  <div><span>Reviewer note</span><strong>' + esc(highlight) + '</strong><em>' + esc(meta.note) + '</em></div>',
      '  <div><span>Renewal reminder</span><strong>' + esc(expiration === "Current" ? "Next cycle tracked by safety desk" : expiration) + '</strong><em>Reminder timing is visible before dispatch commitment.</em></div>',
      '</section>'
    ].join("");
  }

  function documentHistoryPanel(driver, doc, index, status, reviewDate) {
    var meta = documentHistoryMeta(driver, doc, index, status, reviewDate);
    return [
      '<section class="document-paper-section document-history-panel">',
      '  <h3>Document history and versioning</h3>',
      '  <div class="document-history-grid">',
      documentFieldBox("Uploaded by", meta.uploadedBy, "Source party retained"),
      documentFieldBox("Uploaded date", meta.uploadedDate, "Original receipt timestamp"),
      documentFieldBox("Last reviewed by", meta.reviewedBy, "Current owner"),
      documentFieldBox("Review date", meta.reviewDate, "Review timestamp"),
      documentFieldBox("Version", meta.version, meta.note),
      documentFieldBox("Approval state", status, "Status affects driver readiness"),
      documentFieldBox("Next action", meta.nextAction, "Visible back-office follow-up"),
      '</div>',
      '</section>'
    ].join("");
  }

  function documentTable(rows) {
    return '<table class="document-paper-table"><tbody>' + rows.map(function (row) {
      return '<tr><th>' + esc(row[0]) + '</th><td>' + esc(row[1]) + '</td></tr>';
    }).join("") + '</tbody></table>';
  }

  function documentCheckRows(rows) {
    return '<div class="document-checklist">' + rows.map(function (row) {
      return '<div><span>' + esc(row[0]) + '</span><strong>' + esc(row[1]) + '</strong><em>' + esc(row[2]) + '</em></div>';
    }).join("") + '</div>';
  }

  function documentSignatureBlock(left, right) {
    return '<div class="document-signature-grid"><div><span>Driver signature</span><strong>' + esc(left) + '</strong><em>Electronic acknowledgement on file</em></div><div><span>Reviewer</span><strong>' + esc(right) + '</strong><em>Review timestamp retained in audit trail</em></div></div>';
  }

  function driverLicenseCard(driver, expiration) {
    var state = (driver.homeBase || "OH").split(",").pop().trim() || "OH";
    var profile = driverSyntheticProfile(driver);
    var licenseAsset = "/assets/images/documents/drivers/licenses/license-" + driver.id.toLowerCase() + ".png" + (driver.id === "DRV-007" || driver.id === "DRV-008" ? "?v=2" : "");
    return [
      '<section class="driver-license-artifact">',
      '  <figure><img src="' + esc(licenseAsset) + '" alt="' + esc(driver.name) + ' commercial driver license record"><figcaption>Credential file image attached to the driver qualification packet.</figcaption></figure>',
      '  <dl class="artifact-verification-grid">',
      '    <div><dt>State</dt><dd>' + esc(state) + '</dd></div>',
      '    <div><dt>License no.</dt><dd>' + esc(profile.licenseNo) + '</dd></div>',
      '    <div><dt>DOB</dt><dd>' + esc(profile.dob) + '</dd></div>',
      '    <div><dt>Address</dt><dd>' + esc(profile.address) + '</dd></div>',
      '    <div><dt>Expiration</dt><dd>' + esc(expiration) + '</dd></div>',
      '    <div><dt>Artifact file</dt><dd>' + esc(licenseAsset.split("/").pop()) + '</dd></div>',
      '  </dl>',
      '</section>'
    ].join("");
  }

  function documentFieldBox(label, value, note) {
    return '<div class="document-field-box"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong>' + (note ? '<em>' + esc(note) + '</em>' : "") + '</div>';
  }

  function documentFormGrid(rows, className) {
    return '<div class="' + esc(className || "document-form-grid") + '">' + rows.map(function (row) {
      return documentFieldBox(row[0], row[1], row[2]);
    }).join("") + '</div>';
  }

  function medicalCertificateForm(driver, doc, status, expiration) {
    var profile = driverSyntheticProfile(driver);
    return [
      '<section class="document-paper-section medical-certificate-form">',
      '  <div class="form-letterhead"><span>Medical Examiner Certificate</span><strong>Driver medical qualification record</strong><em>MCSA-style review surface</em></div>',
      documentFormGrid([
        ["Driver", driver.name + " / " + driver.id, "Name matched to active roster"],
        ["Certificate ID", "MED-" + driver.id.replace("DRV-", "") + "-2026", "Filed in driver qualification packet"],
        ["Medical examiner", profile.medicalExaminer, "Examiner name visible for owner review"],
        ["Exam date", "05/29/2026", "Current review cycle"],
        ["Expiration / renewal", expiration, driver.id === "DRV-003" ? "Corrected evidence required" : "Supports dispatch assignment"],
        ["Dispatch rule", driver.id === "DRV-003" ? "Hold assignment until corrected evidence is attached" : "Current card supports assignment", "Safety desk owns final check"]
      ], "document-form-grid certificate-grid"),
      documentSignatureBlock(driver.name, doc[2]),
      '</section>'
    ].join("");
  }

  function mcsaExamForm(driver, doc) {
    var profile = driverSyntheticProfile(driver);
    return [
      '<section class="document-paper-section mcsa-exam-form">',
      '  <div class="form-letterhead"><span>Medical Examination Report</span><strong>MCSA exam summary worksheet</strong><em>Safety review retained with medical card</em></div>',
      documentFormGrid([
        ["Examiner certificate", profile.medicalExaminer, "Linked to medical-card record"],
        ["Exam date", "05/29/2026", "Filed before current assignment"],
        ["Qualification result", driver.id === "DRV-003" ? "Needs corrected card image" : "Qualified", "Safety desk review"],
        ["Vision / hearing", "Meets review threshold", "No visible assignment blocker"],
        ["Blood pressure note", driver.id === "DRV-003" ? "Reviewer requested clearer certificate image" : "Within certificate range", "Reviewer note retained"],
        ["Owner", doc[2], "Safety audit surface"]
      ], "document-form-grid certificate-grid"),
      '</section>'
    ].join("");
  }

  function taxRecordForm(driver, doc, type, rows) {
    return [
      '<section class="document-paper-section tax-record-form">',
      '  <div class="form-letterhead"><span>' + esc(type) + '</span><strong>Back-office settlement and payroll record</strong><em>Finance review surface</em></div>',
      documentFormGrid(rows, "document-form-grid tax-grid"),
      documentSignatureBlock(driver.name, doc[2]),
      '</section>'
    ].join("");
  }

  function emergencyContactForm(driver, doc) {
    var profile = driverSyntheticProfile(driver);
    return [
      '<section class="document-paper-section emergency-card-form">',
      '  <div class="emergency-card-band"><span>Emergency Contact</span><strong>' + esc(driver.name) + '</strong><em>' + esc(driver.id) + '</em></div>',
      documentFormGrid([
        ["Home base", driver.homeBase || "Fleet workspace", "Dispatcher contact context"],
        ["Driver phone", profile.phone, "Primary driver number"],
        ["Driver email", profile.email, "Fleet inbox"],
        ["Primary contact", profile.primaryContact, profile.primaryRelationship + " / " + profile.primaryPhone],
        ["Secondary contact", profile.secondaryContact, profile.secondaryRelationship + " / " + profile.secondaryPhone],
        ["Verified", "06/04/2026 by back office", "Visible to dispatch supervisor and safety desk"]
      ], "document-form-grid emergency-grid"),
      '</section>'
    ].join("");
  }

  function insuranceCardForm(driver, doc) {
    var profile = driverSyntheticProfile(driver);
    return [
      '<section class="document-paper-section insurance-card-form">',
      '  <div class="insurance-card-band"><span>Driver Protection Card</span><strong>NorthLine Driver Protection Program</strong><em>' + esc(profile.insuranceCard) + '</em></div>',
      documentFormGrid([
        ["Covered driver", driver.name + " / " + driver.id, "Roster match"],
        ["Effective range", "01/01/2026-12/31/2026", "Current coverage record"],
        ["Program", "NorthLine Driver Protection Program", "Driver packet reference"],
        ["Review use", "Owner can inspect driver packet coverage record", "Fleet-owned driver file"],
        ["Dispatch effect", "No insurance-card blocker shown", "Readiness packet"],
        ["Owner", doc[2], "Back-office review"]
      ], "document-form-grid insurance-grid"),
      '</section>'
    ].join("");
  }

  function hrElectionForm(driver, doc, title, rows) {
    return [
      '<section class="document-paper-section hr-election-form">',
      '  <div class="form-letterhead"><span>Personnel File</span><strong>' + esc(title) + '</strong><em>HR packet document</em></div>',
      documentFormGrid(rows, "document-form-grid hr-grid"),
      documentSignatureBlock(driver.name, doc[2]),
      '</section>'
    ].join("");
  }

  function roadTestForm(driver, doc) {
    var profile = driverSyntheticProfile(driver);
    return [
      '<section class="document-paper-section road-test-form">',
      '  <div class="form-letterhead"><span>Road Test Certificate</span><strong>Annual review and road-test record</strong><em>Safety qualification surface</em></div>',
      '<div class="road-test-scorecard">',
      documentFieldBox("Road test certificate", profile.roadTest, "Filed 05/29/2026"),
      documentFieldBox("Vehicle control", "Satisfactory", "Backing, turns, mirrors, lane control"),
      documentFieldBox("Coupling / inspection", "Satisfactory", "Pre-trip and equipment review"),
      documentFieldBox("Route context", driver.load + " / " + driver.route, "Current assignment context"),
      documentFieldBox("Dispatch effect", driver.id === "DRV-006" ? "Renewal evidence remains on watch" : "No road-test blocker shown", "Safety desk decision"),
      documentFieldBox("Next review", "06/02/2027 annual DQF review", "Retained in audit trail"),
      '</div>',
      documentSignatureBlock(driver.name, doc[2]),
      '</section>'
    ].join("");
  }

  function documentReviewerPanel(doc, driver, index) {
    var status = documentStatus(driver, index);
    var action = documentNextAction(driver, doc, index, status);
    return [
      '<section class="document-reviewer-panel">',
      '  <div><span>Evidence reviewed</span><p>' + esc(doc[3]) + '</p></div>',
      '  <div><span>Dispatch consequence</span><p>' + esc(driver.exception) + '</p></div>',
      '  <div><span>Next action</span><p>' + esc(action) + '</p></div>',
      '</section>'
    ].join("");
  }

  function documentAuditTrail(driver, doc, reviewDate, status) {
    return [
      '<section class="document-paper-section document-audit-trail">',
      '  <h3>Record activity</h3>',
      '  <ol>',
      '    <li><span>' + esc(reviewDate) + ' 08:20</span><strong>' + esc(doc[2]) + '</strong><em>Opened document for ' + esc(driver.load) + ' readiness review.</em></li>',
      '    <li><span>' + esc(reviewDate) + ' 08:34</span><strong>BOF readiness packet</strong><em>Status set to ' + esc(status) + ' with complete field values visible for review.</em></li>',
      '    <li><span>06/06/2026 09:10</span><strong>Operations lead</strong><em>Document consequence attached to dispatch queue and owner action.</em></li>',
      '  </ol>',
      '</section>'
    ].join("");
  }

  function driverDocumentSpecificHtml(driver, doc, index, status, expiration) {
    var driverLine = driver.name + " / " + driver.id;
    var routeLine = driver.load + " / " + driver.route;
    var roster = driverRosterDetails(driver);
    var profile = driverSyntheticProfile(driver);
    var rows;
    switch (index) {
      case 0:
        return driverLicenseCard(driver, expiration) + '<section class="document-paper-section"><h3>Commercial driver license scan</h3>' + documentTable([["Document type", "Front and back CDL image"], ["Name match", driverLine], ["License number", profile.licenseNo], ["Class", "A"], ["Restriction review", "No restriction shown that conflicts with the active assignment"], ["Image state", "Front and back image captured with complete credential fields"]]) + '</section>';
      case 1:
        return medicalCertificateForm(driver, doc, status, expiration);
      case 2:
        return mcsaExamForm(driver, doc);
      case 3:
        return '<section class="document-paper-section"><h3>Motor vehicle record review</h3><table class="document-paper-table"><thead><tr><th>Review item</th><th>Finding</th><th>Dispatch effect</th></tr></thead><tbody><tr><td>License status</td><td>' + esc(profile.licenseNo) + ' active</td><td>' + esc(driver.id === "DRV-003" ? "Active license, but MVR review still blocks assignment" : "No release blocker unless noted") + '</td></tr><tr><td>Recent violations</td><td>' + esc(driver.id === "DRV-003" ? "Failed 36-month MVR review; safety manager review required" : "No violations in 36-month MVR review") + '</td><td>' + esc(driver.id === "DRV-003" ? "Hold - action required" : "Eligible review path") + '</td></tr><tr><td>Accident history</td><td>' + esc(driver.id === "DRV-003" ? "Preventability review opened for owner inspection" : "No preventable accident record in current packet") + '</td><td>Owner can inspect before assignment</td></tr><tr><td>Annual MVR pull</td><td>' + esc(profile.mvrPull) + '</td><td>' + esc(driver.id === "DRV-003" ? "Does not support dispatch until corrective review clears" : "Supports dispatch eligibility") + '</td></tr></tbody></table></section>';
      case 4:
        return '<section class="document-paper-section"><h3>FMCSA and clearinghouse compliance</h3>' + documentTable([["Compliance source", profile.clearinghouseRef], ["Clearinghouse-style review", "Annual query logged 06/02/2026"], ["Driver roster ID", driver.id + " / " + profile.licenseNo], ["Assignment", routeLine], ["Dispatch effect", driver.id === "DRV-003" ? "Medical-card hold controls assignment" : "No compliance blocker shown"], ["Owner", doc[2]]]) + '</section>';
      case 5:
        return taxRecordForm(driver, doc, "W-9 tax record", [["Tax profile", profile.taxProfile, "Filed with settlement packet"], ["Driver", driverLine, "Roster match"], ["Payer classification", "Individual driver settlement profile", "Back-office setup"], ["TIN review token", "TIN-CHECK-" + driver.id.replace("DRV-", "") + "-OK", "Review token retained"], ["Settlement consequence", "Missing tax setup would block settlement follow-through", "Finance gate"], ["Current state", status, "Back-office owner: " + doc[2]]]);
      case 6:
        return taxRecordForm(driver, doc, "I-9 employment eligibility record", [["Eligibility case", profile.i9Case, "Personnel file reference"], ["Driver", driverLine, "Roster match"], ["Identity document pair", "CDL " + profile.licenseNo + " / employment authorization checklist", "Viewed with license artifact"], ["Employment status", "Cleared for fleet assignment record", "Owner inspection"], ["Dispatch use", "Personnel file complete enough for owner inspection", "Readiness context"], ["Owner", doc[2], "Back-office review"]]);
      case 7:
        return emergencyContactForm(driver, doc);
      case 8:
        return taxRecordForm(driver, doc, "Bank and settlement setup", [["Settlement method", "ACH settlement token", "Finance file"], ["Settlement token", profile.achToken, "Account details represented by token"], ["Pay contact", profile.email + " / " + profile.phone, "Driver contact"], ["Authorization", "Electronic authorization accepted 06/01/2026", "Signature retained"], ["Pay cycle", "Weekly Friday settlement batch", "Settlement setup"], ["Next action", "Confirm pay-cycle setup before settlement release", "Back-office owner"]]);
      case 9:
        return insuranceCardForm(driver, doc);
      case 10:
        return '<section class="document-paper-section"><h3>DQF compliance summary</h3>' + documentTable([["DQF source", "FMCSA DQF compliance summary"], ["Driver", driverLine], ["Core DQF items", "CDL, medical card, MVR, compliance, emergency, and qualification file"], ["Open items", driver.id === "DRV-003" ? "Medical card review required" : "No open item shown"], ["Owner", doc[2]], ["Next review", "Schedule retained by safety desk"]]) + documentSignatureBlock("Operations lead", doc[2]) + '</section>';
      case 11:
        return '<section class="document-paper-section"><h3>Qualification file</h3>' + documentTable([["Qualification file", "Qualification file represented as an owner review surface"], ["Driver", driverLine], ["Included records", "Credential, medical, MVR, compliance, emergency, HR, and settlement records"], ["DQF readiness", driver.id === "DRV-003" ? "Needs medical-card correction" : "Ready for owner inspection"], ["Owner", doc[2]], ["Dispatch effect", driver.exception]]) + '</section>';
      case 12:
        return '<section class="document-paper-section"><h3>Employee handbook acknowledgement</h3>' + documentTable([["HR packet document", "Employee handbook acknowledgement"], ["Driver", driverLine], ["Acknowledgement state", "Signed 06/01/2026"], ["Policy version", profile.handbookVersion], ["Safety modules", "Cargo securement, incident reporting, trip inspection, document return"], ["Owner", doc[2]]]) + documentSignatureBlock(driver.name, doc[2]) + '</section>';
      case 13:
        return hrElectionForm(driver, doc, "Benefits enrollment", [["Driver", driverLine, "Personnel file"], ["Enrollment tier", profile.benefitPlan, "Selected benefit plan"], ["Effective date", "07/01/2026", "Plan year setup"], ["Payroll deduction", driver.id === "DRV-006" || driver.id === "DRV-009" ? "$148.25 per pay" : "$72.40 per pay", "Payroll review"], ["Back-office use", "HR file completeness", "Owner inspection"], ["Owner", doc[2], "HR packet review"]]);
      case 14:
        return hrElectionForm(driver, doc, "Life insurance beneficiary election", [["Driver", driverLine, "Personnel file"], ["Beneficiary", profile.beneficiary, "Election visible to owner"], ["Election state", "Signed 06/01/2026", "Signature retained"], ["Coverage tier", "$50,000 basic life election", "Benefit file"], ["Owner", doc[2], "HR packet review"]]);
      case 15:
        return hrElectionForm(driver, doc, "Flexible spending account election", [["Driver", driverLine, "Personnel file"], ["Election", profile.fsaElection, "Payroll setup"], ["Plan year", "2026", "Benefit year"], ["Back-office use", "HR/payroll file completeness", "Owner inspection"], ["Owner", doc[2], "HR packet review"]]);
      case 16:
        return taxRecordForm(driver, doc, "Garnishment withholding summary", [["Packet status", driver.hasGarnishment ? "Payroll withholding summary present" : "No withholding order active", "Payroll file"], ["Driver", driverLine, "Roster match"], ["Status", status, "Readiness effect"], ["Case reference", profile.garnishmentCase, "Payroll reference"], ["Settlement effect", driver.hasGarnishment ? "Payroll/settlement owner keeps withholding visible before release" : "No settlement action required", "Settlement review"], ["Owner", doc[2], "Back-office owner"]]);
      case 17:
        return '<section class="document-paper-section"><h3>Driver application</h3>' + documentTable([["Applicant", driverLine], ["Application date", "05/28/2026"], ["Address / contact", profile.address + " / " + profile.phone], ["Experience summary", profile.equipmentExperience], ["License history", profile.licenseNo + " active for Class A CDL review"], ["Safety review", "No unresolved dispatch blocker shown unless status says hold"], ["Recruiting note", "Application reviewed by " + profile.reviewerName]]) + documentSignatureBlock(driver.name, "Back office") + '</section>';
      case 18:
        return '<section class="document-paper-section"><h3>Resume and work history</h3>' + documentTable([["Driver", driverLine], ["Current application", "BOF fleet driver packet / submitted 05/28/2026"], ["Prior carrier", profile.priorCarrier], ["Employment dates", profile.priorDates], ["Equipment experience", profile.equipmentExperience], ["Previous carrier reference", profile.previousCarrier], ["Gap review", "No unresolved work-history gap in the review packet"], ["Dispatch use", "Supports owner confidence before assigning " + driver.load]]) + '</section>';
      case 19:
        return '<section class="document-paper-section"><h3>Prior employer inquiry</h3>' + documentTable([["Inquiry status", driver.id === "DRV-002" ? "Reminder sent; response outstanding" : "Prior employer inquiry documented"], ["Prior employer", profile.priorCarrier], ["Inquiry sent", "05/30/2026 by " + doc[2]], ["Response state", driver.id === "DRV-002" ? "Second reminder sent 06/06/2026 to " + profile.previousCarrier : "Response received 06/03/2026 from " + profile.previousCarrier], ["Accident / drug-alcohol questions", driver.id === "DRV-002" ? "Pending employer response; watch state remains visible" : "Safety-performance checklist completed with no release blocker"], ["Owner", doc[2]], ["Next action", driver.id === "DRV-002" ? "Follow up with prior employer before clearing watch state" : status === "Hold" ? "Resolve inquiry before assignment" : "Keep inquiry with annual DQF review"]]) + documentSignatureBlock("Compliance desk", doc[2]) + '</section>';
      case 20:
        return roadTestForm(driver, doc);
      case 21:
        return '<section class="document-paper-section"><h3>Safety acknowledgement packet</h3>' + documentCheckRows([["Inspection reporting", "Filed", "Pre-trip and post-trip defects stay visible"], ["Cargo care", "Filed", "Supports claim prevention"], ["Incident escalation", "Filed", "Dispatcher knows who owns next action"], ["Accident scene procedure", "Filed", "Photos, notes, and contact steps are retained"]]) + documentSignatureBlock(driver.name, doc[2]) + '</section>';
      default:
        rows = [["Eligibility", status], ["Load", driver.load], ["Route", driver.route], ["Home base", driver.homeBase || "Fleet workspace"], ["Driver packet", driver.docCount || "Driver documents represented"], ["Credential", profile.licenseNo], ["Contact", profile.phone + " / " + profile.email], ["Blocking reason", driver.exception], ["Owner decision", "Use before committing release"]];
        return '<section class="document-paper-section"><h3>Dispatch eligibility and assignment</h3>' + documentTable(rows) + '</section>';
    }
  }

  function renderDriverDocument(driver, index) {
    var doc = driverDocs[index] || driverDocs[0];
    var status = documentStatus(driver, index);
    var title = mount.querySelector("[data-driver-doc-title]");
    var meta = mount.querySelector("[data-driver-doc-meta]");
    var paper = mount.querySelector("[data-driver-document-paper]");
    if (title) title.textContent = doc[0];
    if (meta) meta.textContent = driver.id + " / " + status + " / " + doc[2];
    if (paper) paper.innerHTML = driverDocumentPaperHtml(driver, doc, index, status);
    mount.querySelectorAll("[data-driver-doc]").forEach(function (button) {
      var active = Number(button.getAttribute("data-driver-doc")) === index;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function bindDriverDocuments(driver) {
    mount.querySelectorAll("[data-driver-doc]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        if (button.tagName === "A") {
          event.preventDefault();
          var href = button.getAttribute("href") || "";
          if (history && history.replaceState) history.replaceState(null, "", href);
        }
        var index = Number(button.getAttribute("data-driver-doc") || "0");
        renderDriverDocument(driver, index);
        var viewer = mount.querySelector("#driver-document-viewer");
        if (viewer) viewer.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function artifactStatusClass(status) {
    return status === "Ready" || status === "Ready on hold path" ? "ready" : status === "Review" || status === "Pending" ? "watch" : "review";
  }

  function proofArtifactRowsHtml(groupName) {
    return proofArtifacts.filter(function (artifact) {
      return artifact[0] === groupName;
    }).map(function (artifact, index) {
      var globalIndex = proofArtifacts.indexOf(artifact);
      return '<button class="artifact-row" type="button" data-proof-artifact="' + globalIndex + '" aria-pressed="false"><span>' + esc(artifact[2]) + '</span><strong class="mini-status ' + artifactStatusClass(artifact[3]) + '">' + esc(artifact[3]) + '</strong><em>' + esc(artifact[5]) + '</em><small>' + esc(artifact[7]) + '</small></button>';
    }).join("");
  }

  function proofPacketHtml() {
    var groups = ["core", "proof", "exceptions", "reference"];
    var readyCount = proofArtifacts.filter(function (artifact) { return artifact[3] === "Ready" || artifact[3] === "Ready on hold path" || artifact[3] === "Not applicable"; }).length;
    return [
      '<section class="proof-packet-summary">',
      '  <div><span>Packet readiness</span><strong>' + readyCount + '/' + proofArtifacts.length + '</strong><em>BOL review is the active release gate</em></div>',
      '  <div><span>Settlement gate</span><strong>Watch</strong><em>Post-trip POD and photos become required after delivery</em></div>',
      '  <div><span>Claim gate</span><strong>Standby</strong><em>Claim folder opens only if delivery exception appears</em></div>',
      '  <div><span>Owner</span><strong>S. Turner</strong><em>Release decision and simulated handoff</em></div>',
      '</section>',
      '<section class="proof-lifecycle-strip" aria-label="Load lifecycle">',
      '  <span class="is-done">Imported</span><span class="is-done">BOF readiness</span><span class="is-active">Document gate</span><span>Decision</span><span>Simulated handoff</span>',
      '</section>',
      '<section class="proof-packet-layout">',
      '  <div class="artifact-registry">',
      groups.map(function (group) {
        var label = proofArtifacts.find(function (artifact) { return artifact[0] === group; })[1];
        return '<section><h2>' + esc(label) + '</h2>' + proofArtifactRowsHtml(group) + '</section>';
      }).join(""),
      '  </div>',
      '  <aside class="artifact-preview-panel" aria-live="polite">',
      '    <div class="driver-document-toolbar"><span>Selected artifact</span><h2 data-artifact-title>BOL image review</h2><p data-artifact-meta>BOF-RR-10482-DOCS</p></div>',
      '    <div data-artifact-preview></div>',
      '  </aside>',
      '</section>'
    ].join("");
  }

  function artifactPaperHtml(artifact) {
    var title = artifact[2];
    var status = artifact[3];
    var source = artifact[4];
    var fileName = artifact[5];
    var required = artifact[6];
    var releaseEffect = artifact[7];
    var claimEffect = artifact[8];
    var owner = artifact[9];
    var note = artifact[10];
    var mediaBlock = title.indexOf("photo") >= 0 || title.indexOf("Seal") >= 0 || title.indexOf("cargo") >= 0 ? artifactMediaPreview(title, status) : "";
    return [
      '<article class="driver-document-paper artifact-paper">',
      '  <header><div><span>BOF release packet</span><strong>TMS-LD-10482 / BOF-RR-10482</strong><em>Dallas, TX to Memphis, TN</em></div><div><span>Artifact status</span><strong>' + esc(status) + '</strong><em>' + esc(fileName) + '</em></div></header>',
      mediaBlock,
      '  <section class="document-paper-title"><span>' + esc(source) + '</span><h2>' + esc(title) + '</h2><p>' + esc(note) + '</p></section>',
      '  <dl class="document-paper-grid">',
      '    <div><dt>Required</dt><dd>' + esc(required) + '</dd></div>',
      '    <div><dt>Owner</dt><dd>' + esc(owner) + '</dd></div>',
      '    <div><dt>Filename</dt><dd>' + esc(fileName) + '</dd></div>',
      '    <div><dt>Source</dt><dd>' + esc(source) + '</dd></div>',
      '    <div><dt>Release effect</dt><dd>' + esc(releaseEffect) + '</dd></div>',
      '    <div><dt>Settlement effect</dt><dd>' + esc(required.indexOf("after delivery") >= 0 ? "Settlement watch after delivery" : releaseEffect) + '</dd></div>',
      '    <div><dt>Claim effect</dt><dd>' + esc(claimEffect) + '</dd></div>',
      '    <div><dt>Next action</dt><dd>' + esc(status === "Review" ? "Owner confirms before release decision." : status === "Pending" ? "Attach post-trip proof when delivery occurs." : "Keep record attached to packet.") + '</dd></div>',
      '  </dl>',
      artifactSpecificHtml(artifact),
      '  <section class="document-paper-section"><h3>Packet registry note</h3><p>Dispatch, document review, release decision, settlement review, and exception handling all resolve to this same registered artifact.</p></section>',
      artifactAuditTrail(artifact),
      '  <footer><span>Reviewed by ' + esc(owner) + '</span><strong>BOF readiness packet</strong><em>Source, status, filename, gates, and owner retained</em></footer>',
      '</article>'
    ].join("");
  }

  function artifactMediaPreview(title, status) {
    return [
      '<section class="artifact-media-preview">',
      '  <span>Registered image evidence</span>',
      '  <strong>' + esc(title) + '</strong>',
      '  <em>' + esc(status === "Pending" ? "Image slot reserved; post-trip capture still pending" : "Image captured and attached to the load packet") + '</em>',
      '  <dl><div><dt>Timestamp</dt><dd>' + esc(status === "Pending" ? "Pending delivery event" : "06/05/2026 09:18") + '</dd></div><div><dt>Location</dt><dd>' + esc(status === "Pending" ? "Expected at delivery" : "Dallas, TX pickup yard") + '</dd></div><div><dt>Source</dt><dd>Driver mobile capture</dd></div></dl>',
      '</section>'
    ].join("");
  }

  function artifactSpecificHtml(artifact) {
    var title = artifact[2];
    if (title === "BOL image review") {
      return '<section class="document-paper-section"><h3>Bill of lading review</h3>' + documentTable([["Shipper", "Nexus Components, Inc."], ["Consignee", "Memphis Distribution Yard"], ["Pickup", "06/05/2026 09:15 / Dallas, TX"], ["Delivery appointment", "06/06/2026 14:00 / Memphis, TN"], ["Pieces / handling units", "24 pallets / values reviewed against import"], ["Release effect", "BOL confirmation controls the current release decision"]]) + documentSignatureBlock("J. Ramirez", "S. Turner") + '</section>';
    }
    if (title === "Delivery proof state") {
      return '<section class="document-paper-section"><h3>Proof of delivery packet</h3>' + documentTable([["Delivery timestamp", "Pending delivery event"], ["GPS / location", "Expected at Memphis, TN delivery yard"], ["Receiver / signature", "Pending receiver signature"], ["Dock photo", "Required after delivery"], ["Empty cargo photo", "Required after delivery"], ["Settlement consequence", "Settlement stays on watch until POD and delivery photos attach"], ["Claim consequence", "Required if shortage, damage, late arrival, or seal dispute opens"]]) + '</section>';
    }
    if (title === "Pickup instructions") {
      return '<section class="document-paper-section"><h3>Pickup instruction sheet</h3>' + documentTable([["Pickup window", "06/05/2026 08:30-10:30"], ["Pickup contact", "K. Bell / Dock 4 / shipper desk ext. 1826"], ["Driver instruction", "Arrive with trailer clean, seal photo required before departure"], ["Access note", "Use south gate and check in with load number"], ["Dispatch sign-off", "Dispatch desk confirms instruction packet before release"]]) + '</section>';
    }
    if (title === "Rate confirmation") {
      return '<section class="document-paper-section"><h3>Rate confirmation review</h3>' + documentTable([["Lane", "Dallas, TX to Memphis, TN"], ["Equipment", "Dry van"], ["Rate line", "$2,840.00 linehaul / $150 detention threshold after 2 hours"], ["Accessorial review", "Detention, layover, and TONU terms retained"], ["Settlement consequence", "Rate record must match before settlement packet closes"]]) + '</section>';
    }
    if (title === "Seal photo") {
      return '<section class="document-paper-section"><h3>Seal evidence</h3>' + documentTable([["Seal number", "SEAL-TX-10482-771"], ["Capture event", "Pickup departure"], ["GPS / location", "Dallas, TX pickup yard"], ["Driver", "DRV-001 / John Carter"], ["Dispute support", "Supports seal dispute if receiver reports mismatch"]]) + '</section>';
    }
    if (title === "Dock photo" || title === "Empty cargo photo") {
      return '<section class="document-paper-section"><h3>Post-trip photo requirement</h3>' + documentTable([["Required event", title === "Dock photo" ? "Receiver dock photo after unload" : "Empty cargo/bin photo after delivery"], ["Current state", "Pending delivery event"], ["Settlement effect", "Required after delivery before settlement packet closes"], ["Claim effect", "Supports claim response if delivery exception appears"], ["Owner", "Dispatch desk"]]) + '</section>';
    }
    if (title === "Claim evidence folder") {
      return '<section class="document-paper-section"><h3>Claim evidence folder</h3>' + documentTable([["Claim state", "No active claim"], ["Folder purpose", "Holds BOL, POD, seal photo, dock photo, empty cargo photo, notes, and dispute correspondence if an exception opens"], ["Owner", "Exception desk"], ["Settlement effect", "No hold unless claim opens"], ["Next action", "Open only if delivery exception, shortage, damage, seal mismatch, or dispute appears"]]) + '</section>';
    }
    if (title === "Corrected BOL request") {
      return '<section class="document-paper-section"><h3>Corrected BOL request</h3>' + documentTable([["Request trigger", "BOL rejected or image not acceptable"], ["Requested from", "Document desk / carrier operations"], ["Correction needed", "Clear BOL capture, matching load number, shipper/receiver marks, signature/date"], ["Release effect", "Hold path remains until corrected capture is attached"], ["Owner", "S. Turner"]]) + '</section>';
    }
    if (title === "Carrier packet") {
      return '<section class="document-paper-section"><h3>Carrier packet link</h3>' + documentTable([["Carrier", "CAR-118 / RoadPro Desk"], ["Packet state", "Ready"], ["Documents", "Authority, insurance, agreement, W-9, operations contact, lane confirmation"], ["Boundary", "Carrier readiness packet only; not a fleet employee driver file"], ["Next action", "Open carrier page for packet documents"]]) + '</section>';
    }
    if (title === "Release decision note") {
      return '<section class="document-paper-section"><h3>Release decision note</h3>' + documentTable([["Decision owner", "S. Turner"], ["Available outcomes", "Ready to Release / Release With Condition / Hold - Action Required"], ["Current gate", "BOL review and readiness packet"], ["Handoff", "Simulated partner handoff prepared after decision"], ["Audit note", "Decision, reason, owner, and next action retained"]]) + '</section>';
    }
    return '<section class="document-paper-section"><h3>Record detail</h3>' + documentTable([["Packet", "TMS-LD-10482 / BOF-RR-10482"], ["Route", "Dallas, TX to Memphis, TN"], ["Owner", artifact[9]], ["Release effect", artifact[7]], ["Claim effect", artifact[8]]]) + '</section>';
  }

  function artifactAuditTrail(artifact) {
    return [
      '<section class="document-paper-section document-audit-trail">',
      '  <h3>Packet activity</h3>',
      '  <ol>',
      '    <li><span>06/05/2026 08:52</span><strong>' + esc(artifact[4]) + '</strong><em>Registered ' + esc(artifact[5]) + ' in BOF-RR-10482.</em></li>',
      '    <li><span>06/05/2026 09:06</span><strong>' + esc(artifact[9]) + '</strong><em>Status set to ' + esc(artifact[3]) + ' with release and claim effects attached.</em></li>',
      '    <li><span>06/05/2026 09:24</span><strong>Release desk</strong><em>Record made visible to dispatch, document review, audit trail, and simulated handoff.</em></li>',
      '  </ol>',
      '</section>'
    ].join("");
  }

  function renderArtifact(index) {
    var artifact = proofArtifacts[index] || proofArtifacts[3];
    var title = mount.querySelector("[data-artifact-title]");
    var meta = mount.querySelector("[data-artifact-meta]");
    var preview = mount.querySelector("[data-artifact-preview]");
    if (title) title.textContent = artifact[2];
    if (meta) meta.textContent = artifact[5] + " / " + artifact[3] + " / " + artifact[9];
    if (preview) preview.innerHTML = artifactPaperHtml(artifact);
    mount.querySelectorAll("[data-proof-artifact]").forEach(function (button) {
      var active = Number(button.getAttribute("data-proof-artifact")) === index;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function bindArtifacts() {
    mount.querySelectorAll("[data-proof-artifact]").forEach(function (button) {
      button.addEventListener("click", function () {
        renderArtifact(Number(button.getAttribute("data-proof-artifact") || "0"));
      });
    });
  }

  function documentsPage() {
    shell("Document Records", "Documents", proofPacketHtml(), "Inspect the load document packet, POD evidence, photos, claim standby items, owners, and release consequences that support the selected load.");
    bindArtifacts();
    renderArtifact(3);
  }

  function shell(title, eyebrow, body, description) {
    var pageDescription = description || "Inspect the selected BOF workspace, operating records, owner, blocker, consequence, and next action without leaving the product shell.";
    mount.innerHTML = [
      appIconSprite(),
      '<section class="route-app-shell route-beveled-shell">',
      '  <div class="beveled-app-frame shell-frame">',
      '    <aside class="beveled-sidebar shell-rail" aria-label="BOF app sections">',
      '      <div class="beveled-brand"><img src="/assets/images/logo/boflogo-original.png" alt="BackOfficeFleet"></div>',
      '      <a class="beveled-menu-button route-back-button" href="/interactive-demo/" aria-label="Back to Command Center"><svg><use href="#app-icon-menu"></use></svg></a>',
      '      <nav class="beveled-rail" aria-label="Control Center sections">' + navHtml() + '</nav>',
      '      <div class="beveled-version"><span>Version 2.7.14</span><strong>All systems operational</strong></div>',
      '    </aside>',
      '    <div class="beveled-main route-beveled-main">',
      '      <header class="beveled-topbar route-beveled-topbar">',
      '        <div class="fleet-context"><span>Fleet</span><strong>Delta Advanced Trucking</strong></div>',
      '        <div class="topbar-actions"><span>Workspace</span><strong>' + esc(title) + '</strong><a class="site-exit-link" href="/">Website</a></div>',
      '      </header>',
      '      <main class="route-app-main">',
      '        <header class="route-app-header"><span>' + esc(eyebrow) + '</span><h1>' + esc(title) + '</h1><p>' + esc(pageDescription) + '</p></header>',
      body,
      '      </main>',
      '    </div>',
      '  </div>',
      '</section>'
    ].join("");
  }

  function loadTableHtml() {
    return '<div class="route-table-wrap"><table class="route-table"><thead><tr><th>Load</th><th>Priority</th><th>Status</th><th>Origin</th><th>Destination</th><th>Driver</th><th>Carrier</th><th>Control item</th></tr></thead><tbody>' +
      loads.map(function (row) {
        var driver = row[5].toLowerCase();
        return '<tr><td>' + esc(row[0]) + '</td><td><span class="priority ' + (row[1] === "High" ? "high" : row[1] === "Low" ? "low" : "medium") + '"><i></i>' + esc(row[1]) + '</span></td><td><span class="mini-status ' + (row[2] === "Ready" ? "ready" : row[2] === "Hold" ? "blocked" : row[2] === "Watch" ? "watch" : "review") + '">' + esc(row[2]) + '</span></td><td>' + esc(row[3]) + '</td><td>' + esc(row[4]) + '</td><td><a href="/interactive-demo/drivers/' + esc(driver) + '/">' + esc(row[5]) + '</a></td><td>' + esc(row[6]) + '</td><td>' + esc(row[8]) + '</td></tr>';
      }).join("") +
      "</tbody></table></div>";
  }

  function dispatchBoardHtml() {
    return [
      '<section class="dispatch-command-layout">',
      '  <article class="route-record-card dispatch-primary-record">',
      '    <span class="mini-status review">Review</span><h2>TMS-LD-10482 / BOF-RR-10482</h2>',
      '    <p>Dallas, TX to Memphis, TN is staged for release review. Dispatch can see the driver, carrier packet, BOL gate, pre-trip requirement, post-trip POD requirements, and owner next action without leaving the board.</p>',
      '    <dl><div><dt>Driver</dt><dd><a href="/interactive-demo/drivers/drv-001/">DRV-001 / John Carter</a></dd></div><div><dt>Carrier</dt><dd><a href="/interactive-demo/carriers/">CAR-118 / RoadPro Desk</a></dd></div><div><dt>Document packet</dt><dd><a href="/interactive-demo/documents/">Open release packet</a></dd></div><div><dt>Next action</dt><dd>S. Turner confirms BOL review before release decision.</dd></div></dl>',
      '  </article>',
      '  <section class="dispatch-lifecycle" aria-label="Dispatch lifecycle">',
      '    <div class="is-done"><span>Imported</span><strong>TMS load attached</strong><em>Load, route, carrier, driver match</em></div>',
      '    <div class="is-done"><span>Pre-trip</span><strong>Driver and carrier ready</strong><em>Driver file, equipment, seal photo requirement</em></div>',
      '    <div class="is-active"><span>Document gate</span><strong>BOL review active</strong><em>Controls release outcome</em></div>',
      '    <div><span>In transit</span><strong>Route context tracked</strong><em>HOS, weather, fuel, traffic shown as operating context</em></div>',
      '    <div><span>Post-trip</span><strong>POD/photo packet required</strong><em>Receiver signature, GPS, dock, empty cargo</em></div>',
      '  </section>',
      '</section>',
      '<section class="dispatch-stage-grid">',
      '  <article><h2>Release-ready lane</h2><p>BOF-2064 can be staged after equipment timing is confirmed.</p><span>Low priority: normal staging, not a document blocker.</span></article>',
      '  <article><h2>Held lane</h2><p>BOF-1931 stays out of assignment until DRV-003 medical-card hold clears.</p><span>High priority: compliance hold blocks assignment.</span></article>',
      '  <article><h2>Watch lane</h2><p>BOF-1907 and BOF-2258 stay planned but not committed until POD or renewal proof clears.</p><span>Medium priority: plan coverage, confirm evidence before release.</span></article>',
      '</section>'
    ].join("");
  }

  function reportsHtml() {
    return [
      '<section class="consequence-summary-grid">',
      '  <article><span>Queue exposure</span><strong>High / Medium / Low</strong><p>High priority means a release or assignment decision can block dispatch today. Medium means planning can continue, but a proof or renewal item must clear before commitment. Low means normal staging.</p></article>',
      '  <article><span>Settlement watch</span><strong>POD + photos</strong><p>Post-trip POD, GPS/location detail, receiver signature, dock photo, and empty cargo photo become settlement requirements after delivery.</p></article>',
      '  <article><span>Claim standby</span><strong>Evidence folder ready</strong><p>If a delivery exception opens, BOF already has a place for BOL, POD, seal photo, dock/cargo photos, notes, and dispute correspondence.</p></article>',
      '  <article><span>Driver coverage</span><strong>12 files</strong><p>Driver pages expose complete document packets with owner, status, dispatch consequence, and next action.</p></article>',
      '</section>',
      '<section class="route-table-wrap consequence-table"><table class="route-table"><thead><tr><th>Scenario</th><th>Operating consequence</th><th>Owner</th><th>Next action</th></tr></thead><tbody>',
      '<tr><td>Ready to release</td><td>Dispatch can commit the lane and prepare simulated handoff.</td><td>S. Turner</td><td>Attach release decision note.</td></tr>',
      '<tr><td>Release with condition</td><td>Dispatch may proceed only with the condition visible in the audit trail.</td><td>Release desk</td><td>Track POD and post-trip photo requirements.</td></tr>',
      '<tr><td>Hold - action required</td><td>Release stays blocked until the controlling BOL, driver, or carrier packet clears.</td><td>Document / safety desk</td><td>Open correction request or driver hold.</td></tr>',
      '<tr><td>Delivery exception</td><td>Claim folder opens and settlement stays on watch until evidence is complete.</td><td>Exception desk</td><td>Collect POD, GPS, photos, receiver note, and dispute response.</td></tr>',
      '</tbody></table></section>'
    ].join("");
  }

  function settlementsHtml() {
    return [
      '<section class="consequence-summary-grid settlement-summary-grid">',
      '  <article><span>Load revenue</span><strong>$4,850.00</strong><p>TMS-LD-10482 keeps linehaul, fuel surcharge, detention allowance, and accessorial review tied to the release packet.</p></article>',
      '  <article><span>Driver pay</span><strong>$612.74</strong><p>DRV-001 uses mileage pay plus a safety/document bonus. Other rows show percentage, hourly, and salary-style examples.</p></article>',
      '  <article><span>Payroll deductions</span><strong>4 tracked</strong><p>HSA, garnishment, health care, and life insurance deductions are represented with protected fictional references.</p></article>',
      '  <article><span>Settlement holds</span><strong>Proof driven</strong><p>Missing POD, receiver signature, receipt, or required information keeps settlement on watch until proof is complete.</p></article>',
      '</section>',
      '<section class="route-table-wrap settlement-ledger-table"><table class="route-table"><thead><tr><th>Settlement record</th><th>Amount / method</th><th>State</th><th>Owner</th><th>Why it matters</th></tr></thead><tbody>',
      '<tr><td>TMS-LD-10482 revenue</td><td>$4,850.00 gross load revenue</td><td><span class="mini-status ready">Attached</span></td><td>Fleet finance desk</td><td>Revenue remains connected to release, POD, and settlement proof.</td></tr>',
      '<tr><td>DRV-001 cents-per-mile pay</td><td>612 miles x $0.74 + $160.00 stop/safety/document pay</td><td><span class="mini-status review">Prepared</span></td><td>Payroll desk</td><td>Payment waits for final release and post-trip proof.</td></tr>',
      '<tr><td>Percentage-pay example</td><td>DRV-005: 28% of linehaul after owner review</td><td><span class="mini-status watch">Example</span></td><td>Payroll desk</td><td>Shows fleets with revenue-share driver agreements how BOF can track the method.</td></tr>',
      '<tr><td>Hourly local example</td><td>DRV-004: 8.5 hours x $31.00</td><td><span class="mini-status ready">Example</span></td><td>Payroll desk</td><td>Supports private/local fleet pay models without changing the release workflow.</td></tr>',
      '<tr><td>Salary / wage example</td><td>DRV-006: weekly salary allocation with route note</td><td><span class="mini-status watch">Example</span></td><td>Payroll desk</td><td>Shows salary-style planning without exposing private compensation files.</td></tr>',
      '<tr><td>Deduction packet</td><td>HSA, garnishment, health care, life insurance</td><td><span class="mini-status ready">Protected</span></td><td>Back office</td><td>Fictional tokens show the deductions exist without exposing real account or legal data.</td></tr>',
      '<tr><td>BOF-1907 settlement hold</td><td>POD / receiver signature / photo proof watch</td><td><span class="mini-status watch">Hold watch</span></td><td>M. Ruiz</td><td>Drivers have a clear incentive to submit required proof quickly.</td></tr>',
      '</tbody></table></section>',
      '<section class="route-grid settlement-record-grid">',
      '  <article class="route-record-card"><span>Revenue</span><h2>TMS-LD-10482 revenue packet</h2><p>Linehaul, fuel surcharge, accessorial review, release decision, and post-trip proof requirements stay attached to the load.</p></article>',
      '  <article class="route-record-card"><span>Payroll</span><h2>Driver pay methods</h2><p>Cents per mile, percentage of revenue, hourly, and salary-style examples are shown as operating records.</p></article>',
      '  <article class="route-record-card"><span>Deductions</span><h2>Protected deduction review</h2><p>HSA, garnishment, health care, and life insurance are visible as fictional references, not real private values.</p></article>',
      '  <article class="route-record-card"><span>Holds</span><h2>Proof-controlled settlement watch</h2><p>Missing receipt, POD, receiver signature, or required delivery information keeps settlement from clearing.</p></article>',
      '</section>'
    ].join("");
  }

  function driverInitials(driver) {
    if (driver.initials) return driver.initials;
    return String(driver.name || "BOF Driver")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0); })
      .join("")
      .toUpperCase();
  }

  function driverPhotoHtml(driver, className) {
    if (driver.photo) {
      return '<span class="' + esc(className) + ' driver-photo-frame"><img class="driver-photo-image" src="' + esc(driver.photo) + '" alt="' + esc(driver.name) + ' profile photo" loading="eager" onerror="this.hidden=true;this.nextElementSibling.hidden=false;"><b hidden>' + esc(driverInitials(driver)) + '</b></span>';
    }
    return '<span class="' + esc(className) + ' driver-photo-frame driver-initials-photo" role="img" aria-label="' + esc(driver.name) + ' profile initials">' + esc(driverInitials(driver)) + '</span>';
  }

  function driverCardHtml(driver) {
    return '<article class="route-record-card driver-route-card">' + driverPhotoHtml(driver, "driver-route-photo") + '<div><span>' + esc(driver.id) + '</span><h2>' + esc(driver.name) + '</h2><p>' + esc(driver.summary) + '</p></div><dl><div><dt>Load</dt><dd>' + esc(driver.load) + '</dd></div><div><dt>Route</dt><dd>' + esc(driver.route) + '</dd></div><div><dt>State</dt><dd><span class="mini-status ' + statusClass(driver.state) + '">' + esc(driver.state) + '</span></dd></div><div><dt>DQF Readiness</dt><dd>' + dqfScore(driver) + '%</dd></div><div><dt>Priority</dt><dd>' + esc(driver.priority) + '</dd></div></dl><a href="/interactive-demo/drivers/' + esc(driver.id.toLowerCase()) + '/">Open driver page</a></article>';
  }

  function driversIndex() {
    var cards = Object.keys(drivers).map(function (key) { return driverCardHtml(enrichDriver(drivers[key])); }).join("");
    shell("Driver Records", "Drivers", [
      '<section class="driver-vault-intake-row" aria-label="BOF Vault document intake workbench">',
      '  <article class="route-record-card driver-vault-intake-card">',
      '    <span>BOF Vault</span><h2>Document intake workbench</h2>',
      '    <p>Simulate how new driver, carrier, load, and settlement documents enter the Vault before they update readiness.</p>',
      '    <dl><div><dt>Workflow</dt><dd>Classify, verify, route, resolve, update readiness</dd></div><div><dt>Boundary</dt><dd>Review-only simulation; no file is transmitted or stored.</dd></div></dl>',
      '    <a href="/interactive-demo/drivers/document-intake/">Open document intake</a>',
      '  </article>',
      '</section>',
      '<section class="route-grid driver-record-grid" aria-label="Driver record cards">',
      cards,
      '</section>'
    ].join(""), "Open fleet driver records with photos, DQF readiness, ready/watch/hold state, dispatch consequence, and complete document packets.");
  }

  function documentIntakePage() {
    shell("BOF Vault Intake Workbench", "BOF Vault", [
      '<section class="vault-intake-shell" data-vault-document-intake>',
      '  <div class="vault-workbench-fallback">',
      '    <span class="mini-status review">BOF Vault</span>',
      '    <h2>BOF Vault Intake Workbench</h2>',
      '    <p>Receive a simulated document batch, classify files, match driver and carrier records, apply readiness rules, route exceptions to human review, and build onboarding profiles.</p>',
      '    <p>If the workbench controls do not load, use this route as a static overview of the same intake flow: upload received, OCR/file read, document type classified, driver matched, rules applied, exceptions generated, human review queue, and readiness profile built.</p>',
      '  </div>',
      '</section>'
    ].join(""), "Review simulated driver, carrier, proof, and onboarding documents as they move through intake, classification, exception review, and readiness profile generation.");
  }

  function isPrimaryQualificationDoc(doc) {
    var title = String(doc && doc[0] || "");
    return /CDL|license|Medical|MCSA|MVR|FMCSA|Clearinghouse|W-9|I-9|application|Prior employer|Road test|annual review|qualification file/i.test(title);
  }

  function driverDocumentCardHtml(driver, doc, index) {
    var status = documentStatus(driver, index);
    var cls = documentStatusClass(status);
    var href = "/interactive-demo/drivers/" + esc(driver.id.toLowerCase()) + "/?doc=" + index;
    return '<a class="driver-doc-card" href="' + href + '" data-driver-doc="' + index + '" aria-pressed="false"><header><span>DOC-' + String(index + 1).padStart(2, "0") + '</span><strong>' + esc(doc[0]) + '</strong><em class="mini-status ' + cls + '">' + esc(status) + '</em></header><p>' + esc(doc[1]) + '</p><dl><div><dt>Owner</dt><dd>' + esc(doc[2]) + '</dd></div><div><dt>Evidence</dt><dd>' + esc(doc[3]) + '</dd></div><div><dt>Next action</dt><dd>' + esc(documentNextAction(driver, doc, index, status)) + '</dd></div></dl></a>';
  }

  function driverPage() {
    var driver = enrichDriver(drivers[driverSlugFromPath()] || drivers["drv-001"]);
    var initialDocIndex = currentDriverDocIndex();
    var primaryDocs = [];
    var supportingDocs = [];
    driverDocs.forEach(function (doc, index) {
      var card = driverDocumentCardHtml(driver, doc, index);
      if (isPrimaryQualificationDoc(doc)) primaryDocs.push(card);
      else supportingDocs.push(card);
    });
    shell(driver.id + " Driver File", "Driver record", [
      '<section class="driver-record-hero canonical-driver-hero">',
      '  ' + driverPhotoHtml(driver, "driver-record-photo"),
      '  <div class="driver-profile-copy"><span class="mini-status ' + statusClass(driver.readinessStatus || driver.state) + '">' + esc(driver.readinessStatus || driver.state) + '</span><h2>' + esc(driver.name) + '</h2><p>' + esc(driver.id) + ' / ' + esc(driver.employmentType || "Fleet driver") + '</p><p>' + esc(driver.summary) + '</p><div class="driver-profile-actions"><a href="/drivers/">Return to Drivers</a><a href="/interactive-demo/drivers/">Open demo roster</a></div></div>',
      '  <dl class="driver-profile-meta"><div><dt>Current assignment</dt><dd>' + esc(driver.load || "No active load") + '</dd></div><div><dt>Route</dt><dd>' + esc(driver.route) + '</dd></div><div><dt>Unit / availability</dt><dd>' + esc(driver.unitLabel || "Available") + '</dd></div><div><dt>Assignment state</dt><dd>' + esc(driver.assignmentState || "Available") + '</dd></div><div><dt>DQF readiness</dt><dd>' + dqfScore(driver) + '%</dd></div><div><dt>Required action</dt><dd>' + esc(driver.exception) + '</dd></div></dl>',
      '</section>',
      driverRosterInfoHtml(driver),
      dqfWorkflowHtml(driver),
      '<section class="driver-document-viewer" id="driver-document-viewer" aria-live="polite">',
      '  <div class="driver-document-toolbar"><span>Open Document</span><h2 data-driver-doc-title>Driver license image</h2><p data-driver-doc-meta>' + esc(driver.id) + '</p></div>',
      '  <div data-driver-document-paper></div>',
      '</section>',
      '<section class="driver-document-group" aria-label="' + esc(driver.id) + ' primary qualification documents"><div class="driver-document-group-heading"><span>Primary Qualification Documents</span><h2>Core eligibility and safety file</h2><p>CDL, medical, MVR, clearinghouse, application, annual review, and owner-operator setup where applicable.</p></div><div class="driver-doc-grid">' + primaryDocs.join("") + '</div></section>',
      '<section class="driver-document-group" aria-label="' + esc(driver.id) + ' secondary and supporting documents"><div class="driver-document-group-heading"><span>Secondary and Supporting Documents</span><h2>HR, payroll, assignment, and operating evidence</h2><p>Employment records, settlement setup, safety acknowledgements, insurance, emergency contacts, and dispatch context.</p></div><div class="driver-doc-grid">' + supportingDocs.join("") + '</div></section>'
    ].join(""), "Review this driver's photo, roster fields, DQF score, active requests, generated forms, document history, and clickable paperwork that controls dispatch eligibility.");
    bindDriverDocuments(driver);
    renderDriverDocument(driver, initialDocIndex);
  }

  function carrierStatusClass(state) {
    return state === "Ready" ? "ready" : state === "Hold" ? "blocked" : "watch";
  }

  function carrierDocumentStatus(carrier, index) {
    if (carrier.id === "CAR-204" && (index === 1 || index === 5)) return "Watch";
    return "Filed";
  }

  function carrierCardHtml(carrier) {
    return '<button class="carrier-packet-card" type="button" data-carrier-open="' + esc(carrier.id.toLowerCase()) + '" aria-pressed="false"><header><span>' + esc(carrier.id) + '</span><strong>' + esc(carrier.name) + '</strong><em class="mini-status ' + carrierStatusClass(carrier.state) + '">' + esc(carrier.state) + '</em></header><p>' + esc(carrier.summary) + '</p><dl><div><dt>Load</dt><dd>' + esc(carrier.load) + '</dd></div><div><dt>Lane</dt><dd>' + esc(carrier.lane) + '</dd></div><div><dt>Owner</dt><dd>' + esc(carrier.owner) + '</dd></div></dl></button>';
  }

  function carrierPaperHtml(carrier, doc, index, status) {
    var docId = carrier.id + "-PKT-" + String(index + 1).padStart(2, "0");
    var expiration = index === 1 ? (carrier.id === "CAR-204" ? "Renewal evidence watch" : "12/31/2026") : index === 0 ? "FMCSA docket active" : "Current through review window";
    return [
      '<article class="driver-document-paper carrier-document-paper">',
      '  <header>',
      '    <div><span>Carrier readiness packet</span><strong>' + esc(carrier.id + " / " + carrier.name) + '</strong><em>Outside carrier packet, not a fleet employee file</em></div>',
      '    <div><span>Opened file</span><strong>' + esc(docId) + '</strong><em>' + esc(status) + '</em></div>',
      '  </header>',
      documentStampHtml(docId, status, "06/05/2026", expiration),
      '  <section class="document-paper-title"><span>' + esc(doc[0]) + '</span><h2>' + esc(carrier.id + " Carrier Packet") + '</h2><p>' + esc(doc[1]) + '</p></section>',
      '  <dl class="document-paper-grid">',
      '    <div><dt>Carrier</dt><dd>' + esc(carrier.name) + '</dd></div>',
      '    <div><dt>Carrier ID</dt><dd>' + esc(carrier.id) + '</dd></div>',
      '    <div><dt>Load / lane</dt><dd>' + esc(carrier.load + " / " + carrier.lane) + '</dd></div>',
      '    <div><dt>Document owner</dt><dd>' + esc(doc[2]) + '</dd></div>',
      '    <div><dt>Status</dt><dd><span class="mini-status ' + documentStatusClass(status) + '">' + esc(status) + '</span></dd></div>',
      '    <div><dt>Expiration / renewal</dt><dd>' + esc(expiration) + '</dd></div>',
      '  </dl>',
      carrierDocumentSpecificHtml(carrier, doc, index, status),
      '<section class="document-reviewer-panel"><div><span>Evidence reviewed</span><p>' + esc(doc[3]) + '</p></div><div><span>Release consequence</span><p>' + esc(carrier.summary) + '</p></div><div><span>Next action</span><p>' + esc(carrier.id === "CAR-204" && status === "Watch" ? carrier.next : doc[4]) + '</p></div></section>',
      artifactAuditTrail(["reference", "Carrier packet", doc[0], status, doc[2], docId + ".html", "Required", carrier.id === "CAR-204" && status === "Watch" ? "Carrier watch" : "No carrier hold", "No claim effect", doc[2], doc[1]]),
      '  <footer><span>Reviewed by ' + esc(doc[2]) + '</span><strong>BOF carrier packet</strong><em>Carrier readiness stays separate from driver personnel files</em></footer>',
      '</article>'
    ].join("");
  }

  function carrierDocumentSpecificHtml(carrier, doc, index, status) {
    switch (index) {
      case 0:
        return '<section class="document-paper-section"><h3>Operating authority review</h3>' + documentTable([["Authority status", status], ["Registration", carrier.id + "-AUTH-2026 / docket BOF-CAR-" + carrier.id.replace("CAR-", "")], ["Carrier assignment", carrier.load], ["Release effect", carrier.id === "CAR-204" ? "Usable for planning while renewal watch remains visible" : "No carrier hold"], ["Boundary", "Carrier packet readiness only; no outside driver personnel file shown"]]) + '</section>';
      case 1:
        return '<section class="document-paper-section"><h3>Insurance certificate</h3>' + documentTable([["Certificate holder", "Fleet workspace / release packet"], ["Coverage types", "Auto liability and cargo coverage tracked"], ["Policy", "BOF-CARGO-" + carrier.id.replace("CAR-", "") + "-2026"], ["Effective / expiration", carrier.id === "CAR-204" ? "Renewal evidence watch" : "01/01/2026-12/31/2026"], ["Release effect", carrier.id === "CAR-204" ? "Watch before commitment" : "No insurance hold"]]) + '</section>';
      case 2:
        return '<section class="document-paper-section"><h3>Broker-carrier agreement</h3>' + documentTable([["Agreement state", "Signed and attached"], ["Operating obligations", "Pickup, delivery, document return, exception notification"], ["Signature", "Carrier authorized signer on file"], ["Release effect", "Required before simulated handoff"], ["Owner", doc[2]]]) + documentSignatureBlock(carrier.name, doc[2]) + '</section>';
      case 3:
        return '<section class="document-paper-section"><h3>W-9 and payment setup</h3>' + documentTable([["Tax record", "W9-" + carrier.id + "-2026"], ["Payment setup", "ACH-CAR-" + carrier.id.replace("CAR-", "") + "-READY"], ["Settlement effect", "Resolve before settlement if missing"], ["Pay cycle", "Carrier weekly settlement batch"], ["Owner", doc[2]]]) + '</section>';
      case 4:
        return '<section class="document-paper-section"><h3>Operations contact sheet</h3>' + documentTable([["Dispatch contact", "T. Walker / carrier ops ext. 4418"], ["After-hours contact", "M. Ross / carrier ops ext. 2037"], ["Exception escalation", "Carrier operations and BOF exception desk"], ["Use case", "BOL correction, POD follow-up, delivery delay, photo request"], ["Owner", doc[2]]]) + '</section>';
      case 5:
        return '<section class="document-paper-section"><h3>Lane confirmation</h3>' + documentTable([["Lane", carrier.lane], ["Equipment", "Dry van"], ["Rate record", carrier.id === "CAR-204" ? "Rate confirmation watch" : "Matched to release packet"], ["Pickup / delivery", "Windows attached to load packet"], ["Release effect", carrier.id === "CAR-204" ? "Confirm before release" : "Ready for handoff"]]) + '</section>';
      default:
        return '<section class="document-paper-section"><h3>Exception escalation note</h3>' + documentTable([["Trigger", "Rejected BOL, missing POD, seal mismatch, late delivery, claim evidence request"], ["Owner", doc[2]], ["Carrier role", "Provide corrected document or delivery evidence"], ["BOF role", "Track owner, consequence, and next action"], ["Status", status]]) + '</section>';
    }
  }

  function renderCarrierPacket(carrierKey, docIndex) {
    var carrier = carrierRecords[carrierKey] || carrierRecords["car-118"];
    var doc = carrierDocs[docIndex] || carrierDocs[0];
    var status = carrierDocumentStatus(carrier, docIndex || 0);
    var title = mount.querySelector("[data-carrier-doc-title]");
    var meta = mount.querySelector("[data-carrier-doc-meta]");
    var paper = mount.querySelector("[data-carrier-document-paper]");
    if (title) title.textContent = doc[0];
    if (meta) meta.textContent = carrier.id + " / " + status + " / " + doc[2];
    if (paper) paper.innerHTML = carrierPaperHtml(carrier, doc, docIndex || 0, status);
    mount.setAttribute("data-active-carrier", carrier.id.toLowerCase());
    mount.setAttribute("data-active-carrier-doc", String(docIndex || 0));
    mount.querySelectorAll("[data-carrier-open]").forEach(function (button) {
      var active = button.getAttribute("data-carrier-open") === carrier.id.toLowerCase();
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    mount.querySelectorAll("[data-carrier-doc]").forEach(function (button) {
      var active = Number(button.getAttribute("data-carrier-doc")) === (docIndex || 0);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function bindCarrierPackets() {
    mount.querySelectorAll("[data-carrier-open]").forEach(function (button) {
      button.addEventListener("click", function () {
        renderCarrierPacket(button.getAttribute("data-carrier-open") || "car-118", Number(mount.getAttribute("data-active-carrier-doc") || "0"));
      });
    });
    mount.querySelectorAll("[data-carrier-doc]").forEach(function (button) {
      button.addEventListener("click", function () {
        renderCarrierPacket(mount.getAttribute("data-active-carrier") || "car-118", Number(button.getAttribute("data-carrier-doc") || "0"));
      });
    });
  }

  function carrierPage() {
    var carrierCards = Object.keys(carrierRecords).map(function (key) {
      return carrierCardHtml(carrierRecords[key]);
    }).join("");
    var docButtons = carrierDocs.map(function (doc, index) {
      return '<button class="driver-doc-card carrier-doc-card" type="button" data-carrier-doc="' + index + '" aria-pressed="false"><header><span>PKT-' + String(index + 1).padStart(2, "0") + '</span><strong>' + esc(doc[0]) + '</strong></header><p>' + esc(doc[1]) + '</p><dl><div><dt>Owner</dt><dd>' + esc(doc[2]) + '</dd></div><div><dt>Evidence</dt><dd>' + esc(doc[3]) + '</dd></div></dl></button>';
    }).join("");
    shell("Carrier Packets", "Carriers", [
      '<section class="carrier-packet-layout">',
      '  <div class="carrier-packet-list">' + carrierCards + '</div>',
      '  <section class="driver-document-viewer carrier-document-viewer" aria-live="polite">',
      '    <div class="driver-document-toolbar"><span>Open Carrier Document</span><h2 data-carrier-doc-title>Operating authority</h2><p data-carrier-doc-meta>CAR-118</p></div>',
      '    <div data-carrier-document-paper></div>',
      '  </section>',
      '</section>',
      '<section class="driver-doc-grid carrier-doc-grid" aria-label="Carrier packet documents">' + docButtons + '</section>'
    ].join(""), "Inspect carrier packet readiness without treating outside carrier records as fleet employee files: authority, insurance, agreement, W-9, contacts, lane confirmation, and exception escalation.");
    bindCarrierPackets();
    renderCarrierPacket("car-118", 0);
  }

  function genericPage(routeName) {
    var content = {
      "/interactive-demo/load-queue/": ["Load Queue", "Queue", loadTableHtml(), "Compare every release-review load by priority, status, lane, driver, carrier, and controlling item so the owner can see what moves, what waits, and why."],
      "/interactive-demo/dispatch/": ["Dispatch Board", "Dispatch", dispatchBoardHtml(), "See the dispatch consequence for the selected load across import, pre-trip, document gate, in-transit context, and post-trip proof requirements."],
      "/interactive-demo/safety/": ["Safety & Compliance", "Safety", '<section class="route-grid">' + Object.keys(drivers).map(function (key) { return driverCardHtml(enrichDriver(drivers[key])); }).join("") + '</section>', "Review driver safety and compliance readiness by DQF score, medical/MVR state, watch items, holds, and assignment consequence."],
      "/interactive-demo/settlements/": ["Settlements", "Settlements", settlementsHtml(), "Review load revenue, driver pay methods, payroll deductions, settlement holds, and proof requirements without exposing real private payroll data."],
      "/interactive-demo/reports/": ["Reports", "Reports", reportsHtml(), "Summarize the operating consequences behind ready, conditional, watch, hold, settlement, claim, and expansion-review decisions."],
      "/interactive-demo/alerts/": ["Alerts", "Alerts", '<section class="route-grid"><article class="route-record-card"><h2>Import document review</h2><p>TMS-LD-10482 waits on BOF-RR-10482 readiness review.</p></article><article class="route-record-card"><h2>Credential hold</h2><p>DRV-003 medical-card hold blocks BOF-1931.</p><a href="/interactive-demo/drivers/drv-003/">Open driver page</a></article><article class="route-record-card"><h2>Renewal watch</h2><p>DRV-006 renewal evidence controls BOF-2258 planning.</p><a href="/interactive-demo/drivers/drv-006/">Open driver page</a></article></section>', "Open the active alert queue and jump directly to the driver, document, credential, or release record that explains the blocker."],
      "/interactive-demo/settings/": ["Workspace Settings", "Settings", '<section class="route-grid"><article class="route-record-card"><h2>Session scope</h2><p>BOF control center session with route pages, driver files, document packets, alerts, and simulated handoff.</p></article><article class="route-record-card"><h2>Website exit</h2><p>Use the Website link to leave the product shell.</p></article></section>', "Confirm the scope of this static product-shell session and use the explicit Website exit when the buyer is done reviewing records."]
    }[routeName];
    if (!content) content = ["Command Center", "Command Center", '<section class="route-grid"><article class="route-record-card"><h2>Selected-load operating view</h2><p>Use the route pages to inspect the queue, drivers, documents, alerts, and safety records as separate app destinations.</p></article></section>', "Use the Command Center to start from the selected load, then open the route pages for deeper queue, driver, carrier, document, safety, report, and alert records."];
    shell(content[0], content[1], content[2], content[3]);
  }

  function renderCurrentRoute() {
    var slug = driverSlugFromPath();
    if (currentPath() === "/interactive-demo/drivers/document-intake/") {
      documentIntakePage();
    } else if (slug) {
      driverPage();
    } else if (currentPath() === "/interactive-demo/drivers/") {
      driversIndex();
    } else if (currentPath() === "/interactive-demo/documents/") {
      documentsPage();
    } else if (currentPath() === "/interactive-demo/carriers/") {
      carrierPage();
    } else {
      genericPage(currentPath());
    }
  }

  if (currentPath().indexOf("/interactive-demo/drivers/") === 0 || currentPath() === "/interactive-demo/safety/") {
    loadCanonicalOperations().then(renderCurrentRoute);
  } else {
    renderCurrentRoute();
  }
})();
