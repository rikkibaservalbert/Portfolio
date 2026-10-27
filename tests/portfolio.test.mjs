import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import postcss from "postcss";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const source = readFileSync(new URL("../script.js", import.meta.url), "utf8");

function createPage({ reducedMotion = true, savedTheme } = {}) {
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
      media.set(query, {
        matches: query.includes("reduced-motion") ? reducedMotion : query.includes("min-width"),
        media: query,
        addEventListener: (_, listener) => listeners.add(listener),
        removeEventListener: (_, listener) => listeners.delete(listener),
        change(matches) {
          this.matches = matches;
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

  const track = document.querySelector("#project-gallery-track");
  Object.defineProperties(track, {
    scrollWidth: { value: 1200 },
    clientWidth: { value: 600 },
  });
  track.scrollLeft = 0;
  track.scrollTo = (options) => {
    track.lastScroll = options;
    track.scrollLeft = Math.max(0, Math.min(600, options.left));
    track.dispatchEvent(new window.Event("scroll"));
  };
  track.scrollBy = (options) =>
    track.scrollTo({ ...options, left: track.scrollLeft + options.left });
  document.querySelectorAll(".gallery-project-card").forEach((card) => {
    card.getBoundingClientRect = () => ({ width: 340 });
  });

  if (savedTheme) window.localStorage.setItem("theme", savedTheme);
  document
    .querySelectorAll("script:not([src])")
    .forEach((element) => window.eval(element.textContent));
  window.eval(source);
  return { window, document, media, advance, track, close: () => window.close() };
}

test("theme restores the saved preference and updates storage and browser color", () => {
  const page = createPage({ savedTheme: "dark" });
  const { document, window } = page;
  const button = document.querySelector("#theme-toggle");
  assert.equal(document.documentElement.dataset.theme, "dark");
  assert.equal(document.querySelector('meta[name="theme-color"]').content, "#080808");
  button.click();
  assert.equal(document.documentElement.dataset.theme, "light");
  assert.equal(button.getAttribute("aria-label"), "Switch to dark theme");
  assert.equal(window.localStorage.getItem("theme"), "light");
  button.click();
  assert.equal(document.documentElement.dataset.theme, "dark");
  page.close();
});

test("mobile navigation closes with Escape and restores button focus", () => {
  const page = createPage();
  const menu = page.document.querySelector(".menu-toggle");
  menu.click();
  assert.equal(menu.getAttribute("aria-expanded"), "true");
  page.document.dispatchEvent(new page.window.KeyboardEvent("keydown", { key: "Escape" }));
  assert.equal(menu.getAttribute("aria-expanded"), "false");
  assert.equal(page.document.activeElement, menu);
  page.close();
});

test("each brand opens its own artworks and retains its palette and typography notes", () => {
  const page = createPage();
  for (const [id, count] of Object.entries({ ghostai: 16, etx: 7, jelexie: 7 })) {
    const opener = page.document.querySelector(`[data-open-collection="${id}"]`);
    opener.click();
    const collection = page.document.querySelector("#brand-collection");
    assert.equal(collection.open, true);
    const visible = [...collection.querySelectorAll(".design-item")].filter((item) => !item.hidden);
    assert.equal(visible.length, count);
    assert(visible.every((item) => item.dataset.collection === id));
    assert(visible.every((item) => !item.getAttribute("href").includes("brand-stories")));
    assert.equal(collection.querySelectorAll(".brand-palette li").length, 4);
    assert(collection.querySelector(".brand-story-type").textContent.trim());
    collection.querySelector(".collection-close").click();
    assert.equal(page.document.activeElement, opener);
  }
  page.close();
});

test("nested artwork viewer supports keyboard navigation and keeps the collection open", () => {
  const page = createPage();
  page.document.querySelector('[data-open-collection="ghostai"]').click();
  const artwork = page.document.querySelector('.design-item[data-collection="ghostai"]');
  artwork.click();
  const lightbox = page.document.querySelector("#lightbox");
  assert.equal(lightbox.open, true);
  assert.equal(page.document.querySelector("#lightbox-counter").textContent, "1 / 16");
  lightbox.dispatchEvent(new page.window.KeyboardEvent("keydown", { key: "ArrowLeft" }));
  assert.equal(page.document.querySelector("#lightbox-counter").textContent, "16 / 16");
  lightbox.querySelector(".lightbox-next").click();
  assert.equal(page.document.querySelector("#lightbox-counter").textContent, "1 / 16");
  lightbox.dispatchEvent(new page.window.MouseEvent("click", { clientX: 200, clientY: 200 }));
  assert.equal(lightbox.open, true, "clicking dialog padding must not close it");
  lightbox.querySelector(".lightbox-close").click();
  assert.equal(page.document.activeElement, artwork);
  assert.equal(page.document.querySelector("#brand-collection").open, true);
  assert(page.document.body.classList.contains("modal-open"));
  page.document.querySelector(".collection-close").click();
  assert.equal(page.document.body.classList.contains("modal-open"), false);
  page.close();
});

test("carousel clamps navigation and supports Home/End with reduced motion", () => {
  const page = createPage();
  const previous = page.document.querySelector(".project-gallery-previous");
  const next = page.document.querySelector(".project-gallery-next");
  assert.equal(previous.disabled, true);
  next.click();
  assert.equal(page.track.scrollLeft, 360);
  assert.equal(page.track.lastScroll.behavior, "auto");
  page.track.dispatchEvent(new page.window.KeyboardEvent("keydown", { key: "End" }));
  assert.equal(page.track.scrollLeft, 600);
  assert.equal(next.disabled, true);
  page.track.dispatchEvent(new page.window.KeyboardEvent("keydown", { key: "Home" }));
  assert.equal(page.track.scrollLeft, 0);
  assert.equal(previous.disabled, true);
  page.close();
});

test("reduced motion skips the intro lock and leaves a complete role title", () => {
  const page = createPage();
  assert.equal(page.document.documentElement.classList.contains("intro-active"), false);
  assert.equal(page.document.querySelectorAll("[data-intro-inert]").length, 0);
  assert.equal(page.document.querySelector("#typed-role").textContent, "IT Support Specialist");
  page.advance(10000);
  assert.equal(page.document.querySelector("#typed-role").textContent, "IT Support Specialist");
  page.close();
});

test("intro releases page controls and typing stops when reduced motion is enabled", () => {
  const page = createPage({ reducedMotion: false });
  assert(page.document.documentElement.classList.contains("intro-active"));
  assert(page.document.querySelector("main").inert);
  page.advance(1900);
  assert.equal(page.document.documentElement.classList.contains("intro-active"), false);
  assert.equal(page.document.querySelector("main").inert, false);
  page.advance(1600);
  assert.equal(page.document.querySelector("#typed-role").textContent, "IT Support Specialis");
  page.media.get("(prefers-reduced-motion: reduce)").change(true);
  page.advance(10000);
  assert.equal(page.document.querySelector("#typed-role").textContent, "IT Support Specialist");
  page.close();
});

test("latest portrait sizing and halfway hero alignment survive the cleanup", () => {
  const stylesheet = postcss.parse(readFileSync(new URL("../style.css", import.meta.url), "utf8"));
  let alignment;
  let portraitWidth;
  stylesheet.walkRules((rule) => {
    if (rule.selector === ".hero-copy" && rule.parent.params === "(min-width: 801px)") {
      rule.walkDecls("align-self", (declaration) => {
        alignment = declaration.value;
      });
    }
    if (rule.selector === ".hero .portrait-frame") {
      rule.walkDecls("width", (declaration) => {
        portraitWidth = declaration.value;
      });
    }
  });
  assert.equal(alignment, "center");
  assert.equal(portraitWidth, "110.25%");
});

test("restoring a cached page releases the intro's inert controls immediately", () => {
  const page = createPage({ reducedMotion: false });
  const restore = new page.window.Event("pageshow");
  Object.defineProperty(restore, "persisted", { value: true });
  page.window.dispatchEvent(restore);
  assert.equal(page.document.documentElement.classList.contains("intro-active"), false);
  assert.equal(page.document.querySelector("main").inert, false);
  assert.equal(page.document.querySelectorAll("[data-intro-inert]").length, 0);
  page.close();
});
