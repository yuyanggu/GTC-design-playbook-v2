/* ============================================================================
   GTC — The Design Playbook · home v2 motion
   Load: clouds drift, the pinwheel rises in + aligns to the lockup (wind spin).
   Scroll: the lockup/pinwheel group lifts, the arrow fades, the section books
   rise in and settle flush to the bottom. (Books reuse the menu book system.)
   GSAP + ScrollTrigger + ScrollSmoother. The menu overlay code stays for the
   chapter pages and no-ops here (no #menu on the home).
   ========================================================================== */

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
// ScrollSmoother (page smooth-scroll) + CustomEase/CustomWiggle are vendored (free).
gsap.registerPlugin(...[ScrollTrigger, window.ScrollSmoother, window.CustomEase, window.CustomWiggle].filter(Boolean));

const root = document.documentElement;
root.classList.add("js");

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const arrow = document.querySelector("#arrow");

// The load-in timeline (pinwheel rise → spin beat → align + reveal). Completed on the
// first scroll so the scroll sequence never fights an in-flight entrance.
let loadTl = null;

// The pinwheel traveler's proxy (rise/align/scrolled) — owned by pinwheelScene, driven
// on scroll by heroScene's master (it tweens `.scrolled` to glide the pinwheel UP to the
// after-scroll header slot). Shared because the two scenes are separate functions.
let pinwheelProx = null;

// Home book + spine elements (parked below the fold by homeBooks; their rise-in is
// authored into heroScene's one-shot master timeline).
let hbBooks = [];
let hbSpines = [];

// ScrollSmoother instance (the menu does NOT touch it — it just hard-locks page scroll
// via documentElement overflow while open, to avoid smoother/menu interaction bugs).
let smoother = null;

/* ============================================================================
   0 · Smooth scrolling (GSAP ScrollSmoother) — wraps #smooth-content; the pinned
   hero rides inside it, the fixed pinwheel stays outside. Subtle (smooth:1).
   The LANDING page (the only page with #hero) opts OUT of the smoother entirely so
   its scroll is native + 1:1 (no catch-up lag): the hero/pinwheel pins fall back to
   native pinning, the pinwheel traveler reads live rects either way, and index.html
   has no #menu, so nothing there depends on `smoother`. Chapter pages + the reader
   keep the smoother (their TOC/panel pins need its transform — see chapter.js).
   ========================================================================== */
function smoothScroll() {
  if (reduce || !window.ScrollSmoother) return;
  if (document.querySelector("#hero")) return;   // landing page → native scroll, no lag
  smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1,        // subtle catch-up
    smoothTouch: 0,   // native scrolling on touch devices
    effects: false,
  });
}

/* ---- Arrow idle bob (independent of scroll opacity) ---- */
function arrowBob() {
  if (reduce || !arrow) return;
  gsap.to(arrow, { y: 9, duration: 1.15, repeat: -1, yoyo: true, ease: "sine.inOut" });
}

/* ---- Clouds: a one-direction "sky" drift — every cloud flows LEFT → RIGHT at its
       own (widely staggered) speed, wrapping off the right edge and re-entering from
       the left. It does NOT pop at the boundary: each cloud's opacity is driven by its
       position so it fades OUT as it slides off the right and fades back IN as it
       enters from the left (the wrap happens while it's invisible). A gentle scale
       "breathe" adds depth. Opacity = (load-in `--enter`, staggered by pinwheelScene's
       loadTl) × (edge fade) so the two never fight. Rebuilt on resize. ---- */
