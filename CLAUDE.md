# GTC — The Design Playbook

A polished, awwwards-grade **static multi-page website** for the GovTech Consulting ("GTC") Design
Playbook. Plain HTML/CSS/vanilla JS, no build step, fully offline-capable.

The site has three surfaces: the **landing** (`index.html` — animated cover that scales away on
scroll, cloud parallax into an intro section, and an in-flow bookshelf), the **continuous reader** (`playbook.html` — opens with the
Foreword (`#ch0`), then all five chapters, in one document with a seamless scroll effect; the
canonical experience), and the **standalone pages** (Foreword + the five chapters, kept as a
fallback, no longer linked). A right-side **drawer Menu** opens from any hamburger/Explore button.

**Structure (v0.6 draft, 2026-07):** six parts, **all built** — `00 Foreword` ·
`01 About GovTech Consulting` · `02 Our Point of View` · `03 Our Approach` ·
`04 The Stages of an Engagement` · `05 How We Work`. Reader panels `#ch1/#ch2/#ch3/#ch4/#ch5`
(accents orange/blue/orange/blue/orange) + standalone pages `about-govtech-consulting.html`,
`our-point-of-view.html`, `our-approach.html`, `stages-of-a-project.html`, `how-we-work.html`.
Clean paths `/chapter-1`…`/chapter-5` + `/foreword` (see `js/routes.js`; section slugs `s-11`,
`s-21`…`s-24`, `s-31`…`s-33`, `s-41`…`s-44`, `s-51`…`s-54`). The former `01 Why we exist` chapter
was retired. **Nothing is "coming soon" any more** — the last content update (`Draft_ GTC Design
Playbook (1).docx`, 2026-07) added the Foreword rewrite (welcome intro + "For GTC Designers" / "For
Friends of Design"), the new **01 Who We Are** (short chapter), and the new **05** (5.1 Operating
Principles · 5.2 Rituals & Cadences · 5.3 How We Show Up · 5.4 The Practice in Practice), and renamed
the two discovery subphases to **"Uncover What is True" / "Identify What Works"** in 02/04. **05 uses
placeholder art** (reuses `4_Graphic.svg` / `03 Divider.svg` / `menu_4*.svg`) — bespoke
`5_Graphic.svg`, `05 Divider.svg`, `menu_5.svg` are still wanted. The docx's Sentient/Clash Display
typeface colophon was intentionally omitted (this site uses DM Sans / Boldonse).

## Detailed docs (`.claude/docs/`)

Read the file that matches your task — each is focused and cross-linked.

| Doc | Read it when… |
|---|---|
| [architecture.md](.claude/docs/architecture.md) | You need the full file map, how the 3 page types relate, the CSS load order, or the `main.js`/`chapter.js` function inventory. **Start here for orientation.** |
| [design.md](.claude/docs/design.md) | You need the design spec — Figma file/nodes, colour + theme tokens, the type system, or reference layout coordinates. |
| [motion.md](.claude/docs/motion.md) | You're working on landing motion — the unpinned cover scroll, gradient streaks, the pinwheel, the intro reveal, cloud drift + parallax, or the magnetic button; or need the GSAP-vs-Motion-One / ScrollSmoother philosophy. |
| [chapter-pages.md](.claude/docs/chapter-pages.md) | You're editing a chapter page — layout, hero, TOC, copy blocks, diagrams/dividers, or the left rail. Also how to build a new chapter. |
| [reader.md](.claude/docs/reader.md) | You're working on `playbook.html` — panel transitions, snap, the black/rounded-corner look, TOC coexistence, or deep-linking. |
| [menu.md](.claude/docs/menu.md) | You're working on the drawer Menu or the landing bookshelf. |
| [gotchas.md](.claude/docs/gotchas.md) | **Before** touching motion, pinning, or anything that fights over a transform. Highest-value lessons in the repo. |

## Tech stack

- **Plain HTML / CSS / vanilla JS** (ES modules). No framework, no build step.
- **GSAP + ScrollTrigger + ScrollSmoother** own almost all motion (every surface uses ScrollSmoother
  now — the landing at a heavier `smooth: 1.7`, others at `smooth: 1`). **CustomEase + CustomWiggle**
  vendored + registered but unused.
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

