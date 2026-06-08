# Mobile Scrubbed Cover→Intro Scroll — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On touch devices, make the landing cover→intro transition scrub 1:1 with scroll (instead of timed play-once) and stop the mobile URL-bar from jumping the pin — while leaving desktop behavior byte-for-byte unchanged.

**Architecture:** Branch `heroScene()` with `gsap.matchMedia()`. The `(pointer: fine)` context keeps today's paused `master` + `titleTl` + direction-based play/reverse trigger verbatim. The `(pointer: coarse)` context builds one timeline (master tweens + folded-in title wipe) attached to a scrubbed, pinned `ScrollTrigger`, finishing the load-in on first scroll. A global `ScrollTrigger.config({ ignoreMobileResize: true })` removes the address-bar resize churn.

**Tech Stack:** Vanilla JS (ES modules), GSAP + ScrollTrigger. No build step, no test runner — verification is headless Chrome via CDP (see project memory `headless-motion-verification`) plus manual preview at `http://localhost:8124/index.html`.

**Reference spec:** `docs/superpowers/specs/2026-06-08-mobile-scroll-scrub-design.md`

---

## Verification notes (read once)

- **No unit-test framework exists.** "Verify it fails / passes" steps are behavioral checks run via CDP against `python3 -m http.server 8124`, or by reading the diff. Where a step says "Run", run that.
- **Emulate a coarse pointer in headless Chrome:** launch with a mobile device metrics override, or in CDP set `Emulation.setEmulatedMedia` for `(pointer: coarse)` and `Emulation.setDeviceMetricsOverride` for a phone viewport. The branch under test is selected purely by the `(pointer: coarse)` media query.
- **rAF-ticker stall gotcha:** GSAP's ticker can stall in headless; drive `requestAnimationFrame` / dispatch real scroll as documented in the `headless-motion-verification` memory before asserting timeline progress.
- Keep all edits inside `js/main.js`.

---

## Task 1: Add global `ignoreMobileResize` config

**Files:**
- Modify: `js/main.js` (boot block, ~560–566)

- [ ] **Step 1: Confirm current boot block**

Read `js/main.js:560–575`. Confirm the `if (!window.__GTC_LOCKED__) {` block calls `smoothScroll()` then `heroScene()`, and that `ScrollTrigger` is already in scope (declared at top, `const ScrollTrigger = window.ScrollTrigger;`).

- [ ] **Step 2: Add the config line at the top of the boot block**

In `js/main.js`, change the start of the boot block from:

```js
if (!window.__GTC_LOCKED__) {
  smoothScroll();   // create the smoother first so the pinned ScrollTriggers attach to it
```

to:

```js
if (!window.__GTC_LOCKED__) {
  // Ignore the resize mobile browsers fire when the address bar shows/hides — it would
  // otherwise refresh ScrollTrigger and jump the hero pin mid-scroll. Real rotations
  // still refresh (different event).
  if (ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });
  smoothScroll();   // create the smoother first so the pinned ScrollTriggers attach to it
```

- [ ] **Step 3: Verify no console errors**

