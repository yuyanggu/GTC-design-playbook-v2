/* ============================================================================
   GTC — The Design Playbook · home v3 motion
   Load: clouds drift, the pinwheel rises in + aligns to the lockup (wind spin).
   Scroll: fully native, no pin — the cover lockup scales down as it scrolls away
   (the fixed pinwheel tracks its slot rect, so it shrinks for free), the clouds
   parallax down to settle along the intro's top edge, the intro headline words
   rise once on enter, and the section books rise when the shelf enters.
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

// The pinwheel traveler's proxy (rise/align) — owned by pinwheelScene; kept module-level
// so coverScroll can fast-forward the load-in on first scroll.
let pinwheelProx = null;

// ScrollSmoother instance (the menu does NOT touch it — it just hard-locks page scroll
// via documentElement overflow while open, to avoid smoother/menu interaction bugs).
let smoother = null;

/* ============================================================================
   0 · Smooth scrolling (GSAP ScrollSmoother) — wraps #smooth-content; the fixed
   pinwheel stays outside and reads live rects. EVERY surface uses it now: the
   landing gets a heavier glide (smooth 1.7), chapter pages + the reader stay at 1.
   The landing has no #menu, so the menu's overflow hard-lock is moot there; the
   About popup pauses the smoother while open instead (see aboutModal).
   ========================================================================== */
function smoothScroll() {
  if (reduce || !window.ScrollSmoother) return;
  // The landing gets a heavier glide (smooth 1.7) than the chapter pages (1); the fixed
  // pinwheel traveler reads live rects, and place() (pinwheelScene) is added to the ticker
  // AFTER the smoother, so it reads the post-transform slot rect each frame → tracks cleanly.
  const home = !!document.querySelector("#hero");
  smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: home ? 1.7 : 1,
    smoothTouch: 0,   // native scrolling on touch devices (smoothing touch feels laggy)
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

  // Scroll parallax (landing only): the CONTAINER drifts down in document space at
  // <1× scroll speed, so the cloud band moves up-screen slower than the page and
  // settles along the top of the intro section, then freezes and scrolls away with
  // it. Container `y` is a free channel — the per-cloud tweens above own x/scale/
  // opacity — and build() only resets the children, so this survives resize rebuilds.
  const CLOUD_TRAVEL = 0.75;   // fraction of viewport height; tune vs the Figma intro
  const cont = document.querySelector("#hero .clouds");
  if (cont) {
    gsap.to(cont, {
      y: () => window.innerHeight * CLOUD_TRAVEL,
      ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
    });
  }
}

/* ============================================================================
   2 · Cover scroll — no pin. On the first scroll-down the cover exit plays as ONE
       timed, uninterruptible timeline (it runs to completion on its own clock, so
       scroll speed/stops can't jitter or freeze it): the lockup scales down (the
       fixed pinwheel tracks its slot rect and shrinks with it), the arrow fades,
       and the top-left header wordmark fades in. Reverses only back at the very top.
   ========================================================================== */
function coverScroll() {
  const hero = document.querySelector("#hero");
  const row = document.querySelector("#lockupRow");
  if (!hero || !row) return;        // hero-only scene; absent on chapter pages

  // GSAP owns the row's transform. x:0/y:0 clears any px GSAP parsed from the CSS
  // translate(-50%,-50%) so xPercent/yPercent don't stack into a double-shift.
  gsap.set(row, { x: 0, y: 0, xPercent: -50, yPercent: -50 });

  if (reduce) return;               // static layout, native scroll only

  // One paused timeline = the whole cover exit. Played once, in full, so the logo
  // scale can't be interrupted mid-flight by scroll. (The top-left brand mark is a
  // separate fixed top bar revealed at the bottom of the page — see logoBar.)
  const coverTl = gsap.timeline({ paused: true })
    .to(row, { scale: 0.55, transformOrigin: "50% 50%", duration: 0.9, ease: "power2.inOut" }, 0)
    .to("#arrow", { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0);

  // Play-once latch: fire the timeline on the first real downward scroll and let it
  // run uninterrupted; reverse only when the user returns to the very top. Scroll is
  // held until the load-in intro finishes (introHold), so loadTl is always complete by
  // the time this can fire — no fast-forward needed.
  let played = false;
  ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: "bottom top",
    onUpdate: (self) => {
      if (!played && self.direction === 1 && self.progress > 0.015) {
        played = true;
        coverTl.timeScale(1).play();
      } else if (played && self.direction === -1 && self.progress < 0.01) {
        played = false;
        coverTl.timeScale(1.4).reverse();   // tuck back a touch quicker than it played
      }
    },
  });
}

