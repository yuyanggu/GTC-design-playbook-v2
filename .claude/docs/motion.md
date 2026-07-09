# Motion — libraries & landing choreography

Animation philosophy plus the landing-page (`index.html`) motion: the unpinned cover scroll,
gradient streaks, the pinwheel, the intro section reveal, cloud drift + parallax, and the magnetic
button. Chapter/reader motion lives with its surface ([chapter-pages.md](chapter-pages.md),
[reader.md](reader.md)); the universal lessons are in [gotchas.md](gotchas.md).

## Library philosophy

- **GSAP + ScrollTrigger + ScrollSmoother** own almost all motion: the page smooth-scroll
  (`#smooth-wrapper > #smooth-content`) runs on **every surface** — the **landing gets a heavier
  glide (`smooth: 1.7`)**, chapter pages + the reader stay at `smooth: 1` (all `smoothTouch: 0`, so
  touch scrolls natively). GSAP also drives the scrubbed/once scenes, scroll fades, the pinwheel,
  the intro reveal, the Menu drawer, the landing shelf, the cloud drift + parallax, and the Explore
  magnetic pull.
- **CustomEase + CustomWiggle** (now-free GSAP plugins) are vendored + registered but **currently
  unused** (the idle `wiggle()` was removed — the button is static at rest); kept for a possible
  hover wiggle.
- **motion.dev (Motion One)** is used for **one** entrance only (`.titleblock__media` load-in).
  Everything else is GSAP — see the "two libraries over one property" gotcha.

## Scroll choreography (home-v3 — unpinned, fully native)

The landing is **two in-flow full-viewport sections** — `#hero` (cover) then `#intro` (Figma
`2082-2203`: headline + welcome column + shelf) — plus the mobile `.home-cards`, all under
ScrollSmoother (`smooth: 1.7`). **No pin anywhere**; no `matchMedia` branches. Five independent
pieces:

0. **`introHold()`** — the opening **load-in animation is uninterruptible**: on boot the page scroll
   is **frozen** (`smoother.paused(true)` for the smoothed desktop scroll **and**
   `documentElement`/`body` `overflow:hidden` to block native/touch scroll) so an early wheel/swipe
   can't cut off the pinwheel rise → spin → align → title reveal. Released the moment `loadTl`
   completes (`loadTl.eventCallback("onComplete", …)`, plus a `gsap.delayedCall` safety net). No-op
   under reduced motion (no `loadTl`).
1. **`coverScroll()`** — a **timed, play-once (uninterruptible) cover exit**. A paused timeline
   scales `.lockup-row` 1→0.55 and fades `#arrow` out (the top-left wordmark is a separate fixed
   top bar — see `logoBar`). A
   `ScrollTrigger` `onUpdate` **latch** plays it in full on the first real downward scroll
   (`direction === 1 && progress > 0.015`) — it then runs on its own clock to completion, so scroll
   speed/stops can't jitter or freeze it mid-scale — and reverses only back at the very top
   (`direction === -1 && progress < 0.01`, `timeScale 1.4`). Because `place()` (pinwheelScene)
   re-reads `#pinwheelSlot`'s live rect every ticker frame (and rects reflect CSS transforms),
   **scaling the row shrinks + tracks the fixed pinwheel for free**. `introHold` guarantees `loadTl`
   is complete before this can fire, so there's no entrance-vs-scroll fight to fast-forward.
1b. **`logoBar()`** — the top-left wordmark (`.home-logo`) is a **fixed body-level top bar** (moved
   OUT of `#intro` so `position:fixed` holds under ScrollSmoother, like the pinwheel). It stays
   hidden until the user **first reaches the bottom of the page** (`main` progress ≥ 0.9); from then
   on it's the persistent top bar for the content area, but it **hides again over the hero cover**
   (`#hero` progress ≤ 0.5) so it never doubles the big centred cover lockup. `.intro__row` reserves
   a `padding-top` gap so the headline clears it.
