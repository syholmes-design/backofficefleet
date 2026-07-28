(function () {
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js-motion");

  if (reducedMotion) {
    document.querySelectorAll("img[data-static-src]").forEach(function (image) {
      var staticSrc = image.getAttribute("data-static-src");
      if (staticSrc) image.setAttribute("src", staticSrc);
    });
  }

  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-nav]");
  var header = document.querySelector(".site-header");

  function createIconLink(href, className, label, iconSvg) {
    var link = document.createElement("a");
    link.href = href;
    link.className = className;
    link.innerHTML = iconSvg + "<span>" + label + "</span>";
    link.setAttribute("aria-label", label);
    link.setAttribute("title", label);
    return link;
  }

  function enhanceEnterpriseHeader() {
    if (!header || !nav) return;
    header.setAttribute("data-enterprise-header", "true");

    nav.querySelectorAll(".nav-dropdown a").forEach(function (link) {
      var href = (link.getAttribute("href") || "").replace(/\/+$/, "/");
      if (href === "/fleet/") link.remove();
      if (href === "/aggregator-outreach/" || href === "/aggregator-partner-offer/") {
        link.href = "/aggregators/";
        link.textContent = "Aggregators";
      }
    });

    nav.querySelectorAll('a[href="/trust-governance/"]').forEach(function (link) {
      if ((link.textContent || "").trim().toLowerCase() === "company") {
        link.href = "/company/";
      }
    });

    nav.querySelectorAll(".nav-utility-link").forEach(function (link) {
      link.remove();
    });

    if (!nav.querySelector(".nav-vault-link")) {
      nav.appendChild(createIconLink(
        "/bof-vault/",
        "nav-icon-link nav-vault-link",
        "BOF Vault",
        '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0 1 10 0v2"/><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M12 14v2.5"/><path d="M9 20h6"/></svg>'
      ));
    }

    if (!nav.querySelector(".nav-documents-link")) {
      nav.appendChild(createIconLink(
        "/documents/",
        "nav-icon-link nav-documents-link",
        "Documents",
        '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9.5 12.5h5"/><path d="M9.5 16h6"/><path d="M9.5 19h4"/></svg>'
      ));
    }

    if (!nav.querySelector(".nav-assessment-menu")) {
      var assessmentMenu = document.createElement("div");
      assessmentMenu.className = "nav-menu nav-assessment-menu";
      assessmentMenu.setAttribute("data-nav-menu", "");
      assessmentMenu.innerHTML = [
        '<button class="nav-menu-toggle" type="button" data-nav-menu-toggle aria-expanded="false" aria-haspopup="true">BOF Assessment</button>',
        '<div class="nav-dropdown" aria-label="BOF Assessment">',
        '  <a href="/assessment/">Fleet Readiness Assessment</a>',
        '  <a href="/assessment/?type=private-fleet">Private Fleet Assessment</a>',
        '  <a href="/assessment/?type=for-hire-fleet">For-Hire Fleet Assessment</a>',
        '  <a href="/assessment/?type=government">Government Fleet Assessment</a>',
        '  <a href="/assessment/?type=aggregator">Aggregator Assessment</a>',
        '</div>'
      ].join("");
      var vaultLink = nav.querySelector(".nav-vault-link");
      nav.insertBefore(assessmentMenu, vaultLink || nav.lastChild);
    }

    if (!nav.querySelector(".nav-mobile-signin")) {
      var mobileSignIn = document.createElement("a");
      mobileSignIn.href = "/book-a-demo/";
      mobileSignIn.className = "nav-mobile-signin";
      mobileSignIn.textContent = "Request a Demo";
      nav.insertBefore(mobileSignIn, nav.firstChild);
    }

    var cta = header.querySelector(".header-cta");
    if (cta) {
      cta.href = "/book-a-demo/";
      cta.textContent = "Request a Demo";
      cta.setAttribute("aria-label", "Request a BackOfficeFleet demo");
    }

    if (!header.querySelector(".header-contact-icon")) {
      var contact = createIconLink(
        "/contact/",
        "header-contact-icon",
        "Contact BackOfficeFleet",
        '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.61a2 2 0 0 1-.45 2.11L8 9.7a16 16 0 0 0 6.3 6.3l1.26-1.26a2 2 0 0 1 2.11-.45c.84.28 1.71.48 2.61.6A2 2 0 0 1 22 16.92z"/></svg>'
      );
      contact.setAttribute("aria-label", "Contact BackOfficeFleet");
      header.appendChild(contact);
    }
  }

  enhanceEnterpriseHeader();

  function enhancePublicFooter() {
    var footer = document.querySelector(".site-footer");
    if (!footer || document.querySelector("[data-interactive-demo]")) return;
    footer.innerHTML = [
      '<div class="footer-inner wave4-footer-inner">',
      '  <div class="wave4-footer-brand"><strong>BackOfficeFleet</strong><span>Operational readiness, documentation, governance, and execution support for fleets.</span></div>',
      '  <nav class="wave4-footer-links" aria-label="Footer navigation">',
      '    <div><span>Audiences</span><a href="/who-we-serve/">Who We Serve</a><a href="/private-fleets/">Private Fleets</a><a href="/for-hire-fleets/">For-Hire Fleets</a><a href="/aggregators/">Aggregators</a><a href="/government/">Government</a></div>',
      '    <div><span>Products</span><a href="/drivers/">Drivers</a><a href="/dispatch/">Dispatch &amp; Operations</a><a href="/safety/">Safety &amp; Compliance</a><a href="/settlements/">Settlements &amp; Billing</a><a href="/business-operations/">Business Operations</a><a href="/documents/">Documents</a><a href="/bof-vault/">BOF Vault</a><a href="/policies-procedures/">Policies &amp; Procedures</a></div>',
      '    <div><span>Solutions</span><a href="/assessment/">Assessment</a><a href="/load-readiness/">Load Readiness</a><a href="/network-readiness/">Network Readiness</a><a href="/fleet-preparedness/">Fleet Preparedness</a><a href="/priority-fleet-program/">Priority Fleet Program</a><a href="/resources/">Resources</a></div>',
      '    <div><span>Company</span><a href="/company/">Company</a><a href="/contact/">Contact</a><a href="/book-a-demo/">Request a Demo</a></div>',
      '  </nav>',
      '</div>'
    ].join("");
  }

  enhancePublicFooter();

  if (header) {
    function setHeaderScrollState() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    setHeaderScrollState();
    window.addEventListener("scroll", setHeaderScrollState, { passive: true });
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
    });
  }

  if (nav) {
    var navMenus = Array.prototype.slice.call(nav.querySelectorAll("[data-nav-menu]"));
    var navMenuToggles = Array.prototype.slice.call(nav.querySelectorAll("[data-nav-menu-toggle]"));

    function normalizePath(path) {
      if (!path) return "/";
      if (path.indexOf("?") >= 0) path = path.split("?")[0];
      if (path.indexOf("#") >= 0) path = path.split("#")[0];
      if (path !== "/" && path.charAt(path.length - 1) !== "/" && path.indexOf(".") < 0) path += "/";
      return path;
    }

    function setNavMenu(menu, open) {
      var button = menu ? menu.querySelector("[data-nav-menu-toggle]") : null;
      if (!menu || !button) return;
      menu.setAttribute("data-open", String(open));
      button.setAttribute("aria-expanded", String(open));
    }

    function closeNavMenus(exceptMenu) {
      navMenus.forEach(function (menu) {
        if (menu !== exceptMenu) setNavMenu(menu, false);
      });
    }

    navMenuToggles.forEach(function (button) {
      button.addEventListener("click", function () {
        var menu = button.closest("[data-nav-menu]");
        var willOpen = menu && menu.getAttribute("data-open") !== "true";
        closeNavMenus(menu);
        setNavMenu(menu, willOpen);
      });
    });

    nav.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      closeNavMenus();
      if (toggle && nav.getAttribute("data-open") === "true") {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (nav.contains(event.target) || (toggle && toggle.contains(event.target))) return;
      closeNavMenus();
    });

    nav.querySelectorAll(".nav-dropdown a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeNavMenus();
        if (toggle && nav.getAttribute("data-open") === "true") {
          nav.setAttribute("data-open", "false");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });

    var currentPath = normalizePath(window.location.pathname);
    var exactActiveLink = null;
    var prefixActiveLink = null;
    nav.querySelectorAll('a[href^="/"]').forEach(function (link) {
      var linkPath = normalizePath(new URL(link.getAttribute("href"), window.location.href).pathname);
      if (!exactActiveLink && currentPath === linkPath) exactActiveLink = link;
      if (!prefixActiveLink && linkPath !== "/" && currentPath.indexOf(linkPath) === 0) prefixActiveLink = link;
    });

    var activeLink = exactActiveLink || prefixActiveLink;
    if (activeLink) {
      var parentMenu;
      activeLink.classList.add("active");
      parentMenu = activeLink.closest("[data-nav-menu]");
      if (parentMenu) {
        parentMenu.setAttribute("data-active", "true");
        var parentButton = parentMenu.querySelector("[data-nav-menu-toggle]");
        if (parentButton) parentButton.classList.add("active");
      }
    }
  }

  document.querySelectorAll(".public-demo-embed-section").forEach(function (section) {
    var mount = section.querySelector("[data-demo-embed-route]");
    var head = section.querySelector(".section-head");
    if (!mount || !head || section.querySelector("[data-demo-toggle]")) return;
    section.classList.add("is-collapsed");
    mount.hidden = true;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "button secondary public-demo-toggle";
    button.setAttribute("data-demo-toggle", "");
    button.setAttribute("aria-expanded", "false");
    button.textContent = "Open interactive workspace";
    head.appendChild(button);
    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      button.textContent = open ? "Open interactive workspace" : "Close interactive workspace";
      mount.hidden = open;
      section.classList.toggle("is-collapsed", open);
    });
  });

  var items = document.querySelectorAll(".reveal");
  items.forEach(function (item, index) {
    item.style.setProperty("--reveal-index", String(index % 7));
  });
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (item) {
      item.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });

    window.setTimeout(function () {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
    }, 900);
  }

  if (!reducedMotion) {
    document.querySelectorAll('a[href^="/"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.target && link.target !== "_self") return;
        var href = link.getAttribute("href");
        if (!href || href.indexOf("#") === 0 || href.indexOf(".pdf") >= 0) return;
        var nextUrl = new URL(href, window.location.href);
        if (nextUrl.origin !== window.location.origin) return;
        if (nextUrl.pathname === window.location.pathname && nextUrl.hash) return;
        document.documentElement.classList.add("page-transitioning");
        event.preventDefault();
        window.setTimeout(function () {
          window.location.href = nextUrl.href;
        }, 120);
      });
    });
  }

  var publicCardSelectors = [
    ".card",
    ".metric",
    ".timeline-card",
    ".booking-card",
    ".proof-card",
    ".proof-visual-card",
    ".artifact-proof-card",
    ".website-photo-card",
    ".proof-photo-card",
    ".proof-motion-card",
    ".summary-card",
    ".review-card",
    ".decision-panel",
    ".handoff-panel",
    ".demo-panel"
  ];

  function isInsideInteractiveDemo(element) {
    return Boolean(element.closest(".product-demo-body, [data-interactive-demo]"));
  }

  function isInteractiveTarget(element) {
    return Boolean(element.closest("a, button, input, select, textarea, summary, label, [role='button'], [role='link']"));
  }

  document.querySelectorAll(publicCardSelectors.join(",")).forEach(function (card) {
    if (isInsideInteractiveDemo(card)) return;

    var primaryLink = card.querySelector(
      "a.button[href], a.route-chip[href], a.proof-link[href], a.table-action[href], a[href]"
    );

    if (!primaryLink) {
      card.classList.add("is-passive-card");
      return;
    }

    var heading = card.querySelector("h2, h3, strong");
    var label = heading ? heading.textContent.trim() : primaryLink.textContent.trim();

    card.classList.add("is-clickable-card");
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");
    if (label && !card.getAttribute("aria-label")) {
      card.setAttribute("aria-label", label);
    }

    card.addEventListener("click", function (event) {
      if (event.defaultPrevented || isInteractiveTarget(event.target)) return;
      primaryLink.click();
    });

    card.addEventListener("keydown", function (event) {
      if (event.defaultPrevented || isInteractiveTarget(event.target)) return;
      if (event.key === "Enter") {
        event.preventDefault();
        primaryLink.click();
      }
    });
  });

  var governanceLibrary = document.querySelector("[data-governance-library]");
  if (governanceLibrary && window.fetch) {
    fetch("/assets/data/governance-documents.json")
      .then(function (response) {
        if (!response.ok) throw new Error("Governance manifest unavailable");
        return response.json();
      })
      .then(function (documents) {
        governanceLibrary.innerHTML = documents.map(function (doc) {
          var related = doc.relatedAreas.map(function (area) {
            return "<span>" + area + "</span>";
          }).join("");
          var access = doc.access || "Summary only";
          var availability = doc.availability || "Available upon request";
          var previewType = doc.previewType || "Summary only";
          var requestPath = doc.requestPath || "/book-demo/";
          var statusClass = access === "Restricted" ? "watch" : "ready";
          var action = '<div class="governance-actions">' +
            '<span class="route-chip">' + previewType + '</span>' +
            '<span class="route-chip warning">' + availability + '</span>' +
            '<a class="button secondary" href="' + requestPath + '">Request full policy</a>' +
            '</div>';
          return '<article class="governance-card card">' +
            '<span class="status ' + statusClass + '">' + access + '</span>' +
            '<h3>' + doc.title + '</h3>' +
            '<p class="doc-owner">' + doc.policyNumber + ' &middot; Version ' + doc.version + ' &middot; ' + doc.effectiveDate + '</p>' +
            '<p>' + doc.summary + '</p>' +
            '<div class="paper-grid">' +
            '<div class="field"><span>Classification</span><strong>' + doc.classification + '</strong></div>' +
            '<div class="field"><span>Category</span><strong>' + doc.category + '</strong></div>' +
            '<div class="field"><span>Access</span><strong>' + previewType + '</strong></div>' +
            '</div>' +
            '<div class="governance-tags">' + related + '</div>' +
            action +
            '</article>';
        }).join("");
      })
      .catch(function () {
        governanceLibrary.innerHTML = '<article class="card"><span class="icon">!</span><h3>Governance library unavailable</h3><p>The policy manifest could not be loaded. Please use the contextual governance summaries on this page.</p></article>';
      });
  }

  var demoLoader = document.querySelector("[data-demo-loader]");
  if (demoLoader) {
    var loadingMessage = demoLoader.querySelector('[data-loading-target="message"]');
    var loaderSteps = [
      [1900, "Attaching Partner TMS import TMS-LD-10482, BOF-RR-10482, driver file, carrier packet, and document pane."],
      [3900, "Preparing BOF release controls, dispatch consequence view, and simulated Partner TMS handoff."],
      [6200, "Opening the control panel."]
    ];

    loaderSteps.forEach(function (step) {
      window.setTimeout(function () {
        if (loadingMessage) loadingMessage.textContent = step[1];
      }, step[0]);
    });

    window.setTimeout(function () {
      window.location.replace("/interactive-demo/");
    }, 6800);
  }

  document.querySelectorAll("[data-wave4-form]").forEach(function (form) {
    var status = form.querySelector("[data-form-status]");
    var formName = form.getAttribute("data-form-name") || "Request";

    function setFormStatus(message, isError) {
      if (!status) return;
      status.textContent = message;
      status.classList.add("is-visible");
      status.classList.toggle("is-error", Boolean(isError));
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        setFormStatus("Please complete the required fields before BOF can review this " + formName.toLowerCase() + ".", true);
        return;
      }

      setFormStatus(formName + " validated for review. Secure submission wiring is pending, so no data was transmitted from this page.", false);
    });
  });

  var interactiveDemo = document.querySelector("[data-interactive-demo]");
  if (interactiveDemo) {
    var appState = {
      selectedLoad: "tms-ld-10482",
      activeDoc: "bol",
      decision: "review",
      activeRecord: "load",
      activeView: "command",
      activeRoleLens: "owner",
      queueFilter: "all",
      searchQuery: "",
      tmsFilter: "active",
      tmsSearchQuery: "",
      selectedRows: ["tms-ld-10482"],
      viewerZoom: 100,
      inspectorOpen: true,
      utilityRecord: "load",
      activeDriverDocument: 0,
      sessionTrail: [
        ["Open", "TMS-LD-10482 selected", "Import, driver, carrier, documents, and release decision are in scope.", "load"],
        ["Gate", "BOF-RR-10482 opened", "Document gate controls the release outcome.", "bol"],
        ["Next", "Decision pending", "Choose Ready, Hold, or Conditional after review.", "release"]
      ]
    };

    var loads = {
      "tms-ld-10482": {
        title: "TMS-LD-10482",
        route: "Dallas, TX to Memphis, TN",
        origin: "Dallas, TX",
        destination: "Memphis, TN",
        owner: "S. Turner",
        status: "Review",
        statusClass: "review",
        priorityLabel: "High",
        priorityClass: "high",
        priorityReason: "High because this release decision controls today's dispatch window, customer handoff, and whether the imported load can move without a document exception.",
        controllingLabel: "BOF-RR-10482",
        consequence: "BOF readiness review is open for the imported TMS load.",
        next: "Review driver match, documents, carrier packet, and choose a release outcome.",
        target: "Target: Today 12:00 PM",
        doc: "bol",
        driverLabel: "DRV-001",
        driverRecord: "driver",
        driverName: "John Carter",
        driverRole: "Driver",
        carrierLabel: "CAR-118",
        carrierRecord: "carrier",
        carrierName: "RoadPro Desk",
        carrierRole: "Carrier ops",
        primary: true
      },
      "bof-1907": {
        title: "BOF-1907",
        route: "Tulsa, OK to Kansas City, MO",
        origin: "Tulsa, OK",
        destination: "Kansas City, MO",
        owner: "M. Ruiz",
        status: "Watch",
        statusClass: "watch",
        priorityLabel: "Medium",
        priorityClass: "medium",
        priorityReason: "Medium because dispatch can prepare BOF-1907, but POD confirmation and carrier renewal evidence must be checked before release commitment.",
        controllingLabel: "BOL photo and renewal check",
        consequence: "Dispatch can prepare the lane, but renewal confirmation still needs a second look.",
        next: "Review the watch record before committing the release queue.",
        target: "Target: Tomorrow 10:00 AM",
        doc: "comparison1907",
        driverLabel: "DRV-002",
        driverRecord: "driver002",
        driverName: "Carlos Martinez",
        driverRole: "Driver watch",
        carrierLabel: "CAR-204",
        carrierRecord: "carrier204",
        carrierName: "CAR-204 Desk",
        carrierRole: "Carrier ops",
        primary: false
      },
      "bof-1931": {
        title: "BOF-1931",
        route: "Little Rock, AR to St. Louis, MO",
        origin: "Little Rock, AR",
        destination: "St. Louis, MO",
        owner: "Safety desk",
        status: "Hold",
        statusClass: "blocked",
        priorityLabel: "High",
        priorityClass: "high",
        priorityReason: "High because the driver medical-card hold blocks assignment and could create a dispatch compliance mistake if ignored.",
        controllingLabel: "Driver medical card hold",
        consequence: "Dispatch should not assign the lane until the driver record clears.",
        next: "Resolve the driver credential hold before release review.",
        target: "Target: Before dispatch assignment",
        doc: "comparison1931",
        driverLabel: "DRV-003",
        driverRecord: "driver003",
        driverName: "Mara Chen",
        driverRole: "Credential hold",
        carrierLabel: "CAR-088",
        carrierRecord: "carrier088",
        carrierName: "CAR-088 Desk",
        carrierRole: "Carrier ops",
        overdue: true,
        primary: false
      },
      "bof-2064": {
        title: "BOF-2064",
        route: "Birmingham, AL to Nashville, TN",
        origin: "Birmingham, AL",
        destination: "Nashville, TN",
        owner: "Dispatch desk",
        status: "Release Ready",
        statusClass: "ready",
        priorityLabel: "Low",
        priorityClass: "low",
        priorityReason: "Low because the readiness record is clear; the remaining work is normal equipment staging, not a release blocker.",
        controllingLabel: "Dispatch staging note",
        consequence: "This lane can be staged after dispatch confirms equipment timing.",
        next: "Stage dispatch and keep the ready note attached.",
        target: "Target: Today 2:30 PM",
        doc: "comparison2064",
        driverLabel: "DRV-004",
        driverRecord: "driver004",
        driverName: "Daniel Kim",
        driverRole: "Reserve driver",
        carrierLabel: "CAR-118",
        carrierRecord: "carrier",
        carrierName: "RoadPro Desk",
        carrierRole: "Carrier ops",
        primary: false
      },
      "bof-2175": {
        title: "BOF-2175",
        route: "Mobile, AL to Atlanta, GA",
        origin: "Mobile, AL",
        destination: "Atlanta, GA",
        owner: "Document desk",
        status: "Review",
        statusClass: "review",
        priorityLabel: "Medium",
        priorityClass: "medium",
        priorityReason: "Medium because the rate confirmation must match the lane before final release, but the driver and carrier coverage are not the blocker.",
        controllingLabel: "Rate confirmation check",
        consequence: "The lane remains in review until the rate record is matched.",
        next: "Check the rate confirmation before final dispatch release.",
        target: "Target: Tomorrow 9:30 AM",
        doc: "comparison2175",
        driverLabel: "DRV-005",
        driverRecord: "driver005",
        driverName: "Frank Miller",
        driverRole: "Team driver",
        carrierLabel: "CAR-204",
        carrierRecord: "carrier204",
        carrierName: "CAR-204 Desk",
        carrierRole: "Carrier ops",
        primary: false
      },
      "bof-2258": {
        title: "BOF-2258",
        route: "Shreveport, LA to Jackson, MS",
        origin: "Shreveport, LA",
        destination: "Jackson, MS",
        owner: "Safety desk",
        status: "Watch",
        statusClass: "watch",
        priorityLabel: "Medium",
        priorityClass: "medium",
        priorityReason: "Medium because dispatch can plan the lane, but driver renewal evidence must be visible before the assignment is committed.",
        controllingLabel: "Driver renewal watch",
        consequence: "Dispatch can plan coverage, but renewal evidence must be visible before commitment.",
        next: "Confirm DRV-006 renewal evidence before assigning the lane.",
        target: "Target: 06/08/2026 8:00 AM",
        doc: "comparison2258",
        driverLabel: "DRV-006",
        driverRecord: "driver006",
        driverName: "Priya Patel",
        driverRole: "Renewal watch",
        carrierLabel: "CAR-118",
        carrierRecord: "carrier",
        carrierName: "RoadPro Desk",
        carrierRole: "Carrier ops",
        primary: false
      }
    };

    var tmsSourceLoads = [
      {
        loadId: "tms-ld-10482",
        tmsLoadId: "TMS-LD-10482",
        loadNumber: "CLV-10482",
        customer: "Northstar Grocery Distribution",
        carrier: "Delta Advanced Trucking, Inc.",
        driver: "John Carter / DRV-001",
        pickup: "Dallas, TX - 06/06 08:00",
        delivery: "Memphis, TN - 06/06 18:00",
        equipment: "53 ft Dry Van",
        commodity: "Retail replenishment",
        status: "Tender accepted",
        statusClass: "review",
        tab: "active",
        docs: "6 / 7",
        accounting: "BOF release required",
        bofFile: "BOF-RR-10482",
        summary: "Partner TMS carries the load, route, carrier, driver, status, uploaded documents, and accounting handoff state. BOF controls the readiness decision before dispatch commits the lane.",
        record: "load",
        stops: [
          ["Pickup", "Dallas, TX", "Arrived pickup watch", "South gate / Dock 4 / shipper desk ext. 1826"],
          ["Delivery", "Memphis, TN", "Appointment open", "Receiver signature, GPS, POD, dock photo, and empty trailer proof expected after delivery"]
        ],
        documents: [
          ["Rate confirmation", "Uploaded", "rate"],
          ["BOL image", "BOF review", "bol"],
          ["Pickup instructions", "Uploaded", "pretrip"],
          ["Seal photo", "Attached", "pretrip"],
          ["POD", "Not yet required", "pod1907"],
          ["Claim evidence", "Registered folder", "bol"]
        ],
        log: [
          ["06/05 09:02", "Tender accepted", "load"],
          ["06/05 09:12", "Load opened for BOF review", "load"],
          ["06/05 09:18", "Carrier packet verified", "carrier"],
          ["06/05 09:24", "Document packet received", "bol"],
          ["06/06 09:10", "BOF readiness review opened", "release"]
        ]
      },
      {
        loadId: "bof-1907",
        tmsLoadId: "TMS-LD-1907",
        loadNumber: "TUL-1907",
        customer: "Kansas City Retail Pool",
        carrier: "Crossline Operations",
        driver: "Carlos Martinez / DRV-002",
        pickup: "Tulsa, OK - 06/07 07:30",
        delivery: "Kansas City, MO - 06/07 15:45",
        equipment: "53 ft Dry Van",
        commodity: "Store replenishment",
        status: "Delivered - documents pending",
        statusClass: "watch",
        tab: "accounting",
        docs: "POD watch",
        accounting: "Settlement watch",
        bofFile: "BOF-1907",
        summary: "Partner TMS can show the delivered load, while BOF keeps the POD, dock photo, empty trailer proof, carrier renewal, settlement watch, and claim standby inspectable.",
        record: "pod1907",
        stops: [
          ["Pickup", "Tulsa, OK", "Departed pickup", "Seal record retained"],
          ["Delivery", "Kansas City, MO", "Delivered", "Receiver proof and photos remain on BOF watch"]
        ],
        documents: [
          ["Signed BOL", "Attached", "signedbol1907"],
          ["POD", "Watch", "pod1907"],
          ["Dock photo", "Attached", "dockphoto1907"],
          ["Empty trailer photo", "Attached", "emptyphoto1907"],
          ["Lumper receipt", "Not applicable", "posttrip"]
        ],
        log: [
          ["06/06 13:20", "Departed pickup", "posttrip"],
          ["06/07 08:18", "Arrived delivery", "pod1907"],
          ["06/07 09:04", "Dock photo attached", "dockphoto1907"],
          ["06/07 09:18", "Settlement watch opened", "posttrip"]
        ]
      },
      {
        loadId: "bof-1931",
        tmsLoadId: "TMS-LD-1931",
        loadNumber: "LIT-1931",
        customer: "Midwest Packaging Co.",
        carrier: "North River Dispatch",
        driver: "Mara Chen / DRV-003",
        pickup: "Little Rock, AR - 06/05 12:00",
        delivery: "St. Louis, MO - 06/06 08:30",
        equipment: "53 ft Dry Van",
        commodity: "Packaging materials",
        status: "Assigned",
        statusClass: "blocked",
        tab: "planning",
        docs: "Medical hold",
        accounting: "Not ready",
        bofFile: "BOF-1931",
        summary: "Partner TMS can assign the load, but BOF blocks the release because the driver credential record controls dispatch eligibility.",
        record: "credential1931",
        stops: [
          ["Pickup", "Little Rock, AR", "Planning", "Do not dispatch while BOF hold is active"],
          ["Delivery", "St. Louis, MO", "Planned", "Delivery proof not yet required"]
        ],
        documents: [
          ["Rate confirmation", "Uploaded", "comparison1931"],
          ["BOL", "Uploaded", "comparison1931"],
          ["Driver medical card", "Blocked", "credential1931"],
          ["POD", "Not yet required", "comparison1931"]
        ],
        log: [
          ["06/05 09:02", "Load assigned in Partner TMS", "comparison1931"],
          ["06/05 09:16", "BOF driver match opened", "driver003"],
          ["06/05 09:19", "Medical-card hold recorded", "credential1931"]
        ]
      },
      {
        loadId: "bof-2064",
        tmsLoadId: "TMS-LD-2064",
        loadNumber: "BHM-2064",
        customer: "Nashville Appliance Outlet",
        carrier: "RoadPro Logistics",
        driver: "Daniel Kim / DRV-004",
        pickup: "Birmingham, AL - 06/06 14:30",
        delivery: "Nashville, TN - 06/06 20:30",
        equipment: "53 ft Dry Van",
        commodity: "Appliances",
        status: "Ready",
        statusClass: "ready",
        tab: "planning",
        docs: "Complete",
        accounting: "Ready after dispatch",
        bofFile: "BOF-2064",
        summary: "Partner TMS holds the planned lane and dispatch details; BOF shows the remaining work is normal equipment staging, not a release blocker.",
        record: "comparison2064",
        stops: [
          ["Pickup", "Birmingham, AL", "Planning", "Equipment staging note attached"],
          ["Delivery", "Nashville, TN", "Planning", "POD required after delivery"]
        ],
        documents: [
          ["Rate confirmation", "Matched", "comparison2064"],
          ["BOL", "Ready", "comparison2064"],
          ["Equipment staging note", "Open", "comparison2064"]
        ],
        log: [
          ["06/06 10:10", "Load moved to ready planning", "comparison2064"],
          ["06/06 10:22", "BOF staging note attached", "comparison2064"]
        ]
      },
      {
        loadId: "bof-2175",
        tmsLoadId: "TMS-LD-2175",
        loadNumber: "MOB-2175",
        customer: "Atlanta Grocery Transfer",
        carrier: "Crossline Operations",
        driver: "Frank Miller / DRV-005",
        pickup: "Mobile, AL - 06/07 09:30",
        delivery: "Atlanta, GA - 06/07 18:00",
        equipment: "53 ft Dry Van",
        commodity: "Grocery freight",
        status: "Tender accepted",
        statusClass: "review",
        tab: "active",
        docs: "Rate review",
        accounting: "BOF review required",
        bofFile: "BOF-2175",
        summary: "Partner TMS shows the tender and lane; BOF keeps the rate confirmation match visible before release.",
        record: "comparison2175",
        stops: [
          ["Pickup", "Mobile, AL", "Appointment open", "Rate confirmation must match lane"],
          ["Delivery", "Atlanta, GA", "Planned", "Delivery proof required after delivery"]
        ],
        documents: [
          ["Rate confirmation", "Review", "comparison2175"],
          ["BOL", "Uploaded", "comparison2175"],
          ["Driver confirmation", "Uploaded", "driver005"]
        ],
        log: [
          ["06/06 10:24", "Rate review alert created", "comparison2175"],
          ["06/06 10:31", "BOF document desk opened match record", "comparison2175"]
        ]
      },
      {
        loadId: "bof-2258",
        tmsLoadId: "TMS-LD-2258",
        loadNumber: "SHV-2258",
        customer: "Jackson Retail Forwarding",
        carrier: "RoadPro Logistics",
        driver: "Priya Patel / DRV-006",
        pickup: "Shreveport, LA - 06/08 08:00",
        delivery: "Jackson, MS - 06/08 15:00",
        equipment: "53 ft Dry Van",
        commodity: "Retail replenishment",
        status: "Planning",
        statusClass: "watch",
        tab: "planning",
        docs: "Renewal watch",
        accounting: "Not ready",
        bofFile: "BOF-2258",
        summary: "Partner TMS can keep the planned lane in the board, while BOF keeps driver renewal evidence visible before assignment commitment.",
        record: "driver006",
        stops: [
          ["Pickup", "Shreveport, LA", "Planning", "Driver renewal evidence remains on watch"],
          ["Delivery", "Jackson, MS", "Planning", "POD not yet required"]
        ],
        documents: [
          ["Rate confirmation", "Uploaded", "comparison2258"],
          ["Driver renewal evidence", "Watch", "driver006"],
          ["BOL", "Not yet required", "comparison2258"]
        ],
        log: [
          ["06/06 10:28", "Renewal watch added", "driver006"],
          ["06/06 10:33", "Planning remains uncommitted", "comparison2258"]
        ]
      }
    ];

    var decisions = {
      review: {
        status: "Review",
        statusClass: "review",
        metricReady: "1",
        metricHolds: "1",
        counterReview: "2",
        counterHold: "1",
        counterReleased: "1",
        queueNextAction: "Review import",
        packetStatus: "Complete",
        packetStatusClass: "ready",
        packetBolStatus: "Docs under review",
        packetDecision: "Pending",
        packetDecisionDate: "-",
        summary: "BOF is reviewing the TMS import against driver match, carrier packet, load documents, and exception ownership. Choose the release outcome that matches the readiness record.",
        headline: "Partner import review is open.",
        note: "S. Turner must confirm the BOF-RR-10482 readiness packet before dispatch can act on TMS-LD-10482.",
        linkText: "Open readiness packet",
        consequence: "Release waits on BOF readiness review.",
        next: "Review the imported load, documents, driver match, and carrier packet.",
        auditText: "Partner import review remains open.",
        handoff: ["Release waits on BOF readiness review.", "Decision pending; release packet under review.", "Carrier packet is ready; no carrier blocker active.", "POD, GPS, receiver signature, dock photo, and empty cargo proof remain tracked after delivery."]
      },
      approved: {
        status: "Ready to Release",
        statusClass: "ready",
        metricReady: "2",
        metricHolds: "1",
        counterReview: "1",
        counterHold: "1",
        counterReleased: "2",
        queueNextAction: "Release ready",
        packetStatus: "Ready",
        packetStatusClass: "ready",
        packetBolStatus: "Docs cleared",
        packetDecision: "Ready to Release",
        packetDecisionDate: "06/06/2026 10:42",
        summary: "BOF readiness cleared the imported TMS load. TMS-LD-10482 can move forward with the release record and simulated handoff attached.",
        headline: "TMS-LD-10482 is ready to release.",
        note: "Driver match, carrier packet, insurance, agreement, rate confirmation, pickup instructions, and BOL image review are aligned. REL-10482 can be kept with the operations record.",
        linkText: "Open handoff record",
        consequence: "Dallas-to-Memphis can move with record-backed approval.",
        next: "Mark TMS-LD-10482 ready and keep the simulated handoff attached.",
        auditText: "Ready to Release decision and handoff record updated.",
        handoff: ["Dispatch can commit TMS-LD-10482 with REL-10482-DECISION attached.", "Customer-facing note can show release ready with packet retained.", "Carrier receives release-ready instruction with packet references attached.", "Settlement stays ready to collect POD, GPS, receiver signature, dock photo, and empty cargo proof after delivery."]
      },
      rejected: {
        status: "Hold - Action Required",
        statusClass: "blocked",
        metricReady: "1",
        metricHolds: "2",
        counterReview: "1",
        counterHold: "2",
        counterReleased: "1",
        queueNextAction: "Resolve blocker",
        packetStatus: "Blocked",
        packetStatusClass: "blocked",
        packetBolStatus: "Action required",
        packetDecision: "Hold - Action Required",
        packetDecisionDate: "06/06/2026 10:42",
        summary: "BOF found a readiness blocker. The load stays held until the owner resolves the missing or corrected record.",
        headline: "TMS-LD-10482 is on Hold - Action Required.",
        note: "The lane is protected from a bad release decision. S. Turner owns the blocker note and keeps the BOF-RR-10482 review open until the record clears.",
        linkText: "Open blocker record",
        consequence: "Load stays held until BOF readiness clears.",
        next: "Assign the blocker owner, collect the corrected record, and re-open review.",
        auditText: "Hold - Action Required decision and owner note recorded.",
        handoff: ["Dispatch must not commit TMS-LD-10482 until the corrected record clears.", "Customer-facing note stays internal until blocker is resolved.", "Carrier follow-up requests the corrected BOL capture or required packet correction.", "Settlement and claim review stay on hold because the release packet is blocked."]
      },
      early: {
        status: "Release With Condition",
        statusClass: "watch",
        metricReady: "2",
        metricHolds: "1",
        counterReview: "1",
        counterHold: "1",
        counterReleased: "2",
        queueNextAction: "Track condition",
        packetStatus: "Complete",
        packetStatusClass: "ready",
        packetBolStatus: "Condition attached",
        packetDecision: "Release With Condition",
        packetDecisionDate: "06/06/2026 10:42",
        summary: "BOF allows the imported load to release while keeping the post-trip document condition visible and owned.",
        headline: "TMS-LD-10482 can release with a tracked condition.",
        note: "No legal or compliance blocker is active, but BOF keeps the follow-up document condition attached to the release and simulated handoff record.",
        linkText: "Open conditional release record",
        consequence: "Load can move with the condition and owner attached.",
        next: "Release with condition and keep the handoff note assigned.",
        auditText: "Release-with-condition decision recorded.",
        handoff: ["Dispatch may commit the load with the condition visible in the release note.", "Customer-facing note can show release moving with a tracked follow-up.", "Carrier receives the condition and post-trip proof requirement in the handoff note.", "Settlement stays on watch for POD, GPS, receiver signature, dock photo, and empty cargo proof."]
      }
    };

    var roleLenses = {
      owner: {
        title: "Fleet owner view",
        body: "Shows the release decision, blocker consequence, owner next action, and what changes for dispatch and settlement.",
        proof: "Decision, consequence, audit trail, and handoff note",
        record: "release",
        label: "Release Decision"
      },
      dispatch: {
        title: "Dispatcher view",
        body: "Shows route status, driver assignment, carrier packet, pre-trip gate, document gate, and post-trip proof requirements.",
        proof: "Route, driver, carrier, pre-trip, document gate, and POD/photo follow-up",
        record: "dispatchView",
        label: "Dispatch View"
      },
      safety: {
        title: "Safety desk view",
        body: "Shows which driver files are ready, on watch, or held, and why a credential problem changes dispatch eligibility.",
        proof: "Driver file, medical card, MVR, clearinghouse, renewal watch, and hold consequence",
        record: "driver",
        label: "Driver File"
      },
      carrier: {
        title: "Carrier operations view",
        body: "Shows authority, insurance, agreement, W-9, operations contact, lane confirmation, and exception owner without exposing another carrier's employee files.",
        proof: "Carrier packet readiness, insurance, agreement, W-9, contact, and lane confirmation",
        record: "carrier",
        label: "Carrier Packet"
      },
      settlement: {
        title: "Settlement and claims view",
        body: "Shows load revenue, driver pay method, protected deductions, proof requirements, and why a settlement hold stays open until required documents clear.",
        proof: "Revenue, driver pay, deductions, POD/signature/receipt holds, compliance incentive, and protected payroll references",
        record: "settlement",
        label: "Settlement Desk"
      }
    };

    var docs = {
      bol: {
        title: "Imported Load Documents",
        meta: "BOF-RR-10482-DOCS",
        owner: "Owner: S. Turner",
        status: "Review",
        statusClass: "review",
        heading: "Partner Import Document Gate",
        labels: ["Imported load", "Required review", "Record state", "Consequence"],
        fields: ["TMS-LD-10482 / BOF-RR-10482", "Pickup instructions, BOL, seal photo, delivery proof, and claim evidence state", "BOF readiness review", "Controls release outcome"],
        parties: [
          ["SHIPPER", "Nexus Components, Inc.", "500 Industrial Blvd.", "Dallas, TX 75201"],
          ["CONSIGNEE", "Memphis Distribution Yard", "Riverfront Logistics Park", "Memphis, TN 38118"]
        ],
        ledgerHeads: ["Partner document", "Document detail", "Status"],
        ledgerRows: [
          ["TMS import", "TMS-LD-10482 accepted into BOF-RR-10482", "Imported"],
          ["Pickup instructions", "Appointment and lane requirements attached", "Present"],
          ["Signed BOL image", "BOL-10482-IMG-02 received 06/05/2026 09:24", "Review"],
          ["Seal photo", "Seal evidence attached for load packet", "Present"],
          ["Delivery proof", "Not yet required; owner will track after delivery", "Watch"],
          ["Claim evidence", "No claim open; claim support folder CLM-STANDBY-10482 is ready if an exception opens", "Clear"]
        ],
        signature: ["Shipper Signature / Date", "J. Ramirez", "06/05/2026 09:15"],
        note: "This document gate shows the imported TMS paperwork and BOF-owned review state. The BOL remains important, but the release decision comes from the full BOF readiness packet."
      },
      pretrip: {
        title: "Pre-Trip Release Packet",
        meta: "PRETRIP-10482",
        owner: "Owner: Dispatch desk",
        status: "Ready",
        statusClass: "ready",
        heading: "Trip Takeoff Review",
        labels: ["Load", "Trip packet", "Readiness result", "Next action"],
        fields: ["TMS-LD-10482 / BOF-RR-10482", "Rate, work schedule, pickup, assignment, equipment, cargo, and seal", "Ready for release review", "S. Turner confirms final release outcome"],
        parties: [
          ["DISPATCH", "Delta Dispatch Desk", "Dallas, TX pickup staging", "Owner: S. Turner"],
          ["DRIVER / CARRIER", "DRV-001 / CAR-118", "John Carter / RoadPro Logistics", "Dry van assignment"]
        ],
        ledgerHeads: ["Pre-trip item", "Record detail", "Status"],
        ledgerRows: [
          ["Rate confirmation", "RC-10482 matched to TMS-LD-10482, lane, carrier, and dates.", "Ready"],
          ["Work schedule", "WS-10482 shows pickup 06/06/2026 08:00-10:00 and delivery 16:00-18:00.", "Filed"],
          ["Pickup instructions", "PU-10482 includes south-gate access, Dock 4 contact, load number, and driver instructions.", "Filed"],
          ["Dispatch assignment", "DRV-001, CAR-118, dry van trailer TRL-118-07, Dallas to Memphis lane.", "Ready"],
          ["Tire / equipment inspection", "EQ-10482 shows tractor, trailer, tires, lights, doors, and ELD/mobile check complete.", "Pass"],
          ["Cargo inspection before loading", "CARGO-10482 verifies 24 pallets staged, packaging intact, no shortage noted before load.", "Pass"],
          ["Loaded cargo / dock proof", "LOADPHOTO-10482 attached after dock loading; visual proof is available in this packet.", "Attached"],
          ["Seal record", "SEAL-TX-10482-771 captured at pickup departure with Dallas yard location.", "Filed"],
          ["Takeoff decision", "Trip can take off after BOF readiness decision; no pre-trip blocker shown.", "Ready"]
        ],
        proofTiles: [
          ["Assignment", "DRV-001 / TRL-118-07", "Driver, carrier, trailer, and lane are aligned"],
          ["Pickup", "PU-10482 / Dock 4", "Window, contact, gate, and instructions filed"],
          ["Inspection", "EQ-10482 PASS", "Tires, lights, doors, trailer, and ELD/mobile checked"],
          ["Loaded cargo", "LOADPHOTO-10482", "Palletized cargo and dock-loading state attached"],
          ["Seal", "SEAL-TX-10482-771", "Seal record filed for dispute support"]
        ],
        artifact: {
          kind: "photo",
          image: "/assets/images/documents/load-proof/pretrip-10482-loaded-cargo.webp",
          alt: "Wrapped palletized freight inside dry van trailer during loading",
          caption: "Driver mobile capture: loaded cargo and dock-loading state before departure.",
          details: [
            ["Photo ID", "LOADPHOTO-10482"],
            ["Timestamp", "06/06/2026 07:36 CST"],
            ["Location", "Dallas pickup dock"],
            ["Source", "Driver mobile capture"],
            ["Cargo state", "Wrapped pallets staged inside trailer"],
            ["Release effect", "Supports takeoff review"]
          ]
        },
        signature: ["Dispatch Signoff / Date", "S. Turner / J. Carter", "06/06/2026 07:42"],
        note: "The pre-trip packet answers whether the trip can take off: rate, work schedule, pickup instructions, dispatch assignment, equipment inspection, cargo inspection, seal record, owner, and next action are all visible before release."
      },
      transit: {
        title: "In-Transit Operating Packet",
        meta: "TRANSIT-10482",
        owner: "Owner: Dispatch desk",
        status: "Watch",
        statusClass: "watch",
        heading: "Route And Safety Watch",
        labels: ["Load", "Current lane", "Operating state", "Next action"],
        fields: ["TMS-LD-10482", "I-30 eastbound toward Memphis", "On track with watch notes", "Dispatch monitors route, HOS, fuel, and safety event"],
        parties: [
          ["ROUTE", "Dallas, TX to Memphis, TN", "Current check: Texarkana corridor", "ETA 16:42 CST"],
          ["DRIVER", "DRV-001 / John Carter", "Dry van TRL-118-07", "Dispatch owner: S. Turner"]
        ],
        ledgerHeads: ["Transit item", "Operating detail", "Status"],
        ledgerRows: [
          ["GPS lane", "Current simulated position: I-30 eastbound near Texarkana; 238 mi remaining to Memphis.", "On track"],
          ["Route deviation", "Seven-mile construction detour active near I-30 exit 216; approved route note retained.", "Watch"],
          ["Alternate route decision", "AR-ALT-10482 uses US-70 connector if weather cell blocks I-40 approach; dispatch approval required.", "Prepared"],
          ["HOS availability", "HOS window remains sufficient for delivery estimate; driver rest risk not active in this scenario.", "Clear"],
          ["OOS / compliance concern", "No out-of-service condition shown; escalate to safety desk if inspection or HOS event changes.", "Clear"],
          ["Safety event monitoring", "Following-distance watch event EVT-10482-FD logged; coach note assigned, no release hold.", "Watch"],
          ["Fuel status", "Fuel plan shows 61 percent remaining, planned stop at West Memphis, no delivery risk.", "Clear"],
          ["Track answer", "Load remains on track; dispatch monitors detour, weather, HOS, fuel, and safety watch.", "Watch"]
        ],
        proofTiles: [
          ["GPS", "I-30 / Texarkana", "Lane and current position visible"],
          ["Deviation", "DEV-10482-07MI", "Construction detour approved for seven miles"],
          ["HOS / Fuel", "Clear / 61%", "Delivery feasible; fuel stop planned"],
          ["Safety Watch", "EVT-10482-FD", "Following-distance coach note assigned"]
        ],
        signature: ["Dispatch Monitor / Date", "S. Turner", "06/06/2026 12:18"],
        note: "The in-transit packet answers whether the load is still on track: GPS lane, deviation reason, alternate route decision, HOS availability, compliance state, safety event, fuel status, owner, and next action are visible in one record."
      },
      rate: {
        title: "Rate Confirmation",
        meta: "RC-10482",
        owner: "Owner: Document desk",
        status: "Ready",
        statusClass: "ready",
        heading: "Rate Confirmation Summary",
        labels: ["Load", "Lane", "Rate status", "Dispatch use"],
        fields: ["TMS-LD-10482", "Dallas, TX to Memphis, TN", "Matched to packet", "Supports release review"],
        parties: [
          ["BROKER", "Delta Advanced Trucking", "Fleet workspace region: Dallas, TX", "Protected fictional identifiers used for buyer review"],
          ["CARRIER", "RoadPro Logistics", "Carrier packet CAR-118", "Dispatch desk confirmed"]
        ],
        ledgerHeads: ["Rate item", "Amount / instruction", "Status"],
        ledgerRows: [
          ["Line haul", "$2,850.00", "Confirmed"],
          ["Fuel surcharge", "$420.00", "Confirmed"],
          ["Pickup window", "06/06/2026 08:00-10:00", "Confirmed"],
          ["Delivery window", "06/06/2026 16:00-18:00", "Confirmed"],
          ["Accessorial review", "None open for release", "Clear"],
          ["Packet match", "Load ID, lane, carrier, and dates aligned", "Ready"]
        ],
        signature: ["Carrier Acceptance / Date", "R. Collins", "06/05/2026 08:42"],
        note: "The rate confirmation is matched to the load packet and does not block the release decision."
      },
      driver: {
        title: "Driver File",
        meta: "DRV-001",
        owner: "Owner: Safety desk",
        status: "Ready",
        statusClass: "ready",
        heading: "Driver Readiness Record",
        labels: ["Driver", "Eligibility", "Medical card", "Dispatch use"],
        fields: ["DRV-001 - John Carter", "Eligible for assignment", "Current", "Does not block TMS-LD-10482"],
        parties: [
          ["DRIVER", "John Carter", "Driver ID DRV-001", "Assigned to TMS-LD-10482"],
          ["SAFETY REVIEW", "Delta Safety Desk", "Credential review queue", "Cleared for release review"]
        ],
        ledgerHeads: ["Credential", "Record detail", "Status"],
        ledgerRows: [
          ["Driver license image", "License front/back image filed with fictional review ref CDL-DRV001-2026A", "Current"],
          ["CDL", "Class A CDL and endorsement summary filed", "Current"],
          ["Medical card", "Reviewed for 06/06/2026 dispatch", "Current"],
          ["MCSA exam summary", "Examiner certificate status attached", "Current"],
          ["MVR review", "No open release blocker", "Clear"],
          ["Clearinghouse query", "No dispatch hold in session", "Clear"],
          ["Drug and alcohol policy", "Acknowledgement filed", "Filed"],
          ["Safety acknowledgements", "Driver safety rules and reporting acknowledgement filed", "Filed"],
          ["ELD/mobile acknowledgement", "Driver app and HOS reporting acknowledgement filed", "Filed"],
          ["Employment application", "Application packet present", "Filed"],
          ["Resume/work history", "Work history reviewed for fleet file", "Filed"],
          ["Prior employer inquiry", "Prior employer safety inquiry tracked", "Filed"],
          ["Road test certificate", "Road test record attached", "Filed"],
          ["Annual review", "Annual driver review status visible", "Filed"],
          ["Emergency contact", "Emergency contact and driver communication details filed", "Filed"],
          ["Tax status", "Tax/pay setup tracked by protected ref BOF-TAX-DRV001-A", "Filed"],
          ["Payment setup", "Settlement preference and pay contact tracked by BOF-PAY-DRV001-A", "Ready"],
          ["Bank/settlement setup", "Settlement method verified by protected ref BOF-SETTLE-DRV001-A", "Ready"],
          ["Dispatch eligibility", "Eligible for TMS-LD-10482", "Ready"],
          ["Current assignment", "Assigned to Dallas to Memphis release review", "Ready"]
        ],
        signature: ["Safety Reviewer / Date", "L. Bennett", "06/05/2026 09:12"],
        note: "Driver readiness is current for this release review. The driver record stays linked so dispatch can see why the lane is eligible."
      },
      carrier: {
        title: "Carrier Packet",
        meta: "CAR-118",
        owner: "Owner: Carrier operations",
        status: "Ready",
        statusClass: "ready",
        heading: "Carrier Packet Readiness",
        labels: ["Carrier", "Agreement", "W-9", "Packet reach"],
        fields: ["CAR-118 - RoadPro Logistics", "Present", "Present", "TMS-LD-10482, BOF-2064, BOF-2258"],
        parties: [
          ["CARRIER", "RoadPro Logistics", "Carrier ID CAR-118", "Packet owner: carrier operations"],
          ["BROKER REVIEW", "Delta Advanced Trucking", "BOF release review", "Three active queue links attached"]
        ],
        ledgerHeads: ["Packet item", "Record detail", "Status"],
        ledgerRows: [
          ["Broker-carrier agreement", "AGR-CAR-118 attached", "Present"],
          ["W-9 record", "Stored with carrier packet", "Present"],
          ["Insurance certificate", "INS-CAR-118 current", "Ready"],
          ["Authority check", "No release review exception", "Clear"],
          ["Carrier contact", "RoadPro operations desk attached", "Ready"],
          ["Dispatch eligibility", "Supports TMS-LD-10482, BOF-2064, and BOF-2258", "Ready"]
        ],
        signature: ["Packet Reviewer / Date", "D. Patel", "06/05/2026 09:18"],
        note: "Carrier readiness is complete enough for the primary TMS-LD-10482 release decision and the additional CAR-118 queue links. Sensitive packet details stay protected while readiness remains clear."
      },
      insurance: {
        title: "Insurance Record",
        meta: "INS-CAR-118",
        owner: "Owner: Carrier operations",
        status: "Ready",
        statusClass: "ready",
        heading: "Insurance Verification",
        labels: ["Carrier", "Insurance state", "Review result", "Dispatch use"],
        fields: ["CAR-118", "Current", "Meets release review", "Does not block TMS-LD-10482"],
        parties: [
          ["INSURED CARRIER", "RoadPro Logistics", "Carrier ID CAR-118", "Certificate attached to packet"],
          ["CERTIFICATE HOLDER", "Delta Advanced Trucking", "BOF release review", "Reviewed for TMS-LD-10482"]
        ],
        ledgerHeads: ["Coverage item", "Review note", "Status"],
        ledgerRows: [
          ["Auto liability", "Certificate present for packet review", "Current"],
          ["Cargo coverage", "Meets release review", "Current"],
          ["General liability", "Attached to carrier packet", "Current"],
          ["Expiration check", "No release blocker in this session", "Clear"],
          ["Carrier match", "Certificate tied to CAR-118", "Matched"],
          ["Dispatch use", "Does not block TMS-LD-10482", "Ready"]
        ],
        signature: ["Insurance Reviewer / Date", "D. Patel", "06/05/2026 09:19"],
        note: "The insurance record is current for the carrier packet and remains attached to the operations record."
      },
      agreement: {
        title: "Agreement Record",
        meta: "AGR-CAR-118",
        owner: "Owner: Carrier operations",
        status: "Ready",
        statusClass: "ready",
        heading: "Agreement and W-9 Record",
        labels: ["Carrier", "Agreement", "W-9", "Packet use"],
        fields: ["CAR-118", "Present", "Present", "Supports release review"],
        parties: [
          ["BROKER", "Delta Advanced Trucking", "Fleet workspace region: Dallas, TX", "Protected fictional identifiers used for buyer review"],
          ["CARRIER", "RoadPro Logistics", "Agreement AGR-CAR-118", "Packet ready for TMS-LD-10482"]
        ],
        ledgerHeads: ["Agreement item", "Record detail", "Status"],
        ledgerRows: [
          ["Broker-carrier agreement", "AGR-CAR-118", "Present"],
          ["W-9", "Stored with packet", "Present"],
          ["Dispatch terms", "BOF readiness review only", "Aligned"],
          ["Carrier contact", "RoadPro Desk", "Present"],
          ["Packet owner", "Carrier operations", "Assigned"],
          ["Release effect", "Does not block TMS-LD-10482", "Ready"]
        ],
        signature: ["Carrier Packet Signoff / Date", "R. Collins", "06/04/2026 16:30"],
        note: "Agreement and W-9 records are present, so the carrier packet does not block the dispatch decision."
      },
      release: {
        title: "Simulated Handoff Record",
        meta: "REL-10482-DECISION",
        owner: "Owner: S. Turner",
        status: "Review",
        statusClass: "review",
        heading: "Release Decision And Handoff Note",
        labels: ["Load", "Decision state", "Readiness packet", "Next action"],
        fields: ["TMS-LD-10482", "Review", "BOF-RR-10482", "Finish BOF readiness review"],
        parties: [
          ["DECISION OWNER", "S. Turner", "Operations lead", "BOF readiness authority"],
          ["SIMULATED HANDOFF", "TMS-LD-10482", "Dallas, TX to Memphis, TN", "Decision shown locally in the demo"]
        ],
        ledgerHeads: ["Release item", "Current decision", "Status"],
        ledgerRows: [
          ["Driver file", "DRV-001 eligible", "Complete"],
          ["Carrier packet", "CAR-118 ready", "Complete"],
          ["Insurance", "INS-CAR-118 current", "Complete"],
          ["Rate confirmation", "RC-10482 matched", "Complete"],
          ["Imported documents", "Pickup instructions, BOL, seal photo, delivery proof state", "Review"],
          ["Demo handoff", "Decision payload shown inside BOF", "Pending"]
        ],
        signature: ["Decision Owner / Date", "S. Turner", "Pending"],
        note: "The handoff note records the current BOF decision state and keeps dispatch tied to the owner, blocker, next action, and audit trail."
      },
      comparison1907: {
        title: "BOF-1907 Watch Record",
        meta: "BOF-1907",
        owner: "Owner: M. Ruiz",
        status: "Watch",
        statusClass: "watch",
        heading: "Tulsa to Kansas City Watch Record",
        labels: ["Load", "Lane", "Control", "Next action"],
        fields: ["BOF-1907", "Tulsa to Kansas City", "BOL photo and renewal check", "Review before committing release"],
        parties: [
          ["LOAD", "BOF-1907", "Tulsa, OK", "Kansas City, MO"],
          ["OWNER", "M. Ruiz", "Watch queue", "POD follow-up"]
        ],
        ledgerHeads: ["Watch item", "Record detail", "Status"],
        ledgerRows: [["POD", "Follow-up pending", "Watch"], ["Carrier", "CAR-204 renewal check", "Watch"], ["Dispatch", "Prepare but do not release", "Review"]],
        signature: ["Watch Owner / Date", "M. Ruiz", "06/06/2026 10:10"],
        note: "This comparison row shows how BOF keeps lower-priority release questions visible without taking the buyer out of the command center."
      },
      pod1907: {
        title: "Proof Of Delivery Packet",
        meta: "POD-1907",
        owner: "Owner: M. Ruiz",
        status: "Watch",
        statusClass: "watch",
        heading: "POD Evidence Review",
        labels: ["Load", "Delivery state", "Proof requirement", "Settlement effect"],
        fields: ["BOF-1907", "Delivered; proof follow-up open", "POD, GPS, receiver, dock, and empty trailer evidence", "Settlement remains on watch"],
        parties: [
          ["SHIPPER", "Tulsa Fabrication Dock 4", "Tulsa, OK", "Pickup completed 06/05/2026 14:20"],
          ["RECEIVER", "Kansas City Consolidation Yard", "Kansas City, MO", "Receiver desk: N. Harper"]
        ],
        ledgerHeads: ["POD evidence", "Document detail", "Status"],
        ledgerRows: [
          ["Delivery timestamp", "06/06/2026 08:18 CST captured from receiver check-in.", "Needs confirmation"],
          ["GPS/location", "Yard geofence match KC-CONS-DOCK-07; coordinates retained in delivery record.", "Needs confirmation"],
          ["Receiver/signature", "N. Harper receiver signoff expected on POD-1907-SIG.", "Needed"],
          ["Signed BOL link", "BOL-1907-SIGNED-IMG is attached to the POD packet.", "Review"],
          ["Dock photo", "POD-1907-DOCK-IMG shows trailer at Dock 7.", "Attached"],
          ["Empty trailer photo", "POD-1907-EMPTY-IMG shows clear trailer after unload.", "Attached"],
          ["Driver note", "Dock delay cleared; no shortage reported at first review.", "Filed"],
          ["Settlement effect", "Settlement release stays on watch until timestamp, GPS, signature, and photos clear.", "Watch"],
          ["Claim effect", "No claim open; photo packet supports response if an exception opens.", "Standby"],
          ["Next action", "M. Ruiz confirms or attaches the missing POD evidence.", "Owner"]
        ],
        proofTiles: [
          ["Signed BOL", "BOL-1907-SIGNED-IMG", "Attached; needs final receiver-signature match"],
          ["GPS / Location", "KC-CONS-DOCK-07", "Geofence match pending dispatcher confirmation"],
          ["Dock Photo", "POD-1907-DOCK-IMG", "Delivery dock proof image attached for review"],
          ["Empty Trailer", "POD-1907-EMPTY-IMG", "Post-unload cargo proof image attached for review"]
        ],
        signature: ["Receiver / Delivery Review", "N. Harper / M. Ruiz", "06/06/2026 08:18"],
        note: "This POD packet keeps the delivery timestamp, GPS/location, receiver signature, signed BOL, dock photo, empty trailer photo, notes, settlement watch, claim standby, owner, and next action together in one inspectable record."
      },
      posttrip: {
        title: "Post-Trip Closeout Packet",
        meta: "POSTTRIP-1907",
        owner: "Owner: M. Ruiz",
        status: "Watch",
        statusClass: "watch",
        heading: "Delivery Closeout Review",
        labels: ["Load", "Closeout state", "Settlement state", "Next action"],
        fields: ["BOF-1907", "Delivered; closeout review open", "Settlement release on watch", "Confirm signed BOL, POD, receiver, GPS, and photo proof"],
        parties: [
          ["RECEIVER", "Kansas City Consolidation Yard", "Kansas City, MO", "Receiver desk: N. Harper"],
          ["CLOSEOUT OWNER", "M. Ruiz", "Document and settlement watch", "BOF-1907"]
        ],
        ledgerHeads: ["Closeout item", "Record detail", "Status"],
        ledgerRows: [
          ["POD summary", "POD-1907 shows delivered state with closeout proof still under review.", "Watch"],
          ["Receiver/signature", "N. Harper receiver signoff is expected on POD-1907-SIG.", "Needed"],
          ["Signed BOL", "BOL-1907-SIGNED-IMG is linked to the delivery closeout review.", "Review"],
          ["Delivery timestamp", "06/06/2026 08:18 CST captured from receiver check-in.", "Needs confirmation"],
          ["GPS/location", "KC-CONS-DOCK-07 geofence match is retained with POD-1907.", "Needs confirmation"],
          ["Dock photo", "POD-1907-DOCK-IMG is attached for delivery-location proof review.", "Attached"],
          ["Empty trailer photo", "POD-1907-EMPTY-IMG is attached for post-unload proof review.", "Attached"],
          ["Lumper receipt", "No lumper service was required for this receiver lane.", "Not required"],
          ["Settlement release", "Settlement remains on watch until POD, timestamp, location, signature, and photos clear.", "Watch"],
          ["Claim/dispute", "No claim is open; claim folder stays ready for shortage, damage, late arrival, seal dispute, or receiver exception.", "Standby"]
        ],
        proofTiles: [
          ["POD", "POD-1907", "Delivered state with proof follow-up open"],
          ["Receiver / Signature", "POD-1907-SIG", "Receiver signoff assigned to N. Harper"],
          ["Timestamp / Location", "06/06/2026 08:18 / KC-CONS-DOCK-07", "Delivery time and geofence retained for confirmation"],
          ["Settlement / Claim", "Watch / standby", "Payment waits on proof; claim folder is ready only if an exception opens"]
        ],
        signature: ["Closeout Review / Date", "N. Harper / M. Ruiz", "06/06/2026 08:18"],
        note: "This post-trip packet ties delivery proof to settlement and claims handling: POD, receiver signature, timestamp, location, photo records, lumper state, owner, and next action stay in one closeout view."
      },
      signedbol1907: {
        title: "Signed BOL Delivery Signoff",
        meta: "BOL-1907-SIGNED-IMG",
        owner: "Owner: M. Ruiz",
        status: "Review",
        statusClass: "watch",
        heading: "Signed Delivery BOL",
        labels: ["Load", "Document type", "Receiver signoff", "Settlement effect"],
        fields: ["BOF-1907", "Signed BOL closeout record", "N. Harper / Kansas City Consolidation Yard", "Settlement stays on watch until final proof match"],
        parties: [
          ["SHIPPER", "Tulsa Fabrication Dock 4", "Tulsa, OK", "Pickup completed 06/05/2026 14:20"],
          ["RECEIVER", "Kansas City Consolidation Yard", "Kansas City, MO", "Dock 7 delivery desk"]
        ],
        ledgerHeads: ["BOL field", "Signed record detail", "Status"],
        ledgerRows: [
          ["BOL number", "BOL-1907-TUL-KC", "Filed"],
          ["Load", "BOF-1907 / Tulsa to Kansas City", "Matched"],
          ["Delivery date", "06/06/2026 08:18 CST", "Review"],
          ["Receiver", "N. Harper, receiver desk", "Signed"],
          ["OS&D note", "No shortage or damage noted at first review.", "Clear"],
          ["Settlement effect", "Payment remains on watch until BOL, POD, GPS, dock photo, and empty trailer proof match.", "Watch"]
        ],
        artifact: {
          kind: "signedBol",
          stamp: "RECEIVED - DOCK 7",
          rows: [
            ["BOL No.", "BOL-1907-TUL-KC"],
            ["Carrier load", "BOF-1907"],
            ["Shipper", "Tulsa Fabrication Dock 4"],
            ["Receiver", "Kansas City Consolidation Yard"],
            ["Delivered", "06/06/2026 08:18 CST"],
            ["Pieces", "18 wrapped steel bins"],
            ["Condition", "No shortage or damage noted at first review"],
            ["Receiver", "N. Harper"]
          ]
        },
        signature: ["Receiver Signature / Date", "N. Harper", "06/06/2026 08:18"],
        note: "The signed BOL is its own closeout artifact so the buyer can inspect receiver signoff, delivered condition, OS&D note, settlement consequence, owner, and next action."
      },
      dockphoto1907: {
        title: "Dock Photo Evidence",
        meta: "POD-1907-DOCK-IMG",
        owner: "Owner: M. Ruiz",
        status: "Attached",
        statusClass: "ready",
        heading: "Delivery Location Photo",
        labels: ["Load", "Photo type", "Location", "Settlement effect"],
        fields: ["BOF-1907", "Dock 7 delivery-location proof", "Kansas City Consolidation Yard", "Supports settlement and claim response"],
        parties: [
          ["RECEIVER", "Kansas City Consolidation Yard", "Kansas City, MO", "Dock 7"],
          ["PHOTO OWNER", "M. Ruiz", "Post-trip closeout", "POD-1907"]
        ],
        ledgerHeads: ["Photo field", "Evidence detail", "Status"],
        ledgerRows: [
          ["Capture", "Trailer at Dock 7 delivery door.", "Attached"],
          ["Timestamp", "06/06/2026 08:21 CST.", "Filed"],
          ["Location", "KC-CONS-DOCK-07 geofence context.", "Matched"],
          ["Use", "Supports delivery-location proof and claim response if needed.", "Ready"]
        ],
        artifact: {
          kind: "photo",
          image: "/assets/images/documents/load-proof/pod-1907-dock-photo.webp",
          alt: "Dry van trailer backed into warehouse dock door 7",
          caption: "Driver mobile capture: trailer positioned at Dock 7 during delivery closeout.",
          details: [
            ["Photo ID", "POD-1907-DOCK-IMG"],
            ["Timestamp", "06/06/2026 08:21 CST"],
            ["Location", "KC-CONS-DOCK-07"],
            ["Source", "Driver mobile capture"],
            ["Settlement effect", "Supports delivery proof"],
            ["Claim effect", "Available if exception opens"]
          ]
        },
        signature: ["Photo Review / Date", "M. Ruiz", "06/06/2026 08:42"],
        note: "This photo artifact gives the closeout packet an inspectable delivery-location image with timestamp, location, source, owner, settlement effect, and claim effect."
      },
      emptyphoto1907: {
        title: "Empty Trailer Photo Evidence",
        meta: "POD-1907-EMPTY-IMG",
        owner: "Owner: M. Ruiz",
        status: "Attached",
        statusClass: "ready",
        heading: "Post-Unload Cargo Proof",
        labels: ["Load", "Photo type", "Condition", "Settlement effect"],
        fields: ["BOF-1907", "Empty trailer proof after unload", "Trailer clear after delivery", "Supports settlement and claim response"],
        parties: [
          ["RECEIVER", "Kansas City Consolidation Yard", "Kansas City, MO", "Unload complete"],
          ["PHOTO OWNER", "M. Ruiz", "Post-trip closeout", "POD-1907"]
        ],
        ledgerHeads: ["Photo field", "Evidence detail", "Status"],
        ledgerRows: [
          ["Capture", "Open dry van trailer interior after unload.", "Attached"],
          ["Timestamp", "06/06/2026 08:27 CST.", "Filed"],
          ["Condition", "Trailer clear; no remaining freight visible.", "Clear"],
          ["Use", "Supports settlement closeout and claim defense if a shortage dispute opens.", "Ready"]
        ],
        artifact: {
          kind: "photo",
          image: "/assets/images/documents/load-proof/pod-1907-empty-trailer.webp",
          alt: "Empty dry van trailer interior after unloading",
          caption: "Driver mobile capture: empty trailer after delivery unload.",
          details: [
            ["Photo ID", "POD-1907-EMPTY-IMG"],
            ["Timestamp", "06/06/2026 08:27 CST"],
            ["Condition", "Trailer clear after unload"],
            ["Source", "Driver mobile capture"],
            ["Settlement effect", "Supports payment release"],
            ["Claim effect", "Available if shortage dispute opens"]
          ]
        },
        signature: ["Photo Review / Date", "M. Ruiz", "06/06/2026 08:42"],
        note: "This empty-trailer artifact shows the post-unload state so settlement and claim handling are based on inspectable delivery proof instead of a status label."
      },
      comparison1931: {
        title: "BOF-1931 Hold Record",
        meta: "BOF-1931",
        owner: "Owner: Alex Kim",
        status: "Hold",
        statusClass: "blocked",
        heading: "Little Rock to St. Louis Hold Record",
        labels: ["Load", "Lane", "Control", "Next action"],
        fields: ["BOF-1931", "Little Rock to St. Louis", "Driver medical card hold", "Clear credential before release review"],
        parties: [
          ["LOAD", "BOF-1931", "Little Rock, AR", "St. Louis, MO"],
          ["OWNER", "Alex Kim", "Hold queue", "Credential correction"]
        ],
        ledgerHeads: ["Hold item", "Record detail", "Status"],
        ledgerRows: [["Driver", "DRV-003", "Hold"], ["Credential", "Medical-card record", "Blocked"], ["Dispatch", "Do not assign lane", "Held"]],
        signature: ["Hold Owner / Date", "Alex Kim", "06/06/2026 09:50"],
        note: "This hold record makes the dispatch consequence plain: the lane should not move until driver eligibility is restored."
      },
      comparison2064: {
        title: "BOF-2064 Ready Record",
        meta: "BOF-2064",
        owner: "Owner: Dispatch desk",
        status: "Release Ready",
        statusClass: "ready",
        heading: "Birmingham to Nashville Ready Record",
        labels: ["Load", "Lane", "Control", "Next action"],
        fields: ["BOF-2064", "Birmingham to Nashville", "Dispatch staging note", "Stage dispatch and keep ready note attached"],
        parties: [
          ["LOAD", "BOF-2064", "Birmingham, AL", "Nashville, TN"],
          ["OWNER", "Dispatch desk", "Ready queue", "Equipment timing"]
        ],
        ledgerHeads: ["Ready item", "Record detail", "Status"],
        ledgerRows: [["Driver", "DRV-004 reserve coverage", "Ready"], ["Carrier", "CAR-118 packet available", "Ready"], ["Dispatch", "Stage after equipment timing", "Ready"]],
        signature: ["Ready Owner / Date", "Dispatch desk", "06/06/2026 11:05"],
        note: "This ready row shows a lane that can move once dispatch confirms equipment timing and keeps the staging note attached."
      },
      comparison2175: {
        title: "BOF-2175 Rate Review",
        meta: "BOF-2175",
        owner: "Owner: Document desk",
        status: "Review",
        statusClass: "review",
        heading: "Mobile to Atlanta Review Record",
        labels: ["Load", "Lane", "Control", "Next action"],
        fields: ["BOF-2175", "Mobile to Atlanta", "Rate confirmation check", "Match the rate record before release"],
        parties: [
          ["LOAD", "BOF-2175", "Mobile, AL", "Atlanta, GA"],
          ["OWNER", "Document desk", "Review queue", "Rate confirmation"]
        ],
        ledgerHeads: ["Review item", "Record detail", "Status"],
        ledgerRows: [["Driver", "DRV-005 team-driver eligible", "Ready"], ["Carrier", "CAR-204 renewal watch visible", "Watch"], ["Rate", "Confirmation needs lane match", "Review"]],
        signature: ["Review Owner / Date", "Document desk", "06/06/2026 10:55"],
        note: "This review record keeps the rate confirmation question tied to the lane, driver, carrier, owner, and dispatch consequence."
      },
      comparison2258: {
        title: "BOF-2258 Renewal Watch",
        meta: "BOF-2258",
        owner: "Owner: Safety desk",
        status: "Watch",
        statusClass: "watch",
        heading: "Shreveport to Jackson Watch Record",
        labels: ["Load", "Lane", "Control", "Next action"],
        fields: ["BOF-2258", "Shreveport to Jackson", "Driver renewal watch", "Confirm DRV-006 renewal evidence"],
        parties: [
          ["LOAD", "BOF-2258", "Shreveport, LA", "Jackson, MS"],
          ["OWNER", "Safety desk", "Watch queue", "Renewal evidence"]
        ],
        ledgerHeads: ["Watch item", "Record detail", "Status"],
        ledgerRows: [["Driver", "DRV-006 renewal evidence due", "Watch"], ["Carrier", "CAR-118 packet available", "Ready"], ["Dispatch", "Plan only until evidence clears", "Watch"]],
        signature: ["Watch Owner / Date", "Safety desk", "06/06/2026 10:40"],
        note: "This watch row shows how a future dispatch can stay planned while the renewal evidence remains visible and owned."
      }
    };

    var driverDocumentVault = [
      {
        title: "CDL / license image",
        meta: "DRV-001-DOC-01",
        status: "Current",
        statusClass: "ready",
        owner: "Owner: Safety desk",
        detail: "Front and back CDL image with fictional credential reference for buyer review.",
        labels: ["Document type", "Driver", "CDL ref", "Dispatch effect"],
        fields: ["Commercial driver license scan", "John Carter / DRV-001", "CDL-DRV001-2026A", "Credential does not block TMS-LD-10482"],
        ledgerRows: [["Image side", "Front and back image captured; fictional credential reference visible.", "Filed"], ["Class", "Class A commercial driver license.", "Current"], ["Restrictions", "No visible restriction conflicts with dry van assignment.", "Clear"], ["Name match", "Driver record and assignment name match.", "Matched"], ["Review", "Safety desk reviewed before release queue opened.", "Complete"]],
        signature: ["Safety Reviewer / Date", "L. Bennett", "06/05/2026 09:12"],
        note: "The license image behaves like an inspectable credential record: image state, class, fictional CDL reference, owner, and dispatch consequence are visible.",
        artifact: {
          image: "/assets/images/documents/drivers/licenses/license-drv-001.png",
          alt: "John Carter commercial driver license record",
          caption: "Credential file image attached to the driver qualification packet.",
          details: [
            ["State", "OH"],
            ["License no.", "OH-CDL-7816-2043"],
            ["Expiration", "11/30/2027"],
            ["Class", "Class A / Dry van"],
            ["Address", "742 Lakebend Drive, Parma, OH 44129"],
            ["Artifact file", "license-drv-001.png"]
          ]
        }
      },
      {
        title: "Medical card",
        meta: "DRV-001-DOC-02",
        status: "Current",
        statusClass: "ready",
        owner: "Owner: Safety desk",
        detail: "Medical examiner certificate status for dispatch eligibility.",
        labels: ["Certificate", "Driver", "Expiration", "Dispatch rule"],
        fields: ["Medical examiner certificate", "John Carter / DRV-001", "12/31/2026", "Current certificate supports release review"],
        ledgerRows: [["Certificate holder", "Driver name matches BOF file.", "Matched"], ["Medical examiner", "Examiner review ref MEC-DRV001-2026Q4.", "Filed"], ["Expiration", "Current through active assignment window.", "Current"], ["Dispatch rule", "Do not release if this record expires or is rejected.", "Clear"], ["Reviewer", "Safety desk checked record against queue date.", "Complete"]],
        signature: ["Medical Review / Date", "L. Bennett", "06/05/2026 09:12"],
        note: "The medical-card record shows the release rule behind the driver decision through a fictional examiner reference."
      },
      {
        title: "MCSA exam summary",
        meta: "DRV-001-DOC-03",
        status: "Current",
        statusClass: "ready",
        owner: "Owner: Safety desk",
        detail: "Examiner certificate and exam summary status.",
        labels: ["Form", "Driver", "Exam result", "Use"],
        fields: ["MCSA exam summary", "John Carter / DRV-001", "Qualified; review ref MCSA-DRV001-0626", "Supports medical-card decision"],
        ledgerRows: [["Exam summary", "Exam summary attached to medical-card record.", "Filed"], ["Vision / hearing", "Pass status recorded under clinical detail ref MCSA-DRV001-VH.", "Filed"], ["Examiner certificate", "Certificate ref MEC-DRV001-2026Q4.", "Filed"], ["Medical decision", "Supports current medical-card state.", "Clear"], ["Audit use", "Safety desk can inspect during review.", "Ready"]],
        signature: ["Safety Reviewer / Date", "L. Bennett", "06/04/2026 15:22"],
        note: "The exam summary gives the medical-card decision a supporting source document."
      },
      {
        title: "MVR review",
        meta: "DRV-001-DOC-04",
        status: "Clear",
        statusClass: "ready",
        owner: "Owner: Safety desk",
        detail: "Motor vehicle record review for current assignment.",
        labels: ["Review type", "Driver", "Finding", "Dispatch effect"],
        fields: ["Annual/current MVR review", "John Carter / DRV-001", "No open release blocker", "Eligible review path"],
        ledgerRows: [["License standing", "Reviewed for dispatch eligibility.", "Clear"], ["Recent violations", "No open blocker shown in buyer view.", "Clear"], ["Accident review", "Retained in safety file.", "Filed"], ["Annual pull", "MVR review attached to driver packet.", "Filed"], ["Escalation", "Any future hold routes to safety desk.", "Owned"]],
        signature: ["MVR Reviewer / Date", "L. Bennett", "06/03/2026 14:40"],
        note: "The MVR document shows what was checked and why it matters to dispatch."
      },
      {
        title: "FMCSA / Clearinghouse compliance",
        meta: "DRV-001-DOC-05",
        status: "Clear",
        statusClass: "ready",
        owner: "Owner: Safety desk",
        detail: "FMCSA compliance and clearinghouse-style review state.",
        labels: ["Compliance record", "Driver", "Result", "Dispatch effect"],
        fields: ["FMCSA compliance review", "John Carter / DRV-001", "No dispatch hold shown", "Do not release if a hold appears"],
        ledgerRows: [["Compliance source", "FMCSA compliance record attached to driver file.", "Filed"], ["Clearinghouse-style review", "No dispatch hold shown in this session.", "Clear"], ["Protected reference", "CH-DRV001-2026-CLR attached for buyer review.", "Protected"], ["Assignment", "TMS-LD-10482 tied to review.", "Matched"], ["Retention", "Result retained in qualification file.", "Complete"]],
        signature: ["Safety Desk / Date", "L. Bennett", "06/05/2026 09:14"],
        note: "The compliance surface keeps the safety gate visible while protecting sensitive values."
      },
      {
        title: "W-9 record",
        meta: "DRV-001-DOC-06",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Back office",
        detail: "Tax document status with protected fictional tax reference.",
        labels: ["Tax record", "Driver", "Setup state", "Settlement effect"],
        fields: ["W-9 tax record", "John Carter / DRV-001", "Protected ref BOF-TAX-DRV001-A", "Resolve missing setup before settlement"],
        ledgerRows: [["Tax form status", "Protected ref BOF-TAX-DRV001-A filed.", "Filed"], ["Taxpayer reference", "Fictional buyer-review token retained instead of a real TIN.", "Protected"], ["Back-office owner", "Back office owns updates.", "Owned"], ["Settlement consequence", "Missing tax setup would block settlement follow-through.", "Clear"], ["Privacy", "No real taxpayer values are exposed.", "Protected"]],
        signature: ["Back Office Review / Date", "R. Miles", "06/01/2026 10:31"],
        note: "The W-9 record proves tax setup exists without exposing taxpayer values."
      },
      {
        title: "I-9 record",
        meta: "DRV-001-DOC-07",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Back office",
        detail: "Employment eligibility status from the driver packet.",
        labels: ["Eligibility form", "Driver", "Review state", "Privacy"],
        fields: ["I-9 employment eligibility", "John Carter / DRV-001", "Filed as BOF-I9-DRV001-A", "Identity values protected"],
        ledgerRows: [["Eligibility form", "I-9 record BOF-I9-DRV001-A present.", "Filed"], ["Identity reference", "Fictional verification token retained instead of real ID values.", "Protected"], ["Employment status", "Tracked by back office.", "Tracked"], ["Dispatch use", "Personnel file complete enough for owner inspection.", "Ready"], ["Owner", "Back office.", "Assigned"]],
        signature: ["Back Office Review / Date", "R. Miles", "06/01/2026 10:35"],
        note: "The I-9 record is represented as a status-and-owner surface with identity values protected."
      },
      {
        title: "Emergency contact",
        meta: "DRV-001-DOC-08",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Back office",
        detail: "Primary and secondary emergency contacts with fictional dispatch-safe channels.",
        labels: ["Contact card", "Driver", "Contact refs", "Dispatcher use"],
        fields: ["Emergency contact card", "John Carter / DRV-001", "EC-DRV001-A / EC-DRV001-B", "Available for urgent contact"],
        ledgerRows: [["Primary contact", "Andrea Carter via BOF emergency ext. 4108.", "Filed"], ["Secondary contact", "Michael Carter via BOF emergency ext. 4122.", "Filed"], ["Relationship", "Spouse and sibling references recorded.", "Filed"], ["Dispatcher access", "Available for urgent contact through BOF channel.", "Ready"], ["Privacy", "No real phone or home address values are exposed.", "Protected"]],
        signature: ["Back Office Review / Date", "R. Miles", "06/01/2026 10:25"],
        note: "The emergency-contact record is inspectable through fictional BOF emergency reference IDs."
      },
      {
        title: "Bank / settlement setup",
        meta: "DRV-001-DOC-09",
        status: "Ready",
        statusClass: "ready",
        owner: "Owner: Back office",
        detail: "Banking and settlement method status with protected fictional settlement reference.",
        labels: ["Settlement method", "Driver", "Settlement ref", "Next action"],
        fields: ["Bank and settlement setup", "John Carter / DRV-001", "BOF-SETTLE-DRV001-A", "Verify settlement channel before payment release"],
        ledgerRows: [["Settlement method", "ACH setup represented by BOF-SETTLE-DRV001-A.", "Filed"], ["Bank reference", "Fictional settlement token retained instead of account values.", "Protected"], ["Authorization", "Electronic authorization retained as AUTH-DRV001-ACH.", "Filed"], ["Settlement readiness", "Visible without exposing account values.", "Ready"], ["Next action", "Confirm protected settlement ref before payment release.", "Ready"]],
        signature: ["Back Office Review / Date", "R. Miles", "06/01/2026 10:39"],
        note: "The settlement setup acts like a real sensitive document: visible status, protected fictional reference, and clear handling instructions."
      },
      {
        title: "Insurance card",
        meta: "DRV-001-DOC-10",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Back office",
        detail: "Driver insurance card or insurance-related record from the driver packet.",
        labels: ["Insurance card", "Driver", "Review state", "Dispatch effect"],
        fields: ["Insurance card record", "John Carter / DRV-001", "Attached as INS-DRV001-CARD", "No insurance-card blocker shown"],
        ledgerRows: [["Insurance card", "Card INS-DRV001-CARD attached to driver packet.", "Filed"], ["Policy reference", "Fictional policy token BOF-INS-DRV001-A retained for review.", "Protected"], ["Review use", "Owner can inspect presence without exposing real policy details.", "Ready"], ["Dispatch effect", "No insurance-card blocker shown.", "Clear"], ["Owner", "Back office.", "Assigned"]],
        signature: ["Back Office Review / Date", "R. Miles", "06/01/2026 10:42"],
        note: "The insurance card is shown as a real packet item without exposing policy details."
      },
      {
        title: "DQF compliance summary",
        meta: "DRV-001-DOC-11",
        status: "Ready",
        statusClass: "ready",
        owner: "Owner: Safety desk",
        detail: "Driver qualification file compliance summary.",
        labels: ["Summary", "Driver", "Open items", "Next review"],
        fields: ["DQF compliance summary", "John Carter / DRV-001", "No open item shown", "Road test, work history, and inquiry included"],
        ledgerRows: [["Core DQF items", "CDL, medical card, MVR, FMCSA, emergency, road test, work history, prior employer inquiry, and qualification file.", "Represented"], ["Medical card considered", "Yes.", "Clear"], ["MVR considered", "Yes.", "Clear"], ["Road test / inquiry", "Road test, resume/work history, and prior employer inquiry are filed.", "Filed"], ["Owner", "Safety desk owns next review.", "Assigned"]],
        signature: ["Safety Review / Date", "L. Bennett", "06/04/2026 08:30"],
        note: "The DQF summary turns the driver file from a list into a managed readiness record."
      },
      {
        title: "Qualification file",
        meta: "DRV-001-DOC-12",
        status: "Ready",
        statusClass: "ready",
        owner: "Owner: Safety desk",
        detail: "Driver qualification file packet.",
        labels: ["Qualification file", "Driver", "Included records", "Dispatch effect"],
        fields: ["Qualification file", "John Carter / DRV-001", "Credential, medical, MVR, compliance, road test, work history, emergency, HR, settlement", "Ready for owner inspection"],
        ledgerRows: [["Credential records", "CDL/license and medical records represented.", "Filed"], ["Safety records", "MVR, FMCSA, road test, prior employer inquiry, and DQF summary represented.", "Filed"], ["HR records", "Application, work history, and acknowledgement records represented.", "Filed"], ["Settlement records", "Bank, W-9, and payment setup tracked through protected fictional refs.", "Protected"], ["Dispatch effect", "No driver blocker shown for TMS-LD-10482.", "Ready"]],
        signature: ["Safety Review / Date", "L. Bennett", "06/04/2026 08:35"],
        note: "The qualification file ties the separate documents into one owner-inspectable driver packet."
      },
      {
        title: "Employee handbook acknowledgement",
        meta: "DRV-001-DOC-13",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Compliance desk",
        detail: "Employee handbook acknowledgement from the HR packet.",
        labels: ["HR document", "Driver", "Acknowledgement", "Refresh"],
        fields: ["Employee handbook acknowledgement", "John Carter / DRV-001", "Signed electronically", "Refresh during annual packet"],
        ledgerRows: [["Policy version", "Fleet handbook packet.", "Filed"], ["Driver acknowledgement", "Acknowledgement retained.", "Signed"], ["Policy receipt", "Receipt acknowledged.", "Filed"], ["Annual refresh", "Compliance desk owns renewal cycle.", "Owned"], ["Protected details", "No personal election details needed for this buyer review.", "Protected"]],
        signature: ["Driver Signature / Date", "John Carter", "06/02/2026 11:10"],
        note: "This acknowledgement is visible as a signed policy record, not a passive checklist item."
      },
      {
        title: "Benefits enrollment",
        meta: "DRV-001-DOC-14",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Back office",
        detail: "Benefits enrollment record with protected fictional plan reference.",
        labels: ["HR document", "Driver", "Enrollment state", "Privacy"],
        fields: ["Benefits enrollment", "John Carter / DRV-001", "BEN-DRV001-A active", "Protected fictional election reference"],
        ledgerRows: [["Enrollment status", "BEN-DRV001-A active for HR file.", "Filed"], ["Plan reference", "BEN-DRV001-A retained as the protected fictional plan token.", "Protected"], ["Back-office use", "HR file completeness.", "Ready"], ["Owner", "Back office owns updates.", "Assigned"], ["Next action", "Review protected benefit ref during HR packet audit.", "Ready"]],
        signature: ["Back Office Review / Date", "R. Miles", "06/02/2026 12:05"],
        note: "The benefits record shows HR packet completeness without exposing plan choices."
      },
      {
        title: "Life insurance beneficiary election",
        meta: "DRV-001-DOC-15",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Back office",
        detail: "Beneficiary election record from the HR packet.",
        labels: ["HR document", "Driver", "Election state", "Privacy"],
        fields: ["Life insurance beneficiary election", "John Carter / DRV-001", "LIFE-DRV001-BEN active", "Beneficiary details protected"],
        ledgerRows: [["Election status", "LIFE-DRV001-BEN active for HR packet.", "Filed"], ["Beneficiary reference", "LIFE-DRV001-BEN retained as the protected fictional election token.", "Protected"], ["Review use", "HR file completeness.", "Ready"], ["Owner", "Back office.", "Assigned"], ["Privacy", "No real beneficiary identity is exposed.", "Protected"]],
        signature: ["Back Office Review / Date", "R. Miles", "06/02/2026 12:10"],
        note: "The beneficiary election is visible as a file status through a protected fictional reference."
      },
      {
        title: "Flexible spending account election",
        meta: "DRV-001-DOC-16",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Back office",
        detail: "FSA election record from the HR/payroll packet with protected fictional election reference.",
        labels: ["HR document", "Driver", "Election state", "Privacy"],
        fields: ["Flexible spending account election", "John Carter / DRV-001", "FSA-DRV001-2026 active", "Protected fictional plan reference"],
        ledgerRows: [["Election status", "FSA-DRV001-2026 active for payroll packet.", "Filed"], ["Plan reference", "FSA-DRV001-2026 retained as the protected fictional plan token.", "Protected"], ["Back-office use", "HR/payroll file completeness.", "Ready"], ["Owner", "Back office.", "Assigned"], ["Next action", "Review protected FSA ref during payroll packet audit.", "Ready"]],
        signature: ["Back Office Review / Date", "R. Miles", "06/02/2026 12:12"],
        note: "The FSA record demonstrates payroll-document depth through a protected fictional reference."
      },
      {
        title: "Garnishment withholding summary",
        meta: "DRV-001-DOC-17",
        status: "Not applicable",
        statusClass: "review",
        owner: "Owner: Back office",
        detail: "Payroll withholding summary appears only when present in a driver packet.",
        labels: ["Payroll document", "Driver", "Manifest state", "Settlement effect"],
        fields: ["Garnishment withholding summary", "John Carter / DRV-001", "No withholding summary listed", "No action unless withholding appears"],
        ledgerRows: [["Manifest state", "No payroll withholding summary listed for this driver.", "Not applicable"], ["Protected details", "No withholding order applies to this driver packet.", "Protected"], ["Settlement effect", "No action unless withholding appears.", "Clear"], ["Owner", "Back office.", "Assigned"], ["Next action", "Show protected withholding ref for drivers where present.", "Ready"]],
        signature: ["Back Office Review / Date", "R. Miles", "06/02/2026 12:15"],
        note: "The document remains visible as a packet category while correctly showing that it is not applicable for this driver."
      },
      {
        title: "Driver application",
        meta: "DRV-001-DOC-18",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Back office",
        detail: "Driver application and hiring review status.",
        labels: ["Application", "Driver", "Review state", "Privacy"],
        fields: ["Driver application", "John Carter / DRV-001", "APP-DRV001-2026 filed", "Protected fictional applicant reference"],
        ledgerRows: [["Applicant", "Driver identity matched to BOF record.", "Matched"], ["Experience summary", "Work history attached in driver packet.", "Filed"], ["License history", "Captured in driver file with CDL ref CDL-DRV001-2026A.", "Filed"], ["Safety review", "No unresolved dispatch blocker shown.", "Clear"], ["Protected reference", "APP-DRV001-2026 retained for buyer review.", "Protected"]],
        signature: ["Back Office Review / Date", "R. Miles", "06/01/2026 10:05"],
        note: "The application surface gives the fleet owner a believable hiring record through fictional review references."
      },
      {
        title: "Road test certificate",
        meta: "DRV-001-DOC-19",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Safety desk",
        detail: "Road test certificate and annual skills review.",
        labels: ["Road test", "Driver", "Score / result", "Dispatch effect"],
        fields: ["Road test certificate", "John Carter / DRV-001", "Pass - 92 / 100", "Supports active assignment"],
        ledgerRows: [["Test date", "05/29/2026 on fleet yard route RT-DAL-04.", "Filed"], ["Evaluator", "L. Bennett, safety desk.", "Signed"], ["Backing / coupling", "Observed and marked acceptable.", "Pass"], ["Road control", "Urban, highway, dock approach, and hazard response reviewed.", "Pass"], ["Dispatch effect", "No road-test blocker for TMS-LD-10482.", "Ready"]],
        signature: ["Safety Evaluator / Date", "L. Bennett", "05/29/2026 15:45"],
        note: "The road test gives the owner a concrete skills record instead of a generic eligibility label."
      },
      {
        title: "Resume and work history",
        meta: "DRV-001-DOC-20",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Back office",
        detail: "Resume, prior driving history, equipment experience, and gap review.",
        labels: ["Work history", "Driver", "Review result", "Owner use"],
        fields: ["Resume and work history", "John Carter / DRV-001", "No unresolved gap shown", "Supports owner file review"],
        ledgerRows: [["Current packet", "Application APP-DRV001-2026 and resume history aligned.", "Matched"], ["Prior carrier", "Blue River Freight / 04/2022-05/2026.", "Filed"], ["Equipment experience", "Dry van, regional lanes, ELD workflow, dock delivery.", "Filed"], ["Gap review", "No unresolved work-history gap in the review packet.", "Clear"], ["Dispatch use", "Supports owner confidence before assigning TMS-LD-10482.", "Ready"]],
        signature: ["Back Office Review / Date", "R. Miles", "06/01/2026 10:18"],
        note: "The work-history record shows fictional experience, dates, equipment context, and review result through buyer-safe references."
      },
      {
        title: "Prior employer inquiry",
        meta: "DRV-001-DOC-21",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Compliance desk",
        detail: "Prior employer safety and employment inquiry status.",
        labels: ["Inquiry", "Driver", "Response state", "DQF effect"],
        fields: ["Prior employer inquiry", "John Carter / DRV-001", "Response received 06/03/2026", "Kept with DQF review"],
        ledgerRows: [["Inquiry sent", "05/30/2026 to Blue River Freight records desk.", "Sent"], ["Response received", "06/03/2026 through BOF compliance intake.", "Received"], ["Accident / safety questions", "Safety-performance checklist completed with no release blocker.", "Clear"], ["Drug/alcohol response", "Prior-employer inquiry marked no active dispatch hold in this session.", "Clear"], ["Next action", "Keep inquiry with annual DQF review.", "Filed"]],
        signature: ["Compliance Review / Date", "L. Bennett", "06/03/2026 13:20"],
        note: "The prior-employer inquiry is visible as a managed compliance record, not just a line item."
      },
      {
        title: "Safety acknowledgements",
        meta: "DRV-001-DOC-22",
        status: "Filed",
        statusClass: "ready",
        owner: "Owner: Compliance desk",
        detail: "Safety manual, cargo care, inspection, and incident reporting acknowledgements.",
        labels: ["Packet", "Driver", "Filed items", "Operational use"],
        fields: ["Safety acknowledgement packet", "John Carter / DRV-001", "Inspection, cargo, incident, accident procedure", "Supports dispatch and claim prevention"],
        ledgerRows: [["Inspection reporting", "Pre-trip and post-trip defect reporting acknowledged.", "Filed"], ["Cargo care", "Cargo securement and care acknowledgement retained.", "Filed"], ["Incident escalation", "Dispatcher notification procedure acknowledged.", "Filed"], ["Accident scene procedure", "Photos, notes, and contact steps acknowledged.", "Filed"], ["Review", "Compliance desk reviewed packet for assignment.", "Complete"]],
        signature: ["Driver Signature / Date", "John Carter", "06/02/2026 11:18"],
        note: "The acknowledgement packet ties driver behavior to the same proof the release review depends on."
      },
      {
        title: "Dispatch eligibility / assignment",
        meta: "DRV-001-DOC-23",
        status: "Ready",
        statusClass: "ready",
        owner: "Owner: Operations lead",
        detail: "Final eligibility state and active assignment context.",
        labels: ["Assignment", "Driver", "Route", "Next action"],
        fields: ["Current assignment context", "John Carter / DRV-001", "Dallas, TX to Memphis, TN", "Keep driver file linked to release packet"],
        ledgerRows: [["Load", "TMS-LD-10482 / BOF-RR-10482.", "Attached"], ["Route", "Dallas, TX to Memphis, TN.", "Attached"], ["Driver file", "CDL, medical, MVR, compliance, emergency, HR, and settlement records represented.", "Ready"], ["Release gate", "BOL review controls final decision.", "Review"], ["Audit state", "Owner, status, and next action retained.", "Active"]],
        signature: ["Operations Review / Date", "S. Turner", "06/06/2026 09:10"],
        note: "The assignment record connects the driver file to the load, route, carrier packet, document gate, decision, and handoff."
      }
    ];
    function driverDocumentPaper(index) {
      var selected = driverDocumentVault[index] || driverDocumentVault[0];
      var paper = Object.assign({}, selected);
      paper.title = selected.title;
      paper.heading = selected.title;
      paper.parties = [
        ["DRIVER", "John Carter", "Driver ID DRV-001", "Assigned to TMS-LD-10482"],
        ["REVIEW OWNER", selected.owner.replace("Owner: ", ""), "BOF driver readiness file", "Protected fictional identifiers used for buyer review"]
      ];
      paper.ledgerHeads = ["Open document", "Record detail", "Status"];
      paper.ledgerRows = driverDocumentVault.map(function (doc, docIndex) {
        return [doc.title, doc.detail, doc.status, docIndex];
      });
      paper.driverVault = true;
      return paper;
    }

    var docHistories = {
      bol: [["06/05/2026 09:24", "S. Turner", "BOL image received.", "bol"], ["06/06/2026 09:10", "S. Turner", "BOF readiness review opened.", "release"], ["06/06/2026 09:12", "S. Turner", "Document gate checked against TMS-LD-10482.", "load"]],
      pretrip: [["06/06/2026 07:28", "Dispatch desk", "Pre-trip packet opened for TMS-LD-10482.", "pretrip"], ["06/06/2026 07:36", "John Carter", "Equipment and cargo inspection results attached.", "pretrip"], ["06/06/2026 07:42", "S. Turner", "Pre-trip takeoff review marked ready pending release decision.", "release"]],
      transit: [["06/06/2026 12:05", "Dispatch desk", "Transit packet opened after departure.", "transit"], ["06/06/2026 12:12", "Route monitor", "Construction detour watch attached.", "transit"], ["06/06/2026 12:18", "S. Turner", "HOS, fuel, safety watch, and route status reviewed.", "transit"]],
      rate: [["06/05/2026 09:20", "Document desk", "Rate confirmation attached.", "rate"], ["06/05/2026 09:21", "S. Turner", "Lane and load ID matched.", "load"], ["06/06/2026 09:08", "Operations lead", "Rate record available in release packet.", "release"]],
      driver: [["06/05/2026 09:11", "Safety desk", "Driver file opened.", "driver"], ["06/05/2026 09:12", "S. Turner", "Medical card and eligibility verified.", "driver"], ["06/06/2026 09:08", "Operations lead", "Driver readiness reviewed from queue.", "load"]],
      carrier: [["06/05/2026 09:16", "Carrier operations", "Carrier packet opened.", "carrier"], ["06/05/2026 09:18", "S. Turner", "Agreement, W-9, and packet readiness verified.", "agreement"], ["06/06/2026 09:09", "Operations lead", "Carrier packet reviewed from inspector.", "carrier"]],
      insurance: [["06/05/2026 09:18", "Carrier operations", "Certificate attached.", "insurance"], ["06/05/2026 09:19", "Carrier operations", "Coverage status checked.", "insurance"], ["06/06/2026 09:09", "S. Turner", "Insurance record remains release-ready.", "carrier"]],
      agreement: [["06/05/2026 09:15", "Carrier operations", "Agreement and W-9 record opened.", "agreement"], ["06/05/2026 09:17", "Carrier operations", "Agreement presence marked ready.", "agreement"], ["06/06/2026 09:09", "Operations lead", "Packet readiness checked.", "carrier"]],
      release: [["06/06/2026 09:10", "S. Turner", "Release decision opened.", "release"], ["06/06/2026 09:12", "S. Turner", "BOF-RR-10482 document gate reviewed.", "bol"], ["06/06/2026 09:13", "Operations lead", "Dispatch consequence confirmed.", "dispatchView"]],
      comparison1907: [["06/06/2026 08:20", "M. Ruiz", "Watch record opened.", "comparison1907"], ["06/06/2026 08:31", "M. Ruiz", "POD follow-up remains active.", "pod1907"], ["06/06/2026 08:42", "Carrier operations", "Renewal check pending.", "carrier204"]],
      pod1907: [["06/06/2026 08:18", "Receiver desk", "Delivery check-in timestamp captured.", "pod1907"], ["06/06/2026 08:31", "M. Ruiz", "POD follow-up opened for GPS, signature, and photo confirmation.", "pod1907"], ["06/06/2026 08:34", "Dispatcher", "Signed BOL image and receiver signoff requested.", "pod1907"], ["06/06/2026 08:42", "M. Ruiz", "Settlement remains on watch until proof packet clears.", "pod1907"]],
      posttrip: [["06/06/2026 08:18", "Receiver desk", "Delivery closeout timestamp captured.", "posttrip"], ["06/06/2026 08:31", "M. Ruiz", "Post-trip packet opened for receiver, location, and settlement review.", "posttrip"], ["06/06/2026 08:36", "Dispatcher", "Lumper state marked not required for this receiver lane.", "posttrip"], ["06/06/2026 08:42", "M. Ruiz", "Claim folder kept on standby while settlement stays on watch.", "posttrip"]],
      signedbol1907: [["06/06/2026 08:18", "Receiver desk", "Signed BOL delivery signoff captured.", "signedbol1907"], ["06/06/2026 08:34", "Dispatcher", "Signed BOL linked to POD-1907 closeout.", "posttrip"], ["06/06/2026 08:42", "M. Ruiz", "Signed BOL remains in settlement proof review.", "signedbol1907"]],
      dockphoto1907: [["06/06/2026 08:21", "Driver mobile", "Dock 7 delivery-location photo attached.", "dockphoto1907"], ["06/06/2026 08:42", "M. Ruiz", "Dock photo reviewed for settlement and claim standby.", "posttrip"]],
      emptyphoto1907: [["06/06/2026 08:27", "Driver mobile", "Empty trailer photo attached after unload.", "emptyphoto1907"], ["06/06/2026 08:42", "M. Ruiz", "Empty trailer proof reviewed for settlement and claim standby.", "posttrip"]],
      comparison1931: [["06/06/2026 08:46", "Alex Kim", "Hold record opened.", "comparison1931"], ["06/06/2026 09:02", "Safety desk", "Medical-card blocker confirmed.", "credential1931"], ["06/06/2026 09:05", "Dispatcher", "Lane held from assignment.", "dispatchView"]],
      comparison2064: [["06/06/2026 10:22", "Dispatch desk", "Ready row staged.", "comparison2064"], ["06/06/2026 10:27", "Safety desk", "DRV-004 reserve coverage verified.", "driver004"], ["06/06/2026 10:34", "Dispatcher", "Equipment timing is the only staging note.", "dispatchView"]],
      comparison2175: [["06/06/2026 10:11", "Document desk", "Rate review opened.", "comparison2175"], ["06/06/2026 10:18", "Dispatch", "DRV-005 coverage checked.", "driver005"], ["06/06/2026 10:24", "Document desk", "Rate match remains in review.", "rate"]],
      comparison2258: [["06/06/2026 09:52", "Safety desk", "Renewal watch opened.", "comparison2258"], ["06/06/2026 09:58", "Safety desk", "DRV-006 renewal evidence requested.", "driver006"], ["06/06/2026 10:06", "Dispatch", "Lane stays planned but uncommitted.", "dispatchView"]]
    };

    var records = {
      load: {
        title: "TMS-LD-10482 Release Packet",
        id: "TMS-LD-10482",
        owner: "S. Turner",
        status: "Review",
        statusClass: "review",
        state: "TMS import under BOF readiness review",
        consequence: "Release waits on BOF readiness decision.",
        heading: "Partner import packet summary",
        body: "The TMS-LD-10482 packet connects the imported TMS load, BOF-RR-10482 release file, driver match, carrier packet, documents, release decision, owner, next action, audit trail, and simulated handoff in one working record."
      },
      bol: {
        title: "Imported Load Packet Gate",
        id: "BOF-RR-10482-DOCS",
        owner: "S. Turner",
        status: "Review",
        statusClass: "review",
        state: "Partner load packet under BOF review",
        consequence: "Controls whether BOF marks TMS-LD-10482 Ready, Conditional, or Hold.",
        heading: "Load packet readiness fields",
        body: "BOF reviews the imported load packet: pickup instructions, BOL image, seal photo, delivery proof state, claim evidence state, and lane match before choosing a release outcome."
      },
      pretrip: {
        title: "Pre-Trip Packet",
        id: "PRETRIP-10482",
        owner: "Dispatch desk",
        status: "Ready",
        statusClass: "ready",
        state: "Pre-trip takeoff packet is ready, with no rate, pickup, assignment, equipment, cargo, or seal blocker shown.",
        consequence: "Dispatch can stage the truck, but final movement still waits on the BOF release decision.",
        heading: "Trip takeoff fields",
        body: "The pre-trip packet keeps rate confirmation, work schedule, pickup instructions, driver/load assignment, equipment inspection, cargo inspection, seal record, takeoff result, owner, and next action in one inspectable record."
      },
      transit: {
        title: "In-Transit Packet",
        id: "TRANSIT-10482",
        owner: "Dispatch desk",
        status: "Watch",
        statusClass: "watch",
        state: "TMS-LD-10482 remains on track with route, fuel, HOS, and safety watch notes visible.",
        consequence: "Dispatch can keep the lane moving, but route deviation, safety watch, weather, HOS, and fuel remain monitored until delivery.",
        heading: "Transit operating fields",
        body: "The transit packet keeps GPS lane, current position, deviation reason, alternate route plan, HOS availability, compliance state, safety event, fuel status, owner, and next action visible so the buyer can tell whether the load is still on track."
      },
      rate: {
        title: "Rate Confirmation",
        id: "RC-10482",
        owner: "Document desk",
        status: "Ready",
        statusClass: "ready",
        state: "Matched to TMS-LD-10482",
        consequence: "Supports the release packet and does not block dispatch.",
        heading: "Rate confirmation fields",
        body: "The lane, load ID, and rate confirmation are aligned with TMS-LD-10482. The rate record remains attached to the release packet."
      },
      driver: {
        title: "Driver Readiness File",
        id: "DRV-001",
        owner: "Safety desk",
        status: "Ready",
        statusClass: "ready",
        state: "Eligible for assignment",
        consequence: "Driver readiness does not block the TMS-LD-10482 release decision.",
        heading: "Driver file fields",
        body: "The driver readiness record shows eligible status, current medical card, and dispatch eligibility for the TMS-LD-10482 review."
      },
      carrier: {
        title: "Carrier Packet",
        id: "CAR-118",
        owner: "Carrier operations",
        status: "Ready",
        statusClass: "ready",
        state: "Packet ready across three active queue links",
        consequence: "Carrier readiness does not block TMS-LD-10482, BOF-2064, or BOF-2258 planning.",
        heading: "Carrier packet fields",
        body: "The carrier packet includes agreement, W-9, insurance readiness, and packet status for the TMS-LD-10482 primary review plus the BOF-2064 and BOF-2258 CAR-118 queue links."
      },
      insurance: {
        title: "Insurance Verification",
        id: "INS-CAR-118",
        owner: "Carrier operations",
        status: "Ready",
        statusClass: "ready",
        state: "Current for CAR-118",
        consequence: "Insurance is attached and does not block the release packet.",
        heading: "Insurance record fields",
        body: "The insurance record is current for CAR-118 and remains visible in the release packet so dispatch can trust the carrier readiness state."
      },
      agreement: {
        title: "Agreement And W-9",
        id: "AGR-CAR-118",
        owner: "Carrier operations",
        status: "Ready",
        statusClass: "ready",
        state: "Agreement and W-9 present",
        consequence: "Carrier paperwork supports the TMS-LD-10482 release review.",
        heading: "Agreement record fields",
        body: "Agreement and W-9 records are present and connected to the carrier packet. Sensitive details stay protected while readiness remains clear."
      },
      release: {
        title: "Release Decision",
        id: "REL-10482-DECISION",
        owner: "S. Turner",
        status: "Review",
        statusClass: "review",
        state: "Awaiting BOF readiness decision",
        consequence: "Dispatch cannot act until BOF records Ready, Conditional, or Hold.",
        heading: "Handoff note fields",
        body: "The release note keeps the decision owner, readiness packet, blocker or condition, dispatch consequence, next action, audit trail, and simulated handoff attached to TMS-LD-10482."
      },
      comparison1907: {
        title: "BOF-1907 Watch Record",
        id: "BOF-1907",
        owner: "M. Ruiz",
        status: "Watch",
        statusClass: "watch",
        state: "BOL photo and renewal check",
        consequence: "Prepare the lane, but review before committing release.",
        heading: "Watch record summary",
        body: "BOF-1907 remains visible in the queue as a lower-priority release question with a named owner and review consequence."
      },
      comparison1931: {
        title: "BOF-1931 Hold Record",
        id: "BOF-1931",
        owner: "Alex Kim",
        status: "Hold",
        statusClass: "blocked",
        state: "Driver medical card hold",
        consequence: "Dispatch should not assign the lane until eligibility clears.",
        heading: "Hold record summary",
        body: "BOF-1931 shows how the shell handles a blocked lane: the medical-card hold is visible, owned, and tied to dispatch consequence."
      },
      comparison2064: {
        title: "BOF-2064 Ready Record",
        id: "BOF-2064",
        owner: "Dispatch desk",
        status: "Release Ready",
        statusClass: "ready",
        state: "Ready row waiting on dispatch staging.",
        consequence: "The lane can move after equipment timing is confirmed.",
        heading: "Ready row summary",
        body: "BOF-2064 shows a lane that is not blocked by paperwork or driver readiness. The only remaining note is dispatch staging, and the record keeps that owner visible."
      },
      comparison2175: {
        title: "BOF-2175 Rate Review",
        id: "BOF-2175",
        owner: "Document desk",
        status: "Review",
        statusClass: "review",
        state: "Rate confirmation match is under review.",
        consequence: "Dispatch should not release until the rate record matches the lane.",
        heading: "Rate review summary",
        body: "BOF-2175 keeps the rate confirmation check connected to the load, lane, driver, carrier, owner, and next action so the review state has a concrete reason."
      },
      comparison2258: {
        title: "BOF-2258 Renewal Watch",
        id: "BOF-2258",
        owner: "Safety desk",
        status: "Watch",
        statusClass: "watch",
        state: "Driver renewal evidence is being watched.",
        consequence: "Dispatch can plan coverage, but should not commit the lane until renewal evidence clears.",
        heading: "Renewal watch summary",
        body: "BOF-2258 shows a watch-state lane tied to DRV-006. The row explains the credential watch, owner, dispatch consequence, and next action."
      },
      fleet: {
        title: "Delta Advanced Trucking Workspace",
        id: "FLEET-DAT",
        owner: "S. Turner",
        status: "Active",
        statusClass: "ready",
        state: "Partner import queue, carrier records, driver readiness, document control, and handoff record connected.",
        consequence: "The fleet team can review one lane without chasing separate files.",
        heading: "Fleet operating context",
        body: "This workspace keeps the TMS-import queue, BOF readiness records, document packets, safety checks, audit activity, simulated handoff, and assigned owners together for Delta Advanced Trucking."
      },
      user: {
        title: "S. Turner Profile",
        id: "USR-STURNER",
        owner: "Operations lead",
        status: "Active",
        statusClass: "ready",
        state: "Decision owner for the active release queue.",
        consequence: "Release decisions, review gates, and escalations stay attached to a named operator instead of becoming anonymous approvals.",
        heading: "Profile and authority",
        body: "S. Turner owns the TMS-LD-10482 BOF release decision and monitors the supporting partner-import queue: document review, credential hold, rate review, renewal watch, dispatch staging, and simulated handoff."
      },
      "carrier-contact": {
        title: "RoadPro Carrier Desk",
        id: "CAR-118-CONTACT",
        owner: "Carrier operations",
        status: "Ready",
        statusClass: "ready",
        state: "Carrier packet contact is available.",
        consequence: "If BOF records a hold, the carrier desk has a named follow-up path.",
        heading: "Carrier operations contact",
        body: "The carrier record keeps the RoadPro operations desk tied to insurance, agreement, W-9, packet readiness, document follow-up, and release handoff for TMS-LD-10482."
      },
      driver002: {
        title: "DRV-002 Driver Readiness",
        id: "DRV-002",
        owner: "Safety desk",
        status: "Watch",
        statusClass: "watch",
        state: "Eligible, but linked to BOF-1907 watch review.",
        consequence: "Dispatch can prepare the load, but final release waits on the watch record.",
        heading: "Comparison driver record",
        body: "DRV-002 demonstrates a non-blocking review state: the driver can remain visible in queue planning without becoming the active release decision."
      },
      driver003: {
        title: "DRV-003 Credential Hold",
        id: "DRV-003",
        owner: "Safety desk",
        status: "Hold",
        statusClass: "blocked",
        state: "Medical-card hold blocks dispatch eligibility.",
        consequence: "The load should not be assigned until driver eligibility clears.",
        heading: "Blocked driver record",
        body: "DRV-003 shows the kind of driver readiness problem BOF keeps visible: a credential issue, a dispatch consequence, and an owner for correction."
      },
      driver004: {
        title: "DRV-004 Ready Driver File",
        id: "DRV-004",
        owner: "Safety desk",
        status: "Ready",
        statusClass: "ready",
        state: "Eligible reserve driver",
        consequence: "Can be assigned if TMS-LD-10482 needs a backup driver.",
        heading: "Reserve driver readiness",
        body: "DRV-004 is a ready reserve driver with current credentials, clean release status, and no open dispatch blocker."
      },
      driver006: {
        title: "DRV-006 Expiration Watch",
        id: "DRV-006",
        owner: "Safety desk",
        status: "Watch",
        statusClass: "watch",
        state: "License renewal due soon",
        consequence: "Can stay in planning, but safety needs renewal evidence before new dispatch commitments.",
        heading: "Upcoming expiration watch",
        body: "DRV-006 shows a watch-state driver: usable for planning today, but BOF keeps the renewal date and owner visible before the issue becomes a hold."
      },
      driver005: {
        title: "DRV-005 Ready Team Driver",
        id: "DRV-005",
        owner: "Safety desk",
        status: "Ready",
        statusClass: "ready",
        state: "Team-driver eligible",
        consequence: "Available for longer routes that need team-driver coverage.",
        heading: "Team driver readiness",
        body: "DRV-005 is eligible for team-driver dispatch coverage, with credential status and assignment readiness visible in the driver roster."
      },
      audit: {
        title: "Queue Audit Trail",
        id: "AUD-QUEUE-SESSION",
        owner: "Operations lead",
        status: "Active",
        statusClass: "ready",
        state: "Recent queue, document, driver, carrier, alert, and release activity recorded.",
        consequence: "Operations can see why each queue state changed, who touched the record, and what the next action is.",
        heading: "Audit activity",
        body: "The audit trail records the TMS-LD-10482 release decision plus the six-load queue signals: ready staging, POD watch, credential hold, rate review, renewal watch, carrier checks, and alert activity."
      },
      yield: {
        title: "Truck ROA And Expansion Yield",
        id: "FIN-YIELD-1842",
        owner: "Fleet finance desk",
        status: "Model",
        statusClass: "watch",
        state: "Sample capital spread analysis",
        consequence: "Shows whether adding trucks creates value above the borrowing cost.",
        heading: "ROA and cost of capital model",
        body: "The report compares estimated net operating profit per truck against asset cost and planning borrowing cost, then models how adding 1, 5, or 10 trucks changes profit contribution."
      },
      financeAsset: {
        title: "Asset Cost Assumptions",
        id: "FIN-ASSET-1842",
        owner: "Fleet finance desk",
        status: "Model",
        statusClass: "watch",
        state: "Truck purchase basis prepared",
        consequence: "Expansion math stays grounded in purchase price, cash down, loan terms, and depreciation assumptions.",
        heading: "Truck asset inputs",
        body: "The asset model shows the tractor basis used for ROA: purchase price, down payment, financed amount, term, interest assumption, and depreciation curve."
      },
      financeOps: {
        title: "Operating Economics",
        id: "FIN-OPS-1842",
        owner: "Fleet finance desk",
        status: "Model",
        statusClass: "watch",
        state: "Revenue and expense assumptions prepared",
        consequence: "Fleet owners can see which operating costs drive net profit before expansion decisions are made.",
        heading: "Revenue and operating cost inputs",
        body: "The operating model combines revenue per mile, monthly miles, load mix, fuel, maintenance, tires, insurance, driver wages, compliance, and BOF service cost into one per-truck profit estimate."
      },
      financeCapital: {
        title: "Cost Of Capital Spread",
        id: "FIN-CAPITAL-1842",
        owner: "Fleet finance desk",
        status: "Model",
        statusClass: "watch",
        state: "Borrowing spread compared to truck ROA",
        consequence: "The fleet sees how much return remains after the lender's cost of capital is accounted for.",
        heading: "ROA minus borrowing cost",
        body: "The spread record compares a 28.0% planning truck ROA with a 10.0% borrowing assumption, leaving an 18.0-point value spread for expansion review."
      },
      financeExpansion: {
        title: "Fleet Expansion Yield",
        id: "FIN-EXPAND-1842",
        owner: "Fleet finance desk",
        status: "Model",
        statusClass: "watch",
        state: "Add-truck scenarios prepared",
        consequence: "The owner can compare adding 1, 5, or 10 trucks before taking on additional debt or lease commitments.",
        heading: "Add-truck impact model",
        body: "The expansion model applies the per-truck profit estimate to growth scenarios so the owner can see contribution before and after capital cost."
      },
      settlement: {
        title: "Settlement Desk",
        id: "SETTLE-10482",
        owner: "Fleet finance desk",
        status: "Review",
        statusClass: "watch",
        state: "Load revenue, driver pay, deductions, and proof holds are visible before settlement release.",
        consequence: "Settlement can be prepared, but payment release waits for the final BOF release decision and post-trip proof packet.",
        heading: "Settlement review fields",
        body: "The settlement desk connects TMS-LD-10482 revenue, DRV-001 pay, protected deduction references, POD/signature/photo requirements, and hold reasons in one inspectable record."
      },
      settlementRevenue: {
        title: "Load Revenue Packet",
        id: "REV-TMS-LD-10482",
        owner: "Fleet finance desk",
        status: "Attached",
        statusClass: "ready",
        state: "Gross load revenue is tied to the release packet.",
        consequence: "Fleet management can inspect the load revenue before comparing driver pay and settlement hold state.",
        heading: "Revenue fields",
        body: "Linehaul, fuel surcharge, detention allowance, accessorial review, and total gross revenue stay tied to TMS-LD-10482 and the BOF release packet."
      },
      settlementDriverPay: {
        title: "Driver Pay Methods",
        id: "PAY-DRIVER-METHODS",
        owner: "Payroll desk",
        status: "Prepared",
        statusClass: "review",
        state: "Cents-per-mile, percentage, hourly, and salary-style examples are represented.",
        consequence: "The owner can see how different fleet pay models remain connected to load proof and release consequence.",
        heading: "Driver pay method fields",
        body: "DRV-001 uses mileage pay for TMS-LD-10482 while the comparison rows show percentage of revenue, hourly local pay, and salary-style allocation without exposing real compensation files."
      },
      settlementDeductions: {
        title: "Protected Deduction Packet",
        id: "DED-PROTECTED-2026",
        owner: "Back office",
        status: "Protected",
        statusClass: "ready",
        state: "HSA, garnishment, health care, and life insurance deductions use fictional protected references.",
        consequence: "The demo shows deduction depth while keeping private payroll, legal, and benefits values out of the presentation.",
        heading: "Deduction review fields",
        body: "Deduction records show HSA, garnishment, health care plan, and life insurance plan status with protected fictional references instead of real account, medical, legal, or tax values."
      },
      settlementHold: {
        title: "Settlement Hold Watch",
        id: "HOLD-BOF-1907",
        owner: "M. Ruiz",
        status: "Watch",
        statusClass: "watch",
        state: "Settlement stays on watch until POD, receiver signature, receipt, and required delivery proof clear.",
        consequence: "The hold gives the driver and operations team a clear reason to return required proof before settlement release.",
        heading: "Hold reason fields",
        body: "BOF-1907 shows how a missing POD detail, receipt, receiver signature, or required delivery information can keep settlement on watch without sounding punitive."
      },
      alerts: {
        title: "Alerts",
        id: "ALERTS-QUEUE",
        owner: "Operations lead",
        status: "Review",
        statusClass: "review",
        state: "Four items need attention across document review, credential hold, rate review, and renewal watch.",
        consequence: "The release review keeps urgent issues visible without burying them in separate pages.",
        heading: "Active alerts",
        body: "TMS-LD-10482 needs the BOF-RR-10482 readiness decision, BOF-1931 remains held by a driver credential, BOF-2175 needs rate confirmation review, and BOF-2258 stays on watch until DRV-006 renewal evidence clears."
      },
      help: {
        title: "Readiness Review Help",
        id: "HELP-RELEASE",
        owner: "BOF support",
        status: "Available",
        statusClass: "ready",
        state: "Explains how the release decision should be made.",
        consequence: "The release review can understand the release gate without chasing separate notes.",
        heading: "How to use this workspace",
        body: "Select a load, inspect the readiness packet, review driver and carrier status, then choose Ready to Release, Release With Condition, or Hold - Action Required. BOF updates the selected record, handoff note, audit trail, and dispatch consequence."
      },
      command: {
        title: "Command Center View",
        id: "VIEW-COMMAND",
        owner: "Operations lead",
        status: "Active",
        statusClass: "ready",
        state: "Queue, selected load, document viewer, actions, packet, and audit are visible.",
        consequence: "The owner can make the release decision from one dense operating screen.",
        heading: "Command view",
        body: "The command center keeps release queue, dispatch consequence, document record, readiness checklist, audit trail, and next action in one control panel."
      },
      dispatchView: {
        title: "Dispatch Board View",
        id: "VIEW-DISPATCH",
        owner: "Dispatcher",
        status: "Review",
        statusClass: "review",
        state: "Six lanes are sorted by release-ready, review, watch, and hold states.",
        consequence: "Dispatch can see which lane can move now, which records must wait, and which owner controls the correction.",
        heading: "Dispatch board signal",
        body: "This view keeps BOF-2064 ready for staging, TMS-LD-10482 and BOF-2175 in document review, BOF-1907 and BOF-2258 on watch, and BOF-1931 held by credential status."
      },
      documentsView: {
        title: "Documents View",
        id: "VIEW-DOCUMENTS",
        owner: "Document desk",
        status: "Review",
        statusClass: "review",
        state: "Primary packet documents and queue exception records are attached.",
        consequence: "The release review can open every named document, watch item, and blocker record from one pane.",
        heading: "Document file cabinet",
        body: "The document view treats named paperwork as working records. TMS-LD-10482 keeps the full document tabs, while BOF-1907, BOF-1931, BOF-2175, and BOF-2258 expose the exception records that control release."
      },
      safetyView: {
        title: "Safety And Compliance View",
        id: "VIEW-SAFETY",
        owner: "Safety desk",
        status: "Review",
        statusClass: "review",
        state: "Driver readiness spans ready files, watch states, and one credential hold.",
        consequence: "Driver readiness directly affects whether dispatch can assign, stage, or hold each lane.",
        heading: "Safety consequence",
        body: "The safety view keeps DRV-001, DRV-004, and DRV-005 ready; DRV-002 and DRV-006 visible as watch items; and DRV-003 held until the medical-card issue clears."
      },
      carrier204: {
        title: "CAR-204 Watch Packet",
        id: "CAR-204",
        owner: "Carrier operations",
        status: "Watch",
        statusClass: "watch",
        state: "Renewal and rate checks stay visible across two queue links.",
        consequence: "Dispatch can prepare BOF-1907 and BOF-2175, but the release review still reviews the open packet checks.",
        heading: "Carrier watch fields",
        body: "CAR-204 demonstrates a watch-state packet: renewal evidence is attached for BOF-1907, and the same carrier relationship is visible on the BOF-2175 rate-review lane before the release queue moves to ready."
      },
      carrier088: {
        title: "CAR-088 Held Carrier Record",
        id: "CAR-088",
        owner: "Carrier operations",
        status: "Hold",
        statusClass: "blocked",
        state: "Carrier assignment is held while DRV-003 remains credential-blocked.",
        consequence: "BOF-1931 should not move until the driver credential issue clears.",
        heading: "Held carrier assignment",
        body: "CAR-088 stays visible so the operations lead can see that the load is not missing a carrier; the controlling blocker is driver eligibility."
      },
      pod1907: {
        title: "BOF-1907 POD Follow-Up",
        id: "POD-1907",
        owner: "M. Ruiz",
        status: "Watch",
        statusClass: "watch",
        state: "Proof of delivery follow-up is open with photo and location evidence still pending confirmation.",
        consequence: "BOF-1907 stays on watch until the POD, GPS/location detail, receiver signoff, dock photo, and empty-cargo photo are confirmed.",
        heading: "POD evidence packet",
        body: "The watch record keeps the POD task, receiver/signature requirement, delivery timestamp, GPS/location check, dock photo, empty cargo photo, settlement effect, claim effect, assigned owner, and follow-up target visible without distracting from the active TMS-LD-10482 release decision."
      },
      posttrip: {
        title: "BOF-1907 Post-Trip Closeout",
        id: "POSTTRIP-1907",
        owner: "M. Ruiz",
        status: "Watch",
        statusClass: "watch",
        state: "Post-trip closeout keeps delivery proof, lumper state, settlement watch, and claim/dispute readiness together.",
        consequence: "BOF-1907 should not release settlement until POD, receiver, timestamp, GPS/location, signed BOL, and photo proof clear.",
        heading: "Post-trip settlement and claim fields",
        body: "The closeout record answers what happened after delivery: who received it, when and where it was delivered, whether a lumper receipt applies, whether settlement can release, and whether any claim or dispute packet needs to open."
      },
      signedbol1907: {
        title: "BOF-1907 Signed BOL",
        id: "BOL-1907-SIGNED-IMG",
        owner: "M. Ruiz",
        status: "Review",
        statusClass: "watch",
        state: "Receiver signoff is linked to the post-trip closeout packet.",
        consequence: "Settlement remains on watch until the signed BOL, POD, GPS/location, dock photo, and empty trailer proof match.",
        heading: "Signed BOL artifact fields",
        body: "The signed BOL record keeps the receiver signoff, delivery date, delivered condition, OS&D note, owner, settlement effect, and next action visible inside the control center."
      },
      dockphoto1907: {
        title: "BOF-1907 Dock Photo",
        id: "POD-1907-DOCK-IMG",
        owner: "M. Ruiz",
        status: "Attached",
        statusClass: "ready",
        state: "Delivery-location photo is attached to the POD closeout packet.",
        consequence: "The photo supports delivery proof, settlement release review, and claim response if an exception opens.",
        heading: "Dock photo artifact fields",
        body: "The dock photo record shows the trailer at Dock 7 with timestamp, location context, source, settlement effect, claim effect, and owner."
      },
      emptyphoto1907: {
        title: "BOF-1907 Empty Trailer Photo",
        id: "POD-1907-EMPTY-IMG",
        owner: "M. Ruiz",
        status: "Attached",
        statusClass: "ready",
        state: "Post-unload empty trailer photo is attached to the POD closeout packet.",
        consequence: "The photo supports settlement closeout and helps answer shortage or cargo-condition disputes.",
        heading: "Empty trailer artifact fields",
        body: "The empty trailer record shows the post-unload cargo state with timestamp, condition, source, settlement effect, claim effect, and owner."
      },
      backhaul: {
        title: "Backhaul Review Board",
        id: "BACKHAUL-1907",
        owner: "Dispatch desk",
        status: "Watch",
        statusClass: "watch",
        state: "Post-delivery backhaul options are being reviewed near the BOF-1907 Kansas City delivery area.",
        consequence: "The fleet can reduce deadhead only if pickup distance, home-lane direction, dry-van equipment, timing, and load packet readiness fit.",
        heading: "Backhaul decision fields",
        body: "This board keeps nearby return-load options tied to the delivered BOF-1907 context instead of showing a random load board. Each option shows pickup distance from delivery, return or home-lane fit, equipment fit, pickup window, and the next dispatch action."
      },
      credential1931: {
        title: "DRV-003 Medical Card Hold",
        id: "MED-DRV-003",
        owner: "Safety desk",
        status: "Hold",
        statusClass: "blocked",
        state: "Medical-card record blocks BOF-1931 assignment.",
        consequence: "Dispatch should not release or assign BOF-1931 until the credential record clears.",
        heading: "Credential hold fields",
        body: "The credential record shows the blocker, owner, dispatch consequence, and required correction instead of leaving a hold status unexplained."
      },
      session: {
        title: "Control Center Session Notes",
        id: "SESSION-QUEUE",
        owner: "Operations lead",
        status: "Active",
        statusClass: "ready",
        state: "Self-contained six-load release review",
        consequence: "The release review keeps every supporting record, alert, and queue exception in the BOF Control Center.",
        heading: "Session scope",
        body: "This BOF Control Center session keeps the primary TMS-LD-10482 import, five supporting queue rows, driver files, carrier packets, documents, release controls, alerts, simulated handoff, and status changes together in one working view."
      }
    };

    var recordProofDetails = {
      load: {
        details: [["Imported load", "TMS-LD-10482"], ["BOF release file", "BOF-RR-10482"], ["Origin", "Dallas, TX"], ["Destination", "Memphis, TN"], ["Route status", "Pickup staged; release still under BOF review."], ["Priority reason", "High: today's dispatch window and customer handoff depend on the readiness decision."], ["Driver match", "DRV-001 - John Carter"], ["Carrier", "CAR-118 - RoadPro Logistics"], ["Documents", "Pickup instructions, BOL image, seal photo, delivery proof state, and claim evidence state attached."], ["Next action", "S. Turner chooses Ready, Conditional, or Hold."]],
        activity: [["06/05/2026 09:12", "S. Turner", "TMS load imported."], ["06/05/2026 09:13", "Safety desk", "Driver matched to DRV-001."], ["06/05/2026 09:18", "S. Turner", "Carrier packet attached."], ["06/06/2026 09:10", "S. Turner", "BOF readiness review opened."]]
      },
      bol: {
        details: [["Readiness packet", "BOF-RR-10482-DOCS"], ["Pickup instructions", "Present."], ["BOL image", "BOL-10482-IMG-02 under review."], ["Seal photo", "Present."], ["Delivery proof", "Not yet required; owner attached."], ["Owner", "S. Turner"]],
        activity: [["06/05/2026 09:12", "S. Turner", "Partner import document packet opened."], ["06/05/2026 09:24", "S. Turner", "BOL image received."], ["06/06/2026 09:12", "S. Turner", "Readiness document gate checked."]]
      },
      pretrip: {
        details: [["Packet", "PRETRIP-10482"], ["Rate confirmation", "RC-10482 matched to load, lane, carrier, and dates."], ["Work schedule", "WS-10482 pickup 08:00-10:00 and delivery 16:00-18:00."], ["Pickup instructions", "PU-10482 includes gate, Dock 4 contact, load number, and driver instructions."], ["Assignment", "DRV-001, CAR-118, dry van trailer TRL-118-07, Dallas to Memphis."], ["Equipment inspection", "EQ-10482 pass: tires, lights, doors, trailer, and ELD/mobile."], ["Cargo inspection", "CARGO-10482 pass: 24 pallets staged, packaging intact, no shortage before loading."], ["Loaded cargo photo", "LOADPHOTO-10482 attached from Dallas pickup dock."], ["Seal record", "SEAL-TX-10482-771 captured at Dallas pickup departure."], ["Takeoff result", "Trip can take off after BOF readiness decision; no pre-trip blocker shown."], ["Owner", "Dispatch desk"], ["Next action", "S. Turner confirms final release outcome."]],
        activity: [["06/06/2026 07:28", "Dispatch desk", "Pre-trip packet opened."], ["06/06/2026 07:36", "John Carter", "Equipment and cargo inspection results attached."], ["06/06/2026 07:42", "S. Turner", "Takeoff review marked ready pending release decision."]]
      },
      transit: {
        details: [["Packet", "TRANSIT-10482"], ["GPS lane/current route", "I-30 eastbound near Texarkana, 238 mi remaining to Memphis."], ["Route deviation", "Seven-mile construction detour near I-30 exit 216; route note retained."], ["Alternate route", "AR-ALT-10482 prepared through US-70 connector if weather blocks I-40 approach."], ["HOS availability", "HOS window remains sufficient for ETA 16:42 CST; no rest-risk flag shown."], ["OOS/compliance concern", "No out-of-service condition shown; safety desk escalation path remains visible."], ["Safety event", "Following-distance watch event EVT-10482-FD logged with coach note; no release hold."], ["Fuel status", "61 percent remaining with planned West Memphis stop; no delivery risk."], ["Track answer", "Load is on track with watch notes for detour, weather, HOS, fuel, and safety."], ["Owner", "Dispatch desk"], ["Next action", "Continue route watch and confirm final delivery proof after arrival."]],
        activity: [["06/06/2026 12:05", "Dispatch desk", "Transit packet opened."], ["06/06/2026 12:12", "Route monitor", "Construction detour watch attached."], ["06/06/2026 12:18", "S. Turner", "Load remains on track with watch notes."]]
      },
      rate: {
        details: [["Record ID", "RC-10482"], ["Lane", "Dallas, TX to Memphis, TN"], ["Load reference", "TMS-LD-10482"], ["Rate status", "Matched to packet."], ["Dispatch impact", "Does not block release."], ["Owner", "Document desk"]],
        activity: [["06/05/2026 09:21", "S. Turner", "Rate confirmation verified."], ["06/05/2026 09:22", "Document desk", "Rate record linked to release packet."]]
      },
      driver: {
        details: [["Driver ID", "DRV-001"], ["Driver name", "John Carter"], ["Medical card", "Current."], ["MVR status", "No open release blocker."], ["Dispatch eligibility", "Eligible for TMS-LD-10482."], ["Owner", "Safety desk"]],
        activity: [["06/05/2026 09:12", "S. Turner", "Driver file verified."], ["06/05/2026 09:13", "Safety desk", "Eligibility tied to TMS-LD-10482."], ["06/06/2026 09:08", "Operations lead", "Driver record reviewed from load queue."]]
      },
      carrier: {
        details: [["Carrier ID", "CAR-118"], ["Carrier", "RoadPro Logistics"], ["Packet", "Agreement, W-9, and insurance attached."], ["Queue links", "TMS-LD-10482, BOF-2064, BOF-2258."], ["Dispatch impact", "Does not block the three CAR-118 lanes."], ["Owner", "Carrier operations"]],
        activity: [["06/05/2026 09:18", "S. Turner", "Carrier packet verified."], ["06/05/2026 09:19", "Carrier operations", "Insurance record checked."], ["06/06/2026 09:09", "Operations lead", "Carrier record opened from inspector."], ["06/06/2026 10:36", "Dispatch desk", "Additional CAR-118 queue links reviewed."]]
      },
      insurance: {
        details: [["Record ID", "INS-CAR-118"], ["Carrier", "CAR-118 - RoadPro Logistics"], ["Coverage state", "Current."], ["Packet link", "Attached to carrier readiness."], ["Dispatch impact", "Does not block TMS-LD-10482."], ["Owner", "Carrier operations"]],
        activity: [["06/05/2026 09:19", "Carrier operations", "Insurance certificate reviewed."], ["06/05/2026 09:20", "S. Turner", "Insurance cleared for release packet."]]
      },
      agreement: {
        details: [["Record ID", "AGR-CAR-118"], ["Carrier", "RoadPro Logistics"], ["Agreement", "Present."], ["W-9", "Present."], ["Sensitive fields", "Protected from first release view."], ["Owner", "Carrier operations"]],
        activity: [["06/05/2026 09:16", "Carrier operations", "Agreement record confirmed."], ["06/05/2026 09:17", "Carrier operations", "W-9 presence marked ready."]]
      },
      release: {
        details: [["Decision record", "REL-10482-DECISION"], ["Readiness packet", "BOF-RR-10482"], ["Decision owner", "S. Turner"], ["Current release state", "Review"], ["Dispatch impact", "Release waits on BOF readiness decision."], ["Next action", "Choose Ready to Release, Release With Condition, or Hold - Action Required."]],
        activity: [["06/06/2026 09:10", "S. Turner", "Release decision opened."], ["06/06/2026 09:12", "S. Turner", "Partner import readiness reviewed."]]
      },
      comparison1907: {
        details: [["Load", "BOF-1907"], ["Queue state", "Watch"], ["Driver", "DRV-002"], ["Carrier", "CAR-204"], ["Control item", "POD follow-up and renewal check."], ["Owner", "M. Ruiz"]],
        activity: [["06/06/2026 08:20", "M. Ruiz", "Watch row reviewed."], ["06/06/2026 08:31", "M. Ruiz", "POD follow-up remains open."]]
      },
      comparison1931: {
        details: [["Load", "BOF-1931"], ["Queue state", "Hold"], ["Driver", "DRV-003"], ["Carrier", "CAR-088"], ["Control item", "Medical-card hold."], ["Owner", "Alex Kim"]],
        activity: [["06/06/2026 08:46", "Alex Kim", "Hold row opened."], ["06/06/2026 09:02", "Safety desk", "Credential blocker confirmed."]]
      },
      comparison2064: {
        details: [["Load", "BOF-2064"], ["Queue state", "Release Ready"], ["Driver", "DRV-004"], ["Carrier", "CAR-118"], ["Control item", "Dispatch staging note."], ["Owner", "Dispatch desk"]],
        activity: [["06/06/2026 10:22", "Dispatch desk", "Ready row staged."], ["06/06/2026 10:27", "Safety desk", "Reserve driver coverage verified."]]
      },
      comparison2175: {
        details: [["Load", "BOF-2175"], ["Queue state", "Review"], ["Driver", "DRV-005"], ["Carrier", "CAR-204"], ["Control item", "Rate confirmation match."], ["Owner", "Document desk"]],
        activity: [["06/06/2026 10:11", "Document desk", "Rate review opened."], ["06/06/2026 10:24", "Document desk", "Rate match remains in review."]]
      },
      comparison2258: {
        details: [["Load", "BOF-2258"], ["Queue state", "Watch"], ["Driver", "DRV-006"], ["Carrier", "CAR-118"], ["Control item", "Driver renewal evidence."], ["Owner", "Safety desk"]],
        activity: [["06/06/2026 09:52", "Safety desk", "Renewal watch opened."], ["06/06/2026 09:58", "Safety desk", "DRV-006 renewal evidence requested."]]
      },
      fleet: {
        details: [["Fleet", "Delta Advanced Trucking"], ["Active desk", "Release queue"], ["Open focus", "TMS-LD-10482"], ["Visible rows", "6"], ["Watch items", "BOF-1907 and BOF-2258"], ["Role", "Operations Lead"]],
        activity: [["06/06/2026 09:00", "Operations lead", "Fleet workspace opened."], ["06/06/2026 09:05", "System", "Queue totals refreshed."]]
      },
      user: {
        details: [["User", "S. Turner"], ["Role", "Operations Lead"], ["Authority", "BOF release decision owner and queue reviewer."], ["Active record", "TMS-LD-10482 / BOF-RR-10482"], ["Queue span", "6 loads, 6 drivers, 3 carrier states."], ["Escalation", "Document desk, carrier operations, or safety desk if blocked."]],
        activity: [["06/06/2026 09:08", "S. Turner", "Opened TMS-LD-10482."], ["06/06/2026 09:12", "S. Turner", "Reviewed partner import readiness packet."], ["06/06/2026 10:24", "S. Turner", "Rate and renewal alerts reviewed from queue."]]
      },
      "carrier-contact": {
        details: [["Contact", "RoadPro Desk"], ["Carrier", "CAR-118"], ["Packet state", "Ready"], ["Follow-up path", "Document correction or condition follow-up if BOF holds release."], ["Linked records", "Insurance, agreement, W-9."], ["Owner", "Carrier operations"]],
        activity: [["06/05/2026 09:18", "Carrier operations", "RoadPro packet verified."], ["06/06/2026 09:13", "S. Turner", "Carrier desk contact viewed."]]
      },
      driver002: {
        details: [["Driver", "DRV-002"], ["Queue link", "BOF-1907"], ["State", "Watch"], ["Eligibility", "Eligible with open watch review."], ["Control item", "POD follow-up."], ["Owner", "Safety desk"]],
        activity: [["06/06/2026 08:25", "Safety desk", "Driver watch row reviewed."], ["06/06/2026 08:41", "M. Ruiz", "BOF-1907 remains in watch."]]
      },
      driver003: {
        details: [["Driver", "DRV-003"], ["Queue link", "BOF-1931"], ["State", "Hold"], ["Credential", "Medical-card hold."], ["Dispatch impact", "Do not assign lane."], ["Owner", "Safety desk"]],
        activity: [["06/06/2026 08:46", "Safety desk", "Credential hold opened."], ["06/06/2026 09:02", "Alex Kim", "BOF-1931 hold confirmed."]]
      },
      driver004: {
        details: [["Driver", "DRV-004"], ["Driver name", "Daniel Kim"], ["State", "Ready"], ["Credential file", "Medical card and MVR current."], ["Dispatch impact", "Available as backup coverage."], ["Owner", "Safety desk"]],
        activity: [["06/06/2026 08:58", "Safety desk", "Reserve driver eligibility checked."], ["06/06/2026 09:06", "Operations lead", "DRV-004 marked available for backup coverage."]]
      },
      driver006: {
        details: [["Driver", "DRV-006"], ["Driver name", "Priya Patel"], ["State", "Watch"], ["Open item", "License renewal evidence due soon."], ["Dispatch impact", "Plan only after renewal evidence is confirmed."], ["Owner", "Safety desk"]],
        activity: [["06/06/2026 08:52", "Safety desk", "Renewal watch opened."], ["06/06/2026 09:04", "Operations lead", "Driver kept out of final release assignment until evidence is attached."]]
      },
      driver005: {
        details: [["Driver", "DRV-005"], ["Driver name", "Frank Miller"], ["State", "Ready"], ["Coverage", "Team-driver eligible."], ["Dispatch impact", "Available for longer routes and expedited coverage."], ["Owner", "Safety desk"]],
        activity: [["06/06/2026 08:44", "Safety desk", "Team-driver eligibility confirmed."], ["06/06/2026 09:03", "Dispatch", "DRV-005 available for longer-route planning."]]
      },
      audit: {
        details: [["Audit ID", "AUD-QUEUE-SESSION"], ["Scope", "Loads, drivers, carriers, documents, alerts, and release decision."], ["Recent owner", "S. Turner"], ["Queue activity", "Filters, search, selections, alert opens, and document actions recorded."], ["Decision trail", "Updates when Ready to Release, Hold - Action Required, or Release With Condition is selected."], ["Use", "Explain why each visible queue state changed."]],
        activity: [["06/05/2026 09:12", "S. Turner", "DRV-001 file verified."], ["06/05/2026 09:18", "S. Turner", "CAR-118 packet verified."], ["06/06/2026 09:58", "Safety desk", "DRV-006 renewal evidence requested."], ["06/06/2026 10:24", "Document desk", "BOF-2175 rate review alert opened."]]
      },
      yield: {
        details: [["Asset cost", "$185,000 tractor basis"], ["Net operating profit", "$51,800 annual estimate"], ["Truck ROA", "28.0% planning return"], ["Capital cost", "10.0% borrowing assumption"], ["Value spread", "18.0 points above capital cost"], ["Use", "Expansion review before adding trucks."]],
        activity: [["Expansion model", "Add 1 truck", "+$51.8K annual profit contribution."], ["Expansion model", "Add 5 trucks", "+$259K annual profit contribution."], ["Expansion model", "Add 10 trucks", "+$518K annual profit contribution."], ["Finance desk", "Spread check", "ROA remains above borrowing cost."]]
      },
      financeAsset: {
        details: [["Purchase price", "$185,000 tractor basis"], ["Down payment", "$27,750 planning cash down"], ["Financed amount", "$157,250 modeled debt"], ["Loan term", "60-month equipment note"], ["Interest assumption", "10.0% borrowing cost"], ["Depreciation", "Straight-line planning curve for expansion review."]],
        activity: [["Asset model", "Purchase basis", "$185K tractor cost entered."], ["Asset model", "Debt basis", "$157.25K financed amount calculated."], ["Finance desk", "Depreciation", "Planning curve attached to ROA model."]]
      },
      financeOps: {
        details: [["Revenue", "$2.42 per mile planning yield"], ["Miles", "10,500 monthly miles"], ["Load mix", "Regional dry van mix with seasonal adjustment"], ["Fuel and tires", "$9,800 monthly operating assumption"], ["Maintenance and insurance", "$4,650 monthly operating assumption"], ["Driver, compliance, BOF", "$13,350 monthly support and labor assumption."]],
        activity: [["Operating model", "Revenue", "Revenue per mile and monthly miles loaded."], ["Operating model", "Expenses", "Fuel, maintenance, insurance, tires, driver, compliance, and BOF cost grouped."], ["Finance desk", "Net profit", "$51.8K annual per-truck estimate produced."]]
      },
      financeCapital: {
        details: [["Truck ROA", "28.0% planning return"], ["Borrowing cost", "10.0% equipment finance assumption"], ["Strong-credit scenario", "8.0% planning cost of capital"], ["Higher-risk scenario", "14.0% planning cost of capital"], ["Value spread", "18.0 points in the base case"], ["Owner question", "If I borrow at 10%, what return remains?"]],
        activity: [["Capital model", "Base case", "28.0% ROA minus 10.0% capital cost."], ["Capital model", "Spread", "18.0-point value spread shown to owner."], ["Finance desk", "Scenario check", "Strong-credit and higher-risk bands available for review."]]
      },
      financeExpansion: {
        details: [["Add 1 truck", "+$51.8K annual profit contribution"], ["Add 5 trucks", "+$259K annual profit contribution"], ["Add 10 trucks", "+$518K annual profit contribution"], ["Expansion test", "Profit contribution compared with added debt service"], ["Decision use", "Shows whether expansion is worth the capital cost"], ["Next action", "Review assumptions before ordering or leasing equipment."]],
        activity: [["Expansion model", "1-truck case", "Profit contribution calculated."], ["Expansion model", "5-truck case", "Fleet-level contribution calculated."], ["Expansion model", "10-truck case", "Larger growth case prepared."], ["Owner review", "Expansion yield", "Compare value spread before adding equipment."]]
      },
      alerts: {
        details: [["Alert count", "4"], ["Document alert", "TMS-LD-10482 import document review."], ["Credential alert", "DRV-003 medical-card hold."], ["Rate alert", "BOF-2175 rate confirmation review."], ["Renewal alert", "DRV-006 evidence watch."], ["Dispatch impact", "Prevents quiet release mistakes."]],
        activity: [["06/06/2026 09:05", "System", "Partner import document alert active."], ["06/06/2026 09:06", "System", "Credential hold alert active."], ["06/06/2026 10:24", "Document desk", "BOF-2175 rate review alert active."], ["06/06/2026 10:28", "Safety desk", "DRV-006 renewal watch alert active."]]
      },
      help: {
        details: [["Step 1", "Select the TMS import."], ["Step 2", "Review BOF driver match and carrier readiness."], ["Step 3", "Inspect the load document packet."], ["Step 4", "Choose the BOF release outcome."], ["Step 5", "Review the simulated handoff record."], ["Support", "BOF keeps next action visible."]],
        activity: [["06/06/2026 09:13", "BOF support", "Help panel opened."]]
      },
      command: {
        details: [["View", "Command Center"], ["Primary row", "TMS-LD-10482"], ["Origin", "Dallas, TX"], ["Destination", "Memphis, TN"], ["Route status", "Pickup staged; release still under BOF review."], ["Driver", "DRV-001 fleet-owned driver file is ready."], ["Carrier", "CAR-118 carrier packet is ready; it is not treated as a fleet employee file."], ["Documents", "Pickup instructions, BOL image, seal photo, delivery proof state, and claim evidence state stay visible."], ["Operating context", "HOS available, fuel plan attached, traffic clear, weather watch, backhaul review open."], ["Priority reason", "High: release decision controls today's dispatch window and customer handoff."], ["Owner next action", "S. Turner chooses Ready, Release With Condition, or Hold."], ["Audit proof", "Readiness, decision, owner, next action, and simulated handoff are recorded."]],
        activity: [["06/06/2026 09:00", "Operations lead", "Command Center opened."], ["06/06/2026 09:05", "System", "Queue counters refreshed."], ["06/06/2026 09:10", "S. Turner", "Selected TMS-LD-10482 for readiness review."], ["06/06/2026 09:12", "Safety desk", "Driver and carrier records shown in selected-load context."]]
      },
      dispatchView: {
        details: [["Board", "Dispatch Board"], ["Can move", "BOF-2064 after equipment staging."], ["Document review", "TMS-LD-10482 BOL and BOF-2175 rate."], ["Watch", "BOF-1907 POD and BOF-2258 renewal evidence."], ["Held", "BOF-1931 until credential clears."], ["Record basis", "Status tied to readiness records."]],
        activity: [["06/06/2026 09:11", "Dispatcher", "Dispatch gate viewed."], ["06/06/2026 09:12", "S. Turner", "BOF readiness gate confirmed."], ["06/06/2026 10:24", "Document desk", "BOF-2175 rate review held from release."], ["06/06/2026 10:34", "Dispatch desk", "BOF-2064 staged as the ready lane."]]
      },
      documentsView: {
        details: [["Document tabs", "7 primary TMS-LD-10482 tabs"], ["Import records", "Pickup instructions, BOL, seal photo, delivery proof state, claim evidence state."], ["Exception records", "POD-1907, MED-DRV-003, BOF-2175 rate review, DRV-006 renewal watch."], ["Decision note", "REL-10482-DECISION"], ["Behavior", "Tabs change viewer; rows open complete records."], ["Owner", "Document desk"]],
        activity: [["06/06/2026 09:10", "Document desk", "Import document tab opened."], ["06/06/2026 09:11", "Document desk", "Simulated handoff note available."], ["06/06/2026 10:24", "Document desk", "BOF-2175 rate review opened."], ["06/06/2026 10:28", "Safety desk", "DRV-006 renewal evidence linked."]]
      },
      safetyView: {
        details: [["Ready drivers", "DRV-001, DRV-004, DRV-005"], ["Watch drivers", "DRV-002 and DRV-006"], ["Held driver", "DRV-003"], ["Credential hold", "Medical card blocks BOF-1931."], ["Renewal watch", "DRV-006 controls BOF-2258 planning."], ["Owner", "Safety desk"]],
        activity: [["06/05/2026 09:12", "Safety desk", "DRV-001 verified."], ["06/06/2026 08:44", "Safety desk", "DRV-005 team-driver eligibility confirmed."], ["06/06/2026 09:02", "Safety desk", "DRV-003 hold confirmed."], ["06/06/2026 09:58", "Safety desk", "DRV-006 renewal evidence requested."]]
      },
      carrier204: {
        details: [["Carrier", "CAR-204"], ["Queue links", "BOF-1907 and BOF-2175"], ["State", "Watch"], ["Open items", "Renewal confirmation and rate-review visibility."], ["Dispatch impact", "Prepare both lanes but review before release."], ["Owner", "Carrier operations"]],
        activity: [["06/06/2026 08:33", "Carrier operations", "Renewal check opened."], ["06/06/2026 08:42", "M. Ruiz", "Watch state kept active."], ["06/06/2026 10:24", "Document desk", "BOF-2175 rate-review link checked against CAR-204."]]
      },
      carrier088: {
        details: [["Carrier", "CAR-088"], ["Queue link", "BOF-1931"], ["State", "Hold"], ["Carrier issue", "No carrier blocker shown."], ["Controlling blocker", "DRV-003 credential hold."], ["Owner", "Carrier operations"]],
        activity: [["06/06/2026 08:48", "Carrier operations", "Carrier assignment checked."], ["06/06/2026 09:02", "Safety desk", "Driver credential remains blocker."]]
      },
      pod1907: {
        details: [["Record", "POD-1907"], ["Load", "BOF-1907"], ["State", "Watch"], ["Delivery timestamp", "Needs dispatcher confirmation before release clears."], ["GPS/location", "Delivery location ping must match receiver site."], ["Receiver/signature", "Receiver name and signature must be attached."], ["Dock photo", "POD-1907-DOCK-IMG attached for delivery proof."], ["Empty cargo photo", "POD-1907-EMPTY-IMG attached for settlement and claims support."], ["Notes", "Watch item remains open until the evidence packet is confirmed."], ["Settlement effect", "Keep settlement release on watch until proof is attached."], ["Claim effect", "Photo packet supports claim response if an exception opens."], ["Owner", "M. Ruiz"], ["Next action", "Confirm POD, GPS/location, signature, dock photo, and empty-cargo photo."]],
        activity: [["06/06/2026 08:31", "M. Ruiz", "POD follow-up opened."], ["06/06/2026 08:34", "Dispatcher", "Receiver and timestamp confirmation requested."], ["06/06/2026 08:36", "Carrier operations", "Carrier renewal also checked."], ["06/06/2026 08:42", "M. Ruiz", "Watch state kept until photo evidence clears."]]
      },
      posttrip: {
        details: [["Record", "POSTTRIP-1907"], ["Load", "BOF-1907"], ["Closeout state", "Delivered; settlement proof review open."], ["POD", "POD-1907 remains linked to closeout."], ["Receiver/signature", "N. Harper signoff expected on POD-1907-SIG."], ["Signed BOL", "BOL-1907-SIGNED-IMG linked for closeout review."], ["Delivery timestamp", "06/06/2026 08:18 CST."], ["GPS/location", "KC-CONS-DOCK-07 geofence match retained with delivery record."], ["Dock photo", "POD-1907-DOCK-IMG attached for delivery-location proof."], ["Empty trailer photo", "POD-1907-EMPTY-IMG attached for post-unload proof."], ["Lumper receipt", "No lumper service required for this receiver lane."], ["Settlement release", "Keep settlement on watch until POD, timestamp, location, signature, and photos clear."], ["Claim/dispute", "No claim open; claim folder stands by for shortage, damage, late arrival, seal dispute, or receiver exception."], ["Owner", "M. Ruiz"], ["Next action", "Confirm closeout proof before settlement release."]],
        activity: [["06/06/2026 08:18", "Receiver desk", "Delivery closeout timestamp captured."], ["06/06/2026 08:31", "M. Ruiz", "Post-trip closeout opened."], ["06/06/2026 08:36", "Dispatcher", "Lumper state marked not required."], ["06/06/2026 08:42", "M. Ruiz", "Settlement stays on watch; claim folder standby retained."]]
      },
      signedbol1907: {
        details: [["Record", "BOL-1907-SIGNED-IMG"], ["Load", "BOF-1907"], ["Document", "Signed BOL delivery signoff."], ["Receiver", "N. Harper / Kansas City Consolidation Yard."], ["Delivered", "06/06/2026 08:18 CST."], ["OS&D", "No shortage or damage noted at first review."], ["Settlement effect", "Settlement waits for proof match."], ["Owner", "M. Ruiz"], ["Next action", "Match signed BOL against POD, GPS/location, dock photo, and empty trailer proof."]],
        activity: [["06/06/2026 08:18", "Receiver desk", "Signed BOL captured."], ["06/06/2026 08:34", "Dispatcher", "Signed BOL linked to closeout packet."], ["06/06/2026 08:42", "M. Ruiz", "Signed BOL retained for settlement review."]]
      },
      dockphoto1907: {
        details: [["Record", "POD-1907-DOCK-IMG"], ["Load", "BOF-1907"], ["Photo type", "Delivery-location dock photo."], ["Timestamp", "06/06/2026 08:21 CST."], ["Location", "KC-CONS-DOCK-07."], ["Source", "Driver mobile capture."], ["Settlement effect", "Supports delivery proof."], ["Claim effect", "Available if a delivery exception opens."], ["Owner", "M. Ruiz"]],
        activity: [["06/06/2026 08:21", "Driver mobile", "Dock photo attached."], ["06/06/2026 08:42", "M. Ruiz", "Dock photo reviewed."]]
      },
      emptyphoto1907: {
        details: [["Record", "POD-1907-EMPTY-IMG"], ["Load", "BOF-1907"], ["Photo type", "Empty trailer proof after unload."], ["Timestamp", "06/06/2026 08:27 CST."], ["Condition", "Trailer clear after delivery."], ["Source", "Driver mobile capture."], ["Settlement effect", "Supports payment release."], ["Claim effect", "Available if shortage dispute opens."], ["Owner", "M. Ruiz"]],
        activity: [["06/06/2026 08:27", "Driver mobile", "Empty trailer photo attached."], ["06/06/2026 08:42", "M. Ruiz", "Empty trailer proof reviewed."]]
      },
      backhaul: {
        details: [["Board", "BACKHAUL-1907"], ["Delivery context", "BOF-1907 delivered into Kansas City, MO; POD proof remains on watch."], ["KC to Tulsa option", "Pickup 18 mi from receiver; dry van plastics load; home-lane fit back toward Tulsa."], ["Independence to Dallas option", "Pickup 24 mi from receiver; dry van packaging load; return direction toward Dallas network."], ["Olathe to Springfield option", "Pickup 31 mi from receiver; dry van appliance load; partial return-lane fit."], ["Equipment fit", "All listed options are dry-van compatible; no reefer or flatbed mismatch shown."], ["Timing fit", "Pickup windows run 11:30-15:30 after the 08:18 delivery timestamp."], ["Deadhead effect", "Options reduce empty miles from a blind reposition to a reviewed pickup within 18-31 miles."], ["Next action", "Dispatch desk confirms POD proof, carrier availability, and pickup appointment before committing a backhaul."]],
        activity: [["06/06/2026 08:44", "Dispatch desk", "Backhaul review opened after BOF-1907 delivery check-in."], ["06/06/2026 08:47", "M. Ruiz", "Kansas City-area options filtered by dry-van equipment and pickup distance."], ["06/06/2026 08:50", "Dispatch desk", "Tulsa and Dallas return-lane fit marked for owner review."], ["06/06/2026 08:54", "Dispatch desk", "Commitment waits on POD proof and appointment confirmation."]]
      },
      settlement: {
        details: [["Settlement desk", "SETTLE-10482"], ["Load revenue", "$4,850.00 gross revenue attached to TMS-LD-10482."], ["Driver pay", "DRV-001: 612 miles x $0.74 plus stop, safety, and document-return pay."], ["Pay methods shown", "Cents per mile, percentage of revenue, hourly, and salary-style allocation."], ["Deductions", "HSA, garnishment, health care plan, and life insurance plan use protected fictional references."], ["Hold logic", "Missing POD, receiver signature, receipt, or required delivery proof keeps settlement on watch."], ["Privacy", "No real bank, tax, medical, garnishment, or benefit values shown."], ["Owner", "Fleet finance desk"]],
        activity: [["06/06/2026 09:12", "Fleet finance desk", "Settlement desk linked to TMS-LD-10482 release packet."], ["06/06/2026 09:16", "Payroll desk", "DRV-001 mileage-pay draft prepared."], ["06/06/2026 09:20", "Back office", "Protected deduction packet confirmed."], ["06/06/2026 09:24", "M. Ruiz", "BOF-1907 hold example kept open until POD proof clears."]]
      },
      settlementRevenue: {
        details: [["Record", "REV-TMS-LD-10482"], ["Linehaul", "$4,250.00"], ["Fuel surcharge", "$410.00"], ["Detention allowance", "$125.00 pending delivery proof"], ["Accessorial review", "$65.00 document return allowance"], ["Gross load revenue", "$4,850.00"], ["Settlement dependency", "Final release and post-trip proof packet must clear before payment release."], ["Owner", "Fleet finance desk"]],
        activity: [["06/05/2026 09:21", "Fleet finance desk", "Revenue packet attached to release review."], ["06/06/2026 09:14", "S. Turner", "Revenue checked against release decision."], ["06/06/2026 09:18", "Payroll desk", "Driver pay draft compared against load revenue."]]
      },
      settlementDriverPay: {
        details: [["Primary driver", "DRV-001 / John Carter"], ["Cents per mile", "612 miles x $0.74 = $452.88"], ["Stop / document pay", "$160.00 combined safety, stop, and document-return allowance"], ["Prepared driver pay", "$612.74 before protected deductions"], ["Percentage example", "DRV-005: 28% of linehaul when a revenue-share agreement applies."], ["Hourly example", "DRV-004: 8.5 hours x $31.00 for local/private-fleet style work."], ["Salary-style example", "DRV-006 weekly salary allocation shown with route note."], ["Owner", "Payroll desk"]],
        activity: [["06/06/2026 09:16", "Payroll desk", "Mileage-pay draft prepared for DRV-001."], ["06/06/2026 09:18", "Fleet finance desk", "Percentage, hourly, and salary-style methods added as comparison examples."], ["06/06/2026 09:25", "S. Turner", "Pay method record reviewed from Settlement lens."]]
      },
      settlementDeductions: {
        details: [["Record", "DED-PROTECTED-2026"], ["HSA", "HSA-DRV001-2026 filed; amount protected."], ["Garnishment", "GARN-DRV007-COURTREF fictional example; no real legal values."], ["Health care", "HC-PLAN-DRV001 active; premium value protected."], ["Life insurance", "LIFE-DRV001-BASIC filed; beneficiary detail protected."], ["Payroll privacy", "No real bank, tax, medical, or court data exposed."], ["Settlement use", "Shows deduction-readiness depth without becoming a live payroll system."], ["Owner", "Back office"]],
        activity: [["06/06/2026 09:20", "Back office", "Protected deduction packet confirmed."], ["06/06/2026 09:21", "Payroll desk", "HSA and health plan references reviewed."], ["06/06/2026 09:22", "Back office", "Garnishment example retained as fictional protected token."]]
      },
      settlementHold: {
        details: [["Hold record", "HOLD-BOF-1907"], ["Linked load", "BOF-1907 delivered; settlement proof review open."], ["Missing receipt", "Receipt requirement stays watch-only until the driver or dispatcher attaches the required item."], ["POD", "POD must show timestamp, GPS/location, receiver, and signature."], ["Receiver signature", "Receiver signoff must match signed BOL and POD packet."], ["Required information", "Dock photo and empty trailer photo remain part of the proof packet."], ["Incentive", "Settlement release waits for proof, giving the driver a clear reason to submit complete documents."], ["Owner", "M. Ruiz"]],
        activity: [["06/06/2026 08:31", "M. Ruiz", "Settlement hold watch opened for BOF-1907."], ["06/06/2026 08:34", "Dispatcher", "Receiver signature and POD details requested."], ["06/06/2026 08:42", "M. Ruiz", "Hold stays open until proof packet clears."]]
      },
      credential1931: {
        details: [["Credential", "Medical card"], ["Driver", "DRV-003"], ["Load", "BOF-1931"], ["State", "Hold"], ["Dispatch impact", "Do not assign or release."], ["Owner", "Safety desk"]],
        activity: [["06/06/2026 08:46", "Safety desk", "Medical-card issue opened."], ["06/06/2026 09:02", "Alex Kim", "Hold state acknowledged."]]
      },
      session: {
        details: [["Workspace", "BOF Control Center"], ["Primary scenario", "TMS-LD-10482 partner import review"], ["Rows available", "6 visible load rows"], ["Active alerts", "4 clickable operating alerts"], ["Actions", "Ready to Release, Hold - Action Required, Release With Condition, restart session."], ["State", "Active simulated review session."]],
        activity: [["06/06/2026 09:00", "Operations lead", "Control Center session opened."], ["06/06/2026 09:10", "S. Turner", "TMS-LD-10482 selected."], ["06/06/2026 10:24", "Document desk", "Rate review added to alert queue."], ["06/06/2026 10:28", "Safety desk", "Renewal watch added to alert queue."]]
      }
    };

    var workspaceViews = {
      command: {
        eyebrow: "Command Center",
        title: "Selected-load operating view",
        summary: "See where TMS-LD-10482 is, who is driving, which records are ready, which document still needs review, and what the owner should do next.",
        tableHeads: ["Operating question", "Current answer", "Action"],
        tableRows: [["Where is the load?", "Dallas to Memphis, pickup staged, release still under BOF review.", "load"], ["Who is driving?", "DRV-001 is eligible; driver file does not block release.", "driver"], ["What documents matter?", "Pre-trip packet ready; BOL image and future POD proof stay visible.", "pretrip"], ["What is the route context?", "GPS, HOS, fuel, traffic, weather, and safety watch are tracked in transit.", "transit"], ["What should happen next?", "S. Turner chooses Ready, Conditional, or Hold.", "release"]],
        metrics: [["High", "priority review", "load"], ["9", "document signals", "documentsView"], ["4", "active alerts", "alerts"]],
        items: [
          ["Route and status", "Dallas to Memphis, high priority, review owner S. Turner.", "load"],
          ["Driver and carrier", "DRV-001 is fleet-owned and ready; CAR-118 is a carrier packet, not a driver file.", "driver"],
          ["Pre-trip packet", "Rate, pickup, assignment, equipment, cargo, and seal records answer whether the trip can take off.", "pretrip"],
          ["Transit context", "GPS lane, deviation, alternate route, HOS, fuel, safety watch, and on-track answer are visible.", "transit"],
          ["Simulated handoff", "Decision, blocker, owner, next action, and audit note stay inspectable.", "release"]
        ]
      },
      loads: {
        eyebrow: "Load Queue",
        title: "Six-load partner import queue",
        summary: "Compare the active TMS-import with ready, review, watch, and hold rows, then keep every load tied to a clear owner and next action.",
        tableHeads: ["Load", "Current blocker", "Open"],
        tableRows: [["TMS-LD-10482", "BOF readiness packet controls release outcome.", "load"], ["BOF-1907", "POD follow-up and carrier renewal check.", "comparison1907"], ["BOF-1931", "Driver medical-card hold blocks assignment.", "comparison1931"], ["BOF-2064", "Dispatch staging note after readiness clears.", "comparison2064"], ["BOF-2175", "Rate confirmation match needs review.", "comparison2175"], ["BOF-2258", "Driver renewal evidence stays on watch.", "comparison2258"]],
        metrics: [["6", "loads in queue", "load"], ["1", "selected row", "selected"], ["1", "held lane", "comparison1931"]],
        items: [
          ["TMS-LD-10482", "Dallas to Memphis is waiting on BOF readiness decision.", "load"],
          ["BOF-1907", "Tulsa to Kansas City is a watch record for POD follow-up.", "comparison1907"],
          ["BOF-1931", "Little Rock to St. Louis is held by driver credential status.", "comparison1931"],
          ["BOF-2064", "Birmingham to Nashville is release-ready with a dispatch staging note.", "comparison2064"],
          ["BOF-2175", "Mobile to Atlanta remains in rate confirmation review.", "comparison2175"],
          ["BOF-2258", "Shreveport to Jackson is on driver renewal watch.", "comparison2258"]
        ]
      },
      dispatch: {
        eyebrow: "Dispatch Board",
        title: "What can move, what must wait",
        summary: "Dispatch sees which lane is ready, which rows are under review, which lanes are watch-only, and who owns the correction before release.",
        tableHeads: ["Dispatch gate", "Consequence", "Open"],
        tableRows: [["Ready lane", "BOF-2064 can stage after equipment timing.", "comparison2064"], ["Readiness gate", "TMS-LD-10482 cannot move before BOF decision.", "bol"], ["Rate review", "BOF-2175 waits on rate confirmation match.", "comparison2175"], ["Backhaul watch", "BOF-1907 has Kansas City return-load options after delivery proof clears.", "backhaul"], ["Renewal watch", "BOF-2258 stays planned until DRV-006 evidence clears.", "driver006"], ["Hold lane", "BOF-1931 cannot assign until credential clears.", "credential1931"]],
        metrics: [["1", "ready lane", "comparison2064"], ["2", "review gates", "bol"], ["1", "held lane", "credential1931"]],
        items: [
          ["Ready staging", "BOF-2064 can move once dispatch confirms equipment timing.", "comparison2064"],
          ["Release gate", "TMS-LD-10482 cannot release until BOF-RR-10482 clears.", "bol"],
          ["Rate review", "BOF-2175 remains in review until the rate record matches.", "comparison2175"],
          ["Backhaul review", "BOF-1907 return-load options are filtered by pickup distance, home-lane fit, equipment, and timing.", "backhaul"],
          ["Watch consequence", "BOF-2258 stays planned but uncommitted while renewal evidence is pending.", "driver006"]
        ]
      },
      drivers: {
        eyebrow: "Drivers",
        title: "Driver readiness roster",
        summary: "Driver records expose eligibility, backup coverage, upcoming expirations, medical-card holds, dispatch use, and whether a driver blocks a load assignment.",
        tableHeads: ["Driver", "Readiness state", "Open"],
        tableRows: [["DRV-001", "Eligible for TMS-LD-10482.", "driver"], ["DRV-004", "Ready reserve driver for backup coverage.", "driver004"], ["DRV-005", "Ready team-driver coverage.", "driver005"], ["DRV-002", "Watch state tied to BOF-1907.", "driver002"], ["DRV-006", "License renewal evidence on watch.", "driver006"], ["DRV-003", "Medical-card hold blocks BOF-1931.", "driver003"]],
        metrics: [["3", "ready drivers", "driver"], ["2", "watch drivers", "driver006"], ["1", "credential hold", "driver003"]],
        items: [
          ["DRV-001", "Eligible for TMS-LD-10482 and does not block release.", "driver"],
          ["DRV-004", "Ready reserve driver available if coverage changes.", "driver004"],
          ["DRV-005", "Team-driver coverage is cleared for longer-route planning.", "driver005"],
          ["DRV-002", "Watch state stays visible on the BOF-1907 queue record.", "driver002"],
          ["DRV-006", "Renewal watch is visible before it becomes a dispatch hold.", "driver006"],
          ["DRV-003", "Credential hold blocks BOF-1931 assignment.", "driver003"]
        ]
      },
      carriers: {
        eyebrow: "Carriers",
        title: "Carrier packet readiness",
        summary: "Carrier status explains whether insurance, agreement, W-9, and packet records support the six-load release queue.",
        tableHeads: ["Carrier", "Packet state", "Open"],
        tableRows: [["CAR-118", "RoadPro packet ready for TMS-LD-10482, BOF-2064, and BOF-2258.", "carrier"], ["CAR-204", "Renewal and rate checks visible for BOF-1907 and BOF-2175.", "carrier204"], ["CAR-088", "Held assignment while the BOF-1931 driver blocker remains.", "carrier088"]],
        metrics: [["3", "CAR-118 load links", "carrier"], ["2", "CAR-204 checks", "carrier204"], ["1", "held assignment", "carrier088"]],
        items: [
          ["CAR-118", "RoadPro Logistics packet is ready for TMS-LD-10482, BOF-2064, and BOF-2258.", "carrier"],
          ["CAR-204", "Renewal and rate-review checks remain visible for BOF-1907 and BOF-2175.", "carrier204"],
          ["CAR-088", "Carrier cannot clear BOF-1931 until driver eligibility is resolved.", "carrier088"]
        ]
      },
      documents: {
        eyebrow: "Documents",
        title: "Document and exception records",
        summary: "Every named document, queue exception, and release note opens a complete in-app record with owner, status, consequence, and next action.",
        tableHeads: ["Record", "Record purpose", "Open"],
        tableRows: [["BOF-RR-10482-DOCS", "Controls the primary TMS-LD-10482 release decision.", "bol"], ["PRETRIP-10482", "Confirms rate, pickup, assignment, equipment, cargo, seal, and takeoff readiness.", "pretrip"], ["RC-10482", "Confirms lane and rate for TMS-LD-10482.", "rate"], ["POD-1907", "Keeps the BOF-1907 watch item inspectable.", "pod1907"], ["POSTTRIP-1907", "Connects BOF-1907 delivery proof to settlement and claim/dispute follow-up.", "posttrip"], ["MED-DRV-003", "Explains why BOF-1931 stays held.", "credential1931"], ["BOF-2175 rate review", "Matches rate confirmation before release.", "comparison2175"], ["DRV-006 renewal evidence", "Controls BOF-2258 assignment planning.", "driver006"], ["REL-10482-DECISION", "Captures Ready, Hold, or Conditional release decision.", "release"]],
        metrics: [["7", "primary tabs", "documentsView"], ["4", "exception records", "alerts"], ["1", "release note", "release"]],
        items: [
          ["Document review", "TMS-LD-10482 cannot release until BOF-RR-10482 is reviewed.", "bol"],
          ["Pre-trip packet", "PRETRIP-10482 shows rate, schedule, pickup, assignment, equipment, cargo, and seal readiness.", "pretrip"],
          ["POD follow-up", "BOF-1907 remains watch-only until POD evidence is attached.", "pod1907"],
          ["Post-trip closeout", "POSTTRIP-1907 shows lumper state, settlement consequence, and claim/dispute standby.", "posttrip"],
          ["Credential hold", "BOF-1931 stays held until DRV-003 clears.", "credential1931"],
          ["Rate review", "BOF-2175 needs the rate record matched before release.", "comparison2175"],
          ["Renewal evidence", "DRV-006 controls BOF-2258 planning.", "driver006"]
        ]
      },
      settlement: {
        eyebrow: "Settlements",
        title: "Settlement and payroll proof",
        summary: "Review load revenue, driver pay, protected deductions, and proof-based settlement holds in the same release workflow.",
        tableHeads: ["Settlement item", "Operating detail", "Open"],
        tableRows: [["Load revenue", "$4,850.00 gross revenue tied to TMS-LD-10482.", "settlementRevenue"], ["DRV-001 pay", "Cents-per-mile draft plus stop, safety, and document-return pay.", "settlementDriverPay"], ["Pay method examples", "Percentage, hourly, and salary-style driver pay models represented.", "settlementDriverPay"], ["Protected deductions", "HSA, garnishment, health care, and life insurance references are privacy-safe.", "settlementDeductions"], ["Settlement hold", "Missing POD, receiver signature, receipt, or required delivery proof keeps settlement on watch.", "settlementHold"]],
        metrics: [["$4,850", "load revenue", "settlementRevenue"], ["4", "pay methods", "settlementDriverPay"], ["1", "hold watch", "settlementHold"]],
        items: [
          ["Revenue packet", "Linehaul, fuel surcharge, detention, accessorial review, and gross revenue stay tied to the release packet.", "settlementRevenue"],
          ["Driver pay method", "DRV-001 mileage pay is visible, with percentage, hourly, and salary-style comparison methods.", "settlementDriverPay"],
          ["Deductions", "Protected fictional deduction references show payroll depth without exposing private values.", "settlementDeductions"],
          ["Hold incentive", "Settlement waits for required proof so drivers have a clear reason to return complete documents.", "settlementHold"]
        ]
      },
      safety: {
        eyebrow: "Safety & Compliance",
        title: "Credential consequence view",
        summary: "Safety status stays connected to dispatch eligibility so ready, watch, and held drivers explain each load state.",
        tableHeads: ["Safety item", "Dispatch consequence", "Open"],
        tableRows: [["DRV-001", "Eligible and clear for TMS-LD-10482.", "driver"], ["DRV-004", "Ready reserve coverage supports BOF-2064.", "driver004"], ["DRV-005", "Team-driver eligible for BOF-2175 planning.", "driver005"], ["DRV-006", "Renewal watch controls BOF-2258 planning.", "driver006"], ["DRV-003", "Credential hold blocks BOF-1931.", "credential1931"]],
        metrics: [["3", "ready drivers", "driver"], ["2", "watch drivers", "driver006"], ["1", "medical hold", "credential1931"]],
        items: [
          ["DRV-001 medical card", "Current and not blocking TMS-LD-10482.", "driver"],
          ["DRV-004 reserve file", "Ready reserve coverage can support BOF-2064.", "driver004"],
          ["DRV-006 renewal evidence", "Watch state controls BOF-2258 assignment planning.", "driver006"],
          ["DRV-003 medical card", "Hold state blocks BOF-1931.", "credential1931"],
          ["Safety desk ownership", "Credential status ties directly to dispatch consequence.", "safetyView"]
        ]
      },
      reports: {
        eyebrow: "Reports",
        title: "Truck ROA and expansion yield",
        summary: "Compare each truck's operating return with the planning cost of capital, then see whether adding trucks creates value above the borrowing cost.",
        tableHeads: ["Finance signal", "Model result", "Open"],
        tableRows: [["Asset cost", "Purchase price, down payment, loan term, interest, and depreciation.", "financeAsset"], ["Revenue and expense", "Revenue per mile, monthly miles, load mix, fuel, maintenance, insurance, driver, compliance, and BOF cost.", "financeOps"], ["Cost of capital", "Borrowing scenarios compared against truck ROA.", "financeCapital"], ["Expansion yield", "Add 1, 5, or 10 trucks and compare profit contribution.", "financeExpansion"], ["Audit trail", "Keep the operating evidence behind the model visible.", "audit"]],
        metrics: [["28%", "truck ROA", "yield"], ["10%", "capital cost", "financeCapital"], ["18 pts", "value spread", "financeExpansion"]],
        items: [
          ["Asset cost", "Purchase, down payment, loan term, interest, and depreciation assumptions stay visible.", "financeAsset"],
          ["Operating economics", "Revenue, fuel, maintenance, insurance, driver, compliance, and BOF service cost drive the model.", "financeOps"],
          ["Expansion spread", "BOF shows the return captured by the fleet owner above the lender's capital cost.", "financeCapital"]
        ]
      },
      alerts: {
        eyebrow: "Alerts",
        title: "Active operating alerts",
        summary: "Alerts stay tied to named load, driver, document, and dispatch records instead of becoming disconnected notifications.",
        tableHeads: ["Alert", "Required response", "Open"],
        tableRows: [["Partner import review", "S. Turner chooses Ready, Conditional, or Hold for BOF-RR-10482.", "bol"], ["Credential hold", "Safety desk clears DRV-003 medical-card record.", "credential1931"], ["Rate review", "Document desk matches the BOF-2175 rate confirmation.", "comparison2175"], ["Renewal watch", "Safety desk confirms DRV-006 renewal evidence for BOF-2258.", "driver006"]],
        metrics: [["4", "active alerts", "alerts"], ["2", "document checks", "bol"], ["2", "safety checks", "credential1931"]],
        items: [
          ["TMS-LD-10482 import review", "Release waits on BOF readiness decision.", "bol"],
          ["BOF-1931 credential hold", "Driver medical-card hold blocks assignment.", "credential1931"],
          ["BOF-2175 rate review", "Rate confirmation must match the lane before release.", "comparison2175"],
          ["BOF-2258 renewal watch", "DRV-006 renewal evidence controls assignment planning.", "driver006"]
        ]
      },
      settings: {
        eyebrow: "Settings",
        title: "Session role and workspace settings",
        summary: "The workspace shows who can decide the release, which fleet is active, how many rows are in scope, and how the app keeps the session self-contained.",
        tableHeads: ["Setting", "Session value", "Open"],
        tableRows: [["Fleet", "Delta Advanced Trucking.", "fleet"], ["Role", "Operations Lead owns the release decision.", "user"], ["Queue scope", "6 loads, 6 drivers, 3 carrier states, 4 alerts.", "session"], ["App scope", "Operational clicks remain inside the control center.", "session"]],
        metrics: [["1", "fleet workspace", "fleet"], ["6", "load rows", "session"], ["0", "external links", "session"]],
        items: [
          ["S. Turner", "Operations lead for TMS-LD-10482 and the expanded queue review.", "user"],
          ["Delta Advanced Trucking", "Active fleet workspace with release, dispatch, safety, carrier, and finance surfaces.", "fleet"],
          ["Session scope", "The control panel holds the queue, records, alerts, and release controls in one shell.", "session"]
        ]
      }
    };

    function setText(name, value) {
      interactiveDemo.querySelectorAll('[data-app-target="' + name + '"]').forEach(function (target) {
        target.textContent = value;
      });
    }

    function setHtml(name, value) {
      interactiveDemo.querySelectorAll('[data-app-target="' + name + '"]').forEach(function (target) {
        target.innerHTML = value;
      });
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function (character) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[character];
      });
    }

    function setLoadingText(value) {
      interactiveDemo.querySelectorAll("[data-loading-target]").forEach(function (target) {
        target.textContent = value;
      });
    }

    function setInspectorOpen(open) {
      appState.inspectorOpen = open;
      interactiveDemo.setAttribute("data-inspector-state", open ? "open" : "closed");
      interactiveDemo.querySelectorAll('[data-panel-toggle="selected-pane"]').forEach(function (button) {
        button.setAttribute("aria-expanded", String(open));
        if (button.classList.contains("inspector-toggle")) {
          button.textContent = open ? "Hide selected load" : "Show selected load";
        }
      });
    }

    function setButton(name, text, recordKey) {
      interactiveDemo.querySelectorAll('[data-app-target="' + name + '"]').forEach(function (target) {
        target.textContent = text;
        if (recordKey) target.setAttribute("data-record-open", recordKey);
      });
    }

    function setStatusClass(element, stateClass) {
      if (!element) return;
      element.classList.remove("review", "ready", "blocked", "watch");
      element.classList.add(stateClass);
    }

    function updateStatuses(targetName, text, stateClass) {
      interactiveDemo.querySelectorAll('[data-app-target="' + targetName + '"]').forEach(function (target) {
        target.textContent = text;
        setStatusClass(target, stateClass);
      });
    }

    function setUtility(message, recordKey) {
      appState.utilityRecord = recordKey || appState.activeRecord || "load";
      interactiveDemo.querySelectorAll('[data-app-target="utilityMessage"]').forEach(function (target) {
        target.textContent = message;
        target.setAttribute("data-record-open", appState.utilityRecord);
        target.setAttribute("aria-label", message + " Open related record.");
      });
    }

    var demoMotionTimer = null;
    function markDemoMotion(extraSelectors) {
      if (reducedMotion) return;
      var selectors = [".selected-pane", ".document-viewer", ".packet-pane", ".app-toast"].concat(extraSelectors || []);
      var animated = [];
      selectors.forEach(function (selector) {
        interactiveDemo.querySelectorAll(selector).forEach(function (target) {
          target.classList.remove("is-motion-changing", "is-motion-pulse");
          target.offsetHeight;
          target.classList.add(selector.indexOf("[data-app-target") >= 0 || selector.indexOf(".mini-status") >= 0 ? "is-motion-pulse" : "is-motion-changing");
          animated.push(target);
        });
      });
      if (demoMotionTimer) window.clearTimeout(demoMotionTimer);
      demoMotionTimer = window.setTimeout(function () {
        animated.forEach(function (target) {
          target.classList.remove("is-motion-changing", "is-motion-pulse");
        });
      }, 680);
    }

    function renderSessionTrail() {
      setHtml("sessionTrailRows", appState.sessionTrail.map(function (event) {
        return '<li><button type="button" data-record-open="' + escapeHtml(event[3] || "load") + '"><span>' + escapeHtml(event[0]) + "</span><strong>" + escapeHtml(event[1]) + "</strong><em>" + escapeHtml(event[2]) + "</em></button></li>";
      }).join(""));
    }

    function addSessionTrail(kind, title, detail, recordKey) {
      var nextEvent = [kind, title, detail, recordKey || "load"];
      var first = appState.sessionTrail[0];
      if (first && first[0] === nextEvent[0] && first[1] === nextEvent[1] && first[3] === nextEvent[3]) {
        appState.sessionTrail[0] = nextEvent;
      } else {
        appState.sessionTrail.unshift(nextEvent);
      }
      appState.sessionTrail = appState.sessionTrail.slice(0, 5);
      renderSessionTrail();
    }

    function closePopovers(exceptName) {
      interactiveDemo.querySelectorAll("[data-app-popover]").forEach(function (popover) {
        if (popover.getAttribute("data-app-popover") !== exceptName) {
          popover.hidden = true;
        }
      });
    }

    function loadMatchesFilter(loadId, filterName) {
      var load = loads[loadId];
      if (!load) return false;
      if (filterName === "all") return true;
      if (filterName === "overdue") return !!load.overdue;
      if (filterName === "ready") return load.statusClass === "ready" || appState.decision === "approved" && loadId === "tms-ld-10482";
      if (filterName === "review") return load.statusClass === "review" && (!load.primary || appState.decision !== "approved" && appState.decision !== "rejected");
      if (filterName === "blocked") return load.statusClass === "blocked" || appState.decision === "rejected" && loadId === "tms-ld-10482";
      if (filterName === "watch") return load.statusClass === "watch";
      return true;
    }

    function loadMatchesSearch(loadId) {
      if (!appState.searchQuery) return true;
      var row = interactiveDemo.querySelector('[data-load-row-display="' + loadId + '"]');
      var load = loads[loadId] || {};
      var searchable = [
        row ? row.textContent : "",
        load.title,
        load.route,
        load.origin,
        load.destination,
        load.owner,
        load.status,
        load.controllingLabel,
        load.driverLabel,
        load.driverName,
        load.driverRole,
        load.carrierLabel,
        load.carrierName,
        load.carrierRole,
        load.priorityLabel,
        load.priorityReason
      ].join(" ").toLowerCase();
      return searchable.indexOf(appState.searchQuery) >= 0;
    }

    function queueFilterLabel(filterName) {
      var labels = {
        all: "All queues",
        review: "Review queue",
        watch: "Watch queue",
        blocked: "Hold queue",
        ready: "Ready queue",
        overdue: "Overdue queue"
      };
      return labels[filterName] || "Queue";
    }

    function tmsFilterLabel(filterName) {
      var labels = {
        active: "Active Partner TMS loads",
        planning: "Planning loads",
        accounting: "Ready/accounting watch",
        all: "All Partner TMS loads"
      };
      return labels[filterName] || "Partner TMS loads";
    }

    function tmsSourceForLoad(loadId) {
      for (var index = 0; index < tmsSourceLoads.length; index += 1) {
        if (tmsSourceLoads[index].loadId === loadId) return tmsSourceLoads[index];
      }
      return tmsSourceLoads[0];
    }

    function tmsSourceMatches(source) {
      var filter = appState.tmsFilter || "active";
      var filterMatch = filter === "all" || source.tab === filter || filter === "active" && (source.tab === "active" || source.loadId === appState.selectedLoad);
      if (!filterMatch) return false;
      if (!appState.tmsSearchQuery) return true;
      var searchable = [
        source.tmsLoadId,
        source.loadNumber,
        source.customer,
        source.carrier,
        source.driver,
        source.pickup,
        source.delivery,
        source.equipment,
        source.commodity,
        source.status,
        source.accounting,
        source.bofFile
      ].join(" ").toLowerCase();
      return searchable.indexOf(appState.tmsSearchQuery) >= 0;
    }

    function renderTmsSourcePanel() {
      var selectedSource = tmsSourceForLoad(appState.selectedLoad);
      var visibleSources = tmsSourceLoads.filter(tmsSourceMatches);
      if (!visibleSources.length) visibleSources = [selectedSource];
      var detailSource = visibleSources.indexOf(selectedSource) >= 0 ? selectedSource : (visibleSources[0] || selectedSource);

      interactiveDemo.querySelectorAll("[data-tms-filter]").forEach(function (button) {
        var active = button.getAttribute("data-tms-filter") === appState.tmsFilter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      setHtml("tmsRows", visibleSources.map(function (source) {
        var selected = source.loadId === detailSource.loadId;
        return [
          '<tr class="' + (selected ? "is-selected" : "") + '" data-tms-row-display="' + escapeHtml(source.loadId) + '">',
          '<td><button type="button" data-tms-load="' + escapeHtml(source.loadId) + '"><strong>' + escapeHtml(source.tmsLoadId) + '</strong><span>' + escapeHtml(source.loadNumber) + '</span></button></td>',
          '<td><button class="status ' + escapeHtml(source.statusClass) + ' status-button" type="button" data-tms-record="' + escapeHtml(source.record) + '">' + escapeHtml(source.status) + '</button></td>',
          '<td>' + escapeHtml(source.customer) + '</td>',
          '<td>' + escapeHtml(source.carrier) + '</td>',
          '<td>' + escapeHtml(source.driver) + '</td>',
          '<td>' + escapeHtml(source.pickup) + '</td>',
          '<td>' + escapeHtml(source.delivery) + '</td>',
          '<td><button type="button" data-tms-record="sourceDocs">' + escapeHtml(source.docs) + '</button></td>',
          '<td>' + escapeHtml(source.accounting) + '</td>',
          '</tr>'
        ].join("");
      }).join(""));

      setText("tmsDetailStatus", detailSource.status);
      interactiveDemo.querySelectorAll('[data-app-target="tmsDetailStatus"]').forEach(function (target) {
        setStatusClass(target, detailSource.statusClass || "review");
      });
      setText("tmsDetailTitle", detailSource.tmsLoadId + " / " + detailSource.loadNumber);
      setText("tmsDetailSummary", detailSource.summary);
      setText("tmsCustomer", detailSource.customer);
      setText("tmsEquipment", detailSource.equipment);
      setText("tmsCommodity", detailSource.commodity);
      setButton("tmsBofFile", detailSource.bofFile, detailSource.record || "load");

      setHtml("tmsStops", detailSource.stops.map(function (stop) {
        return '<button type="button" data-tms-record="' + escapeHtml(detailSource.record || "load") + '"><span>' + escapeHtml(stop[0]) + '</span><strong>' + escapeHtml(stop[1]) + '</strong><em>' + escapeHtml(stop[2]) + ' - ' + escapeHtml(stop[3]) + '</em></button>';
      }).join(""));

      setHtml("tmsDocs", detailSource.documents.map(function (doc) {
        return '<button type="button" data-tms-record="' + escapeHtml(doc[2]) + '"><span>' + escapeHtml(doc[0]) + '</span><strong>' + escapeHtml(doc[1]) + '</strong><em>Imported doc / BOF review target</em></button>';
      }).join(""));

      setHtml("tmsLog", detailSource.log.map(function (event) {
        return '<li><button type="button" data-tms-record="' + escapeHtml(event[2]) + '"><span>' + escapeHtml(event[0]) + '</span><strong>' + escapeHtml(event[1]) + '</strong><em>Open proof</em></button></li>';
      }).join(""));
    }

    function openTmsSourceLoad(sourceLoadId) {
      var source = tmsSourceForLoad(sourceLoadId);
      selectLoadContext(sourceLoadId);
      renderRecord(source.record || "load");
      addSessionTrail("Partner TMS", source.tmsLoadId + " selected", "Source load board opened " + source.bofFile + ".", source.record || "load");
      setUtility(source.tmsLoadId + " selected from Partner TMS source load board.", source.record || "load");
    }

    function resolveRecordKey(recordKey) {
      if (recordKey === "selected") return appState.selectedLoad === "tms-ld-10482" ? "load" : loads[appState.selectedLoad].doc;
      if (recordKey === "control") return loads[appState.selectedLoad].doc;
      if (recordKey === "activeDoc") return appState.activeDoc;
      if (recordKey === "decision") return appState.decision === "approved" ? "release" : "bol";
      return recordKey;
    }

    function loadIdForRecordKey(recordKey) {
      var resolvedKey = resolveRecordKey(recordKey);
      var loadRecordMap = {
        load: "tms-ld-10482",
        bol: "tms-ld-10482",
        release: "tms-ld-10482",
        comparison1907: "bof-1907",
        driver002: "bof-1907",
        pod1907: "bof-1907",
        posttrip: "bof-1907",
        signedbol1907: "bof-1907",
        dockphoto1907: "bof-1907",
        emptyphoto1907: "bof-1907",
        backhaul: "bof-1907",
        comparison1931: "bof-1931",
        driver003: "bof-1931",
        credential1931: "bof-1931",
        carrier088: "bof-1931",
        comparison2064: "bof-2064",
        driver004: "bof-2064",
        comparison2175: "bof-2175",
        driver005: "bof-2175",
        comparison2258: "bof-2258",
        driver006: "bof-2258"
      };
      return loadRecordMap[resolvedKey] || "";
    }

    function driverPageForRecordKey(recordKey) {
      var resolvedKey = resolveRecordKey(recordKey);
      var driverRouteMap = {
        driver: "/interactive-demo/drivers/drv-001/",
        driver002: "/interactive-demo/drivers/drv-002/",
        driver003: "/interactive-demo/drivers/drv-003/",
        driver004: "/interactive-demo/drivers/drv-004/",
        driver005: "/interactive-demo/drivers/drv-005/",
        driver006: "/interactive-demo/drivers/drv-006/"
      };
      return driverRouteMap[resolvedKey] || "";
    }

    function selectLoadContext(loadId) {
      var load = loads[loadId];
      if (!load) return;
      appState.selectedLoad = loadId;
      if (appState.selectedRows.indexOf(loadId) < 0) appState.selectedRows = [loadId];
      if (load.primary && appState.activeDoc.indexOf("comparison") === 0) appState.activeDoc = "bol";
      appState.activeRecord = load.primary ? "load" : load.doc;
      renderLoad();
    }

    function renderQueueControls() {
      var visibleCount = 0;
      var totalCount = 0;
      var visibleSelectedCount = 0;
      interactiveDemo.querySelectorAll("[data-load-row-display]").forEach(function (row) {
        totalCount += 1;
        var loadId = row.getAttribute("data-load-row-display");
        var visible = loadMatchesFilter(loadId, appState.queueFilter) && loadMatchesSearch(loadId);
        row.hidden = !visible;
        if (visible) visibleCount += 1;
        if (visible && appState.selectedRows.indexOf(loadId) >= 0) visibleSelectedCount += 1;
      });
      interactiveDemo.querySelectorAll("[data-queue-filter]").forEach(function (button) {
        button.classList.toggle("is-active", button.getAttribute("data-queue-filter") === appState.queueFilter);
      });
      var selectAll = interactiveDemo.querySelector("[data-select-all]");
      if (selectAll) {
        selectAll.checked = visibleCount > 0 && visibleSelectedCount === visibleCount;
        selectAll.indeterminate = visibleSelectedCount > 0 && visibleSelectedCount < visibleCount;
      }
      var label = visibleCount === 1 ? "entry" : "entries";
      setText("tableInfo", "Showing " + visibleCount + " of " + totalCount + " " + label + " | " + appState.selectedRows.length + " selected");
    }

    function syncSelectedRows() {
      appState.selectedRows = [];
      interactiveDemo.querySelectorAll("[data-select-row]").forEach(function (input) {
        if (input.checked) appState.selectedRows.push(input.getAttribute("data-select-row"));
      });
      renderQueueControls();
    }

    function renderViewerZoom() {
      setText("zoomLabel", appState.viewerZoom + "%");
      interactiveDemo.querySelectorAll(".paper-sheet").forEach(function (sheet) {
        sheet.style.transform = "scale(" + (appState.viewerZoom / 100) + ")";
        sheet.style.transformOrigin = "top left";
      });
    }

    function renderWorkspace(viewName) {
      var view = workspaceViews[viewName] || workspaceViews.command;
      appState.activeView = workspaceViews[viewName] ? viewName : "command";
      setText("workspaceEyebrow", view.eyebrow);
      setText("workspaceTitle", view.title);
      setText("workspaceSummary", view.summary);
      view.metrics.forEach(function (metric, index) {
        var oneBased = index + 1;
        setText("workspaceMetric" + ["One", "Two", "Three"][index], metric[0]);
        setText("workspaceMetric" + ["One", "Two", "Three"][index] + "Label", metric[1]);
        interactiveDemo.querySelectorAll('[data-workspace-action="' + (index === 0 ? "primary" : index === 1 ? "secondary" : "tertiary") + '"]').forEach(function (button) {
          button.setAttribute("data-workspace-open", metric[2]);
          button.setAttribute("aria-label", "Open " + metric[1]);
        });
      });
      setHtml("workspaceItems", view.items.map(function (item) {
        return '<li><button type="button" data-workspace-open="' + item[2] + '"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></button></li>';
      }).join(""));
      var tableHeads = view.tableHeads || ["Record", "Operating detail", "Action"];
      var tableRows = view.tableRows || view.items.map(function (item) {
        return [item[0], item[1], item[2]];
      });
      setText("workspaceHeadOne", tableHeads[0]);
      setText("workspaceHeadTwo", tableHeads[1]);
      setText("workspaceHeadThree", tableHeads[2]);
      setHtml("workspaceRows", tableRows.map(function (row) {
        return '<tr><td>' + row[0] + '</td><td>' + row[1] + '</td><td><button type="button" data-workspace-open="' + row[2] + '">Open</button></td></tr>';
      }).join(""));
      markDemoMotion(['[data-app-target="workspaceItems"]', '[data-app-target="workspaceRows"]']);
    }

    function renderAudit(decisionName) {
      var events = [
        ["06/05/2026 09:12", "S. Turner", "TMS import opened", "load"],
        ["06/05/2026 09:13", "Safety desk", "Driver matched to DRV-001", "driver"],
        ["06/05/2026 09:18", "S. Turner", "Carrier packet verified", "carrier"],
        ["06/05/2026 09:21", "S. Turner", "Rate confirmation verified", "rate"],
        ["06/05/2026 09:24", "S. Turner", "Import document packet reviewed", "bol"]
      ];
      if (decisionName === "approved") {
        events.push(["06/06/2026 10:42", "S. Turner", "Ready to Release decision recorded.", "release"]);
      }
      if (decisionName === "rejected") {
        events.push(["06/06/2026 10:42", "S. Turner", "Hold - Action Required decision recorded.", "bol"]);
      }
      if (decisionName === "early") {
        events.push(["06/06/2026 10:42", "S. Turner", "Release With Condition decision recorded.", "release"]);
      }
      setHtml("auditTrail", events.map(function (event) {
        return '<li><button type="button" data-record-open="' + event[3] + '"><span>' + escapeHtml(event[0]) + "</span><strong>" + escapeHtml(event[1]) + "</strong><em>" + escapeHtml(event[2]) + "</em></button></li>";
      }).join(""));
    }

    function renderRoleLens() {
      var lens = roleLenses[appState.activeRoleLens] || roleLenses.owner;
      setText("roleLensTitle", lens.title);
      setText("roleLensBody", lens.body);
      setText("roleLensProof", lens.proof);
      var openButton = interactiveDemo.querySelector("[data-role-lens-open]");
      if (openButton) {
        openButton.textContent = lens.label;
        openButton.setAttribute("data-record-open", lens.record);
      }
      interactiveDemo.querySelectorAll("[data-role-lens]").forEach(function (button) {
        var active = button.getAttribute("data-role-lens") === appState.activeRoleLens;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }

    function renderHandoffPreview() {
      var decision = decisions[appState.decision] || decisions.review;
      var handoff = decision.handoff || decisions.review.handoff;
      setText("handoffDispatch", handoff[0]);
      setText("handoffCustomer", handoff[1]);
      setText("handoffCarrier", handoff[2]);
      setText("handoffSettlement", handoff[3]);
    }

    var recordChecklists = {
      load: [
        ["Route status", "Review", "Dallas to Memphis lane is close to release, but BOF-RR-10482 still controls the decision."],
        ["Driver", "Ready", "DRV-001 file is eligible and does not block the load."],
        ["Carrier", "Ready", "CAR-118 packet, authority, insurance, agreement, and W-9 are present."],
        ["Documents", "Review", "Pickup instructions, BOL image, seal photo, delivery proof state, and claim evidence state stay attached."],
        ["Operating context", "Visible", "HOS, fuel, traffic, weather, and backhaul notes are shown as planning context."]
      ],
      bol: [
        ["Pre-trip packet", "Ready", "Pickup instructions, rate confirmation, carrier packet, driver file, and seal photo are attached."],
        ["BOL image", "Review", "BOL-10482-IMG-02 needs S. Turner confirmation before the packet clears."],
        ["Delivery proof", "Pending", "POD, dock photo, empty cargo photo, and receiver signature are not required until delivery."],
        ["Claim evidence", "Standby", "Claim photo packet opens only if the delivery record creates an exception."]
      ],
      pretrip: [
        ["Rate confirmation", "Ready", "RC-10482 matches load, lane, carrier, and dates."],
        ["Work schedule", "Filed", "WS-10482 contains pickup and delivery windows."],
        ["Pickup instructions", "Filed", "PU-10482 includes gate, Dock 4 contact, load number, and driver instructions."],
        ["Dispatch assignment", "Ready", "DRV-001, CAR-118, dry van trailer, and Dallas-to-Memphis lane are aligned."],
        ["Tire / equipment inspection", "Pass", "Tractor, trailer, tires, lights, doors, and ELD/mobile check are complete."],
        ["Cargo inspection", "Pass", "24 pallets staged, packaging intact, no shortage noted before loading."],
        ["Loaded cargo / dock photo", "Attached", "LOADPHOTO-10482 shows palletized cargo and dock-loading state before departure."],
        ["Seal record", "Filed", "SEAL-TX-10482-771 is captured for pickup departure."],
        ["Takeoff answer", "Ready", "No pre-trip blocker is shown; final movement waits on BOF release decision."]
      ],
      transit: [
        ["GPS lane", "On track", "I-30 eastbound near Texarkana, 238 mi remaining to Memphis."],
        ["Route deviation", "Watch", "Seven-mile construction detour is active and documented."],
        ["Alternate route", "Prepared", "US-70 connector option is ready if weather blocks the I-40 approach."],
        ["HOS availability", "Clear", "HOS window remains sufficient for delivery estimate."],
        ["OOS / compliance", "Clear", "No out-of-service condition shown in this scenario."],
        ["Safety event", "Watch", "Following-distance coach note is assigned without a release hold."],
        ["Fuel status", "Clear", "61 percent fuel remaining with West Memphis stop planned."],
        ["On-track answer", "Watch", "Load remains on track; dispatch monitors route, weather, HOS, fuel, and safety."]
      ],
      driver: [
        ["Driver license image", "Current", "License front/back image is filed with fictional review ref CDL-DRV001-2026A."],
        ["CDL", "Current", "Class A CDL and endorsement summary are visible for dispatch review."],
        ["Medical card", "Current", "Medical card is current for the 06/06/2026 assignment."],
        ["MCSA exam summary", "Current", "Examiner certificate status is attached."],
        ["MVR review", "Clear", "MVR has no open release blocker."],
        ["Clearinghouse query", "Clear", "No dispatch hold is shown in this review session."],
        ["Drug and alcohol policy", "Filed", "Policy acknowledgement is attached."],
        ["Safety acknowledgements", "Filed", "Driver safety rules and incident reporting acknowledgement are filed."],
        ["ELD/mobile acknowledgement", "Filed", "Driver app, HOS, and mobile reporting acknowledgement are filed."],
        ["Employment application", "Filed", "Application packet is present."],
        ["Resume/work history", "Filed", "Work history is reviewed for the fleet file."],
        ["Prior employer inquiry", "Filed", "Prior employer safety inquiry is tracked."],
        ["Road test certificate", "Filed", "Road test record is attached."],
        ["Annual review", "Filed", "Annual driver review status is visible."],
        ["Emergency contact", "Filed", "Emergency contact and driver communication details are filed."],
        ["Tax status", "Filed", "Tax/pay setup is tracked by protected ref BOF-TAX-DRV001-A."],
        ["Payment setup", "Ready", "Settlement preference and pay contact are tracked by BOF-PAY-DRV001-A."],
        ["Bank/settlement setup", "Ready", "Settlement method is verified by protected ref BOF-SETTLE-DRV001-A."],
        ["Dispatch eligibility", "Ready", "Driver file does not block TMS-LD-10482."],
        ["Current assignment", "Ready", "Driver is assigned to the Dallas to Memphis release review."]
      ],
      carrier: [
        ["Carrier packet", "Ready", "Authority, insurance, agreement, W-9, and operations contact are present."],
        ["Fleet-owner boundary", "Clear", "BOF shows carrier packet readiness without treating outside carrier drivers as the fleet owner's employee files."],
        ["Release effect", "Ready", "Carrier status does not block the selected load."]
      ],
      pod1907: [
        ["POD", "Watch", "Receiver, timestamp, GPS, and signature details need dispatcher confirmation."],
        ["Delivery timestamp", "Needed", "Timestamp must be confirmed before the watch item clears."],
        ["GPS/location", "Needed", "Delivery location ping should match the receiver site."],
        ["Receiver/signature", "Needed", "Receiver name and signature should be attached."],
        ["Dock photo", "Attached", "Delivery dock image is attached before the watch item clears."],
        ["Seal/cargo context", "Needed", "Seal or cargo condition evidence should stay with the delivery packet when relevant."],
        ["Empty cargo photo", "Attached", "Post-delivery cargo photo supports settlement and claims follow-up."],
        ["Settlement effect", "Watch", "Keep settlement release on watch until proof is confirmed."],
        ["Claim effect", "Watch", "Photo evidence stays available if a delivery exception opens."],
        ["Next action", "Owner", "M. Ruiz confirms or attaches the missing POD evidence."]
      ],
      posttrip: [
        ["POD", "Watch", "POD-1907 stays linked to the closeout packet."],
        ["Receiver/signature", "Needed", "N. Harper signoff is expected on POD-1907-SIG."],
        ["Signed BOL", "Review", "BOL-1907-SIGNED-IMG is linked to closeout review."],
        ["Delivery timestamp", "Confirm", "06/06/2026 08:18 CST is retained from receiver check-in."],
        ["GPS/location", "Confirm", "KC-CONS-DOCK-07 geofence match is retained in the delivery record."],
        ["Dock photo", "Attached", "POD-1907-DOCK-IMG is attached for delivery-location proof review."],
        ["Empty trailer photo", "Attached", "POD-1907-EMPTY-IMG is attached for post-unload proof review."],
        ["Lumper receipt", "Not required", "No lumper service was required for this receiver lane."],
        ["Settlement release", "Watch", "Settlement does not clear until the full proof packet is confirmed."],
        ["Claim/dispute", "Standby", "No claim is open; the folder stands by if receiver, seal, damage, or timing exceptions appear."]
      ],
      signedbol1907: [
        ["Receiver signoff", "Signed", "N. Harper signoff is visible on the BOL artifact."],
        ["Delivered condition", "Clear", "No shortage or damage noted at first review."],
        ["Settlement effect", "Watch", "Settlement waits until the signed BOL matches POD, GPS/location, and photos."],
        ["Next action", "Owner", "M. Ruiz matches the BOL against the closeout packet."]
      ],
      dockphoto1907: [
        ["Photo", "Attached", "Dock 7 delivery-location image is visible in the viewer."],
        ["Timestamp", "Filed", "06/06/2026 08:21 CST."],
        ["Location", "Matched", "KC-CONS-DOCK-07 context is retained."],
        ["Use", "Ready", "Supports settlement review and claim response if needed."]
      ],
      emptyphoto1907: [
        ["Photo", "Attached", "Empty trailer image is visible in the viewer."],
        ["Timestamp", "Filed", "06/06/2026 08:27 CST."],
        ["Condition", "Clear", "Trailer clear after unload."],
        ["Use", "Ready", "Supports settlement closeout and shortage-dispute response if needed."]
      ],
      backhaul: [
        ["KC to Tulsa", "18 mi pickup", "Dry van plastics load near receiver; home-lane fit back toward Tulsa."],
        ["Independence to Dallas", "24 mi pickup", "Dry van packaging load; return direction toward Dallas network."],
        ["Olathe to Springfield", "31 mi pickup", "Dry van appliance load; partial return-lane fit."],
        ["Timing", "11:30-15:30", "Pickup windows fit after the 08:18 delivery check-in."],
        ["Next action", "Dispatch desk", "Confirm POD proof and appointment before committing a backhaul."]
      ],
      settlement: [
        ["Load revenue", "$4,850.00", "Linehaul, fuel surcharge, detention allowance, and accessorial review are attached to TMS-LD-10482."],
        ["Driver pay", "$612.74 draft", "DRV-001 mileage pay stays prepared but waits for final release and post-trip proof."],
        ["Pay models", "4 shown", "Cents per mile, percentage of revenue, hourly, and salary-style examples are represented."],
        ["Deductions", "Protected", "HSA, garnishment, health care, and life insurance use fictional references only."],
        ["Settlement hold", "Watch", "Missing POD, receipt, receiver signature, or required proof keeps settlement from clearing."]
      ],
      settlementRevenue: [
        ["Linehaul", "$4,250.00", "Primary load revenue for TMS-LD-10482."],
        ["Fuel surcharge", "$410.00", "Attached to the load revenue packet."],
        ["Detention allowance", "$125.00", "Pending delivery proof and receiver timing."],
        ["Accessorial review", "$65.00", "Document-return allowance remains visible."],
        ["Gross revenue", "$4,850.00", "Prepared for owner review against driver pay and settlement state."]
      ],
      settlementDriverPay: [
        ["Cents per mile", "$452.88", "DRV-001: 612 miles x $0.74."],
        ["Stop/document/safety pay", "$160.00", "Prepared as load-specific pay additions."],
        ["Percentage example", "28%", "DRV-005 revenue-share-style pay method represented."],
        ["Hourly example", "$31.00/hr", "DRV-004 local/private-fleet-style pay method represented."],
        ["Salary-style example", "Weekly allocation", "DRV-006 salary-style planning row represented."]
      ],
      settlementDeductions: [
        ["HSA", "Protected", "HSA-DRV001-2026 shows the deduction exists without a private value."],
        ["Garnishment", "Protected", "Fictional case token shows the category without real legal data."],
        ["Health care", "Protected", "Plan reference is visible; premium value is withheld."],
        ["Life insurance", "Protected", "Coverage reference is visible; beneficiary detail is not exposed."],
        ["Privacy gate", "Clear", "No real bank, tax, medical, or court values appear."]
      ],
      settlementHold: [
        ["Missing receipt", "Watch", "Receipt remains a clearing requirement when applicable."],
        ["POD", "Watch", "Timestamp, GPS/location, receiver, and signature must clear."],
        ["Receiver signature", "Required", "Signature must align with signed BOL and closeout packet."],
        ["Photo proof", "Required", "Dock photo and empty trailer photo stay attached to settlement review."],
        ["Driver incentive", "Clear", "Settlement release waits for proof, encouraging complete document return."]
      ],
      release: [
        ["Decision", "Pending", "S. Turner chooses Ready, Release With Condition, or Hold - Action Required."],
        ["Handoff", "Prepared", "Decision, blocker, owner, next action, timestamp, and audit note stay visible."],
        ["Audit", "Active", "Decision actions add a visible record line and update the selected-load inspector."]
      ]
    };

    function renderRecord(recordKey) {
      var key = resolveRecordKey(recordKey);
      var record = records[key] || records.load;
      appState.activeRecord = key;
      setText("recordTitle", record.title);
      setText("recordId", record.id);
      setText("recordOwner", record.owner);
      setText("recordState", record.state);
      setText("recordConsequence", record.consequence);
      setText("recordHeading", record.heading);
      setText("recordBody", record.body);
      updateStatuses("recordStatus", record.status, record.statusClass);
      var proof = recordProofDetails[key] || {
        details: [["Record", record.id], ["Owner", record.owner], ["Status", record.status], ["State", record.state], ["Consequence", record.consequence], ["Next action", record.heading]],
        activity: [["06/06/2026 09:10", record.owner, record.title + " opened."]]
      };
      var details = (proof.details || []).slice();
      var activity = (proof.activity || []).slice();
      if (key === "load" || key === "bol" || key === "release") {
        var activeDecision = decisions[appState.decision] || decisions.review;
        details.push(["Current decision", activeDecision.status]);
        details.push(["Dispatch result", activeDecision.consequence]);
        details.push(["Decision next action", activeDecision.next]);
        if (appState.decision !== "review") {
          activity.push(["06/06/2026 09:15", "S. Turner", activeDecision.auditText]);
        }
      }
      setHtml("recordDetailRows", details.map(function (detail) {
        return "<div><dt>" + escapeHtml(detail[0]) + "</dt><dd>" + escapeHtml(detail[1]) + "</dd></div>";
      }).join(""));
      var checklist = (recordChecklists[key] || []).slice();
      if (!checklist.length) checklist = [["Record", record.status, record.consequence], ["Next action", record.owner, record.heading]];
      setHtml("recordChecklist", checklist.map(function (item, index) {
        if (key === "driver") {
          return '<button class="record-checklist-button" type="button" data-driver-paper="' + index + '"><span>' + escapeHtml(item[0]) + '</span><strong>' + escapeHtml(item[1]) + '</strong><em>' + escapeHtml(item[2]) + '</em></button>';
        }
        return "<div><span>" + escapeHtml(item[0]) + "</span><strong>" + escapeHtml(item[1]) + "</strong><em>" + escapeHtml(item[2]) + "</em></div>";
      }).join(""));
      setHtml("recordActivityRows", activity.map(function (event) {
        return "<li><span>" + escapeHtml(event[0]) + "</span><strong>" + escapeHtml(event[1]) + "</strong><em>" + escapeHtml(event[2]) + "</em></li>";
      }).join(""));
      markDemoMotion(['[data-app-target="recordStatus"]', '[data-app-target="recordChecklist"]', '[data-app-target="recordActivityRows"]']);
    }

    function documentArtifactHtml(doc) {
      if (!doc || !doc.artifact) return "";
      var artifact = doc.artifact;
      if (artifact.kind === "signedBol") {
        return [
          '<section class="signed-bol-artifact">',
          '  <header><span>BILL OF LADING</span><strong>' + escapeHtml(doc.meta) + '</strong><em>' + escapeHtml(artifact.stamp || "SIGNED") + '</em></header>',
          '  <div class="signed-bol-grid">',
          (artifact.rows || []).map(function (row) {
            return '<div><span>' + escapeHtml(row[0]) + '</span><strong>' + escapeHtml(row[1]) + '</strong></div>';
          }).join(""),
          '  </div>',
          '  <div class="signed-bol-signature"><span>Receiver signature</span><strong>' + escapeHtml(doc.signature[1]) + '</strong><em>' + escapeHtml(doc.signature[2]) + '</em></div>',
          '</section>'
        ].join("");
      }
      if (artifact.kind === "photo") {
        return [
          '<section class="proof-photo-artifact">',
          '  <figure><img src="' + escapeHtml(artifact.image) + '" alt="' + escapeHtml(artifact.alt || doc.title) + '"><figcaption>' + escapeHtml(artifact.caption || "Photo evidence attached to this record.") + '</figcaption></figure>',
          '  <dl class="artifact-verification-grid">',
          (artifact.details || []).map(function (detail) {
            return '<div><dt>' + escapeHtml(detail[0]) + '</dt><dd>' + escapeHtml(detail[1]) + '</dd></div>';
          }).join(""),
          '  </dl>',
          '</section>'
        ].join("");
      }
      return [
        '<section class="driver-license-artifact">',
        '  <figure><img src="' + escapeHtml(artifact.image) + '" alt="' + escapeHtml(artifact.alt || doc.title) + '"><figcaption>' + escapeHtml(artifact.caption || "Document artifact attached to this record.") + '</figcaption></figure>',
        '  <dl class="artifact-verification-grid">',
        (artifact.details || []).map(function (detail) {
          return '<div><dt>' + escapeHtml(detail[0]) + '</dt><dd>' + escapeHtml(detail[1]) + '</dd></div>';
        }).join(""),
        '  </dl>',
        '</section>'
      ].join("");
    }

    function renderDocument(docName) {
      var doc = docs[docName] || docs.bol;
      var docHistory = (docHistories[docName] || docHistories.bol || []).slice();

      if (docName === "driver") {
        doc = driverDocumentPaper(appState.activeDriverDocument || 0);
        docHistory = [
          ["06/05/2026 09:11", "Safety desk", "Driver file opened.", "driver"],
          ["06/05/2026 09:12", doc.owner.replace("Owner: ", ""), doc.title + " reviewed.", "driver"],
          ["06/06/2026 09:08", "Operations lead", "Driver document state tied to TMS-LD-10482 release review.", "load"]
        ];
      }

      if (appState.selectedLoad === "tms-ld-10482" && docName === "bol") {
        var decision = decisions[appState.decision] || decisions.review;
        doc = Object.assign({}, doc, {
          status: decision.status === "Ready to Release" ? "Ready" : decision.status,
          statusClass: decision.statusClass,
          fields: [doc.fields[0], doc.fields[1], decision.status, decision.consequence],
          ledgerRows: [doc.ledgerRows[0], doc.ledgerRows[1], doc.ledgerRows[2], doc.ledgerRows[3], doc.ledgerRows[4], ["BOF decision gate", decision.next, decision.packetBolStatus]],
          note: decision.note
        });
        if (appState.decision === "approved") {
          docHistory.push(["06/06/2026 10:42", "S. Turner", "Ready to Release decision recorded.", "release"]);
        } else if (appState.decision === "rejected") {
          docHistory.push(["06/06/2026 10:42", "S. Turner", "Hold - Action Required; corrected capture requested.", "bol"]);
        } else if (appState.decision === "early") {
          docHistory.push(["06/06/2026 10:42", "S. Turner", "Release With Condition decision attached.", "release"]);
        }
      }

      if (appState.selectedLoad === "tms-ld-10482" && docName === "release") {
        var releaseDecision = decisions[appState.decision] || decisions.review;
        doc = Object.assign({}, doc, {
          status: releaseDecision.status,
          statusClass: releaseDecision.statusClass,
          fields: [doc.fields[0], releaseDecision.status, "BOF-RR-10482", releaseDecision.next],
          ledgerRows: [doc.ledgerRows[0], doc.ledgerRows[1], doc.ledgerRows[2], doc.ledgerRows[3], ["Imported document gate", "BOF-RR-10482-DOCS", releaseDecision.packetBolStatus], ["Simulated handoff", releaseDecision.consequence, releaseDecision.status]],
          signature: ["Decision Owner / Date", "S. Turner", releaseDecision.packetDecisionDate === "-" ? "Pending" : releaseDecision.packetDecisionDate],
          note: releaseDecision.note
        });
        if (appState.decision !== "review") {
          docHistory.push(["06/06/2026 10:42", "S. Turner", releaseDecision.auditText, appState.decision === "rejected" ? "bol" : "release"]);
        }
      }

      setText("docTitle", doc.title);
      setButton("docButton", "Open full record", docName);
      updateStatuses("docStatus", doc.status, doc.statusClass);
      setText("docMetaLabel", doc.meta.indexOf("BOL") === 0 ? "BOL No." : "Record No.");
      setText("docMeta", doc.meta);
      setText("docOwner", doc.owner);
      setText("docHeading", doc.heading);
      setText("docFieldOneLabel", doc.labels[0]);
      setText("docFieldTwoLabel", doc.labels[1]);
      setText("docFieldThreeLabel", doc.labels[2]);
      setText("docFieldFourLabel", doc.labels[3]);
      setText("docFieldOne", doc.fields[0]);
      setText("docFieldTwo", doc.fields[1]);
      setText("docFieldThree", doc.fields[2]);
      setText("docFieldFour", doc.fields[3]);
      setText("docNote", doc.note);
      setHtml("docArtifactPanel", documentArtifactHtml(doc));
      setHtml("docProofGrid", (doc.proofTiles || []).map(function (tile) {
        return '<div><span>' + escapeHtml(tile[0]) + '</span><strong>' + escapeHtml(tile[1]) + '</strong><em>' + escapeHtml(tile[2]) + '</em></div>';
      }).join(""));
      setText("docPartyOneLabel", doc.parties[0][0]);
      setText("docPartyOneName", doc.parties[0][1]);
      setText("docPartyOneLineOne", doc.parties[0][2]);
      setText("docPartyOneLineTwo", doc.parties[0][3]);
      setText("docPartyTwoLabel", doc.parties[1][0]);
      setText("docPartyTwoName", doc.parties[1][1]);
      setText("docPartyTwoLineOne", doc.parties[1][2]);
      setText("docPartyTwoLineTwo", doc.parties[1][3]);
      setText("docLedgerHeadOne", doc.ledgerHeads[0]);
      setText("docLedgerHeadTwo", doc.ledgerHeads[1]);
      setText("docLedgerHeadThree", doc.ledgerHeads[2]);
      setHtml("docLedgerRows", doc.ledgerRows.map(function (row) {
        if (doc.driverVault) {
          var docIndex = Number(row[3] || 0);
          var activeClass = docIndex === appState.activeDriverDocument ? ' class="is-active"' : "";
          return '<tr' + activeClass + '><td><button class="doc-open-button" type="button" data-driver-paper="' + docIndex + '">' + escapeHtml(row[0]) + '</button></td><td>' + escapeHtml(row[1]) + '</td><td>' + escapeHtml(row[2]) + '</td></tr>';
        }
        return "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td><td>" + row[2] + "</td></tr>";
      }).join(""));
      setText("docSignatureLabel", doc.signature[0]);
      setText("docSignatureName", doc.signature[1]);
      setText("docSignatureDate", doc.signature[2]);
      setHtml("docHistoryRows", docHistory.map(function (event) {
        return '<li><button type="button" data-record-open="' + escapeHtml(event[3] || docName) + '"><span>' + escapeHtml(event[0]) + "</span><strong>" + escapeHtml(event[1]) + "</strong><em>" + escapeHtml(event[2]) + "</em></button></li>";
      }).join(""));
      markDemoMotion(['[data-app-target="docStatus"]', '[data-app-target="docArtifactPanel"]', '[data-app-target="docLedgerRows"]', '[data-app-target="docHistoryRows"]']);

      interactiveDemo.querySelectorAll("[data-doc-tab]").forEach(function (button) {
        var active = button.getAttribute("data-doc-tab") === appState.activeDoc;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
    }

    function renderLoad() {
      var load = loads[appState.selectedLoad] || loads["tms-ld-10482"];
      var decision = decisions[appState.decision] || decisions.review;
      var primary = load.primary;
      var statusText = primary ? decision.status : load.status;
      var statusClass = primary ? decision.statusClass : load.statusClass;

      interactiveDemo.setAttribute("data-selected-load", appState.selectedLoad);
      setText("drawerTitle", load.title);
      setText("drawerRoute", load.route);
      setText("drawerOrigin", load.origin);
      setText("drawerDestination", load.destination);
      setHtml("drawerPriority", '<span class="priority ' + escapeHtml(load.priorityClass || "medium") + '"><i></i>' + escapeHtml(load.priorityLabel || "Medium") + "</span>");
      setText("drawerPriorityReason", load.priorityReason || "Priority is tied to dispatch risk, load packet readiness, and owner follow-up.");
      setText("drawerOwner", load.owner);
      setButton("controlButton", load.controllingLabel, load.doc);
      setButton("drawerDriverButton", load.driverLabel || "DRV-001", load.driverRecord || "driver");
      setButton("drawerCarrierButton", load.carrierLabel || "CAR-118", load.carrierRecord || "carrier");
      setButton("packetDriverButton", load.driverLabel || "DRV-001", load.driverRecord || "driver");
      setButton("packetCarrierButton", load.carrierLabel || "CAR-118", load.carrierRecord || "carrier");
      setText("peopleDriverName", load.driverName || load.driverLabel || "John Carter");
      setText("peopleDriverRole", load.driverRole || "Driver");
      setText("peopleCarrierName", load.carrierName || load.carrierLabel || "RoadPro Desk");
      setText("peopleCarrierRole", load.carrierRole || "Carrier ops");
      interactiveDemo.querySelectorAll('[data-person-record="driver"]').forEach(function (button) {
        button.setAttribute("data-record-open", load.driverRecord || "driver");
      });
      interactiveDemo.querySelectorAll('[data-person-record="carrier"]').forEach(function (button) {
        button.setAttribute("data-record-open", load.carrierRecord || "carrier");
      });
      setText("drawerConsequence", primary ? decision.consequence : load.consequence);
      setText("drawerNext", primary ? decision.next : load.next);
      setText("drawerTarget", load.target);
      updateStatuses("drawerStatus", statusText, statusClass);
      interactiveDemo.querySelectorAll('[data-app-target="drawerStatus"]').forEach(function (target) {
        target.setAttribute("data-record-open", primary ? "decision" : load.doc);
      });

      interactiveDemo.querySelectorAll("[data-load-row-display]").forEach(function (row) {
        row.classList.toggle("is-selected", row.getAttribute("data-load-row-display") === appState.selectedLoad);
      });
      interactiveDemo.querySelectorAll("[data-load-row]").forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.getAttribute("data-load-row") === appState.selectedLoad));
      });
      interactiveDemo.querySelectorAll("[data-load-row-display]").forEach(function (row) {
        var input = row.querySelector('input[type="checkbox"]');
        if (input) input.checked = appState.selectedRows.indexOf(row.getAttribute("data-load-row-display")) >= 0;
      });
      renderTmsSourcePanel();

      interactiveDemo.querySelectorAll('[data-demo-action="approve"], [data-demo-action="reject"], [data-demo-action="early"]').forEach(function (button) {
        button.disabled = !primary;
      });

      if (!primary) {
        appState.activeDoc = load.doc;
        updateStatuses("topStatus", load.status, load.statusClass);
        updateStatuses("releaseStatus", load.status, load.statusClass);
        setText("packetLoadId", load.title);
        setText("packetRoute", load.route);
        setText("packetBolStatus", load.statusClass === "blocked" ? "Blocked" : load.statusClass === "ready" ? "Cleared" : "Watch");
        setText("packetDecision", load.status);
        setText("packetDecisionDate", "-");
        setText("counterReview", decisions.review.counterReview);
        setText("counterHold", decisions.review.counterHold);
        setText("counterReleased", decisions.review.counterReleased);
        setText("releaseSummary", "This row is available for comparison. Return to TMS-LD-10482 to make the release decision.");
        setText("decisionHeadline", load.title + " is not the active release scenario.");
        setText("decisionNote", load.next);
        setButton("decisionButton", "Open " + load.title + " record", load.doc);
        renderDocument(load.doc);
        renderRecord(load.doc);
        renderQueueControls();
        renderViewerZoom();
        renderRoleLens();
        renderHandoffPreview();
        renderSessionTrail();
        return;
      }

      setText("metricReady", decision.metricReady);
      setText("metricHolds", decision.metricHolds);
      setText("counterReview", decision.counterReview);
      setText("counterHold", decision.counterHold);
      setText("counterReleased", decision.counterReleased);
      setText("queueNextAction", decision.queueNextAction);
      setText("packetLoadId", load.title);
      setText("packetRoute", load.route);
      setText("packetBolStatus", decision.packetBolStatus);
      setText("packetDecision", decision.packetDecision);
      setText("packetDecisionDate", decision.packetDecisionDate);
      updateStatuses("topStatus", decision.status, decision.statusClass);
      updateStatuses("queueStatus", decision.status, decision.statusClass);
      updateStatuses("releaseStatus", decision.status, decision.statusClass);
      updateStatuses("recordStatus", decision.status, decision.statusClass);
      interactiveDemo.querySelectorAll("[data-app-target=\"packetBolStatus\"], [data-app-target=\"packetDecision\"]").forEach(function (target) {
        setStatusClass(target, decision.statusClass);
      });
      setText("releaseSummary", decision.summary);
      setText("decisionHeadline", decision.headline);
      setText("decisionNote", decision.note);
      setButton("decisionButton", decision.linkText, appState.decision === "approved" ? "release" : "bol");
      renderAudit(appState.decision);
      renderDocument(appState.activeDoc);
      renderRecord(appState.activeRecord);
      renderQueueControls();
      renderViewerZoom();
      renderRoleLens();
      renderHandoffPreview();
      renderSessionTrail();
    }

    function applyDecision(name) {
      appState.selectedLoad = "tms-ld-10482";
      appState.decision = decisions[name] ? name : "review";
      appState.activeDoc = name === "approved" || name === "rejected" || name === "early" ? "release" : "bol";
      appState.activeRecord = name === "approved" || name === "early" ? "release" : name === "review" ? "load" : "bol";
      if (appState.decision === "review") {
        appState.queueFilter = "all";
        appState.searchQuery = "";
        interactiveDemo.querySelectorAll("[data-queue-search]").forEach(function (input) {
          input.value = "";
        });
      }
      interactiveDemo.setAttribute("data-demo-state", appState.decision);
      interactiveDemo.setAttribute("data-active-doc", appState.activeDoc);
      renderLoad();
      var decisionFeedback = {
        approved: ["Ready to Release recorded; simulated handoff is open.", "release"],
        rejected: ["Hold recorded; corrected BOL capture requested.", "bol"],
        early: ["Release With Condition recorded; owner follow-up is attached.", "release"],
        review: ["TMS-LD-10482 reset to BOF readiness review.", "load"]
      };
      var feedback = decisionFeedback[appState.decision] || decisionFeedback.review;
      addSessionTrail("Decision", decisions[appState.decision].status, decisions[appState.decision].next, feedback[1]);
      setUtility(feedback[0], feedback[1]);
    }

    interactiveDemo.querySelectorAll("[data-demo-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.getAttribute("data-demo-action");
        if (action === "enter" || action === "enter-record") {
          window.location.href = action === "enter" ? "/interactive-demo/loading/" : "/interactive-demo/";
          return;
        }
        if (action === "reset") {
          appState.selectedLoad = "tms-ld-10482";
          appState.activeDoc = "bol";
          appState.activeRecord = "load";
          applyDecision("review");
          return;
        }
        if (action === "reset-session") {
          window.location.href = "/interactive-demo/loading/";
          return;
        }
        if (action === "approve") applyDecision("approved");
        if (action === "reject") applyDecision("rejected");
        if (action === "early") applyDecision("early");
      });
    });

    interactiveDemo.querySelectorAll("[data-doc-tab]").forEach(function (button) {
      button.addEventListener("click", function () {
        var clickedDoc = button.getAttribute("data-doc-tab") || "bol";
        if (["pod1907", "posttrip", "signedbol1907", "dockphoto1907", "emptyphoto1907"].indexOf(clickedDoc) >= 0) {
          var packetLabels = {
            pod1907: "POD-1907",
            posttrip: "POSTTRIP-1907",
            signedbol1907: "BOL-1907-SIGNED",
            dockphoto1907: "POD-1907-DOCK",
            emptyphoto1907: "POD-1907-EMPTY"
          };
          var packetMessages = {
            pod1907: "Delivery timestamp, GPS, receiver, dock photo, empty trailer photo, settlement, and claim watch are visible.",
            posttrip: "POD, receiver, timestamp, GPS, lumper state, settlement, and claim watch are visible.",
            signedbol1907: "Signed BOL, receiver signoff, delivery condition, OS&D note, and settlement effect are visible.",
            dockphoto1907: "Dock photo, timestamp, location, settlement effect, and claim effect are visible.",
            emptyphoto1907: "Empty trailer photo, post-unload condition, settlement effect, and claim effect are visible."
          };
          appState.selectedLoad = "bof-1907";
          if (appState.selectedRows.indexOf(appState.selectedLoad) < 0) appState.selectedRows = [appState.selectedLoad];
          appState.activeDoc = clickedDoc;
          appState.activeRecord = clickedDoc;
          interactiveDemo.setAttribute("data-active-doc", appState.activeDoc);
          renderLoad();
          appState.activeDoc = clickedDoc;
          appState.activeRecord = clickedDoc;
          interactiveDemo.setAttribute("data-active-doc", appState.activeDoc);
          renderDocument(clickedDoc);
          renderRecord(clickedDoc);
          addSessionTrail("Document", packetLabels[clickedDoc] + " opened", packetMessages[clickedDoc], clickedDoc);
          setUtility("Opened " + packetLabels[clickedDoc] + " proof record.", clickedDoc);
          return;
        }
        appState.selectedLoad = "tms-ld-10482";
        appState.activeDoc = clickedDoc;
        if (appState.activeDoc === "driver") appState.activeDriverDocument = 0;
        appState.activeRecord = appState.activeDoc;
        interactiveDemo.setAttribute("data-active-doc", appState.activeDoc);
        renderLoad();
      });
    });

    interactiveDemo.addEventListener("click", function (event) {
      var driverPaperButton = event.target.closest("[data-driver-paper]");
      if (!driverPaperButton || !interactiveDemo.contains(driverPaperButton)) return;
      appState.selectedLoad = "tms-ld-10482";
      appState.activeDoc = "driver";
      appState.activeRecord = "driver";
      appState.activeDriverDocument = Number(driverPaperButton.getAttribute("data-driver-paper") || "0");
      interactiveDemo.setAttribute("data-active-doc", appState.activeDoc);
      renderLoad();
      var openedDocument = driverDocumentVault[appState.activeDriverDocument] || driverDocumentVault[0];
      addSessionTrail("Document", openedDocument.title + " opened", openedDocument.detail, "driver");
      setUtility(openedDocument.title + " opened in the driver file.", "driver");
    });

    interactiveDemo.querySelectorAll("[data-load-row]").forEach(function (button) {
      button.addEventListener("click", function () {
        appState.selectedLoad = button.getAttribute("data-load-row") || "tms-ld-10482";
        if (appState.selectedRows.indexOf(appState.selectedLoad) < 0) appState.selectedRows = [appState.selectedLoad];
        if (appState.selectedLoad === "tms-ld-10482" && appState.activeDoc.indexOf("comparison") === 0) {
          appState.activeDoc = "bol";
        }
        appState.activeRecord = appState.selectedLoad === "tms-ld-10482" ? "load" : loads[appState.selectedLoad].doc;
        renderLoad();
        addSessionTrail("Queue", (loads[appState.selectedLoad] || loads["tms-ld-10482"]).title + " selected", (loads[appState.selectedLoad] || loads["tms-ld-10482"]).next, appState.activeRecord);
        setUtility("Selected " + (loads[appState.selectedLoad] || loads["tms-ld-10482"]).title + " in the queue.", appState.activeRecord);
      });
    });

    interactiveDemo.addEventListener("click", function (event) {
      var recordButton = event.target.closest("[data-record-open]");
      if (!recordButton || !interactiveDemo.contains(recordButton)) return;
      var recordKey = recordButton.getAttribute("data-record-open");
      var driverPage = driverPageForRecordKey(recordKey);
      if (driverPage) {
        window.location.href = driverPage;
        return;
      }
      var rowContext = recordButton.closest("[data-load-row-display]");
      var linkedLoadId = rowContext ? rowContext.getAttribute("data-load-row-display") : loadIdForRecordKey(recordKey);
      if (linkedLoadId && linkedLoadId !== appState.selectedLoad) selectLoadContext(linkedLoadId);
      var resolvedKey = resolveRecordKey(recordKey);
      if (docs[resolvedKey]) {
        appState.activeDoc = resolvedKey;
        interactiveDemo.setAttribute("data-active-doc", appState.activeDoc);
        renderDocument(resolvedKey);
      }
      renderRecord(recordKey);
      closePopovers();
      if (!recordButton.closest('[data-app-target="sessionTrailRows"]')) {
        addSessionTrail("Open", records[resolvedKey] ? records[resolvedKey].title : "Record opened", records[resolvedKey] ? records[resolvedKey].consequence : "Opened related review record.", resolvedKey);
      }
      setUtility("Opened " + (records[resolvedKey] ? records[resolvedKey].title : "record") + " in the record viewer.");
    });

    interactiveDemo.addEventListener("click", function (event) {
      var workspaceButton = event.target.closest("[data-workspace-open]");
      if (!workspaceButton || !interactiveDemo.contains(workspaceButton)) return;
      var recordKey = workspaceButton.getAttribute("data-workspace-open");
      var linkedLoadId = loadIdForRecordKey(recordKey);
      if (linkedLoadId && linkedLoadId !== appState.selectedLoad) selectLoadContext(linkedLoadId);
      renderRecord(recordKey);
      addSessionTrail("Workspace", records[recordKey] ? records[recordKey].title : "Workspace record", "Opened from " + workspaceViews[appState.activeView].eyebrow + ".", recordKey);
      setUtility("Opened " + (records[recordKey] ? records[recordKey].title : "workspace record") + " from the " + workspaceViews[appState.activeView].eyebrow + " view.");
    });

    function openAppView(button) {
        interactiveDemo.querySelectorAll("[data-app-view]").forEach(function (item) {
          item.classList.toggle("is-active", item === button);
        });
        var view = button.getAttribute("data-app-view");
        var recordMap = {
          command: "command",
          loads: "load",
          documents: "documentsView",
          drivers: "driver",
          carriers: "carrier",
          dispatch: "dispatchView",
          safety: "safetyView",
          settlement: "settlement",
          reports: "yield",
          alerts: "alerts",
          settings: "user"
        };
        closePopovers();
        renderWorkspace(view);
        renderRecord(recordMap[view] || "session");
        var viewLabel = button.getAttribute("data-view-label");
        if (!viewLabel) {
          var labelNode = button.querySelector("span");
          viewLabel = labelNode ? labelNode.textContent.trim() : button.textContent.trim();
        }
        viewLabel = viewLabel.replace(/\s+view$/i, "");
        setUtility(viewLabel + " view opened in the record panel.", recordMap[view] || "session");
    }

    interactiveDemo.querySelectorAll("[data-app-view]").forEach(function (button) {
      button.__bofViewBound = true;
      button.addEventListener("click", function () {
        openAppView(button);
      });
    });

    interactiveDemo.querySelectorAll("[data-role-lens]").forEach(function (button) {
      button.addEventListener("click", function () {
        var lensName = button.getAttribute("data-role-lens") || "owner";
        appState.activeRoleLens = roleLenses[lensName] ? lensName : "owner";
        renderRoleLens();
        var lens = roleLenses[appState.activeRoleLens] || roleLenses.owner;
        var lensWorkspaceMap = {
          owner: "command",
          dispatch: "dispatch",
          safety: "safety",
          carrier: "carriers",
          settlement: "settlement"
        };
        if (lensWorkspaceMap[appState.activeRoleLens]) renderWorkspace(lensWorkspaceMap[appState.activeRoleLens]);
        renderRecord(lens.record);
        addSessionTrail("Role", lens.title, lens.proof, lens.record);
        setUtility(lens.title + " opened. " + lens.proof + ".", lens.record);
      });
    });

    interactiveDemo.addEventListener("click", function (event) {
      var viewButton = event.target.closest("[data-app-view]");
      if (!viewButton || !interactiveDemo.contains(viewButton) || viewButton.__bofViewBound) return;
      openAppView(viewButton);
    });

    interactiveDemo.querySelectorAll("[data-queue-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        appState.queueFilter = button.getAttribute("data-queue-filter") || "all";
        closePopovers();
        renderQueueControls();
        var filterRecord = appState.queueFilter === "blocked" ? "comparison1931" : appState.queueFilter === "watch" ? "comparison1907" : appState.queueFilter === "ready" ? "comparison2064" : appState.queueFilter === "overdue" ? "comparison1931" : "load";
        renderRecord(filterRecord);
        addSessionTrail("Filter", queueFilterLabel(appState.queueFilter), "Queue triage changed the visible operating records.", filterRecord);
        setUtility("Queue filter applied: " + queueFilterLabel(appState.queueFilter) + ".");
      });
    });

    interactiveDemo.querySelectorAll("[data-queue-search]").forEach(function (input) {
      function updateSearch() {
        appState.searchQuery = input.value.trim().toLowerCase();
        if (appState.searchQuery) appState.queueFilter = "all";
        renderQueueControls();
        setUtility(appState.searchQuery ? "Search filtered the queue to matching loads, drivers, and carriers." : "Search cleared. All matching queue rows are visible.");
      }
      input.addEventListener("input", updateSearch);
      input.addEventListener("search", updateSearch);
      input.addEventListener("change", updateSearch);
    });

    interactiveDemo.querySelectorAll("[data-queue-clear]").forEach(function (button) {
      button.addEventListener("click", function () {
        var input = interactiveDemo.querySelector("[data-queue-search]");
        if (!input) return;
        input.value = "";
        appState.searchQuery = "";
        appState.queueFilter = "all";
        renderQueueControls();
        setUtility("Search cleared. All matching queue rows are visible.");
        input.focus();
      });
    });

    interactiveDemo.querySelectorAll("[data-tms-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        appState.tmsFilter = button.getAttribute("data-tms-filter") || "active";
        renderTmsSourcePanel();
        renderRecord(tmsSourceForLoad(appState.selectedLoad).record || "load");
        addSessionTrail("Partner TMS", tmsFilterLabel(appState.tmsFilter), "Source-system load board filter changed.", tmsSourceForLoad(appState.selectedLoad).record || "load");
        setUtility("Partner TMS source filter applied: " + tmsFilterLabel(appState.tmsFilter) + ".", tmsSourceForLoad(appState.selectedLoad).record || "load");
      });
    });

    interactiveDemo.querySelectorAll("[data-tms-search]").forEach(function (input) {
      function updateTmsSearch() {
        appState.tmsSearchQuery = input.value.trim().toLowerCase();
        if (appState.tmsSearchQuery) appState.tmsFilter = "all";
        renderTmsSourcePanel();
        setUtility(appState.tmsSearchQuery ? "Partner TMS source search filtered load, customer, carrier, location, and driver fields." : "Partner TMS source search cleared.");
      }
      input.addEventListener("input", updateTmsSearch);
      input.addEventListener("search", updateTmsSearch);
      input.addEventListener("change", updateTmsSearch);
    });

    interactiveDemo.querySelectorAll("[data-tms-clear]").forEach(function (button) {
      button.addEventListener("click", function () {
        var input = interactiveDemo.querySelector("[data-tms-search]");
        if (input) input.value = "";
        appState.tmsSearchQuery = "";
        appState.tmsFilter = "active";
        renderTmsSourcePanel();
        setUtility("Partner TMS source search cleared. Active loads are visible.");
        if (input) input.focus();
      });
    });

    interactiveDemo.addEventListener("pointerdown", function (event) {
      var tmsLoadButton = event.target.closest("[data-tms-load]");
      if (tmsLoadButton && interactiveDemo.contains(tmsLoadButton)) {
        event.preventDefault();
        openTmsSourceLoad(tmsLoadButton.getAttribute("data-tms-load"));
      }
    });

    interactiveDemo.addEventListener("click", function (event) {
      var tmsLoadButton = event.target.closest("[data-tms-load]");
      if (tmsLoadButton && interactiveDemo.contains(tmsLoadButton)) {
        openTmsSourceLoad(tmsLoadButton.getAttribute("data-tms-load"));
        return;
      }

      var tmsRecordButton = event.target.closest("[data-tms-record]");
      if (tmsRecordButton && interactiveDemo.contains(tmsRecordButton)) {
        var sourceRecord = tmsRecordButton.getAttribute("data-tms-record");
        var selectedSource = tmsSourceForLoad(appState.selectedLoad);
        if (sourceRecord === "sourceDocs") sourceRecord = selectedSource.record === "load" ? "bol" : selectedSource.record;
        if (sourceRecord === "sourceLog") sourceRecord = "audit";
        if (docs[sourceRecord] || sourceRecord === "driver") {
          appState.activeDoc = sourceRecord;
          interactiveDemo.setAttribute("data-active-doc", appState.activeDoc);
          renderDocument(sourceRecord);
        }
        renderRecord(sourceRecord || "load");
        addSessionTrail("Partner TMS", "Source proof opened", "Partner TMS source item opened the related BOF proof record.", sourceRecord || "load");
        setUtility("Partner TMS source item opened the related BOF proof record.", sourceRecord || "load");
      }
    });

    interactiveDemo.querySelectorAll("[data-panel-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        var panelName = button.getAttribute("data-panel-toggle");
        if (panelName === "selected-pane") {
          var nextOpen = !appState.inspectorOpen;
          setInspectorOpen(nextOpen);
          renderRecord("load");
          setUtility(nextOpen ? "Selected load inspector reopened for " + (loads[appState.selectedLoad] || loads["tms-ld-10482"]).title + "." : "Selected load inspector hidden. The lower record panel keeps the load details available.");
          return;
        }
        var panel = interactiveDemo.querySelector('[data-app-popover="' + panelName + '"]');
        if (!panel) return;
        var willOpen = panel.hidden;
        closePopovers(panelName);
        panel.hidden = !willOpen;
        setUtility(willOpen ? "Opened " + panelName.replace("-", " ") + " controls." : "Closed " + panelName.replace("-", " ") + " controls.");
      });
    });

    interactiveDemo.querySelectorAll("[data-toolbar-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.getAttribute("data-toolbar-action");
        closePopovers();
        if (action === "refresh") {
          renderAudit(appState.decision);
          renderRecord("audit");
          setUtility("Queue refreshed at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ".");
        } else if (action.indexOf("page-size-") === 0) {
          var pageSize = action.replace("page-size-", "");
          setText("pageSizeLabel", pageSize + " / page");
          renderRecord("session");
          setUtility("Page size set to " + pageSize + " records per page. This session still shows the full six-load queue.");
        } else {
          renderRecord("session");
          setUtility("This compact release review has one page of queue results.");
        }
      });
    });

    interactiveDemo.querySelectorAll("[data-select-all]").forEach(function (input) {
      input.addEventListener("change", function () {
        interactiveDemo.querySelectorAll("[data-select-row]").forEach(function (rowInput) {
          var row = rowInput.closest("[data-load-row-display]");
          rowInput.checked = !row || !row.hidden ? input.checked : false;
        });
        syncSelectedRows();
        setUtility(input.checked ? "All visible loads selected for review." : "Queue selection cleared.");
      });
    });

    interactiveDemo.querySelectorAll("[data-select-row]").forEach(function (input) {
      input.addEventListener("change", function () {
        syncSelectedRows();
        setUtility(appState.selectedRows.length + " load record" + (appState.selectedRows.length === 1 ? "" : "s") + " selected.");
      });
    });

    interactiveDemo.querySelectorAll("[data-viewer-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.getAttribute("data-viewer-action");
        if (action === "zoom-in") appState.viewerZoom = Math.min(125, appState.viewerZoom + 10);
        if (action === "zoom-out") appState.viewerZoom = Math.max(80, appState.viewerZoom - 10);
        if (action === "reset-zoom") appState.viewerZoom = 100;
        renderViewerZoom();
        if (action === "expand") {
          renderRecord("activeDoc");
          setUtility("Document expanded into the record panel.");
        } else if (action === "download") {
          renderRecord("activeDoc");
          setUtility("Document export prepared inside the session.");
        } else if (action === "print") {
          renderRecord("activeDoc");
          setUtility("Print packet preview prepared inside the session.");
        } else if (action === "page") {
          setUtility("This record has one complete page in the selected packet.");
        } else {
          setUtility("Document zoom set to " + appState.viewerZoom + "%.");
        }
      });
    });

    renderLoad();
    renderWorkspace("command");
    renderQueueControls();
    renderViewerZoom();
    setInspectorOpen(true);
  }
})();