/* ============================================================================
   2c · Intro hold — keep the page pinned at the top while the OPENING load-in
        animation (pinwheel rise → spin → align to the lockup → title/eyebrow
        reveal) plays in full, so an early scroll can't cut it off. Scroll is
        frozen on boot and released the moment loadTl completes.
   ========================================================================== */
function introHold() {
  if (reduce || !loadTl || !document.querySelector("#hero")) return;  // no intro → nothing to guard

  // Always start the landing at the very top on (re)load. ScrollSmoother drives its OWN scroll
  // (not window scroll), and the browser restores that position on refresh — which would drop
  // the pinwheel load-in into the intro/books. Reset the smoother to the top (before the hold,
  // for the visual, and again on release, in case the browser restored during the load-in).
  const toTop = () => { if (smoother) smoother.scrollTop(0); else window.scrollTo(0, 0); };
  toTop();
  if (smoother) smoother.paused(true);    // freeze the smoothed (desktop) scroll
  root.style.overflow = "hidden";         // + hard-lock native scroll (touch/mobile)
  document.body.style.overflow = "hidden";

  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    if (smoother) smoother.paused(false);
    toTop();
    root.style.overflow = "";
    document.body.style.overflow = "";
  };
  loadTl.eventCallback("onComplete", release);
  // Safety net: always release even if onComplete never fires (a stray kill/refresh).
  gsap.delayedCall((loadTl.delay() || 0) + loadTl.duration() + 0.6, release);
}

/* ============================================================================
   2d · Logo top bar — the fixed top-left wordmark (body-level so it stays pinned
        under ScrollSmoother). Hidden until the user first reaches the BOTTOM of the
        page; from then on it's the persistent top bar for the content area, but it
        hides over the hero cover (which shows its own big lockup — no duplicate).
   ========================================================================== */
function logoBar() {
  const logo = document.querySelector(".home-logo");
  const hero = document.querySelector("#hero");
  const main = document.querySelector("main");
  if (!logo || !hero || !main) return;

  if (reduce) { gsap.set(logo, { autoAlpha: 1 }); return; }  // shown statically

  gsap.set(logo, { autoAlpha: 0, y: -8 });
  let unlocked = false;   // becomes true once the page bottom is reached the first time
  let visible = false;
  const show = (v) => {
    if (v === visible) return;
    visible = v;
    gsap.to(logo, { autoAlpha: v ? 1 : 0, y: v ? 0 : -8, duration: 0.5, ease: "power2.out", overwrite: true });
  };

  // Unlock gate: fire near the very bottom (progress ≥ 0.9). A plain "bottom bottom"
  // trigger sits at the exact max-scroll edge and won't fire reliably.
  ScrollTrigger.create({
    trigger: main,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => { if (!unlocked && self.progress >= 0.9) { unlocked = true; show(true); } },
  });

  // Once unlocked, the bar shows whenever the hero cover is mostly out of view and
  // hides again over the cover (so it never doubles the big centred lockup).
  ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: "bottom top",
    onUpdate: (self) => { if (unlocked) show(self.progress > 0.5); },
  });
}

/* ============================================================================
   2e · Headline fit — the intro title must ALWAYS be exactly two lines with no
        wrapping. Each `.line` is `white-space:nowrap`; this measures the longest
        line at the 54px cap and scales the shared font-size down so it fits the
        space beside the copy column (full width when stacked on mobile). Pure
        layout, so it runs regardless of reduced motion; re-fit on resize + after
        the display font loads (Boldonse metrics differ from the fallback).
   ========================================================================== */
