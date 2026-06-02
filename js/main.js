/* ============================================================================
   GTC — The Design Playbook · header motion
   GSAP + ScrollTrigger  → pinned scrub (title rises, gradient streaks grow)
   motion.dev (Motion One) → entrance micro-animations
   ========================================================================== */
import { animate } from "../vendor/motion.esm.js";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
// ScrollSmoother (page smooth-scroll) + CustomEase/CustomWiggle are vendored (free).
gsap.registerPlugin(...[ScrollTrigger, window.ScrollSmoother, window.CustomEase, window.CustomWiggle].filter(Boolean));

const root = document.documentElement;
root.classList.add("js");

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = [0.22, 1, 0.36, 1];

const titleblock = document.querySelector("#titleblock");
const arrow = document.querySelector("#arrow");

// Entrance tweens for the hero "extras" — captured so the scroll scene can kill them
// the moment scrolling starts (otherwise their late completion snaps opacity back to 1
// and overrides the scroll fade — the "still visible when scrolling" bug).
let heroEntrance = null;

// ScrollSmoother instance (the menu does NOT touch it — it just hard-locks page scroll
// via documentElement overflow while open, to avoid smoother/menu interaction bugs).
let smoother = null;

/* ---- Title vertical travel: centre → docked near top (Figma ≈ 8.3% of frame) ---- */
function titleDeltaY() {
  const vh = window.innerHeight;
  const h = titleblock.offsetHeight;
  const targetTop = vh * 0.083;
  return targetTop + h / 2 - vh / 2; // negative → moves up
}

/* ============================================================================
   1 · Hero entrance (motion.dev) — runs once on load
   ========================================================================== */
function heroIntro() {
  if (reduce) return;
  // titleblock media keeps the Motion One entrance (nothing else animates it).
  animate(
    ".titleblock__media",
    { opacity: [0, 1], y: [22, 0] },
    { duration: 1.1, delay: 0.12, easing: EASE }
  );
  // eyebrow / subtitle / arrow are ALSO faded out by the scroll scrub, so GSAP must
  // solely own them. Captured in heroEntrance so scrollScene can kill them on first
  // scroll — preventing their late completion from snapping opacity back to 1.
  heroEntrance = [
    gsap.from(".eyebrow--top", { autoAlpha: 0, y: -10, duration: 0.8, delay: 0.05, ease: "power2.out" }),
    gsap.from(".subtitle", { autoAlpha: 0, y: 16, duration: 0.9, delay: 0.34, ease: "power2.out" }),
    gsap.from("#arrow", { autoAlpha: 0, duration: 0.7, delay: 0.6, ease: "power2.out" }),
  ];
}

/* ---- Arrow idle bob (independent of scroll opacity) ---- */
function arrowBob() {
  if (reduce) return;
  gsap.to(arrow, { y: 9, duration: 1.15, repeat: -1, yoyo: true, ease: "sine.inOut" });
}

/* ============================================================================
   2 · Pinned scroll scene (GSAP) — extras out, title up, streaks grow
   ========================================================================== */
function scrollScene() {
  gsap.set(titleblock, { xPercent: -50, yPercent: -50 });

  if (reduce) {
    gsap.set("#streaks", { "--streak-hide": "0%" });
    gsap.set(titleblock, { y: titleDeltaY() });
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: () => "+=" + window.innerHeight * 1.4,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // First sign of scroll → retire the entrance tweens so only the scrub controls
        // the extras' opacity from here on (kills the late-completion override bug).
        if (self.progress > 0 && heroEntrance) {
          heroEntrance.forEach((t) => t.kill());
          heroEntrance = null;
        }
      },
    },
  });

  // fromTo with explicit start + immediateRender:false → a real 1→0 fade that reverses
  // back to 1 on scroll-up. (A plain .to() lazily captures its start from the element,
  // which the entrance's from-tween leaves at 0 — making it a 0→0 no-op that never
  // animates or restores. This is what made them "just disappear" and not come back.)
  tl.fromTo(".eyebrow--top, .subtitle",
      { autoAlpha: 1, y: 0 },
      { autoAlpha: 0, y: -28, ease: "power2.in", duration: 0.3, immediateRender: false }, 0)
    .fromTo("#arrow",
      { autoAlpha: 1 },
      { autoAlpha: 0, ease: "power2.in", duration: 0.22, immediateRender: false }, 0)
    .to(titleblock, { y: () => titleDeltaY(), ease: "power3.inOut", duration: 0.6 }, 0.05)
    .to("#streaks", { "--streak-hide": "0%", ease: "none", duration: 0.62 }, 0.34);
}

