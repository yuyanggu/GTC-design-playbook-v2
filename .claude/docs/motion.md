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
- **CustomEase** (now-free GSAP plugin) is vendored + registered and **in use**: the About popup's
  `hrOut` ease (`cubic-bezier(0.43,0.195,0.02,1)`, ported from humanistreview.ai — see the popup
  section below) and `chapter.js`'s `tocSlide`. **CustomWiggle** is vendored + registered but
  **unused** (the idle `wiggle()` was removed — the button is static at rest); kept for a possible
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
   from the retired `manifestoReveal`), while `.intro__copy` / `.intro__explore` fade up (the top-left
   `.home-logo` is a separate fixed top bar — see `logoBar`). The "Sail through" button
   (`[data-about-open]`) opens the **About popup** — a counter-translate wipe entrance; see its own
   section below.
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
  doesn't stack (see [gotchas.md](gotchas.md); the pattern originated in about.js's retired `manifestoReveal`).
- **Two-line fit (`fitHeadline` in main.js):** the title wants to be exactly two lines with no
  wrap. `fitHeadline` measures the longest line's `scrollWidth` at the 54px cap and scales the shared
  `font-size` to fit the space beside the copy column, clamped to **[40px, 54px] while side-by-side
  (>1200px)**. Once the row **stacks (≤1200px)** the cap instead **tracks the viewport** —
  `min(54, max(26, 17px + 3.1vw))` ≈ 54px at the 1200px stack point easing to ~29px at 390px — so the
  full-width title scales DOWN as the screen narrows (it used to jump to the 54px cap), with the
  floor dropped to **26px**. It runs regardless of reduced motion, on resize, and **again after
  `document.fonts.ready`** (Boldonse is wider than the fallback). The CSS `font-size` clamp
  (`clamp(26px, 17px + 3.1vw, 54px)`) is only a no-JS fallback — JS sets an inline size that
  overrides it.
  - **Stack ≤1200px:** below the width where a two-line 40px title stops fitting beside the 421px
    copy column, `@media (max-width:1200px)` flips `.intro__row` to a column (title full shelf-width
    on top, copy beneath). (Above 1200px = the Figma side-by-side.)
  - **Wrap on narrow phones:** where even the 26px floor can't fit a full line (≲466px), `fitHeadline`
    adds `.intro__headline--wrap` (`white-space:normal`, **`text-wrap:balance`** so rows break evenly
    — no lone "wind." widow — mask off) and sizes the title at the viewport-tracked cap. The per-line
    clip mask can't hold multiple rows, so `introScene` **branches at `onEnter`**: masked word-rise
    when not wrapping, a plain fade-up when wrapping.
- **`.intro{overflow:hidden}`** (desktop) clips the parked books so they never extend the document;
  mobile sets it back to `visible` (shelf hidden there, nothing to clip).
- **Mobile (≤800px — was 768; widened 2026-07 because the scaled shelf read too small under ~0.55×):**
  the row stacks (already stacked at ≤1200px), the intro top padding clears the fixed logo bar, the
  shelf is `display:none` and the `.home-cards` nav follows the section. The cover `.lockup-row`
  still stacks (pinwheel above title, `padding-inline:20px`, `font-size: clamp(20px, 6.4vw, 30px)`).
- **Reduced motion:** `introScene` bails; the CSS reduced-motion block shows everything statically.

## About-this-playbook popup — entrance wipe + responsive layout

Opened by the intro's "Sail through" button (`[data-about-open]`); full-screen modal, markup outside
`#smooth-wrapper` (so `main` can go `inert`). All behaviour is `aboutModal()` in `main.js`; styling is
the `.about-modal*` block in `styles.css`. **Reduced motion is intentionally ignored here** — the
animation always plays (the `reduce` early-return was removed on purpose).

**Layer structure** (order matters):
`.about-modal` (fixed scroll container, transparent) → `.about-modal__scrim` (dimmed backdrop,
`rgba(1,34,51,.6)`, also the click-catcher) → **`.about-modal__close`** (fixed ✕) →
`.about-modal__mask` (outer, `overflow:hidden`) → `.about-modal__panel` (inner, white `#fff`) →
`.about-modal__card`. The **✕ is a sibling of the mask, NOT inside the translating panel** — a
`position:fixed` element inside a translated ancestor anchors to *that* ancestor, not the viewport
(same gotcha ScrollSmoother hits), so left inside it the ✕ would ride the wipe.

**The entrance = a humanistreview.ai-style counter-translate wipe** (verified from their source; ours
is the mirrored direction — unrolls UP from the bottom):
- **The mass:** `.mask` `yPercent 100→0` and `.panel` `yPercent -100→0` fire together, equal +
  opposite, so the two offsets cancel every frame — **the card content holds dead still while only
  the clip window climbs** (a plain single-element slide would drag the content and read far
  cheaper). **Same duration + ease on both is load-bearing** — any mismatch and the content visibly
  drifts. The three boxes (mask/panel/card) are flexed to **equal heights** so `±100%` is the same
  pixel amount (a percentage `min-height` chain silently collapsed the panel and drifted the content).
- **Ease:** `hrOut` = `CustomEase.create("hrOut", "0.43, 0.195, 0.02, 1")` (their `--alias-easeOut`;
  a slight ease-in lead then a hard decelerate). Registered once in `aboutModal()`.
