# GTC — The Design Playbook

A polished, awwwards-grade **static multi-page website** for the GovTech Consulting ("GTC")
Design Playbook. The **cover (`index.html`) is built**: the above-the-fold cover, the pinned scroll
transition where a colour gradient bleeds down from the `PLAYBOOK` lettering, a dedicated
pinned beat where the **pinwheel rises in and aligns to the text**, and the intro
"What this is" section. The intro ends in an **Explore** button (magnetic) that opens the **Menu**.
The Menu is now a **right‑side drawer overlay** (a floating chalk card of chapter rows that swipes in
and whose rows fall away on close) — it replaced the old full‑screen bookshelf. Its rows link to the
**interior chapter pages** — three are built (`why-we-exist.html`, `our-point-of-view.html`,
`stages-of-a-project.html`); they all share a reusable page system (`css/chapter.css` +
`js/chapter.js`). See "The Menu (drawer overlay)" and "The chapter pages" below. (The old bookshelf
`.book` system is **kept** — `index.html`'s in‑flow landing shelf still uses it.)

## Tech stack
- **Plain HTML / CSS / vanilla JS** (ES modules). No framework, no build step.
- **GSAP + ScrollTrigger + ScrollSmoother** — own almost all motion: page smooth-scroll
  (`#smooth-wrapper > #smooth-content`, subtle `smooth:1`) **on chapter pages + the reader only —
  the LANDING page (`index.html`, detected by `#hero`) opts OUT of ScrollSmoother for native, 1:1,
  delay‑free scroll** (its hero/pinwheel pins fall back to native pinning); the pinned/scrubbed scroll
  scenes, the scroll fades, the pinwheel rise/align/**scroll‑up to the after‑scroll header slot**, the
  continuous "wind" spin, the **landing after‑scroll reveal** (header line‑clip wipe + body fade‑up +
  top‑left logo), the Menu drawer (swipe‑in / interruptible / rows‑fall‑away close + hamburger→X morph),
  the index landing shelf (books fall in / knock / raise), the **one‑direction cloud drift**, and the
  Explore button's magnetic pull. **CustomEase + CustomWiggle**
  (now-free GSAP plugins) are vendored + registered but **currently unused** (the idle `wiggle()`
  was removed — the button is static at rest); kept for a possible hover wiggle.
- **motion.dev (Motion One)** — used for **one** entrance only (`.titleblock__media` load-in).
  Everything else is GSAP (see the "two libraries over one property" gotcha).
- Everything is **vendored locally** (`vendor/`) and **fonts are self-hosted** (`assets/fonts/`) → fully offline-capable. Do not switch to CDNs.

## Run / preview
```bash
python3 -m http.server 8124    # then open http://localhost:8124/index.html (or /why-we-exist.html, …)
```
There is a `.claude/launch.json` config named `gtc-static` for the preview tooling.
Verify headlessly via **CDP** (Node 24 has global `fetch`+`WebSocket`) — see the project memory
`headless-motion-verification`; **always `Network.setCacheDisabled(true)` before navigate** or you'll
debug a stale cached `chapter.js`/`chapter.css`.

## File map
- `index.html` — ONE `<section>` `#hero` (no `#intro`/`#introGraphic` anymore — home‑v2). It holds:
  the `.clouds`, the cover `.eyebrow--top` + centred `.lockup-row` (`#pinwheelSlot` + `<h1 class="lockup">`
  text) + `#arrow`; the **after‑scroll reveal** block `.home-logo` (top‑left `playbook_logo.svg`) +
  `.intro-reveal` (`#pinwheelSlotScrolled` + `<h2 class="intro__head">` two clip‑wrapped `.line>span`s +
  `.intro__body` two `<p>`s); and the in‑flow **landing shelf** (`#homeShelf` / `.home-shelf` →
  `.shelf__spines` + four `.book` cards). The pinwheel is **not** in the markup — JS injects a fixed
  traveler that rises on load + aligns to `#pinwheelSlot`, then on scroll glides UP to
  `#pinwheelSlotScrolled` (see "after‑scroll intro reveal"). **`index.html` has NO `#menu` overlay**
  and **NO topbar/rail**. Books navigate via `data-href` to `playbook.html#chN` (1→#ch1, 2→#ch2, 3→#ch3;
  book 4 `.book--soon` "coming soon"). This is the **only** place the bookshelf `.book` system is used.
- **Interior chapter pages** (`why-we-exist.html`, `our-point-of-view.html`, `stages-of-a-project.html`)
  — one shared skeleton: a fixed `.topbar` (logo → home, hamburger `data-menu-open` → Menu) + fixed
  `.rail` (outside `#smooth-wrapper`) + `#smooth-wrapper > main.page` (`.page-hero` cover + `.page-body`
  with `.toc` and `.copy`) + the duplicated **`#menu` drawer** + the vendor scripts and
  **`js/chapter.js`**. Per‑chapter differences are only: the `<body>` theme vars, rail label, hero
  title `<span>`s, hero `<img>` src, TOC rows, and copy. Copy is transcribed from
  `playbook-content/playbook-outline__5_.html` (the source content file — reference, not served).
  The `#menu` drawer block is **duplicated verbatim** into every page that has one (the 3 chapter
  pages + `playbook.html`); per‑page the only difference is each row's `data-href` (standalone →
  sibling `.html`; reader → in‑page `#chN`). Opened by **any `[data-menu-open]`** (topbar hamburger).
- **`playbook.html`** — the **continuous reader**: the canonical chapter experience. All three
  chapters live in ONE document (each wrapped in `.section.chapter-panel > .chapter-panel__scale`,
  ids `#ch1/#ch2/#ch3`, theme vars + `data-rail`/`data-rail-fg` on the panel) so scrolling flows
  seamlessly chapter→chapter. **Every menu now points here** (`index.html` landing shelf →
  `playbook.html#chN` full nav; the reader's own `#menu` drawer rows → in‑page `#chN`). The standalone
  chapter pages are kept as a fallback but are no longer linked. See "The continuous reader" below.
- `css/playbook.css` — reader‑only layer (loaded after `chapter.css`): `.chapter-panel` (**black**
  backdrop — only seen during the transition) + `.chapter-panel__scale` (the scaled/faded layer;
  `border-radius:16px 16px 0 0` + `overflow:hidden` for the rounded top corners; `transform-origin:50%
  calc(100% − 10vh)` near the bottom so the shrinking card stays anchored where the next chapter meets
  it and the scale reveals black down the sides).
- `css/chapter.css` — **shared** stylesheet for all chapter pages (loaded after `styles.css`): the
  topbar, rail, hero (graphic sized `min(700px,70vw)`; title hugs the bottom‑left), the pinned
  scroll‑synced TOC (+ accordion sub‑rows), the copy type system (`.copy__heading` / `.section-head` /
  `.subsection-head` / `.copy p` / lists / `.figure-note` / `.figure` (drawn diagrams) /
  `.section-divider` / `.source-note` / `.pullquote`). Themed per chapter via CSS vars (see "The
  chapter pages").
- `css/styles.css` — tokens (`:root`), `@font-face`, the type system, layout, `.pinwheel`
  traveler styles, the **after‑scroll reveal** (`.home-logo` top‑left mark; `.intro-reveal` — the
  centred pinwheel‑slot + header + body column, positioned in the band `[top:0 → bottom:340px]`
  i.e. above the 340px shelf, `justify-content:center` so the empty space above == below; `vh`‑aware
  `clamp`s on `.pinwheel-slot--scrolled` / `.intro__head` / `.intro__body` so it scales with viewport
  height; `.intro__head .line{overflow:hidden;padding-block:.2em}` clip box for the line‑wipe), the
  magnetic button component, the **Menu drawer** (`.menu__scrim` / `.menu__drawer` card + `.menu__row`
  chapter rows), the **bookshelf `.book`/shelf/spine system** (**fixed px** per Figma — 188px books,
  90px gaps — now used only by `index.html`'s landing shelf), and motion base states (FOUC‑hide of the
  reveal under `.js`, shown statically under reduced motion).
- `js/main.js` — booted at the bottom (`smoothScroll()` first). NB the home‑v2 refactor renamed the
  hero scenes; the live functions are:
  - `smoothScroll()` — creates the GSAP **ScrollSmoother** on `#smooth-wrapper`/`#smooth-content`
    (`smooth:1`, `smoothTouch:0`); skipped under reduced motion **and on the LANDING page** (`#hero`
    present) so `index.html` scrolls natively (1:1, no catch‑up lag); chapter/reader pages keep it. The
    **menu does not touch the smoother** — while open it hard-locks page scroll via `documentElement`
    overflow instead (see gotcha).
  - `arrowBob()` — infinite GSAP `y` bob on the arrow (independent of its opacity).
  - `cloudDrift()` — **one‑direction** sky drift: every `.cloud` flows LEFT→RIGHT at its own (widely
    staggered, index‑spread) speed, wrapping seamlessly via a `gsap.utils.wrap` modifier; opacity is
    position‑driven so each **fades out as it exits right / fades in entering left** (× a staggered
    `--enter` load‑in factor raised by `loadTl`, so the two opacity owners never fight); seeded at
    spread, desynced start positions; gentle scale "breathe". Rebuilt on resize. No‑op under reduced motion.
  - `heroScene()` — the `index.html` hero scroll master on `#hero`/`#lockupRow`. ONE paused, reversible
    timeline played on first scroll‑down / reversed on scroll‑up: cover (`#arrow` / `.eyebrow--top` /
    `.lockup`) fades out, the pinwheel glides UP (`pinwheelProx.scrolled`) to the header slot, the
    top‑left `.home-logo` fades in, the **body** copy fades up, and the landing books/spines rise. The
    **header line‑clip wipe lives on its OWN `titleTl`** (decoupled) so its EXIT runs faster
    (`timeScale 2.2`) than its 0.8s entrance while everything else reverses at normal speed. Hero‑only
    (early‑returns on chapter pages); under reduced motion the after‑scroll state is shown statically.
  - `pinwheelScene()` — builds the fixed pinwheel traveler; `place()` (per‑frame) blends its position +
    size through `prox.{rise,align,scrolled}`: rise (below‑fold→centre) → align (centre→`#pinwheelSlot`
    lockup, both timed by `loadTl`) → **scrolled** (lockup slot → `#pinwheelSlotScrolled`, ~120px,
    driven on scroll by `heroScene` via the shared module `pinwheelProx`). Plus the continuous "wind" spin.
  - `homeBooks()` — parks `#homeShelf`'s books/spines (`hbBooks`/`hbSpines`, read by `heroScene`) and
    calls `wireBookKnockAndHover()` (cursor‑knock + hover‑raise/recolour). **The hover raise uses
    `yPercent` (NOT `y`)** so it can't overwrite the scroll master's `y` tween — books always fall away
    on scroll‑up even if the cursor grazes a book mid‑transition (separate transform channels).
  - `menuScene()` — open/close the **`#menu` drawer** (`hidden` + `<main>` `inert` + body/`root`
    scroll lock). Toggles on **any `[data-menu-open]`** (the Explore CTA *and* a chapter page's topbar
    hamburger). Built on **one interruptible GSAP timeline** (enter → `addPause()` → exit), ported
    from the GSAP "interruptible single timeline" demo: ENTER fades the scrim + slides the drawer in
    from the right (`back.out`) + staggers the rows in + morphs the topbar hamburger to an **X**;
    closing **mid‑enter reverses** (quick `timeScale(1.4)`), closing **when fully open plays forward**
    into a distinct EXIT where the chapter **rows fall away** (random rotation, staggered from the
    last) while the card bg (`--card-bg-o`) + scrim fade and the X morphs back. A row's **`data-href`
    navigates** on click — in‑page `#chN` does `smoother.scrollTo` before the close, any other href is
    a full load (wired before the reduced‑motion bail so links always work). `Esc` / scrim‑click
    (`[data-menu-close]`) close. **The index‑only scenes (`heroScene`/`pinwheelScene`/`homeBooks`/
    `cloudDrift`/`arrowBob`) early‑return when their elements are absent**, so loading `main.js` on a
    chapter page is a safe no‑op for them; `smoothScroll()`, `menuScene()` + `magneticButtons()` run
    on every page.
  - `magneticButtons()` — wires every `.mag-zone` (the magnetic button component). Static at rest;
    on hover the pill (`.mag-btn`, strength 0.4) and its `.label` (0.24) parallax toward the cursor,
    both `overwrite:true`, returning with `elastic.out` on leave. Drives the Explore CTA (`index.html`).
    (The Menu's old magnetic `--back` button is gone — the drawer closes via the topbar X / scrim / Esc.)
- `js/chapter.js` — **shared** ES module for chapter pages (loaded after `main.js`; reuses the GSAP
  plugins + ScrollSmoother it created). **Scope‑aware:** the four per‑chapter functions each take a
  `root` — on a standalone page `initChapter(document)`; on the reader each runs once **per
  `.chapter-panel`** so the three TOCs / reveal batches / flowers don't collide. Functions:
  `heroFlowerSpin(root)` (wind‑spin **only if** `root` has `.hero-flower[data-spin]` — chapter 1 only),
  `copyReveals(root)` (`ScrollTrigger.batch` fade‑up of `.reveal`), `stickyToc(root)` (the pinned nav —
  see gotchas), `tableOfContents(root)` (active row + progress fill follow scroll; **accordion**
  sub‑rows open only under the active section; rows + sub‑rows click‑scroll via `smoother.scrollTo`).
  **Reader‑only extras** (run when `.chapter-panel`s exist): `panelTransitions()` — the
  chapter‑to‑chapter scroll effect (ported from the GSAP "stacked panels" demo: each non‑last panel
  pins at `start "bottom bottom"`, `pinSpacing:false`, `pinType:"transform"`, scrub; the inner
  `.chapter-panel__scale` `fromTo` scale 1→0.7 + opacity 1→0 while the next chapter scrolls up over
  it); `railSync()` — the fixed rail's label + (dark‑hero) `--rail-fg` follow the panel at viewport
  centre; `railReveal()` — **clips** the rail to the chalk band so the coloured heroes occlude it (the
  rail leaves with its chapter on each chapter→chapter transition — see "The left rail"); and
  `handleDeepLink()` — on load, jump (instant) to the `#chN` in the URL hash so the menu deep‑links
  land accurately after pin spacing is finalised. (`menuScene` in `main.js` routes a drawer row whose
  `data-href` starts with `#` through `smoother.scrollTo` **on click, before the close** — no flash of
  the prior chapter — instead of a full nav.)
- `assets/` — `Opening_Title.svg` (606×230 navy lockup), `playbook_logo.svg` (topbar logo),
  `arrow.svg` (57×45), `Align_Graphic.svg` (cover pinwheel),
  **`1_Graphic.svg`** (549×554 four‑petal flower w/ grainy‑gradient donut — hero of ch1; **note: its
  internal `clipPath` crops the petals to a 549×554 box — a known clipping issue**), **`2_Graphic.svg`**
  (230×229 — ch2 hero), **`3_Graphic.svg`** (600×600 — ch3 hero), `4_Graphic.svg`, `title_streaks_2.png`
  (gradient "PLAYBOOK"; `Title_Streaks.png` older, unused), `favicon.png`,
  `menu_{1..4}.svg`/`menu_{1..4}_hover.svg` (the mono→colour icons — used by both the drawer rows and
  the index landing books), **`pullmark.svg`** (15² quote mark),
  `book_element_{1..5}.svg` (gray shelf‑spine clusters, 294px tall — index shelf only), and the new
  **chapter graphics** (filenames have spaces + en‑dashes → referenced URL‑encoded):
  **`01 Divider.svg` / `02 Divider.svg` / `03 Divider.svg`** (per‑chapter section dividers) and the C2/C3
  **diagrams** — `02 Diagram 1 – Two failure nodes.svg` (C2), `03 Diagram 1 – Full Project Arc.svg`,
  `03 Diagram 2 – Discovery.svg`, `03 Diagram 3 – The prototype spectrum.svg`,
  `03 Diagram 4 – The rapid experimentation cycle.svg` (C3). Plus `fonts/`.
- `playbook-content/playbook-outline__5_.html` — the full playbook copy (source for chapter text; not served).
- `vendor/` — `gsap.min.js`, `ScrollTrigger.min.js`, `ScrollSmoother.min.js`, `motion.esm.js`, `CustomEase.min.js`, `CustomWiggle.min.js`.
- `.figma_ref/` — Figma reference screenshots for visual diffing (not shipped/served).

## Design source
Figma file `DGg9Fqa2owVvSHvOvHBaTA` ("GTC Playbook Design (Copy)"). Key nodes:
- `1:2` type system · `2:20` typesetting sample
- `2:112` Desktop – Cover 1 (1440×1024) · `2:13723` Desktop – Cover 3 (1440×1428)
- `2:18242` scroll-state title (letters + gradient streaks, 599×710) → source of `Title_Streaks.png`
- `2008:147` Explore button · `2:22779` Menu (bookshelf, 1440×1024) · `2:22921` Menu hover (book 1 → orange)
  — **note:** the bookshelf menu was superseded by the right‑side drawer (these nodes now match only
  `index.html`'s landing shelf, not the live Menu).

## Design tokens
| Token | Value |
|------|-------|
| `--midnight` | `#012233` (Figma "Midnight") |
| `--chalk` | `#f6f2e7` (Figma "Chalk", page bg) |
| `--blue` / `--orange` / `--gray3` | `#4F94CF` (interactive books 1–3; ch2 hero) · `#F9A518` (book hover; ch1 hero/accent) · `#C7C7CC` (shelf spines) |
| `--book-dark` | `rgba(27,31,38,0.72)` (book 4 "coming soon") |
| `--sky` / `--pink` | `#73AAE5` (blue petal) · `#F394BE` (pink petal) |
| `--skeleton` / `--toc-gray` | `#D9D9D9` (TOC spine bars) · `rgba(27,31,38,0.47)` (inactive TOC row) |
| Accent palette | pink `#F394BE`, blues `#AED3ED / #73AAE5 / #4F94CF`, orange/gold (gradient only) |
| Explore pill gradient | `linear-gradient(0deg, #ffa8cd 0%, #fdd193 100%)` (pink→peach, +1px `#000`/20% inner stroke) |

**Per‑chapter theme vars** (set on a chapter's `<body>`; defaults = chapter 1's orange, so ch1 sets none):
`--hero-bg` (hero band), `--hero-title` (title on it), `--accent` (drives `.copy__heading`,
`.section-head`, active TOC row + progress fill), `--rail-fg` (rail label + search — set to `--chalk`
on **dark** heroes so they stay legible), `--flower-aspect` (hero graphic aspect ratio). Ch2 = blue
(`--blue`), ch3 = midnight (`--midnight`, with `--rail-fg:--chalk`).

**Fonts:** Boldonse (display), DM Sans (variable, opsz 14 — Light 300 / Medium 500 / Bold 700),
Source Serif 4 (Regular + Italic). All downloaded as woff2 from Google Fonts.

## Type system
Figma `letterSpacing` tokens are **percentages of font-size**.

| Style | Font | Size / line / tracking | Used for |
|------|------|------|------|
| Title | Boldonse 400 | 36 / normal / 0 | "A place to align…" heading; the cover lockup (as SVG) |
| Heading | DM Sans 700 | 64 / 100% / −2% | large sans heading (type system) |
| Subheading 2 | DM Sans 500 | 30 / 100% / −1% | |
| Subheading / eyebrow | DM Sans 300 | 20 / 100% / +2% / uppercase | `GOVTECH CONSULTING`, `WHAT THIS IS` |
| Subtitle | DM Sans 500 | 20 / 1.3 / 0 | cover subtitle |
| Body | Source Serif 4 400 | 16 / normal / −0.16px / `#000` | intro paragraph |
| Quote | Source Serif 4 400 *italic* | 16 / normal / −0.16px / `#000` | "Come here to align…" |

## Layout coordinates (reference 1440-wide frames; CSS uses fluid %/vh/clamp)
- **Cover 1 (1440×1024):** eyebrow top 49 (≈4.78vh) centered · `Opening_Title.svg` 606×230 dead-centered · subtitle top 665 (≈64.9vh) centered · `arrow.svg` top 934 (≈91.2vh) centered.
- **Cover 3 (1440×1428):** title docked top 119 (≈8.3%) and grows to 599×710 with streaks · `Align_Graphic.svg` 396² at left 210 / top 915 · text block left 626 / top 915 / width 604.

## Scroll choreography (top → bottom)
The page is two pinned scenes back-to-back, then the intro flows normally.

1. **`#hero` pin** (`heroScene` — formerly `scrollScene`; `start "top top"`, `end +=1.4·vh`, `scrub: 0.6`):
   - eyebrow / subtitle / arrow **fade + slide out** (`autoAlpha → 0`),
   - the title block **rises** from centre to docked-near-top (`titleDeltaY()` ≈ 8.3% of frame),
   - the gradient **streaks grow** top→bottom via `--streak-hide` 100%→0%.
2. **`#intro` pin** (`pinwheelScene`, `start "top top"`, `end +=0.7·vh`, pin only — no scrub).
   By the time it pins, the gradient is fully gone, so everything happens on plain `--chalk`:
   - **Rise** (scroll-scrubbed, `pin.progress` 0 → `RISE_END`): the pinwheel slides up from
     below the fold to viewport centre. No fade — it's hidden purely by sitting off-screen.
   - **Hold** (`RISE_END` → `ALIGN_AT`): a short beat, centred, spinning.
   - **Align + reveal** (timed, fired at `pin.progress ≥ ALIGN_AT`): a paused GSAP timeline
     glides the pinwheel to the text-block slot **and** reveals the `[data-reveal]` copy with a
     stagger. This is **timed (0.8s), not scrubbed** — so it needs enough pinned scroll left
     after `ALIGN_AT` to finish before the section unpins (see gotcha).

## The signature motion (gradient streaks)
The "gradient grows out of PLAYBOOK" effect = `title_streaks_2.png` (the gradient **PLAYBOOK**
word that bleeds down + fades out) sitting **behind** the crisp `Opening_Title.svg` letters.
It's **registered to the lockup's PLAYBOOK line** so the gradient letters sit exactly under the
navy ones (`left:0`, `width:100%` = full 606px lockup width; `top:52.6%` = the PLAYBOOK line, y 121 of the 606×230 lockup);
the bleed extends below. Since the gradient letters are occluded by the opaque navy letters, only
the downward bleed reads. It's revealed top→bottom by animating `--streak-hide` (100%→0%) — but via
a **feathered `mask-image`** (a `linear-gradient` whose black→transparent boundary tracks
`100% − --streak-hide` with a ±6% soft band), NOT a hard `clip-path`, so the reveal edge is soft (no
harsh scroll line). Scrubbed inside the pinned hero timeline. Keep streaks a separate layer so the
navy lettering stays vector-crisp.

## The pinwheel (rise → align → wind)
Lives in `pinwheelScene()`. The element is a **JS-injected fixed traveler** appended to `<body>`:
`.pinwheel` (outer — owns position/scale, written every frame by a `gsap.ticker` callback) →
`.pinwheel__spin` (inner — owns rotation, the wind) → `<img>`. The traveler is `aria-hidden`.

- **Spacer pattern:** the original in-flow `#introGraphic img` stays in the DOM as an
  **invisible layout spacer** (`.js.motion .intro__graphic img { visibility:hidden }`) and the
  accessible node. `place()` reads its **live `getBoundingClientRect()`** as the align target →
  responsive, and once parked the pinwheel scrolls naturally with the page.
- **`place()` (per frame):** `rise = clamp01(pin.progress / RISE_END)`,
  `riseY = lerp(belowY, centerY, power3.out(rise))` (`belowY = vh + w/2 + 40`, off-screen;
  `centerY = vh · CENTER_Y`). The align blend is `lerp(riseY → slotCentre, prox.align)` for
  both x and y, where `prox.align` is driven by the **timed** transition (0 = centred, 1 = slot).
- **Trigger / reverse:** the intro pin's `onUpdate` calls `transition.play()` at
  `progress ≥ ALIGN_AT` and `transition.reverse()` at `progress < ALIGN_AT − GAP`. The gap is
  hysteresis to prevent flapping; **with the current values the reverse never fires (one-way /
  latched reveal)** — widen or narrow it via that constant if reversible behaviour is wanted.
- **Wind:** `baseSpin` = endless `rotation += 360` (9s), and a recursive `gust()` timeline
  randomly modulates `baseSpin.timeScale` (fast gust → calm drift) for organic, never-repeating spin.
- **Tunables (top of `pinwheelScene`)** and their effect:
  - intro pin `end` `window.innerHeight * 0.7` — total length of the pinned beat (empty-space budget).
  - `RISE_END` (0.45) — fraction of the pin spent rising (lower = snappier rise, less empty bg).
  - `ALIGN_AT` (0.50) — when the timed align/reveal fires. **Keep `RISE_END ≤ ALIGN_AT`.**
  - `CENTER_Y` (0.5) — resting height while centred.
  - transition `duration` (0.8s) — the align glide speed.

> **Home‑v2 note:** on `index.html` the pinwheel now rises + aligns to `#pinwheelSlot` on **load**
> (`loadTl`), and on **scroll‑down** travels UP + shrinks to `#pinwheelSlotScrolled` via
> `pinwheelProx.scrolled` (driven by `heroScene`'s master) — see the next section. The legacy
> `#intro` pin / `ALIGN_AT` / `transition` machinery above describes the pre‑home‑v2 cover.

## The after‑scroll intro reveal (`index.html`)
The landing's scroll‑down state is the Figma "Landing_After Scroll" (node `2043:1638`): a top‑left
`playbook_logo.svg`, a centred **pinwheel (≈120px) → header "A place to align, not a place to learn."
→ body copy** column, and the 4‑book shelf at the bottom. It replaces the cover lockup, which fades out.
- **Choreography** (one reversible `heroScene` master, played on first scroll‑down, reversed on scroll‑up):
  cover (`#arrow`/`.eyebrow--top`/`.lockup`) fades out → pinwheel glides up to the header slot + shrinks
  (`pinwheelProx.scrolled` 0→1) → `.home-logo` fades in → header **line‑clip wipe** → `.intro__body`
  paragraphs fade‑up → books rise. Scroll‑up reverses everything at normal speed **except** the title,
  which exits faster (its own `titleTl`, `timeScale 2.2`).
- **Header line‑clip:** each line is a `.line{overflow:hidden;padding-block:.2em}` wrapping a `<span>`;
  the wipe animates the span's **px `y`** (set to the measured line height) → 0. Use px `y`, NOT
  `yPercent` — GSAP's percent‑unit transform cache leaves a stale inline px value that won't re‑render
  (the title stayed hidden). The `padding-block` gives Boldonse's tall caps + comma/`g` descenders room
  so the clip doesn't cut glyph tops/bottoms.
- **Layout (responsive, no overlap):** `.intro-reveal` is absolutely positioned in the band
  `[top:0 → bottom:340px]` (the shelf height) and `justify-content:center`, so the empty space above the
  block equals the space below it and it never overlaps the shelf. Sizes (`.pinwheel-slot--scrolled`,
  `.intro__head`, `.intro__body`, gaps) use `clamp(min, min(vw, vh), max)` so the block scales with
  viewport **height** (the earlier bug: a fixed `top:12vh` with px‑sized content ran into the books on
  short/wide screens). Verified balanced (top gap == bottom gap) + clear of the books across 2000×1050 →
  1280×720 via CDP.
- **Shared state:** `pinwheelProx` (module‑level) lets `heroScene` drive the pinwheel proxy that
  `pinwheelScene` owns. **Reduced motion:** `heroScene` bails, so CSS shows the after‑scroll composition
  statically (cover hidden, header/body/logo shown, pinwheel parked at `#pinwheelSlotScrolled`).

## Hero "extras" fade (eyebrow / subtitle / arrow)
These three are animated **in** on load (GSAP `from`, captured in `heroEntrance`) and **out** on
scroll (the hero scrub, `fromTo autoAlpha 1→0`). Both are GSAP on purpose, and two safeguards
make the fade reliable in both directions:
- the scrub uses **`fromTo` with an explicit `autoAlpha:1` start + `immediateRender:false`**, and
- the entrance tweens are **killed on the first scroll** (`heroScene`'s `onUpdate`).
See the gotchas for why both are necessary.

## The Menu (drawer overlay) + Explore button
Lives in `menuScene()`. `#menu` is a `position:fixed` overlay (z 50), `hidden` until opened, holding a
`.menu__scrim` (dimmed midnight backdrop, `data-menu-close`) + a `.menu__drawer` card. The Explore
button (Figma `2008:147`, on `index.html`) and every chapter page's **topbar hamburger** carry
`data-menu-open`. **The topbar is z 60 (above the menu)** so the hamburger stays clickable + morphs to
an X over the open drawer.

- **Drawer = floating top‑right card.** `.menu__drawer` pins to the top‑right with even 16px insets,
  **all four corners rounded** (`border-radius:16px`), auto height (sized to its contents), uniform
  padding. The chalk panel itself is a **`::before` layer** so its opacity can fade (via the
  GSAP‑driven `--card-bg-o`) **independently** of the rows that fall over it. Inside: a `.menu__eyebrow`
  ("The Design Playbook") + a `.menu__list` of four `.menu__item` rows.
- **Rows = icon left, number + title right.** `.menu__row` shows the mono `menu_N.svg` at left + `0N`
  + the chapter title. Rows 1–3 are `<a data-href>` links (hover/focus tints them `--orange` + cross‑fades
  to `menu_N_hover.svg` + nudges); row 4 is a non‑interactive `.menu__row--soon` ("Coming soon").
- **Open/close = one interruptible timeline** (the GSAP "interruptible single timeline" pattern):
  `tl` is paused, ENTER (scrim fade + drawer slide‑in from the right `back.out` + rows stagger‑in +
  hamburger→X) then `addPause()` then EXIT. `toggle()`: opening from the pause `play()`s (or `restart()`s
  if it was mid‑exit); closing **mid‑enter** `reverse()`s at `timeScale(1.4)` (retract fast); closing
  **fully open** `play()`s forward into the EXIT where the **rows fall away** (`y → vh+300`,
  `rotation: random(-22,22)`, staggered `from:"end"`, `power3.in`) while `--card-bg-o`→0 + scrim fade +
  X→hamburger. `onComplete`/`onReverseComplete` unlock (`hidden` + clear `inert` + restore scroll/focus)
  only if `!isOpen`. `<main> inert` + `root`/`body` `overflow:hidden` lock the page while open.
- **Navigation:** each link row's `data-href` — in‑page `#chN` does `smoother.scrollTo(target,false)`
  (unlock scroll first) **before the close runs** so no flash of the prior chapter; any other href is a
  full `window.location` load. Wired before the reduced‑motion bail so links always work. `Esc` and a
  scrim click (`[data-menu-close]`) close.
- **Reduced motion:** the drawer appears/disappears instantly (no slide/fall); colour + icon swap stay
  (CSS `:hover`).

**The bookshelf `.book` system** (the old menu's books — fall‑in / knock / hover‑raise physics, fixed‑px
1022px shelf, `book_element_*` spines) is **kept in `css/styles.css` and `js/main.js`** but is now used
**only by `index.html`'s in‑flow landing shelf** (`#homeShelf`, parked by `homeBooks()`, animated by
`heroScene()`). See git history for its physics details if reviving it.

**Magnetic button component ("True button")** — `magneticButtons()` wires every `.mag-zone` (field) →
`.mag-btn` (pill, transform target) → `.mag-btn__bg` + `.label`. Static at rest; on `mousemove`
`gsap.utils.mapRange` drives the pull (pill `strength` 0.4, label 0.24, both `overwrite:true`),
returning with `elastic.out(1,0.4)`. Now only the **`--explore`** variant remains (Figma 2008:147):
pink→peach pill (`READ THE PLAYBOOK`) on `index.html`'s `#intro`; `.mag-btn__bg` carries the
`linear-gradient(0deg,#ffa8cd,#fdd193)` + inset `1px rgba(0,0,0,.2)` stroke. (The Menu's old `--back`
variant was removed with the bookshelf.)

## The chapter pages (interior page system)
All chapter pages (`why-we-exist.html` = ch1, `our-point-of-view.html` = ch2, `stages-of-a-project.html`
= ch3) share `css/chapter.css` + `js/chapter.js`. Build a new chapter by copying the skeleton and
changing only: `<body>` theme vars, rail label, hero title `<span>`s, hero `<img>` src
(+ `data-spin` to animate), the `.toc` rows, and the `.copy` content.

- **Layout (reference 1440):** the rail is `position:fixed` (outside `#smooth-wrapper`). The body is a
  centred 1440 canvas; the **TOC** floats left (`.toc { float:left }`, in a `display:contents`
  `.body-left`) at x132, and `.copy` is `margin-left:626; width:604`. (Float — **not** absolute/grid —
  so ScrollTrigger can pin it; see gotcha.)
- **Hero** — `.page-hero` (`min-height:100vh`, bg `--hero-bg`), big Boldonse title (`--hero-title`,
  `line-height:1.6`) **anchored bottom‑left** (`left:clamp(22px,3vw,44px)`, `bottom:clamp(40px,7vh,88px)`
  — aligned with the topbar logo). The title `<span>`s stack number + title; **C2 & C3 titles are one
  line** ("Our point of view", "Stages of a project"), C1 stays two lines. A top‑right
  `.hero-flower > .hero-flower__spin > img` (spins only with `data-spin` — ch1 only) sized
  `min(700px,70vw)` × `--flower-aspect` (ch1 `549/554`, ch2 `230/229`, ch3 `600/600`).
- **TOC** (`.toc`) — pinned nav (`stickyToc`) with a `--accent` active row, a scroll‑driven
  `.toc__progress-fill`, decorative `.toc__skeleton` "spine" bars (varied widths via `--a…--f`), and
  optional **accordion sub‑rows**: each `<li>` may hold a `.toc__sub` of `.toc__subrow`s that open
  only while that section is active (`tableOfContents` animates its `height`). Active main/sub track
  scroll off each heading's id (`#s-31`, `#s-31-1`, …). Titles + sub‑titles are DM Sans **600**.
- **Copy blocks** (in `.copy`, accent/midnight on chalk, Source Serif body): `.copy__heading`
  (Boldonse, `--accent`, `line-height:88px`, 24px bottom margin), `.section-head` (DM Sans 600 30px,
  `--accent`, carries the TOC‑target `id`), `.subsection-head` (DM Sans 600 18px midnight), `.lead`,
  `.copy ul/ol/li` (themed markers), `.figure` (a **drawn diagram** — `.figure__img` SVG capped to the
  copy column, centred, no caption; used in C2 + C3, see below), `.figure-note` (the older text
  "Diagram — …" aside, still used where no graphic exists, e.g. C3's "For each stage we capture"),
  `.section-divider` (a small, subtle per‑chapter graphic `01/02/03 Divider.svg` between sections —
  `clamp(110px,24%,150px)` wide, centred), `.source-note`, `.pullquote` (+ `pullmark.svg`). Most blocks
  carry `.reveal` for the fade‑up — **except `.toc`** (its reveal transform fought the pin).
- **Diagrams (C2/C3):** real SVGs from `assets/` (referenced URL‑encoded — filenames have spaces +
  en‑dashes). C2 → "Two failure nodes" (under the `.lead`). C3 §3.1 → "Full Project Arc" sits directly
  under "What an ideal project team looks like" (which is the **first** subsection, right under the 3.1
  head); §3.3 → "Discovery", "Prototype spectrum", "Rapid experimentation cycle". Edits are mirrored in
  both the standalone page and the `playbook.html` panel.

## The left rail (`railReveal`)
The fixed `.rail` (outside `#smooth-wrapper`) is just a `.rail__divider` line + a rotated `.rail__label`
(the hamburger now lives in the `.topbar`, not the rail). It shows **only over the chalk body** and is
**occluded by the coloured chapter heroes**: because the rail is `position:fixed` on top of everything,
`railReveal()` (one per‑frame `ScrollTrigger` updater, in `js/chapter.js`) **clips** it to the chalk
band between whatever heroes are on screen — `clip-path: inset(topClip 0 bottomClip 0)`, where the clips
track each hero's intruding edge. So on a chapter→chapter transition the **incoming hero rising from the
bottom eats the rail bottom→top** (it leaves with its chapter, just as the hero covers the rest of the
outgoing chapter); the current hero uncovers it from the top as you enter a chapter; a hero filling the
strip → `visibility:hidden`. The label sits **40px** above the viewport bottom (on standalone pages it
rides up with the section's end on exit). railReveal is the **single owner** of the rail's clip, so it
never fights `railSync` (label text/colour).

## The continuous reader (`playbook.html`)
The canonical way to read the playbook: all three chapters stacked in one document so scrolling
flows seamlessly from chapter to chapter. Each chapter is the standalone skeleton (hero + body)
wrapped in `.section.chapter-panel` (id `#chN`, theme vars + `data-rail` label + optional
`data-rail-fg` on dark heroes) → `.chapter-panel__scale` (the layer the transition animates). One
shared rail + one `#menu` for the whole document; one ScrollSmoother.

- **The chapter‑to‑chapter effect** (`panelTransitions`, ported from the GSAP "stacked panels"
  ScrollTrigger demo). Within a chapter everything scrolls normally (hero → body, TOC pinned). Only
  at the **very bottom** does the panel pin (`start "bottom bottom"`, scrub, `pinSpacing:false`,
  `pinType:"transform"`) and its `.chapter-panel__scale` scale 1→0.7 + fade 1→0 while the **next
  chapter scrolls up and over it** (`pinSpacing:false` reserves no spacer). The **last chapter never
  transitions out** (`arr.slice(0,-1)`). NB the example's clipped‑slide + `fakeScrollRatio` machinery
  is **dropped** — our chapters are naturally tall/scrollable, so only the boundary scale/fade is ported.
- **Snap (quick, scroll‑direction‑biased, never half‑cut):** the pin spans **exactly one viewport**
  (`end "+=" innerHeight`) — this is **required**, not tunable: with `pinSpacing:false` the next chapter
  rises by exactly the pin distance, so it needs a full viewport to travel from viewport‑bottom up to
  viewport‑top and land flush (a shorter distance left it stopping partway up). The *quickness* comes
  from the snap, not from shortening the pin. The trigger carries
  `snap:{ snapTo:[0,1], directional:true, delay:0.02, duration:{min:.18,max:.34}, ease:"power2.out" }`.
  `directional:true` biases the snap to the way you're scrolling — a small **down** nudge completes
  into the next chapter, a small **up** nudge returns — and `delay:0.02` fires it almost the instant
  you stop, so it commits with a flick instead of a full scroll, always settling **on** a chapter.
  Snap is only active inside the pin's range, so reading within a chapter is unaffected.
- **The look (black + rounded corners, like the demo):** `.chapter-panel` is **black**, seen only
  mid‑transition — the scale pulls the shrinking chapter in horizontally (black down both sides) while
  the next chapter, with its **rounded top corners** (`.chapter-panel__scale` `border-radius` +
  `overflow:hidden`), rises up over it against the black. (The outgoing chapter's own top edge is
  off‑screen — it's multi‑viewport tall — so the rounded top reads on the **incoming** chapter. The
  `overflow:hidden` does **not** break the in‑panel TOC pin — verified `top≈100`.)
- **Why outer/inner two elements:** the pin writes a `transform` to `.chapter-panel` and the
  scale/fade tween writes a `transform`+`opacity` to `.chapter-panel__scale` — separate elements so
  the two transforms never fight (same lesson as the pinwheel traveler). The scale `transform-origin`
  is `50% calc(100% − 50vh)` so a multi‑viewport chapter scales about the **viewport** centre (it's
  pinned bottom‑aligned), not its off‑screen geometric centre.
- **TOC pin coexists:** each chapter's `stickyToc` pin ends at its `.page-body` bottom — i.e. just
  before that chapter's transition pin begins — so the two don't overlap. Three TOC pins + two
  transition pins + ScrollSmoother all live in one document without conflict.
- **Menu deep‑linking:** the reader's books carry in‑page `data-href="#chN"`; `menuScene` does the
  `smoother.scrollTo(target, false)` **on click, before the close fade runs** (unlocking page scroll
  first) — so the closing overlay uncovers the destination already in place, with **no flash of the
  chapter you were on**. (Scrolling after the fade — the obvious order — showed the old chapter for a
  beat, then jumped.) Arriving with a `#chN` hash from another page (the `index.html` books are
  `playbook.html#chN`) is handled by `handleDeepLink()` on load. Both land you at the chapter top;
  scrolling on from there runs the next transition normally.
- **Reduced motion:** `panelTransitions` bails, so the chapters simply stack and scroll natively
  (no scale/fade); deep‑link falls back to `scrollIntoView`. The standalone chapter files remain as a
  deeper fallback (no longer linked from any menu).

## Conventions & gotchas
- **One animation library per property.** If both Motion One and GSAP animate the same property,
  the loser's *finished* animation (Motion One's WAAPI fill holds its end value above inline
  styles) intermittently overrides the other → the classic "sometimes still visible when
  scrolling" bug. Consolidate to GSAP for anything the scroll scene also touches.
- **Load-entrance + scroll-scrub on the same property** needs two fixes: (1) the scrub tween must
  be `fromTo` with an explicit start and `immediateRender:false` — a plain `.to()` lazily captures
  its start from the element, which the entrance `from(autoAlpha:0)` leaves at 0, making it a
  `0→0` no-op that never animates or restores; (2) kill the entrance tweens on first scroll, or
  their *late completion* snaps the value back to 1 and overrides the (possibly paused) scrub.
- Use **`autoAlpha`** (opacity + visibility) for fade-outs so faded elements are truly gone.
- **Cross-section element travel** = fixed traveler + invisible in-flow spacer. The spacer keeps
  layout and accessibility; drive the traveler from the spacer's live rect so it stays responsive
  and hands off to natural scrolling once parked. Center via `translate(-50%,-50%)` written by the
  ticker (GSAP doesn't touch the outer; rotation lives on the inner) so there's no transform fight.
- **Scrubbed position + timed transition:** a timed transition fired inside a pin can be *outrun* —
  if the user scrolls past the pin `end` before it finishes, the section unpins and the (live) target
  starts moving, so the traveler chases it and never settles. Give the timed align enough pinned
  scroll after `ALIGN_AT` to complete (`(1 − ALIGN_AT) · pinLength` ≳ what a normal scroll covers
  in the transition's duration).
- Center absolutely-positioned hero elements with `left:0;right:0;margin-inline:auto` (NOT
  `transform: translateX(-50%)`) so GSAP can own the `transform` for animation without conflict.
- GSAP-animated CSS custom props must be **declared with a real initial value** (e.g.
  `--streak-hide: 100%`), otherwise GSAP reads an empty start and jumps to the end value.
- Always honour `prefers-reduced-motion`: `pinwheelScene`/`heroScene` bail to end-states and the
  static graphic (the old separate `introReveal` fallback was folded in during the home‑v2 refactor).
- After font load, call `ScrollTrigger.refresh()` (metrics shift can break pin distances).
- **ScrollSmoother:** only `#smooth-content` (the `<main>`) is transformed/smoothed; the `position:fixed`
  **menu overlay and pinwheel traveler live OUTSIDE it** (direct children of `<body>`) so fixed stays
  viewport-anchored. The pinwheel's `place()` reads the slot's live `getBoundingClientRect()`, which
  already reflects the smoother transform, so the fixed traveler still aligns. The menu **does NOT call
  the smoother API** (pausing it tangled with the open/close and bugged out); instead, while open it
  hard-locks page scroll via `documentElement.style.overflow = "hidden"` — freezing the window scroll
  the smoother rides on, decoupled from ScrollSmoother. Restored on close.
- **Pinning under ScrollSmoother (the chapter TOC).** CSS `position:sticky`/`fixed` **cannot survive**
  the smoother's transform on `#smooth-content` (a sticky el reads `top:-402` instead of sticking; a
  fixed el is positioned relative to the transformed ancestor, not the viewport). Use a GSAP
  `ScrollTrigger` pin with **`pinType:"transform"`** (the default `"fixed"` also fails — the pin is
  created but applies no compensating transform). The pinned element must be in **normal flow** —
  pinning an `absolute` el or one inside a CSS **grid/flex** cell silently no‑ops (hence the TOC is
  `float:left`). **Do NOT hand‑roll a per‑frame `gsap.ticker` follow** that re‑reads
  `getBoundingClientRect` and re‑applies the transform: it lands a frame behind the smoother and the
  nav visibly **lags**. The ScrollTrigger pin is internally synced → glued with no lag. (`stickyToc`.)
- **Dark‑hero rail legibility.** The rail label defaults to `--midnight` (fine on the chalk body);
  on a **dark** hero set `--rail-fg:--chalk` via `railSync`. (Mostly moot now that `railReveal` clips
  the rail away over the heroes — but the var still themes the label where it does show.)
- **Headless verification caveat:** GSAP's rAF ticker stalls under Chrome `--virtual-time-budget`,
  so `gsap.ticker`-driven transforms and timed timelines don't advance — the pinwheel/align/wind
  read as "stuck." Verify geometry from `ScrollTrigger` `.progress` + `getBoundingClientRect` and
  compute the expected output, not the rendered transform. (Scrub *scrubs* do apply via
  `ScrollTrigger.update()`, so the streak/title scrub is testable.) See the project memory note.
  (Launching headless **without** `--virtual-time-budget` runs the real rAF ticker, so timed
  timelines *do* advance — drive a scroll + wait real time, then screenshot/measure.)
- **Two transform channels to avoid fights.** When a load/scroll tween and a hover/secondary tween
  both target an element, put them on **different transform channels** so neither `overwrite`s the
  other: the landing books use `y` for the scroll rise/fall and `yPercent` for the hover lift; the
  pinwheel keeps position on the outer `.pinwheel` and rotation on the inner `.pinwheel__spin`. GSAP
  sums `y`+`yPercent`, and `overwrite:"auto"` only kills the *same* property.
- **Don't animate `yPercent` for a line‑clip reveal.** GSAP's percent‑unit transform cache can end
  with `yPercent:0` in cache but a **stale inline `translate(…px)`** that never re‑renders (the
  reveal stays hidden). Drive the wipe with **px `y`** (measured line height → 0) instead. (`heroScene`'s
  header.)

## Status / next
- ✅ Cover (`index.html`): the cover (eyebrow + lockup + rising pinwheel + arrow) and the
  **after‑scroll intro reveal** (pinwheel travels up + shrinks, top‑left logo, header line‑clip wipe,
  body fade‑up, books rise; Figma `2043:1638`). Native (delay‑free) scroll on the landing page.
  One‑direction cloud drift (staggered speeds, edge fade, spread starts). Books always fall away on
  scroll‑up (hover on `yPercent`). Balanced + non‑overlapping across screen sizes. Responsive +
  reduced‑motion. No console errors.
- ✅ The in‑flow **landing shelf** (books fall in, sway, raise + recolour → `playbook.html#chN`). The
  **Menu** is a right‑side **drawer** (swipe‑in, interruptible, rows‑fall‑away close, hamburger→X) on
  the chapter pages + reader. `Esc` / scrim / X closes.
- ✅ **Three chapter pages built** (Figma `2:23049` etc.) on the shared chapter system — fixed topbar
  (hamburger → Menu) + left rail (divider + label, clipped/occluded by heroes via `railReveal`), themed
  coloured hero (700px graphic, bottom‑left title) + top‑right graphic, pinned scroll‑synced TOC (ch3
  has accordion sub‑rows + spines), full copy from `playbook-content/` with **drawn C2/C3 diagrams** +
  per‑chapter **section dividers**. Row 1→ch1, 2→ch2, 3→ch3. Responsive + reduced‑motion. No console errors.
- ✅ **Continuous reader (`playbook.html`)** — the three chapters stacked in one document with the
  seamless chapter‑to‑chapter scroll effect (pin + scale/fade + cover, ported from the GSAP "stacked
  panels" demo). Per‑chapter TOC pins coexist; rail label/colour follow the active chapter; menu
  books deep‑link in (in‑page `#chN`) and `index.html`'s books now open the reader (`playbook.html#chN`).
  Verified over CDP: 3 panels, 2 transition pins (last chapter exempt), accurate deep‑link landing,
  clean menu‑click scroll, standalone pages still pass. Responsive + reduced‑motion. No console errors.
- ⏭️ Chapter 4 ("How we work as a team") page not built yet (drawer row 4 is "coming soon"). C2/C3
  diagrams are now **drawn** (real SVGs); ch1's diagrams (if any) + the C3 "for each stage" note remain
  text `.figure-note`s. `1_Graphic.svg` has the known petal‑clipping issue. A `4_Graphic.svg` asset
  exists but isn't placed yet.
- ℹ️ Mirrored to a second GitHub repo `yuyanggu/GTC-design-playbook-v2` (`main`) in addition to the
  original `origin` (`yuyanggu/GTC-Design-Playbook`, branch `feat/home-v2`).
