# Mobile/tablet landing scroll — scrubbed cover→intro

**Date:** 2026-06-08
**Surface:** `index.html` landing motion, implemented in `js/main.js` (`heroScene`).
**Goal:** Fix the buggy, non-smooth cover→intro scroll transition on touch devices
(phones + tablets). Keep desktop behavior identical.

## Problem

After the load-in (pinwheel rise/align), the cover→intro transition is driven by
`heroScene()` (`js/main.js` ~176–194): a `ScrollTrigger` **pins** `#hero` for one
viewport height and, on the first scroll-down past 5% progress, plays a *timed*
timeline once (cover fades out, pinwheel glides to the header slot, logo/header/body
animate in, shelf rises); the first upward scroll reverses it.

On touch this feels janky for two reasons:

1. **Timed, not scrubbed.** The animation runs at its own fixed pace while the page is
   pinned, fighting the user's momentum scroll. The motion is disconnected from the
   finger.
2. **URL-bar resize churn.** `end: () => "+=" + window.innerHeight` plus
   `invalidateOnRefresh: true` means every time the mobile address bar shows/hides it
   fires a resize → `ScrollTrigger.refresh()` → `window.innerHeight` changes → the pin
   recomputes and jumps mid-scroll.

## Decisions (from brainstorming)

- Keep the transition on mobile (don't disable or simplify it) — just make it smooth.
- On touch it should **scrub**: animation progress tracks scroll position 1:1, both
  directions.
- **Desktop stays exactly as-is** (timed play-once). Only touch gets the new path.
- Detect touch via **`(pointer: coarse)`** (catches phones + tablets regardless of
  width; misses width-only false positives).

## Design

Changes are confined to `js/main.js`.

### 1. Branch by pointer type with `gsap.matchMedia()`

In `heroScene()`, keep the shared setup outside the branch:
- `gsap.set(row, { x:0, y:0, xPercent:-50, yPercent:-50 })`
- the `reduce` early-return
- the hidden start-states: `headSpans` y-offset, `.home-logo`, `.intro__body p`

Then create a `gsap.matchMedia()` and register two contexts:

- `"(pointer: fine)"` → **the current code, unchanged**: build paused `master` +
  `titleTl`, create the pin ScrollTrigger with the direction-based play/reverse
  `onUpdate`. No behavioral change on desktop.
- `"(pointer: coarse)"` → the scrubbed path (below).

matchMedia handles teardown/rebuild on pointer-type change, so the two paths never
coexist and tweens from the inactive branch are reverted cleanly. Timelines for each
branch are built **inside** their context callback so matchMedia owns their lifecycle.

### 2. Coarse (touch) path — scrub

- Build one timeline with the same tweens as the desktop `master` (arrow/cover fade out,
  `pinwheelProx.scrolled` 0→1, `.home-logo`, `.intro__body p`, spines, books rise +
  settle), **plus the header line-clip wipe folded in** at its existing `0.5` offset.
  No separate `titleTl` on touch — with scrub, the exit speed equals the drag-back
  speed, so the "faster exit" hack isn't needed.
- Attach it to a `ScrollTrigger`:
  - `trigger: hero`, `start: "top top"`, `end: "+=" + window.innerHeight`
  - `pin: true`, `anticipatePin: 1`
  - `scrub: 0.6` (light smoothing so momentum scroll isn't rubbery)
  - `invalidateOnRefresh: true` (recompute on genuine rotation)
  - the timeline is the trigger's `animation` (scrubbed), not `paused`.
- **Load-in handoff:** on the first `onUpdate` with `self.progress > 0`, finish the
  load-in once — `if (loadTl) { loadTl.progress(1).kill(); loadTl = null; }` — so the
  pinwheel's `rise`/`align` channels are settled before the scrubbed `scrolled` channel
  drives `place()`. Prevents the pinwheel double-moving if the user scrolls mid-load.

### 3. Kill URL-bar resize jank globally

Add once at setup (e.g. alongside the other ScrollTrigger setup in `init`/`smoothScroll`):

```js
ScrollTrigger.config({ ignoreMobileResize: true });
```

GSAP's built-in fix for the exact symptom: the nuisance resize from the mobile address
bar showing/hiding no longer forces a refresh/pin recompute. Real orientation changes
still refresh.

## Why this works

- Scrub ties motion to the finger → removes the "disconnected, won't smooth" feel (1).
- `ignoreMobileResize` stops the pin from jumping when the URL bar moves (2).
- `(pointer: coarse)` + matchMedia isolates the change to touch; desktop is byte-for-byte
  the same path it is today.

## Out of scope

- Desktop timed behavior (unchanged).
- Reduced-motion path (unchanged — still bails to the static after-scroll layout).
- Chapter pages / reader motion.

## Testing

Per the `headless-motion-verification` memory (CDP, headless Chrome, watch for the
rAF-ticker stall):

1. **Touch viewport (coarse pointer / mobile metrics):** scroll partway → assert the
   timeline progress is partial (scrubbed, not snapped to 0/1); scroll back → assert it
   reverses proportionally. Simulate a viewport-height change (URL-bar) → assert the pin
   does not jump.
2. **Desktop (`pointer: fine`):** confirm play-once-on-direction still fires and reverses
   as before.
3. No console errors on either path; reduced-motion still shows the static layout.
