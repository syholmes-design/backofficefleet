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

  const actionButtons = Array.from(document.querySelectorAll("[data-wave1-action]"));

  if (!actionButtons.length) {
    return;
  }

  const drawer = document.createElement("div");
  drawer.className = "wave1-action-drawer";
  drawer.setAttribute("aria-hidden", "true");
  drawer.innerHTML = `
    <section class="wave1-action-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="wave1-action-title">
      <div class="wave1-action-drawer__head">
        <div>
          <p class="wave1-action-drawer__eyebrow">Illustrative workflow</p>
          <h2 class="wave1-action-drawer__title" id="wave1-action-title"></h2>
        </div>
        <button class="wave1-action-drawer__close" type="button" aria-label="Close action details">&times;</button>
      </div>
      <div class="wave1-action-drawer__body">
        <p data-wave1-action-body></p>
        <div class="wave1-action-drawer__meta" data-wave1-action-meta></div>
        <div class="wave1-action-drawer__actions" data-wave1-action-links></div>
      </div>
    </section>
  `;
  document.body.appendChild(drawer);

  const panel = drawer.querySelector(".wave1-action-drawer__panel");
  const title = drawer.querySelector("#wave1-action-title");
  const body = drawer.querySelector("[data-wave1-action-body]");
  const meta = drawer.querySelector("[data-wave1-action-meta]");
  const links = drawer.querySelector("[data-wave1-action-links]");
  const closeButton = drawer.querySelector(".wave1-action-drawer__close");
  let activeTrigger = null;

  function closeDrawer() {
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (activeTrigger) {
      activeTrigger.focus();
      activeTrigger = null;
    }
  }

  function openDrawer(trigger) {
    activeTrigger = trigger;
    title.textContent = trigger.dataset.actionTitle || trigger.textContent.trim();
    body.textContent = trigger.dataset.actionBody || "This demo action opens the record context without creating a persistent write.";
    meta.innerHTML = "";
    links.innerHTML = "";

    (trigger.dataset.actionMeta || "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        const row = document.createElement("div");
        row.textContent = item;
        meta.appendChild(row);
      });

    if (trigger.dataset.actionHref && trigger.dataset.actionLabel) {
      const link = document.createElement("a");
      link.className = "bof-ds2-button bof-ds2-button--primary";
      link.href = trigger.dataset.actionHref;
      link.textContent = trigger.dataset.actionLabel;
      links.appendChild(link);
    }

    const close = document.createElement("button");
    close.className = "wave1-action-button";
    close.type = "button";
    close.textContent = "Close";
    close.addEventListener("click", closeDrawer);
    links.appendChild(close);

    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => openDrawer(button));
  });

  closeButton.addEventListener("click", closeDrawer);

  drawer.addEventListener("click", (event) => {
    if (!panel.contains(event.target)) {
      closeDrawer();
    }
  });

  drawer.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || drawer.getAttribute("aria-hidden") === "true") {
      return;
    }

    const focusable = Array.from(
      drawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((element) => element.offsetParent !== null);

    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.getAttribute("aria-hidden") === "false") {
      closeDrawer();
    }
  });
})();