let cloudTweens = [];
function cloudDrift() {
  if (reduce) return;   // reduced motion: clouds stay static + visible (CSS opacity)

  function build() {
    cloudTweens.forEach((t) => t.kill());
    cloudTweens = [];
    const vw = window.innerWidth;
    const clouds = gsap.utils.toArray(".cloud");
    clouds.forEach((c, i) => {
      // Reset x so getBoundingClientRect reads the cloud's resting (CSS) left edge.
      // opacity 0 + --enter 0: hidden until the load-in raises --enter (no flash).
      gsap.set(c, { x: 0, opacity: 0, "--enter": 0, transformOrigin: "50% 50%" });
      const r = c.getBoundingClientRect();
      const L = r.left, W = r.width;
      // Travel band: min = fully off-left (right edge at 0), max = fully off-right
      // (left edge at vw). wrap() loops x seamlessly across that band.
      const min = -(L + W), max = vw - L, range = max - min;
      const wrap = gsap.utils.unitize(gsap.utils.wrap(min, max));
      // Fade over ~one cloud-width of travel at each edge → dissolves while crossing
      // off/on screen rather than snapping. mFrac = that distance as a fraction of band.
      const mFrac = Math.min(0.45, (W * 1.1) / range);
      const edgeFade = () => {
        const p = (gsap.getProperty(c, "x") - min) / range;          // 0..1 across band
        const e = gsap.utils.clamp(0, 1, Math.min(p, 1 - p) / mFrac); // ramp at both ends
        gsap.set(c, { opacity: (gsap.getProperty(c, "--enter") || 0) * e });
      };
      // Widely staggered speeds: spread durations across the range by index, + jitter,
      // so no two clouds share a pace (longer duration = slower).
      const dur = gsap.utils.mapRange(0, clouds.length - 1, 22, 64, i) + gsap.utils.random(-4, 4);
      const xTween = gsap.to(c, { x: "+=" + range, duration: dur, ease: "none", repeat: -1, modifiers: { x: wrap }, onUpdate: edgeFade });
      // Gentle scale breathing, on its own slow clock so the sky never repeats.
      const scaleTween = gsap.to(c, { scale: gsap.utils.random(1.08, 1.2), duration: gsap.utils.random(7, 12), ease: "sine.inOut", repeat: -1, yoyo: true });
      // Seed starting positions: give each cloud its own evenly-spaced slice of the band
      // (+ jitter) so they're spread across the sky from frame one instead of bunched at
      // their CSS resting points; desync the breathe phase too for a livelier sky.
      xTween.seek(((i + gsap.utils.random(0, 1)) / clouds.length) * dur, false);
      scaleTween.seek(gsap.utils.random(0, scaleTween.duration()));
      cloudTweens.push(xTween, scaleTween);
    });
  }

  build();
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 200); });
}

/* ============================================================================
   2 · Scroll scene — ONE-SHOT on first scroll: arrow out fast → group lifts up
       → books rise in and settle. Timed (not scrubbed); reverses at the very top.
   ========================================================================== */
