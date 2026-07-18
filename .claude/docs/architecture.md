# Architecture & file map

How the project is wired: the three page types, the CSS layering, and the two JS modules.
For motion details see [motion.md](motion.md); per-surface deep dives in
[chapter-pages.md](chapter-pages.md), [reader.md](reader.md), [menu.md](menu.md); hard-won
lessons in [gotchas.md](gotchas.md).

## The three page types

| Page(s) | What it is | ScrollSmoother? | Has `#menu`? | Has topbar/rail? |
|---|---|---|---|---|
| `index.html` | Landing (cover + intro section + landing shelf) | Yes (`smooth: 1.7`, heavier glide) | No | No |
| `playbook.html` | Continuous reader — Foreword + all 3 chapters in one document | Yes | Yes | Yes (shared) |
| `foreword.html`, `why-we-exist.html`, `our-point-of-view.html`, `stages-of-a-project.html` | Standalone pages (ch0/ch1/ch2/ch3) — kept as a fallback, no longer linked from any live navigation | Yes | Yes (duplicated) | Yes |
| `about.html` | About page — dark (`#0c1619`, `body.page-dark`, no rail): full-viewport hero (centred title + intro row over the full-bleed bottom `about_hero_dark.webp`), then pinned horizontal photo gallery + the "Behind the Playbook" credits section (`.about-crew`) on scroll. Linked from the drawer's About row; clean path `/about`. Loads `js/about.js` instead of `js/chapter.js`. | Yes | Yes (duplicated) | Yes |

All chapter surfaces (standalone + reader panels) share `css/chapter.css` + `js/chapter.js`.
**Every live menu now points at the reader** (`index.html` shelf → `playbook.html#chN`; the
reader's own drawer rows → in-page `#chN`).

## HTML files

- **`index.html`** — TWO in-flow full-viewport sections (home-v3, no pin anywhere):
  - `#hero` (cover): the `.clouds` (direct child of `.hero`, outside the `.hero__stage` overflow
    clip so the scroll parallax can carry them over the intro) + `.hero__stage` with
    `.eyebrow--top`, the centred `.lockup-row` (`#pinwheelSlot` + `<h1 class="lockup">`) and `#arrow`;
  - `#intro` (Figma `2082-2203`): `.intro__row` (`.intro__headline` with two masked `.line` wrappers
    of `.word` spans; `.intro__col` = `.intro__copy` + the `.intro__explore` button,
    `[data-about-open]` → About popup) + the in-flow **landing shelf** `#homeShelf` / `.home-shelf` →
    `.shelf__spines` + **five `.book` cards** (books 1–5 → `/chapter-N`; book 0 Foreword retired,
    kept commented);
  - `.home-logo` (top-left `playbook_logo.svg` wordmark) — a **fixed top bar**, moved OUT of `#intro`
    to a direct child of `<body>` (outside `#smooth-wrapper`) so `position:fixed` holds under
    ScrollSmoother; revealed by `logoBar()` once the page bottom is reached;
  - the **mobile card nav** `<nav class="home-cards">` (hidden on desktop, visible ≤800px) — five `.home-card` horizontal cards, static/no-animation, tap-to-navigate.
  - **`#aboutModal`** (`.about-modal`) — the About popup, a direct child of `<body>` **outside
    `#smooth-wrapper`** so `position:fixed` holds and `main` can be made `inert` while it's open.
    Nested `.about-modal__scrim` · `.about-modal__close` (✕, kept OUT of the translating layer) ·
    `.about-modal__mask` → `.about-modal__panel` → `.about-modal__card` (the counter-translate pair +
    content). See [motion.md](motion.md) → About popup.

  The pinwheel is **not** in the markup — JS injects a fixed traveler (rises on load → aligns to
  `#pinwheelSlot`, then just tracks that slot's live rect, so the smoothed scroll + the cover
  scale-down move/shrink it). `place()` is added to the ticker after ScrollSmoother, so it reads the
  post-transform rect each frame → tracks cleanly. This is the **only** place the bookshelf `.book`
  system is used. See [menu.md](menu.md) for shelf specs + mobile card layout.

- **`foreword.html`** — standalone Foreword fallback (ch0). No coloured hero, no TOC. Shell mirrors
  the chapter pages but uses `.page-body.foreword` instead of `.page-hero`; does not load
  `routes.js`. `js/chapter.js`'s init guard was broadened to cover it so `copyReveals` runs.

- **Standalone chapter pages** — one shared skeleton: fixed `.topbar` (logo → home; hamburger
  `data-menu-open` → Menu) + fixed `.rail` (outside `#smooth-wrapper`) + `#smooth-wrapper >
  main.page` (`.page-hero` cover + `.page-body` with `.toc` and `.copy`) + the duplicated `#menu`
  drawer + vendor scripts + `js/chapter.js`. Per-chapter differences are **only**: `<body>` theme
  vars, rail label, hero title `<span>`s, hero `<img>` src, TOC rows, and copy. Copy is transcribed
  from `playbook-content/playbook-outline__5_.html` (source content, not served).

- **`playbook.html`** — the continuous reader. The Foreword (`#ch0`, `.chapter-panel--foreword`, no hero/TOC) followed by all three chapters, each wrapped in `.section.chapter-panel > .chapter-panel__scale` (ids `#ch0`–`#ch3`; theme vars + `data-rail`/`data-rail-fg` on the panel) so scrolling flows seamlessly. One shared rail + one `#menu` + one ScrollSmoother. See [reader.md](reader.md).

**The `#menu` drawer block is duplicated verbatim** into every page that has one (the 3 chapter
pages + `playbook.html`); the only per-page difference is each row's `data-href` (standalone →
sibling `.html`; reader → in-page `#chN`). Opened by any `[data-menu-open]`.

