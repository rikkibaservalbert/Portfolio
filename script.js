/* Rikki Valbert Baser Portfolio JavaScript */

(() => {
  "use strict";

  function initPortfolio() {
    // Auto-typing hero title
    const typedText = document.getElementById("typed-text");
    const roles = [
      "Graphic Designer",
      "IT Support Specialist",
      "Content & Social Media Manager"
    ];

    if (typedText) {
      let roleIndex = 0;
      let charIndex = 0;
      let deleting = false;

      function typeRole() {
        const role = roles[roleIndex];
        typedText.textContent = role.slice(0, charIndex);

        if (!deleting) {
          if (charIndex < role.length) {
            charIndex += 1;
            window.setTimeout(typeRole, 65);
          } else {
            deleting = true;
            window.setTimeout(typeRole, 1400);
          }
        } else if (charIndex > 0) {
          charIndex -= 1;
          window.setTimeout(typeRole, 32);
        } else {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          window.setTimeout(typeRole, 250);
        }
      }

      typeRole();
    }

    // Mobile navigation
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {
      menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
      });

      navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          navLinks.classList.remove("open");
          menuToggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    // Scroll reveal; make content visible if IntersectionObserver isn't supported.
    const revealElements = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

      revealElements.forEach((element) => revealObserver.observe(element));
    } else {
      revealElements.forEach((element) => element.classList.add("visible"));
    }

    // Gentle hover tilt on cards and gallery images.
    const canHover = window.matchMedia &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (canHover) {
      document.querySelectorAll(".tilt-card").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
          const rect = card.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          const rotateY = (x - 0.5) * 6;
          const rotateX = (0.5 - y) * 6;
          card.style.setProperty("--tilt-transform", `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`);
          card.style.transform = card.style.getPropertyValue("--tilt-transform");
        });
        card.addEventListener("pointerleave", () => {
          card.style.removeProperty("--tilt-transform");
          card.style.transform = "";
        });
      });
    }

    // Dynamic footer year
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPortfolio, { once: true });
  } else {
    initPortfolio();
  }

  // Theme toggle: dark by default, remember the user's explicit selection.
  const themeToggle = document.getElementById("theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    const isLight = theme === "light";
    document.body.classList.toggle("light-mode", isLight);
    if (themeMeta) themeMeta.setAttribute("content", isLight ? "#f4f8ff" : "#100c0b");
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(isLight));
      themeToggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
      themeToggle.setAttribute("title", isLight ? "Switch to dark mode" : "Switch to light mode");
    }
  }

  if (themeToggle) {
    let savedTheme = null;
    try { savedTheme = localStorage.getItem("theme"); } catch (_) {}
    // Respect a saved choice; otherwise begin in dark mode.
    applyTheme(savedTheme === "light" ? "light" : "dark");

    themeToggle.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("light-mode") ? "dark" : "light";
      applyTheme(nextTheme);
      try { localStorage.setItem("theme", nextTheme); } catch (_) {}
    });
  }
})();


/* =====================================
   PORTFOLIO INTRO LOADER
===================================== */

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("introLoader");
  const introRoles = document.querySelectorAll(".intro-role");

  if (!loader) return;

  let activeRole = 0;
  let finished = false;

  const startTime = Date.now();
  const minimumDuration = 2800;

  const roleTimer = introRoles.length > 1
    ? setInterval(() => {
        if (finished) return;

        introRoles[activeRole].classList.remove("active");

        activeRole = (activeRole + 1) % introRoles.length;

        introRoles[activeRole].classList.add("active");
      }, 750)
    : null;

  function hideIntro() {
    if (finished) return;

    finished = true;

    if (roleTimer) {
      clearInterval(roleTimer);
    }

    loader.classList.add("is-hidden");

    setTimeout(() => {
      loader.style.display = "none";
    }, 900);
  }

  function finishWhenReady() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minimumDuration - elapsed);

    setTimeout(hideIntro, remaining);
  }

  if (document.readyState === "complete") {
    finishWhenReady();
  } else {
    window.addEventListener("load", finishWhenReady, {
      once: true
    });
  }

  // Fallback so the intro cannot remain stuck indefinitely.
  setTimeout(hideIntro, 10000);
});


/* =====================================
   SELECTED SOCIAL DESIGNS LIGHTBOX
===================================== */

