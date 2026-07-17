# Markup notes — what the HTML used to say

The nine HTML pages carried 153 inline comments (~17 KB) explaining *why* the markup is
shaped the way it is. They were stripped in the 2026-07 production pass — comments are
visible to anyone who opens inspect element, and this is a public site. The rationale
lives here instead.

Every page now carries exactly one comment, immediately after `<!DOCTYPE html>`:

```html
<!-- The GTC Design Playbook — built by the GovTech Consulting Design Team. -->
```

**Keep this file current.** It is the only record of several constraints that are invisible
in the markup itself — most importantly the [canonical-copy map](#canonical-copy--the-mirror-map).
Related: [architecture.md](architecture.md) (file map, load order) · [motion.md](motion.md)
(landing choreography) · [chapter-pages.md](chapter-pages.md) (block catalogue) ·
[reader.md](reader.md) (panels, deep-linking) · [gotchas.md](gotchas.md) (motion traps).

---

## Canonical copy — the mirror map

**This is the highest-value thing on this page.** Chapter prose exists in *two* places and
must be edited in both. The markup used to say so at each site; nothing else records the
pairing. `chapter-pages.md` states the rule but never enumerates the pairs.

| Reader panel (`playbook.html`) | Standalone page | Accent |
|---|---|---|
| `#ch1` | `about-govtech-consulting.html` | orange |
| `#ch2` | `our-point-of-view.html` | blue |
| `#ch3` | `our-approach.html` | orange |
| `#ch4` | `stages-of-a-project.html` | blue |
| `#ch5` | `how-we-work.html` | orange |
| `#about` | `about.html` | dark |

The reader is the canonical experience; the standalone pages are a fallback and are no
longer linked from live navigation. **Copy is mirrored verbatim** — the original comments
read `══ CANONICAL COPY: mirrors <file> ══`, sitting directly above each `.copy` block.

Chapter 4's banner was phrased differently (`mirrored across playbook.html #ch4 and
stages-of-a-project.html`) but means the same thing. The About credits are likewise
"mirrored verbatim in playbook.html #about".

## Section-number anchors

Each copy block was preceded by a bare marker — `<!-- 1.1 -->`, `<!-- 2.3 -->`, `<!-- 5.4 -->` —
mapping it to its TOC row. The section slugs (`s-11`, `s-21`…`s-24`, `s-31`…`s-33`,
`s-41`…`s-44`, `s-51`…`s-54`) live in `js/routes.js`, which is now the single source of
truth. Sections present: 1.1 · 2.1–2.4 · 3.1–3.3 · 4.1–4.4 · 5.1–5.4.

## The FOUC shield (`html.js-pending`)

Set in the markup on `<html>`, and backed by an inline `<style id="fouc-shield">` in every
`<head>`. While it's set, every above-the-fold element the page animates in is hidden
(`opacity:0; visibility:hidden`). It's painted at parse time — before `css/styles.css` even
loads — so the first frame is plain chalk rather than a flash of unstyled, unpositioned
content.

- **Lifted by** `main.js` (landing) / `chapter.js` (reader + chapter pages) once GSAP has run
  its initial `gsap.set()`s.
- **Safety net:** an inline 3-second `setTimeout` in each `<head>` drops the class no matter
  what. Without it, a network error or JS exception would leave the page blank-chalk
  forever. *This used to live in `js/gate.js`; it moved inline when the password gate was
  removed (2026-07) — a separate file was a request the guarantee didn't need.*
- **`<noscript>`** carries a counter-style that un-hides everything for JS-disabled visitors.
- The reader's shield additionally holds the page blank until `chapter.js` has positioned
  deep-links, so you never see `#ch0`/`#ch1` jump into place.

See `css/styles.css` §FOUC shield.

## Fixed elements must live outside `#smooth-wrapper`

The single most-repeated constraint in the old markup — it appeared verbatim on four pages.
Under ScrollSmoother, `#smooth-content` carries a transform, and **a transformed ancestor
makes `position: fixed` resolve against that ancestor instead of the viewport**. Anything
that must stay viewport-anchored therefore lives as a sibling of `#smooth-wrapper`, at body
level:

- the landing's **pinwheel traveler** and **`.home-logo`** top-bar brand mark
- the **left rail** (`.rail`) on chapter pages and the reader
- the **mobile section bar** (`.toc-bar`, ≤768px)
- the landing's **About popup** — also so `<main>` can be made `inert` while it's open

See [gotchas.md](gotchas.md) for the general rule.

## Landing (`index.html`)

- **Clouds** are `Rectangle_*.svg` gradient blocks, blurred and gently drifting. They are a
  direct child of `.hero` — **not** `.hero__stage` — so the scroll parallax can carry them
  past the stage's `overflow` clip and into the top of the intro section.
- **The lockup** is a centred pinwheel slot (the fixed traveler aligns to it) plus the title.
- **`#intro`** (Figma `2082-2203`) is an in-flow full-viewport section; the hero's clouds
  parallax down to settle along its top edge. Headline words rise out of masked lines once
  on enter (`introScene`).
- **The intro CTA sits *inside* the paragraph** (2026-07) — an inline underlined run closing
  the copy, replacing the "Sail through" chip button that used to sit below it. It rides the
  paragraph's own fade-up in `introScene`; there is deliberately no separate tween for it.
- **The shelf**: books rise in when it scrolls into view and settle flush to the bottom.
  Decorative gray book-spine vectors sit one cluster per gap region, plus a trailing spine
  right of book 5, kept within the 1300px shelf math.
- **`.home-cards`** replace the shelf ≤800px: static, tap-to-navigate, no hover/physics, each
  with a CSS spine ledge below it. Hidden on desktop.
- **`.home-logo`** is hidden until the user reaches the bottom of the page, then fades in and
  stays pinned (`logoBar()` in `main.js`).

### The About popup (Figma `2038:8068`)

Opened by the landing intro CTA (`[data-about-open]`). The entrance is a
humanistreview.ai-style **counter-translate wipe** (`aboutModal()` in `main.js`): the outer
`.about-modal__mask` (`overflow:hidden`) and the inner `.about-modal__panel` move by
**equal-and-opposite `translateY`**, so the card content holds still while the clip window
unrolls upward from the bottom. Text lines and images then rise out of their own masks.

Two structural constraints that look like mistakes but aren't:

- **The ✕ is a sibling of the mask, not a child of the panel** — inside the translating panel
  its `position: fixed` would ride the translate and drift.
- **The whole popup sits outside `#smooth-wrapper`** so `<main>` can be made inert.

It holds the retired Foreword's two sections. See [motion.md](motion.md) for the full
choreography.

## Reader (`playbook.html`)

- **`<base href="/">` is load-bearing.** Clean reader paths are two segments deep
  (`/chapter-2/designing-for-everyone`) and are server-rewritten to this file. Without the
  base tag every relative asset would resolve against that path instead of the site root.
  See [reader.md](reader.md) → "Clean URLs & deep-linking".
- **One rail for the whole reader** — its label and colour follow the chapter you're in
  (`railSync` in `chapter.js`), and it's clipped away over the dark About panel.
- **The About panel (`#about`) is the reader's terminal panel.** Scrolling past `#ch5` hands
  off into it like any chapter boundary; being last, it never scales out
  (`panelTransitions`). Its gallery and topbar-invert motion are driven by `aboutPanel()` in
  `chapter.js` — **`about.js` is not loaded here**, because the reader owns a single
  ScrollSmoother.
- `<!-- /.chapter-panel__scale -->` close-markers used to mark the end of each panel's scale
  wrapper; the nesting is deep enough that this genuinely helped. They're gone — fold the
  editor instead.

## About (`about.html`)

- **Hero** (Figma `2052:1275`): full viewport — topbar at top, head row (title left / intro
  right, `space-between`) centred in the gap, illustration full-bleed along the bottom edge.
- **Pinned horizontal gallery**: the strip translates left as you scroll (`galleryScroll` in
  `about.js`; `aboutPanel()` in the reader). Same-height images, natural widths. Under
  reduced motion the section unpins and swipes natively via CSS.
- **"Behind the Playbook" credits** (docx "Behind the Playbook", 2026-07): a right-aligned
  editorial column — intro sentence plus hairline credit rows. Rows fade up via the shared
  `.reveal` batch; no bespoke JS.
- The topbar carries a link back into the reader. About is a **coda**, so a way back in is
  its only navigation.

## Foreword (`foreword.html`)

The title and banner are direct children of the full-width `.page-body` so they position
against the **viewport rail**, not the centred 1440 canvas. Only the copy stays inside the
canvas.

## Chapter pages

- **Left rail (fixed)** — a rotated chapter label, revealed below the coloured hero. The
  vertical divider runs the full height.
- **Hero graphic** is top-right and **static — no animation**.
- **Mobile section bar (≤768px)** — pinned to the viewport bottom; the arrows step
  heading-to-heading and the label opens the TOC sheet. Driven by `mobileTocBar()` in
  `chapter.js`.

---

## Retired markup (removed 2026-07)

Three blocks were kept commented-out in the source "for revert". They were deleted in the
production pass — commented-out code is exactly what git is for. Recover them from history
before commit `032f958` if ever needed.

### Chapter 0 — the Foreword (`playbook.html`)

The reader now opens at Chapter 1. The Foreword's lead moved to the **landing welcome copy**
and its two sections ("For GTC Designers" / "For Friends of Design") moved to the **About
popup** (`index.html` `#aboutModal`) — so the prose is still live, just relocated. The
standalone `foreword.html` and the `/foreword` route still exist as a fallback.

> Quirk worth knowing: that block's own inner comments had been flattened into plain prose,
> because HTML comments cannot nest — the whole section had to sit inside one comment. If you
> ever re-comment a block like this, the first inner `-->` will end it early.

### Book 0 and the Foreword mobile card (`index.html`)

The Foreword's shelf book and its mobile card. **To revive**: re-add the book, shift each
following book's `--book-x` offset by **+278px**, and restore `SHELF_W` in `main.js`. This
made `assets/menu_0.svg` and `menu_0_hover.svg` unreferenced (2.2 MB each) — they were
deleted in the same pass.

### The drawer Menu (removed site-wide, 2026-07)

The right-side drawer and topbar hamburger are gone from every page — markup, the `.menu`
block in `styles.css`, and `menuScene()` in `main.js`. Navigation is now the **TOC**
(desktop) and the mobile **`.toc-sheet`**, both ending in a "Behind the playbook" row.
`main.js` keeps a tombstone at the old call site. See [menu.md](menu.md) for the history.
