/* ============================================================================
   Interior chapter pages — shared page motion
   Runs after main.js (which registers the GSAP plugins, adds `.js`, and creates
   the ScrollSmoother). Owns, per chapter: hero flower wind-spin · copy fade-up
   reveals · the scroll-synced Table of Contents.

   Two layouts share this file:
   • Standalone chapter pages (our-point-of-view.html, …) — one chapter per document.
     Everything is scoped to `document`.
   • The continuous reader (playbook.html) — several `.chapter-panel`s in one
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
  mobileTocBar();
  topbarScrim();
  tocCollapse();
  aboutPanel(); // reader-only: the embedded About terminal panel's gallery + topbar-invert motion

  // FOUC shield lift — initChapter has set every .reveal's initial state, the
  // panel transitions are wired, and the rail is in place. Lift the shield on
  // the next paint so the now-correctly-hidden content can fade in. Deep-link
  // case is still protected: handleDeepLink (on window load) keeps using
  // html.deeplinking and its own reveal.
  requestAnimationFrame(() => document.documentElement.classList.remove("js-pending"));

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
    handleDeepLink();        // land on the chapter named in the URL hash (menu deep-link)
    urlWriteEnabled = true;  // from here, scrolling may rewrite the URL
  });
} else if (document.querySelector(".page-hero, .page-body.foreword")) {
  // .page-body.foreword → the standalone Foreword page (no hero). Reader panels
  // are handled by the branch above, so this only matches the standalone file.
  // ----- Standalone chapter page: scope to the whole document -----
  initChapter(document);
  railReveal();
  urlSync();
  mobileTocBar();
  topbarScrim();
  tocCollapse();

  // FOUC shield lift — see the reader branch above for rationale.
  requestAnimationFrame(() => document.documentElement.classList.remove("js-pending"));

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
  accordionRefresh(root);
  stickyToc(root);
  tableOfContents(root);
  chapterSwitch(root);
}

/* ---- Content accordions change the document height when they open/close, which
   goes stale in every ScrollTrigger measured at load — worst on the reader, where
   the chapter-to-chapter transition (panelTransitions) then engages mid-copy and
   snaps you into the next chapter. Re-measure on every <details> toggle. ---- */
function accordionRefresh(root) {
  const items = root.querySelectorAll("details.accordion");
  if (!items.length) return;
  let raf = 0;
  const refresh = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  items.forEach((d) => d.addEventListener("toggle", refresh));
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
        // standalone page → full load to the reader, through the navigation fade
        if (window.GTCNav) window.GTCNav.to(href);
        else window.location.href = href;
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
  if (!toc || !body) return;
  // matchMedia (not a one-shot width check) so resizing across the breakpoint
  // kills/rebuilds the pin — a pin created wide and left alive narrow would
  // keep transform-gluing the display:none'd TOC over the copy.
  gsap.matchMedia().add("(min-width: 1025px)", () => {
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
  });
}

/* ---- Table of contents: active row + progress fill follow scroll; rows scroll-to.
   Sections may carry an optional `.toc__sub` of sub-rows — these accordion open only
   under the section you're currently reading, and the active sub-row tracks scroll. ---- */