function heroScene() {
  const hero = document.querySelector("#hero");
  const row = document.querySelector("#lockupRow");
  if (!hero || !row) return;        // hero-only scene; absent on chapter pages

  // GSAP owns the row's transform. x:0/y:0 clears any px GSAP parsed from the CSS
  // translate(-50%,-50%) so xPercent/yPercent don't stack into a double-shift.
  gsap.set(row, { x: 0, y: 0, xPercent: -50, yPercent: -50 });

  if (reduce) return;               // static layout (books shown settled by homeBooks)

  // GSAP owns the reveal's hidden start states (so its cache matches the DOM and the
  // master can animate / reverse them cleanly — a bare CSS start fights GSAP's cleanup).
  // The header line-clip uses px `y` (each span pushed below its clipped line): GSAP's
  // percent-unit transform cache leaves a stale inline px value that won't re-render.
  const headSpans = gsap.utils.toArray(".intro__head .line > span");
  headSpans.forEach((s) => gsap.set(s, { y: Math.ceil(s.parentElement.getBoundingClientRect().height) + 2 }));
  gsap.set(".home-logo", { autoAlpha: 0, y: -8 });
  gsap.set(".intro__body p", { autoAlpha: 0, y: 18 });

  const mm = gsap.matchMedia();

  // ── Desktop / fine pointer: timed play-once (unchanged behavior) ──────────────
  // NOTE: the cover/pinwheel/logo/body/shelf tween defs below are intentionally mirrored
  // in the coarse branch — keep the two in sync when editing eases/durations/offsets.
  mm.add("(pointer: fine)", () => {
    // The whole transition as one timed timeline (played once on scroll, reversible).
    const master = gsap.timeline({ paused: true });
    master
      .to("#arrow", { autoAlpha: 0, duration: 0.28, ease: "power2.in" }, 0)
      .to([".eyebrow--top", ".lockup"], { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0.04);
    if (pinwheelProx) master.to(pinwheelProx, { scrolled: 1, duration: 0.95, ease: "power3.inOut" }, 0.1);
    master
      .to(".home-logo", { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.4)
      .to(".intro__body p", { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.14, ease: "power2.out" }, 0.78);
    hbSpines.forEach((s, i) => master.to(s, { y: 0, duration: 0.55, ease: "power2.out" }, 0.5 + i * 0.05));
    hbBooks.forEach((b, i) => {
      master
        .to(b, { y: 0, duration: 0.62, ease: "back.out(1.3)" }, 0.6 + i * 0.08)
        .to(b, { rotation: 0, duration: 1.0, ease: "elastic.out(1, 0.4)" }, "<0.25");
    });

    // Header line-clip wipe on its OWN timeline so its EXIT can run faster than entrance.
    const titleTl = gsap.timeline({ paused: true });
    titleTl.to(headSpans, { y: 0, duration: 0.8, stagger: 0.13, ease: "power3.out" }, 0.5);

    let played = false;
    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: () => "+=" + window.innerHeight,
      pin: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (!played && self.direction === 1 && self.progress > 0.05) {
          played = true;
          if (loadTl) { loadTl.progress(1); loadTl.kill(); loadTl = null; }
          master.timeScale(1).play();
          titleTl.timeScale(1).play();
        } else if (played && self.direction === -1) {
          played = false;
          master.timeScale(1).reverse();
          titleTl.timeScale(2.2).reverse();
        }
      },
    });
  });

  // ── Touch / coarse pointer: scrubbed (added in Task 3) ───────────────────────
  mm.add("(pointer: coarse)", () => {
    // One timeline driven directly by scroll position (scrub). The header line-clip
    // wipe is folded in at the same 0.5 offset — no separate faster-exit titleTl,
    // since with scrub the reverse speed already equals the drag-back speed.
    const tl = gsap.timeline();
    tl
      .to("#arrow", { autoAlpha: 0, duration: 0.28, ease: "power2.in" }, 0)
      .to([".eyebrow--top", ".lockup"], { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0.04);
    if (pinwheelProx) tl.to(pinwheelProx, { scrolled: 1, duration: 0.95, ease: "power3.inOut" }, 0.1);
    tl
      .to(".home-logo", { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.4)
      .to(headSpans, { y: 0, duration: 0.8, stagger: 0.13, ease: "power3.out" }, 0.5)
      .to(".intro__body p", { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.14, ease: "power2.out" }, 0.78);
    hbSpines.forEach((s, i) => tl.to(s, { y: 0, duration: 0.55, ease: "power2.out" }, 0.5 + i * 0.05));
    hbBooks.forEach((b, i) => {
      tl
        .to(b, { y: 0, duration: 0.62, ease: "back.out(1.3)" }, 0.6 + i * 0.08)
        .to(b, { rotation: 0, duration: 1.0, ease: "elastic.out(1, 0.4)" }, "<0.25");
    });

    let loadDone = false;
    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: () => "+=" + window.innerHeight,
      pin: true,
      anticipatePin: 1,   // touch-only: smooths the pin grab during momentum scroll
      scrub: 0.6,
      invalidateOnRefresh: true,
      animation: tl,
      onUpdate: (self) => {
        // Finish the load-in once, the moment scrubbing begins, so the pinwheel's
        // rise/align is settled before the scrubbed `scrolled` channel drives place().
        if (!loadDone && self.progress > 0) {
          loadDone = true;
          if (loadTl) { loadTl.progress(1); loadTl.kill(); loadTl = null; }
        }
      },
    });
  });
}

