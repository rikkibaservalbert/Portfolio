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
      ? "#071b2c"
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
  const designs = Array.from(document.querySelectorAll(".design-item"));
  const filters = Array.from(document.querySelectorAll("[data-filter]"));
  const showMore = document.querySelector("#show-more");
  const galleryMore = document.querySelector(".gallery-more");
  const galleryCount = document.querySelector(".gallery-count");
  const pageSize = 9;
  let selectedFilter = "all";
  let expanded = false;

  function matchingDesigns() {
    return designs.filter(
      (item) =>
        selectedFilter === "all" || item.dataset.category === selectedFilter,
    );
  }

  function updateGallery() {
    const matching = matchingDesigns();
    designs.forEach((item) => {
      const index = matching.indexOf(item);
      item.hidden = index < 0 || (!expanded && index >= pageSize);
    });
    filters.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === selectedFilter),
      ),
    );
    const visibleCount = Math.min(
      expanded ? matching.length : pageSize,
      matching.length,
    );
    galleryCount.textContent = `Showing ${visibleCount} of ${matching.length} works`;
    showMore.hidden = matching.length <= pageSize;
    showMore.setAttribute("aria-expanded", String(expanded));
    showMore.innerHTML = expanded
      ? 'Show fewer works <span aria-hidden="true">↑</span>'
      : `View all ${matching.length} works <span aria-hidden="true">↓</span>`;
  }

  if (designs.length) {
    document.querySelector(".filters").hidden = false;
    galleryMore.hidden = false;
    filters.forEach((button) =>
      button.addEventListener("click", () => {
        selectedFilter = button.dataset.filter;
        expanded = false;
        updateGallery();
      }),
    );
    showMore.addEventListener("click", () => {
      expanded = !expanded;
      updateGallery();
      if (!expanded)
        document
          .querySelector(".gallery-toolbar")
          .scrollIntoView({ block: "start", behavior: "smooth" });
    });
    updateGallery();
  }

  const dialog = document.querySelector("#lightbox");
  const preview = document.querySelector("#lightbox-image");
  const previewTitle = document.querySelector("#lightbox-title");
  const previewCounter = document.querySelector("#lightbox-counter");
  const closePreview = document.querySelector(".lightbox-close");
  let activeDesigns = [];
  let activeIndex = 0;
  let previewOpener;

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
      activeDesigns = designs.filter((design) => !design.hidden);
      previewOpener = item;
      showDesign(activeDesigns.indexOf(item));
      dialog.showModal();
      document.body.classList.add("modal-open");
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
    document.body.classList.remove("modal-open");
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
          ".technical-note",
          ".gallery-toolbar",
          ".design-item",
          ".gallery-more",
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
