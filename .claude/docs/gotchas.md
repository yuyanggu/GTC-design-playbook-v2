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
- Use **`autoAlpha`** (opacity + visibility) for fade-outs so faded elements are truly gone.
- **GSAP-animated CSS custom props must be declared with a real initial value** (e.g.
  `--streak-hide: 100%`), otherwise GSAP reads an empty start and jumps to the end value.
- Always honour `prefers-reduced-motion`: `pinwheelScene`/`heroScene` bail to end-states and the
  static graphic (the old separate `introReveal` fallback was folded in during the home-v2 refactor).
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
- **Don't animate `yPercent` for a line-clip reveal.** GSAP's percent-unit transform cache can end
  with `yPercent:0` in cache but a **stale inline `translate(…px)`** that never re-renders (the
  reveal stays hidden). Drive the wipe with **px `y`** (measured line height → 0) instead.
  (`heroScene`'s header.)

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

- **ScrollSmoother:** only `#smooth-content` (the `<main>`) is transformed/smoothed; the
  `position:fixed` **menu overlay and pinwheel traveler live OUTSIDE it** (direct children of
  `<body>`) so fixed stays viewport-anchored. The pinwheel's `place()` reads the slot's live
  `getBoundingClientRect()`, which already reflects the smoother transform, so the fixed traveler
  still aligns. The menu **does NOT call the smoother API** (pausing it tangled with open/close and
  bugged out); instead, while open it hard-locks page scroll via
  `documentElement.style.overflow = "hidden"` — freezing the window scroll the smoother rides on.
  Restored on close.
- **Pinning under ScrollSmoother (the chapter TOC).** CSS `position:sticky`/`fixed` **cannot
  survive** the smoother's transform on `#smooth-content` (a sticky el reads `top:-402` instead of
  sticking; a fixed el is positioned relative to the transformed ancestor, not the viewport). Use a
  GSAP `ScrollTrigger` pin with **`pinType:"transform"`** (the default `"fixed"` also fails — the pin
  is created but applies no compensating transform). The pinned element must be in **normal flow** —
  pinning an `absolute` el or one inside a CSS **grid/flex** cell silently no-ops (hence the TOC is
  `float:left`). **Do NOT hand-roll a per-frame `gsap.ticker` follow** that re-reads
  `getBoundingClientRect` and re-applies the transform: it lands a frame behind the smoother and the
  nav visibly **lags**. The ScrollTrigger pin is internally synced → glued with no lag. (`stickyToc`.)

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
