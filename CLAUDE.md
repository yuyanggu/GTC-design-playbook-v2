# GTC — The Design Playbook

A polished, awwwards-grade **static multi-page website** for the GovTech Consulting ("GTC") Design
Playbook. Plain HTML/CSS/vanilla JS, no build step, fully offline-capable.

The site has three surfaces: the **landing** (`index.html` — animated cover that scales away on
scroll, cloud parallax into an intro section, and an in-flow bookshelf), the **continuous reader** (`playbook.html` — opens with the
Foreword (`#ch0`), then all five chapters, in one document with a seamless scroll effect; the
canonical experience), and the **standalone pages** (Foreword + the five chapters, kept as a
fallback, no longer linked). **The drawer Menu + topbar hamburger were removed site-wide
(2026-07)** — navigation is the reader/chapter **TOC** (desktop) and the mobile **`.toc-sheet`**,
both of which end in a "Behind the playbook" row (→ the About page / `#about` panel).

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
the two discovery subphases to **"Uncover What is True" / "Identify What Works"** in 02/04. **05 now
has its own art** — `5_Graphic.webp` and `menu_5{,_hover}.webp` are bespoke and live (they were
placeholders reusing 04's; a bespoke `05 Divider.svg` is still wanted). The docx's Sentient/Clash
Display typeface colophon was intentionally omitted (this site uses DM Sans / Boldonse).

## Detailed docs (`.claude/docs/`)

Read the file that matches your task — each is focused and cross-linked.

| Doc | Read it when… |
|---|---|
| [architecture.md](.claude/docs/architecture.md) | You need the full file map, how the 3 page types relate, the CSS load order, or the `main.js`/`chapter.js` function inventory. **Start here for orientation.** |
| [design.md](.claude/docs/design.md) | You need the design spec — Figma file/nodes, colour + theme tokens, the type system, or reference layout coordinates. |
| [motion.md](.claude/docs/motion.md) | You're working on landing motion — the unpinned cover scroll, gradient streaks, the pinwheel, the intro reveal, cloud drift + parallax, or the magnetic button; or need the GSAP-vs-Motion-One / ScrollSmoother philosophy. |
| [chapter-pages.md](.claude/docs/chapter-pages.md) | You're editing a chapter page — layout, hero, TOC, copy blocks, diagrams/dividers, or the left rail. Also how to build a new chapter. |
| [reader.md](.claude/docs/reader.md) | You're working on `playbook.html` — panel transitions, snap, the black/rounded-corner look, TOC coexistence, or deep-linking. |
| [markup.md](.claude/docs/markup.md) | You need to know **why** a page's markup is shaped the way it is — the canonical-copy mirror map, the `#smooth-wrapper` rule, the FOUC contract, the retired blocks. The pages' inline comments were moved here in the 2026-07 production pass. |
| [menu.md](.claude/docs/menu.md) | You're working on the drawer Menu or the landing bookshelf. |
| [gotchas.md](.claude/docs/gotchas.md) | **Before** touching motion, pinning, or anything that fights over a transform. Highest-value lessons in the repo. |

## Tech stack

- **Plain HTML / CSS / vanilla JS** (ES modules). No framework, no build step.
- **GSAP + ScrollTrigger + ScrollSmoother own ALL motion** (every surface uses ScrollSmoother now —
  the landing at a heavier `smooth: 1.7`, others at `smooth: 1`). **CustomEase** is vendored and
  genuinely used (`hrOut`, the About popup + cross-page fade).
- **Motion One and CustomWiggle were removed 2026-07** (production pass). Motion One's one entrance
  animated `.titleblock__media`, an element that no longer exists, and nothing loaded
  `vendor/motion.esm.js`; CustomWiggle never created a wiggle but blocked render on all 9 pages.
  `vendor/` is now four files: gsap · ScrollTrigger · ScrollSmoother · CustomEase.
- **Art is WebP** (2026-07). The Figma SVG exports wrapped base64 rasters in mask layers, so size
  bore no relation to render size (`menu_2.svg` was a 100×100 icon weighing 380KB). They're
  rasterized at 2× their render box. `1_Graphic.svg` stays SVG — it's true vector.
  **To re-export art, don't ship the raw Figma SVG** — rasterize it (see the production-pass commits
  for the headless-Chrome → `cwebp` recipe) or the landing regains several MB.
- Everything is **vendored locally** (`vendor/`); fonts self-hosted (`assets/fonts/`). Do not switch
  to CDNs. See [architecture.md](.claude/docs/architecture.md) for the full file map.
- **No password gate** (removed 2026-07 for public launch). The 3s FOUC-shield safety timer it used
  to carry now lives inline in each `<head>` — keep it there; without it a failed module load
  strands the page blank-chalk.