/* ============================================================================
   3 · Pinwheel — fixed traveler. On load it rises from below, holds a beat,
       then aligns to the lockup slot; spins forever in the organic "wind".
   ========================================================================== */
function pinwheelScene() {
  const slot = document.querySelector("#pinwheelSlot");
  if (!slot) return;

  // --- Build the fixed traveler: outer = position/scale, inner = rotation ---
  const trav = document.createElement("div");
  trav.className = "pinwheel";
  trav.setAttribute("aria-hidden", "true");
  const spin = document.createElement("div");
  spin.className = "pinwheel__spin";
  const img = document.createElement("img");
  img.src = "assets/Align_Graphic.svg";
  img.alt = "";
  spin.appendChild(img);
  trav.appendChild(spin);
  document.body.appendChild(trav);

  gsap.set(spin, { rotation: 0 });
  trav.style.opacity = "1"; // no fade — it's hidden by sitting below the fold until it rises

  const slotScrolled = document.querySelector("#pinwheelSlotScrolled");
  const lerp = (a, b, t) => a + (b - a) * t;
  // `rise` = below-fold → viewport centre. `align` = centre → the lockup slot (both
  // TIMED by the load timeline). `scrolled` = lockup slot → the after-scroll header slot
  // (driven on scroll by heroScene's master); it also shrinks the pinwheel to ~120px.
  const prox = { rise: reduce ? 1 : 0, align: reduce ? 1 : 0, scrolled: reduce ? 1 : 0 };
  pinwheelProx = prox;

  function place() {
    const r = slot.getBoundingClientRect();
    const w = r.width;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.5;
    const belowY = window.innerHeight + w / 2 + 60;          // fully off-screen at rest
    const riseY = lerp(belowY, centerY, prox.rise);
    let x = lerp(centerX, r.left + w / 2, prox.align);       // glide centre → lockup slot
    let y = lerp(riseY, r.top + r.height / 2, prox.align);
    let width = w;
    if (slotScrolled && prox.scrolled > 0) {                 // …then up to the header slot
      const r2 = slotScrolled.getBoundingClientRect();
      x = lerp(x, r2.left + r2.width / 2, prox.scrolled);
      y = lerp(y, r2.top + r2.height / 2, prox.scrolled);
      width = lerp(w, r2.width, prox.scrolled);
    }
    trav.style.width = width + "px";
    trav.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }
  gsap.ticker.add(place);
  place();

  if (reduce) return; // parked statically in the slot; no wind (CSS reveals the rest)

  // Hide the title / eyebrow / arrow so the rise happens on bare chalk. (Clouds are
  // owned by cloudDrift, hidden via --enter:0 there; loadTl raises --enter below.)
  gsap.set([".eyebrow--top", ".lockup", "#arrow"], { autoAlpha: 0 });

  // --- Load-in: rise to screen centre, spin a beat, then slide into the lockup slot
  //     while the title + eyebrow + clouds animate in (group ends centred), arrow last.
  loadTl = gsap.timeline({ delay: 0.35 });
  loadTl
    .to(prox, { rise: 1, duration: 1.0, ease: "power3.out" })          // rise to centre
    .to({}, { duration: 0.8 })                                          // spin beat (empty bg)
    .addLabel("settle")
    .to(prox, { align: 1, duration: 0.85, ease: "power3.inOut" }, "settle")          // slide to slot
    .to(".cloud", { "--enter": 1, duration: 1.3, stagger: 0.07, ease: "power1.out" }, "settle")  // edge-fade multiplies this
    .to(".eyebrow--top", { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, "settle+=0.1")
    .fromTo(".lockup", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.75, ease: "power2.out" }, "settle+=0.18")
    .to("#arrow", { autoAlpha: 1, duration: 0.55, ease: "power2.out" }, "settle+=0.55");

  // --- Wind: continuous idle spin (inner layer), modulated by random gusts ---
  const baseSpin = gsap.to(spin, { rotation: "+=360", duration: 9, ease: "none", repeat: -1 });
  function gust() {
    gsap
      .timeline({ onComplete: gust })
      .to(baseSpin, { timeScale: gsap.utils.random(1.3, 3.0), duration: gsap.utils.random(0.8, 1.6), ease: "sine.in" })
      .to(baseSpin, { timeScale: gsap.utils.random(0.3, 0.8), duration: gsap.utils.random(1.4, 2.8), ease: "sine.out" });
  }
  gust();
}