function tableOfContents(root) {
  const lis = gsap.utils.toArray(root.querySelectorAll(".toc__list > li"));
  if (!lis.length) return;
  const smoother = window.ScrollSmoother && window.ScrollSmoother.get();
  const scroller = root.querySelector(".toc__scroll");

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

  // Accordion: only the active section's sub-list is open. Opening/closing changes
  // the stack's height, so the fade mask is re-checked once the heights settle.
  let expanded = -1;
  function expand(i, animate) {
    if (i === expanded || !hasSubs) return;
    expanded = i;
    sections.forEach((s, idx) => {
      if (!s.subEl) return;
      const to = idx === i ? "auto" : 0;
      if (animate) gsap.to(s.subEl, { height: to, duration: 0.34, ease: "power2.out", overwrite: true, onComplete: syncOverflow });
      else gsap.set(s.subEl, { height: to });
    });
    if (!animate) syncOverflow();
  }

  // Follow-scroll: the TOC's inner viewport (.toc__scroll) is capped on desktop, so
  // keep the active (sub-)row vertically centred in it. The target is recomputed
  // every frame while the tween runs, so it stays true even while the accordion is
  // still animating heights beneath it. Inner scrollTop never fights the pin.
  let followTween = null;
  function follow(el) {
    if (!scroller || !el || scroller.scrollHeight <= scroller.clientHeight + 1) return;
    const from = scroller.scrollTop;
    const state = { p: 0 };
    if (followTween) followTween.kill();
    followTween = gsap.to(state, {
      p: 1,
      duration: reduce ? 0 : 0.5,
      ease: "power2.out",
      onUpdate: () => {
        const rowTop = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
        const target = gsap.utils.clamp(0, scroller.scrollHeight - scroller.clientHeight,
          rowTop - (scroller.clientHeight - el.offsetHeight) / 2);
        scroller.scrollTop = from + (target - from) * state.p;
      },
    });
  }
  // The fade mask only makes sense while the stack overflows its cap.
  const syncOverflow = () => {
    if (scroller) scroller.classList.toggle("is-overflowing", scroller.scrollHeight > scroller.clientHeight + 1);
  };
  syncOverflow();
  ScrollTrigger.addEventListener("refresh", syncOverflow);

  const linePos = () => window.innerHeight * 0.42;
  let curMain = -1, curSub = -1;
  function update() {
    const L = linePos();
    let main = 0;
    sections.forEach((s, i) => { if (s.head.getBoundingClientRect().top <= L) main = i; });
    sections.forEach((s, i) => {
      s.row.classList.toggle("is-active", i === main);
      if (i !== main) s.subRows.forEach((r) => r.classList.remove("is-active")); // no stale marks in collapsed lists
    });
    expand(main, true);
    const sec = sections[main];
    let sub = -1;
    if (sec.subRows.length) {
      sub = 0;
      sec.subHeads.forEach((h, j) => { if (h && h.getBoundingClientRect().top <= L) sub = j; });
      sec.subRows.forEach((r, j) => r.classList.toggle("is-active", j === sub));
    }
    if (main !== curMain || sub !== curSub) {
      curMain = main;
      curSub = sub;
      follow(sub >= 0 ? sec.subRows[sub] : sec.row);
    }
  }

  // Active-row + accordion tracking across the body as you scroll.
  const body = root.querySelector(".page-body");
  ScrollTrigger.create({
    trigger: body,
    start: "top top",
    end: "bottom bottom",
    onUpdate: update,
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
   Mobile section bar (≤768px) — fixed at the viewport bottom (markup lives
   outside #smooth-wrapper; position:fixed can't survive the smoother transform).
   The label shows the heading you're reading; ◀ ▶ step heading-to-heading
   (sections + subsections — and across chapters in the reader); tapping the
   label slides up a sheet with the full stacked-chapter index. The heading list
   is built from the .toc navs' [data-toc] rows, so the desktop TOC markup stays
   the single source of truth. One instance per document (not per panel).
   ========================================================================== */
function mobileTocBar() {
  const bar = document.querySelector(".toc-bar");
  if (!bar) return;
  const numEl = bar.querySelector(".toc-bar__num");
  const titleEl = bar.querySelector(".toc-bar__title");
  const prevBtn = bar.querySelector(".toc-bar__arrow--prev");
  const nextBtn = bar.querySelector(".toc-bar__arrow--next");
  const label = bar.querySelector(".toc-bar__label");
  const sheet = document.querySelector(".toc-sheet");
  const sheetMask = sheet && sheet.querySelector(".toc-sheet__mask");
  const panel = sheet && sheet.querySelector(".toc-sheet__panel");
  const smoother = window.ScrollSmoother && window.ScrollSmoother.get();

  // The chapter accent shown in the bar — resolved per heading from its panel
  // (reader) or the page body (standalone).
  const accentOf = (el) => {
    const scope = el.closest(".chapter-panel") || document.body;
    return getComputedStyle(scope).getPropertyValue("--accent").trim() || "var(--orange)";
  };

  // Heading entries in document order. The reader's foreword panel has no TOC,
  // so it contributes a hand-rolled first entry.
  // NOTE: the Foreword (#ch0) was RETIRED 2026-07 — its panel is commented out in
  // playbook.html, so getElementById("ch0") is null and this (plus the buildSheetIndex
  // block below) no-ops. Kept guarded for a clean revert.
  const entries = [];
  const foreword = document.getElementById("ch0");
  if (foreword) entries.push({ el: foreword, num: "0", title: "Foreword", accent: accentOf(foreword) });
  document.querySelectorAll(".toc").forEach((nav) => {
    let num = "";
    nav.querySelectorAll(".toc__row[data-toc], .toc__subrow[data-toc]").forEach((row) => {
      const el = document.getElementById(row.dataset.toc);
      if (!el) return;
      const own = row.querySelector(".toc__num");
      if (own) num = own.textContent.trim(); // sub-rows inherit their section's number
      const text = row.querySelector(".toc__title, .toc__subtitle") || row;
      entries.push({ el, num, title: text.textContent.trim(), accent: accentOf(el) });
    });
  });
  // The embedded About panel has no sections of its own, so it isn't caught by the
  // .toc__row sweep above — append it as a final (unnumbered) entry so the bar's
  // label + arrows step into it, matching the desktop TOC's About row.
  const aboutEl = document.getElementById("about");
  if (aboutEl) entries.push({ el: aboutEl, num: "", title: "Behind the playbook", accent: accentOf(aboutEl) });
  if (!entries.length) return;
  bar.hidden = false;

  // ----- label + arrows follow scroll (same 42%-line rule as the desktop TOC) -----
  let active = -1;
  function render() {
    const en = entries[active];
    numEl.textContent = en.num;
    titleEl.textContent = en.title;
    bar.style.setProperty("--bar-accent", en.accent);
    prevBtn.disabled = active <= 0;
    nextBtn.disabled = active >= entries.length - 1;
  }
  let queued = false;
  function pick() {
    queued = false;
    const line = window.innerHeight * 0.42;
    let cur = 0;
    entries.forEach((en, i) => { if (en.el.getBoundingClientRect().top <= line) cur = i; });
    if (cur !== active) { active = cur; render(); }
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(pick); } };
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: schedule, onRefresh: schedule });
  pick();

  let settleTimer = null;
  function jumpTo(i) {
    const en = entries[gsap.utils.clamp(0, entries.length - 1, i)];
    // Chapter tops land flush; section heads clear the rail by their 120px scroll-margin.
    const offset = en.el.classList.contains("chapter-panel") ? 0 : 120;
    clearTimeout(settleTimer);
    if (!smoother) {
      const y = en.el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
      return;
    }
    smoother.scrollTo(en.el, !reduce, `top ${offset}px`);
    // The reader's chapter transitions pin with pinSpacing:false — they consume
    // scroll without moving layout — so one rect-measured scrollTo undershoots
    // when the jump crosses them (handleDeepLink converges for the same reason).
    // Once the motion stops, re-aim until the heading sits at its offset; any
    // user input cancels so the correction never fights a manual scroll.
    let ticks = 30;       // overall budget (long smooth scrolls eat ticks while moving)
    let corrections = 6;  // re-aim budget once stopped
    let last = NaN;
    const cancel = () => clearTimeout(settleTimer);
    window.addEventListener("wheel", cancel, { once: true, passive: true });
    window.addEventListener("touchstart", cancel, { once: true, passive: true });
    (function settle() {
      settleTimer = setTimeout(() => {
        if (--ticks < 0) return;
        const cur = smoother.scrollTop();
        const moving = !(Math.abs(cur - last) < 1);
        last = cur;
        if (!moving) {
          const delta = en.el.getBoundingClientRect().top - offset;
          if (Math.abs(delta) <= 3 || --corrections < 0) return;
          smoother.scrollTo(cur + delta, !reduce);
        }
        settle();
      }, 220);
    })();
  }
  prevBtn.addEventListener("click", () => { closeSheet(); jumpTo(active - 1); });
  nextBtn.addEventListener("click", () => { closeSheet(); jumpTo(active + 1); });

  // ----- TOC sheet: the stacked-chapter index on a white surface that wipes up -----
  if (!panel || !sheetMask) return;
  panel.appendChild(buildSheetIndex());

  // X — the sheet has no scrim to tap, so it gets an explicit close control
  // (top-right head zone, mirroring the topbar's inset). Esc + bar label still close.
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "toc-sheet__close";
  closeBtn.setAttribute("aria-label", "Close contents");
  closeBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></svg>';
  sheet.appendChild(closeBtn);
  closeBtn.addEventListener("click", () => closeSheet());

  // Slip a clip wrapper (.toc-sheet__clip, chapter.css) around a chapter row so the
  // row can rise out of it on open. The row moves as ONE box — its num and name have
  // different line-heights, so tweening them individually would desync the rise.
  function wrapInClip(row) {
    const clip = document.createElement("div");
    clip.className = "toc-sheet__clip";
    row.parentNode.insertBefore(clip, row);
    clip.appendChild(row);
  }

  function buildSheetIndex() {
    const ul = document.createElement("ul");
    ul.className = "toc__chapters";
    if (foreword) {
      const li = document.createElement("li");
      li.innerHTML =
        '<a class="toc__chapter" data-target="ch0" href="/foreword">' +
        '<span class="toc__chapter-num">0</span>' +
        '<span class="toc__chapter-name">Foreword</span></a>';
      li.style.setProperty("--accent", accentOf(foreword));
      wrapInClip(li.querySelector(".toc__chapter"));
      ul.appendChild(li);
    }
    // One li per chapter. Prefer the li that carries the chapter's section list —
    // each .toc nav expands its own chapter, so in the reader every chapter comes
    // out expanded; on a standalone page only the current one does.
    const navs = gsap.utils.toArray(".toc");
    navs[0].querySelectorAll(".toc__chapters > li").forEach((li) => {
      const num = li.querySelector(".toc__chapter-num").textContent.trim();
      let source = li;
      for (const nav of navs) {
        const cand = gsap.utils.toArray(".toc__chapters > li", nav).find(
          (l) => l.querySelector(".toc__chapter.is-current") &&
                 l.querySelector(".toc__chapter-num").textContent.trim() === num
        );
        if (cand) { source = cand; break; }
      }
      const clone = source.cloneNode(true);
      // The live TOC's state rides along on clones (inline accordion heights,
      // is-active / is-current marks) — reset: in the sheet all sub-lists are
      // simply open, every chapter row starts muted (syncSheetActive highlights
      // the one you're in), and each block keeps its own chapter accent.
      clone.querySelectorAll(".toc__sub").forEach((s) => s.removeAttribute("style"));
      clone.querySelectorAll(".is-active").forEach((r) => r.classList.remove("is-active"));
      clone.querySelectorAll(".is-current").forEach((r) => r.classList.remove("is-current"));
      // The preferred clone came from the nav where this chapter is CURRENT —
      // there its row is inert (no data-href). In the sheet every quiet row
      // must navigate (only the is-current one, re-marked by syncSheetActive,
      // stays inert via CSS), so restore the href from the chapter number.
      const row = clone.querySelector(".toc__chapter");
      if (row && !row.dataset.href && !row.dataset.target && /^\d+$/.test(num)) {
        row.dataset.href = "/chapter-" + num;
      }
      if (row) wrapInClip(row);
      clone.style.setProperty("--accent", accentOf(source));
      ul.appendChild(clone);
    });
    return ul;
  }

  function syncSheetActive() {
    const id = entries[active] && entries[active].el.id;
    let activeRow = null;
    panel.querySelectorAll(".toc__row, .toc__subrow").forEach((r) => {
      const on = r.dataset.toc === id;
      r.classList.toggle("is-active", on);
      if (on) activeRow = r;
    });
    // Highlight the chapter you're in (its row, in its own accent). The foreword
    // and About panels carry no .toc__row[data-toc] sections, so they can't be
    // found via activeRow — match their rows directly by id.
    panel.querySelectorAll(".toc__chapter").forEach((c) => {
      const li = c.closest("li");
      const here =
        (id === "ch0" && c.dataset.target === "ch0") ||
        (id === "about" && c.dataset.href === "/about") ||
        (activeRow && li.contains(activeRow));
      c.classList.toggle("is-current", !!here);
      if (here && !activeRow) activeRow = c;
    });
    return activeRow;
  }
  /* ----- Sheet motion: the About popup's wipe, ported (aboutModal(), js/main.js).
     The mask/panel pair counter-translate so the white surface unrolls up out of the
     bar while the index holds still, then the chapter rows rise out of their clips
     and the current chapter's section list fades in behind them. Closing just rolls
     the wipe back down, quicker — the rows ride with it rather than re-staggering.
     Same ease (hrOut) and the same 0.8s/0.55s split as the popup, deliberately: the
     two surfaces should read as one gesture. ----- */
  if (window.CustomEase && !window.CustomEase.get("hrOut")) {
    window.CustomEase.create("hrOut", "0.43, 0.195, 0.02, 1");
  }
  const SHEET_EASE = window.CustomEase ? "hrOut" : "power3.out";
  const sheetRows = () => gsap.utils.toArray(".toc-sheet__clip > .toc__chapter", panel);
  const sheetSubs = () => gsap.utils.toArray(".toc__list", panel);
  // Rows park 100% of their own height down PLUS 8px, clearing the clip's 6px bleed
  // (chapter.css) so no ascender peeks below the line while they're hidden.
  const ROW_PARKED = { yPercent: 100, y: 8 };
  const ROW_SHOWN = { yPercent: 0, y: 0 };

  // Park every animated target at its off-screen start — called once at init (so the
  // sheet is hidden before its first open) and at the top of openSheet, so a re-open
  // starts clean wherever a prior close was interrupted.
  // y:0 is load-bearing — the CSS parked state (chapter.css) is a translateY(100%),
  // and GSAP parses that into a px `y` on first touch, then stacks yPercent ON TOP of
  // it. Left alone the pair rests at ±100% instead of 0 (it still LOOKS right, because
  // the bogus baseline cancels between mask and panel — but the window is parked a
  // screen too low). Same trap coverScroll() guards in js/main.js; see gotchas.md.
  function parkSheet() {
    gsap.set(sheetMask, { y: 0, yPercent: 100 });   // clip window one full height below
    gsap.set(panel, { y: 0, yPercent: -100 });      // counter-translated → index at rest
    gsap.set(sheetRows(), ROW_PARKED);
    gsap.set(sheetSubs(), { autoAlpha: 0 });
  }

  // Centre the row you're on WITHOUT scrollIntoView: the panel is transformed while
  // parked, and scrollIntoView would try to scroll the document to chase it. Both
  // rects carry the same transform, so their delta is translation-invariant.
  function centerOn(row) {
    if (!row) return;
    const pr = panel.getBoundingClientRect();
    const rr = row.getBoundingClientRect();
    panel.scrollTop += rr.top - pr.top - (panel.clientHeight - rr.height) / 2;
  }

  function openSheet() {
    const activeRow = syncSheetActive();
    sheet.classList.add("is-open");
    label.setAttribute("aria-expanded", "true");
    const rows = sheetRows(), subs = sheetSubs();
    gsap.killTweensOf([sheetMask, panel, ...rows, ...subs]);
    parkSheet();
    centerOn(activeRow);
    if (reduce) {   // no wipe — snap the surface open
      gsap.set([sheetMask, panel], { yPercent: 0 });
      gsap.set(rows, ROW_SHOWN);
      gsap.set(subs, { autoAlpha: 1 });
      return;
    }
    // The counter-translate pair fires as one: matching duration + ease is
    // load-bearing, any mismatch and the index visibly drifts inside the window.
    gsap.timeline()
      .to(sheetMask, { yPercent: 0, duration: 0.8, ease: SHEET_EASE }, 0)
      .to(panel, { yPercent: 0, duration: 0.8, ease: SHEET_EASE }, 0)
      .to(rows, { ...ROW_SHOWN, duration: 0.7, ease: SHEET_EASE, stagger: 0.06 }, 0.28)
      .to(subs, { autoAlpha: 1, duration: 0.5, ease: SHEET_EASE }, 0.42);
  }
  function closeSheet() {
    if (!sheet || !sheet.classList.contains("is-open")) return;
    sheet.classList.remove("is-open");
    label.setAttribute("aria-expanded", "false");
    gsap.killTweensOf([sheetMask, panel]);
    if (reduce) { parkSheet(); return; }
    gsap.timeline()
      .to(sheetMask, { yPercent: 100, duration: 0.55, ease: SHEET_EASE }, 0)
      .to(panel, { yPercent: -100, duration: 0.55, ease: SHEET_EASE }, 0);
  }
  parkSheet();
  label.addEventListener("click", () => (sheet.classList.contains("is-open") ? closeSheet() : openSheet()));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

  // Sheet rows: section/sub rows jump in-page; chapter rows resolve like the
  // menu (in-page in the reader via GTCRoutes, full load on standalone pages).
  panel.addEventListener("click", (e) => {
    const row = e.target.closest("[data-toc], [data-target], [data-href]");
    if (!row) return;
    e.preventDefault();
    closeSheet();
    const id = row.dataset.toc || row.dataset.target;
    if (id) {
      const i = entries.findIndex((en) => en.el.id === id);
      if (i >= 0) jumpTo(i);
      return;
    }
    const chapterId = window.GTCRoutes && window.GTCRoutes.pathToId(row.dataset.href);
    const target = chapterId && document.getElementById(chapterId);
    if (target) {
      if (smoother) smoother.scrollTo(target, !reduce, "top top");
      else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    } else if (window.GTCNav) {
      window.GTCNav.to(row.dataset.href); // navigation fade (js/transition.js)
    } else {
      window.location.href = row.dataset.href;
    }
  });
}

/* ---- TOC collapse: the ← control in the TOC header tucks the contents
   column into the left rail; the rotated "Table of contents →" mark at the
   top of the rail brings it back.

   One connected gesture: the state class flips at the START of either
   direction (it drives .copy's 0.4s CSS slide + the rail pin's fade), while
   GSAP tweens the TOC column's real width/margin closed/open on the SAME
   curve, fading the contents in sync. The contents (.toc__head/.toc__scroll)
   keep a fixed 328px measure in CSS under overflow:hidden, so the shrinking
   column clips them at its sweeping edge — nothing squashes. Inline GSAP
   styles override the class's width snap until the tween lands, then
   clearProps hands the resting state back to the CSS. One ScrollTrigger
   refresh after everything settles. Runs before the FOUC lift so a saved
   "collapsed" never flashes the open TOC. Desktop-only (≥1181, where the rail
   + its restore control exist): ≤1180 the controls hide, no collapse, and the
   matchMedia at the end forces the TOC visible regardless of saved state. ---- */
function tocCollapse() {
  const tocs = gsap.utils.toArray(".toc");
  const railBtn = document.querySelector(".rail__toc");
  if (!tocs.length || !railBtn) return; // foreword standalone: no TOC, no control
  const KEY = "gtc-toc";
  const html = document.documentElement;
  const DUR = 0.4;          // must match .copy transition duration in CSS
  const EASE = window.CustomEase
    ? window.CustomEase.create("tocSlide", "0.4, 0, 0.2, 1") // .copy's exact bezier
    : "power2.inOut";
  const parts = tocs.flatMap((t) => Array.from(t.children)); // .toc__head + .toc__scroll
  let tl = null;

  // The collapse feature only exists ≥1181 (with the rail's restore control);
  // below that the TOC is always shown, so never apply a saved "collapsed" state.
  const canCollapse = () => window.matchMedia("(min-width: 1181px)").matches;
  const readSaved = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  if (readSaved() === "collapsed" && canCollapse()) {
    html.classList.add("toc-collapsed");
    gsap.set(parts, { autoAlpha: 0 }); // pre-hidden for a clean expand later
  }
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } };

  // A single ScrollTrigger.refresh after the whole sequence settles. `after`
  // runs post-refresh — required for focusing anything inside .toc: the
  // refresh re-wraps pinned elements in their pin-spacers (a reparent), which
  // would blur a focus set any earlier.
  let refreshCall = null;
  const refreshSoon = (delay, after) => {
    if (refreshCall) refreshCall.kill();
    refreshCall = gsap.delayedCall(reduce ? 0 : delay, () => {
      ScrollTrigger.refresh();
      if (after) after();
    });
  };

  // Move focus only on KEYBOARD activation (click.detail === 0). ScrollSmoother
  // scroll-centres any focused element that's outside the viewport (its own
  // focusin handler — focus({preventScroll}) can't stop it), so focusing after
  // a mouse click would yank the reader to chapter 1's cover. When we do move
  // it, target the collapse control nearest the viewport, not the document's
  // first (= chapter 1's in the reader).
  const nearestCollapse = () => {
    const mid = window.innerHeight / 2;
    return gsap.utils.toArray(".toc__collapse").reduce((best, b) => {
      const d = Math.abs(b.getBoundingClientRect().top + 14 - mid);
      return !best || d < best.d ? { b, d } : best;
    }, null).b;
  };

  // The TOC's resting width/margin are fluid (clamp() vars in css/chapter.css),
  // so the expand target must be MEASURED, not hardcoded: lift the inline
  // overrides off one column, read the CSS-resolved geometry, put them back —
  // all in the same frame, so nothing paints in between.
  const restingTarget = () => {
    const el = tocs[0];
    const prev = { w: el.style.width, ml: el.style.marginLeft, mw: el.style.maxWidth };
    el.style.width = ""; el.style.marginLeft = ""; el.style.maxWidth = "none";
    const cs = getComputedStyle(el);
    const t = { w: parseFloat(cs.width), ml: parseFloat(cs.marginLeft) };
    el.style.width = prev.w; el.style.marginLeft = prev.ml; el.style.maxWidth = prev.mw;
    return t;
  };

  // Freeze the column at its current size inline — interrupt-safe (reads the
  // live values mid-tween too) — so flipping the class never snaps it.
  // maxWidth must be released too: stickyToc's pin bakes an inline max-width
  // on .toc at every ScrollTrigger.refresh, which would clamp the width tween
  // (e.g. max-width:0 baked while collapsed kills the expand). The refresh in
  // refreshSoon re-bakes the correct value once the gesture settles.
  const hold = () => gsap.set(tocs, {
    width: (i, el) => el.offsetWidth,
    marginLeft: (i, el) => gsap.getProperty(el, "marginLeft"),
    maxWidth: "none",
    overflow: "hidden",
  });
  const settle = () => gsap.set(tocs, { clearProps: "width,maxWidth,marginLeft,overflow" });

  function collapse(kbd) {
    save("collapsed");
    if (tl) tl.kill();
    if (reduce) {
      html.classList.add("toc-collapsed");
      gsap.set(parts, { autoAlpha: 0 });
      settle();
      refreshSoon(0);
      if (kbd) railBtn.focus({ preventScroll: true });
      return;
    }
    hold();
    html.classList.add("toc-collapsed"); // copy starts sliding; rail pin blooms in
    tl = gsap.timeline({
      onComplete() {
        settle(); // class owns the collapsed resting state
        if (kbd) railBtn.focus({ preventScroll: true });
      },
    });
    tl.to(parts, { autoAlpha: 0, duration: 0.25, ease: "power2.in" }, 0)
      .to(tocs, { width: 0, marginLeft: 0, duration: DUR, ease: EASE }, 0);
    refreshSoon(DUR + 0.1);
  }
  function expand(kbd) {
    save("open");
    if (tl) tl.kill();
    const refocus = kbd ? () => nearestCollapse().focus({ preventScroll: true }) : null;
    if (reduce) {
      html.classList.remove("toc-collapsed");
      gsap.set(parts, { autoAlpha: 1 });
      settle();
      refreshSoon(0, refocus);
      return;
    }
    hold(); // pin the column closed BEFORE dropping the class — no snap-open
    html.classList.remove("toc-collapsed"); // copy starts sliding back; rail pin fades out
    const { w, ml } = restingTarget(); // measured AFTER the class drop = true resting values
    tl = gsap.timeline({ onComplete: settle });
    tl.to(tocs, { width: w, marginLeft: ml, duration: DUR, ease: EASE }, 0)
      .to(parts, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }, 0.12);
    refreshSoon(DUR + 0.1, refocus);
  }
  document.querySelectorAll(".toc__collapse").forEach((b) => b.addEventListener("click", (e) => collapse(e.detail === 0)));
  document.querySelectorAll(".toc__head-label").forEach((l) => l.addEventListener("click", () => collapse(false)));
  railBtn.addEventListener("click", (e) => expand(e.detail === 0));

  // Below 1181 there is no rail and no collapse. If the window shrinks into that
  // band while collapsed, strip the inline hide so the (now always-shown) TOC
  // can't stay invisible; restore the saved state on re-entry above 1180.
  gsap.matchMedia().add("(max-width: 1180px)", () => {
    html.classList.remove("toc-collapsed");
    gsap.set(parts, { clearProps: "opacity,visibility" });
    gsap.set(tocs, { clearProps: "width,maxWidth,marginLeft,overflow" });
    return () => {
      if (readSaved() === "collapsed") {
        html.classList.add("toc-collapsed");
        gsap.set(parts, { autoAlpha: 0 });
      }
    };
  });
}