Run: `python3 -m http.server 8124` and load `http://localhost:8124/index.html` (or via CDP).
Expected: page boots, desktop landing animation still plays on scroll, **no console errors**. (The config is a no-op on desktop; this step just confirms it loads.)

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "landing: ignoreMobileResize so the URL bar doesn't jump the hero pin"
```

---

## Task 2: Split `heroScene()` into shared setup + matchMedia branches (desktop unchanged)

This task is a pure refactor: extract the trigger-creation into a `(pointer: fine)` matchMedia context with **identical** code, leaving a `(pointer: coarse)` stub. Behavior on desktop must not change.

**Files:**
- Modify: `js/main.js` — `heroScene()` (~125–195)

- [ ] **Step 1: Read the current `heroScene()` in full**

Read `js/main.js:125–195`. Note the three regions:
1. shared setup (lines ~126–143): guards, `gsap.set(row…)`, `reduce` return, hidden start-states for `headSpans` / `.home-logo` / `.intro__body p`.
2. `master` + `titleTl` timeline construction (~149–169).
3. the pin `ScrollTrigger.create({…})` with `played` flag (~175–194).

- [ ] **Step 2: Wrap regions 2+3 in a `gsap.matchMedia()` `(pointer: fine)` context**

Keep region 1 exactly as-is. Replace everything from `const master = gsap.timeline({ paused: true });` (line ~149) through the end of the `ScrollTrigger.create({…});` call (line ~194) with:

```js
  const mm = gsap.matchMedia();

  // ── Desktop / fine pointer: timed play-once (unchanged behavior) ──────────────
  mm.add("(pointer: fine)", () => {
    // The whole transition as one timed timeline (played once on scroll, reversible).
    const master = gsap.timeline({ paused: true });
    master
      .to("#arrow", { autoAlpha: 0, duration: 0.28, ease: "power2.in" }, 0)
      .to([".eyebrow--top", ".lockup"], { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0.04);
    if (pinwheelProx) master.to(pinwheelProx, { scrolled: 1, duration: 0.95, ease: "power3.inOut" }, 0.1);
    master
      .to(".home-logo", { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.4)
      .to(".intro__body p", { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.14, ease: "power2.out" }, 0.78);
    hbSpines.forEach((s, i) => master.to(s, { y: 0, duration: 0.55, ease: "power2.out" }, 0.5 + i * 0.05));
    hbBooks.forEach((b, i) => {
      master
        .to(b, { y: 0, duration: 0.62, ease: "back.out(1.3)" }, 0.6 + i * 0.08)
        .to(b, { rotation: 0, duration: 1.0, ease: "elastic.out(1, 0.4)" }, "<0.25");
    });

    // Header line-clip wipe on its OWN timeline so its EXIT can run faster than entrance.
    const titleTl = gsap.timeline({ paused: true });
    titleTl.to(headSpans, { y: 0, duration: 0.8, stagger: 0.13, ease: "power3.out" }, 0.5);

    let played = false;
    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: () => "+=" + window.innerHeight,
      pin: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (!played && self.direction === 1 && self.progress > 0.05) {
          played = true;
          if (loadTl) { loadTl.progress(1); loadTl.kill(); loadTl = null; }
          master.timeScale(1).play();
          titleTl.timeScale(1).play();
        } else if (played && self.direction === -1) {
          played = false;
          master.timeScale(1).reverse();
          titleTl.timeScale(2.2).reverse();
        }
      },
    });
  });

  // ── Touch / coarse pointer: scrubbed (added in Task 3) ───────────────────────
  mm.add("(pointer: coarse)", () => {
    // Filled in Task 3.
  });
```

Note: `hero`, `row`, `headSpans`, `pinwheelProx`, `loadTl`, `hbSpines`, `hbBooks`, `ScrollTrigger`, `gsap` are all already in scope from region 1 / module scope, so the contexts close over them.

- [ ] **Step 3: Verify desktop behavior is unchanged**

Run via CDP / browser at a **fine-pointer** desktop viewport (default headless is fine-pointer):
load `index.html`, let the load-in finish, scroll down ~1 viewport.
Expected: cover fades, pinwheel rises to header slot, header/body/logo/books animate in (timed), scroll back up reverses — **exactly as before this change**. No console errors. The coarse stub does nothing on desktop.

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "landing: branch heroScene via matchMedia (fine = current behavior)"
```

---

## Task 3: Implement the scrubbed touch path

**Files:**
- Modify: `js/main.js` — the `(pointer: coarse)` matchMedia context added in Task 2

- [ ] **Step 1: Replace the coarse stub with the scrubbed implementation**

Replace:

```js
  mm.add("(pointer: coarse)", () => {
    // Filled in Task 3.
  });
```

with:

```js
  mm.add("(pointer: coarse)", () => {
    // One timeline driven directly by scroll position (scrub). The header line-clip
    // wipe is folded in at the same 0.5 offset — no separate faster-exit titleTl,
    // since with scrub the reverse speed already equals the drag-back speed.
    const tl = gsap.timeline();
    tl
      .to("#arrow", { autoAlpha: 0, duration: 0.28, ease: "power2.in" }, 0)
      .to([".eyebrow--top", ".lockup"], { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0.04);
    if (pinwheelProx) tl.to(pinwheelProx, { scrolled: 1, duration: 0.95, ease: "power3.inOut" }, 0.1);
    tl
      .to(".home-logo", { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.4)
      .to(headSpans, { y: 0, duration: 0.8, stagger: 0.13, ease: "power3.out" }, 0.5)
      .to(".intro__body p", { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.14, ease: "power2.out" }, 0.78);
    hbSpines.forEach((s, i) => tl.to(s, { y: 0, duration: 0.55, ease: "power2.out" }, 0.5 + i * 0.05));
    hbBooks.forEach((b, i) => {
      tl
        .to(b, { y: 0, duration: 0.62, ease: "back.out(1.3)" }, 0.6 + i * 0.08)
        .to(b, { rotation: 0, duration: 1.0, ease: "elastic.out(1, 0.4)" }, "<0.25");
    });

    let loadDone = false;
    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: () => "+=" + window.innerHeight,
      pin: true,
      anticipatePin: 1,
      scrub: 0.6,
      invalidateOnRefresh: true,
      animation: tl,
      onUpdate: (self) => {
        // Finish the load-in once, the moment scrubbing begins, so the pinwheel's
        // rise/align is settled before the scrubbed `scrolled` channel drives place().
        if (!loadDone && self.progress > 0) {
          loadDone = true;
          if (loadTl) { loadTl.progress(1); loadTl.kill(); loadTl = null; }
        }
      },
    });
  });
```

