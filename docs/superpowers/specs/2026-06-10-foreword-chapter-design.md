# Foreword (Chapter 0) — design

Add a **Foreword** ("Chapter 0") to the continuous reader, placed **before Chapter 1**, built on
the existing chapter-panel system so it inherits the chapter-to-chapter scroll transition into C1.
Implements Figma `2146:5238` ("Desktop - Forward"). This **replaces** the first-visit Prologue modal
(same content), which is removed.

Source of truth for the design: Figma node `2146:5238` in
`DGg9Fqa2owVvSHvOvHBaTA`. Source of truth for the copy: the existing prologue markup (it carries the
*correct* fourth paragraph; the Figma duplicates the third by mistake).

## Goals

- A new `#ch0` reader panel before `#ch1`, matching Figma: **chalk background, no coloured hero, no
  TOC**. Title "Foreword" sits top-left on chalk; a full-width orb banner; then the four copy
  blocks in the standard offset copy column.
- Inherit the existing reader machinery (panel transition into C1, rail label, deep-link scroll-spy)
  with **no JS changes to `chapter.js`** — `#ch0` is just another `.chapter-panel`.
- Reachable at the clean path **`/foreword`**, from the reader **drawer menu**, and via a
  **standalone `foreword.html`** fallback.
- **Remove the Prologue modal** entirely (markup, CSS, JS, the now-unused `prologue.webp`, and all
  `<link>`/`<script>` references) since the Foreword chapter supersedes it.

Out of scope: the TOC chapter-switcher grids stay **4-cell** (Foreword is not added to them); the
landing bookshelf books are wired by the user.

## Layout (matches Figma, reference 1440)

Figma coordinates: title at `left:78 top:84` (Boldonse 75px, midnight `#012233`); orb banner
full-width (`1440×291`) at `top:251`; copy column at `left:626 width:604 top:610` (DM Sans 22px
headings + Source Serif 16px body) — i.e. the **same offset column** as every other chapter's
`.copy`. The left half below the title is intentionally empty.

## Files

| File | Change |
|---|---|
| `playbook.html` | **add** the `#ch0` panel before `#ch1`; **remove** `#prologue` markup + its `<link>`/`<script>`; convert the menu's "Prologue" button into a "Foreword" link. |
| `css/chapter.css` | **add** a small `.foreword*` block (title, banner, copy tweaks, min-height, responsive). |
| `js/routes.js` | **add** `ch0 ⇄ /foreword` special case; extend `isReaderPath` to match `/foreword`. |
| `foreword.html` | **new** standalone fallback page (no hero, no TOC). |
| `index.html` | **remove** `#prologue` markup + `<link>`/`<script>`; repurpose the `.intro__prologue` button into a "Foreword" link to `/foreword`. |
| `css/prologue.css`, `js/prologue.js`, `assets/prologue.webp` | **delete** (unused after removal). |
| `js/main.js`, `css/styles.css` | keep the `.intro__prologue` reveal animation/styles (the element survives as a link); no other prologue refs exist. |

## 1. Reader panel (`playbook.html`)

Insert before the `<!-- CHAPTER 1 -->` panel:

```html
<section class="section chapter-panel chapter-panel--foreword" id="ch0"
         data-rail="foreword" style="--accent: var(--midnight);">
  <div class="chapter-panel__scale">
    <section class="page-body foreword">
      <div class="page-body__canvas">
        <h1 class="foreword__title reveal">Foreword</h1>
        <img class="foreword__graphic reveal" src="assets/foreword_Graphic.png"
             width="1440" height="291" alt="" />
        <article class="copy foreword__copy">
          <h2 class="subsection-head reveal">For us, the GTC Design Team</h2>
          <p class="reveal">This playbook is for us, the GovTech Consulting Design team…</p>
          <h2 class="subsection-head reveal">Open for a reason</h2>
          <p class="reveal">Because good thinking gets sharper with honest reactions…</p>
          <h2 class="subsection-head reveal">Not a methods guide</h2>
          <p class="reveal">You won’t find research techniques or workshop instructions here…</p>
          <h2 class="subsection-head reveal">Always in draft</h2>
          <p class="reveal">This is not an excuse to leave things unfinished. It’s a declaration
             that we are in a moment of genuine flux… Every project is a prototype. So is this.</p>
        </article>
      </div>
    </section>
  </div>
</section>
```

Notes:
- Copy is pulled verbatim from the current `#prologue` blocks (4 headings + 4 paragraphs), including
  the **correct** fourth paragraph.
