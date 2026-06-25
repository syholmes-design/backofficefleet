(function () {
  function initAggregatorMotion() {
    var motion = document.querySelector("[data-aggregator-motion]");
    if (!motion) return;

    var maxStep = 8;
    var currentStep = 0;
    var playTimer = 0;
    var isPlaying = false;
    var soundEnabled = false;
    var speedMode = "presentation";
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var speech = window.speechSynthesis || null;

    var status = motion.querySelector("[data-motion-status]");
    var caption = motion.querySelector("[data-motion-caption]");
    var progress = motion.querySelector("[data-motion-progress]");
    var title = motion.querySelector("[data-motion-title]");
    var note = motion.querySelector("[data-motion-note]");
    var speedSelect = motion.querySelector("[data-motion-speed]");
    var soundToggle = motion.querySelector("[data-motion-sound]");
    var captionPanel = motion.querySelector("[data-motion-caption-panel]");
    var railItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-rail]"));
    var controls = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-action]"));
    var jumpControls = Array.prototype.slice.call(document.querySelectorAll("[data-motion-jump-play]"));
    var carrierCards = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-card]"));
    var ruleItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-rule]"));
    var documentItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-doc]"));
    var proofItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-proof]"));
    var impactItems = Array.prototype.slice.call(motion.querySelectorAll("[data-motion-impact]"));

    if (!status || !caption || !railItems.length || !controls.length) return;

    var scenes = [
      {
        status: "Ready",
        title: "Ready to begin",
        caption: "Press Play Demo to watch BOF move from customer request to readiness fit and proof-ready record.",
        note: "Presentation mode runs slowly enough for a guided walkthrough."
      },
      {
        status: "Customer request entered",
        title: "Customer Demand",
        caption: "A customer capacity request enters the BOF readiness layer.",
        note: "The request carries equipment, temperature, proof, and insurance expectations before any readiness fit is surfaced.",
        duration: 3800,
        fastDuration: 1300
      },
      {
        status: "Aggregator roster opened",
        title: "Aggregator Roster",
        caption: "BOF opens the aggregator roster without assuming every carrier is usable.",
        note: "Carrier cards enter as candidates, but BOF keeps review and blocked records visible.",
        duration: 3900,
        fastDuration: 1300
      },
      {
        status: "Roster rules active",
        title: "Rule Profile Check",
        caption: "Carrier, driver, equipment, customer, and proof rules are checked together.",
        note: "Pass, review, and blocked states show why every carrier cannot be treated the same.",
        duration: 4700,
        fastDuration: 1500
      },
      {
        status: "Documents classified",
        title: "Document Evidence",
        caption: "Documents lift from the record and classify into readiness evidence.",
        note: "The demo uses a smaller set of larger document cards so proof is readable during the presentation.",
        duration: 5600,
        fastDuration: 1700
      },
      {
        status: "Exceptions separated",
        title: "Exception Lane",
        caption: "Blocked and review-needed options are separated before risk reaches the customer.",
        note: "Unavailable and review-needed capacity moves aside instead of being hidden.",
        duration: 3900,
        fastDuration: 1300
      },
      {
        status: "Readiness fit surfaced",
        title: "Readiness Fit",
        caption: "BOF surfaces the best readiness fit.",
        note: "The selected fit brings carrier, driver, equipment, customer, and proof requirements together.",
        duration: 4700,
        fastDuration: 1500
      },
      {
        status: "Proof packet assembling",
        title: "Proof Packet",
        caption: "Proof packet requirements assemble before billing and settlement.",
        note: "Required proof follows the carrier, driver, customer, and equipment record.",
        duration: 5600,
        fastDuration: 1700
      },
      {
        status: "Commercial impact visible",
        title: "Commercial Impact",
        caption: "The result is usable capacity with exceptions visible and proof attached.",
        note: "BOF keeps readiness fit, exceptions, and proof requirements visible for review.",
        duration: 4700,
        fastDuration: 1500
      }
    ];

    function clearTimer() {
      if (playTimer) {
        window.clearTimeout(playTimer);
        playTimer = 0;
      }
    }

    function stopSpeech() {
      if (speech && speech.speaking) speech.cancel();
    }

    function setStatus(message) {
      status.textContent = message;
    }

    function setCaption(message) {
      caption.textContent = message;
    }

    function setMeta(scene) {
      if (title) title.textContent = scene.title;
      if (progress) progress.textContent = currentStep ? "Scene " + currentStep + " of " + maxStep : "Ready";
      if (note) note.textContent = scene.note;
    }

    function sceneDuration(scene) {
      if (speedMode === "fast") return scene.fastDuration || 1400;
      return scene.duration || 4200;
    }

    function speakScene(scene) {
      if (!soundEnabled || !speech || !scene || currentStep === 0) return;
      stopSpeech();
      var utterance = new SpeechSynthesisUtterance(scene.caption);
      utterance.rate = 0.92;
      utterance.pitch = 0.94;
      utterance.volume = 0.78;
      try {
        speech.speak(utterance);
      } catch (error) {
        soundEnabled = false;
        motion.setAttribute("data-sound-enabled", "false");
        if (soundToggle) soundToggle.checked = false;
        if (note) note.textContent = "Narration is not available in this browser. Captions remain active.";
      }
    }

    function setStep(nextStep, options) {
      options = options || {};
      currentStep = Math.max(0, Math.min(maxStep, nextStep));
      var scene = scenes[currentStep] || scenes[0];
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
        item.style.transitionDelay = currentStep >= 3 ? String(index * 180) + "ms" : "0ms";
      });

      documentItems.forEach(function (item, index) {
        item.classList.toggle("is-classified", currentStep >= 4);
        item.style.transitionDelay = currentStep >= 4 ? String(index * 190) + "ms" : "0ms";
      });

      proofItems.forEach(function (item, index) {
        item.classList.toggle("is-assembled", currentStep >= 7);
        item.style.transitionDelay = currentStep >= 7 ? String(index * 240) + "ms" : "0ms";
      });

      impactItems.forEach(function (item, index) {
        item.classList.toggle("is-visible", currentStep >= 8);
        item.style.transitionDelay = currentStep >= 8 ? String(index * 180) + "ms" : "0ms";
      });

      setStatus(scene.status);
      setCaption(scene.caption);
      setMeta(scene);
      if (options.speak) speakScene(scene);
    }

    function stopPlayback() {
      clearTimer();
      isPlaying = false;
      motion.classList.remove("is-playing");
      stopSpeech();
    }

    function scheduleNext() {
      clearTimer();
      if (!isPlaying || speedMode === "step") return;
      if (currentStep >= maxStep) {
        stopPlayback();
        setStatus(scenes[maxStep].status);
        return;
      }
      playTimer = window.setTimeout(function () {
        setStep(currentStep + 1, { speak: true });
        scheduleNext();
      }, sceneDuration(scenes[currentStep]));
    }

    function finishReducedMotion() {
      stopPlayback();
      setStep(maxStep);
      setStatus("Reduced motion: complete sequence shown");
      setCaption("Reduced motion is on, so BOF shows the completed readiness fit, proof packet, exception, and impact state without animated transitions.");
      if (note) note.textContent = "Controls remain available, but heavy slide and scan motion is disabled.";
    }

    function playFlow() {
      stopPlayback();
      motion.classList.remove("is-cta-starting");
      motion.classList.add("is-playing");

      if (reducedMotion) {
        finishReducedMotion();
        return;
      }

      isPlaying = speedMode !== "step";
      if (currentStep >= maxStep) setStep(0);
      if (currentStep === 0) setStep(1, { speak: true });
      else setStep(currentStep, { speak: true });

      if (speedMode === "step") {
        motion.classList.remove("is-playing");
        setStatus(scenes[currentStep].status + " - step-by-step");
        return;
      }

      scheduleNext();
    }

    function stepFlow() {
      stopPlayback();
      motion.classList.remove("is-cta-starting");
      setStep(currentStep >= maxStep ? 1 : currentStep + 1, { speak: true });
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
      speedMode = "presentation";
      if (speedSelect) speedSelect.value = "presentation";
      stopPlayback();
      motion.classList.add("is-cta-starting");
      setStatus("Launching cinematic sequence");
      setCaption("Launching the guided roster, rules, readiness, and proof sequence.");
      if (captionPanel && typeof captionPanel.focus === "function") captionPanel.focus({ preventScroll: true });
      motion.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start"
      });

      window.setTimeout(function () {
        playFlow();
      }, reducedMotion ? 0 : 520);
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
        setStep(Number(item.getAttribute("data-motion-rail") || "0"), { speak: true });
      });
    });

    jumpControls.forEach(function (control) {
      control.addEventListener("click", jumpToAnimationAndPlay);
    });

    if (speedSelect) {
      speedSelect.addEventListener("change", function () {
        speedMode = speedSelect.value || "presentation";
        motion.setAttribute("data-speed-mode", speedMode);
        setStatus(speedMode === "step" ? "Step-by-step mode" : "Speed set to " + speedSelect.options[speedSelect.selectedIndex].text);
        if (isPlaying) {
          clearTimer();
          scheduleNext();
        }
      });
    }

    if (soundToggle) {
      soundToggle.addEventListener("change", function () {
        soundEnabled = soundToggle.checked;
        motion.setAttribute("data-sound-enabled", String(soundEnabled));
        if (!speech && soundEnabled) {
          soundEnabled = false;
          soundToggle.checked = false;
          motion.setAttribute("data-sound-enabled", "false");
          if (note) note.textContent = "Narration is not supported in this browser. Captions remain active.";
          return;
        }
        if (!soundEnabled) {
          stopSpeech();
          if (note) note.textContent = "Narration muted. Captions remain active.";
        } else if (currentStep > 0) {
          speakScene(scenes[currentStep]);
        } else if (note) {
          note.textContent = "Narration enabled. Press Play Demo to hear restrained scene narration.";
        }
      });
    }

    setStep(0);
    motion.setAttribute("data-speed-mode", speedMode);
    motion.setAttribute("data-sound-enabled", "false");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAggregatorMotion, { once: true });
  } else {
    initAggregatorMotion();
  }
})();
