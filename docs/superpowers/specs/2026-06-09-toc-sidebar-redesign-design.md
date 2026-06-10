# TOC sidebar redesign

**Date:** 2026-06-09
**Figma:** `DGg9Fqa2owVvSHvOvHBaTA` node `2118-4187` ("Page … sidebar option 1")
**Surfaces:** the reader (`playbook.html`, 3 panels) **and** the 3 standalone chapter pages
(`why-we-exist.html`, `our-point-of-view.html`, `stages-of-a-project.html`) — they share `.toc`
markup + `css/chapter.css` + `js/chapter.js`.

## Goal

Replace the current "book"-styled table of contents with the new Figma UI: a 4-cell chapter
switcher, a chapter title, the progress bar, and restyled section rows / sub-rows. Keep every
existing interaction (pinned TOC, scroll-tracked active row, accordion sub-rows, progress fill).
Drop the "table of contents" label and the decorative book-spine skeleton bars.

## What changes

### 1. Markup — each `.toc` (3 reader panels + 3 standalone pages)

```
.toc
├── .toc__chapters                 NEW — 4-cell chapter switcher (grid of 4)
│   └── .toc__chapter ×4           one per chapter
│       ├── .toc__chapter-num      Boldonse 15px, midnight (stays midnight on the active cell)
│       └── .toc__chapter-icon     two stacked <img>:
│           ├── .toc__chapter-icon-base   assets/menu_N.svg      (dark/mono — inactive cells)
│           └── .toc__chapter-icon-hover  assets/menu_N_hover.svg (colour — active cell only)
│       (the cell for the current chapter carries .is-current)
├── .toc__chapter-title            NEW — Boldonse 24px, --accent. Full titles; ch1 may wrap to 2 lines.
├── .toc__progress > .toc__progress-fill   KEPT, restyled: 11px tall, 10px radius, grey track + --accent fill
├──  (DROP) .toc__label            "table of contents"
├──  (DROP) .toc__skeleton ×N      book-spine bars
└── .toc__list
    └── li                          thin full-width horizontal rule on top (except the first)
        ├── .toc__row  → .toc__num + .toc__rule (vertical segment) + .toc__title
        └── .toc__sub  → .toc__subrow ×N   (only present where the chapter already has sub-rows)
```

Chapter switcher cells carry `data-href="/chapter-N"` + `href="/chapter-N"` and an
`aria-label` ("Chapter N: <title>"). The `.is-current` cell is rendered inert (no jump).

**Per-chapter titles (kept full):** ch1 "Why we exist, and the moment" (wraps to 2 lines),
ch2 "Our point of view", ch3 "Stages of a project".

Row/sub-row **content is unchanged** — same `data-toc` ids, same titles, same accordion sub-rows.
Only the wrapping markup (label/skeleton removal, switcher/title/progress addition) and the
class-driven styling change.

### 2. Styling — `css/chapter.css` `.toc` block

- `.toc__chapters`: 4-column equal grid spanning the TOC column width (~320px → ~80px cells),
  small chalk gap between cells (matches Figma). Each cell ~100px tall, `position:relative`.
  - inactive cell: grey background (`#b8bdb9`), shows `.toc__chapter-icon-base`, hides `-hover`.
  - `.is-current` cell: `--accent` background, shows `.toc__chapter-icon-hover`, hides `-base`;
    number stays midnight; `pointer-events:none` (no-op).
  - num positioned top, icon centred/lower (per Figma).
- `.toc__chapter-title`: Boldonse, 24px, `color: var(--accent)`, natural wrapping (no forced nowrap).
- `.toc__progress`: height 11px, `border-radius:10px`, track `#d9d9d9`; `.toc__progress-fill`
  `background: var(--accent)` (fill width still driven by JS scroll progress).
- `.toc__row.is-active`: **remove the filled accent background + white text**. Active row =
  `--accent`-coloured `.toc__num` + `.toc__title`; inactive = midnight.
- `.toc__title`: DM Sans 700, uppercase, `letter-spacing:-0.32px`, ~16px.
- `.toc__num`: Boldonse ~15px.
- `.toc__rule`: short vertical segment between num and title.
- `.toc__list li`: thin full-width horizontal divider (`border-top`, midnight low-alpha) on every
  li except the first — the Figma `Line 15`s.
- `.toc__subrow`: Source Serif 14px; diamond bullet (small rotated square, always `--accent`);
  `.is-active` subrow midnight 100%; inactive subrows midnight ~40%.
- **Delete** `.toc__label` and all `.toc__skeleton*` rules. Update the responsive blocks
  (`≤` breakpoints near current lines 540/557) so the switcher + title scale within the column.

### 3. Behaviour — `js/chapter.js`

- New `chapterSwitch(root)`, called from `initChapter`. For each `.toc__chapter[data-href]`
  (skipping `.is-current`): on click, `preventDefault`, resolve `data-href` via
  `window.GTCRoutes.pathToId`. If the target id exists in-page (reader) →
  `smoother.scrollTo(target, false, "top top")` (native `scrollIntoView`/`window.scrollTo`
  fallback when the smoother is off / reduced motion). Otherwise (standalone pages, where
  `GTCRoutes` isn't loaded and the chapter anchor is absent) → `window.location.href = href`
  (full load to `/chapter-N`, server-rewritten to the reader). Mirrors the menu's `wireNav`.
- `stickyToc`, `tableOfContents` (active tracking, progress fill, accordion expand-on-active)
  are **unchanged**.

## Out of scope / unchanged

- No change to the reader transition, rail, menu drawer, or chapter body copy.
- No new icon assets — reuse `assets/menu_N.svg` / `assets/menu_N_hover.svg`.
- Reduced-motion: TOC pin/scrub already bail; the switcher uses the native-scroll fallback.

## Verification

- Headless CDP check (per `headless-motion-verification` memory) on `playbook.html`: TOC shows the
  switcher (current chapter highlighted orange + colour icon), 24px title, restyled rows; active
  row tracks scroll; accordion sub-rows open on the active section; clicking another chapter cell
  jumps to that chapter in-page; no console errors. Confirm one standalone page renders the new TOC
  and its switcher full-loads to `/chapter-N`.
