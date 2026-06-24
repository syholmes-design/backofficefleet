(function () {
  var root = document.querySelector("[data-investor-plan]");
  if (!root) return;

  // Demo-only access gate. This is not true server-side security.
  var INVESTOR_PLAN_PASSCODE = "bof-investor-2026";
  var SESSION_KEY = "bofInvestorPlanAccess";
  var form = document.querySelector("[data-investor-gate-form]");
  var input = document.querySelector("[data-investor-passcode]");
  var error = document.querySelector("[data-investor-gate-error]");
  var printButton = document.querySelector("[data-print-plan]");

  function unlock() {
    document.body.classList.remove("is-gated");
    var main = document.querySelector(".private-plan");
    if (main) main.focus({ preventScroll: true });
  }

  function setError(message) {
    if (error) error.textContent = message;
  }

  try {
    if (window.sessionStorage.getItem(SESSION_KEY) === "granted") {
      unlock();
    }
  } catch (err) {
    setError("Session access could not be checked in this browser.");
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = input ? input.value.trim() : "";
      if (value !== INVESTOR_PLAN_PASSCODE) {
        setError("Incorrect passcode. Please check the private presentation code.");
        if (input) input.focus();
        return;
      }
      try {
        window.sessionStorage.setItem(SESSION_KEY, "granted");
      } catch (err) {
        setError("Access granted for this view, but the browser could not save the session.");
      }
      unlock();
    });
  }

  if (printButton) {
    printButton.addEventListener("click", function () {
      window.print();
    });
  }
})();