/* ============================================================================
   4 · Home books — rise in on scroll, settle at the bottom; cursor-knock,
       hover raise/colour/icon-swap, and click-to-navigate. (Reuses the menu
       book physics, adapted to rise from below.)
   ========================================================================== */
function homeBooks() {
  const shelf = document.querySelector("#homeShelf");
  if (!shelf) return;
  hbBooks = gsap.utils.toArray(".book", shelf);
  hbSpines = gsap.utils.toArray(".spine", shelf);

  // Navigation (always wired — works under reduced motion too).
  hbBooks.forEach((b) => {
    const href = b.getAttribute("data-href");
    if (!href) return;
    b.addEventListener("click", () => { window.location.href = href; });
  });

  if (reduce) {
    gsap.set(hbBooks, { y: 0, rotation: 0, autoAlpha: 1 }); // shown settled, statically
    return;                                                 // spines stay at their CSS rest
  }

  // Pre-park the whole shelf below the fold (clipped by the stage's overflow → no flash;
  // nothing of the shelf shows on the load state, only after the first scroll). The
  // rise-in itself is authored into heroScene's master timeline.
  const START_Y = () => window.innerHeight + 60;
  hbSpines.forEach((s) => gsap.set(s, { transformOrigin: "50% 100%", y: START_Y() }));
  hbBooks.forEach((b) => {
    const tilt = gsap.utils.random(2, 6) * (gsap.utils.random(0, 1) < 0.5 ? -1 : 1);
    gsap.set(b, { transformOrigin: "50% 100%", y: START_Y(), rotation: tilt, autoAlpha: 1 });
  });

  wireBookKnockAndHover(shelf, hbBooks);
}

/* ---- Cursor-reactive tilt + hover raise/colour/icon-swap (shared physics). ----
   As the cursor sweeps the shelf, each element it ENTERS (book or spine cluster) is
   knocked in the direction of travel and rocks back upright. Interactive books raise
   + turn orange + cross-fade to their colour icon on hover/focus. */
