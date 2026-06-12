# The Menu drawer + the bookshelf

The right-side drawer overlay (`menuScene`) and the related landing bookshelf. The Explore button
that *opens* the menu is the magnetic button component documented in [motion.md](motion.md).

## The Menu (drawer overlay)

Lives in `menuScene()`. `#menu` is a `position:fixed` overlay (z 50), `hidden` until opened, holding
a `.menu__scrim` (dimmed midnight backdrop, `data-menu-close`) + a `.menu__drawer` card. Any
`[data-menu-open]` opens it (the Explore CTA on `index.html` *and* every chapter page's topbar
hamburger). **The topbar is z 60 (above the menu)** so the hamburger stays clickable + morphs to an
X over the open drawer.

**Mobile (≤768px) topbar restacking** (`css/chapter.css`): the wide drawer (`92vw`) would cover the
logo, and the logo used to paint on top of it. So on mobile the topbar drops its own stacking
context (`position:static`) and the logo + hamburger are pinned individually — **logo at z 44 (under
the menu's 50, so the card slides over it), hamburger at z 60 (over the card, still the morphing X)**.
Behind both sits a soft chalk scrim (`.topbar::before`, z 42) so scrolling body copy fades out under
them; `topbarScrim()` in `js/chapter.js` toggles `html.topbar-clear` to hide it whenever a coloured
hero fills the top band (dark logo on colour, no text to mask). The left **rail is hidden on mobile**
(≤768px) and the reader `.copy` runs full width with even side padding (no rail gutter); the foreword
drops its `--fw-rail` to match. Desktop is unchanged (rail present; drawer narrow + right-aligned, so
no overlap; no scrim).

The drawer block is **duplicated verbatim** into every page that has one (the 3 chapter pages +
`playbook.html` + `foreword.html`); the only per-page difference is each row's `data-href`.
The drawer now has **five rows**: 00 Foreword → 01 → 02 → 03 → 04 (coming soon).

### Drawer = floating top-right card

`.menu__drawer` pins top-right with even 16px insets, **all four corners rounded**
(`border-radius:16px`), auto height (sized to contents), uniform padding. The chalk panel is a
**`::before` layer** so its opacity can fade (via the GSAP-driven `--card-bg-o`) **independently** of
the rows that fall over it. Inside: a `.menu__eyebrow` ("The Design Playbook") + a `.menu__list` of
four `.menu__item` rows.

### Rows = icon left, number + title right

`.menu__row` shows the mono `menu_N.svg` at left + `0N` + the chapter title. **Row 0 (Foreword)**
now leads the list with `menu_0.svg` / `menu_0_hover.svg`. Rows 0–3 are `<a data-href>` links
(hover/focus tints them `--orange` + cross-fades to `menu_N_hover.svg` + nudges); row 4 is a
non-interactive `.menu__row--soon` ("Coming soon").

### Open/close = one interruptible timeline

The GSAP "interruptible single timeline" pattern: `tl` is paused, ENTER (scrim fade + drawer
slide-in from the right `back.out` + rows stagger-in + hamburger→X) then `addPause()` then EXIT.

- `toggle()`: opening from the pause `play()`s (or `restart()`s if it was mid-exit).
- closing **mid-enter** `reverse()`s at `timeScale(1.4)` (retract fast).
- closing **fully open** `play()`s forward into the EXIT where the **rows fall away** (`y → vh+300`,
  `rotation: random(-22,22)`, staggered `from:"end"`, `power3.in`) while `--card-bg-o`→0 + scrim fade
  + X→hamburger.
- `onComplete` / `onReverseComplete` unlock (`hidden` + clear `inert` + restore scroll/focus) only
  if `!isOpen`.

`<main> inert` + `root`/`body` `overflow:hidden` lock the page while open. The menu **does NOT touch
the ScrollSmoother API** — it hard-locks page scroll via `documentElement` overflow instead (see
[gotchas.md](gotchas.md): ScrollSmoother).

### Navigation

Each link row's `data-href`: an in-page `#chN` does `smoother.scrollTo(target, false)` (unlock
scroll first) **before the close runs** so there's no flash of the prior chapter (see
[reader.md](reader.md): deep-linking); any other href is a full `window.location` load. Wired
**before** the reduced-motion bail so links always work. `Esc` and a scrim click (`[data-menu-close]`)
close.

### Reduced motion

The drawer appears/disappears instantly (no slide/fall); colour + icon swap stay (CSS `:hover`).

## The bookshelf `.book` system

The old menu's books — fall-in / knock / hover-raise physics, `book_element_*` spines — is **kept
in `css/styles.css` + `js/main.js`** but is now used **only by `index.html`'s in-flow landing
shelf** (`#homeShelf`):

- The shelf now holds **five books** (0 Foreword → 4 coming soon). Fixed width **1300px** (5 × 188 +
  4 × 90). Book positions (`--book-x`): 0 / 278 / 556 / 834 / 1112px. Six `book_element_*` spine
  clusters fill the gaps. Book 0 uses `menu_0.svg` / `menu_0_hover.svg`.
- **Responsive scaling** (`fitShelf()` in `homeBooks()`): a CSS custom property `--shelf-scale =
  min(1, (innerWidth − 32) / 1300)` is set inline and updated on resize. `.home-shelf` applies
  `transform: translateX(-50%) scale(var(--shelf-scale))` with `transform-origin: 50% 100%` so
  all five books stay visible + bottom-anchored on narrow viewports.
- `homeBooks()` early-returns on `(max-width: 768px)` — no scaling, no parking, no hover/physics.
  The mobile `.home-cards` take over instead.
- **Mobile (≤768px):** `#homeShelf` is `display:none`. A `<nav class="home-cards">` below `#hero`
  shows a vertical stack of five horizontal cards (icon · 32px number · fixed 3×40px divider · title).
  Cards use `padding-block: 32px`, 48px icons, `linear-gradient(90deg, #aed3ed 0%, #4f94cf 47.12%)`,
  18px gap. No hover/physics — tap navigates. Book 4 uses `.home-card--soon` (gray). The Foreword
  card links to `/playbook.html` (reader top = ch0); chapter cards link to `/chapter-N`.
- `homeBooks()` parks books/spines (`hbBooks`/`hbSpines`, read by `heroScene`) and calls
  `wireBookKnockAndHover()` (cursor-knock + hover-raise/recolour).
- **The hover raise uses `yPercent` (NOT `y`)** so it can't overwrite the scroll master's `y`
  tween — books always fall away on scroll-up even if the cursor grazes a book mid-transition
  (separate transform channels — see [gotchas.md](gotchas.md)).
- Book number top padding is **30px** (was 19px).

See git history for the full fall-in/knock physics if reviving it as a menu.