## Run / preview

```bash
python3 -m http.server 8124    # then open http://localhost:8124/index.html (or /playbook.html, …)
```

There is a `.claude/launch.json` config named `gtc-static` for the preview tooling. Verify
headlessly via **CDP** — see [gotchas.md](.claude/docs/gotchas.md) (headless verification) and the
project memory `headless-motion-verification`.

> **Reader clean URLs need a rewriting host.** The reader is served at clean paths
> (`/chapter-2/designing-for-everyone`) via `serve.json` / `vercel.json` / `_redirects` rewriting
> `/chapter-*` → `/playbook.html`. Plain `http.server` doesn't rewrite, so locally open
> `/playbook.html` directly (deep-path reloads only resolve once deployed, or behind a rewrite
> shim). To exercise the **real** routing locally, run `npx serve . -l 8125` — that is exactly what
> the deployed image runs. See [reader.md](.claude/docs/reader.md) → "Clean URLs & deep-linking".

## Deploy

Northflank builds the `Dockerfile` on push (`.gitlab-ci.yml` disables pipelines; Git integration
does the work). No `package.json` → the Dockerfile takes its **`static-html`** branch, skips any
build, and the runtime runs **`serve . -l 3000`**.

- **`serve.json` is the live production config**, not a local-dev file — `serve` reads it from the
  directory it serves. It owns the rewrites *and* the cache headers. It must never be
  `.dockerignore`d. (`vercel.json` / `_redirects` are kept in step for other hosts.)
- **`.dockerignore` is load-bearing.** The Dockerfile does `COPY . .`, so anything not ignored is
  published. It keeps out `CLAUDE.md`, `.claude/` (incl. `markup.md`), `docs/`, `playbook-content/`
  (the `.docx` drafts), `.figma_ref/`, and 18MB of superseded Figma diagram exports. **Adding a new
  internal folder means adding it there.**
- `/foreword` serves the **standalone `foreword.html`**, not the reader — the reader's Chapter 0
  panel was retired 2026-07, so `routes.js` has no `ch0` and `/foreword` is not a reader path.

## 🚩 Before launch

- **Open Graph / link previews are NOT wired up.** No page has `og:title` / `og:image` /
  `twitter:card` / `rel=canonical`, so pasting a playbook link into Slack, Teams or LinkedIn renders
  a bare URL instead of a preview card. This matters a lot for a playbook whose whole point is being
  shared around. **Blocked on one thing: the production domain**, because `og:image` and `canonical`
  must be absolute URLs — a relative path leaves the card blank in most scrapers, and a wrong domain
  baked into 9 pages renders broken.
  **The share card already exists**: `assets/og-image.webp` (1200×630, 19KB — pinwheel + Boldonse
  lockup on chalk). Once the domain is known this is a ~5-minute job: add the tags to all 9 pages
  using each page's existing `<title>` + `meta description` (they're all distinct and good).
- **Rotate the GitLab token.** The `gitlab` remote has a `glpat-…` personal access token embedded
  directly in its URL in `.git/config`. It isn't committed and `.dockerignore` excludes `.git`, so
  nothing leaks — but tokens in remote URLs get pasted into terminals and screenshots. Use a
  credential helper.

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
  don't wait for the wind. / We steer the motion." headline — two lines fitted by `fitHeadline()`:
  **40–54px while side-by-side (>1200px)**; once the intro **stacks (≤1200px)** the cap **tracks the
  viewport** (`17px + 3.1vw`, ≈54px @1200 → ~29px @390, floor 26px) so the full-width title scales
  DOWN as the screen narrows; below ~466px it **wraps** at the tracked size with
  `text-wrap: balance` (even rows, no widow) — with a once-on-enter **word-by-word masked rise** (a
  plain fade when wrapped), welcome copy + "Learn what this playbook is for." inline link →
  **About popup**
  (`aboutModal()`: a humanistreview.ai-style counter-translate wipe — mask/panel move ±100% so the
  card holds still while the clip unrolls up; `hrOut` CustomEase; masked-line text + image clip/scale
  reveals; pauses the smoother while open; reduced motion intentionally ignored. Layout is desktop
  two-column [fluid illus column, aspect-locked touching images that fill to a no-scroll fit] →
  ≤1024px stacked **interleaved per-section** [Figma `2171-3347`: image→heading→paragraph, 16px pad,
  capped/centred] — see [motion.md](.claude/docs/motion.md)); the intro row is **width-matched +
  centred to the shelf** (shared
  `--shelf-w`/`--shelf-pad` vars = `SHELF_W`/`SHELF_PAD` in `main.js`) so the headline's left edge
  aligns with book 1 and the copy's right edge with book 5; in-flow landing shelf inside `#intro`
  (**5 books, all interactive**: 1 About GTC + 2–4 + 5 How We Work; `--shelf-w` 1300px, scales via
  `--shelf-scale`; books rise in once the shelf enters, knock/hover raise + recolour).
  **Mobile (≤800px — was 768, widened 2026-07 so the shrinking shelf never drops under ~0.55×):**
  shelf hidden, static `.home-cards` stacked cards replace it; intro section
  stacks (logo → headline → copy); cover lockup stacks vertically (pinwheel above title,
  `padding-inline: 20px`) to prevent overflow; `smoothTouch: 0` so touch scrolls natively, same
  play-once cover scale. (Chapter pages/reader keep their own 768px mobile breakpoint.)
