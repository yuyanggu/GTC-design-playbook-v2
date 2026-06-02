# GTC — The Design Playbook

A polished, awwwards-grade **static single-page website** for the GovTech Consulting ("GTC")
Design Playbook. The **header is built**: the above-the-fold cover, the pinned scroll
transition where a colour gradient bleeds down from the `PLAYBOOK` lettering, a dedicated
pinned beat where the **pinwheel rises in and aligns to the text**, and the intro
"What this is" section. The intro now ends in an **Explore** button (wiggle + magnetic)
that opens a full-screen **bookshelf Menu overlay**. More sections will be added below over time.

## Tech stack
- **Plain HTML / CSS / vanilla JS** (ES modules). No framework, no build step.
- **GSAP + ScrollTrigger** — owns almost all motion: the two pinned/scrubbed scroll scenes,
  the scroll fades, the pinwheel rise/align, the continuous "wind" spin, the Menu (books fall
  in / sway / raise), and the Explore button's magnetic pull. **CustomEase + CustomWiggle**
  (now-free GSAP plugins) are vendored + registered but **currently unused** (the idle `wiggle()`
  was removed — the button is static at rest); kept for a possible hover wiggle.
- **motion.dev (Motion One)** — used for **one** entrance only (`.titleblock__media` load-in).
  Everything else is GSAP (see the "two libraries over one property" gotcha).
- Everything is **vendored locally** (`vendor/`) and **fonts are self-hosted** (`assets/fonts/`) → fully offline-capable. Do not switch to CDNs.

## Run / preview
```bash
python3 -m http.server 8124    # then open http://localhost:8124/index.html
```
There is a `.claude/launch.json` config named `gtc-static` for the preview tooling.

## File map
- `index.html` — two `<section>`s: `#hero` (Cover 1 → reveal stage) and `#intro` (Cover 3
  "What this is"), plus the `#menu` bookshelf overlay (sibling of `<main>`, `hidden` by default).
  The pinwheel that animates between the sections is **not** in the markup — JS injects a fixed
  traveler (see below). The in-flow `#introGraphic img` stays as a hidden spacer + accessible
  element. The intro ends with `.intro__cta` → a **magnetic button component** (`.mag-zone--explore`
  > `#exploreBtn`). `#menu` holds the eyebrow + `Opening_Title.svg` lockup, the back button (same
  component, `.mag-zone--back` > `#menuClose`), and `#menuShelf` → decorative `.shelf__spines` + four `.book` cards.
