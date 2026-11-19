import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const source = readFileSync(new URL("../script.js", import.meta.url), "utf8");

function createPage({ reducedMotion = true, prefersDark = false, savedTheme } = {}) {
  const dom = new JSDOM(html, {
    url: "https://portfolio.test/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const { document } = window;
  const media = new Map();
  let now = 0;
  let timerId = 0;
  const timers = new Map();

  window.matchMedia = (query) => {
    if (!media.has(query)) {
      const listeners = new Set();
      let matches = false;
      if (query.includes("reduced-motion")) matches = reducedMotion;
      else if (query.includes("prefers-color-scheme: dark")) matches = prefersDark;
      else if (query.includes("min-width")) matches = true;

      media.set(query, {
        matches,
        media: query,
        addEventListener: (_, listener) => listeners.add(listener),
        removeEventListener: (_, listener) => listeners.delete(listener),
        change(nextMatches) {
          this.matches = nextMatches;
          listeners.forEach((listener) => listener(this));
        },
      });
    }
    return media.get(query);
  };

  window.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  window.requestAnimationFrame = () => 1;
  window.cancelAnimationFrame = () => {};
  window.setTimeout = (callback, delay = 0) => {
    const id = ++timerId;
    timers.set(id, { callback, time: now + delay });
    return id;
  };
  window.clearTimeout = (id) => timers.delete(id);

  function advance(milliseconds) {
    const end = now + milliseconds;
    while (true) {
      const next = [...timers.entries()]
        .filter(([, value]) => value.time <= end)
        .sort((a, b) => a[1].time - b[1].time)[0];
      if (!next) break;
      now = next[1].time;
      timers.delete(next[0]);
      next[1].callback();
    }
    now = end;
  }

  window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new window.Event("close"));
  };
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.getBoundingClientRect = () => ({ left: 100, right: 1100, top: 100, bottom: 800 });
  });

  if (savedTheme) window.localStorage.setItem("theme", savedTheme);
  document
    .querySelectorAll("script:not([src])")
    .forEach((element) => window.eval(element.textContent));
  window.eval(source);
  return { window, document, media, advance, close: () => window.close() };
}

test("theme restores saved preference, falls back to system preference, and updates meta color", () => {
  const page = createPage({ savedTheme: "dark" });
  const { document, window } = page;
  const button = document.querySelector("[data-theme-toggle]");
  assert.equal(document.documentElement.dataset.theme, "dark");
  assert.equal(document.querySelector('meta[name="theme-color"]').content, "#0a0a0b");
  assert.equal(button.getAttribute("aria-pressed"), "true");

  button.click();
  assert.equal(document.documentElement.dataset.theme, "light");
  assert.equal(button.getAttribute("aria-label"), "Switch to dark theme");
  assert.equal(window.localStorage.getItem("theme"), "light");
  assert.equal(document.querySelector('meta[name="theme-color"]').content, "#ffffff");

  button.click();
  assert.equal(document.documentElement.dataset.theme, "dark");
  page.close();

  const systemPage = createPage({ prefersDark: true });
  assert.equal(systemPage.document.documentElement.dataset.theme, "dark");
  systemPage.media.get("(prefers-color-scheme: dark)").change(false);
  assert.equal(systemPage.document.documentElement.dataset.theme, "light");
  systemPage.close();
});

test("header toggles is-scrolled on scroll to reveal wordmark and slide navigation right", () => {
  const page = createPage();
  const { document, window } = page;
  const header = document.querySelector("[data-header]");
  assert.equal(header.classList.contains("is-scrolled"), false);

  document.documentElement.scrollTop = 120;
  window.dispatchEvent(new window.Event("scroll"));
  assert.equal(header.classList.contains("is-scrolled"), true);

  document.documentElement.scrollTop = 0;
  window.dispatchEvent(new window.Event("scroll"));
  assert.equal(header.classList.contains("is-scrolled"), false);
  page.close();
});

test("mobile navigation opens, closes with Escape, and restores toggle focus", () => {
  const page = createPage();
  const toggle = page.document.querySelector("[data-nav-toggle]");
  const list = page.document.querySelector("[data-nav-list]");

  toggle.click();
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert(list.classList.contains("is-open"));

  page.document.dispatchEvent(
    new page.window.KeyboardEvent("keydown", { key: "Escape", cancelable: true }),
  );
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(list.classList.contains("is-open"), false);
  assert.equal(page.document.activeElement, toggle);
  page.close();
});

test("all SVG icon references resolve to sprite symbols with accessible attributes", () => {
  const page = createPage();
  const { document } = page;
  for (const icon of document.querySelectorAll("svg.icon")) {
    assert.equal(icon.getAttribute("aria-hidden"), "true");
    assert.equal(icon.getAttribute("focusable"), "false");
    const reference = icon.querySelector("use").getAttribute("href");
    assert.equal(document.querySelector(reference)?.tagName.toLowerCase(), "symbol");
  }
  assert(!/[\u2197\u2193\u2191\u25d0\u2733\u2318]/u.test(document.body.textContent));
  page.close();
});