- ✅ **Landing (`index.html`, home-v3)** — unpinned scroll under ScrollSmoother (`smooth: 1.7`
  glide; `overscroll-behavior-y: none`): the **opening load-in animation plays fully before scroll
  is allowed** (`introHold` freezes scroll until `loadTl` completes, so an early wheel/swipe can't
  cut off the pinwheel rise → spin → align → title reveal); then an animated cover (eyebrow + lockup
  + pinwheel + arrow) whose lockup **scales down 1→0.55 as a timed, uninterruptible play-once** on
  first scroll (the
  fixed pinwheel tracks its slot rect, so it shrinks for free); a **fixed top-bar logo**
  (`.home-logo`, body-level so `fixed` holds under ScrollSmoother) that reveals once the page bottom
  is reached and then persists over the content but hides over the hero cover (no duplicate lockup);
  one-direction cloud drift + a scrubbed **container parallax** that settles the
  cloud band along the top of the in-flow **`#intro` section** (Figma `2082-2203`: Boldonse "We
  don't wait for the wind. / We steer the motion." headline — two lines fitted by `fitHeadline()`
  **clamped to 40–54px** (never under 40px; the intro **stacks ≤1200px** and the title **wraps on
  phones** so it can stay ≥40px) — with a once-on-enter **word-by-word masked rise** (a plain fade
  when wrapped), welcome copy + "Sail through →" button → About popup, which pauses
  the smoother while open); the intro row is **width-matched + centred to the shelf** (shared
  `--shelf-w`/`--shelf-pad` vars = `SHELF_W`/`SHELF_PAD` in `main.js`) so the headline's left edge
  aligns with book 1 and the copy's right edge with book 5; in-flow landing shelf inside `#intro`
  (**5 books, all interactive**: 1 About GTC + 2–4 + 5 How We Work; `--shelf-w` 1300px, scales via
  `--shelf-scale`; books rise in once the shelf enters, knock/hover raise + recolour).
  **Mobile (≤768px):** shelf hidden, static `.home-cards` stacked cards replace it; intro section
  stacks (logo → headline → copy); cover lockup stacks vertically (pinwheel above title,
  `padding-inline: 20px`) to prevent overflow; `smoothTouch: 0` so touch scrolls natively, same
  play-once cover scale.
- ✅ **Menu** — right-side drawer (swipe-in, interruptible, rows-fall-away close, hamburger→X) on all
  chapter pages + foreword standalone + about. `Esc` / scrim / X closes. **7 rows, all
  linked**: 00 Foreword → 01 About GTC → 02 → 03 → 04 → 05 How We Work → About (unnumbered coda
  row, hand-written `menu_about*.svg` icons). Standalone menus use file hrefs. `menu_4.svg` is reused
  for row 05. **The reader (`playbook.html`) no longer has the drawer** (hamburger + `#menu`
  removed, 2026-07): its **always-open TOC** — now ending in an **About** row and with the
  collapse/hide control dropped — is the sole navigation.
- ✅ **Foreword** — reader panel `#ch0` (`.chapter-panel--foreword`, chalk, no hero, no TOC) + standalone
  `foreword.html` (fallback only, no longer linked from live nav). Entry: shelf book 0 and mobile
  card link to `/playbook.html` (reader top = ch0). Clean path `/foreword` maps in `routes.js` +
  server rewrites; in-reader menu row uses `data-href="/foreword"` for wireNav smooth-scroll.
- ✅ **Five built chapter pages** (01 About GovTech Consulting, 02 Our Point of View, 03 Our Approach,
  04 The Stages of an Engagement, 05 How We Work) on the shared chapter system — themed hero, pinned
  scroll-synced TOC, full copy from the v0.6 draft + per-chapter section dividers. Content reflowed
  via reusable blocks: `.callout` (full-width icon note cards) and the **`.rulegrid`** (unboxed
  accent-rule columns; 05 uses it for the operating-principles 2×2 and the 8 "X over Y" commitments),
  the **`.ctable`** comparison grids (2/3-col, hairline-row editorial table; 05 also uses a
  header-less `--2` label/value form — `.ctable__cell--label` + a plain value cell with **no
  `data-label`** — for the weekly-check-in and onboarding tables), the native-`<details>`
  **`.accordion`**, the **`.diagram-ph`** dashed placeholder (every "blue" section that still needs a
  drawn diagram), `.pullquote` (01 closes on one), the **`.runin`** lead-in, `.source-note` (05.4).
  **TOC** is a stacked chapter index (01–05, all linkable now), the current one accent + expanded to
  its sections; **≤768px** a fixed bottom `.toc-bar` + slide-up `.toc-sheet` replaces it. See
  [chapter-pages.md](.claude/docs/chapter-pages.md) for the block catalogue.
