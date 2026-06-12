# Prologue modal — design

A first-visit, dismissible "note" overlay presenting the playbook's prologue: a header,
the orb-strip graphic, and four columns of copy. Implements Figma `2100-3324` content as a
**skeuomorphic notepad** (the user's chosen treatment, departing from the flat Figma panel).

## Goals

- Appear automatically on the **first visit** — whether the visitor lands on the home page
  (`index.html`) or a deep-linked reader section (`playbook.html`).
- Once dismissed, **persist** so it never auto-shows again (same `localStorage` mechanism as
  the password gate, not a literal cookie).
- **Reopenable** any time from a "Prologue" trigger on the intro page and in the reader menu.
- Floating overlay; dismiss via **click-outside, `Esc`, or a ✕**.
- No new dependencies — reuse the already-vendored GSAP for the entrance.

## Surfaces / scope

- `index.html` (home) and `playbook.html` (reader) only. Deep-linked sections all rewrite to
  `playbook.html`, so these two cover every linked surface. The three standalone chapter pages
  are unlinked fallbacks and are intentionally left out.

## Files

| File | Change |
|---|---|
| `css/prologue.css` | **new** — overlay, backdrop, notepad card, 4-column grid, ✕, responsive, reduced-motion. Linked after `styles.css` on both pages. |
| `js/prologue.js` | **new** — ES module. First-visit logic, persistence, open/close, GSAP entrance, trigger + `Esc`/scrim/✕ wiring, reduced-motion fallback. Loaded at end of both pages alongside `main.js`. |
| `index.html` | link `prologue.css`; inline `.prologue` overlay markup; a `Prologue` button (`data-prologue-open`) inside `.intro-reveal`; `prologue.js` script tag. |
| `playbook.html` | link `prologue.css`; inline `.prologue` overlay markup; a `Prologue` row in the `.menu__list` drawer; `prologue.js` script tag. |

Overlay markup is **static HTML in each page** (hidden by default via the `hidden` attribute),
like the existing `.menu` drawer — copy stays editable and renders without JS. JS only toggles
visibility, animates, persists, and wires triggers.

## Behaviour

### First-visit + persistence (gate-then-prologue)
- `js/prologue.js` runs after DOM ready. It **bails if `window.__GTC_LOCKED__`** (gate up).
- Reads `localStorage["gtc-prologue-seen"]`. Unset → auto-open shortly after load. Any dismiss →
  set `"1"`. Sequence: password → reload (now unlocked) → prologue shows once → dismiss → done.
- `localStorage` access wrapped in `try/catch` (private mode → treated as not-seen; acceptable).

### Reopen triggers (ignore the seen-flag)
- `index.html`: a small `Prologue` text button in `.intro-reveal`, `data-prologue-open`.
- `playbook.html`: a final `.menu__item` row whose `.menu__row` carries **both**
  `data-prologue-open` (prologue.js opens the note) **and** `data-menu-close` (existing
  `menuScene` closes the drawer). It has no `data-href`, so `wireNav` ignores it.
- `prologue.js` binds every `[data-prologue-open]` to `open()`.

### Dismiss
- Click the backdrop, press `Esc`, or click the ✕ → reverse animation → set `hidden` + persist.
- While open: lock page scroll and set the page `inert`, mirroring the menu's `lock()/unlock()`.

## Notepad treatment (CSS)
- Cream paper card (`--chalk`), layered stacked-sheet shadows (offset pseudo-elements read as a
  pad), faint paper grain, slight rest tilt (~-1.5°) over a dimmed `--midnight` backdrop.
- Content: `assets/prologue.webp` orb strip across the top; **PROLOGUE** centered in
  `--font-display` (Boldonse); four columns — Boldonse subheads + `--font-serif` body — using the
  **corrected Figma copy** (the pasted prompt copy was garbled at "engineering arend on …").
- Responsive: 4 → 2 (tablet) → 1 (mobile) columns; card `max-height` + internal scroll on short
  viewports. ✕ in the corner.

## Motion (GSAP)
- Open: backdrop fades; note drops in — scale `0.92→1`, `y -24→0`, rotate `-4°→-1.5°` rest, soft
  overshoot (`back.out`). Close: lift + fade, then `hidden`.
- `prefers-reduced-motion`: instant show/hide, no transform.

## Corrected column copy (from Figma `2100-3324`)

1. **For us, the GTC Design Team** — "This playbook is for us, the GovTech Consulting Design team.
   We focus on a specific part of design: discovery and creating the conditions for action. Not
   building, not developing. We work upstream, where the problem gets defined and the direction
   gets set. If you're on the team, this is your document."
2. **Open for a reason** — "Because good thinking gets sharper with honest reactions. We made it
   public so anyone can read it, push back on it, or bring it up over a meal. That kind of
   conversation is exactly what we're hoping for."
3. **Not a methods guide** — "You won't find research techniques or workshop instructions here.
   What you will find is our point of view: on what design actually is and where it's going, on
   why discovery is changing more dramatically than most people realise, on why prototyping means
   building to test and not building to release, on how the lines between design, product, and
   engineering are shifting, and on what it means to do all of this in government, for the public,
   at this particular moment in time."
4. **Always in draft** — "This is not an excuse to leave things unfinished. It's a declaration
   that we are in a moment of genuine flux, learning by doing, testing what we believe, and
   updating this as we go. Every project is a prototype. So is this."