- [ ] **Step 2: Verify scrub tracks scroll on touch**

Run via CDP with `(pointer: coarse)` emulated + a phone viewport. Scroll the hero ~40% of one viewport height; read the timeline progress (e.g. the active ScrollTrigger's `.progress` or `tl.progress()`).
Expected: progress ≈ 0.4 (partial — **not** snapped to 0 or 1), pinwheel partway to the header slot, cover partially faded. Scroll to ~80% → progress ≈ 0.8. Scroll back toward top → progress decreases proportionally. (Allow for the `scrub: 0.6` smoothing lag: settle a few rAF frames before reading.)

- [ ] **Step 3: Verify load-in handoff (no pinwheel double-move)**

Run via CDP coarse path: begin scrolling **before** the load-in would naturally finish (immediately after load). 
Expected: `loadTl` is forced to completion on first scroll (`loadTl === null` afterward), the pinwheel travels smoothly from the lockup slot to the header slot with no jump/rewind.

- [ ] **Step 4: Verify the URL-bar / viewport-height change no longer jumps the pin**

Run via CDP coarse path: scroll to ~50%, then change the emulated viewport height (simulating the address bar collapsing) and continue.
Expected: with `ignoreMobileResize` (Task 1) the pin holds; no visible jump or progress reset from the height change.

- [ ] **Step 5: Regression — desktop still unchanged & reduced-motion still static**

Run: fine-pointer desktop viewport → timed play-once still works (Task 2 check still passes). Then emulate `(prefers-reduced-motion: reduce)` → `heroScene` bails before matchMedia (region 1 `if (reduce) return;`), static after-scroll layout shown, no errors.

- [ ] **Step 6: Commit**

```bash
git add js/main.js
git commit -m "landing: scrubbed cover→intro on touch (coarse pointer) for smooth mobile scroll"
```

---

## Task 4: Update docs

**Files:**
- Modify: `.claude/docs/motion.md` — "Scroll choreography (home-v2)" section

- [ ] **Step 1: Add a note about the touch scrub branch**

In `.claude/docs/motion.md`, at the end of the "Scroll choreography (home-v2)" section (after the paragraph describing the `titleTl` faster exit), add:

```markdown
> **Touch devices scrub.** `heroScene` branches with `gsap.matchMedia()`: `(pointer: fine)`
> keeps the timed play-once master above; `(pointer: coarse)` builds one timeline (master
> tweens + the title wipe folded in at 0.5) attached to a `scrub: 0.6`, `anticipatePin: 1`
> pinned ScrollTrigger so the transition tracks the finger 1:1 in both directions. The
> load-in (`loadTl`) is force-completed on the first scrub frame. Globally,
> `ScrollTrigger.config({ ignoreMobileResize: true })` stops the mobile address bar's
> show/hide resize from refreshing the pin mid-scroll.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/docs/motion.md
git commit -m "docs: note touch scrub branch + ignoreMobileResize in motion.md"
```

---

## Self-review checklist (completed by plan author)

- **Spec coverage:** Decision 1 (keep + smooth) → Tasks 2–3; scrub on touch → Task 3; desktop unchanged → Task 2 (verbatim copy) + Task 3 step 5; `(pointer: coarse)` detection → Tasks 2–3 media queries; URL-bar fix → Task 1; testing approach → per-task CDP steps. All spec sections mapped.
- **Placeholder scan:** No TBD/TODO; every code step shows full code. (The Task 2 coarse stub is intentional and replaced in Task 3.)
- **Type/name consistency:** `pinwheelProx`, `loadTl`, `hbSpines`, `hbBooks`, `headSpans`, `hero` used identically across tasks and match current `js/main.js` symbols. Coarse path uses local `tl` + `loadDone`; fine path uses `master`/`titleTl`/`played` — no collisions (separate matchMedia closures).
