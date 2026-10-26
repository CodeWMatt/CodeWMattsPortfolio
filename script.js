(function () {
  "use strict";

  /* ---------- Dark / Light mode ---------- */
  const root = document.documentElement;
  const toggle = document.getElementById("modeToggle");

  function applyMode(isDark) {
    root.classList.toggle("dark", isDark);
    toggle.setAttribute("aria-pressed", String(isDark));
  }

  const saved = localStorage.getItem("portfolio-theme");
  applyMode(saved === "dark"); // default = light unless explicitly saved as dark

  toggle.addEventListener("click", () => {
    const isDark = !root.classList.contains("dark");
    applyMode(isDark);
    localStorage.setItem("portfolio-theme", isDark ? "dark" : "light");
  });

  /* ---------- Typing effect for names (continuous loop) ---------- */
  const typeTargets = document.querySelectorAll(".type-target");
  typeTargets.forEach((el) => {
    el.dataset.fullText = el.textContent.trim();
  });
  const typeTimers = new WeakMap();

  function startTyping(el, options) {
    if (!el) return;
    const opts = options || {};
    const speed = opts.speed || 65;        // ms per typed character
    const deleteSpeed = opts.deleteSpeed || 38; // ms per deleted character
    const pauseFull = opts.pauseFull != null ? opts.pauseFull : 1500; // pause once fully typed
    const pauseEmpty = opts.pauseEmpty != null ? opts.pauseEmpty : 500; // pause once fully erased
    const full = el.dataset.fullText || el.textContent.trim();

    // cancel any loop already running on this element
    if (typeTimers.has(el)) clearTimeout(typeTimers.get(el));

    el.classList.add("is-typing");
    let i = 0;
    let deleting = false;

    function step() {
      if (!deleting) {
        i += 1;
        el.textContent = full.slice(0, i);
        if (i >= full.length) {
          deleting = true;
          typeTimers.set(el, setTimeout(step, pauseFull));
          return;
        }
        typeTimers.set(el, setTimeout(step, speed));
      } else {
        i -= 1;
        el.textContent = full.slice(0, i);
        if (i <= 0) {
          deleting = false;
          typeTimers.set(el, setTimeout(step, pauseEmpty));
          return;
        }
        typeTimers.set(el, setTimeout(step, deleteSpeed));
      }
    }
    step();
  }

  /* ---------- View switching (dashboard tiles + nav) ---------- */
  const views = document.querySelectorAll(".view");
  const navLinks = document.querySelectorAll(".nav-link");
  const triggers = document.querySelectorAll("[data-view-target]");
  const navSlider = document.querySelector(".nav-slider");

  function moveSlider(name, animate) {
    const activeLink = document.querySelector(`.nav-link[data-view-target="${name}"]`);
    const navPill = document.querySelector(".nav-pill");
    if (!activeLink || !navSlider || !navPill) return;

    const linkRect = activeLink.getBoundingClientRect();
    const pillRect = navPill.getBoundingClientRect();
    const offsetX = linkRect.left - pillRect.left;

    navSlider.style.transition = animate ? "" : "none";
    navSlider.style.width = linkRect.width + "px";
    navSlider.style.transform = `translateX(${offsetX}px)`;

    if (!animate) {
      // force the "no transition" style to apply before re-enabling it
      navSlider.offsetHeight; // eslint-disable-line no-unused-expressions
      navSlider.style.transition = "";
    }
  }

  function goToView(name, animateSlider) {
    views.forEach((v) => v.classList.toggle("is-active", v.dataset.view === name));
    navLinks.forEach((l) =>
      l.classList.toggle("is-active", l.dataset.viewTarget === name)
    );
    moveSlider(name, animateSlider);
    window.scrollTo(0, 0);

    if (name === "home") {
      startTyping(document.getElementById("homeTypeTarget"));
    } else if (name === "about") {
      startTyping(document.getElementById("aboutTypeTarget"));
    }
  }

  triggers.forEach((el) => {
    el.addEventListener("click", () => goToView(el.dataset.viewTarget, true));
  });

  // keep the slider aligned if the window is resized (link widths can change)
  window.addEventListener("resize", () => {
    const active = document.querySelector(".nav-link.is-active");
    if (active) moveSlider(active.dataset.viewTarget, false);
  });

  // start on home (no animation on first paint)
  goToView("home", false);

  // The entrance animation on .tile touches `transform`, and CSS animations
  // out-rank CSS transitions on the same property — so hover scaling never
  // took effect while the animation was still "holding" its end frame.
  // Stripping the animation off after it finishes hands `transform` back
  // to the hover transition.
  document.querySelectorAll(".tile").forEach((tile) => {
    tile.addEventListener("animationend", () => {
      tile.style.animation = "none";
    });
  });

  // Google Fonts load async — once they're ready, text widths can shift.
  // Recalculate the slider so it lines up with the final rendered width.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      const active = document.querySelector(".nav-link.is-active");
      if (active) moveSlider(active.dataset.viewTarget, false);
    });
  }
})();