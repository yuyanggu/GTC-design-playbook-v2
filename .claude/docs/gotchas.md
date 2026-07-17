# Conventions & gotchas

Hard-won lessons. Read before touching motion, pinning, or anything that fights over a transform.
These are the highest-value notes in the repo — preserve them.

## Animation

- **One animation library per property.** If both Motion One and GSAP animate the same property, the
  loser's *finished* animation (Motion One's WAAPI fill holds its end value above inline styles)
  intermittently overrides the other → the classic "sometimes still visible when scrolling" bug.
  Consolidate to GSAP for anything the scroll scene also touches.
- **Load-entrance + scroll-scrub on the same property** needs two fixes: (1) the scrub tween must be
  `fromTo` with an explicit start and `immediateRender:false` — a plain `.to()` lazily captures its
  start from the element, which the entrance `from(autoAlpha:0)` leaves at 0, making it a `0→0` no-op
  that never animates or restores; (2) kill the entrance tweens on first scroll, or their *late
  completion* snaps the value back to 1 and overrides the (possibly paused) scrub.
- **A filled CSS animation outranks GSAP's inline styles** (same cascade rule as the Motion One
  gotcha above — CSS Animations beat non-important inline declarations). The `gtc-page-in` body
  entrance (`styles.css`) with `fill-mode: both` silently pinned body opacity at 1 and swallowed
  `transition.js`'s GSAP exit fade — the tween "ran" (its html-bg sibling visibly tweened) but the
  page never faded. Keep the fill **`backwards`** so the animation stops applying once finished,
  and have `navigate()` set `body.style.animation = "none"` before tweening in case the entrance is
  still mid-flight.
- Use **`autoAlpha`** (opacity + visibility) for fade-outs so faded elements are truly gone.
- **GSAP-animated CSS custom props must be declared with a real initial value** (e.g.
  `--streak-hide: 100%`), otherwise GSAP reads an empty start and jumps to the end value.
- Always honour `prefers-reduced-motion`: the landing scenes (`pinwheelScene`/`coverScroll`/
  `introScene`/`homeBooks`) bail to end-states and CSS shows everything statically.
- After font load, call `ScrollTrigger.refresh()` (metrics shift can break pin distances).

## Transform fights

- **Center absolutely-positioned hero elements with `left:0;right:0;margin-inline:auto`** (NOT
  `transform: translateX(-50%)`) so GSAP can own the `transform` for animation without conflict.
