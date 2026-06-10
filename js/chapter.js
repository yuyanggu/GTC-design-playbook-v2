/* ============================================================================
   Interior chapter pages — shared page motion
   Runs after main.js (which registers the GSAP plugins, adds `.js`, and creates
   the ScrollSmoother). Owns, per chapter: hero flower wind-spin · copy fade-up
   reveals · the scroll-synced Table of Contents.

   Two layouts share this file:
   • Standalone chapter pages (why-we-exist.html, …) — one chapter per document.
     Everything is scoped to `document`.
   • The continuous reader (playbook.html) — three `.chapter-panel`s in one
     document. Each function is scoped to its panel so the three TOCs / reveal
     batches / flowers don't collide, plus the chapter-to-chapter scroll effect
     (panelTransitions), the rail label/colour follow (railSync), and deep-link
     entry from the menu (handleDeepLink).
   ========================================================================== */
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const panels = gsap.utils.toArray(".chapter-panel");

// urlSync (scroll-spy) must not write to the URL until the initial deep-link is
// resolved — otherwise its first rAF (at scroll 0) would overwrite the incoming
// #chN with #ch1 before handleDeepLink reads it. Enabled once entry settles.
let urlWriteEnabled = false;

if (window.__GTC_LOCKED__) {
  // Password gate active (js/gate.js): skip all chapter boot so nothing animates
  // behind the lock. On unlock the page reloads and this runs fresh.
} else if (panels.length) {
  // ----- Continuous reader: each chapter scoped to its own panel -----
  panels.forEach(initChapter);
  panelTransitions(panels);
  railSync(panels);
  railReveal();
  urlSync(); // reflect the deepest in-view anchor in the URL as you scroll

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
    handleDeepLink();        // land on the chapter named in the URL hash (menu deep-link)
    urlWriteEnabled = true;  // from here, scrolling may rewrite the URL
  });
} else if (document.querySelector(".page-hero")) {
  // ----- Standalone chapter page: scope to the whole document -----
  initChapter(document);
  railReveal();
  urlSync();

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
    urlWriteEnabled = true;
  });
}

/* Run the per-chapter motions, scoped to `root` (a panel, or `document`). */
function initChapter(root) {
  heroFlowerSpin(root);
  copyReveals(root);
  stickyToc(root);
  tableOfContents(root);
  chapterSwitch(root);
}

/* ---- Chapter switcher: the 4-cell grid at the top of the TOC jumps between
   chapters, same behaviour as the menu (wireNav in js/main.js). On the reader,
   where the target chapter exists in-page, smooth-scroll to it; on a standalone
   page (no in-page anchor / no GTCRoutes) fall through to a full load to
   /chapter-N. The current chapter's cell + the "coming soon" cell carry no
   data-href, so they're inert. ---- */
function chapterSwitch(root) {
  const cells = gsap.utils.toArray(root.querySelectorAll(".toc__chapter[data-href]"));
  if (!cells.length) return;
  const smoother = window.ScrollSmoother && window.ScrollSmoother.get();
  cells.forEach((cell) => {
    const href = cell.getAttribute("data-href");
    cell.addEventListener("click", (e) => {
      e.preventDefault();
      const id = window.GTCRoutes && window.GTCRoutes.pathToId(href);
      const target = id && document.getElementById(id);
      if (target) {
        if (smoother) smoother.scrollTo(target, true, "top top");
        else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
        // urlSync (below) rewrites the address bar to the clean path as the jump settles.
      } else {
        window.location.href = href; // standalone page → full load to the reader
      }
    });
  });
}

