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

  window.portfolioGo = goToView;

  const PAGE_NAMES = { home: "Home", about: "About Me", education: "Education", achievements: "Achievements", family: "Family", batchmates: "Batchmates" };

  triggers.forEach((el) => {
    el.addEventListener("click", () => {
      const name = el.dataset.viewTarget;
      const current = document.querySelector(".view.is-active");
      if (current && current.dataset.view === name) return;
      if (window.portfolioLoader) {
        window.portfolioLoader.run(PAGE_NAMES[name] || name, 950, () => goToView(name, true));
      } else {
        goToView(name, true);
      }
    });
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


/* ============================================================
   Lanyard + ID card (home page)
   Verlet rope physics: two soft strands meet at the card's clip.
   Drag the card — the strands stretch like rubber, then snap back
   and the card swings.
   ============================================================ */
(function () {
  "use strict";

  const layer = document.getElementById("lanyardLayer");
  const card = document.getElementById("idCard");
  if (!layer || !card) return;

  const homeView = document.getElementById("view-home");
  const strapA = document.getElementById("strapA");
  const strapB = document.getElementById("strapB");
  const stitchA = document.getElementById("stitchA");
  const stitchB = document.getElementById("stitchB");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- tweak these ---- */
  const ANCHOR_X = 0.75;      // where the lanyard hangs from: 0.75 = 3/4 across the page
  const ANCHOR_SPREAD = 62;   // half the distance between the two strands at the top
  const SEGS = 12;            // points per strand
  const GRAVITY = 0.17;       // pull down (px per step²)
  const DAMPING = 0.9965;     // 1 = never stops swinging
  const ROPE_STIFF = 0.30;    // lower = stretchier rubber band (0–1)
  const MAX_STRETCH = 1.35;   // how far the strap can be pulled (1.35 = 135% of its length)
  const GRAB = 0.38;          // how tightly the card follows the cursor (0–1)
  /* --------------------- */

  const STEP_MS = 1000 / 120;
  const CLIP = 22;            // gap between strap end and card top

  let W = 0, H = 0, cardW = 0, cardH = 0, rodLen = 0;
  let restLen = 0, segLen = 0, ax = 0, ay = -14;
  let ropeA = [], ropeB = [], P = null, Q = null;
  let dragging = false, grabT = 0.4, target = { x: 0, y: 0 };
  let last = 0, acc = 0;

  const pt = (x, y, w) => ({ x, y, px: x, py: y, w });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function init() {
    W = layer.clientWidth;
    H = layer.clientHeight;
    if (!W || !H) return;

    cardW = card.offsetWidth;
    cardH = card.offsetHeight;
    rodLen = CLIP + cardH;

    ax = W * ANCHOR_X;
    restLen = clamp(H * 0.5, 260, 480);

    const spread = Math.min(ANCHOR_SPREAD, W * 0.12);
    const diag = Math.sqrt(restLen * restLen + spread * spread);
    segLen = diag / SEGS;

    P = pt(ax, ay + restLen, 0.3);
    Q = pt(ax, P.y + rodLen, 0.3);

    ropeA = [];
    ropeB = [];
    for (let i = 0; i <= SEGS; i++) {
      const f = i / SEGS;
      const y = ay + (P.y - ay) * f;
      if (i === SEGS) {
        ropeA.push(P);
        ropeB.push(P);
      } else {
        ropeA.push(pt(ax - spread + spread * f, y, i === 0 ? 0 : 1));
        ropeB.push(pt(ax + spread - spread * f, y, i === 0 ? 0 : 1));
      }
    }

    // a small starting push so it sways gently when the page opens
    if (!reduceMotion) {
      Q.px = Q.x - 7;
      P.px = P.x - 2;
    }
  }

  let damp = DAMPING;

  function integrate(p) {
    if (p.w === 0) return;
    let vx = (p.x - p.px) * damp;
    let vy = (p.y - p.py) * damp;
    const sp = Math.hypot(vx, vy);
    if (sp > 36) { vx *= 36 / sp; vy *= 36 / sp; }
    p.px = p.x;
    p.py = p.y;
    p.x += vx;
    p.y += vy + GRAVITY;
  }

  function constrain(a, b, rest, stiff, slack) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 0.0001;
    const wSum = a.w + b.w;
    if (!wSum) return;
    if (slack && d < rest) return; // a strap can pull, but it can't push
    const diff = ((d - rest) / d) * stiff;
    a.x += dx * diff * (a.w / wSum);
    a.y += dy * diff * (a.w / wSum);
    b.x -= dx * diff * (b.w / wSum);
    b.y -= dy * diff * (b.w / wSum);
  }

  function pullGrabbedPoint() {
    // move the grabbed spot on the card toward the cursor (clamped so the strap
    // can only stretch so far)
    const t = grabT;
    const gx = P.x + (Q.x - P.x) * t;
    const gy = P.y + (Q.y - P.y) * t;

    const maxReach = restLen * MAX_STRETCH + rodLen * t;
    let tx = target.x, ty = target.y;
    const dx = tx - ax, dy = ty - ay;
    const dist = Math.hypot(dx, dy);
    if (dist > maxReach) {
      // beyond the limit: resist (rubber band) — only a fraction of the extra distance gets through
      const over = dist - maxReach;
      const eased = maxReach + over * 0.12;
      tx = ax + (dx / dist) * eased;
      ty = ay + (dy / dist) * eased;
    }

    const ddx = (tx - gx) * GRAB;
    const ddy = (ty - gy) * GRAB;
    const D = (1 - t) * (1 - t) + t * t;
    P.x += ((1 - t) * ddx) / D;
    P.y += ((1 - t) * ddy) / D;
    Q.x += (t * ddx) / D;
    Q.y += (t * ddy) / D;
  }

  function step() {
    // the more the strap is stretched, the more energy it loses on the way back
    const stretch = ropeLength(ropeA) / (segLen * SEGS);
    damp = DAMPING - clamp((stretch - 1.03) * 0.25, 0, 0.10);

    for (let i = 1; i < ropeA.length - 1; i++) { integrate(ropeA[i]); integrate(ropeB[i]); }
    integrate(P);
    integrate(Q);

    if (dragging) pullGrabbedPoint();

    for (let it = 0; it < 6; it++) {
      for (let i = 0; i < SEGS; i++) {
        constrain(ropeA[i], ropeA[i + 1], segLen, ROPE_STIFF, true);
        constrain(ropeB[i], ropeB[i + 1], segLen, ROPE_STIFF, true);
      }
      constrain(P, Q, rodLen, 1); // the card itself is rigid
    }
  }

  function pathFor(rope) {
    let d = "M" + rope[0].x.toFixed(1) + " " + rope[0].y.toFixed(1);
    for (let i = 1; i < rope.length - 1; i++) {
      const mx = (rope[i].x + rope[i + 1].x) / 2;
      const my = (rope[i].y + rope[i + 1].y) / 2;
      d += " Q" + rope[i].x.toFixed(1) + " " + rope[i].y.toFixed(1) + " " + mx.toFixed(1) + " " + my.toFixed(1);
    }
    const e = rope[rope.length - 1];
    d += " L" + e.x.toFixed(1) + " " + e.y.toFixed(1);
    return d;
  }

  function ropeLength(rope) {
    let L = 0;
    for (let i = 0; i < rope.length - 1; i++) {
      L += Math.hypot(rope[i + 1].x - rope[i].x, rope[i + 1].y - rope[i].y);
    }
    return L;
  }

  function render() {
    const dA = pathFor(ropeA), dB = pathFor(ropeB);
    strapA.setAttribute("d", dA);
    strapB.setAttribute("d", dB);
    stitchA.setAttribute("d", dA);
    stitchB.setAttribute("d", dB);

    // the strap gets thinner the more it is stretched, like real rubber
    const ratio = ropeLength(ropeA) / (segLen * SEGS);
    const width = clamp(16 / Math.pow(Math.max(ratio, 1), 1.6), 6, 16);
    strapA.style.strokeWidth = width;
    strapB.style.strokeWidth = width;
    stitchA.style.strokeWidth = Math.max(0.8, width * 0.1);
    stitchB.style.strokeWidth = Math.max(0.8, width * 0.1);

    const vx = Q.x - P.x, vy = Q.y - P.y;
    const len = Math.hypot(vx, vy) || 1;
    const ux = vx / len, uy = vy / len;
    const off = CLIP + cardH / 2;
    const cx = P.x + ux * off;
    const cy = P.y + uy * off;
    const angle = Math.atan2(-ux, uy);

    card.style.transform =
      "translate(" + (cx - cardW / 2).toFixed(1) + "px," + (cy - cardH / 2).toFixed(1) + "px) rotate(" + angle.toFixed(4) + "rad)";
  }

  function toLayer(e) {
    const r = layer.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  card.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    card.setPointerCapture(e.pointerId);
    const m = toLayer(e);
    const vx = Q.x - P.x, vy = Q.y - P.y;
    const t = ((m.x - P.x) * vx + (m.y - P.y) * vy) / (vx * vx + vy * vy || 1);
    grabT = clamp(t, 0.15, 0.95);
    target = m;
    dragging = true;
    card.classList.add("is-dragging");
  });
  card.addEventListener("pointermove", (e) => {
    if (dragging) target = toLayer(e);
  });
  function release() {
    if (!dragging) return;
    dragging = false;
    card.classList.remove("is-dragging");
  }
  card.addEventListener("pointerup", release);
  card.addEventListener("pointercancel", release);
  card.addEventListener("lostpointercapture", release);

  function frame(now) {
    requestAnimationFrame(frame);
    if (!homeView || !homeView.classList.contains("is-active")) { last = 0; return; }

    if (layer.clientWidth !== W || layer.clientHeight !== H || !P) init();
    if (!P) return;

    if (!last) last = now;
    acc += Math.min(now - last, 50);
    last = now;
    while (acc >= STEP_MS) { step(); acc -= STEP_MS; }
    render();
  }

  init();
  requestAnimationFrame(frame);
})();


