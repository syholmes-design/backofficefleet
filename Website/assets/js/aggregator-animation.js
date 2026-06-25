(function () {
  function initAggregatorMotion() {
    var motion = document.querySelector("[data-aggregator-motion]");
    if (!motion) return;

    var maxStep = 8;
    var currentStep = 0;
    var playTimer = 0;
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var status = motion.querySelector("[data-motion-status]");
    var caption = motion.querySelector("[data-motion-caption]");
    var railItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-rail]"));
    var controls = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-action]"));
    var jumpControls = Array.prototype.slice.call(document.querySelectorAll("[data-motion-jump-play]"));
    var carrierCards = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-card]"));
    var ruleItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-rule]"));
    var documentItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-doc]"));
    var proofItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-proof]"));
    var impactItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-impact]"));

    if (!status || !caption || !railItems.length || !controls.length) return;

    var messages = [
      "Ready",
      "Customer request entered",
      "Aggregator roster opened",
      "Roster rules active",
      "Documents classified",
      "Exceptions separated",
      "Readiness fit surfaced",
      "Proof packet assembling",
      "Commercial impact visible"
    ];

    var captions = [
      "Press Play Demo to watch BOF move from customer request to readiness fit and proof-ready record.",
      "Customer capacity request enters the BOF readiness layer.",
      "BOF opens the aggregator roster without assuming every carrier is usable.",
      "Carrier, driver, equipment, customer, and proof rules are checked together.",
      "Documents lift from the record and classify into readiness evidence.",
      "Blocked and review-needed capacity is separated before the load is exposed to risk.",
      "BOF surfaces the best readiness fit.",
      "Proof packet requirements assemble before billing and settlement.",
      "Readiness fit, proof status, exceptions, and customer requirements are visible for review."
    ];

    function setStatus(message) {
      status.textContent = message;
    }

    function setCaption(message) {
      caption.textContent = message;
    }

    function clearTimer() {
      if (playTimer) {
        window.clearInterval(playTimer);
        playTimer = 0;
      }
    }

    function stopPlayback() {
      clearTimer();
      motion.classList.remove("is-playing");
    }

    function animateImpactCounters() {
      impactItems.forEach(function (item, index) {
        item.style.transitionDelay = currentStep >= 8 ? String(index * 90) + "ms" : "0ms";
      });
    }

    function setStep(nextStep) {
      currentStep = Math.max(0, Math.min(maxStep, nextStep));
      motion.setAttribute("data-motion-step", String(currentStep));

      railItems.forEach(function (item) {
        var railStep = Number(item.getAttribute("data-motion-rail") || "0");
        item.classList.toggle("is-active", railStep === currentStep);
        item.classList.toggle("is-complete", railStep < currentStep);
        item.setAttribute("aria-pressed", railStep === currentStep ? "true" : "false");
      });

      carrierCards.forEach(function (card) {
        var outcome = card.getAttribute("data-outcome") || "";
        var selected = currentStep >= 6 && outcome === "eligible";
        var dimmed = currentStep >= 5 && outcome !== "eligible";
        card.classList.toggle("is-selected", selected);
        card.classList.toggle("is-dimmed", dimmed);
      });

      ruleItems.forEach(function (item, index) {
        item.classList.toggle("is-lit", currentStep >= 3);
        item.style.transitionDelay = currentStep >= 3 ? String(index * 70) + "ms" : "0ms";
      });

      documentItems.forEach(function (item, index) {
        item.classList.toggle("is-classified", currentStep >= 4);
        item.style.transitionDelay = currentStep >= 4 ? String(index * 55) + "ms" : "0ms";
      });

      proofItems.forEach(function (item, index) {
        item.classList.toggle("is-assembled", currentStep >= 7);
        item.style.transitionDelay = currentStep >= 7 ? String(index * 70) + "ms" : "0ms";
      });

      impactItems.forEach(function (item) {
        item.classList.toggle("is-visible", currentStep >= 8);
      });

      animateImpactCounters();
      setStatus(messages[currentStep] || messages[0]);
      setCaption(captions[currentStep] || captions[0]);
    }

    function finishReducedMotion() {
      setStep(maxStep);
      motion.classList.remove("is-playing");
      setStatus("Reduced motion: complete sequence shown");
      setCaption("Reduced motion is on, so BOF shows the completed readiness fit, proof packet, exception, and impact state without animated transitions.");
    }

    function playFlow() {
      stopPlayback();
      motion.classList.remove("is-cta-starting");
      motion.classList.add("is-playing");

      if (reducedMotion) {
        finishReducedMotion();
        return;
      }

      if (currentStep >= maxStep) setStep(0);
      if (currentStep === 0) setStep(1);

      playTimer = window.setInterval(function () {
        if (currentStep >= maxStep) {
          stopPlayback();
          setStatus("Commercial impact visible");
          setCaption(captions[maxStep]);
          return;
        }
        setStep(currentStep + 1);
      }, 1550);
    }

    function stepFlow() {
      stopPlayback();
      motion.classList.remove("is-cta-starting");
      setStep(currentStep >= maxStep ? 0 : currentStep + 1);
    }

    function pauseFlow() {
      stopPlayback();
      setStatus(currentStep ? "Paused" : "Ready");
    }

    function resetFlow() {
      stopPlayback();
      motion.classList.remove("is-cta-starting");
      setStep(0);
    }

    function showSummary() {
      stopPlayback();
      setStep(maxStep);
      var summary = document.querySelector("#cinematic-summary");
      if (summary && typeof summary.scrollIntoView === "function") {
        summary.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "nearest"
        });
      }
    }

    function jumpToAnimationAndPlay(event) {
      if (event) event.preventDefault();
      stopPlayback();
      motion.classList.add("is-cta-starting");
      setStatus("Launching cinematic sequence");
      setCaption("Launching the guided roster, rules, readiness, and proof sequence.");
      motion.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start"
      });

      window.setTimeout(function () {
        playFlow();
      }, reducedMotion ? 0 : 420);
    }

    controls.forEach(function (control) {
      control.addEventListener("click", function () {
        var action = control.getAttribute("data-motion-action");
        if (action === "play") playFlow();
        if (action === "step") stepFlow();
        if (action === "pause") pauseFlow();
        if (action === "reset") {
          resetFlow();
          playFlow();
        }
        if (action === "summary") showSummary();
      });
    });

    railItems.forEach(function (item) {
      item.addEventListener("click", function () {
        stopPlayback();
        setStep(Number(item.getAttribute("data-motion-rail") || "0"));
      });
    });

    jumpControls.forEach(function (control) {
      control.addEventListener("click", jumpToAnimationAndPlay);
    });

    setStep(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAggregatorMotion, { once: true });
  } else {
    initAggregatorMotion();
  }
})();
