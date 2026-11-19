(() => {
  "use strict";

  const THEME_COLORS = {
    light: "#ffffff",
    dark: "#0a0a0b",
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.documentElement.classList.add("js");

  initIntro(reducedMotion);
  initTheme();
  initHeader();
  initNavigation();
  initRoleRotator(reducedMotion);
  initMarquee();
  initScrollWords(reducedMotion);
  initCursorFollower(reducedMotion);
  initReveal(reducedMotion);
  initCollectionViewer();
  initFooterYear();

  function initIntro(preference) {
    if (!document.documentElement.classList.contains("intro-active")) return;

    const intro = document.querySelector("[data-intro]");
    const skipButton = intro?.querySelector("[data-intro-skip]");
    let restoreFocus = Boolean(intro?.contains(document.activeElement));

    function skipIntro() {
      document.dispatchEvent(new Event("intro-skip"));
    }

    if (preference.matches) {
      skipIntro();
      return;
    }

    document.querySelectorAll(".skip-link, .site-header, main, .site-footer").forEach((element) => {
      if (element.inert) return;
      element.inert = true;
      element.setAttribute("data-intro-inert", "");
    });

    function handleEscape(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      skipIntro();
    }

    function handleMotionChange(event) {
      if (event.matches) skipIntro();
    }

    function trackFocus(event) {
      restoreFocus = Boolean(intro?.contains(event.target));
    }

    skipButton?.addEventListener("click", skipIntro);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("focusin", trackFocus);
    preference.addEventListener("change", handleMotionChange);
    document.addEventListener(
      "intro-ready",
      () => {
        skipButton?.removeEventListener("click", skipIntro);
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("focusin", trackFocus);
        preference.removeEventListener("change", handleMotionChange);
        if (restoreFocus) {
          document.querySelector("#main")?.focus({ preventScroll: true });
        }
      },
      { once: true },
    );
  }

  function initFooterYear() {
    const year = document.querySelector("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function initTheme() {
    const button = document.querySelector("[data-theme-toggle]");
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
    if (!button) return;

    const label = button.querySelector(".visually-hidden");

    function hasSavedPreference() {
      try {
        const saved = localStorage.getItem("theme");
        return saved === "dark" || saved === "light";
      } catch {
        return false;
      }
    }

    function applyTheme(theme) {
      const isDark = theme === "dark";
      const resolved = isDark ? "dark" : "light";
      document.documentElement.dataset.theme = resolved;
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      if (label) label.textContent = isDark ? "Switch to light theme" : "Switch to dark theme";
      if (metaTheme) metaTheme.content = THEME_COLORS[resolved];
    }

    applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");

    button.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem("theme", next);
      } catch {
        // Storage may be unavailable in restricted contexts; in-memory theme still updates.
      }
    });

    systemDark.addEventListener("change", (event) => {
      if (!hasSavedPreference()) {
        applyTheme(event.matches ? "dark" : "light");
      }
    });
  }

  function initHeader() {
    const header = document.querySelector("[data-header]");
    const progressBar = document.querySelector("[data-scroll-progress]");
    if (!header && !progressBar) return;

    function syncScroll() {
      const page = document.scrollingElement || document.documentElement;
      if (header) {
        const threshold = header.offsetHeight || 48;
        header.classList.toggle("is-scrolled", page.scrollTop > threshold);
      }
      if (progressBar) {
        const distance = page.scrollHeight - page.clientHeight;
        const ratio = distance > 0 ? Math.min(1, Math.max(0, page.scrollTop / distance)) : 0;
        progressBar.style.width = `${ratio * 100}%`;
      }
    }

    window.addEventListener("scroll", syncScroll, { passive: true });
    window.addEventListener("resize", syncScroll);
    window.addEventListener("pageshow", syncScroll);
    syncScroll();
  }

  function initNavigation() {
    const nav = document.querySelector("[data-nav]");
    const toggle = document.querySelector("[data-nav-toggle]");
    const list = document.querySelector("[data-nav-list]");
    if (!nav || !toggle || !list) return;

    const links = Array.from(list.querySelectorAll('a[href^="#"]'));

    function setOpen(open, restoreFocus = false) {
      list.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (restoreFocus) toggle.focus();
    }

    toggle.addEventListener("click", () => {
      setOpen(!list.classList.contains("is-open"));
    });

    links.forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("click", (event) => {
      if (list.classList.contains("is-open") && !event.target.closest("[data-nav]")) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && list.classList.contains("is-open")) {
        event.preventDefault();
        setOpen(false, true);
      }
    });

    window.matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
      if (event.matches) setOpen(false);
    });

    if ("IntersectionObserver" in window) {
      const hero = document.getElementById("top");
      const sectionMap = new Map();
      links.forEach((link) => {
        const id = link.getAttribute("href").slice(1);
        const section = document.getElementById(id);
        if (section) sectionMap.set(section, link);
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            if (entry.target === hero) {
              links.forEach((link) => link.removeAttribute("aria-current"));
              return;
            }
            const activeLink = sectionMap.get(entry.target);
            if (!activeLink) return;
            links.forEach((link) => {
              if (link === activeLink) {
                link.setAttribute("aria-current", "true");
              } else {
                link.removeAttribute("aria-current");
              }
            });
          });
        },
        { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
      );

      if (hero) observer.observe(hero);
      sectionMap.forEach((_, section) => observer.observe(section));
    }
  }

  function initRoleRotator(preference) {
    const rotator = document.querySelector("[data-rotator]");
    if (!rotator) return;

    const items = Array.from(rotator.querySelectorAll(".rotator__item"));
    if (items.length < 2) return;

    let activeIndex = 0;
    let timerId = 0;
    let exitTimerId = 0;

    function showIndex(nextIndex) {
      const previousIndex = activeIndex;
      activeIndex = (nextIndex + items.length) % items.length;
      items.forEach((item, index) => {
        item.classList.remove("is-exiting");
        if (index === activeIndex) {
          item.classList.add("is-active");
        } else if (index === previousIndex && previousIndex !== activeIndex) {
          item.classList.remove("is-active");
          item.classList.add("is-exiting");
        } else {
          item.classList.remove("is-active");
        }
      });
      window.clearTimeout(exitTimerId);
      exitTimerId = window.setTimeout(() => {
        items[previousIndex]?.classList.remove("is-exiting");
      }, 380);
    }

    function step() {
      if (document.hidden || preference.matches) return;
      showIndex(activeIndex + 1);
      timerId = window.setTimeout(step, 2800);
    }

    function sync() {
      window.clearTimeout(timerId);
      window.clearTimeout(exitTimerId);
      if (preference.matches) {
        activeIndex = 0;
        items.forEach((item, index) => {
          item.classList.toggle("is-active", index === 0);
          item.classList.remove("is-exiting");
        });
      } else if (!document.hidden && !document.documentElement.classList.contains("intro-active")) {
        timerId = window.setTimeout(step, 2800);
      }
    }

    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("intro-ready", sync);
    sync();
  }

  function initMarquee() {
    const track = document.querySelector("[data-marquee-track]");
    const group = track?.querySelector(".marquee__group");
    if (!track || !group) return;
    track.append(group.cloneNode(true));
  }

  function initScrollWords(preference) {
    const statements = Array.from(document.querySelectorAll("[data-scroll-words]"));
    if (!statements.length) return;

    const groups = statements
      .map((statement) => {
        const words = [];

        function wrapTextNodes(node) {
          Array.from(node.childNodes).forEach((child) => {
            if (child.nodeType === 3) {
              const tokens = child.textContent.split(/(\s+)/);
              const fragment = document.createDocumentFragment();
              tokens.forEach((token) => {
                if (!token) return;
                if (/^\s+$/.test(token)) {
                  fragment.append(document.createTextNode(token));
                } else {
                  const span = document.createElement("span");
                  span.className = "scroll-word";
                  span.textContent = token;
                  words.push(span);
                  fragment.append(span);
                }
              });
              child.replaceWith(fragment);
            } else if (child.nodeType === 1) {
              wrapTextNodes(child);
            }
          });
        }

        wrapTextNodes(statement);
        return { statement, words };
      })
      .filter((group) => group.words.length > 0);

    if (!groups.length) return;

    function updateWords() {
      const viewport = window.innerHeight || 800;
      const start = viewport * 0.82;
      const end = viewport * 0.22;

      groups.forEach(({ statement, words }) => {
        if (preference.matches) {
          words.forEach((word) => word.style.setProperty("--word-opacity", "1"));
          return;
        }
        const rect = statement.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (start - rect.top) / Math.max(1, start - end)));
        const total = words.length;

        words.forEach((word, index) => {
          const wordStart = index / total;
          const wordEnd = (index + 1) / total;
          const local = Math.min(1, Math.max(0, (progress - wordStart) / (wordEnd - wordStart)));
          const opacity = (0.18 + local * 0.82).toFixed(3);
          word.style.setProperty("--word-opacity", opacity);
        });
      });
    }

    window.addEventListener("scroll", updateWords, { passive: true });
    window.addEventListener("resize", updateWords);
    preference.addEventListener("change", updateWords);
    updateWords();
  }

  function initCursorFollower(preference) {
    const cursor = document.querySelector("[data-cursor]");
    if (!cursor || typeof window.requestAnimationFrame !== "function") return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    let frame = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let positioned = false;
    let previousTime = 0;

    function isEnabled() {
      return (
        finePointer.matches &&
        !preference.matches &&
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
      cursor.hidden = true;
    }

    function draw(time) {
      frame = 0;
      if (!isEnabled()) return hideCursor();
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
        if (!isEnabled() || (event.pointerType && event.pointerType !== "mouse")) {
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
        cursor.classList.add("is-visible");
        cursor.classList.toggle(
          "is-interactive",
          Boolean(
            event.target.closest?.(
              "a[href], button:not(:disabled), [role='button'], [tabindex='0']",
            ),
          ),
        );
        if (!frame) {
          previousTime = window.performance?.now?.() || Date.now();
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
    finePointer.addEventListener("change", hideCursor);
    preference.addEventListener("change", hideCursor);
  }

  function initReveal(preference) {
    const targets = Array.from(
      document.querySelectorAll("[data-reveal], [data-reveal-stagger], [data-reveal-lines]"),
    );
    if (!targets.length) return;

    targets.forEach((target) => {
      if (target.hasAttribute("data-reveal-stagger")) {
        Array.from(target.children)
          .filter((child) => !child.classList.contains("capability-definitions"))
          .forEach((child, index) => {
            child.style.setProperty("--stagger", String(index));
          });
      }
    });

    function revealAll() {
      targets.forEach((target) => target.classList.add("is-visible"));
    }

    if (preference.matches || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -32px 0px" },
    );

    targets.forEach((target) => observer.observe(target));

    preference.addEventListener("change", (event) => {
      if (event.matches) {
        observer.disconnect();
        revealAll();
      }
    });

    document.addEventListener("focusin", (event) => {
      const container = event.target.closest?.(
        "[data-reveal], [data-reveal-stagger], [data-reveal-lines]",
      );
      if (container && !container.classList.contains("is-visible")) {
        container.classList.add("is-visible");
        observer.unobserve(container);
      }
    });
  }

  function initCollectionViewer() {
    const viewer = document.querySelector("[data-viewer]");
    if (!viewer || typeof viewer.showModal !== "function") return;

    const title = viewer.querySelector("[data-viewer-title]");
    const label = viewer.querySelector("[data-viewer-label]");
    const counter = viewer.querySelector("[data-viewer-counter]");
    const closeButton = viewer.querySelector("[data-viewer-close]");
    const prevButton = viewer.querySelector("[data-viewer-previous]");
    const nextButton = viewer.querySelector("[data-viewer-next]");
    const stage = viewer.querySelector("[data-viewer-stage]");
    const stageImage = viewer.querySelector("[data-viewer-image]");
    const stageCaption = viewer.querySelector("[data-viewer-caption]");
    const detailsContainer = viewer.querySelector("[data-viewer-details]");
    const thumbsContainer = viewer.querySelector("[data-viewer-thumbs]");

    let activeItems = [];
    let activeIndex = 0;
    let activeOpener = null;

    function showItem(index) {
      if (!activeItems.length) return;
      activeIndex = (index + activeItems.length) % activeItems.length;
      const item = activeItems[activeIndex];
      const thumbImg = item.querySelector("img");
      const href = item.getAttribute("href") || item.href;
      const alt = thumbImg ? thumbImg.alt : "";

      stageImage.src = href;
      stageImage.alt = alt;
      stageCaption.textContent = alt;
      counter.textContent = `${activeIndex + 1} / ${activeItems.length}`;

      activeItems.forEach((link, idx) => {
        if (idx === activeIndex) {
          link.setAttribute("aria-current", "true");
          link.scrollIntoView?.({ block: "nearest", inline: "nearest" });
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    function openCollection(id, opener) {
      const template = document.getElementById(`collection-${id}`);
      if (!template) return;

      const fragment = template.content.cloneNode(true);
      const detailsSlot = fragment.querySelector('[data-slot="details"]');
      const itemsSlot = fragment.querySelector('[data-slot="items"]');
      if (!itemsSlot) return;

      const thumbLinks = Array.from(itemsSlot.querySelectorAll("a[href]"));
      if (!thumbLinks.length) return;

      activeOpener = opener;
      activeItems = thumbLinks;
      viewer.dataset.collection = id;
      title.textContent = template.dataset.title || "";
      label.textContent = template.dataset.label || "Collection";

      detailsContainer.replaceChildren();
      if (detailsSlot) {
        detailsContainer.append(detailsSlot);
        detailsContainer.hidden = false;
      } else {
        detailsContainer.hidden = true;
      }

      thumbsContainer.replaceChildren(itemsSlot);
      thumbLinks.forEach((link, idx) => {
        link.addEventListener("click", (event) => {
          if (isModifiedClick(event)) return;
          event.preventDefault();
          showItem(idx);
        });
      });

      showItem(0);
      if (!viewer.open) viewer.showModal();
      document.body.classList.add("modal-open");
      closeButton.focus();
    }

    document.querySelectorAll("[data-open-collection]").forEach((opener) => {
      opener.setAttribute("aria-haspopup", "dialog");
      opener.addEventListener("click", (event) => {
        if (isModifiedClick(event)) return;
        event.preventDefault();
        openCollection(opener.dataset.openCollection, opener);
      });
    });

    closeButton.addEventListener("click", () => viewer.close());
    prevButton.addEventListener("click", () => showItem(activeIndex - 1));
    nextButton.addEventListener("click", () => showItem(activeIndex + 1));

    let swipeStartX = 0;
    let swipeStartY = 0;
    stage?.addEventListener(
      "pointerdown",
      (event) => {
        if (event.pointerType === "mouse") return;
        swipeStartX = event.clientX;
        swipeStartY = event.clientY;
      },
      { passive: true },
    );
    stage?.addEventListener(
      "pointerup",
      (event) => {
        if (event.pointerType === "mouse" || !swipeStartX) return;
        const dx = event.clientX - swipeStartX;
        const dy = event.clientY - swipeStartY;
        swipeStartX = 0;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
          showItem(activeIndex + (dx < 0 ? 1 : -1));
        }
      },
      { passive: true },
    );

    viewer.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showItem(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showItem(activeIndex + 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        showItem(0);
      } else if (event.key === "End") {
        event.preventDefault();
        showItem(activeItems.length - 1);
      }
    });

    viewer.addEventListener("click", (event) => {
      if (event.target !== viewer) return;
      const bounds = viewer.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        viewer.close();
      }
    });

    viewer.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      stageImage.removeAttribute("src");
      stageImage.alt = "";
      activeOpener?.focus({ preventScroll: true });
    });
  }

  function isModifiedClick(event) {
    return event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
  }
})();
