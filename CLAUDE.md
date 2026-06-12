# GTC — The Design Playbook

A polished, awwwards-grade **static multi-page website** for the GovTech Consulting ("GTC") Design
Playbook. Plain HTML/CSS/vanilla JS, no build step, fully offline-capable.

The site has three surfaces: the **landing** (`index.html` — animated cover, after-scroll intro
reveal, and an in-flow bookshelf), the **continuous reader** (`playbook.html` — opens with the
Foreword (`#ch0`), then all three chapters, in one document with a seamless scroll effect; the
canonical experience), and the **standalone pages** (Foreword + ch1–ch3, kept as a fallback, no
longer linked). A right-side **drawer Menu** opens from any hamburger/Explore button.

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
  in-flow landing shelf (**5 books**: 0 Foreword + 1–3 chapters + 4 coming soon; 1300px, scales to
  fit narrow viewports via `--shelf-scale`; books fall in, sway, raise + recolour).
  **Mobile (≤768px):** shelf hidden, static `.home-cards` stacked cards replace it; cover lockup
  stacks vertically (pinwheel above title, `padding-inline: 20px`) to prevent overflow; hero
  plays reveal once then scroll is fully native into the cards.
- ✅ **Menu** — right-side drawer (swipe-in, interruptible, rows-fall-away close, hamburger→X) on all
  chapter pages + reader + foreword standalone. `Esc` / scrim / X closes. **Now 5 rows**:
  00 Foreword (with `menu_0.svg` icon) → 01 → 02 → 03 → 04 coming soon.
- ✅ **Foreword** — reader panel `#ch0` (`.chapter-panel--foreword`, chalk, no hero, no TOC) + standalone
  `foreword.html` (fallback only, no longer linked from live nav). Entry: shelf book 0 and mobile
  card link to `/playbook.html` (reader top = ch0). Clean path `/foreword` maps in `routes.js` +
  server rewrites; in-reader menu row uses `data-href="/foreword"` for wireNav smooth-scroll.
- ✅ **Three chapter pages** on the shared chapter system — themed hero, pinned scroll-synced TOC,
  full copy with drawn C2/C3 diagrams + per-chapter section dividers. **TOC redesigned (2026-06)**
  as a stacked chapter index: all chapters as vertical Boldonse rows, the current one accent +
  expanded with its section list (ch2/ch3 have accordion sub-rows); on desktop the stack is capped
  (~100vh−160px) with top/bottom fade masks and follow-scroll centring the active row. **≤768px the
  TOC is replaced by a fixed bottom section bar** (`.toc-bar`: prev/next arrows step through every
  heading — across chapters in the reader — label opens a slide-up `.toc-sheet` full index), on the
  3 chapter pages + the reader. TOC progress bar previously removed; active-row tracking works.
- ✅ **Continuous reader (`playbook.html`)** — the Foreword + 3 chapters stacked with the seamless
  chapter-to-chapter scroll effect; per-chapter TOC pins coexist; rail follows the active chapter;
  menu/landing books deep-link in.
- ✅ **Mobile topbar (≤768px, chapter pages + reader)** — topbar drops its stacking context so the
  logo (z 44) sits behind the wide menu drawer while the hamburger/X (z 60) stays on top; a soft
  chalk scrim (`.topbar::before`, z 42) fades scrolling copy out under the logo; `topbarScrim()`
  hides it over coloured heroes. Left **rail hidden** on mobile; `.copy` runs full-width with even
  side padding; foreword drops its `--fw-rail` gutter. Desktop unchanged. See [menu.md](.claude/docs/menu.md).
- All surfaces: responsive + reduced-motion, no console errors.
- ⏭️ **Chapter 4** ("How we work as a team") not built yet (drawer row 4 is "coming soon"; a
  `4_Graphic.svg` asset exists but isn't placed). Ch1's diagrams + the C3 "for each stage" note remain
  text `.figure-note`s. `1_Graphic.svg` has a known petal-clipping issue (its internal `clipPath`).
- ℹ️ Mirrored to a second GitHub repo `yuyanggu/GTC-design-playbook-v2` (`main`) in addition to the
  original `origin` (`yuyanggu/GTC-Design-Playbook`, branch `feat/home-v2`).