test("each brand collection opens its artworks, palette, and typography in the unified viewer", () => {
  const page = createPage();
  const { document } = page;
  const viewer = document.querySelector("[data-viewer]");

  for (const [id, count] of Object.entries({ ghostai: 16, etx: 7, jelexie: 7 })) {
    const opener = document.querySelector(`.work-card [data-open-collection="${id}"]`);
    opener.click();
    assert.equal(viewer.open, true);
    assert.equal(viewer.dataset.collection, id);

    const thumbs = viewer.querySelectorAll("[data-viewer-thumbs] a[href]");
    assert.equal(thumbs.length, count);
    assert.equal(viewer.querySelector("[data-viewer-counter]").textContent, `1 / ${count}`);
    assert.equal(thumbs[0].getAttribute("aria-current"), "true");
    assert.equal(viewer.querySelector("[data-viewer-details]").hidden, false);
    assert.equal(viewer.querySelectorAll(".palette li").length, 4);

    // Clicking a filmstrip thumbnail switches the stage image without leaving the page.
    thumbs[1].click();
    assert.equal(viewer.querySelector("[data-viewer-counter]").textContent, `2 / ${count}`);
    assert.equal(thumbs[1].getAttribute("aria-current"), "true");
    assert.equal(
      viewer.querySelector("[data-viewer-image]").getAttribute("src"),
      thumbs[1].getAttribute("href"),
    );

    viewer.querySelector("[data-viewer-close]").click();
    assert.equal(viewer.open, false);
    assert.equal(document.activeElement, opener);
  }
  page.close();
});

test("RelDev opens its 4 screenshots, clears brand details, and supports keyboard navigation", () => {
  const page = createPage();
  const { document, window } = page;
  const viewer = document.querySelector("[data-viewer]");

  // Open a brand collection first to ensure details are cleared when opening RelDev.
  document.querySelector('[data-open-collection="ghostai"]').click();
  viewer.querySelector("[data-viewer-close]").click();

  const opener = document.querySelector('.project-card__media[data-open-collection="reldev"]');
  opener.click();
  assert.equal(viewer.open, true);
  assert.equal(viewer.querySelector("[data-viewer-title]").textContent, "RelDev");
  assert.equal(viewer.querySelector("[data-viewer-label]").textContent, "Project screenshots");
  assert.equal(viewer.querySelector("[data-viewer-details]").hidden, true);
  assert.equal(viewer.querySelector("[data-viewer-details]").children.length, 0);

  const thumbs = [...viewer.querySelectorAll("[data-viewer-thumbs] a[href]")];
  assert.equal(thumbs.length, 4);
  assert.deepEqual(
    thumbs.map((item) => item.getAttribute("href").split("/").at(-1)),
    ["welcome.png", "dashboard.png", "documents.png", "verification.png"],
  );
  assert.equal(viewer.querySelector("[data-viewer-counter]").textContent, "1 / 4");

  viewer.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowLeft" }));
  assert.equal(viewer.querySelector("[data-viewer-counter]").textContent, "4 / 4");
  assert(
    viewer.querySelector("[data-viewer-image]").getAttribute("src").endsWith("/verification.png"),
  );

  viewer.querySelector("[data-viewer-next]").click();
  assert.equal(viewer.querySelector("[data-viewer-counter]").textContent, "1 / 4");

  // Clicking inside dialog bounds must not close it.
  viewer.dispatchEvent(new window.MouseEvent("click", { clientX: 200, clientY: 200 }));
  assert.equal(viewer.open, true);

  // Clicking outside dialog bounds (backdrop) closes it and restores focus.
  viewer.dispatchEvent(new window.MouseEvent("click", { clientX: 20, clientY: 20 }));
  assert.equal(viewer.open, false);
  assert.equal(document.body.classList.contains("modal-open"), false);
  assert.equal(document.activeElement, opener);
  page.close();
});

test("opening screen releases page controls after completion or skip, and role rotator cycles roles", () => {
  const page = createPage({ reducedMotion: false });
  const { document } = page;
  const items = [...document.querySelectorAll("[data-rotator] .rotator__item")];
  assert.equal(items.length, 3);
  assert(document.documentElement.classList.contains("intro-active"));
  assert(document.querySelector("main").inert);

  page.advance(1900);
  assert.equal(document.documentElement.classList.contains("intro-active"), false);
  assert.equal(document.querySelector("main").inert, false);
  assert(items[0].classList.contains("is-active"));

  page.advance(2800);
  assert(items[1].classList.contains("is-active"));

  page.advance(2800);
  assert(items[2].classList.contains("is-active"));

  page.media.get("(prefers-reduced-motion: reduce)").change(true);
  assert(items[0].classList.contains("is-active"));
  assert.equal(items[1].classList.contains("is-active"), false);
  assert.equal(items[2].classList.contains("is-active"), false);

  page.advance(10000);
  assert(items[0].classList.contains("is-active"));
  page.close();

  const skipPage = createPage({ reducedMotion: false });
  const skipButton = skipPage.document.querySelector("[data-intro-skip]");
  skipButton.focus();
  skipButton.click();
  assert.equal(skipPage.document.documentElement.classList.contains("intro-active"), false);
  assert.equal(skipPage.document.querySelector("main").inert, false);
  assert.equal(skipPage.document.activeElement, skipPage.document.querySelector("#main"));
  skipPage.close();
});

test("marquee duplicates track group and scroll-scrubbed statement illuminates words on scroll", () => {
  const page = createPage({ reducedMotion: false });
  const { document, window } = page;
  assert.equal(document.querySelectorAll("[data-marquee-track] .marquee__group").length, 2);

  const statement = document.querySelector("[data-scroll-words]");
  const words = [...statement.querySelectorAll(".scroll-word")];
  assert(words.length > 10);

  statement.getBoundingClientRect = () => ({ top: 900 });
  window.dispatchEvent(new window.Event("scroll"));
  assert.equal(words[0].style.getPropertyValue("--word-opacity"), "0.180");

  statement.getBoundingClientRect = () => ({ top: 100 });
  window.dispatchEvent(new window.Event("scroll"));
  assert.equal(words.at(-1).style.getPropertyValue("--word-opacity"), "1.000");

  page.media.get("(prefers-reduced-motion: reduce)").change(true);
  assert(words.every((word) => word.style.getPropertyValue("--word-opacity") === "1"));
  page.close();
});
