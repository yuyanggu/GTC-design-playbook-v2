# Mobile/tablet landing scroll — timed play-once (drop scrub)

**Date:** 2026-06-08
**Surface:** `index.html` landing motion, `js/main.js` (`heroScene`).
**Goal:** On touch devices, stop mapping scroll position/speed to animation progress
(scrub). Instead play the cover→intro transition once at its own fixed, designed
duration when the user scrolls past a small threshold — the same model desktop uses.

**Supersedes** the touch behavior introduced in
`2026-06-08-mobile-scroll-scrub-design.md` (scrub). The `ignoreMobileResize` config
and the `gsap.matchMedia()` branch structure from that change are kept.

## Decisions (from brainstorming)

- Touch animation should be **timed play-once on scroll** (not scrub): a scroll past
  the threshold plays the whole sequence at a fixed duration regardless of scroll
  speed/amount; scrolling back to the top reverses it. Same model as desktop.
- **Keep the `gsap.matchMedia()` branch** (don't fully unify) so a touch-specific
  variant remains possible later.
- Keep **`anticipatePin: 1`** on the touch ScrollTrigger for a smoother pin grab during
  momentum scroll. Desktop keeps no anticipatePin (unchanged).

## Design

All changes confined to `js/main.js` → `heroScene()`.

### Shared timed builder

Extract one helper inside `heroScene` (after the shared region-1 setup), so both
branches share the timed logic instead of duplicating ~50 lines:

```
buildTimedHero({ anticipatePin = 0 } = {})
```

It builds, exactly as the current desktop branch does:
- a paused `master` timeline: arrow fade-out, cover (`.eyebrow--top`/`.lockup`)
  fade-out, `pinwheelProx.scrolled` 0→1, `.home-logo`, `.intro__body p`, spines, books
  (back/elastic) — same eases/durations/offsets as today.
- a separate paused `titleTl`: the `headSpans` line-clip wipe at offset `0.5`.
- a `ScrollTrigger.create` with `trigger: hero`, `start: "top top"`,
  `end: () => "+=" + window.innerHeight`, `pin: true`, `invalidateOnRefresh: true`, and
  `anticipatePin` set from the option (omit/0 when not passed). The `played`-flag
  `onUpdate`: on `direction === 1 && progress > 0.05` → finish `loadTl`
  (`loadTl.progress(1); loadTl.kill(); loadTl = null`), `master.timeScale(1).play()`,
  `titleTl.timeScale(1).play()`; on `played && direction === -1` →
  `master.timeScale(1).reverse()`, `titleTl.timeScale(2.2).reverse()`.

### Branches

```js
const mm = gsap.matchMedia();
mm.add("(pointer: fine)",   () => buildTimedHero());
mm.add("(pointer: coarse)", () => buildTimedHero({ anticipatePin: 1 }));
```

### Removed (from the scrub version)

- the scrubbed timeline `tl`, `scrub: 0.6`, `animation: tl`
- the `loadDone` flag + its first-frame load handoff (replaced by the `played` flag's
  load handoff, identical to desktop)
- the title wipe folded into the coarse timeline (touch returns to the separate
  `titleTl` with the faster `timeScale 2.2` exit)
- the cross-branch "keep tweens in sync" comment (no longer two copies)

### Kept

- `ScrollTrigger.config({ ignoreMobileResize: true })` (still aids pin stability).
- the `gsap.matchMedia()` structure and reduced-motion bail (`if (reduce) return`
  before the matchMedia, unchanged).

## Why

The user found scroll-speed-to-animation-speed mapping undesirable. A timed play-once
decouples the animation from drag speed: the motion always runs at its authored pace.
`anticipatePin` keeps the touch pin grab smooth; `ignoreMobileResize` keeps the URL-bar
from jumping the pin.

## Out of scope

- Desktop feel (unchanged — still timed play-once; only refactored to call the shared
  helper, behavior identical).
- Reduced-motion path, chapter pages, reader.
- The separate in-progress prologue work in the working tree.

## Testing

CDP headless (per `headless-motion-verification` memory — set `gtc-auth` localStorage +
reload to clear the gate, emulate `prefers-reduced-motion: no-preference`, and
`(pointer: coarse)` for the touch path):

1. **Touch:** the `#hero` pin trigger has `vars.scrub == null` and
   `vars.anticipatePin == 1`. Scroll past threshold → `master` plays (logo/intro reach
   full opacity) over time, NOT locked to scroll fraction; scroll back to top →
   reverses. No console errors.
2. **Desktop:** the `#hero` pin trigger has `scrub == null` and no anticipatePin (0);
   timed play-once still works.
3. Reduced-motion still shows the static after-scroll layout; no console errors.
