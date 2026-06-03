/* ============================================================================
   "Why we exist, and the moment" — page motion
   Runs after main.js (which registers the GSAP plugins, adds `.js`, and creates
   the ScrollSmoother). Owns: hero flower wind-spin · copy fade-up reveals ·
   the flower-column assembly · the scroll-synced Table of Contents.
   ========================================================================== */
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const page = document.querySelector(".page-hero");
if (page) {
  heroFlowerSpin();
  copyReveals();
  stickyToc();
  tableOfContents();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

/* ---- Hero flower: endless "wind" spin with organic gusts (mirrors pinwheel) ---- */
function heroFlowerSpin() {
  if (reduce) return;
  const spin = document.querySelector(".hero-flower__spin");
  if (!spin) return;

  const base = gsap.to(spin, { rotation: "+=360", duration: 18, ease: "none", repeat: -1 });
  // Random gusts: speed up, then drift back to calm — never the same twice.
  (function gust() {
    gsap.to(base, {
      timeScale: gsap.utils.random(0.6, 2.4),
      duration: gsap.utils.random(1.6, 4),
      ease: "sine.inOut",
      onComplete: gust,
    });
  })();
}

/* ---- Copy reveals: each .reveal element fades up as it enters ---- */
function copyReveals() {
  const els = gsap.utils.toArray(".reveal");
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

/* ---- Sticky TOC: pin it through the body (CSS sticky can't survive ScrollSmoother) ---- */
function stickyToc() {
  if (reduce) return; // reduced motion → smoother is off, native scrolling
  const toc = document.querySelector(".toc");
  const body = document.querySelector(".page-body");
  if (!toc || !body || window.innerWidth <= 1180) return; // single-column layout doesn't pin
  ScrollTrigger.create({
    trigger: toc,
    start: "top 100px",
    endTrigger: body,
    end: "bottom bottom",
    pin: true,
    pinSpacing: false,
    pinType: "transform", // REQUIRED under ScrollSmoother — the content is transformed,
                          // so the default "fixed" pin can't hold position.
    invalidateOnRefresh: true,
  });
}

/* ---- Table of contents: active row + progress fill follow scroll; rows scroll-to ---- */
function tableOfContents() {
  const rows = gsap.utils.toArray(".toc__row");
  const fill = document.querySelector(".toc__progress-fill");
  const heads = rows
    .map((r) => document.getElementById(r.dataset.toc))
    .filter(Boolean);
  if (!rows.length || !heads.length) return;

  const setActive = (i) =>
    rows.forEach((r, idx) => r.classList.toggle("is-active", idx === i));

  // Which section are we reading? The last heading whose top has passed the 42% line.
  const updateActive = () => {
    const line = window.innerHeight * 0.42;
    let active = 0;
    heads.forEach((h, i) => {
      if (h.getBoundingClientRect().top <= line) active = i;
    });
    setActive(active);
  };

  // Progress fill across the body, with a small visible baseline at the top.
  const body = document.querySelector(".page-body");
  ScrollTrigger.create({
    trigger: body,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      if (fill) fill.style.width = (8 + self.progress * 92).toFixed(1) + "%";
      updateActive();
    },
  });
  updateActive();

  // Click a row → smooth-scroll to its section (via ScrollSmoother when present).
  const smoother = window.ScrollSmoother && window.ScrollSmoother.get();
  rows.forEach((row, i) => {
    row.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      const target = heads[i];
      if (smoother) {
        smoother.scrollTo(target, true, "top 120px");
      } else {
        const y = target.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
      }
    });
  });
}