const HEADLINE_MAX = 54;   // px — Figma cap
const HEADLINE_MIN = 40;   // px — hard floor; never smaller than this
function fitHeadline() {
  const h = document.querySelector(".intro__headline");
  const row = document.querySelector(".intro__row");
  if (!h || !row) return;
  const col = row.querySelector(".intro__col");
  const lines = gsap.utils.toArray(".line", h);

  // Measure the true single-line width at the cap (drop wrap so scrollWidth is one row).
  h.classList.remove("intro__headline--wrap");
  h.style.fontSize = HEADLINE_MAX + "px";
  let widest = 0;
  lines.forEach((l) => { widest = Math.max(widest, l.scrollWidth); });
  if (!widest) return;

  const cs = getComputedStyle(row);
  const stacked = cs.flexDirection === "column";  // stacked: headline spans the full row
  const gap = parseFloat(cs.columnGap) || 0;
  const avail = row.clientWidth - (stacked || !col ? 0 : col.offsetWidth + gap) - 2; // 2px safety

  // Ideal size to keep the longest line on ONE row; clamp to [40, 54].
  const ideal = widest > avail ? Math.floor(HEADLINE_MAX * avail / widest) : HEADLINE_MAX;
  h.style.fontSize = Math.min(HEADLINE_MAX, Math.max(HEADLINE_MIN, ideal)) + "px";

  // If even the 40px floor can't fit on one row (phones), allow the title to wrap
  // rather than shrink below 40 — introScene reveals with a plain fade when wrapped.
  h.classList.toggle("intro__headline--wrap", ideal < HEADLINE_MIN);
}

/* ============================================================================
   2b · Intro scene — once, when the section scrolls into view: the headline's
        words rise out of their masked lines (hellohello.is style) while the
        welcome copy and Explore link fade up.
   ========================================================================== */