2. **Cloud parallax** — a scrubbed `y` tween on the `.clouds` **container** (in `cloudDrift()`):
   it drifts down `CLOUD_TRAVEL` (0.75) × viewport-height over the hero's exit, so the band moves
   up-screen slower than the page and settles along the top of `#intro`, then freezes and scrolls
   away with it. Container `y` is a free transform channel (the per-cloud tweens own
   `x`/`scale`/`opacity`) and survives the resize rebuild (which only resets children). The clouds
   are a **direct child of `.hero`** (outside `.hero__stage`'s overflow clip) and `.hero` uses
   `overflow-x: clip` so the drift's x-wrap can't cause a horizontal scrollbar.
3. **`introScene()`** — `once:true` at `top 70%`: the headline's **word-by-word rise**
   (hellohello.is style — pre-authored `.word` inline-blocks inside `overflow:hidden` `.line`
   wrappers, `yPercent` 118→0, `power4.out`, stagger 0.07, with the `y:0`-before-`yPercent` guard
   from `manifestoReveal`), while `.intro__copy` / `.intro__explore` fade up (the top-left
   `.home-logo` is a separate fixed top bar — see `logoBar`). The Explore button (`[data-about-open]`)
   opens the About popup, which **pauses the smoother** (`smoother.paused(true)`) while open.
4. **Books/spines rise** — now owned by `homeBooks()`: parked below the fold (clipped by
   `.intro{overflow:hidden}`), risen by a paused timeline played by a `once:true` trigger at
   `top 92%` of the shelf. Rise uses `y`, hover lift uses `yPercent` (separate channels).

Under reduced motion every scene bails **and `smoothScroll()` itself no-ops** (so the smoother is
never created), and CSS shows both sections statically. `ScrollTrigger.config({ ignoreMobileResize:
true })` stops the mobile address bar's show/hide resize from refreshing positions mid-scroll, and
the landing sets **`overscroll-behavior-y: none`** (`html:has(#hero)`) to kill the rubber-band
bounce past the ends of the smoothed scroll.

> **Legacy (home-v2).** The previous landing pinned the hero for one viewport and played a timed,
> reversible master (`heroScene()`) on first scroll: cover fades, pinwheel glides up to a
> `#pinwheelSlotScrolled` header slot via `pinwheelProx.scrolled`, intro copy fades up, books rise
> — with three `matchMedia` branches. All of it (and the `.intro-reveal` overlay markup) was
> replaced by the unpinned model above in 2026-07; see git history to revive.

## The signature motion (gradient streaks)

The "gradient grows out of PLAYBOOK" effect = `title_streaks_2.png` (the gradient **PLAYBOOK** word
that bleeds down + fades out) sitting **behind** the crisp `Opening_Title.svg` letters. It's
registered to the lockup's PLAYBOOK line so the gradient letters sit exactly under the navy ones
(`left:0`, `width:100%` = full 606px lockup width; `top:52.6%` = the PLAYBOOK line, y 121 of the
606×230 lockup); the bleed extends below. Since the gradient letters are occluded by the opaque navy
letters, only the downward bleed reads.

It's revealed top→bottom by animating `--streak-hide` (100%→0%) via a **feathered `mask-image`** (a
`linear-gradient` whose black→transparent boundary tracks `100% − --streak-hide` with a ±6% soft
band), NOT a hard `clip-path`, so the reveal edge is soft (no harsh scroll line). Keep the streaks a
separate layer so the navy lettering stays vector-crisp.

## The pinwheel (rise → align → wind)

Lives in `pinwheelScene()`. The element is a **JS-injected fixed traveler** appended to `<body>`:
`.pinwheel` (outer — owns position/scale, written every frame by a `gsap.ticker` callback) →
`.pinwheel__spin` (inner — owns rotation, the wind) → `<img>`. The traveler is `aria-hidden`.

- **Home-v3 model:** on load the pinwheel rises + aligns to `#pinwheelSlot` (driven by `loadTl`).
  After that it has no scroll state of its own: `place()` tracks the slot's live rect, so native
  scroll carries it off-screen and `coverScroll`'s scale-down of `.lockup-row` shrinks it — both
  for free.
- **`place()` (per frame):** blends position through `prox.{rise, align}`: rise (below-fold →
  centre) → align (centre → `#pinwheelSlot`). Reads the slot's **live `getBoundingClientRect()`**
  (viewport-relative, transform-inclusive) so it stays responsive and hands off to natural
  scrolling once parked. `pinwheelProx` is module-level so `coverScroll` can fast-forward the
  load-in on first scroll.
- **Wind:** `baseSpin` = endless `rotation += 360` (9s); a recursive `gust()` timeline randomly
  modulates `baseSpin.timeScale` (fast gust → calm drift) for organic, never-repeating spin.
- **Legacy tunables** (top of `pinwheelScene`, from the old `#intro` pin): `RISE_END` (0.45),
  `ALIGN_AT` (0.50, keep `RISE_END ≤ ALIGN_AT`), `CENTER_Y` (0.5), transition `duration` (0.8s).

See [gotchas.md](gotchas.md): cross-section element travel, scrubbed position + timed transition,
two transform channels.

## The intro section (`#intro`, Figma 2082-2203)

An in-flow `min-height:100svh` section below the cover: an `.intro__row` (`space-between`) holding the
Boldonse headline **"We don't wait for the wind. / We steer the motion."** (40–54px, two lines fitted
by `fitHeadline()`; stacks ≤1200px and wraps on phones — see below) hard-left and the 421px `.intro__col` (Source
Serif welcome copy + "Sail through →" button, `[data-about-open]` → About popup) hard-right, with the 5-book `.home-shelf`
flush to the section's bottom. The row is **width-matched to the shelf**: both use
`--shelf-width: min(var(--shelf-w), 100% − var(--shelf-pad))` (`1300px` / `80px`, kept in sync with
`SHELF_W`/`SHELF_PAD` in `main.js`) and centre via `margin-inline:auto`, so the headline's left edge
lines up with book 1 and the copy's right edge with book 5 at every width (`.intro` drops its
`padding-inline` so the row's `100%` = the viewport; mobile re-adds side padding and the row goes
full-width). `.intro` is a centred flex column that **reserves the top-bar logo band (`padding-top`)
and the shelf band (`padding-bottom: 340px`)** and centres the row in what's left — so the headline +
copy sit vertically **midway between the fixed logo and the shelf** (no fixed top padding on the row). The `playbook_logo.svg` top-bar wordmark is **not** inside
this section any more — it's a fixed body-level element (see `logoBar` in the choreography above).

