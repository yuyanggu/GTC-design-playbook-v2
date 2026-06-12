# TOC redesign — stacked chapters + mobile bottom bar

Approved 2026-06-11. Applies to the chapter TOC on the 3 standalone chapter pages and the 3
reader panels in `playbook.html`.

## 1 · Desktop stacked TOC (replaces the 4-cell grid + `.toc__chapter-title`)

One vertical list (`.toc__chapters`, now a `<ul>`): every chapter is a text row
(Boldonse number + Boldonse chapter name, no icons); the current chapter's `<li>` nests the
existing `.toc__list` (section rows + accordion sub-rows, unchanged) indented beneath it.

- Non-current chapters: midnight @ ~42% opacity, hover → full midnight, `data-href="/chapter-N"`
  (existing `chapterSwitch()` keeps working — selector `.toc__chapter[data-href]` unchanged).
- Current chapter: `--accent`, inert (`is-current`).
- Chapter 4: "How we work as a team" + a small "soon" tag, dimmed, inert.
- Thin rules between chapter blocks (same `rgba(1,34,51,.14)` as the section rules).

## 2 · Capped height + fades + follow-scroll

- New `.toc__scroll` wrapper inside `.toc`: `max-height ≈ calc(100vh - 160px)` (desktop > 1180px
  only), hidden scrollbar, CSS `mask-image` fading ~48px top + bottom.
- Mask applies only when content overflows (`.is-overflowing`, toggled by JS on init/refresh).
- `tableOfContents()` tweens `.toc__scroll.scrollTop` to keep the active (sub-)row vertically
  centred when the active section changes. Inner scrollTop is safe under the GSAP pin / smoother.
- `stickyToc()` pin unchanged. 769–1180px inline TOC: natural height, no cap, no mask.

## 3 · Mobile bottom bar (≤ 768px)

- The inline `.toc` is hidden ≤ 768px; a fixed `.toc-bar` (outside `#smooth-wrapper` — fixed
  elements can't live under the smoother transform) takes over:
  `◀ [ 3.1 · How we engage ] ▶`, ~56px + safe-area-inset-bottom, midnight bg, chalk text,
  number in the chapter accent.
- Heading list built by JS (`mobileTocBar()` in `chapter.js`) from the `.toc` navs' `[data-toc]`
  rows in DOM order — single source of truth, no duplicated markup. In the reader the entries
  span all chapters (arrows cross boundaries); a "Foreword" entry maps `#ch0`.
- Arrows jump prev/next heading (sections + subsections) via `smoother.scrollTo` (offset 120px),
  native fallback; disabled state at the ends. Label tracks the deepest heading above the
  42%-viewport line (same rule as the desktop TOC + urlSync).
- Tapping the label opens a `.toc-sheet`: slide-up panel (chalk, max-height ~70vh, scrim) showing
  the stacked chapters + sections design, reusing the `.toc__*` row classes; tap row → jump +
  close; Esc/scrim/label closes; `aria-expanded` wired.
- Reduced motion: instant jumps, no slide animation.
- Pages: 3 standalone chapter pages + `playbook.html`. `foreword.html` (unlinked fallback) skipped.

## Files

`css/chapter.css` · `js/chapter.js` · `why-we-exist.html` · `our-point-of-view.html` ·
`stages-of-a-project.html` · `playbook.html` (TOC markup ×6, bar markup ×4) · docs
(`.claude/docs/chapter-pages.md`, `CLAUDE.md`).