/* ============================================================
   Cursor bubble — a glass bubble that glides after the mouse
   ============================================================ */
(function () {
  "use strict";

  const bubble = document.getElementById("cursorBubble");
  if (!bubble) return;
  // touch screens have no cursor to follow
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- tweak these ---- */
  const SIZE = 32;          // keep in sync with .cursor-bubble width/height in style.css
  const FOLLOW = 0.16;      // 1 = glued to the cursor, lower = lazier, more floaty
  const HOVER_SCALE = 1.5;  // how much it grows over buttons, links and tiles
  const PRESS_SCALE = 0.8;  // how much it shrinks while you hold the mouse down
  /* --------------------- */

  const INTERACTIVE = "a, button, .tile, .id-card, .nav-link, [role='button']";

  let mx = -100, my = -100;   // real cursor
  let x = -100, y = -100;     // bubble
  let scale = 1, targetScale = 1;
  let seen = false, pressed = false, overInteractive = false;

  function updateScale() {
    targetScale = pressed ? PRESS_SCALE : overInteractive ? HOVER_SCALE : 1;
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    mx = e.clientX;
    my = e.clientY;
    if (!seen) {
      // first move: appear right under the cursor instead of flying in from the corner
      x = mx; y = my; seen = true;
      bubble.classList.add("is-visible");
    }
    overInteractive = !!(e.target.closest && e.target.closest(INTERACTIVE));
    updateScale();
  }, { passive: true });

  window.addEventListener("pointerdown", () => { pressed = true; updateScale(); });
  window.addEventListener("pointerup", () => { pressed = false; updateScale(); });
  document.documentElement.addEventListener("mouseleave", () => bubble.classList.remove("is-visible"));
  document.documentElement.addEventListener("mouseenter", () => { if (seen) bubble.classList.add("is-visible"); });

  function frame() {
    requestAnimationFrame(frame);
    const k = reduceMotion ? 1 : FOLLOW;
    x += (mx - x) * k;
    y += (my - y) * k;
    scale += (targetScale - scale) * (reduceMotion ? 1 : 0.2);
    bubble.style.transform =
      "translate3d(" + (x - SIZE / 2).toFixed(1) + "px," + (y - SIZE / 2).toFixed(1) + "px,0) scale(" + scale.toFixed(3) + ")";
  }
  requestAnimationFrame(frame);
})();



