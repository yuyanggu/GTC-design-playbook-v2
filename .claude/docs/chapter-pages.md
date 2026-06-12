# Chapter pages (interior page system)

The shared system behind the three standalone chapter pages **and** the reader's panels:
layout, hero, TOC, copy blocks, diagrams, and the left rail. Built from `css/chapter.css` +
`js/chapter.js` (function inventory in [architecture.md](architecture.md); the reader-specific
wrapping in [reader.md](reader.md)).

Pages: `why-we-exist.html` (ch1), `our-point-of-view.html` (ch2), `stages-of-a-project.html` (ch3).
**Build a new chapter** by copying the skeleton and changing only: `<body>` theme vars, rail label,
hero title `<span>`s, hero `<img>` src (+ `data-spin` to animate), the `.toc` rows, and the `.copy`
content. Edits to diagrams/copy must be **mirrored in both** the standalone page and the matching
`playbook.html` panel.

### Foreword (chapter 0) — no-hero / no-TOC variant

`foreword.html` (standalone) / reader panel `#ch0` (`.chapter-panel--foreword`). Unlike the three
chapters it has **no coloured hero and no TOC**: a `.foreword__title` sits top-left on the chalk
background, followed by a full-width orb banner image (`assets/foreword_Graphic.png`) via
`.foreword__graphic`, then the standard offset `.copy` column. `js/chapter.js`'s standalone-init
guard was broadened to `document.querySelector(".page-hero, .page-body.foreword")` so `copyReveals`
still runs on the no-hero page. In the reader the clean URL is `/foreword` (a `routes.js` special-case).

## Layout (reference 1440)

- The rail is `position:fixed` (outside `#smooth-wrapper`).
- The body is a centred 1440 canvas. The **TOC** floats left (`.toc { float:left }`, in a
  `display:contents` `.body-left`) at x132; `.copy` is `margin-left:626; width:604`.
- Float — **not** absolute/grid — so ScrollTrigger can pin the TOC (see [gotchas.md](gotchas.md):
  pinning under ScrollSmoother).

## Hero

`.page-hero` (`min-height:100vh`, bg `--hero-bg`), big Boldonse title (`--hero-title`,
`line-height:1.6`) **anchored bottom-left** (`left:clamp(22px,3vw,44px)`,
`bottom:clamp(40px,7vh,88px)` — aligned with the topbar logo). The title `<span>`s stack number +
title; **C2 & C3 titles are one line** ("Our point of view", "Stages of a project"), C1 stays two
lines. A top-right `.hero-flower > .hero-flower__spin > img` (spins only with `data-spin` — ch1
only, via `heroFlowerSpin`) sized `min(700px,70vw)` × `--flower-aspect` (ch1 `549/554`, ch2
`230/229`, ch3 `600/600`).

**Mobile (≤768px):** the hero switches to `min-height:100svh` (small viewport height) so it fits the
visible viewport without reflowing as the browser toolbar slides — plain `100vh` is the *largest*
viewport, which overflows and pushes the bottom-anchored title below the fold when the toolbar shows.
The title's `bottom` is also lifted to `calc(56px + clamp(16px,3vh,32px))` to clear the fixed 56px
`.toc-bar` now that the hero ends exactly at the viewport bottom.

## TOC (`.toc`)

Pinned nav (`stickyToc`). Structure (stacked-chapter redesign, 2026-06):

- **`.toc__scroll`** — inner scroll viewport wrapping everything. On desktop (>1180px) it's capped
  to `calc(100vh - 160px)` with a hidden scrollbar; while the stack overflows, JS adds
  `.is-overflowing` → a CSS `mask-image` fades ~48px at the top + bottom edges, and
  `tableOfContents` tweens `scrollTop` to keep the active (sub-)row vertically centred. The follow
  tween recomputes its target every frame, so accordion height changes can't strand it; the
  overflow class re-syncs on `ScrollTrigger` refresh **and** when an accordion finishes opening/
  closing. Inner `scrollTop` never fights the pin.
- **`.toc__chapters`** — a vertical `<ul>`: every chapter is a quiet Boldonse text row
  (`.toc__chapter` = `.toc__chapter-num` + `.toc__chapter-name`, thin rules between blocks).
  Non-current rows are muted midnight (hover → full) and carry `data-href="/chapter-N"`
  (`chapterSwitch`, same behaviour as the drawer menu: in-page via `GTCRoutes` in the reader, full
  load on standalone pages). The current row is `is-current` (accent, inert) and **nests the
  chapter's `.toc__list` beneath it**; row 4 is `.toc__chapter--soon` with a `.toc__chapter-soon`
  "soon" pill. The old 4-cell icon grid + `.toc__chapter-title` were dropped in this redesign.
- **`.toc__list`** — section rows (unchanged): `.toc__row` = num (Boldonse) + vertical `.toc__rule`
  + `.toc__title` (DM Sans 700, uppercase); the active row turns `--accent`. Optional **accordion
  sub-rows**: a `.toc__sub` of `.toc__subrow`s (accent diamond + Source Serif) opens only while its
  section is active; the active sub-row is full midnight, the rest dimmed; inactive sections'
  sub-rows get their stale `is-active` cleared. Indented 26px under the chapter row. Active main/sub
  track scroll off each heading's id (`#s-31`, `#s-31-1`, …).

≤768px the whole `.toc` is hidden — the mobile section bar below replaces it.

## Mobile section bar (`.toc-bar` + `.toc-sheet`, ≤768px)