- ✅ **About page (`about.html`)** — standalone **dark** page (Figma `2052:1275`, bg `#0c1619`,
  menu-only entry, not on the landing shelf; **no left rail**; `body.page-dark` inverts the topbar —
  white wordmark via CSS filter, chalk hamburger that flips back to midnight while the chalk drawer
  is open via `:has(.menu:not([hidden]))`). Layout: **full-viewport hero** (`.about-hero`,
  `min-height:100svh`) — head row (Boldonse "About" hard-left + 639px serif intro hard-right,
  `space-between`, **centred vertically** in the gap between the fixed topbar and the art via
  `flex:1`; stacks ≤768px) sits above the **full-bleed** `assets/about_hero_dark.webp` illustration
  (3420×922, edge-to-edge, flush to the bottom viewport edge, static). Note: `.page-body.about-page`
  zeroes the shared `.page-body` 48/280 padding so the hero is exactly one screen. Below on scroll:
  **pinned horizontal photo gallery** (8 team photos, `assets/photos/about-*.jpg`, same
  height/natural widths, 4px radius; strip scrubs left by its overflow, `pinType:"transform"`;
  reduced-motion → native `overflow-x` swipe) → "Less deck. / More impact." **masked line reveal**
  (each line rises once out of its overflow-hidden wrapper on enter; `manifestoReveal` in
  `js/about.js` — note the `y:0` guard so GSAP doesn't stack the CSS start offset). Intro copy is the
  playbook body size (16px). Own module `js/about.js` (not `chapter.js`); CSS is the
  `.about-*`/`page-dark` block at the end of `chapter.css`; clean path `/about` rewrites in
  `vercel.json` / `_redirects` / `serve.json`.
- ✅ **Continuous reader (`playbook.html`)** — Foreword (`#ch0`) + all five chapters
  (`#ch1/#ch2/#ch3/#ch4/#ch5`) + the **embedded About terminal panel** (`#about`,
  `.chapter-panel--about`, dark — mirrors `about.html`) stacked with the seamless
  chapter-to-chapter scroll effect; per-chapter TOC pins coexist; rail follows the active chapter
  (clipped away over the dark About panel); landing books deep-link in. Scrolling past `#ch5` now
  hands off into About like any chapter boundary; `aboutPanel()` in `js/chapter.js` ports the About
  page's gallery + manifesto motion (about.js is not loaded here) and inverts the topbar logo over
  the dark panel. `urlSync` updates the address bar to `/chapter-1`…`/chapter-5/<section-slug>`,
  `/foreword`, and `/about`. Content is mirrored verbatim between each reader panel and its
  standalone page. **The drawer Menu was removed here (2026-07); the always-open TOC (now including
  an About row, collapse control dropped) is the sole nav.**
- ✅ **Mobile topbar (≤768px, chapter pages + reader)** — topbar drops its stacking context so the
  logo (z 44) sits behind the wide menu drawer while the hamburger/X (z 60) stays on top; a soft
  chalk scrim (`.topbar::before`, z 42) fades scrolling copy out under the logo; `topbarScrim()`
  hides it over coloured heroes. Left **rail hidden** on mobile; `.copy` runs full-width with even
  side padding; foreword drops its `--fw-rail` gutter. Desktop unchanged. See [menu.md](.claude/docs/menu.md).
- All surfaces: responsive + reduced-motion, no console errors.
- ⏭️ **Placeholder art / diagrams still wanted.** Chapter **05** reuses `4_Graphic.svg` (hero),
  `03 Divider.svg`, and `menu_4*.svg` — bespoke `5_Graphic.svg`, `05 Divider.svg`, `menu_5.svg` would
  be nicer. Chapter **01** uses its own `1_Graphic.svg` hero (renders fine at hero size despite the
  noted petal-clipping issue elsewhere), `01 Divider.svg`, `menu_1*.svg`. **Diagrams:** every
  `.diagram-ph` placeholder still needs a drawn SVG (2.3 GTC path, 3.1 engagement arc, 3.3 capability
  arc, 4.0 full arc, 4.2 dual-track + prototype spectrum). Latest docx source:
  `playbook-content/Draft_ GTC Design Playbook (1).docx`.
- ℹ️ Mirrored to a second GitHub repo `yuyanggu/GTC-design-playbook-v2` (`main`) in addition to the
  original `origin` (`yuyanggu/GTC-Design-Playbook`, branch `feat/home-v2`).