/* ---- Hero flower: endless "wind" spin with organic gusts (mirrors pinwheel) ---- */
function heroFlowerSpin(root) {
  if (reduce) return;
  // Only chapters that opt in (`.hero-flower[data-spin]`) animate; others are static.
  const flower = root.querySelector(".hero-flower[data-spin]");
  if (!flower) return;
  const spin = flower.querySelector(".hero-flower__spin");
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
function copyReveals(root) {
  const els = gsap.utils.toArray(root.querySelectorAll(".reveal"));
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

/* ---- Sticky TOC: a real GSAP pin, held at top:100 through the body. ScrollTrigger
   synchronises the pin with ScrollSmoother internally (pinType:"transform"), so it
   stays glued to the viewport with no per-frame lag. Releases at the body's bottom —
   which is just before the panel's chapter-to-chapter transition begins. ---- */
function stickyToc(root) {
  if (reduce) return; // reduced motion → smoother off, native scrolling
  const toc = root.querySelector(".toc");
  const body = root.querySelector(".page-body");
  if (!toc || !body || window.innerWidth <= 1180) return;
  ScrollTrigger.create({
    trigger: toc,
    start: "top 100px",
    endTrigger: body,
    end: "bottom bottom",
    pin: true,
    pinSpacing: false,
    pinType: "transform",
    invalidateOnRefresh: true,
  });
}

/* ---- Table of contents: active row + progress fill follow scroll; rows scroll-to.
   Sections may carry an optional `.toc__sub` of sub-rows — these accordion open only
   under the section you're currently reading, and the active sub-row tracks scroll. ---- */
function tableOfContents(root) {
  const lis = gsap.utils.toArray(root.querySelectorAll(".toc__list > li"));
  const fill = root.querySelector(".toc__progress-fill");
  if (!lis.length) return;
  const smoother = window.ScrollSmoother && window.ScrollSmoother.get();

  // Section model: main row + head, plus optional sub-rows + their heads.
  const sections = lis
    .map((li) => {
      const row = li.querySelector(".toc__row");
      if (!row) return null;
      const subEl = li.querySelector(".toc__sub");
      const subRows = subEl ? gsap.utils.toArray(".toc__subrow", subEl) : [];
      return {
        row,
        head: document.getElementById(row.dataset.toc),
        subEl,
        subRows,
        subHeads: subRows.map((s) => document.getElementById(s.dataset.toc)),
      };
    })
    .filter((s) => s && s.head);
  if (!sections.length) return;

  const hasSubs = sections.some((s) => s.subEl);

  // Accordion: only the active section's sub-list is open.
  let expanded = -1;
  function expand(i, animate) {
    if (i === expanded || !hasSubs) return;
    expanded = i;
    sections.forEach((s, idx) => {
      if (!s.subEl) return;
      const to = idx === i ? "auto" : 0;
      if (animate) gsap.to(s.subEl, { height: to, duration: 0.34, ease: "power2.out", overwrite: true });
      else gsap.set(s.subEl, { height: to });
    });
  }

  const linePos = () => window.innerHeight * 0.42;
  function update() {
    const L = linePos();
    let main = 0;
    sections.forEach((s, i) => { if (s.head.getBoundingClientRect().top <= L) main = i; });
    sections.forEach((s, i) => s.row.classList.toggle("is-active", i === main));
    expand(main, true);
    const sec = sections[main];
    if (sec.subRows.length) {
      let sub = 0;
      sec.subHeads.forEach((h, j) => { if (h && h.getBoundingClientRect().top <= L) sub = j; });
      sec.subRows.forEach((r, j) => r.classList.toggle("is-active", j === sub));
    }
  }

  // Progress fill across the body, with a small visible baseline at the top.
  const body = root.querySelector(".page-body");
  ScrollTrigger.create({
    trigger: body,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      if (fill) fill.style.width = (8 + self.progress * 92).toFixed(1) + "%";
      update();
    },
  });
  expand(0, false); // initial accordion state
  update();

  // Click a (sub-)row → smooth-scroll to its target.
  function scrollToEl(el) {
    if (!el) return;
    if (smoother) smoother.scrollTo(el, true, "top 120px");
    else {
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    }
  }
  sections.forEach((s) => {
    s.row.addEventListener("click", (e) => { e.preventDefault(); scrollToEl(s.head); });
    s.subRows.forEach((r, j) =>
      r.addEventListener("click", (e) => { e.preventDefault(); scrollToEl(s.subHeads[j]); })
    );
  });
}

/* ============================================================================
   Continuous reader only — chapter-to-chapter scroll effect
   Ported from the GSAP "stacked panels" ScrollTrigger demo, adapted from its
   clipped-slide model to our naturally-scrolling chapters: each chapter scrolls
   normally (hero → body, TOC pinned), and ONLY at the very bottom does the panel
   pin and its inner layer scale down + fade while the next chapter rises over it.
   pinSpacing:false → no spacer is reserved, so the next panel scrolls up and
   covers the shrinking one (the signature "card lifting away" beat).
   ========================================================================== */
function panelTransitions(panelEls) {
  if (reduce) return; // reduced motion → chapters simply stack, no transition
  const arr = gsap.utils.toArray(panelEls);
  // The last chapter has nothing to transition into, so it never scales/fades out.
  arr.slice(0, -1).forEach((panel) => {
    const scaleEl = panel.querySelector(".chapter-panel__scale");
    if (!scaleEl) return;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: "bottom bottom",            // engages when the chapter's end reaches the viewport bottom
        // MUST be a full viewport: with pinSpacing:false the next chapter rises by exactly this
        // distance during the pin, so it needs one full viewport to travel from viewport-bottom up
        // to viewport-top and land flush. (Shorter left it stopping partway up.) The *quickness*
        // comes from the snap below, not from shortening this.
        end: () => "+=" + window.innerHeight,
        pin: true,
        pinSpacing: false,                  // next chapter scrolls up and over the pinned one
        pinType: "transform",               // required under ScrollSmoother
        scrub: true,
        // Snap, scroll-direction-biased: a small nudge in either direction commits the
        // transition the moment you stop — scroll down → completes into the next chapter,
        // scroll up → returns — so it activates fast and always settles ON a chapter,
        // never half-cut. directional:true is what makes the nudge follow your scroll.
        snap: {
          snapTo: [0, 1],
          duration: { min: 0.4, max: 0.5 },
          delay: 0.00,                      // snap almost immediately after the scroll stops
          ease: "power2.out",
          directional: true,                // bias to the direction you're scrolling (commits quicker)
        },
        invalidateOnRefresh: true,
      },
    });
    tl.fromTo(scaleEl, { scale: 1, opacity: 1 }, { scale: 0.7, opacity: 0.5, ease: "none", duration: 0.9 })
      .to(scaleEl, { opacity: 0, duration: 0.1 });
  });
}

