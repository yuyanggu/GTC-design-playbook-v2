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
   ========================================================================== */
function smoothScroll() {
  if (reduce || !window.ScrollSmoother) return;
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

/* ---- Clouds: a gentle "sky" float in place — each cloud drifts on x/y and
       slowly breathes in scale, all on its own slow clock so it never repeats. ---- */
function cloudDrift() {
  if (reduce) return;
  gsap.utils.toArray(".cloud").forEach((c, i) => {
    const dir = i % 2 ? -1 : 1;
    gsap.set(c, { transformOrigin: "50% 50%" });
    // Horizontal "wind" drift only (no vertical float, no rotation). Desynced amplitudes
    // + durations so the sky never repeats; a gentle scale breathing adds depth.
    gsap.to(c, { x: "+=" + gsap.utils.random(120, 220) * dir, duration: gsap.utils.random(8, 13), ease: "sine.inOut", repeat: -1, yoyo: true });
    gsap.to(c, { scale: gsap.utils.random(1.08, 1.2), duration: gsap.utils.random(7, 12), ease: "sine.inOut", repeat: -1, yoyo: true });
  });
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

  // Lift the group ~10vh (Figma: pinwheel/lockup move up ≈101/1024 of the frame).
  const groupDeltaY = () => -(window.innerHeight * 0.0986);

  // The whole transition as one timed timeline (played once on scroll, reversible).
  const master = gsap.timeline({ paused: true });
  master
    .to("#arrow", { autoAlpha: 0, duration: 0.28, ease: "power2.in" }, 0)        // arrow out FIRST
    .to(row, { y: groupDeltaY, duration: 0.8, ease: "power3.inOut" }, 0.1);      // group lifts up
  // …then the shelf rises in (spines first, books overshoot + settle + rock).
  hbSpines.forEach((s, i) => master.to(s, { y: 0, duration: 0.55, ease: "power2.out" }, 0.32 + i * 0.05));
  hbBooks.forEach((b, i) => {
    master
      .to(b, { y: 0, duration: 0.62, ease: "back.out(1.3)" }, 0.42 + i * 0.08)
      .to(b, { rotation: 0, duration: 1.0, ease: "elastic.out(1, 0.4)" }, "<0.25");
  });

  // Pin the hero so it holds full-screen through the transition. No scrub: scrolling
  // down past the threshold plays the master once; the FIRST upward scroll reverses it
  // instantly (direction-based — no waiting to reach the top) at normal speed.
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
        if (loadTl) { loadTl.progress(1); loadTl.kill(); loadTl = null; }  // finish the load-in first
        master.timeScale(1).play();
      } else if (played && self.direction === -1) {
        played = false;
        master.timeScale(1).reverse();   // fires the instant you scroll back up
      }
    },
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

  const lerp = (a, b, t) => a + (b - a) * t;
  // `rise` = below-fold → viewport centre. `align` = centre → the lockup slot.
  // Both are TIMED progresses driven by the load timeline (0 on load → 1 parked).
  const prox = { rise: reduce ? 1 : 0, align: reduce ? 1 : 0 };

  function place() {
    const r = slot.getBoundingClientRect();
    const w = r.width;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.5;
    const belowY = window.innerHeight + w / 2 + 60;          // fully off-screen at rest
    const riseY = lerp(belowY, centerY, prox.rise);
    const x = lerp(centerX, r.left + w / 2, prox.align);     // glide centre → slot
    const y = lerp(riseY, r.top + r.height / 2, prox.align);
    trav.style.width = w + "px";
    trav.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }
  gsap.ticker.add(place);
  place();

  if (reduce) return; // parked statically in the slot; no wind (CSS reveals the rest)

  // Hide the title / eyebrow / clouds / arrow so the rise happens on bare chalk.
  gsap.set([".eyebrow--top", ".lockup", "#arrow"], { autoAlpha: 0 });
  gsap.set(".cloud", { opacity: 0 });

  // --- Load-in: rise to screen centre, spin a beat, then slide into the lockup slot
  //     while the title + eyebrow + clouds animate in (group ends centred), arrow last.
  loadTl = gsap.timeline({ delay: 0.35 });
  loadTl
    .to(prox, { rise: 1, duration: 1.0, ease: "power3.out" })          // rise to centre
    .to({}, { duration: 0.8 })                                          // spin beat (empty bg)
    .addLabel("settle")
    .to(prox, { align: 1, duration: 0.85, ease: "power3.inOut" }, "settle")          // slide to slot
    .to(".cloud", { opacity: 1, duration: 1.3, stagger: 0.07, ease: "power1.out" }, "settle")
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
  gsap.utils.toArray(".book--interactive", shelf).forEach((b) => {
    const enter = () => { b.classList.add("is-hover"); gsap.to(b, { y: -40, duration: 0.4, ease: "power2.out", overwrite: "auto" }); };
    const leave = () => { b.classList.remove("is-hover"); gsap.to(b, { y: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" }); };
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
  // Any element with [data-menu-open] opens the bookshelf (e.g. a page's rail hamburger).
  const openBtns = gsap.utils.toArray("[data-menu-open]");
  const closeBtn = document.querySelector("#menuClose");
  if (!menu || !openBtns.length) return;

  const main = document.querySelector("main");
  const shelf = menu.querySelector("#menuShelf");
  const books = gsap.utils.toArray(".book", menu);
  let isOpen = false;
  let lastFocus = null;

  const inners = books.map((b) => b.querySelector(".book__inner"));
  const ABOVE = () => -(window.innerHeight + 160);  // start fully above the fold
  const BELOW = () => window.innerHeight + 400;      // exit target below the fold
  let openMaster = null;   // menu fade + scheduling
  let bookTls = [];        // per-book fall timelines (so close can kill them)
  let overShelf = false;   // is the cursor currently over the shelf? (suppresses the thud)

  // A heavy "thud" — jolt the whole shelf down a few px and let it settle.
  function impactShake(amount) {
    if (overShelf) return;
    gsap.set(shelf, { xPercent: -50 });
    gsap.fromTo(shelf, { y: amount }, { y: 0, duration: 0.55, ease: "elastic.out(1.4, 0.28)", overwrite: "auto" });
  }

  // IN: each book falls from above under gravity, lands hard, then rocks to rest.
  function openBooks() {
    if (!isOpen) return;
    gsap.set(shelf, { xPercent: -50, y: 0 });
    bookTls = books.map((b) => {
      const tilt = gsap.utils.random(2.5, 8) * (gsap.utils.random(0, 1) < 0.5 ? -1 : 1);
      gsap.set(b, { transformOrigin: "50% 100%", y: ABOVE(), rotation: tilt, autoAlpha: 1 });
      return gsap.timeline({ delay: gsap.utils.random(0, 0.7) })
        .to(b, { y: 0, duration: gsap.utils.random(0.48, 0.6), ease: "power2.in" })  // gravity fall
        .add(() => impactShake(gsap.utils.random(2, 5)))                              // shelf thud on landing
        .to(b, { rotation: 0, duration: 1.4, ease: "elastic.out(1, 0.3)" });         // rock → settle
    });
  }

  // OUT: books accelerate straight down off the bottom with a slight tumble.
  function closeBooks(onDone) {
    gsap.set(inners, { rotation: 0 });
    let lastEnd = 0;
    books.forEach((b) => {
      const delay = gsap.utils.random(0, 0.28);
      const dur = gsap.utils.random(0.5, 0.65);
      gsap.to(b, {
        y: BELOW(), rotation: "+=" + gsap.utils.random(-28, 28),
        duration: dur, delay, ease: "power2.in", overwrite: true,
      });
      lastEnd = Math.max(lastEnd, delay + dur);
    });
    gsap.to(menu, { autoAlpha: 0, duration: 0.3, ease: "power2.in", delay: Math.max(0, lastEnd - 0.15), onComplete: onDone });
  }

  function killOpen() {
    if (openMaster) { openMaster.kill(); openMaster = null; }
    bookTls.forEach((t) => t.kill());
    bookTls = [];
    gsap.killTweensOf(books);
    gsap.killTweensOf(shelf);
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;

    root.style.overflow = "hidden";          // hard-lock the page scroll (decoupled from ScrollSmoother)

    if (reduce) {
      menu.hidden = false;
      if (main) main.inert = true;
      document.body.style.overflow = "hidden";
      gsap.set(menu, { autoAlpha: 1 });
      gsap.set(books, { clearProps: "transform", autoAlpha: 1 });
      (closeBtn || menu).focus({ preventScroll: true });
      return;
    }

    killOpen();
    books.forEach((b) => gsap.set(b, { y: ABOVE(), autoAlpha: 0 }));  // pre-hide above the fold (no flash)
    menu.hidden = false;
    if (main) main.inert = true;            // background unreachable while open
    document.body.style.overflow = "hidden";

    openMaster = gsap.timeline();
    openMaster
      .fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out" })
      .add(openBooks, 0.12);
    (closeBtn || menu).focus({ preventScroll: true });
  }

  function finishClose() {
    menu.hidden = true;
    if (main) main.inert = false;
    document.body.style.overflow = "";
    gsap.set(books, { clearProps: "transform" });
    gsap.set(shelf, { y: 0 });
    root.style.overflow = "";               // restore page scroll
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    if (reduce) { finishClose(); return; }
    killOpen();
    closeBooks(finishClose);
  }

  openBtns.forEach((b) => b.addEventListener("click", open));
  if (closeBtn) closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) close(); });

  // Book navigation: an in-page anchor (#chN) closes the menu and smooth-scrolls there;
  // any other href is a full page load. Wired before the reduced-motion bail so links work.
  books.forEach((b) => {
    const href = b.getAttribute("data-href");
    if (!href) return;
    b.addEventListener("click", () => {
      if (href.charAt(0) === "#") {
        const target = document.querySelector(href);
        if (!target) return;
        root.style.overflow = "";
        document.body.style.overflow = "";
        const sm = smoother || (window.ScrollSmoother && window.ScrollSmoother.get());
        if (sm) sm.scrollTo(target, false);
        else target.scrollIntoView();
        close();
      } else {
        window.location.href = href;
      }
    });
  });

  if (reduce) return; // no ambient sway / raise tweens under reduced motion

  // Cursor-reactive tilt + hover raise/colour/icon-swap (same physics as the home shelf).
  const spines = gsap.utils.toArray(".spine", shelf);
  const tiltables = [...books, ...spines];
  const knockTl = tiltables.map(() => null);
  function knock(i, dx) {
    const el = tiltables[i];
    const kick = gsap.utils.clamp(-9, 9, dx * 0.2);
    if (knockTl[i]) knockTl[i].kill();
    gsap.set(el, { transformOrigin: "50% 100%" });
    knockTl[i] = gsap.timeline()
      .to(el, { rotation: kick, duration: 0.4, ease: "power3.out", overwrite: "auto" })
      .to(el, { rotation: 0, duration: 1.1, ease: "elastic.out(1, 0.5)" });
  }

  let lastX = null;
  let overIdx = -1;
  menu.addEventListener("pointermove", (e) => {
    const sr = shelf.getBoundingClientRect();
    if (e.clientY < sr.top - 60 || e.clientY > sr.bottom + 20) { lastX = null; overIdx = -1; overShelf = false; return; }
    if (!overShelf) {
      overShelf = true;
      gsap.set(shelf, { xPercent: -50 });
      gsap.to(shelf, { y: 0, duration: 0.2, ease: "power2.out", overwrite: "auto" });
    }
    const dx = lastX === null ? 0 : e.clientX - lastX;
    lastX = e.clientX;
    const localX = e.clientX - sr.left;
    let idx = -1;
    for (let i = 0; i < tiltables.length; i++) {
      const L = tiltables[i].offsetLeft;
      if (localX >= L && localX <= L + tiltables[i].offsetWidth) { idx = i; break; }
    }
    if (idx !== -1 && idx !== overIdx) knock(idx, dx);
    overIdx = idx;
  });
  menu.addEventListener("pointerleave", () => { lastX = null; overIdx = -1; overShelf = false; });

  gsap.utils.toArray(".book--interactive", menu).forEach((b) => {
    const enter = () => { b.classList.add("is-hover"); gsap.to(b, { y: -40, duration: 0.4, ease: "power2.out", overwrite: "auto" }); };
    const leave = () => { b.classList.remove("is-hover"); gsap.to(b, { y: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" }); };
    b.addEventListener("mouseenter", enter);
    b.addEventListener("mouseleave", leave);
    b.addEventListener("focus", enter);
    b.addEventListener("blur", leave);
  });
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
   Boot
   ========================================================================== */
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
