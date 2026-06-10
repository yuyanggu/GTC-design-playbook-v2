/* ============================================================================
   Prologue — first-visit "note" overlay.

   Shows once on the first (unlocked) visit to the home page or the reader, then
   persists a flag so it won't auto-reappear. Reopenable any time via any
   [data-prologue-open] trigger (the intro-page link + the reader menu row).

   Dismiss: backdrop click / Esc / the ✕. The note drops in via GSAP (already
   vendored); under reduced motion it shows/hides instantly.

   Sequencing with the password gate: gate.js sets window.__GTC_LOCKED__ in
   <head> before this module runs. While locked we do nothing — the gate reloads
   on success, and on that next (unlocked) load the prologue auto-opens.
   ========================================================================== */

const SEEN_KEY = "gtc-prologue-seen";
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gsap = window.gsap;

// Motion — the letter glides the full height of the viewport, in and out, never fading.
const SLIDE_IN = { duration: 1.05, ease: "expo.out" };
const SLIDE_OUT = { duration: 0.8, ease: "power3.in" };
const SCRIM_FADE = 0.55;        // backdrop dim crossfade (the dim may fade; the letter never does)
const COLS = { duration: 0.6, ease: "power2.out", stagger: 0.1 };

// How far below the viewport to park the letter so it sits fully off-screen.
const offscreenY = () => window.innerHeight;

function hasSeen() {
  try { return localStorage.getItem(SEEN_KEY) === "1"; } catch (e) { return false; }
}
function markSeen() {
  try { localStorage.setItem(SEEN_KEY, "1"); } catch (e) { /* storage blocked */ }
}

function init() {
  if (window.__GTC_LOCKED__) return;               // gate up — wait for the post-auth reload

  const overlay = document.querySelector(".prologue");
  if (!overlay) return;

  const root = document.documentElement;
  const main = document.querySelector("main");
  const scrim = overlay.querySelector(".prologue__scrim");
  const stage = overlay.querySelector(".prologue__stage");
  const closeBtn = overlay.querySelector(".prologue__close");
  const cols = Array.prototype.slice.call(overlay.querySelectorAll(".prologue__col"));
  const openTriggers = Array.prototype.slice.call(document.querySelectorAll("[data-prologue-open]"));

  let isOpen = false;
  let lastFocus = null;
  let tl = null;                                    // active GSAP timeline (interruptible)

  function lockPage() {
    lastFocus = document.activeElement;
    if (main) main.inert = true;
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }
  function unlockPage() {
    if (main) main.inert = false;
    root.style.overflow = "";
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    overlay.hidden = false;
    lockPage();
    if (closeBtn) closeBtn.focus({ preventScroll: true });

    if (reduce || !gsap) {
      if (scrim) { scrim.style.opacity = "1"; scrim.style.visibility = "visible"; }
      if (stage) stage.style.transform = "none";
      cols.forEach((c) => { c.style.opacity = "1"; });
      return;
    }
    if (tl) tl.kill();
    tl = gsap.timeline();
    // The letter glides up from below the viewport (translate only). As it settles,
    // the four columns rise in one by one.
    tl.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: SCRIM_FADE, ease: "power2.out" }, 0)
      .fromTo(stage, { y: offscreenY() }, { y: 0, ...SLIDE_IN }, 0)
      .fromTo(cols, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ...COLS }, SLIDE_IN.duration * 0.5);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    markSeen();

    const finish = () => { overlay.hidden = true; unlockPage(); };

    if (reduce || !gsap) { finish(); return; }
    if (tl) tl.kill();
    tl = gsap.timeline({ onComplete: finish });
    // Slides straight back down and out of the viewport — no fade.
    tl.to(stage, { y: offscreenY(), ...SLIDE_OUT }, 0)
      .to(scrim, { autoAlpha: 0, duration: SLIDE_OUT.duration * 0.8, ease: "power2.in" }, 0.1);
  }

  openTriggers.forEach((t) => t.addEventListener("click", (e) => { e.preventDefault(); open(); }));
  if (scrim) scrim.addEventListener("click", close);
  if (closeBtn) closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) close(); });

  // First visit → auto-open just after the page settles (lets the home load anim breathe).
  if (!hasSeen()) {
    const delay = reduce ? 0 : 600;
    window.setTimeout(open, delay);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
