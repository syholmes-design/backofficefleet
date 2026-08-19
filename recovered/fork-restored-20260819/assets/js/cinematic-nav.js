(() => {
  "use strict";

  const headers = Array.from(document.querySelectorAll(".cinematic-direct-header"));
  const main = document.querySelector("main");
  if (main && !document.querySelector(".cinematic-skip-link")) {
    if (!main.id) main.id = "main-content";
    if (!main.hasAttribute("tabindex")) main.tabIndex = -1;
    const skipLink = document.createElement("a");
    skipLink.className = "cinematic-skip-link";
    skipLink.href = `#${main.id}`;
    skipLink.textContent = "Skip to main content";
    skipLink.addEventListener("click", () => window.setTimeout(() => main.focus(), 0));
    document.body.prepend(skipLink);
  }

  if (!headers.length) return;

  document.documentElement.classList.add("cinematic-nav-ready");

  const forkBase = /^\/fork(?:\/|$)/.test(window.location.pathname) ? "/fork" : "";
  const routeHref = (pathname) => `${forkBase}${pathname}`;

  const close = (header) => {
    header.classList.remove("is-menu-open");
    const button = header.querySelector(".cinematic-nav-toggle");
    if (button) button.setAttribute("aria-expanded", "false");
    if (!headers.some((candidate) => candidate.classList.contains("is-menu-open"))) {
      document.documentElement.classList.remove("cinematic-menu-open");
    }
  };

  const normalizePath = (pathname) => {
    const compact = pathname.replace(/\/index\.html$/i, "/").replace(/\/{2,}/g, "/");
    return compact === "/" ? "/" : `${compact.replace(/\/$/, "")}/`;
  };

  const openingConversionAction = document.querySelector(
    "main > :is(.cinematic-hero,.cinematic-masthead,.offer-hero,.partner-hero,.portal-masthead,.investor-hero,.gap-photo-hero,.gap-masthead) :is(a,button)"
  );
  if (openingConversionAction && /\b(book|request|working session)\b/i.test(openingConversionAction.textContent || "")) {
    document.body.classList.add("has-opening-conversion-action");
  }

  headers.forEach((header) => {
    const button = header.querySelector(".cinematic-nav-toggle");
    const nav = header.querySelector(".cinematic-direct-nav");
    if (!button || !nav) return;

    nav.innerHTML = [
      '<a href="/solutions/">Solutions</a>',
      '<a href="/sectors/">Who We Serve</a>',
      '<a href="/business-operations/">Business Operations</a>',
      '<a href="/workflows/">Workflows</a>',
      '<a href="/resources/">Resources</a>',
      '<a class="cinematic-demo-link" href="/interactive-demo/">View Demo</a>'
    ].join("");
    nav.querySelectorAll('a[href^="/"]').forEach((link) => {
      link.setAttribute("href", routeHref(link.getAttribute("href")));
    });

    const headerCta = header.querySelector(".header-cta");
    if (headerCta) {
      headerCta.href = routeHref("/book-demo/");
      headerCta.textContent = "Book a working session";
    }

    const currentPath = normalizePath(window.location.pathname);
    const navLinks = Array.from(nav.querySelectorAll("a[href]"));
    let bestMatch = null;
    let bestLength = -1;

    navLinks.forEach((link) => {
      const linkPath = normalizePath(new URL(link.href, window.location.href).pathname);
      const matches = currentPath === linkPath || (linkPath !== "/" && currentPath.startsWith(linkPath));
      if (matches && linkPath.length > bestLength) {
        bestMatch = link;
        bestLength = linkPath.length;
      }
    });

    if (bestMatch) bestMatch.setAttribute("aria-current", "page");

    if (headerCta && !nav.querySelector(".cinematic-mobile-cta")) {
      const mobileCta = document.createElement("a");
      mobileCta.className = "cinematic-mobile-cta";
      mobileCta.href = headerCta.href;
      mobileCta.textContent = headerCta.textContent;
      nav.appendChild(mobileCta);
    }

    button.addEventListener("click", () => {
      const opening = !header.classList.contains("is-menu-open");
      headers.forEach(close);
      if (opening) {
        header.classList.add("is-menu-open");
        document.documentElement.classList.add("cinematic-menu-open");
        button.setAttribute("aria-expanded", "true");
      }
    });

    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => close(header)));
  });

  document.addEventListener("keydown", (event) => {
    const openHeader = headers.find((header) => header.classList.contains("is-menu-open"));
    if (event.key === "Tab" && openHeader && window.matchMedia("(max-width: 900px)").matches) {
      const focusable = [
        openHeader.querySelector(".cinematic-nav-toggle"),
        ...openHeader.querySelectorAll(".cinematic-direct-nav a[href]")
      ].filter(Boolean);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!focusable.includes(document.activeElement)) {
        event.preventDefault();
        first?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
      return;
    }
    if (event.key !== "Escape") return;
    headers.forEach((header) => {
      const wasOpen = header.classList.contains("is-menu-open");
      close(header);
      if (wasOpen) header.querySelector(".cinematic-nav-toggle")?.focus();
    });
  });

  document.addEventListener("click", (event) => {
    headers.forEach((header) => {
      if (!header.contains(event.target)) close(header);
    });
  });
})();

