(function () {
  const header = document.querySelector(".bof-ds2-header");
  const menuButton = document.querySelector("[data-bof-ds2-menu]");

  if (!header || !menuButton) {
    return;
  }

  menuButton.addEventListener("click", () => {
    const isOpen = header.getAttribute("data-menu-open") === "true";
    header.setAttribute("data-menu-open", String(!isOpen));
    menuButton.setAttribute("aria-expanded", String(!isOpen));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.getAttribute("data-menu-open") === "true") {
      header.setAttribute("data-menu-open", "false");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.focus();
    }
  });
})();