## CSS layers (load order matters)

1. **`css/styles.css`** — tokens (`:root`), `@font-face`, type system, layout, `.pinwheel` traveler
   styles, the intro section (`.intro`, `.home-logo`), the magnetic button component,
   the Menu drawer (`.menu__scrim` / `.menu__drawer` / `.menu__row`), the bookshelf
   `.book`/shelf/spine system (fixed px per Figma — 188px books, 90px gaps — now used only by the
   landing shelf), and motion base states (FOUC-hide of the reveal under `.js`, shown statically
   under reduced motion).
2. **`css/chapter.css`** — shared chapter stylesheet (loaded after `styles.css`): topbar, rail,
   hero, the pinned scroll-synced TOC (+ accordion sub-rows), the copy type system. Themed per
   chapter via CSS vars. See [chapter-pages.md](chapter-pages.md).
3. **`css/playbook.css`** — reader-only layer (loaded after `chapter.css`): `.chapter-panel` (black
   backdrop, only seen mid-transition) + `.chapter-panel__scale` (the scaled/faded layer; rounded
   top corners + `overflow:hidden`; `transform-origin` near the bottom). See [reader.md](reader.md).

## JS modules

### `js/main.js` — runs on every page

Booted at the bottom (`smoothScroll()` first). The **index-only scenes early-return when their
elements are absent**, so loading `main.js` on a chapter page is a safe no-op for them.
`smoothScroll()` runs everywhere. (`menuScene()` and `magneticButtons()` were removed with the
drawer Menu — 2026-07.)

| Function | Role | Detail |
|---|---|---|
| `smoothScroll()` | Creates ScrollSmoother on `#smooth-wrapper`/`#smooth-content` on **every** surface (`smoothTouch:0`); the landing (`#hero`) gets `smooth:1.7`, others `smooth:1`. **Skipped under reduced motion.** | [gotchas.md](gotchas.md) (ScrollSmoother) |
| `arrowBob()` | Infinite `y` bob on the arrow (independent of opacity). | — |
| `cloudDrift()` | One-direction sky drift (left→right, staggered speeds, edge fade, breathe) + the scrubbed container parallax down into the intro. Rebuilt on resize, no-op under reduced motion. | [motion.md](motion.md) |
| `introHold()` | Freezes page scroll on boot (smoother `paused` + `overflow:hidden`) so the opening `loadTl` animation can't be cut off; releases on `loadTl` complete. No-op under reduced motion. | [motion.md](motion.md) |
| `coverScroll()` | Unpinned cover exit (`#hero`/`#lockupRow`): a **timed play-once** timeline (uninterruptible) scales the lockup 1→0.55 (pinwheel follows via its slot rect), fades the arrow out + the top-left `.home-logo` in; latched on first downward scroll, reverses at the top. | [motion.md](motion.md) |
| `introScene()` | Once-on-enter `#intro` reveal: headline word-by-word rise + copy/Explore fade-up. | [motion.md](motion.md) |
| `logoBar()` | Fixed top-left wordmark (`.home-logo`, body-level): hidden until the page bottom is first reached, then shown as a persistent top bar over the content but hidden over the hero cover (no duplicate lockup). | [motion.md](motion.md) |
| `pinwheelScene()` | Builds the fixed pinwheel traveler; `place()` blends position via `prox.{rise,align}` + tracks the slot rect; the "wind" spin. | [motion.md](motion.md) |
| `homeBooks()` | Parks `#homeShelf` books/spines, plays their rise-in once the shelf enters, wires knock/hover. | [menu.md](menu.md) |
| `aboutModal()` | The "Learn what this playbook is for." About popup: a counter-translate wipe entrance (mask/panel ±100%, `hrOut` CustomEase), masked-line text + image clip/scale reveals, scroll-lock while open, ESC/scrim close. Reduced motion intentionally ignored. No-ops without `#aboutModal`. | [motion.md](motion.md) |