A fixed bar at the viewport bottom — `◀ [ 3.1 · section title ] ▶`, midnight bg, number in the
chapter accent (`--bar-accent`). Markup sits **outside `#smooth-wrapper`** (fixed elements can't
survive the smoother transform) in the 3 chapter pages + `playbook.html` (`foreword.html` fallback
skipped); z-order: scrim/sheet 45 · bar 46 (rail 40 < these < menu 50). `mobileTocBar()` in
`js/chapter.js` (one per document, both boot branches) drives it:

- **Heading list** built from the `.toc` navs' `[data-toc]` rows in DOM order — single source of
  truth with the desktop TOC — plus a hand-rolled `0 · Foreword` entry for `#ch0` in the reader.
- **Label** tracks the deepest heading above the 42%-viewport line (same rule as the TOC/urlSync);
  per-heading accent is resolved from its `.chapter-panel` (reader) or `document.body` (standalone).
- **Arrows** step heading-to-heading (sections + subsections, crossing chapters in the reader).
  Cross-chapter jumps **re-aim after the smooth scroll stops** (up to 6 corrections): the panel
  transitions' `pinSpacing:false` consumes scroll without moving layout, so one rect-measured
  `scrollTo` undershoots — same reason `handleDeepLink` converges. Any wheel/touch input cancels.
- **Tapping the label** slides up `.toc-sheet` (scrim + chalk panel anchored above the bar): the
  full stacked-chapter index, cloned from the `.toc` navs at boot — sub-lists forced open (inline
  accordion heights stripped), per-chapter `--accent` set inline on each block, all `is-current`/
  `is-active` cleared then re-synced (+ auto-scrolled to the active row) on open. Section/sub rows
  jump in-page; chapter rows resolve like the menu. Esc / scrim / label closes; `aria-expanded`
  reflects state.

## Copy blocks (in `.copy`, accent/midnight on chalk, Source Serif body)

- `.copy__heading` — Boldonse, `--accent`, `line-height:88px`, 24px bottom margin.
- `.section-head` — DM Sans 600, `clamp(1.5rem, 2.2vw, 2rem)` (≈32px desktop), `--accent`; carries
  the TOC-target `id`.
- `.subsection-head` — DM Sans 600, `clamp(1.25rem, 1.6vw, 1.375rem)` (≈22px desktop) midnight.
- `.lead` — lead paragraph.
- `.copy ul/ol/li` — themed markers; `<strong>` lead-ins render bold serif (`.copy li strong`) for
  definitional point-form bullets.
- `.callouts` / `.callout` / `.callout__label` — side-by-side bordered boxes (Activities / Outputs /
  Artifacts) under a stage; two-column grid that stacks to one column ≤680px. Used throughout C3.
- `.figure` — a **drawn diagram** (`.figure__img` SVG capped to the copy column, centred, no
  caption; used in C2 + C3).
- `.figure-note` — the older text "Diagram — …" aside, still used where no graphic exists (e.g. C3's
  "For each stage we capture").
- `.section-divider` — a small, subtle per-chapter graphic (`01/02/03 Divider.svg`) between sections;
  `clamp(110px,24%,150px)` wide, centred.
- `.source-note`, `.pullquote` (+ `pullmark.svg`).

Most blocks carry `.reveal` for the fade-up (`copyReveals`) — **except `.toc`** (its reveal
transform fought the pin).

## Diagrams (C2/C3)

Real SVGs from `assets/` (referenced URL-encoded — filenames have spaces + en-dashes):

- **C2** → "Two failure nodes" (under the `.lead`).
- **C3 §3.1** → "Full Project Arc" closes the section (after "Where we exit", before 3.2).
- **C3 §3.3** → "Discovery", "Prototype spectrum", "Rapid experimentation cycle".

C3 has **six** sections: 3.1 How we engage · 3.2 Qualifying · 3.3 Discovery (Subphases 1 & 2 +
the rapid experimentation cycle) · 3.4 Building & delivering · 3.5 Support & maintenance ·
3.6 Capability building (Product team / Operation team). Copy is synced from
`playbook-content/playbook-outline_6.html`. The "capability building arc" diagram has no SVG asset
yet, so it renders as a `.figure-note` placeholder.

## The left rail (`railReveal`)

The fixed `.rail` (outside `#smooth-wrapper`) is just a `.rail__divider` line + a rotated
`.rail__label` (the hamburger lives in the `.topbar`, not the rail). It shows **only over the chalk
body** and is **occluded by the coloured chapter heroes**: because the rail is `position:fixed` on
top of everything, `railReveal()` (one per-frame `ScrollTrigger` updater in `js/chapter.js`)
**clips** it to the chalk band between whatever heroes are on screen — `clip-path: inset(topClip 0
bottomClip 0)`, where the clips track each hero's intruding edge.

So on a chapter→chapter transition the **incoming hero rising from the bottom eats the rail
bottom→top** (it leaves with its chapter, just as the hero covers the rest of the outgoing chapter);
the current hero uncovers it from the top as you enter a chapter; a hero filling the strip →
`visibility:hidden`. The label sits **40px** above the viewport bottom (on standalone pages it rides
up with the section's end on exit).

`railReveal` is the **single owner** of the rail's clip, so it never fights `railSync` (which owns
label text/colour). On a **dark** hero, `railSync` sets `--rail-fg: --chalk` so the label stays
legible (mostly moot now that the clip hides the rail over heroes — see [gotchas.md](gotchas.md)).
