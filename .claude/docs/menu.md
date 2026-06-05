# The Menu drawer + the bookshelf

The right-side drawer overlay (`menuScene`) and the related landing bookshelf. The Explore button
that *opens* the menu is the magnetic button component documented in [motion.md](motion.md).

## The Menu (drawer overlay)

Lives in `menuScene()`. `#menu` is a `position:fixed` overlay (z 50), `hidden` until opened, holding
a `.menu__scrim` (dimmed midnight backdrop, `data-menu-close`) + a `.menu__drawer` card. Any
`[data-menu-open]` opens it (the Explore CTA on `index.html` *and* every chapter page's topbar
hamburger). **The topbar is z 60 (above the menu)** so the hamburger stays clickable + morphs to an
X over the open drawer.

The drawer block is **duplicated verbatim** into every page that has one (the 3 chapter pages +
`playbook.html`); the only per-page difference is each row's `data-href`.

### Drawer = floating top-right card

`.menu__drawer` pins top-right with even 16px insets, **all four corners rounded**
(`border-radius:16px`), auto height (sized to contents), uniform padding. The chalk panel is a
**`::before` layer** so its opacity can fade (via the GSAP-driven `--card-bg-o`) **independently** of
the rows that fall over it. Inside: a `.menu__eyebrow` ("The Design Playbook") + a `.menu__list` of
four `.menu__item` rows.

### Rows = icon left, number + title right

`.menu__row` shows the mono `menu_N.svg` at left + `0N` + the chapter title. Rows 1–3 are
`<a data-href>` links (hover/focus tints them `--orange` + cross-fades to `menu_N_hover.svg` +
nudges); row 4 is a non-interactive `.menu__row--soon` ("Coming soon").

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

The old menu's books — fall-in / knock / hover-raise physics, fixed-px 1022px shelf,
`book_element_*` spines — is **kept in `css/styles.css` + `js/main.js`** but is now used **only by
`index.html`'s in-flow landing shelf** (`#homeShelf`):

- `homeBooks()` parks the books/spines (`hbBooks`/`hbSpines`, read by `heroScene`) and calls
  `wireBookKnockAndHover()` (cursor-knock + hover-raise/recolour).
- **The hover raise uses `yPercent` (NOT `y`)** so it can't overwrite the scroll master's `y`
  tween — books always fall away on scroll-up even if the cursor grazes a book mid-transition
  (separate transform channels — see [gotchas.md](gotchas.md)).
- Books navigate via `data-href` to `playbook.html#chN`; book 4 is `.book--soon` "coming soon".

See git history for the full fall-in/knock physics if reviving it as a menu.