function wireBookKnockAndHover(shelf, books) {
  const spines = gsap.utils.toArray(".spine", shelf);
  const tiltables = [...books, ...spines];
  const knockTl = tiltables.map(() => null);

  function knock(i, dx) {
    const el = tiltables[i];
    const kick = gsap.utils.clamp(-9, 9, dx * 0.2);       // direction = travel · magnitude = speed
    if (knockTl[i]) knockTl[i].kill();
    gsap.set(el, { transformOrigin: "50% 100%" });
    knockTl[i] = gsap.timeline()
      .to(el, { rotation: kick, duration: 0.4, ease: "power3.out", overwrite: "auto" })  // tip
      .to(el, { rotation: 0, duration: 1.1, ease: "elastic.out(1, 0.5)" });               // rock → settle
  }

  // Listen on the hero (so the outer spines are reachable), gated to the shelf band.
  const host = shelf.closest("#hero") || shelf;
  let lastX = null;
  let overIdx = -1;
  host.addEventListener("pointermove", (e) => {
    const sr = shelf.getBoundingClientRect();
    if (e.clientY < sr.top - 40 || e.clientY > sr.bottom + 20) { lastX = null; overIdx = -1; return; }
    const dx = lastX === null ? 0 : e.clientX - lastX;     // horizontal sweep velocity
    lastX = e.clientX;
    const localX = e.clientX - sr.left;
    let idx = -1;
    for (let i = 0; i < tiltables.length; i++) {
      const L = tiltables[i].offsetLeft;                   // layout positions — transform-independent
      if (localX >= L && localX <= L + tiltables[i].offsetWidth) { idx = i; break; }
    }
    if (idx !== -1 && idx !== overIdx) knock(idx, dx);     // knocked once on entering a new element
    overIdx = idx;
  });
  host.addEventListener("pointerleave", () => { lastX = null; overIdx = -1; });

  // Raise + colour + icon swap (interactive books only; .book--soon opts out).
  // The hover lift uses yPercent (≈40px), NOT y: the scroll-in/out master owns `y`,
  // so keeping them on separate transform channels means hovering a book mid-scroll
  // can't kill the master's y tween — the book always falls away on scroll-up.
  gsap.utils.toArray(".book--interactive", shelf).forEach((b) => {
    const raise = () => -(40 / b.offsetHeight) * 100;   // 40px lift as a % of book height
    const enter = () => { b.classList.add("is-hover"); gsap.to(b, { yPercent: raise(), duration: 0.4, ease: "power2.out", overwrite: "auto" }); };
    const leave = () => { b.classList.remove("is-hover"); gsap.to(b, { yPercent: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" }); };
    b.addEventListener("mouseenter", enter);
    b.addEventListener("mouseleave", leave);
    b.addEventListener("focus", enter);
    b.addEventListener("blur", leave);
  });
}

/* ============================================================================
   5 · Menu (bookshelf overlay) — open/close, books fall in, sway, raise.
   Lives in main.js so it can be reused across pages; no-ops on the home (no #menu).
   ========================================================================== */
function menuScene() {
  const menu = document.querySelector("#menu");
  // Any element with [data-menu-open] toggles the drawer (the topbar hamburger).
  const openBtns = gsap.utils.toArray("[data-menu-open]");
  if (!menu || !openBtns.length) return;

  const main = document.querySelector("main");
  const scrim = menu.querySelector(".menu__scrim");
  const drawer = menu.querySelector(".menu__drawer");
  const eyebrow = menu.querySelector(".menu__eyebrow");
  const items = gsap.utils.toArray(".menu__item", menu);
  const closeEls = gsap.utils.toArray("[data-menu-close]", menu);   // the scrim
  const bars = {
    top: document.querySelector(".topbar__menu .bar-top"),
    mid: document.querySelector(".topbar__menu .bar-mid"),
    bot: document.querySelector(".topbar__menu .bar-bot"),
  };
  const hasBars = bars.top && bars.mid && bars.bot;
  let isOpen = false;
  let lastFocus = null;

  function setExpanded(open) {
    openBtns.forEach((b) => {
      b.setAttribute("aria-expanded", String(open));
      b.setAttribute("aria-label", open ? "Close menu" : "Open playbook menu");
    });
  }

  // Lock the page + route focus into the drawer; reversed on unlock.
  function lock() {
    lastFocus = document.activeElement;
    menu.hidden = false;
    if (main) main.inert = true;            // background unreachable while open
    root.style.overflow = "hidden";          // hard-lock page scroll (decoupled from ScrollSmoother)
    document.body.style.overflow = "hidden";
  }
  function unlock() {
    menu.hidden = true;
    if (main) main.inert = false;
    root.style.overflow = "";
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function focusDrawer() { if (drawer) drawer.focus({ preventScroll: true }); }

  // Navigation: a chapter row's data-href is a clean path (/chapter-2). On the reader,
  // where that path's anchor exists in-page, smooth-scroll to it and close without a
  // flash; from the landing (anchor absent) it's a full page load to the reader. A
  // legacy "#id" href still works as an in-page jump.
  function wireNav(closeFn) {
    gsap.utils.toArray(".menu__row[data-href]", menu).forEach((row) => {
      const href = row.getAttribute("data-href");
      if (!href) return;
      row.addEventListener("click", (e) => {
        e.preventDefault();
        const id = (window.GTCRoutes && window.GTCRoutes.pathToId(href)) ||
                   (href.charAt(0) === "#" ? href.slice(1) : null);
        const target = id && document.getElementById(id);
        if (target) {
          root.style.overflow = "";
          document.body.style.overflow = "";
          const sm = smoother || (window.ScrollSmoother && window.ScrollSmoother.get());
          const pos = target.classList.contains("chapter-panel") ? "top top" : "top 120px";
          if (sm) sm.scrollTo(target, false, pos);
          else target.scrollIntoView();
          closeFn();
          // urlSync (js/chapter.js) rewrites the address bar to the clean path as the jump settles.
        } else {
          window.location.href = href; // landing → reader, or any non-in-page target
        }
      });
    });
  }

  // Reduced motion: open/close instantly, no slide/fall (CSS still handles hover colour).
  if (reduce) {
    const openR = () => { if (isOpen) return; isOpen = true; lock(); gsap.set(scrim, { autoAlpha: 1 }); gsap.set(drawer, { xPercent: 0, "--card-bg-o": 1 }); gsap.set(items, { autoAlpha: 1, x: 0, y: 0, rotation: 0 }); setExpanded(true); focusDrawer(); };
    const closeR = () => { if (!isOpen) return; isOpen = false; setExpanded(false); unlock(); };
    openBtns.forEach((b) => b.addEventListener("click", () => (isOpen ? closeR() : openR())));
    closeEls.forEach((b) => b.addEventListener("click", closeR));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) closeR(); });
    wireNav(closeR);
    return;
  }

  // One interruptible timeline (enter → addPause → exit), per the GSAP example: closing
  // mid-enter REVERSES the slide-in; closing when fully open plays forward into a distinct
  // exit where the chapter rows FALL away (random rotation, staggered from the last).
  const X = { top: { x1: 6, y1: 6, x2: 18, y2: 18 }, bot: { x1: 6, y1: 18, x2: 18, y2: 6 } };
  const H = { top: { x1: 3, y1: 7, x2: 21, y2: 7 }, bot: { x1: 3, y1: 17, x2: 21, y2: 17 } };
  const FALL = () => window.innerHeight + 300;

  gsap.set(menu, { visibility: "hidden" });

  const tl = gsap.timeline({ paused: true });
  // ── reset state at t=0 (so a restart after the fall puts everything back) ──
  tl.set(menu, { visibility: "visible" })
    .set(scrim, { autoAlpha: 0 }, 0)
    .set(drawer, { xPercent: 100, "--card-bg-o": 1 }, 0)
    .set(eyebrow, { autoAlpha: 1 }, 0)
    .set(items, { autoAlpha: 0, x: 24, y: 0, rotation: 0 }, 0)
    // ═══ ENTER (reversible) ═══
    .to(scrim, { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 0)
    .to(drawer, { xPercent: 0, duration: 0.6, ease: "back.out(1.1)" }, 0)
    .to(items, { autoAlpha: 1, x: 0, duration: 0.5, ease: "power3.out", stagger: 0.06 }, 0.15);
  if (hasBars) {
    tl.to(bars.top, { attr: X.top, duration: 0.35, ease: "back.out(1.4)" }, 0.06)
      .to(bars.bot, { attr: X.bot, duration: 0.35, ease: "back.out(1.4)" }, 0.06)
      .to(bars.mid, { autoAlpha: 0, duration: 0.2, ease: "power2.out" }, 0.06);
  }
  tl.addPause();
  const enterEnd = tl.duration();

  // ═══ EXIT (forward from the pause) — rows fall, card + scrim fade ═══
  if (hasBars) {
    tl.to(bars.top, { attr: H.top, duration: 0.25, ease: "power3.in" })
      .to(bars.bot, { attr: H.bot, duration: 0.25, ease: "power3.in" }, "<")
      .to(bars.mid, { autoAlpha: 1, duration: 0.2, ease: "power2.in" }, "<");
  }
  tl.to(items, { y: FALL, rotation: () => gsap.utils.random(-22, 22), duration: 0.8, ease: "power3.in", stagger: { from: "end", each: 0.04 } }, hasBars ? "<" : ">")
    .to(drawer, { "--card-bg-o": 0, duration: 0.4, ease: "power2.in" }, "<0.15")
    .to(eyebrow, { autoAlpha: 0, duration: 0.3, ease: "power2.in" }, "<")
    .to(scrim, { autoAlpha: 0, duration: 0.35, ease: "power2.in" }, "<0.1")
    .set(menu, { visibility: "hidden" });

  // Unlock once a close finishes — either the forward exit or a reversed enter.
  tl.eventCallback("onComplete", () => { if (!isOpen) unlock(); });
  tl.eventCallback("onReverseComplete", () => { if (!isOpen) unlock(); });

  function toggle() {
    isOpen = !isOpen;
    setExpanded(isOpen);
    if (isOpen) {
      lock();
      if (tl.time() >= enterEnd) tl.timeScale(1).restart();  // was mid-exit → restart the enter
      else tl.timeScale(1).play();
      focusDrawer();
    } else if (tl.time() < enterEnd) {
      tl.timeScale(1.4).reverse();                           // still entering → retract quickly
    } else {
      tl.timeScale(1).play();                                // fully open → play forward through the fall
    }
  }
  function close() { if (isOpen) toggle(); }

  openBtns.forEach((b) => b.addEventListener("click", toggle));
  closeEls.forEach((b) => b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) close(); });
  wireNav(close);
}