### `js/chapter.js` — runs on chapter surfaces

Loaded after `main.js`; reuses the GSAP plugins + ScrollSmoother it created. **Scope-aware:** the
four per-chapter functions each take a `root` — on a standalone page `initChapter(document)`; on the
reader each runs once **per `.chapter-panel`** so the three TOCs / reveal batches / flowers don't
collide.

- `heroFlowerSpin(root)` — wind-spin, **only if** `root` has `.hero-flower[data-spin]` (ch1 only).
- `copyReveals(root)` — `ScrollTrigger.batch` fade-up of `.reveal`.
- `stickyToc(root)` — the pinned TOC nav (see [gotchas.md](gotchas.md): pinning under ScrollSmoother).
- `tableOfContents(root)` — active row tracking + accordion sub-rows + click-scroll. Also: tweens
  `.toc__scroll.scrollTop` to keep the active (sub-)row centred inside the capped viewport
  (`follow()`); toggles `.is-overflowing` on the scroll wrapper on init, after each accordion
  open/close, and on `ScrollTrigger` refresh. **The `.toc__progress` fill bar has been removed.**
- `chapterSwitch(root)` — the TOC's chapter stack jumps between chapters (in-page on the reader via
  `GTCRoutes`/`smoother.scrollTo`, else a full load to `/chapter-N`); same behaviour as the menu's
  `wireNav`. Selector: `.toc__chapter[data-href]` (vertical list rows, not the old 4-cell grid).
- `mobileTocBar()` — one instance per document (both boot branches). Builds the heading list from
  `.toc` navs' `[data-toc]` rows in DOM order; shows a fixed bottom `.toc-bar` (≤768px) with
  prev/next arrows and a label that tracks the 42%-viewport heading; tapping the label slides up a
  `.toc-sheet` full index. Cross-chapter jumps in the reader re-aim after smooth scroll settles (same
  convergence idea as `handleDeepLink`). See [chapter-pages.md](chapter-pages.md): mobile section bar.
- `topbarScrim()` — toggles `html.topbar-clear` on the `<html>` element whenever a coloured hero
  fills the top band (probe at y=64), which hides the chalk scrim (`.topbar::before`) behind the
  logo/hamburger so it doesn't show as a chalk band over a coloured hero. Driven by a page-wide
  `ScrollTrigger`; no-op when no `.page-hero` elements exist (e.g. standalone foreword).

**Reader-only extras** (run when `.chapter-panel`s exist) — see [reader.md](reader.md):
`panelTransitions()`, `railSync()`, `railReveal()`, `handleDeepLink()`, `urlSync()`.

### `js/transition.js` — cross-page navigation fade (runs on every page)

