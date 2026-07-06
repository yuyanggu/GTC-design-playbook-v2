# GTC — The Design Playbook

A polished, awwwards-grade **static multi-page website** for the GovTech Consulting ("GTC") Design
Playbook. Plain HTML/CSS/vanilla JS, no build step, fully offline-capable.

The site has three surfaces: the **landing** (`index.html` — animated cover, after-scroll intro
reveal, and an in-flow bookshelf), the **continuous reader** (`playbook.html` — opens with the
Foreword (`#ch0`), then the built chapters, in one document with a seamless scroll effect; the
canonical experience), and the **standalone pages** (Foreword + the built chapters, kept as a
fallback, no longer linked). A right-side **drawer Menu** opens from any hamburger/Explore button.

**Structure (v0.6 draft, 2026-07):** six parts — `00 Foreword` · `01 About GovTech Consulting`
(coming soon) · `02 Our Point of View` · `03 Our Approach` · `04 The Stages of an Engagement` ·
`05 How We Work` (coming soon). Only **02/03/04** have content and get reader panels
(`#ch2/#ch3/#ch4`, accents blue/orange/blue) + standalone pages
(`our-point-of-view.html`, `our-approach.html`, `stages-of-a-project.html`). `01` and `05` are
"coming soon" rows in the menu/shelf/TOC only (no page, matching the old `04 coming soon` pattern).
The former `01 Why we exist` chapter was retired (its content isn't in the new outline).

## Detailed docs (`.claude/docs/`)

Read the file that matches your task — each is focused and cross-linked.

| Doc | Read it when… |
|---|---|
| [architecture.md](.claude/docs/architecture.md) | You need the full file map, how the 3 page types relate, the CSS load order, or the `main.js`/`chapter.js` function inventory. **Start here for orientation.** |
| [design.md](.claude/docs/design.md) | You need the design spec — Figma file/nodes, colour + theme tokens, the type system, or reference layout coordinates. |
| [motion.md](.claude/docs/motion.md) | You're working on landing motion — hero scroll master, gradient streaks, the pinwheel, after-scroll reveal, cloud drift, or the magnetic button; or need the GSAP-vs-Motion-One / ScrollSmoother-opt-out philosophy. |
| [chapter-pages.md](.claude/docs/chapter-pages.md) | You're editing a chapter page — layout, hero, TOC, copy blocks, diagrams/dividers, or the left rail. Also how to build a new chapter. |
| [reader.md](.claude/docs/reader.md) | You're working on `playbook.html` — panel transitions, snap, the black/rounded-corner look, TOC coexistence, or deep-linking. |
| [menu.md](.claude/docs/menu.md) | You're working on the drawer Menu or the landing bookshelf. |
| [gotchas.md](.claude/docs/gotchas.md) | **Before** touching motion, pinning, or anything that fights over a transform. Highest-value lessons in the repo. |

## Tech stack

- **Plain HTML / CSS / vanilla JS** (ES modules). No framework, no build step.
- **GSAP + ScrollTrigger + ScrollSmoother** own almost all motion (the landing opts out of
  ScrollSmoother for native scroll). **CustomEase + CustomWiggle** vendored + registered but unused.
- **motion.dev (Motion One)** — one entrance only (`.titleblock__media`).
- Everything is **vendored locally** (`vendor/`); fonts self-hosted (`assets/fonts/`). Do not switch
  to CDNs. See [architecture.md](.claude/docs/architecture.md) for the full file map.

## Run / preview

```bash
python3 -m http.server 8124    # then open http://localhost:8124/index.html (or /playbook.html, …)
```

There is a `.claude/launch.json` config named `gtc-static` for the preview tooling. Verify
headlessly via **CDP** — see [gotchas.md](.claude/docs/gotchas.md) (headless verification) and the
project memory `headless-motion-verification`.

> **Reader clean URLs need a rewriting host.** The reader is served at clean paths
> (`/chapter-2/designing-for-everyone`) via `vercel.json` / `_redirects` rewriting `/chapter-*` →
> `/playbook.html`. Plain `http.server` doesn't rewrite, so locally open `/playbook.html` directly
> (deep-path reloads only resolve once deployed, or behind a rewrite shim). See
> [reader.md](.claude/docs/reader.md) → "Clean URLs & deep-linking".

## Status / next

- ✅ **Landing (`index.html`)** — animated cover (eyebrow + lockup + rising pinwheel + arrow) and the
  after-scroll intro reveal (Figma `2043:1638`); native delay-free scroll; one-direction cloud drift;
  in-flow landing shelf (**6 books**: 0 Foreword + 1 About GTC (soon) + 2–4 chapters + 5 How We
  Work (soon); **1578px** (`SHELF_W` in `main.js`), scales to fit narrow viewports via
  `--shelf-scale`; books fall in, sway, raise + recolour).
  **Mobile (≤768px):** shelf hidden, static `.home-cards` stacked cards replace it; cover lockup
  stacks vertically (pinwheel above title, `padding-inline: 20px`) to prevent overflow; hero
  plays reveal once then scroll is fully native into the cards.
- ✅ **Menu** — right-side drawer (swipe-in, interruptible, rows-fall-away close, hamburger→X) on all
  chapter pages + reader + foreword standalone. `Esc` / scrim / X closes. **Now 6 rows**:
  00 Foreword → 01 About GTC (soon) → 02 → 03 → 04 → 05 How We Work (soon). Reader menu uses clean
  paths (`/chapter-2…4`); standalone menus use file hrefs. `menu_4.svg` is reused for row 05.
- ✅ **Foreword** — reader panel `#ch0` (`.chapter-panel--foreword`, chalk, no hero, no TOC) + standalone
  `foreword.html` (fallback only, no longer linked from live nav). Entry: shelf book 0 and mobile
  card link to `/playbook.html` (reader top = ch0). Clean path `/foreword` maps in `routes.js` +
  server rewrites; in-reader menu row uses `data-href="/foreword"` for wireNav smooth-scroll.
- ✅ **Three built chapter pages** (02 Our Point of View, 03 Our Approach, 04 The Stages of an
  Engagement) on the shared chapter system — themed hero, pinned scroll-synced TOC, full copy from
  the v0.6 draft + per-chapter section dividers. Content reflowed via reusable blocks: `.callout`
  (full-width icon note cards) and the new **`.rulegrid`** (unboxed accent-rule columns), the
  restyled **`.ctable`** comparison grids (2/3-col, hairline-row editorial table), the restyled
  native-`<details>` **`.accordion`** (accent-ruled list, 28px titles), the new **`.diagram-ph`**
  dashed placeholder (every "blue" section that still needs a drawn diagram), `.pullquote` (block
  italics), the new **`.runin`** lead-in. **TOC** is a stacked chapter
  index (01–05, with 01/05 as `toc__chapter--soon`), the current one accent + expanded to its
  sections; **≤768px** a fixed bottom `.toc-bar` + slide-up `.toc-sheet` replaces it. See
  [chapter-pages.md](.claude/docs/chapter-pages.md) for the block catalogue.
- ✅ **Continuous reader (`playbook.html`)** — Foreword (`#ch0`) + the 3 built chapters
  (`#ch2/#ch3/#ch4`; `#ch1`/`#ch5` intentionally absent = coming soon) stacked with the seamless
  chapter-to-chapter scroll effect; per-chapter TOC pins coexist; rail follows the active chapter;
  menu/landing books deep-link in. Content is mirrored verbatim between each reader panel and its
  standalone page.
- ✅ **Mobile topbar (≤768px, chapter pages + reader)** — topbar drops its stacking context so the
  logo (z 44) sits behind the wide menu drawer while the hamburger/X (z 60) stays on top; a soft
  chalk scrim (`.topbar::before`, z 42) fades scrolling copy out under the logo; `topbarScrim()`
  hides it over coloured heroes. Left **rail hidden** on mobile; `.copy` runs full-width with even
  side padding; foreword drops its `--fw-rail` gutter. Desktop unchanged. See [menu.md](.claude/docs/menu.md).
- All surfaces: responsive + reduced-motion, no console errors.
- ⏭️ **Chapters 01 (About GovTech Consulting) and 05 (How We Work)** not built — the v0.6 draft has
  only placeholders for them; they exist as "coming soon" rows in the menu/shelf/TOC. **Diagrams:**
  every `.diagram-ph` placeholder still needs a drawn SVG (2.3 GTC path, 3.1 engagement arc, 3.3
  capability arc, 4.0 full arc, 4.2 dual-track + prototype spectrum). `1_Graphic.svg` has a known
  petal-clipping issue, so 03/04 reuse `3_Graphic`/`4_Graphic`. Row 05 reuses `menu_4.svg` (a
  dedicated `menu_5.svg` would be nice). Docx source: `playbook-content/Draft_ GTC Design Playbook.docx`.
- ℹ️ Mirrored to a second GitHub repo `yuyanggu/GTC-design-playbook-v2` (`main`) in addition to the
  original `origin` (`yuyanggu/GTC-Design-Playbook`, branch `feat/home-v2`).
