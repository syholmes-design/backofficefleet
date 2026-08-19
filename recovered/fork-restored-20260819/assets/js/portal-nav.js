(() => {
  "use strict";

  const rails = Array.from(document.querySelectorAll(".customer-portal-shell .portal-rail"));
  if (!rails.length) return;
  document.documentElement.classList.add("portal-nav-ready");

  const close = (rail) => {
    rail.classList.remove("is-menu-open");
    const button = rail.querySelector(".portal-nav-toggle");
    if (button) button.setAttribute("aria-expanded", "false");
  };

  rails.forEach((rail) => {
    const button = rail.querySelector(".portal-nav-toggle");
    const nav = rail.querySelector(".portal-nav");
    if (!button || !nav) return;

    button.addEventListener("click", () => {
      const opening = !rail.classList.contains("is-menu-open");
      rails.forEach(close);
      if (opening) {
        rail.classList.add("is-menu-open");
        button.setAttribute("aria-expanded", "true");
      }
    });

    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => close(rail)));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    rails.forEach((rail) => {
      const wasOpen = rail.classList.contains("is-menu-open");
      close(rail);
      if (wasOpen) rail.querySelector(".portal-nav-toggle")?.focus();
    });
  });

  document.addEventListener("click", (event) => rails.forEach((rail) => {
    if (!rail.contains(event.target)) close(rail);
  }));
})();