/* ============================================================
   Loading screen — letters spin through random characters and
   lock in one by one. Runs on first load and between pages.
   ============================================================ */
(function () {
  "use strict";

  const loader = document.getElementById("loader");
  const textEl = document.getElementById("loaderText");
  const fillEl = document.getElementById("loaderFill");
  const pctEl = document.getElementById("loaderPct");
  const labelEl = document.getElementById("loaderLabel");
  if (!loader || !textEl) return;

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%&@*+<>/{}";
  const SPIN_MS = 45;     // how fast letters flicker
  const randChar = () => POOL[Math.floor(Math.random() * POOL.length)];

  let busy = false;

  function build(text) {
    textEl.innerHTML = "";
    return Array.from(text).map((c) => {
      const s = document.createElement("span");
      s.className = "ch" + (c === " " ? " is-space" : "");
      s.textContent = c === " " ? "\u00A0" : randChar();
      textEl.appendChild(s);
      return { el: s, target: c };
    });
  }

  // run(text, duration, midpoint) — midpoint fires once the text has fully
  // decoded, then the screen fades out.
  function run(text, duration, onDone, label) {
    if (busy) return;
    busy = true;
    root.classList.add("is-loading");
    labelEl.textContent = label || "Loading";
    fillEl.style.width = "0%";
    pctEl.textContent = "0%";
    const chars = build(text);
    loader.classList.add("is-on");

    const lockWindow = duration * 0.78;               // last letter locks here
    const lockAt = chars.map((_, i) => 160 + (lockWindow - 160) * (i / Math.max(chars.length - 1, 1)) + Math.random() * 90);
    const start = performance.now();
    let lastSpin = 0;

    function frame(now) {
      const t = now - start;
      const doSpin = now - lastSpin >= SPIN_MS;
      if (doSpin) lastSpin = now;

      chars.forEach((c, i) => {
        if (c.done) return;
        if (c.target === " ") { c.done = true; return; }
        if (reduceMotion || t >= lockAt[i]) {
          c.el.textContent = c.target;
          c.el.classList.add("is-set");
          c.done = true;
        } else if (doSpin) {
          c.el.textContent = randChar();
        }
      });

      const p = Math.min(100, Math.round((t / duration) * 100));
      fillEl.style.width = p + "%";
      pctEl.textContent = p + "%";

      if (t < duration) {
        requestAnimationFrame(frame);
      } else {
        chars.forEach((c) => { c.el.textContent = c.target === " " ? "\u00A0" : c.target; c.el.classList.add("is-set"); });
        fillEl.style.width = "100%";
        pctEl.textContent = "100%";
        if (onDone) onDone();
        setTimeout(() => {
          loader.classList.remove("is-on");
          root.classList.remove("is-loading");
          setTimeout(() => { busy = false; }, 450);
        }, 260);
      }
    }
    requestAnimationFrame(frame);
  }

  window.portfolioLoader = { run: (t, d, cb) => run(t, d, cb, "Loading page") };

  // first load: wait for fonts so the text doesn't jump, then play
  root.classList.add("is-loading");
  const go = () => run("CodeWMatt", reduceMotion ? 300 : 2100, () => {
    if (window.portfolioGo) window.portfolioGo("home", false); // restart the typing under the screen
  }, "Loading portfolio");
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]).then(go);
  } else {
    go();
  }
})();
