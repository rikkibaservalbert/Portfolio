(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.documentElement.classList.add("js");

  initIntro();
  initNavigation();
  initTheme();
  initRoleTyping(reducedMotion);
  initProjectCarousel(reducedMotion);
  initArtworkViewer();
  initCursorFollower(reducedMotion);
  initScrollProgress();
  initMotion(reducedMotion);

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  function initIntro() {
    if (!document.documentElement.classList.contains("intro-active")) return;

    document.querySelectorAll(".skip-link, .site-header, main, .site-footer").forEach((element) => {
      if (element.inert) return;
      element.inert = true;
      element.setAttribute("data-intro-inert", "");
    });
  }

  function initNavigation() {
    const menu = document.querySelector(".menu-toggle");
    const navigation = document.querySelector(".nav-links");
    if (!menu || !navigation) return;

    menu.hidden = false;

    function setOpen(open, restoreFocus = false) {
      navigation.classList.toggle("open", open);
      menu.setAttribute("aria-expanded", String(open));
      menu.innerHTML = open
        ? 'Close <span aria-hidden="true">−</span>'
        : 'Menu <span aria-hidden="true">+</span>';
      if (restoreFocus) menu.focus();
    }

    menu.addEventListener("click", () => setOpen(!navigation.classList.contains("open")));
    navigation
      .querySelectorAll("a")
      .forEach((link) => link.addEventListener("click", () => setOpen(false)));
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".navigation")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navigation.classList.contains("open")) setOpen(false, true);
    });
    window.matchMedia("(min-width: 801px)").addEventListener("change", () => setOpen(false));
  }

  function initTheme() {
    const button = document.querySelector("#theme-toggle");
    const browserColor = document.querySelector('meta[name="theme-color"]');
    if (!button) return;

    button.hidden = false;

    function applyTheme(theme) {
      const dark = theme === "dark";
      document.documentElement.dataset.theme = theme;
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      if (browserColor) browserColor.content = dark ? "#080808" : "#ffffff";
    }

    applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    button.addEventListener("click", () => {
      const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(theme);
      try {
        localStorage.setItem("theme", theme);
      } catch {
        // The current theme still works when browser storage is unavailable.
      }
    });
  }

  function initRoleTyping(preference) {
    const role = document.querySelector("#typed-role");
    if (!role) return;

    const titles = ["IT Support Specialist", "Social Media Manager", "Graphic Designer"];
    let index = 0;
    let length = titles[0].length;
    let deleting = true;
    let timer;

    function tick() {
      if (document.hidden || preference.matches) return;
      const title = titles[index];
      length += deleting ? -1 : 1;
      role.textContent = title.slice(0, length);
      let delay = deleting ? 40 : 75;

      if (length === 0) {
        index = (index + 1) % titles.length;
        deleting = false;
        delay = 300;
      } else if (length === title.length && !deleting) {
        deleting = true;
        delay = 2200;
      }
      timer = window.setTimeout(tick, delay);
    }

    function sync() {
      window.clearTimeout(timer);
      if (preference.matches) {
        index = 0;
        length = titles[0].length;
        deleting = true;
        role.textContent = titles[0];
      } else if (!document.hidden && !document.documentElement.classList.contains("intro-active")) {
        timer = window.setTimeout(tick, 1600);
      }
    }

    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("intro-ready", sync);
    sync();
  }

  function initProjectCarousel(preference) {
    const track = document.querySelector("#project-gallery-track");
    const cards = Array.from(document.querySelectorAll(".gallery-project-card"));
    const controls = document.querySelector(".project-gallery-controls");
    const previous = document.querySelector(".project-gallery-previous");
    const next = document.querySelector(".project-gallery-next");
    if (!track || !cards.length || !controls || !previous || !next) return;

    controls.hidden = false;
    const behavior = () => (preference.matches ? "auto" : "smooth");

    function updateNavigation() {
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    }

    function scroll(direction) {
      const cardWidth = cards[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 20;
      track.scrollBy({ left: direction * (cardWidth + gap), behavior: behavior() });
    }

    previous.addEventListener("click", () => scroll(-1));
    next.addEventListener("click", () => scroll(1));
    track.addEventListener("scroll", updateNavigation, { passive: true });
    window.addEventListener("resize", updateNavigation);
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(updateNavigation).observe(track);

    track.addEventListener("keydown", (event) => {
      if (event.target !== track) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        scroll(event.key === "ArrowRight" ? 1 : -1);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        track.scrollTo({
          left: event.key === "Home" ? 0 : track.scrollWidth,
          behavior: behavior(),
        });
      }
    });
    updateNavigation();
  }

  function initArtworkViewer() {
    const cards = Array.from(document.querySelectorAll(".gallery-project-card"));
    const artworks = Array.from(document.querySelectorAll(".design-item"));
    const collection = document.querySelector("#brand-collection");
    const lightbox = document.querySelector("#lightbox");
    if (!collection || !lightbox || !artworks.length || typeof collection.showModal !== "function")
      return;

    const title = collection.querySelector("#collection-title");
    const context = collection.querySelector("#collection-context");
    const collectionContent = collection.querySelector(".collection-content");
    const closeCollection = collection.querySelector(".collection-close");
    const image = lightbox.querySelector("#lightbox-image");
    const imageTitle = lightbox.querySelector("#lightbox-title");
    const imageCollection = lightbox.querySelector("#lightbox-collection");
    const position = lightbox.querySelector("#lightbox-counter");
    const closeLightbox = lightbox.querySelector(".lightbox-close");
    let activeArtworks = [];
    let activeIndex = 0;
    let collectionOpener;
    let artworkOpener;

    function syncModalState() {
      document.body.classList.toggle("modal-open", collection.open || lightbox.open);
    }

    function openCollection(id, opener) {
      const card = cards.find((item) => item.dataset.collection === id);
      const selected = artworks.filter((item) => item.dataset.collection === id);
      if (!card || !selected.length) return;

      activeArtworks = selected;
      collectionOpener = opener;
      title.textContent = card.querySelector("h3").textContent.replace(/\s+/g, " ").trim();
      context.replaceChildren();
      const details = card.querySelector(".gallery-project-context");
      if (details) context.append(details.content.cloneNode(true));
      artworks.forEach((item) => {
        item.hidden = item.dataset.collection !== id;
      });
      collection.showModal();
      collectionContent.scrollTop = 0;
      syncModalState();
      closeCollection.focus();
    }

    function showArtwork(index) {
      if (!activeArtworks.length) return;
      activeIndex = (index + activeArtworks.length) % activeArtworks.length;
      const artwork = activeArtworks[activeIndex];
      image.src = artwork.href;
      image.alt = artwork.querySelector("img").alt;
      imageTitle.textContent = artwork.querySelector("h3").textContent;
      imageCollection.textContent = title.textContent;
      position.textContent = activeIndex + 1 + " / " + activeArtworks.length;
    }

    document.querySelectorAll("[data-open-collection]").forEach((opener) => {
      opener.setAttribute("aria-haspopup", "dialog");
      opener.setAttribute("aria-controls", collection.id);
      opener.addEventListener("click", (event) => {
        if (isModifiedClick(event)) return;
        event.preventDefault();
        openCollection(opener.dataset.openCollection, opener);
      });
    });

    artworks.forEach((artwork) =>
      artwork.addEventListener("click", (event) => {
        if (isModifiedClick(event)) return;
        event.preventDefault();
        artworkOpener = artwork;
        showArtwork(activeArtworks.indexOf(artwork));
        lightbox.showModal();
        syncModalState();
        closeLightbox.focus();
      }),
    );

    closeCollection.addEventListener("click", () => collection.close());
    closeLightbox.addEventListener("click", () => lightbox.close());
    lightbox
      .querySelector(".lightbox-prev")
      .addEventListener("click", () => showArtwork(activeIndex - 1));
    lightbox
      .querySelector(".lightbox-next")
      .addEventListener("click", () => showArtwork(activeIndex + 1));
    lightbox.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      showArtwork(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
    });

    // Ignore clicks in the dialog's empty padding; close only on its backdrop.
    [collection, lightbox].forEach((dialog) =>
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          dialog.close();
      }),
    );

    collection.addEventListener("close", () => {
      syncModalState();
      collectionOpener?.focus({ preventScroll: true });
    });
    lightbox.addEventListener("close", () => {
      syncModalState();
      image.removeAttribute("src");
      artworkOpener?.focus({ preventScroll: true });
    });
  }

  function isModifiedClick(event) {
    return event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
  }

  function initScrollProgress() {
    const bar = document.querySelector(".scroll-progress");
    if (!bar) return;
    let frame = 0;
    function update() {
      frame = 0;
      const page = document.scrollingElement || document.documentElement;
      const distance = page.scrollHeight - page.clientHeight;
      const progress = distance > 0 ? Math.min(1, Math.max(0, page.scrollTop / distance)) : 0;
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

  function initCursorFollower(reducedMotion) {
    const cursor = document.querySelector(".cursor-follower");
    if (!cursor || typeof window.requestAnimationFrame !== "function") return;
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
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
        if (!enabled() || (event.pointerType && event.pointerType !== "mouse")) {
          return hideCursor();
        }
        if (event.target.closest("input, textarea, select, [contenteditable]")) {
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
    document.addEventListener("pointerup", () => cursor.classList.remove("is-pressed"), {
      passive: true,
    });
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

  function initMotion(preference) {
    if (document.documentElement.classList.contains("intro-active")) {
      document.addEventListener("intro-ready", () => initRevealAnimations(preference, true), {
        once: true,
      });
    } else {
      initRevealAnimations(preference);
    }
  }

  function initRevealAnimations(preference, heroAlreadyRevealed = false) {
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
          ".design-intro",
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
      heroAlreadyRevealed ? targets.filter((element) => element.closest(".hero")) : [],
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