document.addEventListener("DOMContentLoaded", () => {
  const galleryImages = Array.from(
    document.querySelectorAll(".gallery-track .gallery-item")
  );

  const slideshow = document.querySelector(".gallery-slideshow");
  const viewport = document.querySelector(".gallery-viewport");
  const slides = Array.from(document.querySelectorAll(".gallery-slide"));
  const thumbnailStrip = document.querySelector(".gallery-thumbnails");
  const galleryCounter = document.querySelector(".gallery-counter");
  const galleryPrev = document.querySelector(".gallery-prev");
  const galleryNext = document.querySelector(".gallery-next");
  const peekPrev = document.querySelector(".gallery-peek-prev");
  const peekNext = document.querySelector(".gallery-peek-next");

  if (!galleryImages.length || !slideshow || !viewport || !thumbnailStrip || !galleryPrev || !galleryNext) return;

  let currentSlide = 0;
  let scrollFrame = null;
  let scrollEndTimer = null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wrapIndex = (index) => (index % slides.length + slides.length) % slides.length;
  // End copies let touch scrolling cross either boundary without rewinding the collection.
  const beforeFirst = slides[slides.length - 1].cloneNode(true);
  const afterLast = slides[0].cloneNode(true);
  [beforeFirst, afterLast].forEach((copy) => {
    copy.classList.add("gallery-clone");
    copy.tabIndex = -1;
    copy.setAttribute("aria-hidden", "true");
  });
  document.querySelector(".gallery-track").prepend(beforeFirst);
  document.querySelector(".gallery-track").append(afterLast);
  const thumbnails = galleryImages.map((image, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-thumbnail";
    button.setAttribute("aria-label", `View design ${index + 1}`);
    const preview = document.createElement("img");
    preview.src = `images/thumbnails/design${index + 1}.jpg`;
    preview.alt = "";
    preview.loading = "eager";
    preview.decoding = "async";
    button.appendChild(preview);
    button.addEventListener("click", () => goToSlide(index));
    thumbnailStrip.appendChild(button);
    return button;
  });

  function updateSlide(index) {
    currentSlide = index;
    galleryCounter.textContent = `${String(index + 1).padStart(2, "0")} / ${galleryImages.length}`;
    const previous = wrapIndex(index - 1);
    const next = wrapIndex(index + 1);
    peekPrev.querySelector("img").src = galleryImages[previous].src;
    peekNext.querySelector("img").src = galleryImages[next].src;
    peekPrev.setAttribute("aria-label", `Previous design, ${previous + 1} of ${slides.length}`);
    peekNext.setAttribute("aria-label", `Next design, ${next + 1} of ${slides.length}`);
    slides.forEach((slide, slideIndex) => {
      slide.tabIndex = slideIndex === index ? 0 : -1;
      slide.setAttribute("aria-hidden", String(slideIndex !== index));
      thumbnails[slideIndex].setAttribute("aria-current", String(slideIndex === index));
    });
    const selected = thumbnails[index];
    const stripBounds = thumbnailStrip.getBoundingClientRect();
    const thumbBounds = selected.getBoundingClientRect();
    if (thumbBounds.left < stripBounds.left || thumbBounds.right > stripBounds.right) {
      thumbnailStrip.scrollLeft += thumbBounds.left - stripBounds.left - (stripBounds.width - thumbBounds.width) / 2;
    }
  }

  function goToSlide(index, animate = true) {
    const target = wrapIndex(index);
    let position = target + 1;
    if (animate && index === -1 && currentSlide === 0) position = 0;
    if (animate && index === slides.length && currentSlide === slides.length - 1) position = slides.length + 1;
    viewport.scrollTo({
      left: position * viewport.clientWidth,
      behavior: animate && !reducedMotion.matches ? "smooth" : "instant"
    });
    if (!animate || reducedMotion.matches) updateSlide(target);
  }

  galleryPrev.addEventListener("click", () => goToSlide(currentSlide - 1));
  galleryNext.addEventListener("click", () => goToSlide(currentSlide + 1));
  peekPrev.addEventListener("click", () => goToSlide(currentSlide - 1));
  peekNext.addEventListener("click", () => goToSlide(currentSlide + 1));
  [peekPrev, peekNext].forEach((peek) => {
    let startX = 0;
    let startY = 0;
    peek.addEventListener("touchstart", (event) => {
      startX = event.changedTouches[0].clientX;
      startY = event.changedTouches[0].clientY;
    }, { passive: true });
    peek.addEventListener("touchend", (event) => {
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
      event.preventDefault();
      goToSlide(currentSlide + (dx > 0 ? -1 : 1));
    });
  });
  function normalizeLoop() {
    const width = viewport.clientWidth;
    if (Math.abs(viewport.scrollLeft) < 2) {
      viewport.scrollTo({ left: slides.length * width, behavior: "instant" });
    } else if (Math.abs(viewport.scrollLeft - (slides.length + 1) * width) < 2) {
      viewport.scrollTo({ left: width, behavior: "instant" });
    }
  }
  viewport.addEventListener("scrollend", normalizeLoop);
  viewport.addEventListener("scroll", () => {
    if (!("onscrollend" in viewport)) {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(normalizeLoop, 160);
    }
    if (scrollFrame !== null) return;
    scrollFrame = requestAnimationFrame(() => {
      const index = wrapIndex(Math.round(viewport.scrollLeft / viewport.clientWidth) - 1);
      if (index !== currentSlide) updateSlide(index);
      scrollFrame = null;
    });
  }, { passive: true });
  slideshow.addEventListener("keydown", (event) => {
    if (lightbox.classList.contains("active")) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      goToSlide(currentSlide + (event.key === "ArrowRight" ? 1 : -1));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      goToSlide(event.key === "Home" ? 0 : slides.length - 1);
    }
  });
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => goToSlide(currentSlide, false)).observe(viewport);
  } else {
    window.addEventListener("resize", () => goToSlide(currentSlide, false));
  }
  goToSlide(0, false);

  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxCounter = document.getElementById("lightbox-counter");

  const closeButton = document.querySelector(".lightbox-close");
  const prevButton = document.querySelector(".lightbox-prev");
  const nextButton = document.querySelector(".lightbox-next");

  if (
    !galleryImages.length ||
    !lightbox ||
    !lightboxImage ||
    !closeButton ||
    !prevButton ||
    !nextButton
  ) {
    return;
  }

  let currentIndex = 0;
  let touchStartX = 0;

  function showImage(index) {
    currentIndex =
      (index + galleryImages.length) % galleryImages.length;

    const selectedImage = galleryImages[currentIndex];

    lightboxImage.src = selectedImage.src;
    lightboxImage.alt = selectedImage.alt;

    if (lightboxCounter) {
      lightboxCounter.textContent =
        `${currentIndex + 1} / ${galleryImages.length}`;
    }
  }

  function openLightbox(index) {
    showImage(index);

    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      if (lightbox.classList.contains("active")) closeButton.focus();
    });
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";

    lightboxImage.src = "";
    goToSlide(currentIndex, false);
    slides[currentIndex].focus({ preventScroll: true });
  }

  function showPrevious() {
    showImage(currentIndex - 1);
  }

  function showNext() {
    showImage(currentIndex + 1);
  }

  // Open the selected design.
  beforeFirst.addEventListener("click", () => openLightbox(slides.length - 1));
  afterLast.addEventListener("click", () => openLightbox(0));
  galleryImages.forEach((image, index) => {
    image.style.cursor = "zoom-in";

    slides[index].addEventListener("click", () => {
      openLightbox(index);
    });
  });

  // Navigation buttons.
  prevButton.addEventListener("click", (event) => {
    event.stopPropagation();
    showPrevious();
  });

  nextButton.addEventListener("click", (event) => {
    event.stopPropagation();
    showNext();
  });

  // Close button.
  closeButton.addEventListener("click", closeLightbox);

  // Close when clicking the dark background.
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  // Keyboard navigation.
  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("active")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }

    if (event.key === "Tab") {
      const controls = [closeButton, prevButton, nextButton];
      const index = controls.indexOf(document.activeElement);
      event.preventDefault();
      controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
    }
  });

  // Mobile swipe navigation.
  lightbox.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener("touchend", (event) => {
    const touchEndX = event.changedTouches[0].screenX;
    const difference = touchEndX - touchStartX;

    if (Math.abs(difference) < 50) return;

    if (difference > 0) {
      showPrevious();
    } else {
      showNext();
    }
  }, { passive: true });
});
