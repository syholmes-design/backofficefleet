(function () {
  function initAggregatorMotion() {
    var motion = document.querySelector("[data-aggregator-motion]");
    if (!motion) return;

    var maxStep = 5;
    var currentStep = 0;
    var playTimer = 0;
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var status = motion.querySelector("[data-motion-status]");
    var railItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-rail]"));
    var groupedItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-group]"));
    var flipItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-flip]"));
    var carrierCards = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-card]"));
    var checkItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-check]"));
    var controls = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-action]"));
    var jumpControls = Array.prototype.slice.call(document.querySelectorAll("[data-motion-jump-play]"));
    var playButton = motion.querySelector('[data-motion-action="play"]');

    if (!status || !railItems.length || !controls.length) return;

    var messages = [
      "Ready for review",
      "Reviewing carrier rules",
      "Opening carrier roster",
      "Lifting documents and classifying readiness evidence",
      "Surfacing readiness fit",
      "Assembling proof packet"
    ];

    function setStatus(message) {
      if (status) status.textContent = message;
    }

    function stopPlayback() {
      if (playTimer) {
        window.clearInterval(playTimer);
        playTimer = 0;
      }
      motion.classList.remove("is-playing");
    }

    function setStep(nextStep) {
      currentStep = Math.max(0, Math.min(maxStep, nextStep));
      motion.setAttribute("data-motion-step", String(currentStep));

      railItems.forEach(function (item) {
        var railStep = Number(item.getAttribute("data-motion-rail") || "0");
        item.classList.toggle("is-active", railStep === currentStep);
        item.classList.toggle("is-complete", railStep < currentStep);
      });

      groupedItems.forEach(function (item) {
        var groupStep = Number(item.getAttribute("data-motion-group") || "0");
        item.classList.toggle("is-visible", groupStep > 0 && groupStep <= currentStep);
      });

      flipItems.forEach(function (item) {
        var groupStep = Number(item.getAttribute("data-motion-group") || "0");
        item.classList.toggle("is-checked", groupStep > 0 && groupStep <= currentStep);
      });

      carrierCards.forEach(function (card) {
        var outcome = card.getAttribute("data-outcome") || "";
        var isSelected = currentStep >= 4 && card.textContent.indexOf("Carrier A") !== -1;
        var isDimmed = currentStep >= 3 && outcome !== "eligible";
        card.classList.toggle("is-selected", isSelected);
        card.classList.toggle("is-dimmed", isDimmed);
      });

      checkItems.forEach(function (item, index) {
        item.classList.toggle("is-lit", currentStep >= 3);
        item.style.transitionDelay = currentStep >= 3 ? String(70 + index * 45) + "ms" : "0ms";
      });

      setStatus(messages[currentStep] || messages[0]);
    }

    function playFlow() {
      stopPlayback();
      motion.classList.remove("is-cta-starting");
      motion.classList.add("is-flow-ready");
      motion.classList.add("is-playing");

      if (reducedMotion) {
        setStep(maxStep);
        motion.classList.remove("is-playing");
        setStatus("Reduced motion: full flow shown");
        return;
      }

      if (currentStep >= maxStep) setStep(0);
      if (currentStep === 0) setStep(1);
      playTimer = window.setInterval(function () {
        if (currentStep >= maxStep) {
          stopPlayback();
          setStatus("Proof packet ready for review");
          return;
        }
        setStep(currentStep + 1);
      }, 1350);
    }

    function stepFlow() {
      stopPlayback();
      motion.classList.remove("is-cta-starting");
      motion.classList.add("is-flow-ready");
      setStep(currentStep >= maxStep ? 0 : currentStep + 1);
    }

    function pauseFlow() {
      stopPlayback();
      setStatus(currentStep ? "Flow paused" : "Ready for review");
    }

    function resetFlow() {
      stopPlayback();
      motion.classList.remove("is-flow-ready");
      motion.classList.remove("is-playing");
      motion.classList.remove("is-cta-starting");
      setStep(0);
    }

    function jumpToAnimationAndPlay(event) {
      if (event) event.preventDefault();
      stopPlayback();
      motion.classList.add("is-flow-ready");
      motion.classList.add("is-cta-starting");
      setStatus("Starting document-flow animation");
      motion.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start"
      });

      window.setTimeout(function () {
        if (playButton && typeof playButton.focus === "function") {
          try {
            playButton.focus({ preventScroll: true });
          } catch (error) {
            playButton.focus();
          }
        }
        playFlow();
      }, reducedMotion ? 0 : 520);
    }

    controls.forEach(function (control) {
      control.addEventListener("click", function () {
        var action = control.getAttribute("data-motion-action");
        if (action === "play") playFlow();
        if (action === "step") stepFlow();
        if (action === "pause") pauseFlow();
        if (action === "reset") resetFlow();
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