(() => {
  "use strict";

  const forkBase = /^\/fork(?:\/|$)/.test(window.location.pathname) ? "/fork" : "";
  const routeHref = (pathname) => `${forkBase}${pathname}`;

  document.querySelectorAll(".is-clickable-card[role='link']").forEach((card) => {
    card.removeAttribute("role");
    card.removeAttribute("tabindex");
    card.removeAttribute("aria-label");
    card.classList.add("cinematic-click-surface");
  });

  document.querySelectorAll(".gap-related-card").forEach((card) => {
    const link = card.querySelector("a[href]");
    const heading = card.querySelector("h2, h3, h4");
    if (link && heading && /^open route\b/i.test(link.textContent.trim())) {
      link.setAttribute("aria-label", `Open ${heading.textContent.trim()}`);
    }
  });

  const visibleMainHeadings = Array.from(document.querySelectorAll("main h1, main h2, main h3, main h4, main h5, main h6"));
  const firstHeadingAfterH1 = visibleMainHeadings.slice(1)[0];
  if (visibleMainHeadings[0]?.tagName === "H1" && firstHeadingAfterH1?.tagName === "H3") {
    const sectionHeading = document.createElement("h2");
    sectionHeading.className = "cinematic-visually-hidden";
    sectionHeading.textContent = "Operating record proof";
    const proofGroup = firstHeadingAfterH1.closest(".gap-record-strip, .cinematic-detail-proof, section, article") || firstHeadingAfterH1;
    proofGroup.insertAdjacentElement("beforebegin", sectionHeading);
  }

  const enhanceTableSemantics = () => {
    document.querySelectorAll("main table").forEach((table, index) => {
      table.querySelectorAll("thead th").forEach((cell) => {
        if (!cell.hasAttribute("scope")) cell.setAttribute("scope", "col");
      });
      table.querySelectorAll("tbody th").forEach((cell) => {
        if (!cell.hasAttribute("scope")) cell.setAttribute("scope", "row");
      });
      const container = table.closest("section, article, .panel, .card, main");
      const heading = container?.querySelector("h2, h3, h4");
      const label = heading?.textContent?.trim() || `Operating data table ${index + 1}`;
      if (!table.querySelector("caption") && !table.hasAttribute("aria-label") && !table.hasAttribute("aria-labelledby")) {
        table.setAttribute("aria-label", label);
      }
      const scrollRegion = table.closest(".table-wrap, .route-table-wrap, .small-table, .budget-table-wrap");
      if (scrollRegion && !scrollRegion.hasAttribute("aria-label")) {
        scrollRegion.setAttribute("aria-label", `${label} table`);
      }
    });
  };

  document.querySelectorAll(".site-footer").forEach((footer) => {
    footer.classList.add("site-footer--expanded");
    footer.innerHTML = `
      <div class="footer-shell">
        <div class="footer-brand"><strong>BackOfficeFleet</strong><p>Managed back-office support for fleets that need clearer operating records.</p></div>
        <nav aria-label="Platform links"><strong>Platform</strong><a href="/solutions/">Solutions</a><a href="/operations-record/">Operations Record</a><a href="/drivers/">Drivers</a><a href="/documents/">Documents</a><a href="/safety/">Safety</a><a href="/settlements/">Settlements</a><a href="/business-operations/">Business Operations</a><a href="/workflows/">Workflows</a></nav>
        <nav aria-label="Fleet links"><strong>Fleets</strong><a href="/for-hire-fleets/">For-Hire Fleets</a><a href="/private-fleets/">Private Fleets</a><a href="/government/">Government Fleets</a><a href="/fleet-preparedness/">Fleet Preparedness</a><a href="/carrier-readiness/">Carrier Readiness</a></nav>
        <nav aria-label="Company and trust links"><strong>Company &amp; Trust</strong><a href="/company/">Company</a><a href="/resources/">Resources</a><a href="/trust-governance/">Trust &amp; Governance</a><a href="/policies-procedures/">Policies &amp; Procedures</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/accessibility/">Accessibility</a><a href="/contact/">Contact</a></nav>
        <nav aria-label="Action links"><strong>Actions</strong><a href="/interactive-demo/">View Demo</a><a href="/book-demo/">Book a Working Session</a><a href="/founding-fleet/">Founding Fleet</a></nav>
      </div>`;
    footer.querySelectorAll('a[href^="/"]').forEach((link) => {
      link.setAttribute("href", routeHref(link.getAttribute("href")));
    });
  });

  const selectors = [
    ".table-wrap",
    ".route-table-wrap",
    ".small-table",
    ".paper-stack",
    ".ci-flow",
    ".capital-chain",
    ".budget-table-wrap",
    ".oi-flow",
    ".oi-lifecycle",
    ".oi-exception-flow",
    ".record-path-grid"
  ];

  const longMobileRoutes = new Set([
    "/",
    "/aggregator-command-center/",
    "/aggregator-partner-offer/",
    "/capacity-intelligence/",
    "/document-readiness-engine/",
    "/documents/",
    "/drivers/",
    "/fleet/",
    "/fleet-operator-offer/",
    "/policies-procedures/",
    "/private-fleet-offer/",
    "/private-investor-plan/",
    "/safety/",
    "/sectors/",
    "/settlements/",
    "/trust-governance/"
  ]);

  const mobileDisclosureRoutes = new Set([
    "/aggregator-partner-offer/",
    "/capacity-intelligence/",
    "/document-readiness-engine/",
    "/fleet/",
    "/fleet-operator-offer/",
    "/private-investor-plan/"
  ]);

  const enhanceLongMobilePages = () => {
    const route = document.body?.dataset.cinematicRoute || "";
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    const eligible = mobile && longMobileRoutes.has(route);
    document.querySelectorAll("main [class*='grid'], main .governance-library").forEach((region, index) => {
      const className = typeof region.className === "string" ? region.className : "";
      const excluded = /(field-grid|hero-inner|hero-grid|logo-grid|driver-face|signature-grid|portal-dashboard-grid)/.test(className);
      const nestedRail = region.parentElement?.closest("[data-mobile-evidence-rail='true']");
      const tallPair = region.children.length >= 2 && region.getBoundingClientRect().height > 650;
      const useRail = eligible && !excluded && !nestedRail && (region.children.length >= 3 || tallPair);
      if (!useRail) {
        delete region.dataset.mobileEvidenceRail;
        return;
      }
      region.dataset.mobileEvidenceRail = "true";
      region.dataset.scrollRegion = "true";
      region.tabIndex = 0;
      region.setAttribute("role", "region");
      if (!region.hasAttribute("aria-label")) {
        region.setAttribute("aria-label", `Scrollable evidence group ${index + 1}`);
      }
    });
  };

  const enhanceMobileDisclosures = () => {
    const route = document.body?.dataset.cinematicRoute || "";
    if (!window.matchMedia("(max-width: 760px)").matches || !mobileDisclosureRoutes.has(route)) return;
    const sections = Array.from(document.querySelectorAll("main > section:not(.cinematic-hero), main > div > section"));
    sections.slice(4, -1).forEach((section, index) => {
      if (section.dataset.mobileDisclosure === "true") return;
      const heading = section.querySelector("h2, h3");
      const label = heading?.textContent?.trim() || `Additional operating evidence ${index + 1}`;
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      details.className = "mobile-section-details";
      summary.textContent = `Review: ${label}`;
      details.appendChild(summary);
      Array.from(section.childNodes).forEach((node) => details.appendChild(node));
      section.appendChild(details);
      section.classList.add("mobile-disclosure-section");
      section.dataset.mobileDisclosure = "true";
    });
  };

  const enhanceScrollRegions = () => {
    document.querySelectorAll(`${selectors.join(",")}, [data-scroll-region="true"]`).forEach((region, index) => {
      if (region.scrollWidth <= region.clientWidth + 2) return;
      region.tabIndex = region.hasAttribute("tabindex") ? region.tabIndex : 0;
      region.setAttribute("role", "region");
      if (!region.hasAttribute("aria-label") || /^Scrollable evidence group\b/i.test(region.getAttribute("aria-label"))) {
        const section = region.closest("section, article, .panel, main");
        const heading = section?.querySelector(":scope > .section-head h2, :scope > h2, :scope > h3, :scope > h4, .section-head h2, h2, h3, h4") || region.querySelector("h2, h3, h4, strong");
        const label = heading?.textContent?.trim();
        region.setAttribute("aria-label", label ? `${label} — scrollable group` : `Scrollable operating data ${index + 1}`);
      }
      region.dataset.scrollRegion = "true";
      if (window.matchMedia("(max-width: 760px)").matches && !region.previousElementSibling?.classList.contains("mobile-scroll-hint")) {
        const hint = document.createElement("p");
        hint.className = "mobile-scroll-hint";
        hint.id = `mobile-scroll-hint-${index + 1}`;
        hint.textContent = "Swipe or use the arrow keys to review the full record.";
        region.insertAdjacentElement("beforebegin", hint);
        region.setAttribute("aria-describedby", hint.id);
      }
    });
  };

  enhanceLongMobilePages();
  enhanceMobileDisclosures();
  enhanceTableSemantics();
  enhanceScrollRegions();
  window.addEventListener("resize", () => {
    enhanceLongMobilePages();
    enhanceScrollRegions();
  }, { passive: true });
})();