- `css/styles.css` — tokens (`:root`), `@font-face`, the type system, layout, `.pinwheel`
  traveler styles, the Explore button, the Menu/shelf/`.book` system (sized in **`cqw`** off the
  shelf's `container-type:inline-size`), and motion base states (`.js [data-reveal]` hidden, `.js.motion` spacer hide).
- `js/main.js` — seven functions, all booted at the bottom:
  - `heroIntro()` — Motion One load-in for `.titleblock__media`; GSAP `from` load-in for the
    eyebrow / subtitle / arrow (captured in `heroEntrance` so the scroll scene can kill them).
  - `arrowBob()` — infinite GSAP `y` bob on the arrow (independent of its opacity).
  - `scrollScene()` — GSAP pin/scrub on `#hero` (title rises, streaks grow, extras fade out).
  - `introReveal()` — reduced-motion-only fallback that shows the intro statically.
  - `pinwheelScene()` — pins `#intro`; rises the pinwheel in, holds, then a timed transition
    aligns it to the slot + reveals the text. Plus the continuous "wind" spin.
  - `menuScene()` — open/close the `#menu` overlay (`hidden` + `<main>` `inert` + body scroll lock);
    on open the four books **drop & settle** (`back.out`, staggered L→R); cursor over `#menuShelf`
    **sways** every book (rotation on `.book__inner`); interactive books (1 & 2) **raise** (`y` on
    the outer `.book`) + turn orange + (book 1) swap icon via the `.is-hover` class. `Esc` closes.
  - `magneticButtons()` — wires every `.mag-zone` (the magnetic button component). Static at rest;
    on hover the pill (`.mag-btn`, strength 0.4) and its `.label` (0.24) parallax toward the cursor,
    both `overwrite:true`, returning with `elastic.out` on leave. Drives both the Explore CTA and
    the Menu back button.
- `assets/` — `Opening_Title.svg` (606×230 navy lockup), `arrow.svg` (57×45), `Align_Graphic.svg` (pinwheel), `Title_Streaks.png` (the gradient bleed, transparent, tucked behind the title letters), `menu_1.svg` (mono flower) / `menu_1_hover.svg` (colour flower) / `menu_2.svg` (blue leaf) — the 100×100 book icons, `fonts/`.
- `vendor/` — `gsap.min.js`, `ScrollTrigger.min.js`, `motion.esm.js`, `CustomEase.min.js`, `CustomWiggle.min.js`.
- `.figma_ref/` — Figma reference screenshots for visual diffing (not shipped/served).

## Design source
Figma file `DGg9Fqa2owVvSHvOvHBaTA` ("GTC Playbook Design (Copy)"). Key nodes:
- `1:2` type system · `2:20` typesetting sample
- `2:112` Desktop – Cover 1 (1440×1024) · `2:13723` Desktop – Cover 3 (1440×1428)
- `2:18242` scroll-state title (letters + gradient streaks, 599×710) → source of `Title_Streaks.png`
- `2008:147` Explore button · `2:22779` Menu (bookshelf, 1440×1024) · `2:22921` Menu hover (book 1 → orange)

## Design tokens
| Token | Value |
|------|-------|
| `--midnight` | `#012233` (Figma "Midnight") |
| `--chalk` | `#f6f2e7` (Figma "Chalk", page bg) |
| `--blue` / `--orange` / `--gray3` | `#4F94CF` (books 1–2) · `#F9A518` (book hover) · `#C7C7CC` (shelf spines) |
| `--book-dark` | `rgba(27,31,38,0.72)` (books 3–4 "coming soon") |
| Accent palette | pink `#F394BE`, blues `#AED3ED / #73AAE5 / #4F94CF`, orange/gold (gradient only) |
| Explore pill gradient | `linear-gradient(to top, #f7bdf8 31.577%, #ffda67 150.94%)` |

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

1. **`#hero` pin** (`scrollScene`, `start "top top"`, `end +=1.4·vh`, `scrub: 0.6`):
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
The "gradient grows out of PLAYBOOK" effect = `Title_Streaks.png` (the exact Figma artwork,
cropped to **streaks-only, transparent**, at the letter baseline) sitting **behind** the crisp
`Opening_Title.svg` letters. It's revealed top→bottom by animating a CSS custom property
`--streak-hide` (100% → 0%) inside `clip-path: inset(0 0 var(--streak-hide) 0)`, scrubbed to
scroll inside the pinned hero timeline. Keep the streaks a separate layer from the letters so
the navy lettering stays vector-crisp.

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

## Hero "extras" fade (eyebrow / subtitle / arrow)
These three are animated **in** on load (GSAP `from`, captured in `heroEntrance`) and **out** on
scroll (the hero scrub, `fromTo autoAlpha 1→0`). Both are GSAP on purpose, and two safeguards
make the fade reliable in both directions:
- the scrub uses **`fromTo` with an explicit `autoAlpha:1` start + `immediateRender:false`**, and
- the entrance tweens are **killed on the first scroll** (`scrollScene`'s `onUpdate`).
See the gotchas for why both are necessary.

## The Menu (bookshelf overlay) + Explore button
Lives in `menuScene()` / `exploreButton()`. The Explore button (Figma `2008:147`) sits at the
bottom of `#intro` (a `[data-reveal]` member, so it enters with the intro copy). `#menu` is a
full-screen `position:fixed` overlay (z 50), `hidden` until opened.

- **Bookshelf layout = `cqw` off the shelf container.** `#menuShelf` is `container-type:inline-size`
  with `aspect-ratio:1025/340` (the Figma book group spans x 207→1232 of 1440, height 340). Every
  book, spine, number, rule, title and icon is sized/positioned in **`cqw`** (1cqw = 1% of shelf
  width = 10.25px at full size) so the whole shelf scales proportionally. Book left = `--book-x`
  (inline), card = `18.34cqw` wide × `aspect-ratio:188/340`. Spines = absolute gray rects (`--x`,
  `--w` in cqw); `.spine--lean` adds `skewX(-7deg)`.
- **Book = outer/inner (same convention as the pinwheel traveler).** `.book` (outer) owns `y`
  (fall-in **and** hover raise); `.book__inner` owns `rotation` (the sway) → no transform fight.
- **Open/close (`menuScene`)**: open un-hides, sets `<main> inert` + locks body scroll, then a
  timeline fades the overlay and **drops** the four books from above with `back.out(1.5)` stagger.
  Close reverses then re-adds `hidden`/`inert` and restores focus to `#exploreBtn`. `Esc` closes.
- **Sway**: `pointermove` on the shelf maps each book's horizontal distance from the cursor to a
  small `rotation` on its `.book__inner` (clamped ±4°); `pointerleave` → `elastic.out` back to 0.
- **Hover raise / colour / icon**: interactive books only (`.book--interactive` = 1 & 2). Hover/focus
  adds `.is-hover` (CSS turns the card `--orange`; book 1 cross-fades `menu_1.svg`→`menu_1_hover.svg`)
  and GSAP raises the outer `y`. Books 3 & 4 (`.book--soon`, dark) are **dimmed / non-interactive** —
  they still sway (ambient shelf physics) but don't raise/recolour.
- **Magnetic button component ("True button")**: structure is `.mag-zone` (the field) → `.mag-btn`
  (the pill, transform target, `overflow:hidden`) → `.mag-btn__bg` (fill layer) + `.label` span.
  `magneticButtons()` wires every `.mag-zone` once at boot. The button is **static at rest** (no
  idle wiggle); on `mousemove`, `gsap.utils.mapRange` over the zone rect drives the magnetic pull —
  pill at `strength` 0.4, `.label` at `labelStrength` 0.24 (lighter parallax), both `overwrite:true`;
  `mouseleave` returns both with `elastic.out(1,0.4)`. Variants:
  - `--explore` (Figma 2008:147): pink→gold pill in a ~220×140 field; `.mag-btn__bg` carries the
    gradient + `box-shadow: inset 0 0 0 1px rgba(0,0,0,.1)` **inner** stroke; `EXPLORE` label.
  - `--back` (Menu): transparent pill, `--midnight` text + `1px rgba(1,34,51,.25)` border on the bg
    (hover fills `rgba(1,34,51,.06)`); `overflow:visible` (short label, no clip); no arrow. The
    zone is absolute top-left in `#menu`.
- **Reduced motion**: the menu opens instantly with books placed (no drop/sway/raise); the Explore
  button skips the wiggle/magnetic; colour + icon swap stay (CSS `:hover`).

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
- Always honour `prefers-reduced-motion`: `pinwheelScene`/`scrollScene` bail to end-states and the
  static graphic; `introReveal` shows the copy.
- After font load, call `ScrollTrigger.refresh()` (metrics shift can break pin distances).
- **Headless verification caveat:** GSAP's rAF ticker stalls under Chrome `--virtual-time-budget`,
  so `gsap.ticker`-driven transforms and timed timelines don't advance — the pinwheel/align/wind
  read as "stuck." Verify geometry from `ScrollTrigger` `.progress` + `getBoundingClientRect` and
  compute the expected output, not the rendered transform. (Scrub *scrubs* do apply via
  `ScrollTrigger.update()`, so the streak/title scrub is testable.) See the project memory note.

## Status / next
- ✅ Header: Cover 1, pinned gradient-reveal scene, the pinwheel rise→align beat, Cover 3
  "What this is". Responsive + reduced-motion. No console errors.
- ✅ Explore button (wiggle + magnetic) at the bottom of `#intro`, and the bookshelf **Menu**
  overlay (`2:22779` / hover `2:22921`): books fall in, sway with the cursor, books 1–2 raise +
  turn orange (book 1 swaps to the colour icon); books 3–4 dimmed "coming soon". Back/`Esc` closes.
- ⏭️ The pages behind books 1–4 are not built yet (the books currently open nothing). Sections
  below Cover 3 (beyond the Menu) are not built yet.
