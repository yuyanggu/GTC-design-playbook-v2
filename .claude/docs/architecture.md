# Architecture & file map

How the project is wired: the three page types, the CSS layering, and the two JS modules.
For motion details see [motion.md](motion.md); per-surface deep dives in
[chapter-pages.md](chapter-pages.md), [reader.md](reader.md), [menu.md](menu.md); hard-won
lessons in [gotchas.md](gotchas.md).

## The three page types

| Page(s) | What it is | ScrollSmoother? | Has `#menu`? | Has topbar/rail? |
|---|---|---|---|---|
| `index.html` | Landing (cover + after-scroll reveal + landing shelf) | **No** (native scroll) | No | No |
| `playbook.html` | Continuous reader — all 3 chapters in one document | Yes | Yes | Yes (shared) |
| `why-we-exist.html`, `our-point-of-view.html`, `stages-of-a-project.html` | Standalone chapter pages (ch1/ch2/ch3) — kept as a fallback, no longer linked from any menu | Yes | Yes (duplicated) | Yes |

All chapter surfaces (standalone + reader panels) share `css/chapter.css` + `js/chapter.js`.
**Every live menu now points at the reader** (`index.html` shelf → `playbook.html#chN`; the
reader's own drawer rows → in-page `#chN`).

## HTML files

- **`index.html`** — ONE `<section>` `#hero` (home-v2; no `#intro`/`#introGraphic` anymore). It holds:
  - the `.clouds`;
  - the cover: `.eyebrow--top` + centred `.lockup-row` (`#pinwheelSlot` + `<h1 class="lockup">` text) + `#arrow`;
  - the **after-scroll reveal**: `.home-logo` (top-left `playbook_logo.svg`) + `.intro-reveal`
    (`#pinwheelSlotScrolled` + `<h2 class="intro__head">` with two clip-wrapped `.line>span`s +
    `.intro__body` two `<p>`s);
  - the in-flow **landing shelf** `#homeShelf` / `.home-shelf` → `.shelf__spines` + four `.book` cards.

  The pinwheel is **not** in the markup — JS injects a fixed traveler (rises on load → aligns to
  `#pinwheelSlot` → on scroll glides up to `#pinwheelSlotScrolled`). Books navigate via `data-href`
  to `playbook.html#chN` (1→#ch1, 2→#ch2, 3→#ch3; book 4 `.book--soon` "coming soon"). This is the
  **only** place the bookshelf `.book` system is used.

- **Standalone chapter pages** — one shared skeleton: fixed `.topbar` (logo → home; hamburger
  `data-menu-open` → Menu) + fixed `.rail` (outside `#smooth-wrapper`) + `#smooth-wrapper >
  main.page` (`.page-hero` cover + `.page-body` with `.toc` and `.copy`) + the duplicated `#menu`
  drawer + vendor scripts + `js/chapter.js`. Per-chapter differences are **only**: `<body>` theme
  vars, rail label, hero title `<span>`s, hero `<img>` src, TOC rows, and copy. Copy is transcribed
  from `playbook-content/playbook-outline__5_.html` (source content, not served).

- **`playbook.html`** — the continuous reader. All three chapters in ONE document, each wrapped in
  `.section.chapter-panel > .chapter-panel__scale` (ids `#ch1/#ch2/#ch3`; theme vars +
  `data-rail`/`data-rail-fg` on the panel) so scrolling flows seamlessly chapter→chapter. One shared
  rail + one `#menu` + one ScrollSmoother. See [reader.md](reader.md).

**The `#menu` drawer block is duplicated verbatim** into every page that has one (the 3 chapter
pages + `playbook.html`); the only per-page difference is each row's `data-href` (standalone →
sibling `.html`; reader → in-page `#chN`). Opened by any `[data-menu-open]`.

## CSS layers (load order matters)

1. **`css/styles.css`** — tokens (`:root`), `@font-face`, type system, layout, `.pinwheel` traveler
   styles, the after-scroll reveal (`.home-logo`, `.intro-reveal`), the magnetic button component,
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
`smoothScroll()`, `menuScene()`, and `magneticButtons()` run everywhere.

| Function | Role | Detail |
|---|---|---|
| `smoothScroll()` | Creates ScrollSmoother on `#smooth-wrapper`/`#smooth-content` (`smooth:1`, `smoothTouch:0`). **Skipped under reduced motion AND on the landing page** (`#hero` present → native 1:1 scroll). | [gotchas.md](gotchas.md) (ScrollSmoother) |
| `arrowBob()` | Infinite `y` bob on the arrow (independent of opacity). | — |
| `cloudDrift()` | One-direction sky drift (left→right, staggered speeds, edge fade, breathe). Rebuilt on resize, no-op under reduced motion. | [motion.md](motion.md) |
| `heroScene()` | The landing hero scroll master (`#hero`/`#lockupRow`) — one paused, reversible timeline. | [motion.md](motion.md) |
| `pinwheelScene()` | Builds the fixed pinwheel traveler; `place()` blends position+size; the "wind" spin. | [motion.md](motion.md) |
| `homeBooks()` | Parks `#homeShelf` books/spines + wires knock/hover. | [menu.md](menu.md) |
| `menuScene()` | Open/close the `#menu` drawer (one interruptible timeline). | [menu.md](menu.md) |
| `magneticButtons()` | Wires every `.mag-zone` magnetic button (drives the Explore CTA). | [motion.md](motion.md) |

### `js/chapter.js` — runs on chapter surfaces

Loaded after `main.js`; reuses the GSAP plugins + ScrollSmoother it created. **Scope-aware:** the
four per-chapter functions each take a `root` — on a standalone page `initChapter(document)`; on the
reader each runs once **per `.chapter-panel`** so the three TOCs / reveal batches / flowers don't
collide.

- `heroFlowerSpin(root)` — wind-spin, **only if** `root` has `.hero-flower[data-spin]` (ch1 only).
- `copyReveals(root)` — `ScrollTrigger.batch` fade-up of `.reveal`.
- `stickyToc(root)` — the pinned TOC nav (see [gotchas.md](gotchas.md): pinning under ScrollSmoother).
- `tableOfContents(root)` — active row + progress fill follow scroll; accordion sub-rows; click-scroll.
- `chapterSwitch(root)` — the TOC's 4-cell chapter switcher jumps between chapters (in-page on the
  reader via `GTCRoutes`/`smoother.scrollTo`, else a full load to `/chapter-N`); same behaviour as the
  menu's `wireNav`.