/* ---- Rail follows the chapter you're in: label text + (on dark heroes) colour.
   A panel is "current" while its midpoint band straddles the viewport centre. ---- */
function railSync(panelEls) {
  const label = document.querySelector(".rail__label");
  const rootEl = document.documentElement;
  gsap.utils.toArray(panelEls).forEach((panel) => {
    ScrollTrigger.create({
      trigger: panel,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => {
        if (!self.isActive) return;
        if (label && panel.dataset.rail) label.textContent = panel.dataset.rail;
        // Dark heroes need a light rail label so it stays legible (see CLAUDE.md).
        if (panel.dataset.railFg) rootEl.style.setProperty("--rail-fg", panel.dataset.railFg);
        else rootEl.style.removeProperty("--rail-fg");
      },
    });
  });
}

/* ---- Rail reveal: the left rail (divider + bottom label) shows only over the chalk
   body and is OCCLUDED by the chapter heroes — the rail is `position:fixed` on top of
   everything, so rather than floating over a hero we CLIP it to the chalk band between
   the heroes currently on screen. The effect: the incoming chapter hero rising from the
   bottom literally overlaps the rail (eating the label bottom→top, exactly as it covers
   the rest of the outgoing chapter), and the current hero uncovers it from the top as
   you enter a chapter. One per-frame updater owns the clip + label anchor, so it never
   fights railSync (label text/colour) or panelTransitions (panel scale/fade). ---- */
function railReveal() {
  const rail = document.querySelector(".rail");
  const label = rail && rail.querySelector(".rail__label");
  const bodies = gsap.utils.toArray(".page-body");
  const heroes = gsap.utils.toArray(".page-hero");
  if (!rail || !label || !bodies.length) return;

  const update = () => {
    const vh = window.innerHeight;
    const mid = vh * 0.5;

    // How far a coloured hero intrudes into the viewport from the top / bottom edges.
    // (A hero is one full viewport tall, so it covers an edge whenever it's on screen.)
    let topClip = 0, bottomClip = 0;
    for (const h of heroes) {
      const r = h.getBoundingClientRect();          // live rect (reflects the smoother transform)
      if (r.bottom <= 0 || r.top >= vh) continue;   // hero off-screen
      if (r.top <= 0.5) topClip = Math.max(topClip, Math.min(vh, r.bottom));               // from the top
      if (r.bottom >= vh - 0.5) bottomClip = Math.max(bottomClip, vh - Math.max(0, r.top)); // from the bottom
    }

    if (topClip + bottomClip >= vh - 0.5) {         // a hero covers the whole strip → gone
      rail.style.visibility = "hidden";
    } else {
      rail.style.visibility = "visible";
      // Clip away the hero-covered rows; the chalk band [topClip, vh−bottomClip] shows.
      rail.style.clipPath = `inset(${Math.round(topClip)}px 0px ${Math.round(bottomClip)}px 0px)`;
    }

    // Anchor the label 40px above the viewport bottom. On standalone pages (no panel) let
    // it ride up with the section's end so it scrolls away gracefully; in the reader the
    // clip handles the exit, so keep it pinned and let the rising hero cover it.
    let active = null, inPanel = false;
    for (const b of bodies) {
      const r = b.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) { active = r; inPanel = !!b.closest(".chapter-panel"); break; }
    }
    if (active) label.style.top = (inPanel ? vh - 40 : Math.min(vh - 40, active.bottom - 40)) + "px";
  };

  // One page-wide trigger drives the check every scroll + on refresh (handles scroll 0).
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: update, onRefresh: update });
  update();
}