- **Scrim** fades `autoAlpha 0→1` over the wipe. **Text** (`.reveal-line__inner`) rises out of clip
  masks (`yPercent 100→0` + `autoAlpha`, stagger), the clip being `.reveal-line{overflow:visible;
  clip-path:inset(-0.25em 0)}` — the em-bleed lets Boldonse caps / serif descenders breathe instead
  of being shaved (cleaner than `overflow:hidden`; same shared `.reveal-line` markup wraps the h2,
  every h3, every p). **Images** uncover via `.about-modal__illus-mask` `clipPath inset(100%→0%)`
  while the inner `<img>` scales `1.15→1` over a *longer* duration so the picture keeps drifting
  after it's uncovered. **✕** fades in last. **Close** rolls the wipe back DOWN (mask/panel to their
  start), quicker than the open.
- **Interruption model:** open/close are **two independent timelines built fresh each call, NOT one
  reversible timeline** — a completed GSAP timeline doesn't reliably `reverse()`, and rapid
  open→close wedges it. `gsap.killTweensOf(anim)` + a `closing` flag (so a re-open cancels the
  pending `unlock()` in close's `onComplete`) keep interruption clean. `reset()` re-parks every
  target at its off-screen start at the top of `open()`. **Preserve this** — the comment records a
  real bug.
- **Scroll lock (belt-and-braces):** `lock()` sets `smoother.paused(true)` **and**
  `documentElement`/`body` `overflow:hidden` (the pause alone doesn't freeze the smoothed landing
  scroll; see [gotchas.md](gotchas.md)), plus `main.inert`. ESC and scrim-click close; focus moves to
  the card and returns to the trigger on close.

**Responsive layout** (the reveal targets differ per breakpoint — see the duplicate-images note):
- **Desktop two-column (>1024px):** a fluid illustration column
  `width: calc((100svh − 200px) × 0.8954)` (`0.8954` = 582/650) holds two **touching** images
  (`aspect-ratio: 582/325`, never cropped/stretched) beside the two text sections. The height-derived
  width makes the two images **fill the viewport height so the space below them equals the 40px above
  the title (no scroll)**, and each image lines up with its section (rows `flex:1 1 0`, the image seam
  landing on the divider rule). `max-width:55%` guards portrait screens.
- **Narrow two-column (1025–1200px):** the image + a 230px heading *label* would squeeze the
  paragraph to ~120px, so the heading **stacks above** the paragraph here (paragraph gets the full
  text-column width). Above 1200px the desktop 230px-label layout returns.
- **Stacked (≤1024px) — the Figma mobile/tablet design (node `2171-3347`):** interleaved **per
  section** (image → heading → paragraph, repeated), **16px side padding** (not full-bleed), **no
  divider**. Title + sections **cap to 640px and centre** so images don't blow up on tablets. Figma
  spacing: 72 top · title →28→ image →24→ heading →8→ paragraph · **48 between sections**.
- **Duplicate images:** the desktop `.about-modal__illus` column and the per-section
  `.about-modal__illus-mask--stack` images are **both in the markup**; the off-breakpoint set is
  `display:none`. So the reveal filters `illusMasks` to the **visible** set (`offsetParent !== null`,
  checked in `open()` after `lock()` unhides the modal) before the image stagger — otherwise the
  hidden duplicates would pad the stagger with invisible steps.

## Cross-page navigation fade (`js/transition.js`, all 9 pages)

The humanistreview.ai **sequential page fade**, adapted to this MPA (their site is a custom SPA
router — decompiled 2026-07: hover-prefetch, pushState, old page fades out **1.0s**, scroll snaps
to top, new page fades in **1.3s**, everything on `cubic-bezier(0.43,0.195,0.02,1)` = our `hrOut`).
Ours plays the same beats around a real page load:

- **Exit (JS):** a delegated interceptor catches every internal `<a>` click (skipping same-page
  hash jumps via `e.defaultPrevented`, new-tab/modifier clicks, downloads, cross-origin);
  `GTCNav.to(href)` covers the non-anchor navigations (shelf books, `chapterSwitch`, `.toc-sheet`
  rows). It fades `document.body` to 0 over 1.0s — the backdrop stays because **`html` now carries
  the page background too** (`styles.css`; `html:has(body.page-dark)` for About) — locks scroll
  (smoother paused + wheel/touchmove blocked, HR-style), then sets `location.href` on complete.
  **Toward/away from the dark About page the html `background-color` tweens to the destination's
  colour during the exit**, so the browser's document swap lands on an identical backdrop (no
  chalk→dark flash).
- **Entrance (CSS):** every load fades `body` in via the `gtc-page-in` keyframes (1.3s, the same
  bezier) — CSS so a JS failure can never strand a hidden page. **Fill-mode must stay `backwards`**
  (a filled animation outranks GSAP's inline opacity and swallows the exit fade — see
  [gotchas.md](gotchas.md)); `navigate()` also sets `body.style.animation = "none"` in case an exit
  starts inside the first 1.3s. The chapter hero text/`.reveal` entrances overlap the fade's tail —
  one continuous arrival.
- **Reader deep links** (landing book → `/chapter-N`): the entrance there is `revealDeepLink`
  (`chapter.js`) fading `#smooth-content` once positioned — slowed from its old 0.2s pop to the
  same 1.3s/`hrOut` so the book click reads as one slow cross-fade.
- **bfcache:** browser back/forward restores a frozen page (finished CSS animation + possibly the
  exit's inline `opacity:0`) — the `pageshow (persisted)` handler unwinds the exit state and
  replays the fade with GSAP, which is what gives the back button its fade.
- **Prefetch:** `pointerover` on any `a[href]`/`[data-href]` appends `<link rel="prefetch">` (HR
  fetch-caches on hover), so the beat between fade-out and fade-in stays a quiet blink.
- **Skips to an instant navigation:** reduced motion, the password gate, an already-transitioning
  page (`leaving` latch).

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