- **Two transform channels to avoid fights.** When a load/scroll tween and a hover/secondary tween
  both target an element, put them on **different transform channels** so neither `overwrite`s the
  other: the landing books use `y` for the scroll rise/fall and `yPercent` for the hover lift; the
  pinwheel keeps position on the outer `.pinwheel` and rotation on the inner `.pinwheel__spin`. GSAP
  sums `y`+`yPercent`, and `overwrite:"auto"` only kills the *same* property. (Same lesson behind the
  reader's outer/inner `.chapter-panel` split.)
- **Don't animate `yPercent` for a line-clip reveal without zeroing `y` first.** GSAP parses a CSS
  `translateY(…%)` start state into a **px** value in its cache; animating `yPercent` then stacks on
  that stale px offset (the reveal settles half-hidden). Either drive the wipe with **px `y`**
  (measured line height → 0) or `gsap.set({y:0, yPercent:…})` before animating `yPercent` (the
  guard formerly used by about.js's retired `manifestoReveal`, still live in `introScene`'s word rise in main.js).
  **A counter-translate pair hides this bug in plain sight** (bitten 2026-07 porting the About
  popup's wipe to the mobile `.toc-sheet`, `parkSheet()` in chapter.js): when a mask and an inner
  panel both pick up the same stale px baseline, it *cancels between them* — the content lands
  exactly where it should and the animation looks perfect, while the clip window actually rests a
  full screen out of position. Screenshots and rect probes both pass. Only asserting the **computed
  transform is `matrix(1, 0, 0, 1, 0, 0)` at rest** catches it — do that whenever you build one.

## Cross-section travel

- **Cross-section element travel = fixed traveler + invisible in-flow spacer.** The spacer keeps
  layout and accessibility; drive the traveler from the spacer's live rect so it stays responsive and
  hands off to natural scrolling once parked. Center via `translate(-50%,-50%)` written by the ticker
  (GSAP doesn't touch the outer; rotation lives on the inner) so there's no transform fight.
- **Scrubbed position + timed transition:** a timed transition fired inside a pin can be *outrun* —
  if the user scrolls past the pin `end` before it finishes, the section unpins and the (live) target
  starts moving, so the traveler chases it and never settles. Give the timed align enough pinned
  scroll after the trigger point to complete.

## ScrollSmoother & pinning

- **ScrollSmoother** now runs on **every** surface, including the landing (`smooth:1.7`); only
  `#smooth-content` (the `<main>`) is transformed/smoothed. The `position:fixed` **menu overlay,
  pinwheel traveler, and the landing's top-bar logo (`.home-logo`) live OUTSIDE it** (direct children
  of `<body>`) so fixed stays viewport-anchored — a `fixed` element left *inside* `#smooth-content`
  is positioned relative to the transformed ancestor, not the viewport, and won't stay put.
  The pinwheel's `place()` reads the slot's live `getBoundingClientRect()`, which already reflects
  the smoother transform, so the fixed traveler aligns **without lag — but only because `place()` is
  added to `gsap.ticker` AFTER `ScrollSmoother.create()`** (pinwheelScene boots after smoothScroll),
  so each frame it reads the *post*-transform rect. Add it before the smoother and the pinwheel
  trails a frame (the same lag the TOC note below warns about). This per-frame follow is fine here
  because the pinwheel is a small fixed sprite, not an in-flow nav that must glue to content.
- **Two scroll-locks depending on the page.** The **menu** hard-locks scroll via
  `documentElement.style.overflow = "hidden"` (pausing the smoother API tangled with open/close and
  bugged out) — but the menu is absent on the landing. The **About popup** (landing only) instead
  **pauses the smoother** (`smoother.paused(true)` in `lock`, `false` in `unlock`) alongside the
  overflow lock, so the smoothed landing scroll actually freezes while the modal is open.
- **Pinning under ScrollSmoother (the chapter TOC).** CSS `position:sticky`/`fixed` **cannot
  survive** the smoother's transform on `#smooth-content` (a sticky el reads `top:-402` instead of
  sticking; a fixed el is positioned relative to the transformed ancestor, not the viewport). Use a
  GSAP `ScrollTrigger` pin with **`pinType:"transform"`** (the default `"fixed"` also fails — the pin
  is created but applies no compensating transform). The pinned element must be in **normal flow** —
  pinning an `absolute` el or one inside a CSS **grid/flex** cell silently no-ops (hence the TOC is
  `float:left`). **Do NOT hand-roll a per-frame `gsap.ticker` follow** that re-reads
  `getBoundingClientRect` and re-applies the transform: it lands a frame behind the smoother and the
  nav visibly **lags**. The ScrollTrigger pin is internally synced → glued with no lag. (`stickyToc`.)
- **`focus()` scrolls the page under ScrollSmoother — `preventScroll` can't stop it.** The
  smoother installs its own window `focusin` handler that `scrollTo(target, false, "center
  center")`s any focused element it considers out of view (`{preventScroll:true}` only suppresses
  the *native* scroll). So programmatic `.focus()` after a UI action (e.g. moving focus to the TOC
  collapse control after expanding) can yank the reader to wherever that element lives — focusing
  `document.querySelector(".toc__collapse")` scrolls to *chapter 1's* cover. Rules: only move focus
  on **keyboard** activation (`click` event `detail === 0`), pick the instance **nearest the
  viewport**, and do it **after** the settling `ScrollTrigger.refresh()` — the refresh re-wraps
  pinned elements in their pin-spacers (a reparent) which blurs any focus set earlier. (`tocCollapse`.)
- **Animating the size of a pinned element:** every `ScrollTrigger.refresh()` **bakes inline
  `width`/`max-width`/`margin`/`height` onto the pinned element** (to lock it inside its
  pin-spacer). An inline `max-width` baked at refresh time silently **clamps any later width
  tween** — e.g. `max-width:0` baked while the TOC was collapsed made the expand tween advance
  `style.width` with zero visible effect. When tweening a pinned element's width (`tocCollapse`),
  set `maxWidth:"none"` for the duration of the gesture, `clearProps` it after, and let the
  settling `ScrollTrigger.refresh()` re-bake the correct values.

## Clean URLs (reader)

Full scheme + rationale in [reader.md](reader.md) ("Clean URLs & deep-linking"). The traps:

- **Paths need a rewriting host.** The reader is served at `/chapter-2/designing-for-everyone` only
  because `vercel.json` / `_redirects` rewrite `/chapter-*` → `/playbook.html`. Plain
  `python3 -m http.server` won't — a direct deep-path load 404s locally. Open `/playbook.html` in dev,
  or run a rewrite shim to test paths.
- **`<base href="/">` is load-bearing.** A two-segment path makes relative assets resolve against
  `/chapter-2/` → 404. The `<base>` in `playbook.html` fixes it. Don't remove it, and keep any new
  in-page `href` either absolute or `preventDefault`-intercepted (a bare `#foo` resolves to `/#foo`
  under a base).
- **`smoother.scrollTo` is dead for the first few hundred ms after load** — it silently no-ops until
  the smoother's rAF loop is ready. `handleDeepLink` polls-and-corrects (converge) rather than calling
  it once; don't "simplify" it to a single `scrollTo` or cold deep-links land at the top.
- **`.reveal` shifts the rect, not the layout.** Its `translateY(24px)` makes a section head's
  `getBoundingClientRect()` read 24px low until the entrance fires. Snap the deep-link target to
  `{opacity:1, y:0}` before measuring, or it lands 24px short of the 120px offset.
- **Scroll-spy must not write the URL too early.** `urlSync` gates on `urlWriteEnabled` (set after the
  initial `handleDeepLink`); without the gate its first frame at scroll 0 overwrites the incoming
  `/chapter-2` with `/chapter-1`. Uses `replaceState` (not `pushState`/`location.hash`) so it never
  triggers a browser scroll that fights ScrollSmoother.

## Theming

- **Dark-hero rail legibility.** The rail label defaults to `--midnight` (fine on the chalk body); on
  a **dark** hero set `--rail-fg: --chalk` via `railSync`. (Mostly moot now that `railReveal` clips
  the rail away over the heroes — but the var still themes the label where it does show.)

## Fonts

- **A self-hosted "variable" font must actually carry the weight axis.** The original
  `SourceSerif4.woff2` was a regular-only file but its `@font-face` declared `font-weight: 200 900`.
  Result: `font-weight: 600/700` rendered identically to 400 (no bold) **and** the browser wouldn't
  synthesize faux-bold (it trusts the declared range). `document.fonts.check('700 …')` returns `true`
  either way, so it's not a reliable test — instead render the same word at 400 vs 700 and compare
  stroke weight, or check the file size (a real Source Serif 4 variable woff2 latin subset is ~120KB;
  the broken regular-only one was ~48KB). The fix was to re-download the proper variable woff2 from
  the Google Fonts CSS2 API (`...?family=Source+Serif+4:ital,opsz,wght@...,200..900`) and replace the
  file. Bold serif (`.copy strong`, `.callout__label`) now renders.

## Headless verification

- **GSAP's rAF ticker stalls under Chrome `--virtual-time-budget`**, so `gsap.ticker`-driven
  transforms and timed timelines don't advance — the pinwheel/align/wind read as "stuck." Verify
  geometry from `ScrollTrigger` `.progress` + `getBoundingClientRect` and compute the expected
  output, not the rendered transform. (Scrub *scrubs* do apply via `ScrollTrigger.update()`, so the
  streak/title scrub is testable.)
- Launching headless **without** `--virtual-time-budget` runs the real rAF ticker, so timed timelines
  *do* advance — drive a scroll + wait real time, then screenshot/measure.
- **Always `Network.setCacheDisabled(true)` before navigate** over CDP, or you'll debug a stale
  cached `chapter.js`/`chapter.css`.
- See the project memory `headless-motion-verification` for the full CDP setup (Node 24 has global
  `fetch` + `WebSocket`).
