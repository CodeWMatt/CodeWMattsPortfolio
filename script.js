(function () {
  "use strict";
  const root = document.documentElement;
  const toggle = document.getElementById("modeToggle");
  function applyMode(isDark) {
    root.classList.toggle("dark", isDark);
    toggle.setAttribute("aria-pressed", String(isDark));
  }
  let saved = null;
  try { saved = localStorage.getItem("portfolio-theme-v2"); } catch (e) {}
  applyMode(saved !== "light"); // default = dark
  toggle.addEventListener("click", () => {
    const isDark = !root.classList.contains("dark");
    applyMode(isDark);
    try { localStorage.setItem("portfolio-theme-v2", isDark ? "dark" : "light"); } catch (e) {}
  });

  /* ---------- Pop-ups (Education / Achievements / Contact) ---------- */
  let openModal = null, lastFocus = null;
  function open(name) {
    const m = document.getElementById("modal-" + name);
    if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add("is-open");
    m.setAttribute("aria-hidden", "false");
    openModal = m;
    const x = m.querySelector(".modal-x");
    if (x) x.focus({ preventScroll: true });
  }
  function close() {
    if (!openModal) return;
    openModal.classList.remove("is-open");
    openModal.setAttribute("aria-hidden", "true");
    openModal = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => open(b.dataset.open)));
  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  document.querySelectorAll(".modal").forEach((m) => m.addEventListener("pointerdown", (e) => { if (e.target === m) close(); }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  /* ---------- Pages (Home Page <-> Personal Information) ---------- */
  const PAGES = ["home", "soon"];
  const prevBtn = document.getElementById("pagerPrev");
  const nextBtn = document.getElementById("pagerNext");
  const dots = document.querySelectorAll(".pager-dots i");
  function goPage(name) {
    if (PAGES.indexOf(name) < 0) return;
    const i = PAGES.indexOf(name);
    root.dataset.page = name;
    document.querySelectorAll(".v2-top .nav-link[data-goto]").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.goto === name));
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
    if (prevBtn) prevBtn.disabled = i === 0;
    if (nextBtn) nextBtn.disabled = i === PAGES.length - 1;
    window.scrollTo(0, 0);
  }
  document.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => goPage(b.dataset.goto)));
  if (prevBtn) prevBtn.addEventListener("click", () => goPage(PAGES[Math.max(0, PAGES.indexOf(root.dataset.page) - 1)]));
  if (nextBtn) nextBtn.addEventListener("click", () => goPage(PAGES[Math.min(PAGES.length - 1, PAGES.indexOf(root.dataset.page) + 1)]));
  document.addEventListener("keydown", (e) => {
    if (openModal || /INPUT|TEXTAREA/.test((e.target || {}).tagName || "")) return;
    if (e.key === "ArrowRight" && nextBtn && !nextBtn.disabled) nextBtn.click();
    if (e.key === "ArrowLeft" && prevBtn && !prevBtn.disabled) prevBtn.click();
  });
  goPage("home");

  /* ---------- Project details pop-up (photos + short info) ---------- */
  const PROJECTS = {
    portfolio: { tag: "Project · HTML, CSS, JavaScript", title: "This Portfolio", imgs: ["images/portfolio1.png"],
      text: "Built from scratch with HTML, CSS and JavaScript: a glass interface, a physics-based ID lanyard you can drag, a contact form, and light/dark mode.",
      link: ["GitHub \u25B8", "https://github.com/CodeWMatt"] },
    champion: { tag: "Robotics · Grade 11 · STEM", title: "Robotics Champion", imgs: ["images/shs_robotics1.jpg", "images/shs_robotics2.jpg", "images/shs_robotics3.jpg"],
      text: "Line-tracing robotics competition. In Grade 11, as a STEM student, our team took the championship." },
    runnerup: { tag: "Robotics · Grade 10 · STE", title: "1st Runner-Up", imgs: ["images/jhs_robotics1.jpg", "images/jhs_robotics2.jpg", "images/jhs_robotics3.jpg", "images/jhs_robotics4.jpg"],
      text: "Line-tracing robotics competition. In Grade 10, in the STE program, our team finished as 1st Runner-Up." },
    decoder: { tag: "Project · CircuitVerse · Logic design", title: "Hex 7-Segment Decoder", imgs: ["images/decoder1.png"],
      text: "A 4-bit binary to hexadecimal 7-segment display decoder, built from logic gates in CircuitVerse. It extends my working decimal version." },
    internship: { tag: "80-Hour Internship", title: "Print & Digital Media Production", imgs: ["images/internship.jpg"],
      text: "80 hours of hands-on print and digital media production in a print production studio." }
  };
  const pj = { i: 0, list: [] };
  const pjImg = document.getElementById("pjImg");
  function pjShow(i) {
    if (!pj.list.length) return;
    pj.i = (i + pj.list.length) % pj.list.length;
    pjImg.src = pj.list[pj.i];
    document.getElementById("pjCount").textContent = (pj.i + 1) + " / " + pj.list.length;
    document.querySelectorAll("#pjThumbs button").forEach((b, k) => b.classList.toggle("on", k === pj.i));
  }
  function openProject(key) {
    const d = PROJECTS[key];
    if (!d) return;
    pj.list = d.imgs;
    document.getElementById("pjTag").textContent = d.tag;
    document.getElementById("pjTitle").textContent = d.title;
    document.getElementById("pjText").textContent = d.text;
    const link = document.getElementById("pjLink");
    if (d.link) { link.textContent = d.link[0]; link.href = d.link[1]; } else { link.textContent = ""; link.removeAttribute("href"); }
    const thumbs = document.getElementById("pjThumbs");
    thumbs.innerHTML = "";
    d.imgs.forEach((src, k) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", "Photo " + (k + 1));
      const im = document.createElement("img"); im.src = src; im.alt = "";
      b.appendChild(im); b.addEventListener("click", () => pjShow(k)); thumbs.appendChild(b);
    });
    const multi = d.imgs.length > 1;
    thumbs.style.display = multi ? "flex" : "none";
    document.getElementById("pjPrev").style.display = multi ? "" : "none";
    document.getElementById("pjNext").style.display = multi ? "" : "none";
    document.getElementById("pjCount").style.display = multi ? "" : "none";
    pjShow(0);
    open("project");
  }
  document.querySelectorAll("[data-project]").forEach((b) => b.addEventListener("click", () => openProject(b.dataset.project)));
  document.getElementById("pjPrev").addEventListener("click", () => pjShow(pj.i - 1));
  document.getElementById("pjNext").addEventListener("click", () => pjShow(pj.i + 1));
  document.addEventListener("keydown", (e) => {
    if (!openModal || openModal.id !== "modal-project") return;
    if (e.key === "ArrowRight") pjShow(pj.i + 1);
    if (e.key === "ArrowLeft") pjShow(pj.i - 1);
  });

  /* ---------- Code line typewriter ---------- */
  const codeEl = document.getElementById("codeLine");
  const lines = [
    '> engineer.status = "available for hire";',
    '> stack = ["HTML", "CSS", "JavaScript"];',
    '> build(portfolio).from("scratch");',
    '> internship.complete({ hours: 80 });',
    '> robotics.win("Line Tracing", 1);',
    '> while (learning) { ship(); }'
  ];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let li = 0, ci = 0, del = false, timer = null;
  function tick() {
    if (!codeEl) return;
    const s = lines[li];
    if (!del) {
      ci++; codeEl.textContent = s.slice(0, ci);
      if (ci >= s.length) { del = true; timer = setTimeout(tick, 1800); return; }
      timer = setTimeout(tick, 55);
    } else {
      ci -= 2; if (ci < 0) ci = 0;
      codeEl.textContent = s.slice(0, ci);
      if (ci <= 0) { del = false; li = (li + 1) % lines.length; timer = setTimeout(tick, 350); return; }
      timer = setTimeout(tick, 22);
    }
  }
  window.portfolioStart = function () {
    clearTimeout(timer); li = 0; ci = 0; del = false;
    if (reduce && codeEl) { codeEl.textContent = lines[0]; return; }
    tick();
  };
  // run even if the loader fails for some reason
  setTimeout(() => { if (!timer) window.portfolioStart(); }, 3500);

  /* ---------- Tile spotlight ---------- */
  document.querySelectorAll(".b-tile").forEach((t) => {
    t.addEventListener("pointermove", (e) => {
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", (e.clientX - r.left) + "px");
      t.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Philippine time ---------- */
  const clock = document.getElementById("clockText");
  function tickClock() {
    if (!clock) return;
    try {
      const t = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(new Date());
      clock.textContent = "Baguio, PH · " + t;
    } catch (e) {}
  }
  tickClock(); setInterval(tickClock, 20000);
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
  const hint = document.getElementById("dragHint");
  if (!layer || !card) return;

  const slot = document.getElementById("idSlot");
  const strapA = document.getElementById("strapA");
  const strapB = document.getElementById("strapB");
  const stitchA = document.getElementById("stitchA");
  const stitchB = document.getElementById("stitchB");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- tweak these ---- */
  const ANCHOR_X = 0.75; // (unused in v2: hangs from the ID tile)      // where the lanyard hangs from: 0.75 = 3/4 across the page
  const ANCHOR_SPREAD = 54;   // half the distance between the two strands at the top
  const SEGS = 12;            // points per strand
  const GRAVITY = 0.17;       // pull down (px per step²)
  const DAMPING = 0.9965;     // 1 = never stops swinging
  const ROPE_STIFF = 0.30;    // lower = stretchier rubber band (0–1)
  const MAX_STRETCH = 1.35;   // how far the strap can be pulled (1.35 = 135% of its length)
  const GRAB = 0.38;          // how tightly the card follows the cursor (0–1)
  /* --------------------- */

  const STEP_MS = 1000 / 120;
  let CLIP = 22;            // gap between strap end and card top

  let card0W = 0, card0H = 0, W = 0, H = 0, cardW = 0, cardH = 0, rodLen = 0;
  let restLen = 0, segLen = 0, ax = 0, ay = -14;
  let ropeA = [], ropeB = [], P = null, Q = null;
  let dragging = false, grabT = 0.4, target = { x: 0, y: 0 };
  let last = 0, acc = 0, slotKey = "";

  let u = 1;

  const pt = (x, y, w) => ({ x, y, px: x, py: y, w });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function init() {
    W = layer.clientWidth;
    H = layer.clientHeight;
    if (!W || !H) return;

    const lr = layer.getBoundingClientRect();
    const sr = slot ? slot.getBoundingClientRect() : { left: lr.left + W * 0.75 - 100, top: lr.top, width: 200, height: H * 0.8 };
    slotKey = [Math.round(sr.left - lr.left), Math.round(sr.top - lr.top), Math.round(sr.width), Math.round(sr.height)].join();
    ax = sr.left + sr.width / 2 - lr.left;
    ay = sr.top - lr.top + 6;
    const slotH = sr.height, slotW = sr.width;
    restLen = clamp(slotH * 0.15, 34, 80);
    u = clamp(Math.min((slotH - restLen - 22 * 0.7 - 66) / 322, (slotW * 0.8) / 212), 0.42, 0.95);
    card.style.removeProperty("--u");
    CLIP = 22 * u;
    card0W = card.offsetWidth;
    card0H = card.offsetHeight;
    cardW = card0W * u;
    cardH = card0H * u;
    rodLen = CLIP + cardH;
    const spread = Math.min(ANCHOR_SPREAD * u, slotW * 0.18);
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

    if (hint && slot) {
      hint.style.left = ax + "px";
      hint.style.top = (sr.top - lr.top + slotH - 44) + "px";
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
    const sc = u;
    const width = clamp((16 * sc) / Math.pow(Math.max(ratio, 1), 1.6), 6 * sc, 16 * sc);
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
      "translate(" + (cx - card0W / 2).toFixed(1) + "px," + (cy - card0H / 2).toFixed(1) + "px) rotate(" + angle.toFixed(4) + "rad) scale(" + u.toFixed(3) + ")";
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
    if (hint) hint.classList.add("is-gone");
  });
  card.addEventListener("mousedown", (e) => e.preventDefault());
  card.addEventListener("dragstart", (e) => e.preventDefault());
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
    const lr = layer.getBoundingClientRect();
    let key = "";
    if (slot) { const r = slot.getBoundingClientRect(); key = [Math.round(r.left - lr.left), Math.round(r.top - lr.top), Math.round(r.width), Math.round(r.height)].join(); }
    if (layer.clientWidth !== W || layer.clientHeight !== H || !P || key !== slotKey) init();
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
   Cursor glow — a soft red aura + tiny core with a faint comet trail.
   Kept subtle on purpose. Off on touch screens / reduced motion.
   ============================================================ */
(function () {
  "use strict";
  const old = document.getElementById("cursorBubble");
  if (old) old.style.display = "none";
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9500;";
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener("resize", size);

  const TRAIL_MS = 300;
  const MAX_LEN = 190;
  const trail = [];
  let hx = -200, hy = -200, lastX = -200, lastY = -200, mx = -200, my = -200, ax = -200, ay = -200, seen = false, boost = 0, boostT = 0, out = false;

  function rgb() {
    const cs = getComputedStyle(document.documentElement);
    return [cs.getPropertyValue("--name-grad-1").trim() || "#ff3b4e", cs.getPropertyValue("--name-grad-2").trim() || "#ff8a6b"];
  }
  let cols = rgb();
  new MutationObserver(() => { cols = rgb(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; ax = mx; ay = my; hx = mx; hy = my; lastX = mx; lastY = my; }
    out = false;
    const hot = e.target && e.target.closest && e.target.closest("a, button, .id-card, .b-link, input, textarea");
    boostT = hot ? 1 : 0;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { out = true; });
  document.addEventListener("mouseleave", () => { out = true; });

  function frame(now) {
    requestAnimationFrame(frame);
    ctx.clearRect(0, 0, W, H);
    if (!seen || out) return;
    ax = mx; ay = my;
    boost += (boostT - boost) * 0.15;
    const dark = document.documentElement.classList.contains("dark");

    // soft aura (very low opacity)
    const R = 90 + boost * 16;
    const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, R);
    const a0 = (dark ? 0.07 : 0.05) + boost * 0.02;
    g.addColorStop(0, hexA(cols[0], a0));
    g.addColorStop(0.5, hexA(cols[0], a0 * 0.35));
    g.addColorStop(1, hexA(cols[0], 0));
    ctx.fillStyle = g;
    ctx.fillRect(ax - R, ay - R, R * 2, R * 2);

    // comet trail: one point per frame from a lightly smoothed head, tapered, short and soft
    hx = mx; hy = my;
    const moved = Math.hypot(hx - lastX, hy - lastY);
    if (moved > 0.4) { trail.push({ x: hx, y: hy, t: now }); lastX = hx; lastY = hy; }
    while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
    let len = 0;
    for (let i = trail.length - 1; i > 0 && len < MAX_LEN; i--) len += Math.hypot(trail[i].x - trail[i - 1].x, trail[i].y - trail[i - 1].y);
    if (len >= MAX_LEN) { // trim the oldest points so the tail never gets long and stringy
      let acc = 0, keep = trail.length - 1;
      for (let i = trail.length - 1; i > 0; i--) { acc += Math.hypot(trail[i].x - trail[i - 1].x, trail[i].y - trail[i - 1].y); if (acc > MAX_LEN) { keep = i; break; } }
      trail.splice(0, keep);
    }
    if (trail.length > 3) {
      // one smooth tapered ribbon (no beads): offset both sides of the path, curve through midpoints, fill with a gradient
      const n = trail.length, L = [], R = [];
      for (let i = 0; i < n; i++) {
        const p = trail[i], q = trail[Math.min(n - 1, i + 1)], o = trail[Math.max(0, i - 1)];
        let dx = q.x - o.x, dy = q.y - o.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
        const f = i / (n - 1), life = Math.max(0, 1 - (now - p.t) / TRAIL_MS);
        const w = 3.4 * Math.pow(f, 1.25) * (0.35 + 0.65 * life);
        L.push({ x: p.x - dy * w, y: p.y + dx * w }); R.push({ x: p.x + dy * w, y: p.y - dx * w });
      }
      const smooth = (pts, rev) => {
        const s = rev ? pts.slice().reverse() : pts;
        for (let i = 1; i < s.length - 1; i++) {
          const mx2 = (s[i].x + s[i + 1].x) / 2, my2 = (s[i].y + s[i + 1].y) / 2;
          ctx.quadraticCurveTo(s[i].x, s[i].y, mx2, my2);
        }
        ctx.lineTo(s[s.length - 1].x, s[s.length - 1].y);
      };
      const t0 = trail[0], t1 = trail[n - 1];
      const gr = ctx.createLinearGradient(t0.x, t0.y, t1.x, t1.y);
      gr.addColorStop(0, hexA(cols[0], 0));
      gr.addColorStop(0.6, hexA(cols[0], 0.28));
      gr.addColorStop(1, hexA(cols[1], 0.75));
      ctx.beginPath();
      ctx.moveTo(L[0].x, L[0].y);
      smooth(L, false);
      smooth(R, true);
      ctx.closePath();
      ctx.fillStyle = gr;
      ctx.shadowColor = hexA(cols[0], 0.5); ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // tiny core
    const r = 2.6 + boost * 1.6;
    ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fillStyle = dark ? "rgba(255,255,255,0.9)" : "rgba(30,30,35,0.85)";
    ctx.shadowColor = cols[0]; ctx.shadowBlur = 9; ctx.fill(); ctx.shadowBlur = 0;
  }

  function mixc(c1, c2, t) {
    const p = (c) => { c = c.trim(); if (c.length === 4) c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    try { const a = p(c1), b = p(c2); return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join(""); } catch (e) { return c1; }
  }
  function hexA(c, a) {
    c = c.trim();
    if (c[0] === "#") {
      if (c.length === 4) c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      const n = parseInt(c.slice(1), 16);
      return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a.toFixed(3) + ")";
    }
    const m = c.match(/[\d.]+/g);
    return m ? "rgba(" + m[0] + "," + m[1] + "," + m[2] + "," + a.toFixed(3) + ")" : "rgba(255,59,78," + a + ")";
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
  const go = () => run("Matt Lopez", reduceMotion ? 300 : 2100, () => {
    if (window.portfolioStart) window.portfolioStart();
  }, "Loading portfolio");
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]).then(go);
  } else {
    go();
  }
})();



/* ============================================================
   Contact form
   Sends through Web3Forms (free) straight to your inbox.
   1) Go to https://web3forms.com, enter mattlaurenceuc@gmail.com
   2) Copy the Access Key they email you and paste it below.
   Until a key is set, the Send button opens the visitor's email
   app with the message filled in, so nothing is ever lost.
   ============================================================ */
(function () {
  "use strict";

  const WEB3FORMS_KEY = "";                       // <- paste your access key between the quotes
  const MY_EMAIL = "mattlaurenceuc@gmail.com";

  const card = document.getElementById("contactCard");
  const form = document.getElementById("contactForm");
  if (!card || !form) return;

  const email = document.getElementById("cfEmail");
  const message = document.getElementById("cfMessage");
  const count = document.getElementById("cfCount");
  const sendBtn = document.getElementById("cfSend");
  const status = document.getElementById("cfStatus");
  const doneText = document.getElementById("cfDoneText");
  const again = document.getElementById("cfAgain");
  const bot = document.getElementById("cfBot");
  const doneTitle = card.querySelector(".contact-done h3");

  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function setError(input, text) {
    const field = input.closest(".field");
    field.classList.toggle("has-error", !!text);
    field.querySelector(".field-error").textContent = text || "";
  }

  message.addEventListener("input", () => {
    count.textContent = message.value.length + " / " + message.maxLength;
    if (message.value.trim()) setError(message, "");
  });
  email.addEventListener("input", () => { if (emailOk(email.value.trim())) setError(email, ""); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";

    const em = email.value.trim();
    const msg = message.value.trim();
    let bad = false;
    if (!emailOk(em)) { setError(email, "Please enter a valid email address."); bad = true; }
    if (msg.length < 5) { setError(message, "Please write a short message."); bad = true; }
    if (bad) return;
    if (bot.checked) return; // spam trap

    sendBtn.classList.add("is-sending");

    try {
      if (WEB3FORMS_KEY) {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: "New message from your portfolio",
            from_name: "Portfolio contact form",
            email: em,
            message: msg,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed");
        doneTitle.textContent = "Message sent!";
        doneText.textContent = "Thank you for reaching out. I\u2019ll reply to your email soon.";
      } else {
        // no key yet: hand the message to the visitor's email app
        const url = "mailto:" + MY_EMAIL +
          "?subject=" + encodeURIComponent("Portfolio message from " + em) +
          "&body=" + encodeURIComponent(msg + "\n\n\u2014 " + em);
        await new Promise((r) => setTimeout(r, 700));
        window.location.href = url;
        doneTitle.textContent = "Almost there!";
        doneText.textContent = "Your email app should open with the message ready. Just press send there.";
      }
      card.classList.add("is-sent");
    } catch (err) {
      status.textContent = "Couldn\u2019t send right now. Please try again, or email me directly below.";
    } finally {
      sendBtn.classList.remove("is-sending");
    }
  });

  again.addEventListener("click", () => {
    form.reset();
    count.textContent = "0 / " + message.maxLength;
    card.classList.remove("is-sent");
    email.focus();
  });
})();