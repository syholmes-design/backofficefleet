(function () {
  var root = document.querySelector("[data-investor-plan]");
  if (!root) return;

  var printButton = document.querySelector("[data-print-plan]");

  if (printButton) {
    printButton.addEventListener("click", function () {
      window.print();
    });
  }
})();
