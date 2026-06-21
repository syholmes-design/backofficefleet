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
  var audioUnlockButtons = Array.prototype.slice.call(root.querySelectorAll("[data-audio-unlock]"));
  var audioToggleButtons = Array.prototype.slice.call(root.querySelectorAll("[data-audio-toggle]"));
  var audioReplayButtons = Array.prototype.slice.call(root.querySelectorAll("[data-audio-replay]"));
  var audioStopButtons = Array.prototype.slice.call(root.querySelectorAll("[data-audio-stop]"));
  var audioVolumeControls = Array.prototype.slice.call(root.querySelectorAll("[data-audio-volume]"));
  var audioStatus = root.querySelector("[data-audio-status]");
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
  var audienceLabelSource = root.querySelector("[data-audience-labels]");
  var wordsPerMinute = 150;
  var narrationAudio = new Audio();
  var narrationEnabled = false;
  var narrationUserActivated = false;
  var audioUnlocked = false;
  var directPlaybackAttempted = false;
  var currentAudioSrc = "";
  var audioRequestToken = 0;
  var audioTimingMode = "timed";
  var audioEndedAt = 0;
  var audioAdvanceDelay = 1200;
  var scenePlaybackToken = 0;
  var activeAudioSceneToken = 0;
  var pendingAdvanceTimer = 0;
  narrationAudio.preload = "none";

  if (audienceLabelSource) {
    try {
      var pageAudienceLabels = JSON.parse(audienceLabelSource.textContent || "{}");
      Object.keys(pageAudienceLabels).forEach(function (key) {
        audienceLabels[key] = pageAudienceLabels[key];
      });
    } catch (error) {
      if (window.console && window.console.warn) {
        window.console.warn("BOF animated demo audience labels could not be parsed.", error);
      }
    }
  }

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

  function setAudioStatus(message, state) {
    if (!audioStatus) return;
    audioStatus.textContent = message;
    if (state) audioStatus.setAttribute("data-audio-state", state);
  }

  function logAudioDebug(eventName, details) {
    if (!window.console || !window.console.info) return;
    var scene = scenes[activeIndex];
    var debugDetails = {
      sceneNumber: activeIndex + 1,
      audioSrc: scene ? scene.getAttribute("data-audio-src") : "",
      event: eventName
    };
    Object.keys(details || {}).forEach(function (key) {
      debugDetails[key] = details[key];
    });
    window.console.info("BOF animated demo audio " + JSON.stringify(debugDetails));
  }

  function clearPendingAdvance(reason) {
    if (!pendingAdvanceTimer) return;
    window.clearTimeout(pendingAdvanceTimer);
    pendingAdvanceTimer = 0;
    logAudioDebug("advance-timer-cleared", {
      reason: reason || "unspecified",
      timingMode: audioTimingMode
    });
  }

  function getAudioDurationSeconds() {
    return Number.isFinite(narrationAudio.duration) && narrationAudio.duration > 0 ? Math.round(narrationAudio.duration * 10) / 10 : null;
  }

  function resetSceneAdvanceState(reason) {
    scenePlaybackToken += 1;
    activeAudioSceneToken = 0;
    audioEndedAt = 0;
    clearPendingAdvance(reason || "scene-reset");
    audioTimingMode = "timed";
    logAudioDebug("scene-timing-reset", {
      reason: reason || "scene-reset",
      timingMode: audioTimingMode,
      sceneToken: scenePlaybackToken
    });
  }

  function scheduleAudioEndedAdvance(sceneToken) {
    clearPendingAdvance("audio-ended-reschedule");
    audioTimingMode = "audio-ended";
    audioEndedAt = window.performance.now();
    if (progressFill) progressFill.style.width = "100%";
    logAudioDebug("audio-ended", {
      nextAction: "advance-after-delay",
      timingMode: audioTimingMode,
      audioDuration: getAudioDurationSeconds(),
      sceneToken: sceneToken
    });
    setAudioStatus("Advancing after narration", "unlocked");
    if (playStatus) playStatus.textContent = "Advancing after narration";

    pendingAdvanceTimer = window.setTimeout(function () {
      pendingAdvanceTimer = 0;
      if (!isPlaying || sceneToken !== scenePlaybackToken || audioTimingMode !== "audio-ended") {
        logAudioDebug("advance-ignored", {
          reason: "stale-or-paused",
          timingMode: audioTimingMode,
          sceneToken: sceneToken,
          currentToken: scenePlaybackToken
        });
        return;
      }

      logAudioDebug("advance-fired", {
        timingMode: "audio-driven",
        sceneToken: sceneToken
      });
      audioTimingMode = "timed";
      nextScene("audio-ended");
    }, audioAdvanceDelay);

    logAudioDebug("next-scene-scheduled", {
      timingMode: "audio-driven",
      delayMs: audioAdvanceDelay,
      sceneToken: sceneToken
    });
  }

  function getAudioStatusState(message) {
    if (message === "Narration off") return "off";
    if (message === "Click Enable Audio before starting narration.") return "locked";
    if (message === "Narration audio unlocked. Click Start Demo.") return "unlocked";
    if (message === "Audio file missing") return "missing";
    if (message === "Browser blocked playback. Click Replay Current Scene or use Chrome/Edge.") return "blocked";
    if (message === "Browser blocked playback. Narration unavailable, using timed playback.") return "blocked";
    if (message === "Narration unavailable, using timed playback") return "blocked";
    if (message === "Advancing after narration") return "unlocked";
    if (message === "Narration paused") return "paused";
    if (message === "Narration stopped") return "stopped";
    return "ready";
  }

  function useTimedPlayback(statusMessage, state) {
    clearPendingAdvance("fixed-timer-mode");
    activeAudioSceneToken = 0;
    audioTimingMode = "timed";
    audioEndedAt = 0;
    resetTimer();
    logAudioDebug("timing-mode", {
      timingMode: "fixed-timer",
      sceneDurationMs: sceneDuration,
      sceneToken: scenePlaybackToken
    });
    if (statusMessage) {
      setAudioStatus(statusMessage, state || getAudioStatusState(statusMessage));
    }
    if (isPlaying && playStatus) {
      playStatus.textContent = "Auto-running";
    }
  }

  function useAudioPlayback(sceneToken) {
    clearPendingAdvance("audio-playback-started");
    activeAudioSceneToken = sceneToken;
    audioTimingMode = "audio";
    audioEndedAt = 0;
    logAudioDebug("timing-mode", {
      timingMode: "audio-driven",
      audioDuration: getAudioDurationSeconds(),
      sceneToken: sceneToken
    });
    if (playStatus) playStatus.textContent = "Waiting for narration to finish";
  }

  function classifyAudioFailure(error) {
    var errorName = error && error.name ? error.name : "";
    if (errorName === "NotAllowedError") return "blocked";
    if (errorName === "AbortError") return "interrupted";
    if (narrationAudio.error) return "missing";
    return "blocked";
  }

  function reportPlaybackFailure(error) {
    var failureType = classifyAudioFailure(error);
    logAudioDebug("playback-failed", {
      failureType: failureType,
      errorName: error && error.name ? error.name : "unknown"
    });
    if (failureType === "missing") {
      useTimedPlayback("Audio file missing", "missing");
      return;
    }
    if (failureType === "interrupted") {
      setAudioStatus("Narration stopped", "stopped");
      return;
    }
    useTimedPlayback("Browser blocked playback. Narration unavailable, using timed playback.", "blocked");
  }

  function checkAudioFileAvailable(src) {
    if (!window.fetch) {
      return Promise.resolve({ available: true, status: "unchecked" });
    }
    return window.fetch(src, {
      method: "HEAD",
      cache: "no-store"
    }).then(function (response) {
      return {
        available: response.ok,
        status: response.status
      };
    }).catch(function () {
      return {
        available: true,
        status: "unverified"
      };
    });
  }

  function setAudioElementVolumeFromControls() {
    var control = audioVolumeControls[0];
    var volume = control ? Number(control.value) : 80;
    if (Number.isNaN(volume)) volume = 80;
    narrationAudio.volume = Math.max(0, Math.min(volume / 100, 1));
  }

  function updateAudioControls() {
    audioToggleButtons.forEach(function (button) {
      button.textContent = narrationEnabled ? "Narration Off" : "Narration On";
      button.setAttribute("aria-pressed", String(narrationEnabled));
    });
    if (!narrationEnabled) setAudioStatus("Narration off", "off");
  }

  function getCurrentAudioSrc() {
    var activeScene = scenes[activeIndex];
    return activeScene ? activeScene.getAttribute("data-audio-src") : "";
  }

  function stopNarrationAudio(nextStatus) {
    audioRequestToken += 1;
    clearPendingAdvance("stop-narration");
    narrationAudio.pause();
    try {
      narrationAudio.currentTime = 0;
    } catch (error) {
      // Some browsers prevent currentTime changes before metadata loads.
    }
    currentAudioSrc = "";
    activeAudioSceneToken = 0;
    audioTimingMode = "timed";
    audioEndedAt = 0;
    if (nextStatus) setAudioStatus(nextStatus, getAudioStatusState(nextStatus));
  }

  function pauseNarrationAudio() {
    if (!narrationEnabled) return;
    clearPendingAdvance("pause");
    if (!narrationAudio.paused) narrationAudio.pause();
    setAudioStatus("Narration paused", "paused");
  }

  function playSceneAudio(options) {
    options = options || {};
    if (!narrationEnabled) {
      setAudioStatus("Narration off", "off");
      return;
    }
    if (!narrationUserActivated) {
      setAudioStatus("Narration ready", "ready");
      return;
    }
    if (!audioUnlocked && !directPlaybackAttempted && !options.unlockAttempt && !options.directStart) {
      setAudioStatus("Click Enable Audio before starting narration.", "locked");
      logAudioDebug("audio-locked");
      return;
    }

    var nextSrc = getCurrentAudioSrc();
    if (!nextSrc) {
      useTimedPlayback("Audio file missing", "missing");
      logAudioDebug("missing-src");
      return;
    }

    var requestToken = ++audioRequestToken;
    var playbackSceneToken = scenePlaybackToken;
    var playbackSceneIndex = activeIndex;
    if (options.directStart) directPlaybackAttempted = true;
    var shouldRestart = options.restart !== false || currentAudioSrc !== nextSrc || narrationAudio.ended;
    if (shouldRestart) {
      narrationAudio.pause();
      currentAudioSrc = nextSrc;
      narrationAudio.src = nextSrc;
      setAudioElementVolumeFromControls();
      narrationAudio.load();
      try {
        narrationAudio.currentTime = 0;
      } catch (error) {
        // Metadata may not be loaded yet.
      }
    }

    logAudioDebug("play-requested", {
      restart: shouldRestart,
      directStart: Boolean(options.directStart),
      timingMode: "audio-requested",
      sceneToken: playbackSceneToken
    });
    setAudioStatus(options.directStart ? "Narration ready" : "Click Start Demo to begin narration.", "ready");
    var playAttempt = narrationAudio.play();
    if (playAttempt && typeof playAttempt.then === "function") {
      playAttempt
        .then(function () {
          if (requestToken !== audioRequestToken || playbackSceneToken !== scenePlaybackToken || playbackSceneIndex !== activeIndex) {
            logAudioDebug("playback-start-ignored", {
              reason: "stale-scene",
              requestToken: requestToken,
              sceneToken: playbackSceneToken,
              currentToken: scenePlaybackToken
            });
            return;
          }
          logAudioDebug("playback-started", {
            loadResult: "ok",
            audioDuration: getAudioDurationSeconds()
          });
          useAudioPlayback(playbackSceneToken);
          setAudioStatus("Playing narration", "playing");
        })
        .catch(function (error) {
          if (requestToken !== audioRequestToken) return;
          reportPlaybackFailure(error);
        });
    } else {
      logAudioDebug("playback-started", {
        loadResult: "ok",
        audioDuration: getAudioDurationSeconds()
      });
      useAudioPlayback(playbackSceneToken);
      setAudioStatus("Playing narration", "playing");
    }
  }

  function resumeNarrationAudio() {
    if (!narrationEnabled) {
      setAudioStatus("Narration off", "off");
      return;
    }
    if (!currentAudioSrc || narrationAudio.ended) {
      if (audioTimingMode === "audio-ended") {
        scheduleAudioEndedAdvance(scenePlaybackToken);
        return;
      }
      playSceneAudio();
      return;
    }
    playSceneAudio({ restart: false });
  }

  function unlockNarrationAudio() {
    narrationUserActivated = true;
    var nextSrc = getCurrentAudioSrc();
    if (!nextSrc) {
      stopNarrationAudio("Audio file missing");
      logAudioDebug("unlock-missing-src");
      return;
    }

    var requestToken = ++audioRequestToken;
    logAudioDebug("unlock-requested");
    setAudioStatus("Audio locked", "locked");
    checkAudioFileAvailable(nextSrc).then(function (result) {
      if (requestToken !== audioRequestToken) return;
      logAudioDebug("audio-load-check", {
        loadResult: result.available ? "ok" : "missing",
        status: result.status
      });
      if (!result.available) {
        stopNarrationAudio("Audio file missing");
        return;
      }

      var priorMuted = narrationAudio.muted;
      var priorVolume = narrationAudio.volume;
      currentAudioSrc = nextSrc;
      narrationAudio.src = nextSrc;
      narrationAudio.muted = true;
      narrationAudio.volume = 0;
      narrationAudio.load();

      try {
        narrationAudio.currentTime = 0;
      } catch (error) {
        // Metadata may not be loaded yet.
      }

      var unlockAttempt = narrationAudio.play();
      if (unlockAttempt && typeof unlockAttempt.then === "function") {
        unlockAttempt
          .then(function () {
            if (requestToken !== audioRequestToken) return;
            narrationAudio.pause();
            try {
              narrationAudio.currentTime = 0;
            } catch (error) {
              // Metadata may not be loaded yet.
            }
            narrationAudio.muted = priorMuted;
            narrationAudio.volume = priorVolume || 0.8;
            setAudioElementVolumeFromControls();
            audioUnlocked = true;
            logAudioDebug("unlock-succeeded", {
              loadResult: "ok"
            });
            setAudioStatus("Narration audio unlocked. Click Start Demo.", "unlocked");
          })
          .catch(function (error) {
            if (requestToken !== audioRequestToken) return;
            narrationAudio.muted = priorMuted;
            narrationAudio.volume = priorVolume || 0.8;
            reportPlaybackFailure(error);
          });
      } else {
        narrationAudio.pause();
        narrationAudio.muted = priorMuted;
        narrationAudio.volume = priorVolume || 0.8;
        setAudioElementVolumeFromControls();
        audioUnlocked = true;
        logAudioDebug("unlock-succeeded", {
          loadResult: "ok"
        });
        setAudioStatus("Narration audio unlocked. Click Start Demo.", "unlocked");
      }
    });
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

  function activateScene(index, reason) {
    activeIndex = (index + scenes.length) % scenes.length;
    resetSceneAdvanceState(reason || "activate-scene");
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

  function goToScene(index, reason) {
    stopNarrationAudio();
    activateScene(index, reason || "go-to-scene");
  }

  function nextScene(reason) {
    goToScene(activeIndex + 1, reason || "next-scene");
    playSceneAudio();
  }

  function previousScene(reason) {
    goToScene(activeIndex - 1, reason || "previous-scene");
    playSceneAudio();
  }

  function tick(now) {
    if (isPlaying) {
      if (audioTimingMode === "audio") {
        var duration = Number.isFinite(narrationAudio.duration) && narrationAudio.duration > 0 ? narrationAudio.duration : 0;
        var audioRatio = duration ? Math.min(narrationAudio.currentTime / duration, 1) : 0;
        if (progressFill) progressFill.style.width = Math.round(audioRatio * 100) + "%";
      } else if (audioTimingMode === "audio-ended") {
        if (progressFill) progressFill.style.width = "100%";
      } else {
        var elapsed = now - sceneStartedAt;
        var ratio = Math.min(elapsed / sceneDuration, 1);
        if (progressFill) progressFill.style.width = Math.round(ratio * 100) + "%";
        if (elapsed >= sceneDuration) nextScene();
      }
    }
    window.requestAnimationFrame(tick);
  }

  buildSceneRail();

  startButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      narrationUserActivated = true;
      activateScene(0, "start-demo");
      setPlayState(true);
      playSceneAudio({ directStart: true });
      bringStageIntoView();
    });
  });

  pauseButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setPlayState(false, "Paused");
      pauseNarrationAudio();
    });
  });

  resumeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      narrationUserActivated = true;
      setPlayState(true);
      resumeNarrationAudio();
      bringStageIntoView();
    });
  });

  restartButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      narrationUserActivated = true;
      stopNarrationAudio(narrationEnabled ? "Narration ready" : "Narration off");
      activateScene(0, "restart-demo");
      setPlayState(false, "Ready");
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
        goToScene(index, "scene-jump");
        playSceneAudio();
        bringStageIntoView();
      }
    });
  });

  audioUnlockButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      unlockNarrationAudio();
    });
  });

  audioToggleButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      narrationUserActivated = true;
      narrationEnabled = !narrationEnabled;
      if (narrationEnabled) {
        setAudioStatus("Narration ready", "ready");
        if (isPlaying) playSceneAudio();
      } else {
        stopNarrationAudio("Narration off");
      }
      updateAudioControls();
    });
  });

  audioReplayButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      narrationUserActivated = true;
      playSceneAudio({ restart: true });
    });
  });

  audioStopButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      narrationUserActivated = true;
      stopNarrationAudio(narrationEnabled ? "Narration stopped" : "Narration off");
    });
  });

  audioVolumeControls.forEach(function (control) {
    setAudioElementVolumeFromControls();
    control.addEventListener("input", function () {
      setAudioElementVolumeFromControls();
    });
  });

  narrationAudio.addEventListener("error", function () {
    if (narrationEnabled) {
      logAudioDebug("media-error", {
        loadResult: "error"
      });
      useTimedPlayback("Audio file missing", "missing");
    }
  });

  narrationAudio.addEventListener("ended", function () {
    var endedToken = activeAudioSceneToken;
    if (narrationEnabled && audioTimingMode === "audio" && endedToken === scenePlaybackToken) {
      scheduleAudioEndedAdvance(endedToken);
      return;
    }

    logAudioDebug("audio-ended-ignored", {
      reason: "stale-or-not-audio-driven",
      timingMode: audioTimingMode,
      sceneToken: endedToken,
      currentToken: scenePlaybackToken
    });

    if (narrationEnabled) {
      setAudioStatus("Narration ready", "ready");
    }
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
      if (isPlaying) {
        setPlayState(false, "Paused");
        pauseNarrationAudio();
      } else {
        narrationUserActivated = true;
        setPlayState(true);
        resumeNarrationAudio();
      }
    }
  });

  activateScene(0);
  setNarrationMode("presentation");
  setAudience("fleet");
  setPlayState(false, "Ready");
  updateAudioControls();
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