function introScene() {
  const intro = document.querySelector("#intro");
  if (!intro) return;
  const h = intro.querySelector(".intro__headline");
  const words = gsap.utils.toArray(".intro__headline .word", intro);

  if (reduce) return;               // CSS reduced-motion block shows everything statically

  gsap.set([".intro__copy", ".intro__explore"], { autoAlpha: 0, y: 14 });

  // Build the headline reveal at ENTER time so it matches the current wrap state
  // (fitHeadline may toggle .intro__headline--wrap after fonts load / on resize). Words
  // start hidden via CSS until then (masked transform, or opacity in wrap mode).
  const play = () => {
    const wrap = h.classList.contains("intro__headline--wrap");
    const tl = gsap.timeline();
    if (wrap) {
      // Wrapped (phones): the per-line clip mask can't hold multiple rows → plain fade-up.
      gsap.set(words, { clearProps: "transform", autoAlpha: 0, y: 16 });
      tl.to(words, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.05 }, 0);
    } else {
      // Masked word rise (hellohello.is). y:0 zeroes the px offset GSAP parses from the
      // CSS translateY(118%) start so yPercent doesn't stack (see gotchas.md: yPercent stacking).
      gsap.set(words, { y: 0, yPercent: 118, autoAlpha: 1 });
      tl.to(words, { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.07 }, 0);
    }
    tl.to(".intro__copy", { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, 0.3)
      .to(".intro__explore", { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.45);
  };

  ScrollTrigger.create({ trigger: intro, start: "top 70%", once: true, onEnter: play });
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
  // `rise` = below-fold → viewport centre. `align` = centre → the lockup slot (both
  // TIMED by the load timeline). After that the traveler just tracks the slot's live
  // rect every frame — which is viewport-relative, so native scroll (and coverScroll's
  // scale-down of the lockup row) moves + shrinks the pinwheel with no extra state.
  const prox = { rise: reduce ? 1 : 0, align: reduce ? 1 : 0 };
  pinwheelProx = prox;

  function place() {
    const r = slot.getBoundingClientRect();
    const w = r.width;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.5;
    const belowY = window.innerHeight + w / 2 + 60;          // fully off-screen at rest
    const riseY = lerp(belowY, centerY, prox.rise);
    const x = lerp(centerX, r.left + w / 2, prox.align);     // glide centre → lockup slot
    const y = lerp(riseY, r.top + r.height / 2, prox.align);
    trav.style.width = w + "px";
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

  const books = gsap.utils.toArray(".book", shelf);
  const spines = gsap.utils.toArray(".spine", shelf);

  // Mobile (≤768px): the shelf is hidden (CSS) and the static .home-cards take over —
  // no scaling, no parking, no knock/hover physics. The cards are plain <a> links.
  if (window.matchMedia("(max-width: 768px)").matches) return;

  // Scale the whole shelf down to fit narrow viewports (origin bottom-centre, set in CSS)
  // so all five books stay visible + centred. Runs under reduced motion too.
  const SHELF_W = 1300;   // 5×188 + 4×90 (was 1578 with 6 books incl. Foreword)
  const SHELF_PAD = 80;   // 40px breathing room each side so the shelf never crowds the edge
  const fitShelf = () => {
    const scale = Math.min(1, (window.innerWidth - SHELF_PAD) / SHELF_W);
    shelf.style.setProperty("--shelf-scale", scale.toFixed(4));
  };
  fitShelf();
  window.addEventListener("resize", fitShelf);

  // Navigation (always wired — works under reduced motion too).
  books.forEach((b) => {
    const href = b.getAttribute("data-href");
    if (!href) return;
    b.addEventListener("click", () => { window.location.href = href; });
  });

  if (reduce) {
    gsap.set(books, { y: 0, rotation: 0, autoAlpha: 1 });   // shown settled, statically
    return;                                                 // spines stay at their CSS rest
  }

  // Pre-park the whole shelf below the fold (clipped by the intro section's overflow →
  // no flash; nothing of the shelf shows until the rise plays).
  const START_Y = () => window.innerHeight + 60;
  spines.forEach((s) => gsap.set(s, { transformOrigin: "50% 100%", y: START_Y() }));
  books.forEach((b) => {
    const tilt = gsap.utils.random(2, 6) * (gsap.utils.random(0, 1) < 0.5 ? -1 : 1);
    gsap.set(b, { transformOrigin: "50% 100%", y: START_Y(), rotation: tilt, autoAlpha: 1 });
  });

  // Rise-in — once, when the shelf scrolls into view. `y` for the rise, `yPercent`
  // for the hover lift (separate transform channels, see wireBookKnockAndHover).
  const riseTl = gsap.timeline({ paused: true });
  spines.forEach((s, i) => riseTl.to(s, { y: 0, duration: 0.55, ease: "power2.out" }, i * 0.05));
  books.forEach((b, i) => {
    riseTl
      .to(b, { y: 0, duration: 0.62, ease: "back.out(1.3)" }, 0.1 + i * 0.08)
      .to(b, { rotation: 0, duration: 1.0, ease: "elastic.out(1, 0.4)" }, "<0.25");
  });
  ScrollTrigger.create({ trigger: shelf, start: "top 92%", once: true, onEnter: () => riseTl.play() });

  wireBookKnockAndHover(shelf, books);
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

  // Listen on the intro section (so the outer spines are reachable), gated to the shelf band.
  const host = shelf.closest("#intro") || shelf;
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
   7 · About-this-playbook popup — full-screen modal opened by [data-about-open]
   (the landing "Dive in" button). GSAP fade/scale-in; page scroll is hard-locked
   while open (like menuScene — decoupled from ScrollSmoother, see gotchas.md).
   No-ops on pages without #aboutModal.
   ========================================================================== */
function aboutModal() {
  const modal = document.querySelector("#aboutModal");
  const openBtns = gsap.utils.toArray("[data-about-open]");
  if (!modal || !openBtns.length) return;

  const scrim = modal.querySelector(".about-modal__scrim");
  const card = modal.querySelector(".about-modal__card");
  const closeEls = gsap.utils.toArray("[data-about-close]", modal); // scrim + ✕
  const main = document.querySelector("main");
  let isOpen = false;
  let lastFocus = null;

  function lock() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    if (main) main.inert = true;             // background unreachable while open
    if (smoother) smoother.paused(true);      // freeze ScrollSmoother's rAF while open
    root.style.overflow = "hidden";           // hard-lock page scroll
    document.body.style.overflow = "hidden";
  }
  function unlock() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    if (main) main.inert = false;
    root.style.overflow = "";
    document.body.style.overflow = "";
    if (smoother) smoother.paused(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); // back to "Explore"
  }

  // Reduced motion: show/hide instantly (no fade/scale).
  if (reduce) {
    const openR = () => { if (isOpen) return; isOpen = true; lock(); gsap.set(scrim, { autoAlpha: 1 }); gsap.set(card, { autoAlpha: 1, y: 0, scale: 1 }); if (card) card.focus({ preventScroll: true }); };
    const closeR = () => { if (!isOpen) return; isOpen = false; unlock(); };
    openBtns.forEach((b) => b.addEventListener("click", openR));
    closeEls.forEach((b) => b.addEventListener("click", closeR));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) closeR(); });
    return;
  }

  // Independent open/close tweens (NOT one play/reverse timeline — a completed GSAP
  // timeline doesn't reliably resume on reverse(), and rapid open→close interleaving
  // wedges it). killTweensOf makes a mid-flight interruption clean. The `hidden`
  // attribute (toggled by lock/unlock) does the actual show/hide.
  let closing = false;
  function open() {
    if (isOpen) return;
    isOpen = true;
    closing = false;                        // cancel any in-flight close intent
    lock();
    gsap.killTweensOf([scrim, card]);
    gsap.to(scrim, { autoAlpha: 1, duration: 0.35, ease: "power2.out" });
    gsap.fromTo(card, { autoAlpha: 0, y: 24, scale: 0.98 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" });
    if (card) card.focus({ preventScroll: true });
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    closing = true;
    gsap.killTweensOf([scrim, card]);
    gsap.to(scrim, { autoAlpha: 0, duration: 0.3, ease: "power2.in" });
    gsap.to(card, { autoAlpha: 0, y: 16, scale: 0.98, duration: 0.3, ease: "power2.in",
      onComplete: () => { if (closing) { closing = false; unlock(); } } });
  }

  openBtns.forEach((b) => b.addEventListener("click", open));
  closeEls.forEach((b) => b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) close(); });
}

