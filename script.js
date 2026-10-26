/* The portfolio and project links remain usable without JavaScript. */
(() => {
  "use strict";
  document.documentElement.classList.add("js");
  if (document.documentElement.classList.contains("intro-active")) {
    document
      .querySelectorAll(".skip-link, .site-header, main, .site-footer")
      .forEach((element) => {
        if (!element.inert) {
          element.inert = true;
          element.setAttribute("data-intro-inert", "");
        }
      });
  }
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");
  menu.hidden = false;
  function closeMenu(restoreFocus = false) {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
    menu.innerHTML = 'Menu <span aria-hidden="true">+</span>';
    if (restoreFocus) menu.focus();
  }
  menu.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
    menu.innerHTML = `${open ? "Close" : "Menu"} <span aria-hidden="true">${open ? "−" : "+"}</span>`;
  });
  nav
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", () => closeMenu()));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".navigation")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open"))
      closeMenu(true);
  });
  window
    .matchMedia("(min-width: 801px)")
    .addEventListener("change", () => closeMenu());
  const themeButton = document.querySelector("#theme-toggle");
  themeButton.hidden = false;
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === "dark";
    themeButton.setAttribute("aria-pressed", String(dark));
    themeButton.setAttribute(
      "aria-label",
      `Switch to ${dark ? "light" : "dark"} theme`,
    );
    document.querySelector('meta[name="theme-color"]').content = dark
      ? "#080808"
      : "#ffffff";
  }
  let savedTheme;
  try {
    savedTheme = localStorage.getItem("theme");
  } catch (_) {
    /* Storage may be unavailable. */
  }
  applyTheme(savedTheme === "dark" ? "dark" : "light");
  themeButton.addEventListener("click", () => {
    const theme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    try {
      localStorage.setItem("theme", theme);
    } catch (_) {
      /* Current selection still works. */
    }
  });
  document.querySelector("#year").textContent = new Date().getFullYear();
  initCursorFollower();
  initScrollProgress();

  function initScrollProgress() {
    const bar = document.querySelector(".scroll-progress");
    if (!bar) return;
    let frame = 0;
    function update() {
      frame = 0;
      const page = document.scrollingElement || document.documentElement;
      const distance = page.scrollHeight - page.clientHeight;
      const progress = distance > 0
        ? Math.min(1, Math.max(0, page.scrollTop / distance))
        : 0;
      bar.style.width = `${progress * 100}%`;
    }
    function scheduleUpdate() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("pageshow", scheduleUpdate);
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(scheduleUpdate);
      observer.observe(document.body);
    }
    update();
  }

  function initCursorFollower() {
    const cursor = document.querySelector(".cursor-follower");
    if (!cursor || typeof window.requestAnimationFrame !== "function") return;
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let positioned = false;
    let previousTime = 0;

    function enabled() {
      return (
        pointer.matches &&
        !reducedMotion.matches &&
        !document.hidden &&
        !document.documentElement.classList.contains("intro-active") &&
        !document.body.classList.contains("modal-open")
      );
    }
    function hideCursor() {
      window.cancelAnimationFrame(frame);
      frame = 0;
      positioned = false;
      cursor.classList.remove("is-visible", "is-interactive", "is-pressed");
      document.documentElement.classList.remove("custom-cursor");
      cursor.hidden = true;
    }
    function draw(time) {
      frame = 0;
      if (!enabled()) return hideCursor();
      const amount = 1 - Math.exp(-Math.min(time - previousTime, 64) / 65);
      previousTime = time;
      x += (targetX - x) * amount;
      y += (targetY - y) * amount;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.1) {
        frame = window.requestAnimationFrame(draw);
      }
    }
    document.addEventListener(
      "pointermove",
      (event) => {
        if (
          !enabled() ||
          (event.pointerType && event.pointerType !== "mouse")
        ) {
          return hideCursor();
        }
        if (
          event.target.closest("input, textarea, select, [contenteditable]")
        ) {
          return hideCursor();
        }
        targetX = event.clientX;
        targetY = event.clientY;
        if (!positioned) {
          x = targetX;
          y = targetY;
          positioned = true;
          cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
        cursor.hidden = false;
        document.documentElement.classList.add("custom-cursor");
        cursor.classList.add("is-visible");
        cursor.classList.toggle(
          "is-interactive",
          Boolean(
            event.target.closest(
              "a[href], button:not(:disabled), summary, label[for], [role='button'], [role='link'], [role='menuitem'], [role='option'], [tabindex='0']",
            ),
          ),
        );
        if (!frame) {
          previousTime = performance.now();
          frame = window.requestAnimationFrame(draw);
        }
      },
      { passive: true },
    );
    document.addEventListener(
      "pointerdown",
      () => {
        if (!cursor.hidden) cursor.classList.add("is-pressed");
      },
      { passive: true },
    );
    document.addEventListener(
      "pointerup",
      () => cursor.classList.remove("is-pressed"),
      { passive: true },
    );
    document.addEventListener("pointerout", (event) => {
      if (!event.relatedTarget) hideCursor();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Tab") hideCursor();
    });
    document.addEventListener("visibilitychange", hideCursor);
    window.addEventListener("blur", hideCursor);
    pointer.addEventListener("change", hideCursor);
    reducedMotion.addEventListener("change", hideCursor);
  }
  const typedRole = document.querySelector("#typed-role");
  const rolePreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const roleTitles = [
    "IT Support Specialist",
    "Social Media Manager",
    "Graphic Designer",
  ];
  let roleIndex = 0;
  let roleLength = roleTitles[0].length;
  let deletingRole = true;
  let roleTimer;

  function typeRole() {
    if (document.hidden || rolePreference.matches) return;
    const title = roleTitles[roleIndex];
    roleLength += deletingRole ? -1 : 1;
    typedRole.textContent = title.slice(0, roleLength);
    let delay = deletingRole ? 40 : 75;
    if (roleLength === 0) {
      roleIndex = (roleIndex + 1) % roleTitles.length;
      deletingRole = false;
      delay = 300;
    } else if (roleLength === title.length && !deletingRole) {
      deletingRole = true;
      delay = 2200;
    }
    roleTimer = window.setTimeout(typeRole, delay);
  }

  function syncTyping() {
    window.clearTimeout(roleTimer);
    if (!typedRole) return;
    if (rolePreference.matches) {
      roleIndex = 0;
      roleLength = roleTitles[0].length;
      deletingRole = true;
      typedRole.textContent = roleTitles[0];
    } else if (
      !document.hidden &&
      !document.documentElement.classList.contains("intro-active")
    ) {
      roleTimer = window.setTimeout(typeRole, 1600);
    }
  }
  rolePreference.addEventListener("change", syncTyping);
  document.addEventListener("visibilitychange", syncTyping);
  document.addEventListener("intro-ready", syncTyping);
  syncTyping();
  const brandPanels = Array.from(document.querySelectorAll(".gallery-project-card"));
  const galleryTrack = document.querySelector("#project-gallery-track");
  const galleryPrevious = document.querySelector(".project-gallery-previous");
  const galleryNext = document.querySelector(".project-gallery-next");
  const galleryMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (galleryTrack && brandPanels.length) {
    document.querySelector(".project-gallery-controls").hidden = false;
    function updateGalleryNavigation() {
      const maxScroll = galleryTrack.scrollWidth - galleryTrack.clientWidth;
      galleryPrevious.disabled = galleryTrack.scrollLeft <= 2;
      galleryNext.disabled = galleryTrack.scrollLeft >= maxScroll - 2;
    }
    function scrollGallery(direction) {
      const step = brandPanels[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(galleryTrack).gap) || 20);
      galleryTrack.scrollBy({ left: direction * step, behavior: galleryMotion.matches ? "instant" : "smooth" });
    }
    galleryPrevious.addEventListener("click", () => scrollGallery(-1));
    galleryNext.addEventListener("click", () => scrollGallery(1));
    galleryTrack.addEventListener("scroll", updateGalleryNavigation, { passive: true });
    window.addEventListener("resize", updateGalleryNavigation);
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(updateGalleryNavigation).observe(galleryTrack);
    galleryTrack.addEventListener("keydown", (event) => {
      if (event.target !== galleryTrack) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        scrollGallery(event.key === "ArrowRight" ? 1 : -1);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        galleryTrack.scrollTo({ left: event.key === "Home" ? 0 : galleryTrack.scrollWidth, behavior: galleryMotion.matches ? "instant" : "smooth" });
      }
    });
    updateGalleryNavigation();
  }

  const designs = Array.from(document.querySelectorAll(".design-item"));
  const collectionDialog = document.querySelector("#brand-collection");
  const collectionTitle = document.querySelector("#collection-title");
  const collectionCount = document.querySelector("#collection-count");
  const closeCollection = document.querySelector(".collection-close");
  const dialog = document.querySelector("#lightbox");
  const preview = document.querySelector("#lightbox-image");
  const previewTitle = document.querySelector("#lightbox-title");
  const previewCounter = document.querySelector("#lightbox-counter");
  const closePreview = document.querySelector(".lightbox-close");
  let activeDesigns = [];
  let activeIndex = 0;
  let activeCollectionId;
  let collectionOpener;
  let previewOpener;

  function syncModalState() {
    document.body.classList.toggle("modal-open", collectionDialog.open || dialog.open);
  }

  function openCollection(id, opener) {
    const panel = brandPanels.find((item) => item.dataset.collection === id);
    const collectionDesigns = designs.filter((item) => item.dataset.collection === id);
    if (!panel || !collectionDesigns.length) return;
    activeCollectionId = id;
    collectionOpener = opener;
    const context = document.querySelector("#collection-context");
    context.replaceChildren();
    const brandDetails = panel.querySelector(".gallery-project-context");
    if (brandDetails) context.append(brandDetails.content.cloneNode(true));
    collectionTitle.textContent = panel.querySelector("h3").textContent.replace(/\s+/g, " ").trim();
    collectionCount.textContent = `${collectionDesigns.length} artwork${collectionDesigns.length === 1 ? "" : "s"}`;
    designs.forEach((item) => {
      item.hidden = item.dataset.collection !== id;
    });
    collectionDialog.showModal();
    collectionDialog.scrollTop = 0;
    syncModalState();
    closeCollection.focus();
  }

  if (typeof collectionDialog.showModal === "function") {
    document.querySelectorAll("[data-open-collection]").forEach((opener) => {
      if (opener.matches("button")) opener.hidden = false;
      opener.setAttribute("aria-haspopup", "dialog");
      opener.setAttribute("aria-controls", "brand-collection");
      opener.querySelector(".brand-preview-prompt")?.removeAttribute("hidden");
      opener.addEventListener("click", (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        openCollection(opener.dataset.openCollection, opener);
      });
    });
  }
  closeCollection.addEventListener("click", () => collectionDialog.close());
  collectionDialog.addEventListener("click", (event) => {
    if (event.target === collectionDialog) collectionDialog.close();
  });
  collectionDialog.addEventListener("close", () => {
    syncModalState();
    collectionOpener?.focus({ preventScroll: true });
  });

  function showDesign(index) {
    if (!activeDesigns.length) return;
    activeIndex = (index + activeDesigns.length) % activeDesigns.length;
    const item = activeDesigns[activeIndex];
    const image = item.querySelector("img");
    preview.src = item.href;
    preview.alt = image.alt;
    previewTitle.textContent = item.querySelector("h3").textContent;
    previewCounter.textContent = `${activeIndex + 1} / ${activeDesigns.length}`;
  }

  designs.forEach((item) =>
    item.addEventListener("click", (event) => {
      if (
        typeof dialog.showModal !== "function" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      activeDesigns = designs.filter((design) => design.dataset.collection === activeCollectionId);
      previewOpener = item;
      showDesign(activeDesigns.indexOf(item));
      dialog.showModal();
      syncModalState();
      closePreview.focus();
    }),
  );
  closePreview.addEventListener("click", () => dialog.close());
  document
    .querySelector(".lightbox-prev")
    .addEventListener("click", () => showDesign(activeIndex - 1));
  document
    .querySelector(".lightbox-next")
    .addEventListener("click", () => showDesign(activeIndex + 1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showDesign(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    syncModalState();
    preview.removeAttribute("src");
    previewOpener?.focus({ preventScroll: true });
  });
  let motion;

  // Animate only when content enters view. No hidden-content CSS is needed,
  // so the page stays readable without animation support or JavaScript.
  if (document.documentElement.classList.contains("intro-active")) {
    document.addEventListener(
      "intro-ready",
      () => {
        motion = initMotion(true);
      },
      { once: true },
    );
  } else {
    motion = initMotion();
  }

  function initMotion(heroAlreadyRevealed = false) {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const supported = typeof Element.prototype.animate === "function";
    const targets = Array.from(
      document.querySelectorAll(
        [
          ".hero-topline",
          ".hero-copy > *",
          ".profile-portrait",
          ".hero-footnote",
          ".discipline-strip .container > *",
          ".section-heading",
          ".project",
          ".design-heading",
          ".project-gallery-track",
          ".work-collage",
          ".about-copy > *",
          ".toolkit-intro",
          ".skill-row",
          ".contact-top",
          ".contact-layout > *",
          ".contact-bottom",
          ".site-footer",
        ].join(","),
      ),
    );
    const seen = new WeakSet(
      heroAlreadyRevealed
        ? targets.filter((element) => element.closest(".hero"))
        : [],
    );
    const running = new Map();
    let observer;

    function animate(element, frames, options) {
      if (!supported || preference.matches || document.hidden) return;
      running.get(element)?.cancel();
      const animation = element.animate(frames, options);
      running.set(element, animation);
      animation.finished
        .then(() => {
          if (running.get(element) === animation) running.delete(element);
        })
        .catch(() => {});
    }

    function reveal(element) {
      if (seen.has(element) || element.hidden) return;
      seen.add(element);
      const siblingIndex = Array.from(element.parentElement.children)
        .filter((child) => !child.hidden)
        .indexOf(element);
      const stagger = element.matches(".design-item, .project, .skill-row")
        ? siblingIndex % 3
        : Math.min(siblingIndex, 4);
      animate(
        element,
        [
          { opacity: 0, transform: "translateY(22px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 620,
          delay: stagger * 65,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        },
      );
    }

    function observePage() {
      observer?.disconnect();
      if (preference.matches || !supported) return;
      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(({ isIntersecting, target }) => {
              if (isIntersecting && !target.hidden) {
                reveal(target);
                observer.unobserve(target);
              }
            });
          },
          { threshold: 0.06 },
        );
        targets
          .filter((element) => !seen.has(element))
          .forEach((element) => observer.observe(element));
      } else {
        // Keep all content visible; animate only the first screen as a fallback.
        targets.filter((element) => element.closest(".hero")).forEach(reveal);
      }
    }

    function stopAnimations() {
      running.forEach((animation) => animation.cancel());
      running.clear();
    }
    preference.addEventListener("change", () => {
      stopAnimations();
      observePage();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAnimations();
    });
    // Keyboard focus must never wait for an entrance animation to finish.
    document.addEventListener("focusin", (event) => {
      running.forEach((animation, element) => {
        if (element === event.target || element.contains(event.target)) {
          animation.cancel();
          running.delete(element);
        }
      });
    });
    observePage();
  }
})();