Loaded last (after `main.js`/`chapter.js`/`about.js`) on all 9 pages. The humanistreview.ai-style
sequential fade between pages: a delegated click interceptor gives every internal `<a>` a **1.0s
`hrOut` body fade-out** (html carries the backdrop; heading to/from the dark About page the html
`background-color` cross-fades to the destination's colour so the document swap is invisible), then
really navigates; scroll is locked during the exit. Exposes **`window.GTCNav.to(href)`** for the
JS-driven navigations (shelf books in `main.js`, `chapterSwitch` + `.toc-sheet` rows in
`chapter.js` — all fall back to `location.href` when absent). Hovering a link/`[data-href]`
prefetches the destination. The **entrance** is pure CSS (`gtc-page-in` in `styles.css`, 1.3s, fill
`backwards` — see [gotchas.md](gotchas.md): CSS animation fill vs GSAP) + a `pageshow` handler that
replays the fade on bfcache restores (browser back/forward). Deep-linked reader arrivals get their
entrance from `revealDeepLink` (`chapter.js`), matched to the same 1.3s/`hrOut`. Skips (instant
nav): reduced motion, missing GSAP, same-page hash links, modifier/new-tab clicks. Full
choreography in [motion.md](motion.md).

### `js/routes.js` — clean-URL route table (reader + landing)

Classic `<head>` script (runs first, synchronously, before the modules) exposing
`window.GTCRoutes` (`idToPath`/`pathToId`/`isReaderPath`). One `SECTION_SLUGS` table is the source of
truth mapping `#s-XY` ids ⇄ `/chapter-N/<slug>` paths (chapters derive `/chapter-N`). **`ch0` is
gone** (2026-07): the reader's Foreword panel was retired, so `/foreword` is NOT a reader path — it
serves the standalone `foreword.html` directly. Read by the anti-flash inline script, `handleDeepLink`/`urlSync` (`chapter.js`),
and `wireNav` (`main.js`). Paths are server-rewritten — `vercel.json` (Vercel) + `_redirects`
(Netlify/CF) map `/chapter-*` and `/foreword` → `/playbook.html`; `playbook.html` carries
`<base href="/">` so its relative assets survive a two-segment path. Full scheme + traps in
[reader.md](reader.md) and [gotchas.md](gotchas.md).

## Other directories

- **`assets/`** — graphics + self-hosted `fonts/`. Key files:
  > **Art is WebP since the 2026-07 production pass.** The Figma SVG exports wrapped base64 rasters
  > in mask layers, so file size bore no relation to render size (`menu_2.svg` was a 100×100 icon
  > weighing 380KB). Each was rasterized in headless Chrome at 2× its render box and encoded to
  > WebP — pixel-faithful, 99% smaller. **Re-exporting from Figma? Rasterize; don't ship the raw
  > SVG.**

  - `playbook_logo.svg` (topbar logo), `arrow.svg` (57×45), `Align_Graphic.webp` (cover pinwheel,
    583K→26K), `favicon.png`, `pullmark.svg` (15² quote mark), `og-image.webp` (1200×630 share card
    — **built but not yet wired; needs the production domain**, see CLAUDE.md).
  - Chapter heroes: `1_Graphic.svg` (four-petal flower — ch1; **stays SVG**, it's true vector and
    rasterizing made it *bigger*; **known issue:** its internal `clipPath` crops petals to a 549×554
    box), `2_Graphic.webp` (ch2), `3_Graphic.webp` (ch3), `4_Graphic.webp` (ch4), `5_Graphic.webp`
    (ch5 — bespoke now, no longer reusing 04's).
  - `menu_{1..5}.webp` / `menu_{1..5}_hover.webp` — the landing books' icons, and the `_hover` set
    doubles as the 40px `.callout__icon` on chapter pages, so one 200px source serves both.
    `book_element_{1..5}.svg` (gray shelf-spine clusters, 294px tall — landing shelf only).
  - **Diagrams** — `diagram_*.webp`. The old numbered Figma exports (`0? Diagram *.svg`,
    `0? Divider.svg`, `Title_Streaks.png`, `Opening_Title.svg`) are unreferenced and
    `.dockerignore`d: 18MB of base64-in-SVG kept as source for the diagrams still to be drawn.
    Filenames have spaces + en-dashes → reference them URL-encoded if you ever wire them up.
  - `01 Divider.svg` / `02 Divider.svg` / `03 Divider.svg` are section dividers (05 reuses 03's).
- **`playbook-content/playbook-outline__5_.html`** — full playbook copy (source for chapter text; not served).
- **`vendor/`** — `gsap.min.js`, `ScrollTrigger.min.js`, `ScrollSmoother.min.js`, `CustomEase.min.js`
  (all vendored locally — do not switch to CDNs). `motion.esm.js` (Motion One) and
  `CustomWiggle.min.js` were removed 2026-07: both were unused, and CustomWiggle blocked render on
  all 9 pages. The site is GSAP-only.
- **`.figma_ref/`** — Figma reference screenshots for visual diffing (not shipped/served).
