# GTC — The Design Playbook

A polished, awwwards-grade **static multi-page website** for the GovTech Consulting ("GTC")
Design Playbook. The **cover (`index.html`) is built**: the above-the-fold cover, the pinned scroll
transition where a colour gradient bleeds down from the `PLAYBOOK` lettering, a dedicated
pinned beat where the **pinwheel rises in and aligns to the text**, and the intro
"What this is" section. The intro ends in an **Explore** button (magnetic) that opens a full-screen
**bookshelf Menu overlay**. The Menu's books now link to **interior chapter pages** — three are
built (`why-we-exist.html`, `our-point-of-view.html`, `stages-of-a-project.html`); they all share a
reusable page system (`css/chapter.css` + `js/chapter.js`). See "The chapter pages" below.

## Tech stack
- **Plain HTML / CSS / vanilla JS** (ES modules). No framework, no build step.
- **GSAP + ScrollTrigger + ScrollSmoother** — own almost all motion: page smooth-scroll
  (`#smooth-wrapper > #smooth-content`, subtle `smooth:1`), the two pinned/scrubbed scroll scenes,
  the scroll fades, the pinwheel rise/align, the continuous "wind" spin, the Menu (books fall
  in / knock / raise), and the Explore button's magnetic pull. **CustomEase + CustomWiggle**
  (now-free GSAP plugins) are vendored + registered but **currently unused** (the idle `wiggle()`
  was removed — the button is static at rest); kept for a possible hover wiggle.
- **motion.dev (Motion One)** — used for **one** entrance only (`.titleblock__media` load-in).
  Everything else is GSAP (see the "two libraries over one property" gotcha).
- Everything is **vendored locally** (`vendor/`) and **fonts are self-hosted** (`assets/fonts/`) → fully offline-capable. Do not switch to CDNs.

## Run / preview
```bash
python3 -m http.server 8124    # then open http://localhost:8124/index.html (or /why-we-exist.html, …)
```
There is a `.claude/launch.json` config named `gtc-static` for the preview tooling.
Verify headlessly via **CDP** (Node 24 has global `fetch`+`WebSocket`) — see the project memory
`headless-motion-verification`; **always `Network.setCacheDisabled(true)` before navigate** or you'll
debug a stale cached `chapter.js`/`chapter.css`.

## File map
- `index.html` — two `<section>`s: `#hero` (Cover 1 → reveal stage) and `#intro` (Cover 3
  "What this is"), plus the `#menu` bookshelf overlay (sibling of `<main>`, `hidden` by default).
  The pinwheel that animates between the sections is **not** in the markup — JS injects a fixed
  traveler (see below). The in-flow `#introGraphic img` stays as a hidden spacer + accessible
  element. The intro ends with `.intro__cta` → a **magnetic button component** (`.mag-zone--explore`
  > `#exploreBtn`). `#menu` holds the eyebrow + `Opening_Title.svg` lockup, the back button (same
  component, `.mag-zone--back` > `#menuClose`), and `#menuShelf` → decorative `.shelf__spines` + four `.book` cards.
  The books are now **interactive buttons that navigate** (`data-href`: 1→`why-we-exist.html`,
  2→`our-point-of-view.html`, 3→`stages-of-a-project.html`; book 4 stays `.book--soon` "coming soon").
  The Explore CTA and every rail hamburger carry **`data-menu-open`** (any such element opens `#menu`).
  This same `#menu` block is **duplicated verbatim into every page** (no build step / no includes).
- **Interior chapter pages** (`why-we-exist.html`, `our-point-of-view.html`, `stages-of-a-project.html`)
  — one shared skeleton: fixed `.rail` (outside `#smooth-wrapper`) + `#smooth-wrapper > main.page`
  (`.page-hero` cover + `.page-body` with `.toc` and `.copy`) + the duplicated `#menu` + the vendor
  scripts and **`js/chapter.js`**. Per‑chapter differences are only: the `<body>` theme vars, rail
  label, hero title lines, hero `<img>`, TOC rows, and copy. Copy is transcribed from
  `playbook-content/playbook-outline__5_.html` (the source content file — reference, not served).
