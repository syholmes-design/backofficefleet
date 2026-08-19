(function () {
  "use strict";

  var workflow = document.querySelector("[data-audience-workflow]");
  if (!workflow) return;

  var states = {
    fleet: {
      kicker: "Fleet Owners",
      title: "Owner-ready visibility across the records that slow the office down.",
      caption: "BOF keeps driver readiness, expiring documents, settlement holds, proof packet gaps, and claims follow-up visible in one operating queue.",
      cards: [
        ["Driver readiness", "92%", "6 watch notes"],
        ["Expiring docs", "11", "Owner assigned"],
        ["Settlement holds", "4", "Proof gap"],
        ["Claims follow-up", "2", "Evidence packet"]
      ],
      queue: [
        ["Ready", "Proof packet complete"],
        ["Review", "Expiring medical card"],
        ["Blocked", "Missing delivery receipt"]
      ],
      demoHref: "/fleet-operator-offer/",
      demoLabel: "Open fleet path",
      scenarioHref: "/scenario-walkthrough/",
      scenarioLabel: "Request a BOF assessment"
    },
    aggregators: {
      kicker: "Aggregators",
      title: "Network readiness with clear operating boundaries.",
      caption: "BOF helps surface eligible carriers, review-needed records, blocked files, proof requirements, and carrier readiness signals across partner networks.",
      cards: [
        ["Network readiness", "87%", "5 review notes"],
        ["Eligible carriers", "38", "Visible now"],
        ["Need review", "9", "Rules pending"],
        ["Blocked records", "6", "Document gap"]
      ],
      queue: [
        ["Eligible", "Midwest reefer partner"],
        ["Review", "Insurance renewal pending"],
        ["Blocked", "Carrier packet incomplete"]
      ],
      demoHref: "/animated-demo-aggregator/",
      demoLabel: "Open guided demo",
      scenarioHref: "/aggregator-partner-offer/",
      scenarioLabel: "Explore partner offer"
    },
    private: {
      kicker: "Private Fleets",
      title: "Internal readiness and proof workflows without building a new back office.",
      caption: "BOF gives private fleet teams a clearer view of internal drivers, vehicle readiness, route documentation, proof records, and exception follow-up.",
      cards: [
        ["Internal drivers", "64", "Roster active"],
        ["Vehicle readiness", "91%", "Inspection watch"],
        ["Proof records", "128", "Filed"],
        ["Exception queue", "5", "Needs owner"]
      ],
      queue: [
        ["Ready", "Route documentation filed"],
        ["Review", "Vehicle inspection watch"],
        ["Blocked", "Missing proof record"]
      ],
      demoHref: "/private-fleet-offer/",
      demoLabel: "Open private fleet path",
      scenarioHref: "/scenario-walkthrough/",
      scenarioLabel: "Request a BOF assessment"
    },
    government: {
      kicker: "Government Entities",
      title: "Audit-support workflows for contracted and regulated operations.",
      caption: "BOF organizes contractor readiness, audit packets, proof records, exception review, and documentation status so review work stays attached to records.",
      cards: [
        ["Contractor readiness", "84%", "Evidence watch"],
        ["Audit packets", "42", "Ready"],
        ["Proof records", "76", "Filed"],
        ["Exception review", "8", "Owner named"]
      ],
      queue: [
        ["Ready", "Audit packet assembled"],
        ["Review", "Contractor file watch"],
        ["Blocked", "Missing proof document"]
      ],
      demoHref: "/government/",
      demoLabel: "Review government path",
      scenarioHref: "/scenario-walkthrough/",
      scenarioLabel: "Request a BOF assessment"
    },
    vault: {
      kicker: "The Vault",
      title: "Documents become readiness statuses instead of passive storage.",
      caption: "Driver document intake is the administrative intake layer for CDL, medical card, MVR, DQF, insurance, proof packets, and exception follow-up.",
      cards: [
        ["CDL", "Ready", "Verified"],
        ["Medical card", "Watch", "Renewal soon"],
        ["MVR", "Filed", "Current"],
        ["DQF", "91%", "2 gaps"]
      ],
      queue: [
        ["Ready", "CDL and MVR filed"],
        ["Review", "Medical renewal watch"],
        ["Blocked", "DQF signature missing"]
      ],
      demoHref: "/document-readiness-engine/",
      demoLabel: "Open readiness engine",
      scenarioHref: "/interactive-demo/drivers/document-intake/",
      scenarioLabel: "Open driver document-intake demo"
    }
  };

  var tabs = Array.prototype.slice.call(workflow.querySelectorAll("[data-workflow-tab]"));
  var kicker = workflow.querySelector("[data-workflow-kicker]");
  var title = workflow.querySelector("[data-workflow-title]");
  var caption = workflow.querySelector("[data-workflow-caption]");
  var cards = workflow.querySelector("[data-workflow-cards]");
  var queue = workflow.querySelector("[data-workflow-queue]");
  var demo = workflow.querySelector("[data-workflow-demo]");
  var scenario = workflow.querySelector("[data-workflow-scenario]");

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function setWorkflow(key) {
    var state = states[key] || states.fleet;
    tabs.forEach(function (tab) {
      var active = tab.getAttribute("data-workflow-tab") === key;
      tab.setAttribute("aria-selected", String(active));
    });
    if (kicker) kicker.textContent = state.kicker;
    if (title) title.textContent = state.title;
    if (caption) caption.textContent = state.caption;
    if (cards) {
      cards.innerHTML = state.cards.map(function (item) {
        return "<article><span>" + escapeHtml(item[0]) + "</span><strong>" + escapeHtml(item[1]) + "</strong><em>" + escapeHtml(item[2]) + "</em></article>";
      }).join("");
    }
    if (queue) {
      queue.innerHTML = state.queue.map(function (item) {
        return "<div><span>" + escapeHtml(item[0]) + "</span><strong>" + escapeHtml(item[1]) + "</strong></div>";
      }).join("");
    }
    if (demo) {
      demo.href = state.demoHref;
      demo.textContent = state.demoLabel;
    }
    if (scenario) {
      scenario.href = state.scenarioHref;
      scenario.textContent = state.scenarioLabel;
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      setWorkflow(tab.getAttribute("data-workflow-tab"));
    });
    tab.addEventListener("keydown", function (event) {
      var index = tabs.indexOf(tab);
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      var nextIndex = event.key === "ArrowRight" ? index + 1 : index - 1;
      if (nextIndex < 0) nextIndex = tabs.length - 1;
      if (nextIndex >= tabs.length) nextIndex = 0;
      tabs[nextIndex].focus();
      setWorkflow(tabs[nextIndex].getAttribute("data-workflow-tab"));
    });
  });
}());

