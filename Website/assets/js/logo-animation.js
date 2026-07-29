(function () {
  "use strict";

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isHomeRoute() {
    var path = window.location.pathname || "/";
    return path === "/" || path === "/index.html";
  }

  function isCustomerDemoRoute() {
    var path = window.location.pathname || "";
    return path === "/customer-demo/" || path === "/customer-demo/index.html";
  }

  function truckSvg(className, begin, duration, path) {
    return [
      '<g class="bof-logo-motion__truck ' + className + '">',
      '  <path d="M-36 -11h39l11 12h13c5 0 9 4 9 9v12h-12a16 16 0 0 0-31 0h-23a16 16 0 0 0-31 0h-10V1c0-7 5-12 12-12h23z" fill="currentColor"/>',
      '  <path d="M4 -5h10l8 9H4z" fill="#dcecff" opacity=".9"/>',
      '  <circle cx="-48" cy="25" r="8" fill="#06183a" stroke="#dcecff" stroke-width="3"/>',
      '  <circle cx="9" cy="25" r="8" fill="#06183a" stroke="#dcecff" stroke-width="3"/>',
      '  <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.08;.18;.78;1" dur="' + duration + 's" begin="' + begin + 's" fill="freeze"/>',
      '  <animateMotion dur="' + duration + 's" begin="' + begin + 's" fill="freeze" rotate="auto" path="' + path + '"/>',
      '</g>'
    ].join("");
  }

  function motionOverlayHtml() {
    var leftPath = "M34 220 C72 96 166 31 278 9";
    var centerPath = "M124 222 C149 114 204 45 296 8";
    var rightPath = "M236 220 C246 151 268 76 307 12";

    return [
      '<svg class="bof-logo-motion__overlay" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 150" aria-hidden="true" focusable="false">',
      '  <g transform="translate(16 18) scale(.36)">',
      '    <path class="bof-logo-motion__route-glow" d="' + leftPath + '" fill="none" stroke="#22c7b8" stroke-width="12" stroke-linecap="round"/>',
      '    <path class="bof-logo-motion__route-glow" d="' + centerPath + '" fill="none" stroke="#dcecff" stroke-width="10" stroke-linecap="round"/>',
      '    <path class="bof-logo-motion__route-glow" d="' + rightPath + '" fill="none" stroke="#b77412" stroke-width="10" stroke-linecap="round"/>',
      truckSvg("bof-logo-motion__truck--navy", 0.18, 3.2, leftPath),
      truckSvg("bof-logo-motion__truck--teal", 0.82, 3.15, centerPath),
      truckSvg("bof-logo-motion__truck--gold", 1.46, 3.1, rightPath),
      '  </g>',
      '</svg>'
    ].join("");
  }

  function enhanceLogo(container) {
    var image;
    var wrapper;

    if (!container || reducedMotion) return;
    image = container.querySelector('img[src*="header-lockup"][src$=".svg"]');
    if (!image || image.closest(".bof-logo-motion")) return;

    wrapper = document.createElement("span");
    wrapper.className = "bof-logo-motion";
    wrapper.setAttribute("data-logo-animation", "truck-road-sequence");
    image.parentNode.insertBefore(wrapper, image);
    wrapper.appendChild(image);
    wrapper.insertAdjacentHTML("beforeend", motionOverlayHtml());

    window.requestAnimationFrame(function () {
      wrapper.classList.add("is-logo-motion-playing");
    });

    window.setTimeout(function () {
      wrapper.classList.remove("is-logo-motion-playing");
      wrapper.classList.add("is-logo-motion-settled");
    }, 6200);
  }

  function init() {
    if (isHomeRoute()) enhanceLogo(document.querySelector(".site-header .brand"));
    if (isCustomerDemoRoute()) enhanceLogo(document.querySelector(".portal-sidebar-brand"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