- **`playbook.html`** — the **continuous reader**: the canonical chapter experience. All three
  chapters live in ONE document (each wrapped in `.section.chapter-panel > .chapter-panel__scale`,
  ids `#ch1/#ch2/#ch3`, theme vars + `data-rail`/`data-rail-fg` on the panel) so scrolling flows
  seamlessly chapter→chapter. **Every menu now points here** (`index.html` books → `playbook.html#chN`
  full nav; the reader's own books → in‑page `#chN`). The standalone chapter pages are kept as a
  fallback but are no longer linked. See "The continuous reader" below.
- `css/playbook.css` — reader‑only layer (loaded after `chapter.css`): `.chapter-panel` (**black**
  backdrop — only seen during the transition) + `.chapter-panel__scale` (the scaled/faded layer;
  `border-radius:16px 16px 0 0` + `overflow:hidden` for the rounded top corners; `transform-origin:50%
  calc(100% − 10vh)` near the bottom so the shrinking card stays anchored where the next chapter meets
  it and the scale reveals black down the sides).
- `css/chapter.css` — **shared** stylesheet for all chapter pages (loaded after `styles.css`): the
  rail, hero, the pinned scroll‑synced TOC (+ accordion sub‑rows), and the copy type system
  (`.copy__heading` / `.section-head` / `.subsection-head` / `.copy p` / lists / `.figure-note` /
  `.source-note` / `.pullquote`). Themed per chapter via CSS vars (see "The chapter pages").
- `css/styles.css` — tokens (`:root`), `@font-face`, the type system, layout, `.pinwheel`
  traveler styles, the magnetic button component, the Menu/shelf/`.book` system (**fixed px** per
  Figma — 188px books, 90px gaps), and motion base states (`.js [data-reveal]` hidden, `.js.motion` spacer hide).
- `js/main.js` — eight functions, all booted at the bottom (`smoothScroll()` first):
  - `smoothScroll()` — creates the GSAP **ScrollSmoother** on `#smooth-wrapper`/`#smooth-content`
    (`smooth:1`, `smoothTouch:0`); skipped under reduced motion. The **menu does not touch the
    smoother** — while open it hard-locks page scroll via `documentElement` overflow instead (see gotcha).
  - `heroIntro()` — Motion One load-in for `.titleblock__media`; GSAP `from` load-in for the
    eyebrow / subtitle / arrow (captured in `heroEntrance` so the scroll scene can kill them).
  - `arrowBob()` — infinite GSAP `y` bob on the arrow (independent of its opacity).
  - `scrollScene()` — GSAP pin/scrub on `#hero` (title rises, streaks grow, extras fade out).
  - `introReveal()` — reduced-motion-only fallback that shows the intro statically.
  - `pinwheelScene()` — pins `#intro`; rises the pinwheel in, holds, then a timed transition
    aligns it to the slot + reveals the text. Plus the continuous "wind" spin.
  - `menuScene()` — open/close the `#menu` overlay (`hidden` + `<main>` `inert` + body scroll lock).
    Opens on **any `[data-menu-open]`** (the Explore CTA *and* a chapter page's rail hamburger), not
    just `#exploreBtn`. On open the four books **drop & settle** (`back.out`, staggered L→R); cursor
    over `#menuShelf` **sways** every book; interactive books **raise** + turn orange + cross‑fade to
    their `*_hover.svg` icon via `.is-hover` (now books **1, 2 & 3**). An interactive book with
    **`data-href` navigates** on click (wired before the reduced‑motion bail so links always work).
    `Esc` closes. **The index‑only scenes (`heroIntro`/`scrollScene`/`arrowBob`/`pinwheelScene`/
    `introReveal`) early‑return when their elements are absent**, so loading `main.js` on a chapter
    page is a safe no‑op for them; `smoothScroll()` + `magneticButtons()` run on every page.
  - `magneticButtons()` — wires every `.mag-zone` (the magnetic button component). Static at rest;
    on hover the pill (`.mag-btn`, strength 0.4) and its `.label` (0.24) parallax toward the cursor,
    both `overwrite:true`, returning with `elastic.out` on leave. Drives both the Explore CTA and
    the Menu back button.
- `js/chapter.js` — **shared** ES module for chapter pages (loaded after `main.js`; reuses the GSAP
  plugins + ScrollSmoother it created). **Scope‑aware:** the four per‑chapter functions each take a
  `root` — on a standalone page `initChapter(document)`; on the reader each runs once **per
  `.chapter-panel`** so the three TOCs / reveal batches / flowers don't collide. Functions:
  `heroFlowerSpin(root)` (wind‑spin **only if** `root` has `.hero-flower[data-spin]` — chapter 1 only),
  `copyReveals(root)` (`ScrollTrigger.batch` fade‑up of `.reveal`), `stickyToc(root)` (the pinned nav —
  see gotchas), `tableOfContents(root)` (active row + progress fill follow scroll; **accordion**
  sub‑rows open only under the active section; rows + sub‑rows click‑scroll via `smoother.scrollTo`).
  **Reader‑only extras** (run when `.chapter-panel`s exist): `panelTransitions()` — the
  chapter‑to‑chapter scroll effect (ported from the GSAP "stacked panels" demo: each non‑last panel
  pins at `start "bottom bottom"`, `pinSpacing:false`, `pinType:"transform"`, scrub; the inner
  `.chapter-panel__scale` `fromTo` scale 1→0.7 + opacity 1→0 while the next chapter scrolls up over
  it); `railSync()` — the fixed rail's label + (dark‑hero) `--rail-fg` follow the panel at viewport
  centre; `handleDeepLink()` — on load, jump (instant) to the `#chN` in the URL hash so the menu
  deep‑links land accurately after pin spacing is finalised. (`menuScene` in `main.js` routes a book
  whose `data-href` starts with `#` through `smoother.scrollTo` **on click, before the close fade** —
  no flash of the prior chapter — instead of a full nav.)
- `assets/` — `Opening_Title.svg` (606×230 navy lockup), `arrow.svg` (57×45), `Align_Graphic.svg` (cover pinwheel),
  **`1_Graphic.svg`** (549×554 four‑petal flower w/ grainy‑gradient donut — hero of ch1 & ch3; **note: its
  internal `clipPath` crops the petals to a 549×554 box — a known clipping issue**), **`2_Graphic.svg`**
  (230×229 — ch2 hero), `title_streaks_2.png` (gradient "PLAYBOOK"; `Title_Streaks.png` older, unused),
  `favicon.png`, `menu_1.svg`/`menu_1_hover.svg` (mono→colour flower) / `menu_2.svg`/`menu_2_hover.svg`
  (leaf, mono→colour) — the 100×100 book icons, **`pullmark.svg`** (15² quote mark),
  `book_element_{1..5}.svg` (gray shelf‑spine clusters, 294px tall), `fonts/`.
- `playbook-content/playbook-outline__5_.html` — the full playbook copy (source for chapter text; not served).
- `vendor/` — `gsap.min.js`, `ScrollTrigger.min.js`, `ScrollSmoother.min.js`, `motion.esm.js`, `CustomEase.min.js`, `CustomWiggle.min.js`.
- `.figma_ref/` — Figma reference screenshots for visual diffing (not shipped/served).

## Design source
Figma file `DGg9Fqa2owVvSHvOvHBaTA` ("GTC Playbook Design (Copy)"). Key nodes:
- `1:2` type system · `2:20` typesetting sample
- `2:112` Desktop – Cover 1 (1440×1024) · `2:13723` Desktop – Cover 3 (1440×1428)
- `2:18242` scroll-state title (letters + gradient streaks, 599×710) → source of `Title_Streaks.png`
- `2008:147` Explore button · `2:22779` Menu (bookshelf, 1440×1024) · `2:22921` Menu hover (book 1 → orange)

## Design tokens
| Token | Value |
|------|-------|
| `--midnight` | `#012233` (Figma "Midnight") |
| `--chalk` | `#f6f2e7` (Figma "Chalk", page bg) |
| `--blue` / `--orange` / `--gray3` | `#4F94CF` (interactive books 1–3; ch2 hero) · `#F9A518` (book hover; ch1 hero/accent) · `#C7C7CC` (shelf spines) |
| `--book-dark` | `rgba(27,31,38,0.72)` (book 4 "coming soon") |
| `--sky` / `--pink` | `#73AAE5` (blue petal) · `#F394BE` (pink petal) |
| `--skeleton` / `--toc-gray` | `#D9D9D9` (TOC spine bars) · `rgba(27,31,38,0.47)` (inactive TOC row) |
| Accent palette | pink `#F394BE`, blues `#AED3ED / #73AAE5 / #4F94CF`, orange/gold (gradient only) |
| Explore pill gradient | `linear-gradient(0deg, #ffa8cd 0%, #fdd193 100%)` (pink→peach, +1px `#000`/20% inner stroke) |

**Per‑chapter theme vars** (set on a chapter's `<body>`; defaults = chapter 1's orange, so ch1 sets none):
`--hero-bg` (hero band), `--hero-title` (title on it), `--accent` (drives `.copy__heading`,
`.section-head`, active TOC row + progress fill), `--rail-fg` (rail label + search — set to `--chalk`
on **dark** heroes so they stay legible), `--flower-aspect` (hero graphic aspect ratio). Ch2 = blue
(`--blue`), ch3 = midnight (`--midnight`, with `--rail-fg:--chalk`).

**Fonts:** Boldonse (display), DM Sans (variable, opsz 14 — Light 300 / Medium 500 / Bold 700),
Source Serif 4 (Regular + Italic). All downloaded as woff2 from Google Fonts.

## Type system
Figma `letterSpacing` tokens are **percentages of font-size**.

| Style | Font | Size / line / tracking | Used for |
|------|------|------|------|
| Title | Boldonse 400 | 36 / normal / 0 | "A place to align…" heading; the cover lockup (as SVG) |
| Heading | DM Sans 700 | 64 / 100% / −2% | large sans heading (type system) |
| Subheading 2 | DM Sans 500 | 30 / 100% / −1% | |
| Subheading / eyebrow | DM Sans 300 | 20 / 100% / +2% / uppercase | `GOVTECH CONSULTING`, `WHAT THIS IS` |
| Subtitle | DM Sans 500 | 20 / 1.3 / 0 | cover subtitle |
| Body | Source Serif 4 400 | 16 / normal / −0.16px / `#000` | intro paragraph |
| Quote | Source Serif 4 400 *italic* | 16 / normal / −0.16px / `#000` | "Come here to align…" |

## Layout coordinates (reference 1440-wide frames; CSS uses fluid %/vh/clamp)
- **Cover 1 (1440×1024):** eyebrow top 49 (≈4.78vh) centered · `Opening_Title.svg` 606×230 dead-centered · subtitle top 665 (≈64.9vh) centered · `arrow.svg` top 934 (≈91.2vh) centered.
- **Cover 3 (1440×1428):** title docked top 119 (≈8.3%) and grows to 599×710 with streaks · `Align_Graphic.svg` 396² at left 210 / top 915 · text block left 626 / top 915 / width 604.

## Scroll choreography (top → bottom)
The page is two pinned scenes back-to-back, then the intro flows normally.

1. **`#hero` pin** (`scrollScene`, `start "top top"`, `end +=1.4·vh`, `scrub: 0.6`):
   - eyebrow / subtitle / arrow **fade + slide out** (`autoAlpha → 0`),
   - the title block **rises** from centre to docked-near-top (`titleDeltaY()` ≈ 8.3% of frame),
   - the gradient **streaks grow** top→bottom via `--streak-hide` 100%→0%.
2. **`#intro` pin** (`pinwheelScene`, `start "top top"`, `end +=0.7·vh`, pin only — no scrub).
   By the time it pins, the gradient is fully gone, so everything happens on plain `--chalk`:
   - **Rise** (scroll-scrubbed, `pin.progress` 0 → `RISE_END`): the pinwheel slides up from
     below the fold to viewport centre. No fade — it's hidden purely by sitting off-screen.
   - **Hold** (`RISE_END` → `ALIGN_AT`): a short beat, centred, spinning.
   - **Align + reveal** (timed, fired at `pin.progress ≥ ALIGN_AT`): a paused GSAP timeline
     glides the pinwheel to the text-block slot **and** reveals the `[data-reveal]` copy with a
     stagger. This is **timed (0.8s), not scrubbed** — so it needs enough pinned scroll left
     after `ALIGN_AT` to finish before the section unpins (see gotcha).

## The signature motion (gradient streaks)
The "gradient grows out of PLAYBOOK" effect = `title_streaks_2.png` (the gradient **PLAYBOOK**
word that bleeds down + fades out) sitting **behind** the crisp `Opening_Title.svg` letters.
It's **registered to the lockup's PLAYBOOK line** so the gradient letters sit exactly under the
navy ones (`left:0`, `width:100%` = full 606px lockup width; `top:52.6%` = the PLAYBOOK line, y 121 of the 606×230 lockup);
the bleed extends below. Since the gradient letters are occluded by the opaque navy letters, only
the downward bleed reads. It's revealed top→bottom by animating `--streak-hide` (100%→0%) — but via
a **feathered `mask-image`** (a `linear-gradient` whose black→transparent boundary tracks
`100% − --streak-hide` with a ±6% soft band), NOT a hard `clip-path`, so the reveal edge is soft (no
harsh scroll line). Scrubbed inside the pinned hero timeline. Keep streaks a separate layer so the
navy lettering stays vector-crisp.

## The pinwheel (rise → align → wind)
Lives in `pinwheelScene()`. The element is a **JS-injected fixed traveler** appended to `<body>`:
`.pinwheel` (outer — owns position/scale, written every frame by a `gsap.ticker` callback) →
`.pinwheel__spin` (inner — owns rotation, the wind) → `<img>`. The traveler is `aria-hidden`.

- **Spacer pattern:** the original in-flow `#introGraphic img` stays in the DOM as an
  **invisible layout spacer** (`.js.motion .intro__graphic img { visibility:hidden }`) and the
  accessible node. `place()` reads its **live `getBoundingClientRect()`** as the align target →
  responsive, and once parked the pinwheel scrolls naturally with the page.
- **`place()` (per frame):** `rise = clamp01(pin.progress / RISE_END)`,
  `riseY = lerp(belowY, centerY, power3.out(rise))` (`belowY = vh + w/2 + 40`, off-screen;
  `centerY = vh · CENTER_Y`). The align blend is `lerp(riseY → slotCentre, prox.align)` for
  both x and y, where `prox.align` is driven by the **timed** transition (0 = centred, 1 = slot).
- **Trigger / reverse:** the intro pin's `onUpdate` calls `transition.play()` at
  `progress ≥ ALIGN_AT` and `transition.reverse()` at `progress < ALIGN_AT − GAP`. The gap is
  hysteresis to prevent flapping; **with the current values the reverse never fires (one-way /
  latched reveal)** — widen or narrow it via that constant if reversible behaviour is wanted.
- **Wind:** `baseSpin` = endless `rotation += 360` (9s), and a recursive `gust()` timeline
  randomly modulates `baseSpin.timeScale` (fast gust → calm drift) for organic, never-repeating spin.
- **Tunables (top of `pinwheelScene`)** and their effect:
  - intro pin `end` `window.innerHeight * 0.7` — total length of the pinned beat (empty-space budget).
  - `RISE_END` (0.45) — fraction of the pin spent rising (lower = snappier rise, less empty bg).
  - `ALIGN_AT` (0.50) — when the timed align/reveal fires. **Keep `RISE_END ≤ ALIGN_AT`.**
  - `CENTER_Y` (0.5) — resting height while centred.
  - transition `duration` (0.8s) — the align glide speed.

## Hero "extras" fade (eyebrow / subtitle / arrow)
These three are animated **in** on load (GSAP `from`, captured in `heroEntrance`) and **out** on
scroll (the hero scrub, `fromTo autoAlpha 1→0`). Both are GSAP on purpose, and two safeguards
make the fade reliable in both directions:
- the scrub uses **`fromTo` with an explicit `autoAlpha:1` start + `immediateRender:false`**, and
- the entrance tweens are **killed on the first scroll** (`scrollScene`'s `onUpdate`).
See the gotchas for why both are necessary.

## The Menu (bookshelf overlay) + Explore button
Lives in `menuScene()` / `exploreButton()`. The Explore button (Figma `2008:147`) sits at the
bottom of `#intro` (a `[data-reveal]` member, so it enters with the intro copy). `#menu` is a
full-screen `position:fixed` overlay (z 50), `hidden` until opened.

- **Bookshelf layout = fixed pixels** (per Figma; does not scale down). `#menuShelf` is a 1022px-wide
  (`4×188 + 3×90`) × 340px stage, centred (`left:50%` + `translateX(-50%)`), with sharp-cornered books
  at `--book-x` 0 / 278 / 556 / 834 px (188px wide, 90px gaps). Inner type/positions are the literal
  Figma px (num 36/top 19, rule top 98/w 140, title 20/top 110, icon 100/bottom 22). **Spines** are the
  `assets/book_element_{1..5}.svg` vectors (gray clusters of rects + leaning parallelograms, 294px tall,
  bottom-aligned behind the books) — one per gap region: `_1` left of book 1, `_2/3/4` between the
  books, `_5` right of book 4, positioned via `--x` px.
- **Book = outer/inner.** The **whole book** (`.book`, outer) owns `y` + `rotation` for every motion —
  fall-in, landing rock, the cursor-reactive tilt, hover raise, exit tumble — all pivoting at its base
  (`transformOrigin:50% 100%`). `y` (raise) and `rotation` (tilt) are independent props so they compose
  via `overwrite:"auto"`. `.book__inner` is no longer animated (kept as the content wrapper).
- **Open/close (`menuScene`) — heavy-book physics:** open un-hides (pre-positioning books above the
  fold to avoid a flash), sets `<main> inert` + locks scroll, fades the overlay, then `openBooks()`
  drops each book under gravity (`power2.in`, **random** delay/duration per book), fires an
  `impactShake()` on landing (jolts the whole shelf down a few px, `elastic.out` settle — the "thud";
  **suppressed + settled while the cursor is over the shelf** via the `overShelf` flag, so moving the
  mouse in right after landing doesn't ride the shake), then rocks the book about its base to rest
  (`elastic.out(1,0.3)`). `closeBooks()` (exit) accelerates
  every book straight **down off the bottom** (`y → vh+400`, `power2.in`) with a slight `+=` tumble,
  random per book, then fades the overlay and `finishClose()` re-adds `hidden`/`inert` + restores focus.
  All open tweens are tracked (`openMaster` + `bookTls`) and `killOpen()`'d if close interrupts. `Esc` closes.
- **Cursor-reactive tilt (`knock`)**: as the cursor sweeps the shelf, each element it *enters* — **book
  OR spine cluster** — is knocked once: it tips in the cursor's **direction of travel** (`kick =
  clamp(±9°, dx·0.2)`, magnitude scales with sweep speed), then rocks back upright with
  `elastic.out(1,0.3)` (same heft as the landing). A reaction, not a follow. The `pointermove` lives on
  `#menu` (so the outer spines are reachable) gated to the shelf's vertical band; hit-testing uses
  `offsetLeft/offsetWidth` (transform-independent) and re-fires only on entering a new element. Spines
  are `z-index:0` behind the `z-index:1` books, so a tipping spine tucks **behind** — never overlapping.
- **Hover raise / colour / icon**: interactive books (`.book--interactive` = 1, 2 & 3). Hover/focus
  adds `.is-hover` (CSS turns the card `--orange` and cross-fades `.book__icon-base`→`.book__icon-hover`,
  e.g. `menu_1.svg`→`menu_1_hover.svg`; the swap rule is generalised to `.book--interactive`, so each
  interactive book needs a `*_hover.svg`) and GSAP raises the outer `y` (-40px). Book 4 (`.book--soon`,
  dark) is **dimmed / non-interactive** — it still gets knocked (ambient shelf physics) but doesn't raise/recolour.
- **Magnetic button component ("True button")**: structure is `.mag-zone` (the field) → `.mag-btn`
  (the pill, transform target, `overflow:hidden`) → `.mag-btn__bg` (fill layer) + `.label` span.
  `magneticButtons()` wires every `.mag-zone` once at boot. The button is **static at rest** (no
  idle wiggle); on `mousemove`, `gsap.utils.mapRange` over the zone rect drives the magnetic pull —
  pill at `strength` 0.4, `.label` at `labelStrength` 0.24 (lighter parallax), both `overwrite:true`;
  `mouseleave` returns both with `elastic.out(1,0.4)`. Variants:
  - `--explore` (Figma 2008:147): pink→peach pill (`READ THE PLAYBOOK`) in a ~340×150 field;
    `.mag-btn__bg` carries the `linear-gradient(0deg,#ffa8cd,#fdd193)` + `box-shadow: inset 0 0 0 1px
    rgba(0,0,0,.2)` **inner** stroke; padding `12px 24px`. (`#intro` is `min-height:100svh` + flex
    column `justify-content:center`, so the content + CTA sit vertically centred — no bottom deadspace.)
  - `--back` (Menu): transparent pill, `--midnight` text + `1px rgba(1,34,51,.25)` border on the bg
    (hover fills `rgba(1,34,51,.06)`); `overflow:visible` (short label, no clip); no arrow. The
    zone is absolute top-left in `#menu`.
- **Reduced motion**: the menu opens instantly with books placed (no drop/sway/raise); the Explore
  button skips the wiggle/magnetic; colour + icon swap stay (CSS `:hover`).

## The chapter pages (interior page system)
All chapter pages (`why-we-exist.html` = ch1, `our-point-of-view.html` = ch2, `stages-of-a-project.html`
= ch3) share `css/chapter.css` + `js/chapter.js`. Build a new chapter by copying the skeleton and
changing only: `<body>` theme vars, rail label, hero title `<span>`s, hero `<img>` src
(+ `data-spin` to animate), the `.toc` rows, and the `.copy` content.

- **Layout (reference 1440):** the rail is `position:fixed` (outside `#smooth-wrapper`). The body is a
  centred 1440 canvas; the **TOC** floats left (`.toc { float:left }`, in a `display:contents`
  `.body-left`) at x132, and `.copy` is `margin-left:626; width:604`. (Float — **not** absolute/grid —
  so ScrollTrigger can pin it; see gotcha.)
- **Hero** — `.page-hero` (`min-height:100vh`, bg `--hero-bg`), big Boldonse title (`--hero-title`,
  `line-height:1.8`), and a top‑right `.hero-flower > .hero-flower__spin > img` (spins only with
  `data-spin`; size via `--flower-aspect`).
- **TOC** (`.toc`) — pinned nav (`stickyToc`) with a `--accent` active row, a scroll‑driven
  `.toc__progress-fill`, decorative `.toc__skeleton` "spine" bars (varied widths via `--a…--f`), and
  optional **accordion sub‑rows**: each `<li>` may hold a `.toc__sub` of `.toc__subrow`s that open
  only while that section is active (`tableOfContents` animates its `height`). Active main/sub track
  scroll off each heading's id (`#s-31`, `#s-31-1`, …). Titles + sub‑titles are DM Sans **600**.
- **Copy blocks** (in `.copy`, accent/midnight on chalk, Source Serif body): `.copy__heading`
  (Boldonse, `--accent`, `line-height:88px`, 24px bottom margin), `.section-head` (DM Sans 600 30px,
  `--accent`, carries the TOC‑target `id`), `.subsection-head` (DM Sans 600 18px midnight), `.lead`,
  `.copy ul/ol/li` (themed markers), `.figure-note` (renders a "Diagram — …" caption as a bordered
  aside — **no inline graphics are drawn**), `.source-note`, `.pullquote` (+ `pullmark.svg`). Most
  blocks carry `.reveal` for the fade‑up — **except `.toc`** (its reveal transform fought the pin).

## The continuous reader (`playbook.html`)
The canonical way to read the playbook: all three chapters stacked in one document so scrolling
flows seamlessly from chapter to chapter. Each chapter is the standalone skeleton (hero + body)
wrapped in `.section.chapter-panel` (id `#chN`, theme vars + `data-rail` label + optional
`data-rail-fg` on dark heroes) → `.chapter-panel__scale` (the layer the transition animates). One
shared rail + one `#menu` for the whole document; one ScrollSmoother.

- **The chapter‑to‑chapter effect** (`panelTransitions`, ported from the GSAP "stacked panels"
  ScrollTrigger demo). Within a chapter everything scrolls normally (hero → body, TOC pinned). Only
  at the **very bottom** does the panel pin (`start "bottom bottom"`, scrub, `pinSpacing:false`,
  `pinType:"transform"`) and its `.chapter-panel__scale` scale 1→0.7 + fade 1→0 while the **next
  chapter scrolls up and over it** (`pinSpacing:false` reserves no spacer). The **last chapter never
  transitions out** (`arr.slice(0,-1)`). NB the example's clipped‑slide + `fakeScrollRatio` machinery
  is **dropped** — our chapters are naturally tall/scrollable, so only the boundary scale/fade is ported.
- **Snap (quick, scroll‑direction‑biased, never half‑cut):** the pin spans **exactly one viewport**
  (`end "+=" innerHeight`) — this is **required**, not tunable: with `pinSpacing:false` the next chapter
  rises by exactly the pin distance, so it needs a full viewport to travel from viewport‑bottom up to
  viewport‑top and land flush (a shorter distance left it stopping partway up). The *quickness* comes
  from the snap, not from shortening the pin. The trigger carries
  `snap:{ snapTo:[0,1], directional:true, delay:0.02, duration:{min:.18,max:.34}, ease:"power2.out" }`.
  `directional:true` biases the snap to the way you're scrolling — a small **down** nudge completes
  into the next chapter, a small **up** nudge returns — and `delay:0.02` fires it almost the instant
  you stop, so it commits with a flick instead of a full scroll, always settling **on** a chapter.
  Snap is only active inside the pin's range, so reading within a chapter is unaffected.
- **The look (black + rounded corners, like the demo):** `.chapter-panel` is **black**, seen only
  mid‑transition — the scale pulls the shrinking chapter in horizontally (black down both sides) while
  the next chapter, with its **rounded top corners** (`.chapter-panel__scale` `border-radius` +
  `overflow:hidden`), rises up over it against the black. (The outgoing chapter's own top edge is
  off‑screen — it's multi‑viewport tall — so the rounded top reads on the **incoming** chapter. The
  `overflow:hidden` does **not** break the in‑panel TOC pin — verified `top≈100`.)
- **Why outer/inner two elements:** the pin writes a `transform` to `.chapter-panel` and the
  scale/fade tween writes a `transform`+`opacity` to `.chapter-panel__scale` — separate elements so
  the two transforms never fight (same lesson as the pinwheel traveler). The scale `transform-origin`
  is `50% calc(100% − 50vh)` so a multi‑viewport chapter scales about the **viewport** centre (it's
  pinned bottom‑aligned), not its off‑screen geometric centre.
- **TOC pin coexists:** each chapter's `stickyToc` pin ends at its `.page-body` bottom — i.e. just
  before that chapter's transition pin begins — so the two don't overlap. Three TOC pins + two
  transition pins + ScrollSmoother all live in one document without conflict.
- **Menu deep‑linking:** the reader's books carry in‑page `data-href="#chN"`; `menuScene` does the
  `smoother.scrollTo(target, false)` **on click, before the close fade runs** (unlocking page scroll
  first) — so the closing overlay uncovers the destination already in place, with **no flash of the
  chapter you were on**. (Scrolling after the fade — the obvious order — showed the old chapter for a
  beat, then jumped.) Arriving with a `#chN` hash from another page (the `index.html` books are
  `playbook.html#chN`) is handled by `handleDeepLink()` on load. Both land you at the chapter top;
  scrolling on from there runs the next transition normally.
- **Reduced motion:** `panelTransitions` bails, so the chapters simply stack and scroll natively
  (no scale/fade); deep‑link falls back to `scrollIntoView`. The standalone chapter files remain as a
  deeper fallback (no longer linked from any menu).

## Conventions & gotchas
- **One animation library per property.** If both Motion One and GSAP animate the same property,
  the loser's *finished* animation (Motion One's WAAPI fill holds its end value above inline
  styles) intermittently overrides the other → the classic "sometimes still visible when
  scrolling" bug. Consolidate to GSAP for anything the scroll scene also touches.
- **Load-entrance + scroll-scrub on the same property** needs two fixes: (1) the scrub tween must
  be `fromTo` with an explicit start and `immediateRender:false` — a plain `.to()` lazily captures
  its start from the element, which the entrance `from(autoAlpha:0)` leaves at 0, making it a
  `0→0` no-op that never animates or restores; (2) kill the entrance tweens on first scroll, or
  their *late completion* snaps the value back to 1 and overrides the (possibly paused) scrub.
- Use **`autoAlpha`** (opacity + visibility) for fade-outs so faded elements are truly gone.
- **Cross-section element travel** = fixed traveler + invisible in-flow spacer. The spacer keeps
  layout and accessibility; drive the traveler from the spacer's live rect so it stays responsive
  and hands off to natural scrolling once parked. Center via `translate(-50%,-50%)` written by the
  ticker (GSAP doesn't touch the outer; rotation lives on the inner) so there's no transform fight.
- **Scrubbed position + timed transition:** a timed transition fired inside a pin can be *outrun* —
  if the user scrolls past the pin `end` before it finishes, the section unpins and the (live) target
  starts moving, so the traveler chases it and never settles. Give the timed align enough pinned
  scroll after `ALIGN_AT` to complete (`(1 − ALIGN_AT) · pinLength` ≳ what a normal scroll covers
  in the transition's duration).
- Center absolutely-positioned hero elements with `left:0;right:0;margin-inline:auto` (NOT
  `transform: translateX(-50%)`) so GSAP can own the `transform` for animation without conflict.
- GSAP-animated CSS custom props must be **declared with a real initial value** (e.g.
  `--streak-hide: 100%`), otherwise GSAP reads an empty start and jumps to the end value.
- Always honour `prefers-reduced-motion`: `pinwheelScene`/`scrollScene` bail to end-states and the
  static graphic; `introReveal` shows the copy.
- After font load, call `ScrollTrigger.refresh()` (metrics shift can break pin distances).
- **ScrollSmoother:** only `#smooth-content` (the `<main>`) is transformed/smoothed; the `position:fixed`
  **menu overlay and pinwheel traveler live OUTSIDE it** (direct children of `<body>`) so fixed stays
  viewport-anchored. The pinwheel's `place()` reads the slot's live `getBoundingClientRect()`, which
  already reflects the smoother transform, so the fixed traveler still aligns. The menu **does NOT call
  the smoother API** (pausing it tangled with the open/close and bugged out); instead, while open it
  hard-locks page scroll via `documentElement.style.overflow = "hidden"` — freezing the window scroll
  the smoother rides on, decoupled from ScrollSmoother. Restored on close.
- **Pinning under ScrollSmoother (the chapter TOC).** CSS `position:sticky`/`fixed` **cannot survive**
  the smoother's transform on `#smooth-content` (a sticky el reads `top:-402` instead of sticking; a
  fixed el is positioned relative to the transformed ancestor, not the viewport). Use a GSAP
  `ScrollTrigger` pin with **`pinType:"transform"`** (the default `"fixed"` also fails — the pin is
  created but applies no compensating transform). The pinned element must be in **normal flow** —
  pinning an `absolute` el or one inside a CSS **grid/flex** cell silently no‑ops (hence the TOC is
  `float:left`). **Do NOT hand‑roll a per‑frame `gsap.ticker` follow** that re‑reads
  `getBoundingClientRect` and re‑applies the transform: it lands a frame behind the smoother and the
  nav visibly **lags**. The ScrollTrigger pin is internally synced → glued with no lag. (`stickyToc`.)
- **Dark‑hero rail legibility.** The fixed rail overlays both the coloured hero and the chalk body.
  The label + search default to `--midnight` (fine on light heroes + chalk); on a **dark** hero set
  `--rail-fg:--chalk` so they don't vanish against it (they then read faint over the chalk body — an
  accepted trade‑off; the hamburger's blue square keeps it usable throughout).
- **Headless verification caveat:** GSAP's rAF ticker stalls under Chrome `--virtual-time-budget`,
  so `gsap.ticker`-driven transforms and timed timelines don't advance — the pinwheel/align/wind
  read as "stuck." Verify geometry from `ScrollTrigger` `.progress` + `getBoundingClientRect` and
  compute the expected output, not the rendered transform. (Scrub *scrubs* do apply via
  `ScrollTrigger.update()`, so the streak/title scrub is testable.) See the project memory note.

## Status / next
- ✅ Cover (`index.html`): Cover 1, pinned gradient-reveal scene, the pinwheel rise→align beat, Cover 3
  "What this is". Responsive + reduced-motion. No console errors.
- ✅ Explore button (magnetic) at the bottom of `#intro`, and the bookshelf **Menu** overlay
  (`2:22779` / hover `2:22921`): books fall in, sway with the cursor, books **1–3** raise + turn
  orange + swap to their colour icon; book 4 dimmed "coming soon". Back/`Esc` closes.
- ✅ **Three chapter pages built** (Figma `2:23049` etc.) on the shared chapter system — fixed rail
  (hamburger → Menu, lucide icons), themed coloured hero + top‑right graphic, pinned scroll‑synced
  TOC (ch3 has accordion sub‑rows + spines), full copy from `playbook-content/`. Book 1→ch1, 2→ch2,
  3→ch3. Responsive + reduced‑motion. No console errors.
- ✅ **Continuous reader (`playbook.html`)** — the three chapters stacked in one document with the
  seamless chapter‑to‑chapter scroll effect (pin + scale/fade + cover, ported from the GSAP "stacked
  panels" demo). Per‑chapter TOC pins coexist; rail label/colour follow the active chapter; menu
  books deep‑link in (in‑page `#chN`) and `index.html`'s books now open the reader (`playbook.html#chN`).
  Verified over CDP: 3 panels, 2 transition pins (last chapter exempt), accurate deep‑link landing,
  clean menu‑click scroll, standalone pages still pass. Responsive + reduced‑motion. No console errors.
- ⏭️ Book 4 ("How we work as a team") page not built yet. The inline **diagrams** in ch2/ch3 are
  rendered as text `.figure-note`s, not drawn. `1_Graphic.svg` has the known petal‑clipping issue.