/* ============================================================================
   Boot — skipped while the password gate is locked (js/gate.js) so no animation
   runs behind the lock; on unlock the page reloads and boots fresh.
   ========================================================================== */
if (!window.__GTC_LOCKED__) {
  // Ignore the resize mobile browsers fire when the address bar shows/hides — it would
  // otherwise refresh ScrollTrigger and jump the scrub positions mid-scroll. Real
  // rotations still refresh (different event).
  if (ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });
  smoothScroll();   // create the smoother first so chapter-page ScrollTriggers attach to it
  arrowBob();
  cloudDrift();     // drift + the scroll parallax down into the intro
  pinwheelScene();  // builds the load-in (loadTl) + parks/spins the pinwheel
  introHold();      // hold scroll at top until the load-in intro finishes playing
  homeBooks();      // parks the books/spines + their rise-in trigger
  coverScroll();    // timed play-once cover scale-down + arrow fade
  introScene();     // once-on-enter headline word rise + copy/Explore fade
  logoBar();        // fixed top-bar logo — fades in when the page bottom is reached
  fitHeadline();    // scale the two-line title so it never wraps at any width
  menuScene();
  aboutModal();
  magneticButtons();

  // Keep the two-line title fitted as the viewport changes.
  let fhRt;
  window.addEventListener("resize", () => { clearTimeout(fhRt); fhRt = setTimeout(fitHeadline, 120); });

  // FOUC shield lift — every above-the-fold element now has a gsap.set initial
  // state hiding it (books/spines parked off-screen, pinwheel created, eyebrow/
  // lockup/clouds/arrow autoAlpha:0; the intro pieces sit below the fold behind
  // the `.js` CSS hidden states). Safe to remove the shield: nothing animated
  // will paint visible until loadTl / the scroll scenes play.
  // Done in a rAF so the swap happens after the current paint commits.
  requestAnimationFrame(() => root.classList.remove("js-pending"));

  // Fonts can shift metrics → recompute pin distances + re-fit the title once loaded
  // (Boldonse is wider than the fallback, so the first fit used the wrong metrics).
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { ScrollTrigger.refresh(); fitHeadline(); });
  }
  window.addEventListener("load", () => { ScrollTrigger.refresh(); fitHeadline(); });
}
