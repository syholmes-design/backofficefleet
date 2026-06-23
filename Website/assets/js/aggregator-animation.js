(function () {
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
  var controls = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-action]"));

  var messages = [
    "Ready for review",
    "Capacity need received",
    "Carrier roster opened",
    "Rules and readiness checked",
    "Best readiness fit surfaced",
    "Proof packet assembled"
  ];

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function stopPlayback() {
    if (playTimer) {
      window.clearInterval(playTimer);
      playTimer = 0;
    }
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
      var isSelected = currentStep >= 4 && card.textContent.indexOf("Carrier A") !== -1;
      card.classList.toggle("is-selected", isSelected);
    });

    setStatus(messages[currentStep] || messages[0]);
  }

  function playFlow() {
    stopPlayback();
    motion.classList.add("is-flow-ready");

    if (reducedMotion) {
      setStep(maxStep);
      setStatus("Reduced motion: full flow shown");
      return;
    }

    if (currentStep >= maxStep) setStep(0);
    playTimer = window.setInterval(function () {
      if (currentStep >= maxStep) {
        stopPlayback();
        setStatus("Flow complete");
        return;
      }
      setStep(currentStep + 1);
    }, 1100);
  }

  function stepFlow() {
    stopPlayback();
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
    setStep(0);
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

  setStep(0);
})();