/* ---- Top-bar scrim toggle: the soft chalk fade behind the logo/hamburger (mobile,
   CSS) keeps scrolling body copy from clashing with them — but over a coloured
   chapter hero the top band is empty with a dark logo, so a chalk fade would read as
   a band. Switch it off (html.topbar-clear) whenever a hero fills the top band.
   Cheap probe of the hero rects on scroll; mirrors railReveal's top-edge logic. ---- */
function topbarScrim() {
  const root = document.documentElement;
  const heroes = gsap.utils.toArray(".page-hero");
  if (!heroes.length) return; // no hero (e.g. standalone foreword) → chalk scrim always fits
  const PROBE = 64;           // a line just below the bar
  const update = () => {
    const overHero = heroes.some((h) => {
      const r = h.getBoundingClientRect();
      return r.top <= PROBE && r.bottom >= PROBE;
    });
    root.classList.toggle("topbar-clear", overHero);
  };
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: update, onRefresh: update });
  update();
}

/* ---- About panel (reader-only): the embedded About terminal panel (#about,
   mirrors about.html). Ports the standalone page's motion — the photo gallery's
   staggered rise + pinned horizontal scroll (the closing credits section rides
   the shared .reveal batch) — scoped to the one #about panel and driven by the
   reader's shared ScrollSmoother (js/about.js is NOT loaded here). Also inverts the topbar logo
   to chalk while the dark About panel sits under the bar. The panel is the LAST
   .chapter-panel, so panelTransitions leaves it alone (it never scales out) while
   ch5 now hands off into it. ---- */
