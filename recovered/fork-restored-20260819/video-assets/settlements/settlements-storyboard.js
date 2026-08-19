(function () {
  var root = document.querySelector("[data-storyboard]");
  if (!root) return;

  var fallbackScenes = [
    {
      title: "Delivery Is Not the End",
      text: "Delivery is not the end of the load.",
      message: "The freight may be delivered, but the money process may still be incomplete.",
      visual: "delivery"
    },
    {
      title: "Settlement Gaps",
      text: "Delivered does not always mean settlement-ready.",
      message: "Missing documents and unclear pay items can delay billing and create disputes.",
      visual: "gaps"
    },
    {
      title: "BOF Settlement Readiness",
      text: "BOF checks the load before money moves.",
      message: "BOF organizes settlement readiness around the load.",
      visual: "checklist"
    },
    {
      title: "Driver Pay and Deductions",
      text: "Clear pay. Clear deductions. Fewer disputes.",
      message: "Drivers and fleet owners can see how the settlement is calculated.",
      visual: "pay"
    },
    {
      title: "Billing and Factoring Packet",
      text: "Faster packets. Faster payment.",
      message: "BOF helps prepare the documents needed to support billing and factoring.",
      visual: "packet"
    },
    {
      title: "Exception Control",
      text: "Know what is ready. Know what is blocked.",
      message: "The fleet can see which loads can move forward and which need attention.",
      visual: "status"
    },
    {
      title: "Cash Flow Visibility",
      text: "Protect cash flow after every load.",
      message: "Settlement control means fewer delays, fewer disputes, cleaner records, and better visibility.",
      visual: "cashflow"
    },
    {
      title: "BOF Fleet Assessment",
      text: "Take the BOF Fleet Assessment",
      message: "BOF helps fleets find where their settlement process may be leaking money.",
      visual: "assessment"
    }
  ];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function visualMarkup(type) {
    if (type === "delivery") {
      return '<div class="visual-shell">' +
        '<div class="panel-topbar"><strong>Settlement Review Queue</strong><span>BOF-L008</span></div>' +
        '<div class="dashboard-summary">' +
          '<div><span class="mini-label">Load ID</span><strong>BOF-L008</strong><small>Delivered / Settlement Review</small></div>' +
          '<div><span class="mini-label">Issue</span><strong>POD received</strong><small>Lumper receipt pending</small></div>' +
          '<div><span class="mini-label">Next step</span><strong>Hold billing packet</strong><small>Until receipt is attached</small></div>' +
        '</div>' +
        '<div class="record-grid">' +
          '<section class="record-card large"><span class="status-pill review">Settlement Review</span><h3>Delivery confirmed, money process still open</h3><p>BOF shows what is ready, what is missing, and the next record owner before billing moves forward.</p></section>' +
          '<section class="record-card blocked-soft"><span class="status-pill blocked">Open paperwork</span><h3>Lumper support needed</h3><p>POD is received, but lumper support still needs attachment.</p></section>' +
        '</div>' +
        '<div class="detail-list">' +
          '<div class="detail-row ready"><span>Proof of Delivery</span><strong>Attached</strong></div>' +
          '<div class="detail-row blocked"><span>Lumper receipt</span><strong>Pending</strong></div>' +
          '<div class="detail-row review"><span>Rate confirmation</span><strong>Waiting for match</strong></div>' +
        '</div>' +
      '</div>';
    }

    if (type === "gaps") {
      var warnings = [
        ["Missing POD", "Blocked", "Billing packet cannot close without delivery support."],
        ["Missing lumper receipt", "Needs Review", "Expense support is not attached to the settlement packet."],
        ["Unclear deduction", "Needs Review", "Driver pay line needs explanation before release."],
        ["Unmatched rate confirmation", "Needs Review", "Rate support needs to match invoice terms."],
        ["Incomplete factoring packet", "Blocked", "Funding support packet is not ready to send."]
      ];
      return '<div class="visual-shell gaps-panel">' +
        '<div class="panel-topbar"><strong>Settlement Gap Monitor</strong><span>5 open items</span></div>' +
        '<div class="warning-grid premium">' + warnings.map(function (item, index) {
          var tone = item[1] === "Blocked" ? "blocked" : "review";
          return '<div class="warning-card ' + tone + '"><span class="status-pill ' + tone + '">' + escapeHtml(item[1]) + '</span><h3>' + escapeHtml(item[0]) + '</h3><p>' + escapeHtml(item[2]) + '</p><small>Issue ' + String(index + 1).padStart(2, "0") + '</small></div>';
        }).join("") + '</div>' +
        '<div class="panel-note"><strong>BOF view:</strong> Flag the blocker, name the support record, and keep settlement review visible.</div>' +
      '</div>';
    }

    if (type === "checklist") {
      return '<div class="visual-shell readiness-panel">' +
        '<div class="panel-topbar"><strong>BOF Readiness Workflow</strong><span class="status-pill ready">Settlement Ready</span></div>' +
        '<div class="readiness-hero"><div><span class="mini-label">Readiness score</span><strong>5 / 5</strong><small>Packet checks completed</small></div><div class="progress-ring">Ready</div></div>' +
        '<div class="checklist">' +
          ["POD received", "Lumper receipt attached", "Rate confirmation matched", "Driver pay calculated", "Factoring packet ready"].map(function (item) {
            return '<div class="check-item"><span>' + escapeHtml(item) + '</span><span class="check-dot">&#10003;</span></div>';
          }).join("") +
        '</div>' +
        '<div class="panel-note success"><strong>Status:</strong> Settlement packet is organized for review and downstream billing support.</div>' +
      '</div>';
    }

    if (type === "pay") {
      var rows = [
        ["Gross Load Pay", "$2,450.00"],
        ["Fuel Advance", "-$300.00"],
        ["Lumper Reimbursement", "+$180.00"],
        ["Detention", "+$125.00"],
        ["Deductions", "-$75.00"],
        ["Net Settlement", "$2,380.00"]
      ];
      return '<div class="visual-shell pay-panel">' +
        '<div class="panel-topbar"><strong>Driver Settlement Preview</strong><span>Clear line items</span></div>' +
        '<div class="pay-summary"><div><span class="mini-label">Pay basis</span><strong>Settlement table</strong><small>BOF shows calculation support.</small></div><div><span class="status-pill review">Review before release</span></div></div>' +
        '<div class="pay-card">' + rows.map(function (row, index) {
          var finalClass = index === rows.length - 1 ? " final" : "";
          return '<div class="pay-row' + finalClass + '"><strong>' + escapeHtml(row[0]) + '</strong><span>' + escapeHtml(row[1]) + '</span></div>';
        }).join("") + '</div>' +
        '<div class="panel-note"><strong>Boundary:</strong> BOF shows settlement clarity; payroll and driver payment remain with the fleet.</div>' +
      '</div>';
    }

    if (type === "packet") {
      var docs = ["Rate Confirmation", "Proof of Delivery", "Lumper Receipt", "Delivery Photos", "Invoice Support", "Exception Notes"];
      return '<div class="visual-shell packet-panel">' +
        '<div class="panel-topbar"><strong>Billing / Factoring Support Packet</strong><span>6 document items</span></div>' +
        '<div class="packet-flow"><div class="document-grid">' + docs.map(function (doc, index) {
          return '<div class="document-card"><span class="doc-icon">0' + (index + 1) + '</span><strong>' + escapeHtml(doc) + '</strong><span class="mini-pill">Packet item</span></div>';
        }).join("") + '</div><div class="flow-arrow">Organized into packet</div><div class="packet"><span class="status-pill ready">Ready for Billing / Factoring</span><h3>Clean support packet</h3><p>BOF prepares and organizes the packet while the fleet keeps its billing and funding relationships separate.</p></div></div>' +
      '</div>';
    }

    if (type === "status") {
      return '<div class="visual-shell status-panel">' +
        '<div class="panel-topbar"><strong>Exception Control Board</strong><span>Settlement lanes</span></div>' +
        '<div class="status-column-grid">' +
          '<section class="status-tile ready"><span class="status-pill ready">Ready</span><strong>12</strong><p>Clean packets</p><ul><li>BOF-L006 packet complete</li><li>Invoice support attached</li></ul></section>' +
          '<section class="status-tile review"><span class="status-pill review">Needs Review</span><strong>5</strong><p>Open support items</p><ul><li>BOF-L008 lumper receipt</li><li>Rate match pending</li></ul></section>' +
          '<section class="status-tile blocked"><span class="status-pill blocked">Blocked</span><strong>3</strong><p>Cannot release yet</p><ul><li>BOF-L011 missing POD</li><li>Deduction not explained</li></ul></section>' +
        '</div>' +
        '<div class="panel-note"><strong>Control:</strong> BOF shows which records can move forward and which need attention.</div>' +
      '</div>';
    }

    if (type === "cashflow") {
      var metrics = [
        ["14", "Pending settlements", "4 need document review"],
        ["82%", "Billing readiness", "Review queue trend"],
        ["3", "Disputed items flagged", "Deductions need explanation"],
        ["21", "Completed packets", "Ready support records"]
      ];
      return '<div class="visual-shell cashflow-panel">' +
        '<div class="panel-topbar"><strong>Cash Flow Visibility</strong><span>Settlement dashboard</span></div>' +
        '<div class="metric-grid premium">' + metrics.map(function (metric) {
          return '<div class="metric-card"><strong>' + escapeHtml(metric[0]) + '</strong><span>' + escapeHtml(metric[1]) + '</span><small>' + escapeHtml(metric[2]) + '</small></div>';
        }).join("") + '</div>' +
        '<div class="chart-panel"><div class="chart-title"><strong>Packet readiness trend</strong><span>Last 4 reviews</span></div><div class="bar-chart"><i style="height:58%"></i><i style="height:72%"></i><i style="height:64%"></i><i style="height:82%"></i></div></div>' +
      '</div>';
    }

    return '<div class="visual-shell assessment-screen">' +
      '<div class="panel-topbar"><strong>BOF Fleet Assessment</strong><span>Settlement readiness path</span></div>' +
      '<div class="assessment-panel"><span class="status-pill ready">Assessment ready</span><h3>Find the settlement gaps before they become disputes.</h3><p>BOF reviews document blockers, billing packet support, driver-pay clarity, and settlement visibility around one real operating problem.</p><button class="assessment-cta" type="button">Take the BOF Fleet Assessment</button></div>' +
      '<div class="assessment-cards"><div><strong>Documents</strong><span>POD, rate confirmation, invoice support</span></div><div><strong>Exceptions</strong><span>Missing receipt, disputed deduction, release hold</span></div><div><strong>Visibility</strong><span>Owner, status, next action</span></div></div>' +
    '</div>';
  }

  function renderScenes(scenes) {
    var container = root.querySelector("[data-scenes]");
    var tabs = root.querySelector("[data-scene-tabs]");
    var template = document.getElementById("scene-card-template");
    if (!container || !tabs || !template) return;

    container.innerHTML = "";
    tabs.innerHTML = "";

    scenes.forEach(function (scene, index) {
      var number = index + 1;
      var clone = template.content.cloneNode(true);
      var card = clone.querySelector("[data-scene-card]");
      card.id = "scene-" + number;
      clone.querySelector("[data-scene-number]").textContent = String(number).padStart(2, "0");
      clone.querySelector("[data-scene-kicker]").textContent = "Scene " + number;
      clone.querySelector("[data-scene-title]").textContent = scene.title;
      clone.querySelector("[data-scene-text]").textContent = scene.text;
      clone.querySelector("[data-scene-message]").textContent = scene.message;
      clone.querySelector("[data-scene-visual]").innerHTML = visualMarkup(scene.visual);
      container.appendChild(clone);

      var button = document.createElement("button");
      button.type = "button";
      button.className = "scene-tab";
      button.textContent = number;
      button.setAttribute("aria-label", "Jump to scene " + number + ": " + scene.title);
      button.addEventListener("click", function () {
        document.getElementById("scene-" + number).scrollIntoView({ behavior: "smooth", block: "start" });
      });
      tabs.appendChild(button);
    });

    animateScenes();
    enableCaptureMode();
    window.settlementStoryboardReady = true;
  }

  function animateScenes() {
    var cards = Array.prototype.slice.call(root.querySelectorAll("[data-scene-card]"));
    var tabs = Array.prototype.slice.call(root.querySelectorAll(".scene-tab"));
    if (!("IntersectionObserver" in window)) {
      cards.forEach(function (card) { card.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          var index = cards.indexOf(entry.target);
          tabs.forEach(function (tab) { tab.classList.remove("is-active"); });
          if (tabs[index]) tabs[index].classList.add("is-active");
        }
      });
    }, { threshold: 0.35 });

    cards.forEach(function (card) { observer.observe(card); });
  }

  function enableCaptureMode() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("capture") !== "1") return;

    var sceneNumber = parseInt(params.get("scene") || "1", 10);
    var selected = document.getElementById("scene-" + sceneNumber);
    if (!selected) selected = document.getElementById("scene-1");

    document.body.classList.add("capture-mode");
    document.documentElement.classList.add("capture-mode-root");
    Array.prototype.forEach.call(root.querySelectorAll("[data-scene-card]"), function (card) {
      card.classList.toggle("is-capture-target", card === selected);
      card.classList.add("is-visible");
    });
  }

  function loadScenes() {
    return fetch("settlements-scenes.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Scene JSON unavailable");
        return response.json();
      })
      .then(function (data) {
        return Array.isArray(data.scenes) ? data.scenes : fallbackScenes;
      })
      .catch(function () {
        return fallbackScenes;
      });
  }

  window.settlementStoryboardReady = false;
  loadScenes().then(renderScenes);
})();
