/* ============================================================================
   GTC — The Design Playbook · header motion
   GSAP + ScrollTrigger  → pinned scrub (title rises, gradient streaks grow)
   motion.dev (Motion One) → entrance micro-animations
   ========================================================================== */
import { animate, stagger } from "../vendor/motion.esm.js";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
root.classList.add("js");

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = [0.22, 1, 0.36, 1];

const titleblock = document.querySelector("#titleblock");
const arrow = document.querySelector("#arrow");

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
  animate(
    ".eyebrow--top",
    { opacity: [0, 1], y: [-10, 0] },
    { duration: 0.8, delay: 0.05, easing: EASE }
  );
  animate(
    ".titleblock__media",
    { opacity: [0, 1], y: [22, 0] },
    { duration: 1.1, delay: 0.12, easing: EASE }
  );
  animate(
    ".subtitle",
    { opacity: [0, 1], y: [16, 0] },
    { duration: 0.9, delay: 0.34, easing: EASE }
  );
  animate(
    "#arrow",
    { opacity: [0, 1] },
    { duration: 0.7, delay: 0.6, easing: "ease-out" }
  );
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
    },
  });

  tl.to(".eyebrow--top, .subtitle", { opacity: 0, y: -28, ease: "power2.in", duration: 0.3 }, 0)
    .to("#arrow", { opacity: 0, ease: "power2.in", duration: 0.22 }, 0)
    .to(titleblock, { y: () => titleDeltaY(), ease: "power3.inOut", duration: 0.6 }, 0.05)
    .to("#streaks", { "--streak-hide": "0%", ease: "none", duration: 0.62 }, 0.34);
}

/* ============================================================================
   3 · Intro reveal ("What this is") — graphic + text enter on scroll-in
   ========================================================================== */
function introReveal() {
  const show = () => {
    if (reduce) {
      gsap.set("#introGraphic", { opacity: 1 });
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        el.style.opacity = 1;
        el.style.transform = "none";
      });
      return;
    }
    animate(
      "#introGraphic",
      { opacity: [0, 1], transform: ["scale(0.82) rotate(-18deg)", "scale(1) rotate(0deg)"] },
      { duration: 1.1, easing: EASE }
    );
    animate(
      "[data-reveal]",
      { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
      { duration: 0.9, delay: stagger(0.12, { start: 0.15 }), easing: EASE }
    );
  };

  ScrollTrigger.create({ trigger: "#intro", start: "top 72%", once: true, onEnter: show });
}

/* ============================================================================
   Boot
   ========================================================================== */
heroIntro();
arrowBob();
scrollScene();
introReveal();

// Fonts can shift metrics → recompute pin distances once loaded.
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
window.addEventListener("load", () => ScrollTrigger.refresh());
