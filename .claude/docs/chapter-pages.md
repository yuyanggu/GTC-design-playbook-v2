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

## TOC (`.toc`)

Pinned nav (`stickyToc`). Top to bottom (redesign, Figma `2118:4187`):

- **`.toc__chapters`** — a 4-cell chapter switcher (grid of 4) that jumps between chapters, same
  behaviour as the drawer menu (`chapterSwitch` in `js/chapter.js`). The current chapter's cell is
  `.is-current` (accent fill + the colour icon `menu_N_hover.svg`, `pointer-events:none` → no-op);
  the others are grey with the mono `menu_N.svg`. Cell 4 is `.toc__chapter--soon` (inert, mirrors the
  menu's "coming soon" row). Link cells carry `data-href="/chapter-N"`; `chapterSwitch` resolves via
  `GTCRoutes.pathToId` → `smoother.scrollTo` in-page (reader), else a full load to `/chapter-N`
  (standalone pages, where `GTCRoutes` is absent).
- **`.toc__chapter-title`** — the chapter title, Boldonse 24px `--accent` (full titles; ch1 wraps to
  two lines).
- **`.toc__progress` / `.toc__progress-fill`** — scroll-driven progress bar (grey track + accent fill).
- **`.toc__list`** — section rows separated by thin horizontal rules (`li + li` border-top). Each
  `.toc__row` is num (Boldonse) + vertical `.toc__rule` + `.toc__title` (DM Sans **700**, uppercase,
  `-0.32px`); the active row turns `--accent` (no fill). Optional **accordion sub-rows**: each `<li>`
  may hold a `.toc__sub` of `.toc__subrow`s (accent diamond bullet + Source Serif 14px) that open only
  while that section is active (`tableOfContents` animates its `height`); the active sub-row is full
  midnight, the rest dimmed. Active main/sub track scroll off each heading's id (`#s-31`, `#s-31-1`, …).

The old `.toc__label` ("table of contents") and `.toc__skeleton` book-spine bars were **dropped** in
the redesign.

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