- ✅ **Navigation (drawer Menu removed site-wide, 2026-07)** — the right-side drawer + topbar
  hamburger were deleted from every page (markup, `.menu` CSS in `styles.css`, `menuScene()` in
  `main.js`). Navigation is now: the **TOC** (desktop, all chapter pages + the reader — a stacked
  chapter index ending in a **"Behind the playbook"** row → `/about`), and the mobile **`.toc-sheet`**
  (built from the TOC, so it inherits that row). `about.html` (a coda, no TOC) keeps a **"The
  Playbook →"** link in its topbar (`.topbar__enter`) back to the reader. The `menu_*.svg` icon
  assets are now unused. The desktop TOC's collapse/hide control survives only ≥1181 (see
  [chapter-pages.md](.claude/docs/chapter-pages.md)).
- ✅ **Cross-page navigation fade (2026-07, `js/transition.js` on all 9 pages)** — the
  humanistreview.ai sequential fade around every internal navigation (desktop + mobile): 1.0s
  `hrOut` body fade-out (scroll locked; html carries the backdrop, and it cross-fades to `#0c1619`
  to/from the dark About page so the swap is seamless) → real page load → 1.3s CSS body fade-in
  (`gtc-page-in`, fill `backwards` — NOT `both`, see [gotchas.md](.claude/docs/gotchas.md)) with
  the hero/`.reveal` entrances overlapping its tail. Anchors are intercepted site-wide; shelf
  books / `chapterSwitch` / `.toc-sheet` rows go through `window.GTCNav.to()`; reader deep-link
  arrivals fade via `revealDeepLink` (slowed to the same 1.3s/`hrOut`); hover prefetches the
  destination; `pageshow` replays the fade on bfcache back/forward. Reduced motion + the gate
  navigate instantly. See [motion.md](.claude/docs/motion.md) → "Cross-page navigation fade".
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
  its sections; fluid var-driven width 1025–1440 (guaranteed ≥56px gutter to the copy, type scales
  down with the column); **≤1024px** a fixed bottom 64px `.toc-bar` + the `.toc-sheet` (a **solid
  white surface that unrolls up out of the bar** — the landing About popup's counter-translate wipe
  ported over, chapter rows rising out of their own clips; no scrim, X close, only the current
  chapter expanded. Replaced the gradient-blur frost veil 2026-07) replaces it. The
  **rail retires ≤1180** (TOC aligns to the logo inset; collapse feature gated to ≥1181). See
  [chapter-pages.md](.claude/docs/chapter-pages.md) for the block catalogue.