/* ---- Deep-link entry: if the URL carries an anchor (#chN / #s-XY / #s-XY-Z — set by
   the menu books or a shared link), jump straight to it on load.

   Two reasons a single scrollTo isn't enough:
   • ScrollSmoother (and native anchor scroll) ignore the panelTransitions pins, so a
     cold jump to a target sitting *behind* pinned chapter transitions undershoots.
   • Right after load the smoother isn't yet ready to accept scrollTo — calls silently
     no-op for a few hundred ms until its rAF loop / first refresh has run.
   So we converge: re-measure the target's live position and correct, polling on a
   short interval until it lands (or a time budget elapses). It's invisible because the
   page is held hidden (`html.deeplinking`, set pre-paint by the inline script in
   playbook.html) until we reveal — so the reader never flashes Chapter 1's hero first.
   We always reveal — even on a missing/invalid hash — and a longstop guarantees the
   page can never stay hidden. ---- */
function handleDeepLink() {
  // Prefer a clean reader path (/chapter-2/designing-for-everyone); fall back to a
  // legacy #hash so older shared links still resolve.
  let id = window.GTCRoutes && window.GTCRoutes.pathToId(window.location.pathname);
  if (!id && window.location.hash) id = window.location.hash.slice(1);
  const target = id && document.getElementById(id);
  if (!target) { revealDeepLink(); return; }

  // Section heads carry the `.reveal` entrance (a translateY(24px) that the copyReveals
  // batch clears on enter). It's a transform, so it shifts the rect by 24px without
  // changing layout — which would make us converge 24px low. Snap the target to its
  // revealed state first so we measure its true resting position.
  if (!reduce && target.classList.contains("reveal")) gsap.set(target, { opacity: 1, y: 0 });

  const smoother = window.ScrollSmoother && window.ScrollSmoother.get();
  // Chapter heroes land flush at the top; section/subsection heads clear the rail
  // by the same 120px their CSS scroll-margin-top reserves.
  const offset = target.classList.contains("chapter-panel") ? 0 : 120;
  // Poll until the target lands. Each step re-measures the live rect and corrects, so it
  // self-heals once the smoother becomes ready (its scrollTo silently no-ops until then).
  // Bounded by revealDeepLink's longstop: we stop as soon as the page has been revealed
  // (landed or given up), never spinning forever. Warm loads land in a frame or two.
  function converge() {
    if (!document.documentElement.classList.contains("deeplinking")) return; // already revealed
    const delta = target.getBoundingClientRect().top - offset;
    if (Math.abs(delta) <= 2) { revealDeepLink(); return; }
    const y = (smoother ? smoother.scrollTop() : window.scrollY) + delta;
    if (smoother) smoother.scrollTo(y, false);
    else window.scrollTo(0, y);
    setTimeout(converge, 80);
  }
  setTimeout(converge, 80);
}

/* Fade the held-back content in once positioned (instant under reduced motion). */
function revealDeepLink() {
  const root = document.documentElement;
  if (!root.classList.contains("deeplinking")) return;
  const content = document.getElementById("smooth-content");
  if (content && !reduce && gsap) {
    gsap.fromTo(content, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" });
  }
  root.classList.remove("deeplinking");
}
// Longstop: reveal regardless if `load` is slow or convergence never lands.
setTimeout(revealDeepLink, 3200);

/* ---- Scroll-spy URL sync: as you scroll, reflect the deepest in-view anchor in the
   URL so any point in the reader is shareable. Section-level granularity — anchors are
   chapters + section heads only, so the URL stays at the section (/chapter-3/discovery)
   while you read through its subsections. On the reader it writes clean paths via
   GTCRoutes; elsewhere (standalone pages, no route table) it falls back to "#id".
   Uses replaceState — it neither pushes history nor triggers a browser scroll/
   `hashchange`, so it can't fight ScrollSmoother. Throttled to one update per frame;
   writes only when the active anchor changes. ---- */
function urlSync() {
  if (window.__GTC_LOCKED__) return;
  // DOM order ↔ vertical order, so the last anchor past the active line is the deepest
  // current one (a chapter while in its hero, then its sections).
  const anchors = gsap.utils
    .toArray(".chapter-panel, .section-head")
    .filter((el) => el.id);
  if (!anchors.length) return;

  const urlFor = (id) =>
    (window.GTCRoutes && window.GTCRoutes.idToPath(id)) || "#" + id;

  let lastUrl = null;
  let queued = false;

  function pick() {
    queued = false;
    if (!urlWriteEnabled) return; // hold off until the initial deep-link has resolved
    const line = window.innerHeight * 0.42;
    let current = anchors[0];
    anchors.forEach((el) => { if (el.getBoundingClientRect().top <= line) current = el; });
    const url = urlFor(current.id);
    if (url !== lastUrl) {
      lastUrl = url;
      window.history.replaceState(null, "", url);
    }
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(pick);
  }

  ScrollTrigger.create({ start: 0, end: "max", onUpdate: schedule, onRefresh: schedule });
  schedule();
}