- Reuses `.copy` + `.subsection-head` so type, colour (midnight), and measure match other chapters.
- `.reveal` on the title, banner, and each block uses the existing `copyReveals` fade-up. **Verify**
  `copyReveals`' selector reaches the title/banner (they sit outside `.copy`); if it is scoped to
  `.copy`, broaden the selector or wrap accordingly so all three reveal.
- No `.page-hero` → `railReveal` leaves the rail visible over the chalk; on the `ch0→ch1`
  transition C1's orange hero rises and eats the rail as usual. No `chapter.js` edits required.

## 2. CSS (`css/chapter.css`)

A focused block, e.g.:

```css
.chapter-panel--foreword .page-body { min-height: 100vh; padding-top: clamp(96px, 12vh, 140px); }
.foreword__title {
  margin: 0 0 0 clamp(20px, 5vw, 78px);
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(2.2rem, 5.2vw, 75px); line-height: 1.6; color: var(--midnight);
}
.foreword__graphic { display: block; width: 100%; height: auto; margin: clamp(24px,4vh,40px) 0; }
.foreword__copy { padding-top: clamp(32px, 5vh, 78px); }
```
- Title clears the fixed topbar (logo/hamburger) via the top padding on `.page-body`.
- Banner is full canvas width; the orange streaks bleed as in Figma. Under the 1180px responsive
  breakpoint the copy already collapses to a single centred column (inherited from `.copy`); the
  title/banner are full-width and need no extra rules beyond the gutter clamp.
- `min-height:100vh` + the long copy guarantees the panel is taller than one viewport so the
  `panelTransitions` pin-and-rise into C1 reads correctly.

## 3. Routing (`js/routes.js`)

- Map `ch0 ⇄ /foreword` as a **special case** (the generic rule derives `/chapter-N` from `chN`;
  Foreword opts out of that scheme).
- `idToPath("ch0") → "/foreword"`, `pathToId("/foreword") → "ch0"`.
- `isReaderPath` must return true for `/foreword` (currently `^/chapter-\d+`), so the pre-paint
  anti-flash gate in `playbook.html` and `handleDeepLink` treat `/foreword` as a reader path.
- `urlSync` writes `/foreword` when `#ch0` is the deepest in-view chapter (automatic once mapped).

## 4. Drawer menu (`playbook.html`)

Convert the existing bottom row (the `data-prologue-open` button, "00 / Prologue") into a link:

```html
<li class="menu__item">
  <a class="menu__row" data-href="/foreword" href="/foreword">
    <span class="menu__icon" aria-hidden="true"></span>
    <span class="menu__text"><span class="menu__num">00</span>
      <span class="menu__title">Foreword</span></span>
  </a>
</li>
```
- `wireNav`/`menuScene` already resolve `data-href` via `GTCRoutes` → in-reader `smoother.scrollTo`
  to `#ch0`. Icon left empty (no `menu_0.svg` asset), as the prologue row was.

## 5. Standalone `foreword.html` (fallback)

Model on the other standalone chapter pages' shell (topbar, fixed rail, `#menu` drawer, `main.js` +
`chapter.js`, no `routes.js`), but with the foreword body (no `.page-hero`, no `.toc`) — i.e. the
same inner markup as the reader panel's `.page-body.foreword`, without the `.chapter-panel`
wrapper. Rail label "foreword". Like the other standalone pages it's an unlinked deeper fallback.

## 6. Prologue removal

- `playbook.html`: remove the `#prologue` block, `css/prologue.css` `<link>`, `js/prologue.js`
  `<script>`; convert the menu row (above).
- `index.html`: remove the `#prologue` block, `css/prologue.css` `<link>`, `js/prologue.js`
  `<script>`; change the `.intro__prologue` element from a `data-prologue-open` button to an
  `<a class="intro__prologue" href="/foreword">Foreword</a>` (keeps the `main.js` reveal tween and
  `styles.css` opacity rules, which key off the `.intro__prologue` class).
- Delete `css/prologue.css`, `js/prologue.js`, `assets/prologue.webp`.
- Leave the prologue spec docs in place as historical record.

## Verification

- Headless CDP on `/playbook.html` (per `gotchas.md` + the `headless-motion-verification` memory):
  Foreword renders chalk with no hero; scroll `ch0→ch1` triggers the scale/fade transition and C1's
  hero rises over; rail reads "foreword" over the panel; no console errors.
- `/foreword` deep-link (behind a rewrite shim) lands on `#ch0` without the C1 flash; the address
  bar shows `/foreword` when scrolled to the Foreword.
- Drawer menu "Foreword" row and the `index.html` intro "Foreword" link both reach the Foreword.
- `prefers-reduced-motion`: chapters stack and scroll natively; Foreword still renders correctly.
- Standalone `foreword.html` renders the layout with no errors.
