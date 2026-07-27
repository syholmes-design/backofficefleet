(function () {
  const header = document.querySelector(".bof-ds2-header");
  const menuButton = document.querySelector("[data-bof-ds2-menu]");

  if (!header || !menuButton) {
    return;
  }

  function setMenuOpen(isOpen) {
    header.setAttribute("data-menu-open", String(isOpen));
    menuButton.setAttribute("aria-expanded", String(isOpen));
  }

  function toggleMenu() {
    const isOpen = header.getAttribute("data-menu-open") === "true";
    setMenuOpen(!isOpen);
  }

  menuButton.addEventListener("click", toggleMenu);

  menuButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.getAttribute("data-menu-open") === "true") {
      setMenuOpen(false);
      menuButton.focus();
    }
  });
})();