/* ============================================================================
   6 · Magnetic button component ("True button") — wires every `.mag-zone`.
   Used by the Menu back button (--back) on the chapter pages; no-ops on the home.
   ========================================================================== */
function magneticButtons() {
  if (reduce) return;
  const strength = 0.4;       // the pill
  const labelStrength = 0.24; // the label (lighter parallax)

  document.querySelectorAll(".mag-zone").forEach((zone) => {
    const btn = zone.querySelector(".mag-btn");
    if (!btn) return;
    const label = btn.querySelector(".label");

    zone.addEventListener("mousemove", (e) => {
      const rect = zone.getBoundingClientRect();
      const mapX = gsap.utils.mapRange(rect.left, rect.right, -rect.width / 2, rect.width / 2, e.clientX);
      const mapY = gsap.utils.mapRange(rect.top, rect.bottom, -rect.height / 2, rect.height / 2, e.clientY);

      gsap.to(btn, { x: mapX * strength, y: mapY * strength, duration: 0.4, ease: "power2.out", overwrite: true });
      if (label) gsap.to(label, { x: mapX * labelStrength, y: mapY * labelStrength, duration: 0.4, ease: "power2.out", overwrite: true });
    });

    zone.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.4)", overwrite: true });
      if (label) gsap.to(label, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.4)", overwrite: true });
    });
  });
}

/* ============================================================================
   Boot — skipped while the password gate is locked (js/gate.js) so no animation
   runs behind the lock; on unlock the page reloads and boots fresh.
   ========================================================================== */
if (!window.__GTC_LOCKED__) {
  // Ignore the resize mobile browsers fire when the address bar shows/hides — it would
  // otherwise refresh ScrollTrigger and jump the hero pin mid-scroll. Real rotations
  // still refresh (different event).
  if (ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });
  smoothScroll();   // create the smoother first so the pinned ScrollTriggers attach to it
  arrowBob();
  cloudDrift();
  pinwheelScene();  // builds the load-in (loadTl) + parks/spins the pinwheel
  homeBooks();      // parks the books/spines (hbBooks/hbSpines, read by heroScene)
  heroScene();      // one-shot scroll master (consumes hbBooks/hbSpines, completes loadTl)
  menuScene();
  magneticButtons();

  // Fonts can shift metrics → recompute pin distances once loaded.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
