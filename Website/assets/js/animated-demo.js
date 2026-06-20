(function () {
  try {
  var root = document.querySelector("[data-animated-demo]");
  if (!root) return;

  var scenes = Array.prototype.slice.call(root.querySelectorAll("[data-scene]"));
  var sceneDuration = 10000;
  var activeIndex = 0;
  var isPlaying = false;
  var sceneStartedAt = window.performance.now();
  var pausedAt = 0;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var progressLabel = root.querySelector("[data-scene-progress]");
  var progressFill = root.querySelector("[data-progress-fill]");
  var playStatus = root.querySelector("[data-play-status]");
  var engineMessage = root.querySelector("[data-engine-message]");
  var startButtons = Array.prototype.slice.call(root.querySelectorAll("[data-demo-action='start']"));
  var pauseButtons = Array.prototype.slice.call(root.querySelectorAll("[data-demo-action='pause']"));
  var resumeButtons = Array.prototype.slice.call(root.querySelectorAll("[data-demo-action='resume']"));
  var restartButtons = Array.prototype.slice.call(root.querySelectorAll("[data-demo-action='restart']"));
  var previousButtons = Array.prototype.slice.call(root.querySelectorAll("[data-demo-action='previous']"));
  var nextButtons = Array.prototype.slice.call(root.querySelectorAll("[data-demo-action='next']"));
  var sceneRail = root.querySelector("[data-scene-rail]");
  var jumpButtons = [];
  var copyScriptButton = root.querySelector("[data-copy-script]");
  var copyCurrentScriptButton = root.querySelector("[data-copy-current-script]");
  var copyScriptSource = root.querySelector("[data-script-copy-source]");
  var copyStatus = root.querySelector("[data-copy-status]");
  var scriptGuide = root.querySelector("#speaking-script");
  var modeButtons = Array.prototype.slice.call(root.querySelectorAll("[data-mode-option]"));
  var audienceButtons = Array.prototype.slice.call(root.querySelectorAll("[data-audience-option]"));
  var audienceSummary = root.querySelector("[data-audience-summary]");
  var totalWordsTarget = root.querySelector("[data-total-words]");
  var totalSpeakingTarget = root.querySelector("[data-total-speaking]");
  var totalDemoDurationTarget = root.querySelector("[data-total-demo-duration]");
  var currentPaceTarget = root.querySelector("[data-current-pace]");
  var scriptCards = Array.prototype.slice.call(root.querySelectorAll("[data-review-scene]"));
  var audienceLabels = {
    fleet: "Fleet owner view emphasizes control, blockers, ownership, and reduced document chasing.",
    network: "Carrier network view emphasizes readiness scoring, documentation consistency, and multi-carrier visibility.",
    aggregator: "Aggregator view emphasizes operationally ready capacity across carrier networks without freight matching."
  };
  var wordsPerMinute = 150;

  function showEngineMessage(message) {
    if (!engineMessage) return;
    engineMessage.hidden = false;
    engineMessage.textContent = message;
  }

  function clearEngineMessage() {
    if (!engineMessage) return;
    engineMessage.hidden = true;
    engineMessage.textContent = "";
  }

  if (!scenes.length || !progressLabel || !playStatus) {
    showEngineMessage("The animated demo controls did not initialize. Refresh the page, or use the visible scene content for review.");
    return;
  }

  function buildSceneRail() {
    if (!sceneRail) return;
    sceneRail.innerHTML = "";
    scenes.forEach(function (scene, sceneIndex) {
      var title = scene.querySelector("h2");
      var button = document.createElement("button");
      var label = document.createElement("span");
      var name = document.createElement("strong");
      button.className = "ad-scene-jump";
      button.type = "button";
      button.setAttribute("data-scene-jump", String(sceneIndex));
      label.textContent = "Scene " + (sceneIndex + 1);
      name.textContent = title ? title.textContent.trim() : "Scene " + (sceneIndex + 1);
      button.appendChild(label);
      button.appendChild(name);
      sceneRail.appendChild(button);
    });
    jumpButtons = Array.prototype.slice.call(sceneRail.querySelectorAll("[data-scene-jump]"));
  }

  function setPlayState(nextPlaying, stoppedLabel) {
    isPlaying = nextPlaying;
    root.dataset.playState = isPlaying ? "playing" : "paused";
    if (playStatus) playStatus.textContent = isPlaying ? "Auto-running" : (stoppedLabel || "Paused");
    pauseButtons.forEach(function (button) {
      button.disabled = !isPlaying;
    });
    resumeButtons.forEach(function (button) {
      button.disabled = isPlaying;
    });

    if (isPlaying) {
      clearEngineMessage();
      var now = window.performance.now();
      sceneStartedAt = now - pausedAt;
      pausedAt = 0;
    } else {
      pausedAt = window.performance.now() - sceneStartedAt;
    }
  }

  function resetTimer() {
    sceneStartedAt = window.performance.now();
    pausedAt = 0;
    if (progressFill) progressFill.style.width = "0%";
  }

  function bringStageIntoView() {
    var stage = root.querySelector(".ad-stage");
    if (!stage) return;
    var rect = stage.getBoundingClientRect();
    var shouldScroll = window.innerWidth < 1180 || rect.top < 0 || rect.top > window.innerHeight * 0.35;
    if (shouldScroll && stage.scrollIntoView) {
      stage.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }

  function countWords(text) {
    var words = (text || "").trim().match(/\b[\w'-]+\b/g);
    return words ? words.length : 0;
  }

  function estimateSpeakingSeconds(wordCount) {
    return Math.max(1, Math.round((wordCount / wordsPerMinute) * 60));
  }

  function formatSeconds(seconds) {
    if (seconds < 60) return seconds + " sec";
    var minutes = Math.floor(seconds / 60);
    var remaining = seconds % 60;
    return minutes + " min" + (remaining ? " " + remaining + " sec" : "");
  }

  function getPacingLabel(estimatedSeconds, suggestedSeconds) {
    if (estimatedSeconds < suggestedSeconds * 0.65) {
      return { label: "Too Short", className: "too-short" };
    }
    if (estimatedSeconds > suggestedSeconds * 1.25) {
      return { label: "Too Long", className: "too-long" };
    }
    return { label: "Good Pace", className: "good-pace" };
  }

  function animateCounters(scene) {
    var counters = Array.prototype.slice.call(scene.querySelectorAll("[data-count]"));
    counters.forEach(function (counter) {
      var target = Number(counter.getAttribute("data-count"));
      var suffix = counter.getAttribute("data-count-suffix") || "";
      var prefix = counter.getAttribute("data-count-prefix") || "";
      var duration = reducedMotion ? 0 : 900;
      var started = window.performance.now();

      function draw(now) {
        var ratio = duration ? Math.min((now - started) / duration, 1) : 1;
        var eased = 1 - Math.pow(1 - ratio, 3);
        var value = Math.round(target * eased);
        counter.textContent = prefix + value + suffix;
        if (ratio < 1) window.requestAnimationFrame(draw);
      }

      window.requestAnimationFrame(draw);
    });
  }

  function activateScene(index) {
    activeIndex = (index + scenes.length) % scenes.length;
    scenes.forEach(function (scene, sceneIndex) {
      scene.classList.toggle("is-active", sceneIndex === activeIndex);
      scene.classList.toggle("is-before", sceneIndex < activeIndex);
      scene.classList.toggle("is-after", sceneIndex > activeIndex);
      scene.setAttribute("aria-hidden", sceneIndex === activeIndex ? "false" : "true");
    });

    if (progressLabel) {
      progressLabel.textContent = "Scene " + (activeIndex + 1) + " of " + scenes.length;
    }

    jumpButtons.forEach(function (button, buttonIndex) {
      var isActive = buttonIndex === activeIndex;
      button.classList.toggle("is-active", isActive);
      if (isActive) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });

    root.style.setProperty("--active-scene", String(activeIndex + 1));
    animateCounters(scenes[activeIndex]);
    updateNarrationMetrics();
    resetTimer();
  }

  function goToScene(index) {
    activateScene(index);
  }

  function nextScene() {
    goToScene(activeIndex + 1);
  }

  function previousScene() {
    goToScene(activeIndex - 1);
  }

  function tick(now) {
    if (isPlaying) {
      var elapsed = now - sceneStartedAt;
      var ratio = Math.min(elapsed / sceneDuration, 1);
      if (progressFill) progressFill.style.width = Math.round(ratio * 100) + "%";
      if (elapsed >= sceneDuration) nextScene();
    }
    window.requestAnimationFrame(tick);
  }

  buildSceneRail();

  startButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activateScene(0);
      setPlayState(true);
      bringStageIntoView();
    });
  });

  pauseButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setPlayState(false, "Paused");
    });
  });

  resumeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setPlayState(true);
      bringStageIntoView();
    });
  });

  restartButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activateScene(0);
      setPlayState(true);
      bringStageIntoView();
    });
  });

  previousButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      previousScene();
    });
  });

  nextButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      nextScene();
    });
  });

  jumpButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var index = Number(button.getAttribute("data-scene-jump"));
      if (!Number.isNaN(index)) {
        goToScene(index);
        bringStageIntoView();
      }
    });
  });

  function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "readonly");
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();

      try {
        var success = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (success) resolve();
        else reject(new Error("Copy command was not available."));
      } catch (error) {
        document.body.removeChild(textArea);
        reject(error);
      }
    });
  }

  function getSceneTitleForCard(card) {
    var title = card.querySelector("h3");
    return title ? title.textContent.trim() : "Scene script";
  }

  function getSceneScriptText(card) {
    if (!card) return "";
    var title = getSceneTitleForCard(card);
    var narration = card.querySelector("dt:nth-of-type(1) + dd");
    var voiceover = card.querySelector("[data-voiceover-display]");
    var timing = card.getAttribute("data-suggested-seconds") || "";
    var presenterNote = card.querySelector("dt:nth-of-type(3) + dd");
    return [
      title,
      "On-screen narration: " + (narration ? narration.textContent.trim() : ""),
      "Full voiceover script: " + (voiceover ? voiceover.textContent.trim() : ""),
      "Presenter note: " + (presenterNote ? presenterNote.textContent.trim() : ""),
      "Suggested timing: " + timing + " seconds"
    ].join("\n");
  }

  function getCurrentScriptCard() {
    var activeScene = scenes[activeIndex];
    var key = activeScene ? activeScene.getAttribute("data-scene") : "";
    return scriptCards.filter(function (card) {
      return card.getAttribute("data-review-scene") === key;
    })[0] || scriptCards[0];
  }

  function getFullScriptText() {
    return scriptCards.map(getSceneScriptText).join("\n\n");
  }

  function updateNarrationMetrics() {
    if (!scriptCards.length) return;

    var totalWords = 0;
    var totalSpeakingSeconds = 0;
    var totalSuggestedSeconds = 0;

    scriptCards.forEach(function (card) {
      var voiceover = card.querySelector("[data-voiceover-display]");
      var wordCountTarget = card.querySelector("[data-word-count]");
      var speakingTarget = card.querySelector("[data-speaking-duration]");
      var paceTarget = card.querySelector("[data-pace-indicator]");
      var suggestedSeconds = Number(card.getAttribute("data-suggested-seconds")) || sceneDuration / 1000;
      var words = countWords(voiceover ? voiceover.textContent : "");
      var estimatedSeconds = estimateSpeakingSeconds(words);
      var pace = getPacingLabel(estimatedSeconds, suggestedSeconds);

      totalWords += words;
      totalSpeakingSeconds += estimatedSeconds;
      totalSuggestedSeconds += suggestedSeconds;

      if (wordCountTarget) wordCountTarget.textContent = words + " words";
      if (speakingTarget) speakingTarget.textContent = formatSeconds(estimatedSeconds);
      if (paceTarget) {
        paceTarget.textContent = pace.label;
        paceTarget.classList.remove("too-short", "too-long", "good-pace");
        paceTarget.classList.add(pace.className);
      }
    });

    if (totalWordsTarget) totalWordsTarget.textContent = String(totalWords);
    if (totalSpeakingTarget) totalSpeakingTarget.textContent = formatSeconds(totalSpeakingSeconds);
    if (totalDemoDurationTarget) totalDemoDurationTarget.textContent = formatSeconds(totalSuggestedSeconds);

    var currentCard = getCurrentScriptCard();
    if (currentCard && currentPaceTarget) {
      var currentPace = currentCard.querySelector("[data-pace-indicator]");
      currentPaceTarget.textContent = currentPace ? currentPace.textContent : "Good Pace";
    }
  }

  function setNarrationMode(mode) {
    if (!scriptGuide) return;
    scriptGuide.dataset.reviewMode = mode;
    modeButtons.forEach(function (button) {
      var isActive = button.getAttribute("data-mode-option") === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    updateNarrationMetrics();
  }

  function setAudience(audience) {
    if (!scriptGuide) return;
    scriptGuide.dataset.audience = audience;
    audienceButtons.forEach(function (button) {
      var isActive = button.getAttribute("data-audience-option") === audience;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    if (audienceSummary && audienceLabels[audience]) {
      audienceSummary.textContent = audienceLabels[audience];
    }
    scriptCards.forEach(function (card) {
      var nextScript = card.getAttribute("data-voiceover-" + audience);
      var voiceover = card.querySelector("[data-voiceover-display]");
      if (nextScript && voiceover) voiceover.textContent = nextScript;
    });
    updateNarrationMetrics();
  }

  if (copyScriptButton && copyScriptSource) {
    copyScriptButton.addEventListener("click", function () {
      var scriptText = getFullScriptText();
      copyTextToClipboard(scriptText)
        .then(function () {
          if (copyStatus) copyStatus.textContent = "Full script copied.";
        })
        .catch(function () {
          if (copyStatus) copyStatus.textContent = "Copy failed. Select the script text manually.";
        });
    });
  }

  if (copyCurrentScriptButton) {
    copyCurrentScriptButton.addEventListener("click", function () {
      var currentScript = getSceneScriptText(getCurrentScriptCard());
      copyTextToClipboard(currentScript)
        .then(function () {
          if (copyStatus) copyStatus.textContent = "Current scene script copied.";
        })
        .catch(function () {
          if (copyStatus) copyStatus.textContent = "Copy failed. Select the scene text manually.";
        });
    });
  }

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setNarrationMode(button.getAttribute("data-mode-option"));
    });
  });

  audienceButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setAudience(button.getAttribute("data-audience-option"));
    });
  });

  scriptCards.forEach(function (card) {
    var voiceover = card.querySelector("[data-voiceover-display]");
    if (voiceover) {
      voiceover.addEventListener("input", updateNarrationMetrics);
    }
  });

  root.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") nextScene();
    if (event.key === "ArrowLeft") previousScene();
    if (event.key === " ") {
      event.preventDefault();
      setPlayState(!isPlaying);
    }
  });

  activateScene(0);
  setNarrationMode("presentation");
  setAudience("fleet");
  setPlayState(false, "Ready");
  window.requestAnimationFrame(tick);
  } catch (error) {
    var fallbackRoot = document.querySelector("[data-animated-demo]");
    var fallbackMessage = fallbackRoot && fallbackRoot.querySelector("[data-engine-message]");
    if (fallbackMessage) {
      fallbackMessage.hidden = false;
      fallbackMessage.textContent = "The animated demo controls did not initialize. Refresh the page, or use the visible scene content for review.";
    }
    if (window.console && window.console.error) {
      window.console.error("BOF animated demo failed to initialize.", error);
    }
  }
})();
