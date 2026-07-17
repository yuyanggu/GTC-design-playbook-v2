/* ============================================================================
   Cross-page navigation fade — the humanistreview.ai sequential fade, adapted
   to a static multi-page site (no SPA content swap; see their decompiled
   router: fade old page 1.0s → beat of bare background → fade new page 1.3s,
   both on cubic-bezier(0.43, 0.195, 0.02, 1) = our `hrOut`).

   EXIT (this module): internal navigations fade `document.body` to 0 over 1.0s
   — the page background stays painted because `html` now carries it too (see
   the "Cross-page navigation fade" block in styles.css) — then really navigate.
   While heading to/from the dark About page the html background cross-fades to
   the DESTINATION's colour, so the browser's commit to the new document is
   invisible (old page ends on the exact backdrop the new page paints first).
   Scroll is locked during the fade (HR does the same): smoother paused +
   wheel/touchmove blocked.

   ENTRANCE (not here): a pure-CSS 1.3s body fade-in in styles.css runs on
   every load — CSS so a JS failure can never strand a hidden page. The
   reader's deep-linked arrivals additionally hold #smooth-content hidden until
   positioned; that reveal (revealDeepLink in chapter.js) is matched to the
   same 1.3s hrOut. The one JS entrance here is the bfcache restore (pageshow
   persisted): CSS animations don't re-run on restore, and an exit fade may
   have left inline `opacity:0` on body — so we unwind the exit state and play
   the entrance with GSAP. This is also what makes browser-back fade.

   Navigation surfaces covered:
   • every internal <a href> — delegated click interceptor (skips new-tab/
     modifier clicks, downloads, cross-origin, and same-page hash jumps, which
     stay with the smooth-scroll handlers via e.defaultPrevented);
   • JS-driven navigations — shelf books (main.js), the TOC chapter switch and
     veil rows (chapter.js) call window.GTCNav.to(href) with a location.href
     fallback.
   Hovering a link/book prefetches the destination document (HR fetches +
   caches on hover; rel=prefetch is the MPA equivalent).

   Reduced motion / missing GSAP → instant navigation, no fade.
   ========================================================================== */

const gsap = window.gsap;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const OUT_DUR = 1.0;  // exit fade   (HR: 1000ms)
const IN_DUR = 1.3;   // entrance    (HR: 1300ms) — mirror styles.css + revealDeepLink
const CHALK = "#f6f2e7";   // --chalk (styles.css)
const DARK = "#0c1619";    // body.page-dark (chapter.css)

// hrOut — humanistreview's --alias-easeOut, already used by the About popup.
// CustomEase is registered by main.js; creating an existing id is a no-op-ish
// overwrite, but prefer get() so we never clobber a live ease mid-tween.
if (gsap && window.CustomEase && !window.CustomEase.get("hrOut")) {
  window.CustomEase.create("hrOut", "0.43, 0.195, 0.02, 1");
}

let leaving = false;
const blockScroll = (e) => e.preventDefault();

function lockScroll() {
  const smoother = window.ScrollSmoother && window.ScrollSmoother.get();
  if (smoother) smoother.paused(true);
  window.addEventListener("wheel", blockScroll, { passive: false });
  window.addEventListener("touchmove", blockScroll, { passive: false });
}

function unlockScroll() {
  const smoother = window.ScrollSmoother && window.ScrollSmoother.get();
  if (smoother) smoother.paused(false);
  window.removeEventListener("wheel", blockScroll, { passive: false });
  window.removeEventListener("touchmove", blockScroll, { passive: false });
}

/* The dark About page is the one non-chalk destination; end the exit fade on
   its backdrop so the document swap doesn't flash chalk→dark. */
function destBackground(url) {
  const p = url.pathname.replace(/\/+$/, "");
  return p === "/about" || p.endsWith("/about.html") ? DARK : CHALK;
}

function navigate(href) {
  if (leaving) return;
  const url = new URL(href, location.href);
  if (reduce || !gsap) { location.href = url.href; return; }
  leaving = true;
  lockScroll();
  document.body.style.pointerEvents = "none";
  // An exit inside the first 1.3s would otherwise fight the still-running CSS
  // entrance animation (animations outrank inline styles) — stop it dead.
  document.body.style.animation = "none";
  gsap.to(document.documentElement, {
    backgroundColor: destBackground(url),
    duration: OUT_DUR,
    ease: "hrOut",
  });
  gsap.to(document.body, {
    opacity: 0,
    duration: OUT_DUR,
    ease: "hrOut",
    onComplete: () => { location.href = url.href; },
  });
}

/* ---- Delegated click interceptor: every internal <a> gets the fade ---- */
document.addEventListener("click", (e) => {
  if (e.defaultPrevented) return; // smooth-scroll handlers (wireNav etc.) own it
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest("a[href]");
  if (!a) return;
  if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
  let url;
  try { url = new URL(a.getAttribute("href"), location.href); } catch { return; }
  if (url.origin !== location.origin) return; // external / mailto / tel
  if (url.pathname === location.pathname && url.hash) return; // in-page anchor
  e.preventDefault();
  if (url.href === location.href) return; // already here (HR blocks these too)
  navigate(url.href);
});

/* ---- Hover prefetch (HR warms its page cache on link hover) ---- */
const prefetched = new Set();
function prefetch(href) {
  let url;
  try { url = new URL(href, location.href); } catch { return; }
  if (url.origin !== location.origin || prefetched.has(url.pathname)) return;
  if (url.pathname === location.pathname) return;
  prefetched.add(url.pathname);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "document";
  link.href = url.href;
  document.head.appendChild(link);
}
document.addEventListener("pointerover", (e) => {
  const t = e.target.closest && e.target.closest("a[href], [data-href]");
  if (!t) return;
  const href = t.tagName === "A" ? t.getAttribute("href") : t.dataset.href;
  if (href && !/^#/.test(href)) prefetch(href);
});

/* ---- bfcache restore: unwind any exit state + fade back in ----
   Fires on browser back/forward into a frozen page — the CSS entrance
   animation is already finished there, and the exit may have parked body at
   inline opacity 0 (blank page without this). Gives back-nav its fade. */
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  leaving = false;
  unlockScroll();
  document.body.style.pointerEvents = "";
  if (!gsap) return;
  gsap.killTweensOf([document.body, document.documentElement]);
  gsap.set(document.documentElement, { clearProps: "backgroundColor" });
  if (reduce) { gsap.set(document.body, { clearProps: "opacity" }); return; }
  gsap.fromTo(document.body,
    { opacity: 0 },
    { opacity: 1, duration: IN_DUR, ease: "hrOut", clearProps: "opacity" });
});

window.GTCNav = { to: navigate };
