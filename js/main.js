/* ============================================================================
   GTC — The Design Playbook · header motion
   GSAP + ScrollTrigger  → pinned scrub (title rises, gradient streaks grow)
   motion.dev (Motion One) → entrance micro-animations
   ========================================================================== */
import { animate } from "../vendor/motion.esm.js";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

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
  const RISE_END = 0.32;  // pin progress at which the rise finishes — quick, so little empty bg
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
      else if (self.progress < ALIGN_AT - 0.15) transition.reverse();
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
   Boot
   ========================================================================== */
heroIntro();
arrowBob();
scrollScene();
introReveal();
pinwheelScene();

// Fonts can shift metrics → recompute pin distances once loaded.
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
window.addEventListener("load", () => ScrollTrigger.refresh());