function aboutPanel() {
  const panel = document.getElementById("about");
  if (!panel) return;

  // Topbar scrim + logo follow the dark About panel. A live-rect probe (not a
  // start/end ScrollTrigger) because the gallery pin below shifts the panel's
  // measured geometry — the same reason topbarScrim/railReveal probe rects.
  //
  // The scrim is two clipped ramps (chalk above --scrim-split, dark below — see
  // chapter.css), so the split IS the panel's top edge clamped into the band:
  // while ch5 hands off, the band is chalk backdrop above the rising panel and
  // dark panel below, and each half gets its own colour. Clamping alone covers
  // every case — panel far below → split = full height = all chalk; panel owning
  // the band → split = 0 = all dark — so no class is needed for the scrim.
  const root = document.documentElement;
  const topbar = document.querySelector(".topbar");
  const logo = document.querySelector(".topbar__logo");
  let scrimH = 180;
  // env(safe-area-inset-top) isn't readable from JS — measure the band instead.
  const measureScrim = () => {
    const h = parseFloat(getComputedStyle(topbar, "::before").height);
    if (h) scrimH = h;
  };
  const darkUpdate = () => {
    const r = panel.getBoundingClientRect();
    root.style.setProperty("--scrim-split", gsap.utils.clamp(0, scrimH, r.top) + "px");
    // Logo → chalk once the panel's edge passes the logo's middle. It can't use a
    // fixed line below the bar any more: the scrim no longer pre-paints dark across
    // the whole band, so flipping early would put a white logo on chalk.
    if (!logo) return;
    const lr = logo.getBoundingClientRect();
    const mid = lr.top + lr.height / 2;
    root.classList.toggle("reader-dark", r.top <= mid && r.bottom >= mid);
  };
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: darkUpdate,
    onRefresh: () => { measureScrim(); darkUpdate(); },
  });
  measureScrim();
  darkUpdate();

  const gallery = panel.querySelector(".about-gallery");
  const strip = gallery && gallery.querySelector(".about-gallery__strip");
  const items = gsap.utils.toArray(".about-gallery__item", panel);

  // No rise / no pin — CSS handles a native swipe; the credits' .reveal
  // elements are shown by the reduced-motion override in chapter.css.
  if (reduce) return;

  // Gallery photos rise once on enter (y only), before the horizontal pin engages.
  // matchMedia rebuilds the right travel on resize/rotate; the pin/scrub lives on
  // the strip (x), the rise on the items (y), so the two transforms never fight.
  if (items.length && gallery) {
    const mm = gsap.matchMedia();
    mm.add({ isMobile: "(max-width: 768px)", isDesktop: "(min-width: 769px)" }, (ctx) => {
      const rise = ctx.conditions.isMobile ? 110 : 300; // gentler on phones (photos ~120px tall)
      gsap.set(items, { y: rise, willChange: "transform", force3D: true });
      gsap.to(items, {
        y: 0, duration: 1.15, delay: 0.15, ease: "expo.out",
        stagger: { each: 0.14, from: "start" }, force3D: true,
        scrollTrigger: { trigger: gallery, start: "top 85%", once: true },
        onComplete: () => gsap.set(items, { willChange: "auto" }),
      });
    });
  }

  // Pin the gallery at viewport centre and translate the strip left by its overflow —
  // scroll distance = the strip's own width, so the pace reads 1:1. A short dead zone
  // (holdFraction) keeps it still until the rise above has settled. pinType:"transform"
  // is required under ScrollSmoother (see .claude/docs/gotchas.md).
  if (strip && gallery) {
    const holdFraction = 0.16;
    const holdEase = (p) => (p < holdFraction ? 0 : (p - holdFraction) / (1 - holdFraction));
    gsap.to(strip, {
      x: () => -(strip.scrollWidth - window.innerWidth),
      ease: holdEase,
      scrollTrigger: {
        trigger: gallery, pin: true, pinType: "transform", scrub: true,
        start: "center center", end: () => "+=" + strip.scrollWidth, invalidateOnRefresh: true,
      },
    });
  }

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
        // Snap, proximity-based: settles on whichever end (0 = stay, 1 = next chapter) is
        // closer, so it always lands ON a chapter, never half-cut. Deliberately NOT
        // directional — a directional bias completes the hand-off on the tiniest forward
        // nudge, which read as "scrolling past is too easy." Proximity means you have to
        // scroll roughly halfway through the transition before it commits, giving readers
        // real resistance/feedback that a chapter boundary is happening.
        snap: {
          snapTo: [0, 1],
          duration: { min: 0.4, max: 0.5 },
          delay: 0.00,                      // snap almost immediately after the scroll stops
          ease: "power2.out",
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
  // The dark, full-bleed About panel occludes the rail exactly like a coloured hero
  // (both are multi-viewport surfaces the fixed rail must not float over): a rising
  // About eats the rail bottom→top through the ch5→About transition, and it stays
  // hidden while you read About. So fold the About panel into the occluder set.
  const heroes = [...gsap.utils.toArray(".page-hero"), ...gsap.utils.toArray(".chapter-panel--about")];
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

/* Fade the held-back content in once positioned (instant under reduced motion).
   Duration/ease mirror the site-wide navigation entrance (styles.css gtc-page-in
   + js/transition.js) — this IS the arrival animation when a landing book
   deep-links into a chapter, so a quick pop here would undo the slow fade. */
function revealDeepLink() {
  const root = document.documentElement;
  if (!root.classList.contains("deeplinking")) return;
  const content = document.getElementById("smooth-content");
  if (content && !reduce && gsap) {
    if (window.CustomEase && !window.CustomEase.get("hrOut")) {
      window.CustomEase.create("hrOut", "0.43, 0.195, 0.02, 1");
    }
    gsap.fromTo(content, { opacity: 0 }, { opacity: 1, duration: 1.3, ease: "hrOut" });
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