- **Word masks:** each headline line is a `.line{overflow:hidden;white-space:nowrap;
  padding-block:.2em;margin-block:-.2em}` (the pad gives Boldonse's tall caps/descenders room; the
  negative margin reclaims it so the two lines keep the Figma 80px rhythm) wrapping
  `display:inline-block` `.word` spans. `introScene` rises them `yPercent` 118→0 — with the **`y:0`
  reset before `yPercent`** guard so the px value GSAP parses from the CSS `translateY(118%)` start
  doesn't stack (see `manifestoReveal` in `js/about.js` and [gotchas.md](gotchas.md)).
- **Two-line fit (`fitHeadline` in main.js):** the title must ALWAYS be exactly two lines with no
  wrap. `fitHeadline` measures the longest line's `scrollWidth` at the 54px cap and scales the shared
  `font-size` to fit the space beside the copy column (full row width when stacked), **clamped to
  [40px, 54px]** — the title never goes under 40px. It runs regardless of reduced motion, on resize,
  and **again after `document.fonts.ready`** (Boldonse is wider than the fallback). The CSS
  `font-size` clamp is only a no-JS fallback — JS sets an inline size that overrides it. Two moves
  keep the 40px floor from clashing with the two-line rule:
  - **Stack ≤1200px:** below the width where a two-line 40px title stops fitting beside the 421px
    copy column, `@media (max-width:1200px)` flips `.intro__row` to a column (title full shelf-width
    on top, copy beneath) so the title stays ≥40px far lower. (Above 1200px = the Figma side-by-side.)
  - **Wrap on phones:** where even the full width can't fit a 40px line (≲700px), `fitHeadline` adds
    `.intro__headline--wrap` (`white-space:normal`, mask off) so the title **wraps** at 40px instead
    of shrinking. The per-line clip mask can't hold multiple rows, so `introScene` **branches at
    `onEnter`**: masked word-rise when not wrapping, a plain fade-up when wrapping.
- **`.intro{overflow:hidden}`** (desktop) clips the parked books so they never extend the document;
  mobile sets it back to `visible` (shelf hidden there, nothing to clip).
- **Mobile (≤768px):** the row stacks (already stacked at ≤1200px), the intro top padding clears the
  fixed logo bar, the shelf is `display:none` and the `.home-cards` nav follows the section. The cover
  `.lockup-row` still stacks (pinwheel above title, `padding-inline:20px`,
  `font-size: clamp(20px, 6.4vw, 30px)`).
- **Reduced motion:** `introScene` bails; the CSS reduced-motion block shows everything statically.

## Arrow fade (load-in + cover-exit over one property)

The `#arrow` is animated **in** by `loadTl` and **out** by `coverScroll`'s timed cover-exit
timeline — two owners of one `autoAlpha`. `introHold` freezes scroll until `loadTl` finishes, so the
cover exit can only start after the arrow is fully in; the two never overlap on the property (see
[gotchas.md](gotchas.md): load-entrance + scroll-driven fade).

## Cloud drift (`cloudDrift`)

One-direction sky drift: every `.cloud` flows LEFT→RIGHT at its own (widely staggered, index-spread)
speed, wrapping seamlessly via a `gsap.utils.wrap` modifier. Opacity is position-driven so each fades
out as it exits right / fades in entering left (× a staggered `--enter` load-in factor raised by
`loadTl`, so the two opacity owners never fight). Seeded at spread, desynced start positions; gentle
scale "breathe". Rebuilt on resize. No-op under reduced motion. The **scroll parallax** (see
choreography above) lives on the `.clouds` container — a channel the per-cloud tweens never touch —
so drift, breathe, edge-fade and parallax coexist and the parallax survives the resize rebuild.

## Magnetic button ("True button")

`magneticButtons()` wires every `.mag-zone` (field) → `.mag-btn` (pill, transform target) →
`.mag-btn__bg` + `.label`. Static at rest; on `mousemove` `gsap.utils.mapRange` drives the pull
(pill `strength` 0.4, label 0.24, both `overwrite:true`), returning with `elastic.out(1,0.4)` on
leave. Only the **`--explore`** variant remains (Figma `2008:147`): pink→peach pill
(`READ THE PLAYBOOK`) on the landing; `.mag-btn__bg` carries the
`linear-gradient(0deg,#ffa8cd,#fdd193)` + inset `1px rgba(0,0,0,.2)` stroke. (The Menu's old
`--back` variant was removed with the bookshelf.)
