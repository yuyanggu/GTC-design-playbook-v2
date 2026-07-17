/* ============================================================================
   About page (about.html) — page motion
   Runs after main.js (which registers the GSAP plugins, adds `.js`, creates the
   ScrollSmoother and lifts the FOUC shield). Owns: copy fade-up reveals and the
   pinned horizontal photo gallery.
   ========================================================================== */
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (document.querySelector(".page-body.about-page")) {
  copyReveals();
  galleryReveal();
  galleryScroll();

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

/* ---- Copy reveals: each .reveal element fades up as it enters (mirrors
   copyReveals in js/chapter.js) ---- */
function copyReveals() {
  const els = gsap.utils.toArray(".reveal");
  if (!els.length) return;
  if (reduce) {
    gsap.set(els, { opacity: 1, y: 0 });
    return;
  }
  ScrollTrigger.batch(els, {
    start: "top 88%",
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.08, overwrite: true }),
  });
}

/* ---- Gallery reveal: the photos rise dramatically into place (y only, no
   fade) when the gallery scrolls into view, once, before the horizontal pin
   engages. The rise lives on the .about-gallery__item (y); the pin/scrub lives
   on the strip (x), so the two transforms never fight.

   Tuned per breakpoint via gsap.matchMedia — a big travel + long deceleration
   on desktop, gentler on phones (shorter images read better with a shorter
   rise). matchMedia rebuilds the right distance on resize/rotate and reverts
   its inline styles on teardown. Each photo is promoted to its own compositor
   layer (will-change) for the duration so the staggered rise stays smooth, then
   released on complete. ---- */
function galleryReveal() {
  if (reduce) return;
  const items = gsap.utils.toArray(".about-gallery__item");
  if (!items.length) return;

  const mm = gsap.matchMedia();
  mm.add(
    { isMobile: "(max-width: 768px)", isDesktop: "(min-width: 769px)" },
    (ctx) => {
      const rise = ctx.conditions.isMobile ? 110 : 300;   // dramatic; gentler on phones (photos ~120px tall there)
      gsap.set(items, { y: rise, willChange: "transform", force3D: true });
      gsap.to(items, {
        y: 0,
        duration: 1.15,     // long travel over a snappy window — expo puts most motion up front
        delay: 0.15,        // slight pause after the trigger fires, before the rise starts
        ease: "expo.out",   // long, smooth deceleration — dramatic without a hard stop
        stagger: { each: 0.14, from: "start" },   // pronounced left-to-right wave
        force3D: true,
        scrollTrigger: { trigger: ".about-gallery", start: "top 85%", once: true },
        onComplete: () => gsap.set(items, { willChange: "auto" }),
      });
    }
  );
}

/* ---- Horizontal gallery: the section pins at viewport centre and the strip
   translates left by its overflow as you keep scrolling — scroll distance =
   the strip's own width, so the pace feels 1:1. Under reduced motion the section
   stays in flow and the strip swipes natively (CSS overflow-x).

   pinType is per-device (mirrors aboutPanel() in js/chapter.js, which carries the
   full reasoning): "transform" is required under ScrollSmoother on desktop (see
   .claude/docs/gotchas.md), but on a touch-only device the smoother stands down
   (smoothTouch:0 → smooth 0, no transform on #smooth-content) and transform-pinning
   only buys a JS counter-translate re-applied every scroll event — which iOS's
   coalesced momentum-scroll events leave stale, making the strip judder. ---- */
function galleryScroll() {
  if (reduce) return;
  const section = document.querySelector(".about-gallery");
  const strip = section && section.querySelector(".about-gallery__strip");
  if (!strip) return;
  // Hold the strip at x:0 for the first slice of the pin's scroll range — a fast
  // scroll can reach the pin before galleryReveal's timed rise (above) finishes;
  // this dead zone keeps the strip still until well after it has, so the rise
  // never fights the horizontal slide. holdFraction is scroll-distance, not
  // time, so it can't be outrun the way a fixed delay could.
  const holdFraction = 0.16;
  const holdEase = (p) => (p < holdFraction ? 0 : (p - holdFraction) / (1 - holdFraction));
  gsap.to(strip, {
    x: () => -(strip.scrollWidth - window.innerWidth),
    ease: holdEase,
    scrollTrigger: {
      trigger: section,
      pin: true,
      pinType: ScrollTrigger.isTouch === 1 ? "fixed" : "transform",
      scrub: true,
      start: "center center",
      end: () => "+=" + strip.scrollWidth,
      invalidateOnRefresh: true,
    },
  });
}
