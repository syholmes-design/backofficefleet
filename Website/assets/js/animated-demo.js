(function () {
  var root = document.querySelector("[data-animated-demo]");
  if (!root) return;

  var scenes = Array.prototype.slice.call(root.querySelectorAll("[data-scene]"));
  var sceneDuration = 10000;
  var activeIndex = 0;
  var isPlaying = true;
  var sceneStartedAt = window.performance.now();
  var pausedAt = 0;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var progressLabel = root.querySelector("[data-scene-progress]");
  var progressFill = root.querySelector("[data-progress-fill]");
  var playStatus = root.querySelector("[data-play-status]");
  var startButtons = Array.prototype.slice.call(root.querySelectorAll("[data-demo-action='start']"));
  var pauseButtons = Array.prototype.slice.call(root.querySelectorAll("[data-demo-action='pause']"));
  var resumeButtons = Array.prototype.slice.call(root.querySelectorAll("[data-demo-action='resume']"));
  var restartButtons = Array.prototype.slice.call(root.querySelectorAll("[data-demo-action='restart']"));
  var previousButtons = Array.prototype.slice.call(root.querySelectorAll("[data-demo-action='previous']"));
  var nextButtons = Array.prototype.slice.call(root.querySelectorAll("[data-demo-action='next']"));

  function setPlayState(nextPlaying) {
    isPlaying = nextPlaying;
    root.dataset.playState = isPlaying ? "playing" : "paused";
    if (playStatus) playStatus.textContent = isPlaying ? "Auto-running" : "Paused";
    pauseButtons.forEach(function (button) {
      button.disabled = !isPlaying;
    });
    resumeButtons.forEach(function (button) {
      button.disabled = isPlaying;
    });

    if (isPlaying) {
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

    root.style.setProperty("--active-scene", String(activeIndex + 1));
    animateCounters(scenes[activeIndex]);
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

  startButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activateScene(0);
      setPlayState(true);
    });
  });

  pauseButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setPlayState(false);
    });
  });

  resumeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setPlayState(true);
    });
  });

  restartButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activateScene(0);
      setPlayState(true);
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

  root.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") nextScene();
    if (event.key === "ArrowLeft") previousScene();
    if (event.key === " ") {
      event.preventDefault();
      setPlayState(!isPlaying);
    }
  });

  activateScene(0);
  setPlayState(true);
  window.requestAnimationFrame(tick);
})();