/* ============================================================================
   3 · Intro reveal ("What this is") — graphic + text enter on scroll-in
   ========================================================================== */
function introReveal() {
  // Reduced motion → just show everything statically.
  // Motion build → the pinned pinwheel transition reveals the text (see pinwheelScene).
  if (reduce) {
    gsap.set("#introGraphic", { opacity: 1 });
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
  }
}

/* ============================================================================
   4 · Pinwheel — spins in over the cover, travels into the intro slot,
       then idles spinning in the "wind" (organic gusts)
   ========================================================================== */
function pinwheelScene() {
  const slot = document.querySelector("#introGraphic img"); // in-flow spacer + a11y node
  const intro = document.querySelector("#intro");           // pinned scene it rises into
  if (!slot || !intro || reduce) return;                    // reduced-motion → static graphic

  root.classList.add("motion"); // hides the in-flow graphic; traveler takes over

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

  const CENTER_Y = 0.5;  // viewport ratio where it rests while centred on the plain bg
  const RISE_END = 0.45;  // pin progress at which the rise finishes — quick, so little empty bg
  const ALIGN_AT = 0.50;  // pin progress that fires the timed align + reveal (leaves room
                          // after it for the 0.8s glide to finish while still pinned)
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const riseEase = gsap.parseEase("power3.out");

  // `align` is a TIMED progress (0 = centred, 1 = parked on the slot), driven by the
  // transition timeline — NOT by raw scroll. The rise stays scroll-scrubbed.
  const prox = { align: 0 };

  // --- Timed transition: pinwheel glides to the slot + the text block reveals.
  //     Plays once on crossing the threshold; reverses cleanly on scroll-up. ---
  const reveals = intro.querySelectorAll("[data-reveal]");
  const transition = gsap.timeline({ paused: true });
  transition
    .to(prox, { align: 1, duration: 0.8, ease: "power3.inOut" }, 0)
    .fromTo(
      reveals,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
      0.2
    );

  // Pin the intro: the gradient is already gone, so the pinwheel rises on plain bg,
  // holds a beat centred, then the timed transition takes it to the text block.
  const pin = ScrollTrigger.create({
    trigger: intro,
    start: "top top",
    end: () => "+=" + window.innerHeight * 0.7, // trimmed (was 0.9); leaves the align room to finish
    pin: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      // Past the threshold → play the timed align + text reveal; well before it → reverse.
      // The gap between the two thresholds is hysteresis so it can't flap if the user
      // hovers exactly on the trigger point. (play/reverse are idempotent.)
      if (self.progress >= ALIGN_AT) transition.play();
      else if (self.progress < ALIGN_AT - 0.55) transition.reverse();
    },
  });

  function place() {
    const r = slot.getBoundingClientRect();
    const w = r.width;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * CENTER_Y;
    const belowY = window.innerHeight + w / 2 + 40;          // fully off-screen at rest
    const rise = clamp01(pin.progress / RISE_END);           // scroll-scrubbed rise
    const riseY = lerp(belowY, centerY, riseEase(rise));     // rises in (no fade)
    const a = prox.align;                                    // timed glide to the slot
    const x = lerp(centerX, r.left + w / 2, a);
    const y = lerp(riseY, r.top + r.height / 2, a);
    trav.style.width = w + "px";
    trav.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }
  gsap.ticker.add(place);
  place();

  // --- Wind: continuous idle spin (inner layer), modulated by random gusts.
  //     Runs throughout but only reads as "the wind" once aligned and still. ---
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
   5 · Menu (bookshelf overlay) — open/close, books fall in, sway, raise
   ========================================================================== */