**Reader-only extras** (run when `.chapter-panel`s exist) — see [reader.md](reader.md):
`panelTransitions()`, `railSync()`, `railReveal()`, `handleDeepLink()`, `urlSync()`.

### `js/routes.js` — clean-URL route table (reader + landing)

Classic `<head>` script (loaded before `gate.js`'s siblings and the modules) exposing
`window.GTCRoutes` (`idToPath`/`pathToId`/`isReaderPath`). One `SECTION_SLUGS` table is the source of
truth mapping `#s-XY` ids ⇄ `/chapter-N/<slug>` paths (chapters derive `/chapter-N`). Read by the
anti-flash inline script, `handleDeepLink`/`urlSync` (`chapter.js`), and `wireNav` (`main.js`). Paths
are server-rewritten — `vercel.json` (Vercel) + `_redirects` (Netlify/CF) map `/chapter-*` →
`/playbook.html`; `playbook.html` carries `<base href="/">` so its relative assets survive a
two-segment path. Full scheme + traps in [reader.md](reader.md) and [gotchas.md](gotchas.md).

## Other directories

- **`assets/`** — graphics + self-hosted `fonts/`. Key files:
  - `Opening_Title.svg` (606×230 navy lockup), `playbook_logo.svg` (topbar logo), `arrow.svg`
    (57×45), `Align_Graphic.svg` (cover pinwheel), `title_streaks_2.png` (gradient "PLAYBOOK";
    `Title_Streaks.png` older, unused), `favicon.png`, `pullmark.svg` (15² quote mark).
  - Chapter heroes: `1_Graphic.svg` (549×554 four-petal flower — ch1; **known issue:** its internal
    `clipPath` crops petals to a 549×554 box), `2_Graphic.svg` (230×229 — ch2), `3_Graphic.svg`
    (600×600 — ch3), `4_Graphic.svg` (not placed yet).
  - `menu_{1..4}.svg` / `menu_{1..4}_hover.svg` (mono→colour icons — used by both drawer rows and
    landing books), `book_element_{1..5}.svg` (gray shelf-spine clusters, 294px tall — landing shelf only).
  - **Chapter graphics** (filenames have spaces + en-dashes → referenced URL-encoded):
    `01 Divider.svg` / `02 Divider.svg` / `03 Divider.svg` (section dividers); diagrams
    `02 Diagram 1 – Two failure nodes.svg` (C2), `03 Diagram 1 – Full Project Arc.svg`,
    `03 Diagram 2 – Discovery.svg`, `03 Diagram 3 – The prototype spectrum.svg`,
    `03 Diagram 4 – The rapid experimentation cycle.svg` (C3).
- **`playbook-content/playbook-outline__5_.html`** — full playbook copy (source for chapter text; not served).
- **`vendor/`** — `gsap.min.js`, `ScrollTrigger.min.js`, `ScrollSmoother.min.js`, `motion.esm.js`,
  `CustomEase.min.js`, `CustomWiggle.min.js` (all vendored locally — do not switch to CDNs).
- **`.figma_ref/`** — Figma reference screenshots for visual diffing (not shipped/served).
