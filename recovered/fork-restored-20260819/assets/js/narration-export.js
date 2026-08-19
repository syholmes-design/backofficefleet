(function () {
  var root = document.querySelector("[data-narration-export]");
  if (!root) return;

  var copyStatus = root.querySelector("[data-copy-status]");

  function countWords(text) {
    var words = (text || "").trim().match(/\b[\w'-]+\b/g);
    return words ? words.length : 0;
  }

  function formatSeconds(seconds) {
    if (seconds < 60) return seconds + " sec";
    var minutes = Math.floor(seconds / 60);
    var remaining = seconds % 60;
    return minutes + ":" + String(remaining).padStart(2, "0");
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "readonly");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();

      try {
        var success = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (success) resolve();
        else reject(new Error("Copy command unavailable."));
      } catch (error) {
        document.body.removeChild(textarea);
        reject(error);
      }
    });
  }

  function setStatus(message) {
    if (copyStatus) copyStatus.textContent = message;
  }

  function sceneText(card) {
    var number = card.getAttribute("data-scene-number");
    var title = card.querySelector("h3") ? card.querySelector("h3").textContent.trim() : "Scene " + number;
    var script = card.querySelector("[data-voiceover-script]") ? card.querySelector("[data-voiceover-script]").textContent.trim() : "";
    var pace = card.querySelector("[data-speaking-pace]") ? card.querySelector("[data-speaking-pace]").textContent.trim() : "Measured, clear, practical.";
    var duration = card.querySelector("[data-estimated-duration]") ? card.querySelector("[data-estimated-duration]").textContent.trim() : "";
    var wordCount = card.querySelector("[data-word-count]") ? card.querySelector("[data-word-count]").textContent.trim() : countWords(script) + " words";
    var transition = card.querySelector("[data-transition-notes]") ? card.querySelector("[data-transition-notes]").textContent.trim() : "";
    var filename = card.querySelector("[data-audio-filename]") ? card.querySelector("[data-audio-filename]").textContent.trim() : "";
    var sync = card.querySelector("[data-sync-metadata]") ? card.querySelector("[data-sync-metadata]").textContent.trim() : "";

    return [
      "Scene " + number + ": " + title.replace(/^Scene\s+\d+:\s*/i, ""),
      "Suggested filename: " + filename,
      "Suggested speaking pace: " + pace,
      "Estimated duration: " + duration,
      "Word count: " + wordCount,
      "Transition notes: " + transition,
      "Timing metadata: " + sync,
      "",
      script
    ].join("\n");
  }

  function trackText(trackKey) {
    var track = root.querySelector("[data-track='" + trackKey + "']");
    if (!track) return "";
    var title = track.querySelector("h2") ? track.querySelector("h2").textContent.trim() : "BOF Narration Track";
    var meta = track.querySelector("[data-track-summary]") ? track.querySelector("[data-track-summary]").textContent.trim() : "";
    var scenes = Array.prototype.slice.call(track.querySelectorAll("[data-scene-card]"));

    return [
      title,
      meta,
      "",
      scenes.map(sceneText).join("\n\n---\n\n")
    ].join("\n");
  }

  function allText() {
    return [trackText("a"), trackText("b")].join("\n\n==============================\n\n");
  }

  function downloadText(filename, text) {
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function updateMetrics() {
    Array.prototype.slice.call(root.querySelectorAll("[data-scene-card]")).forEach(function (card) {
      var script = card.querySelector("[data-voiceover-script]");
      var wordTarget = card.querySelector("[data-word-count]");
      var durationTarget = card.querySelector("[data-estimated-duration]");
      var words = countWords(script ? script.textContent : "");
      var seconds = Math.round((words / 150) * 60);
      if (wordTarget) wordTarget.textContent = words + " words";
      if (durationTarget) durationTarget.textContent = formatSeconds(seconds);
    });
  }

  Array.prototype.slice.call(root.querySelectorAll("[data-copy-track]")).forEach(function (button) {
    button.addEventListener("click", function () {
      var track = button.getAttribute("data-copy-track");
      copyText(trackText(track))
        .then(function () { setStatus("Track " + track.toUpperCase() + " copied."); })
        .catch(function () { setStatus("Copy failed. Select the text block manually."); });
    });
  });

  Array.prototype.slice.call(root.querySelectorAll("[data-copy-scene]")).forEach(function (button) {
    button.addEventListener("click", function () {
      var card = button.closest("[data-scene-card]");
      copyText(sceneText(card))
        .then(function () { setStatus("Current scene copied."); })
        .catch(function () { setStatus("Copy failed. Select the scene text manually."); });
    });
  });

  Array.prototype.slice.call(root.querySelectorAll("[data-download-track]")).forEach(function (button) {
    button.addEventListener("click", function () {
      var track = button.getAttribute("data-download-track");
      var filename = track === "a" ? "bof-track-a-operations-lifecycle-narration.txt" : "bof-track-b-business-operations-narration.txt";
      downloadText(filename, trackText(track));
      setStatus("Plain-text export prepared.");
    });
  });

  var copyAllButton = root.querySelector("[data-copy-all]");
  if (copyAllButton) {
    copyAllButton.addEventListener("click", function () {
      copyText(allText())
        .then(function () { setStatus("Full narration package copied."); })
        .catch(function () { setStatus("Copy failed. Select the text blocks manually."); });
    });
  }

  var downloadAllButton = root.querySelector("[data-download-all]");
  if (downloadAllButton) {
    downloadAllButton.addEventListener("click", function () {
      downloadText("bof-narration-export-package.txt", allText());
      setStatus("Full plain-text package prepared.");
    });
  }

  updateMetrics();
})();