function menuScene() {
  const menu = document.querySelector("#menu");
  const openBtn = document.querySelector("#exploreBtn");
  const closeBtn = document.querySelector("#menuClose");
  if (!menu || !openBtn) return;

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
  // (xPercent:-50 keeps it centred while GSAP owns the transform.) Skipped while the
  // cursor is over the shelf, so a quick mouse-in after landing doesn't ride the thud.
  function impactShake(amount) {
    if (overShelf) return;
    gsap.set(shelf, { xPercent: -50 });
    gsap.fromTo(shelf, { y: amount }, { y: 0, duration: 0.55, ease: "elastic.out(1.4, 0.28)", overwrite: "auto" });
  }

  // IN: each book falls from above under gravity (accelerating ease-in), lands hard,
  // then rocks about its base and damps to rest — pivot at 50% 100%. Random per book.
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

  // OUT: books accelerate straight down off the bottom with a slight tumble. Random.
  function closeBooks(onDone) {
    gsap.set(inners, { rotation: 0 });
    let lastEnd = 0;
    books.forEach((b) => {
      const delay = gsap.utils.random(0, 0.28);
      const dur = gsap.utils.random(0.5, 0.65);
      gsap.to(b, {
        y: BELOW(), rotation: "+=" + gsap.utils.random(-28, 28),
        duration: dur, delay, ease: "power2.in", overwrite: true,   // accelerate down (gravity)
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

  openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) close(); });

  if (reduce) return; // no ambient sway / raise tweens under reduced motion

  // --- Cursor-reactive tilt: as the cursor sweeps across the shelf, each element it
  //     ENTERS gets knocked — the whole book (or spine cluster) tips in the cursor's
  //     direction of travel (magnitude scales with sweep speed), pivots at its base,
  //     then rocks back upright with the same elastic heft as the landing. Spines sit
  //     behind the books (z-index), so a tipping spine tucks behind, never overlapping. ---
  const spines = gsap.utils.toArray(".spine", shelf);
  const tiltables = [...books, ...spines];               // books + spine clusters, all knockable
  const knockTl = tiltables.map(() => null);
  function knock(i, dx) {
    const el = tiltables[i];
    const kick = gsap.utils.clamp(-9, 9, dx * 0.2);      // direction = travel · magnitude = speed
    if (knockTl[i]) knockTl[i].kill();
    gsap.set(el, { transformOrigin: "50% 100%" });
    knockTl[i] = gsap.timeline()
      .to(el, { rotation: kick, duration: 0.4, ease: "power3.out", overwrite: "auto" })  // tip
      .to(el, { rotation: 0, duration: 1.1, ease: "elastic.out(1, 0.5)" });               // rock → settle (drop heft)
  }

  let lastX = null;
  let overIdx = -1;
  // listen on the whole menu (so the outer spines are reachable) but only react while
  // the cursor is sweeping across the shelf's vertical band.
  menu.addEventListener("pointermove", (e) => {
    const sr = shelf.getBoundingClientRect();
    if (e.clientY < sr.top - 60 || e.clientY > sr.bottom + 20) { lastX = null; overIdx = -1; overShelf = false; return; }
    if (!overShelf) {                                    // just entered the shelf band
      overShelf = true;
      gsap.set(shelf, { xPercent: -50 });
      gsap.to(shelf, { y: 0, duration: 0.2, ease: "power2.out", overwrite: "auto" }); // settle any residual landing thud
    }
    const dx = lastX === null ? 0 : e.clientX - lastX;   // horizontal sweep velocity
    lastX = e.clientX;
    const localX = e.clientX - sr.left;
    let idx = -1;
    for (let i = 0; i < tiltables.length; i++) {
      const L = tiltables[i].offsetLeft;                 // layout positions — transform-independent
      if (localX >= L && localX <= L + tiltables[i].offsetWidth) { idx = i; break; }
    }
    if (idx !== -1 && idx !== overIdx) knock(idx, dx);   // knocked once on entering a new element
    overIdx = idx;
  });
  menu.addEventListener("pointerleave", () => { lastX = null; overIdx = -1; overShelf = false; });

  // --- Raise + colour + icon swap (interactive books only; .book--soon opt out).
  //     Raise = y on the outer; colour + icon-swap = the .is-hover class (CSS). ---
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
   Static at rest; on hover the pill (`.mag-btn`) and its `.label` parallax toward
   the cursor at different strengths (`overwrite:true`), springing back on leave.
   Used by the Explore CTA (--explore) and the Menu back button (--back).
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
   0 · Smooth scrolling (GSAP ScrollSmoother) — wraps #smooth-content; the pinned
   scenes ride inside it, the fixed menu/pinwheel stay outside. Subtle (smooth:1).
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

/* ============================================================================
   Boot
   ========================================================================== */
smoothScroll();   // create the smoother first so the pinned ScrollTriggers attach to it
heroIntro();
arrowBob();
scrollScene();
introReveal();
pinwheelScene();
menuScene();
magneticButtons();

// Fonts can shift metrics → recompute pin distances once loaded.
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
window.addEventListener("load", () => ScrollTrigger.refresh());