- ✅ **About page (`about.html`)** — standalone **dark** page (Figma `2052:1275`, bg `#0c1619`,
  reached via the TOC/veil "Behind the playbook" row → `/about`, not on the landing shelf; **no left
  rail**; `body.page-dark` inverts the topbar — white wordmark via CSS filter). Its topbar carries a
  chalk **"The Playbook →"** link (`.topbar__enter`) back to the reader (its only nav — it's a coda).
  Layout: **full-viewport hero** (`.about-hero`,
  `min-height:100svh`) — head row (Boldonse "About" hard-left + 639px serif intro hard-right,
  `space-between`, **centred vertically** in the gap between the fixed topbar and the art via
  `flex:1`; stacks ≤768px) sits above the **full-bleed** `assets/about_hero_dark.webp` illustration
  (3420×922, edge-to-edge, flush to the bottom viewport edge, static). Note: `.page-body.about-page`
  zeroes the shared `.page-body` 48/280 padding so the hero is exactly one screen. Below on scroll:
  **pinned horizontal photo gallery** (8 team photos, `assets/photos/about-*.jpg`, same
  height/natural widths, 4px radius; strip scrubs left by its overflow, `pinType:"transform"`;
  reduced-motion → native `overflow-x` swipe) → **"Behind the Playbook" credits** (`.about-crew`,
  2026-07, replaced the "Less deck. / More impact." manifesto): a right-aligned editorial column
  (max 1040px, `margin-left:auto`) — intro sentence + hairline-ruled crew rows (portrait 128px |
  name/serif-italic epithet/small-caps role | serif bio), 5 rows (Quinny & Mark share one with
  stacked portraits, `--pair`), then Special Thanks + an adapted type colophon. Crew portraits are
  `assets/photos/crew-*.jpg` (400px B&W squares). Rows animate via the shared `.reveal` batch — no
  bespoke JS. Intro copy is the
  playbook body size (16px). Own module `js/about.js` (not `chapter.js`); CSS is the
  `.about-*`/`page-dark` block at the end of `chapter.css`; clean path `/about` rewrites in
  `vercel.json` / `_redirects` / `serve.json`.
- ✅ **Continuous reader (`playbook.html`)** — Foreword (`#ch0`) + all five chapters
  (`#ch1/#ch2/#ch3/#ch4/#ch5`) + the **embedded About terminal panel** (`#about`,
  `.chapter-panel--about`, dark — mirrors `about.html`) stacked with the seamless
  chapter-to-chapter scroll effect; per-chapter TOC pins coexist; rail follows the active chapter
  (clipped away over the dark About panel); landing books deep-link in. Scrolling past `#ch5` now
  hands off into About like any chapter boundary; `aboutPanel()` in `js/chapter.js` ports the About
  page's gallery motion (about.js is not loaded here; the credits ride the `.reveal` batch) and inverts the topbar logo over
  the dark panel. `urlSync` updates the address bar to `/chapter-1`…`/chapter-5/<section-slug>`,
  `/foreword`, and `/about`. Content is mirrored verbatim between each reader panel and its
  standalone page. **No drawer Menu (removed site-wide 2026-07); the always-open TOC (ending in a
  "Behind the playbook" row) + the mobile `.toc-sheet` are the sole nav.**
- ✅ **Mobile topbar (≤768px, chapter pages + reader)** — topbar drops its stacking context so the
  fixed logo (z 44) sits above the soft chalk scrim (the hamburger is gone); a soft
  chalk scrim (`.topbar::before`, z 42) fades scrolling copy out under the logo; `topbarScrim()`
  hides it over coloured heroes. The scrim is **two clipped ramps, not one** (2026-07): during a
  panel hand-off the top band is split by the rising panel's edge, so no single colour is right for
  both sides of it (a chalk scrim washed over the dark About panel as it rose). `::before` carries
  the chalk ramp clipped ABOVE `--scrim-split`, `::after` the dark ramp clipped BELOW it; both share
  the same viewport-anchored ramp so alpha stays continuous and only the colour changes at the seam.
  `--scrim-split` = the About panel's top edge clamped into the band (`aboutPanel()` in `chapter.js`;
  `body.page-dark` pins it to `0` for standalone `about.html`); unset → full height → all chalk, so
  chapter pages are unchanged. The logo's chalk invert (`html.reader-dark`) tracks the **logo's own
  box**, not a fixed 64px line — the scrim no longer pre-paints dark across the whole band, so an
  early flip would put a white logo on chalk. Left **rail hidden** on mobile; `.copy` runs full-width with even
  side padding; foreword drops its `--fw-rail` gutter. Desktop unchanged. See [menu.md](.claude/docs/menu.md).
- All surfaces: responsive + reduced-motion, no console errors.
- ✅ **Production pass (2026-07)** — password gate removed; all 153 inline HTML comments moved to
  [markup.md](.claude/docs/markup.md) (each page keeps one byline comment); art converted to WebP
  (**landing 6.3MB → 552KB**, its heaviest asset now a font); dead code from the menu removal and the
  "coming soon" era deleted; `.dockerignore` added so internal material stops being published;
  `/foreword` routing fixed. See the **🚩 Before launch** section above — **Open Graph is still
  outstanding and needs the production domain.**
- ⏭️ **Diagrams still wanted.** Every `.diagram-ph` placeholder still needs a drawn diagram (2.3 GTC
  path, 3.1 engagement arc, 3.3 capability arc, 4.0 full arc, 4.2 dual-track + prototype spectrum).
  The superseded Figma exports (`assets/0? Diagram *.svg`) are kept in the repo as source but are
  `.dockerignore`d — they're 18MB of base64-in-SVG and must not ship. A bespoke `05 Divider.svg` is
  also still wanted (05 reuses `03 Divider.svg`). Latest docx source:
  `playbook-content/Draft_ GTC Design Playbook (1).docx` — note a newer `(2).docx` sits beside it,
  unreviewed.
- ℹ️ Mirrored to a second GitHub repo `yuyanggu/GTC-design-playbook-v2` (`main`) in addition to the
  original `origin` (`yuyanggu/GTC-Design-Playbook`, branch `feat/home-v2`).
