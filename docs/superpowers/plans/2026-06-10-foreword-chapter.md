# Foreword (Chapter 0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Foreword ("Chapter 0") panel to the continuous reader before Chapter 1, matching Figma `2146:5238` (chalk, no hero, no TOC), reachable at `/foreword`, and remove the now-superseded first-visit Prologue modal entirely.

**Architecture:** The Foreword is a standard `.chapter-panel` (`#ch0`) so it inherits the reader's existing machinery — `panelTransitions`, `railSync`, `railReveal`, `urlSync`, `copyReveals` — with almost no JS change (`panels = toArray(".chapter-panel")` already picks it up). It reuses the `.copy`/`.subsection-head` type system. The only JS edits are a `/foreword` route special-case and broadening the standalone-page init guard (the no-hero standalone page would otherwise skip `copyReveals` and render its `.reveal` blocks invisible).

**Tech Stack:** Plain HTML / CSS / vanilla JS (ES modules), GSAP + ScrollTrigger + ScrollSmoother, no build step. Verification is by `grep` + headless Chrome via CDP (see `.claude/docs/gotchas.md` → headless verification and the `headless-motion-verification` memory), not a unit-test framework.

**Spec:** `docs/superpowers/specs/2026-06-10-foreword-chapter-design.md`

**Canonical copy (use these four blocks verbatim; HTML entities to match the chapter convention):**

1. **For us, the GTC Design Team** — This playbook is for us, the GovTech Consulting Design team. We focus on a specific part of design: discovery and creating the conditions for action. Not building, not developing. We work upstream, where the problem gets defined and the direction gets set. If you&rsquo;re on the team, this is your document.
2. **Open for a reason** — Because good thinking gets sharper with honest reactions. We made it public so anyone can read it, push back on it, or bring it up over a meal. That kind of conversation is exactly what we&rsquo;re hoping for.
3. **Not a methods guide** — You won&rsquo;t find research techniques or workshop instructions here. What you will find is our point of view: on what design actually is and where it&rsquo;s going, on why discovery is changing more dramatically than most people realise, on why prototyping means building to test and not building to release, on how the lines between design, product, and engineering are shifting, and on what it means to do all of this in government, for the public, at this particular moment in time.
4. **Always in draft** — This is not an excuse to leave things unfinished. It&rsquo;s a declaration that we are in a moment of genuine flux, learning by doing, testing what we believe, and updating this as we go. Every project is a prototype. So is this.

---

## File map

| File | Responsibility | Change |
|---|---|---|
| `playbook.html` | reader document | add `#ch0` panel before `#ch1`; convert menu Prologue button → Foreword link; remove `#prologue` block + its `<link>`/`<script>` |
| `css/chapter.css` | interior page system | add `.foreword*` block |
| `js/routes.js` | clean-URL table | `ch0 ⇄ /foreword`; `isReaderPath` matches `/foreword` |
| `js/chapter.js` | shared page motion | broaden standalone init guard to include the no-hero Foreword page |
| `foreword.html` | standalone fallback | new file |
| `index.html` | landing | remove `#prologue` block, `<link>`/`<script>`, and the `.intro__prologue` button |
| `js/main.js` | landing motion | remove the two `.intro__prologue` tween lines |
| `css/styles.css` | global styles | remove the two `.intro__prologue` rules |
| `css/prologue.css`, `js/prologue.js`, `assets/prologue.webp` | prologue modal | delete |
| `.claude/docs/*`, `CLAUDE.md` | docs | note the Foreword |

> **Local serving note:** `python3 -m http.server 8124` does not rewrite `/foreword` → `playbook.html`. Test reader behaviour by opening `/playbook.html` directly. The `/foreword` *deep-link reload* (Task 3 verify) only resolves behind a rewrite shim; if no shim is available, verify the route mapping by evaluating `window.GTCRoutes` in the page console / CDP instead.

---

### Task 1: Add the `#ch0` Foreword panel to the reader

**Files:**
- Modify: `playbook.html` (insert immediately before the `<!-- ═══ CHAPTER 1 — Why we exist ═══ -->` comment, inside `<main class="playbook">`)

- [ ] **Step 1: Insert the panel**

Find this line in `playbook.html`:

```html
    <!-- ═══════════════════════ CHAPTER 1 — Why we exist ═══════════════════════ -->
```

Insert immediately **before** it:

```html
    <!-- ═══════════════════════ CHAPTER 0 — Foreword ═══════════════════════ -->
    <!-- No coloured hero, no TOC (Figma 2146:5238). It's a .chapter-panel so it
         inherits panelTransitions / railSync / railReveal / urlSync / copyReveals;
         data-rail drives the rail label; --accent is midnight (no themed accent). -->
    <section class="section chapter-panel chapter-panel--foreword" id="ch0"
             data-rail="foreword"
             style="--accent: var(--midnight);">
     <div class="chapter-panel__scale">
      <section class="page-body foreword">
        <div class="page-body__canvas">
          <h1 class="foreword__title reveal">Foreword</h1>
          <img class="foreword__graphic reveal" src="assets/foreword_Graphic.png"
               width="1440" height="291" alt="" />
          <article class="copy foreword__copy">
            <h2 class="subsection-head reveal">For us, the GTC Design Team</h2>
            <p class="reveal">This playbook is for us, the GovTech Consulting Design team. We focus on a specific part of design: discovery and creating the conditions for action. Not building, not developing. We work upstream, where the problem gets defined and the direction gets set. If you&rsquo;re on the team, this is your document.</p>

            <h2 class="subsection-head reveal">Open for a reason</h2>
            <p class="reveal">Because good thinking gets sharper with honest reactions. We made it public so anyone can read it, push back on it, or bring it up over a meal. That kind of conversation is exactly what we&rsquo;re hoping for.</p>

            <h2 class="subsection-head reveal">Not a methods guide</h2>
            <p class="reveal">You won&rsquo;t find research techniques or workshop instructions here. What you will find is our point of view: on what design actually is and where it&rsquo;s going, on why discovery is changing more dramatically than most people realise, on why prototyping means building to test and not building to release, on how the lines between design, product, and engineering are shifting, and on what it means to do all of this in government, for the public, at this particular moment in time.</p>

            <h2 class="subsection-head reveal">Always in draft</h2>
            <p class="reveal">This is not an excuse to leave things unfinished. It&rsquo;s a declaration that we are in a moment of genuine flux, learning by doing, testing what we believe, and updating this as we go. Every project is a prototype. So is this.</p>
          </article>
        </div>
      </section>
     </div><!-- /.chapter-panel__scale -->
    </section>

```

- [ ] **Step 2: Sanity-check the markup**

Run: `cd "/Users/yuyang/GTC Design Playbook Site" && grep -n 'id="ch0"\|foreword__title\|foreword__graphic\|Always in draft' playbook.html`
Expected: four matches, all inside the new block, appearing **before** the `id="ch1"` line.

Run: `grep -c 'class="section chapter-panel' playbook.html`
Expected: `4` (ch0, ch1, ch2, ch3).

- [ ] **Step 3: Visual check (no CSS yet — structure only)**

Serve and screenshot:
```bash
cd "/Users/yuyang/GTC Design Playbook Site" && python3 -m http.server 8124 >/dev/null 2>&1 &
```
Open `http://localhost:8124/playbook.html` headless via CDP (per `gotchas.md`); confirm the page loads with the Foreword content at the very top and **no console errors**. (Layout will be rough until Task 2.)

- [ ] **Step 4: Commit**

```bash
cd "/Users/yuyang/GTC Design Playbook Site" && git add playbook.html && git commit -m "feat(reader): add Foreword (ch0) panel before chapter 1"
```

---

### Task 2: Style the Foreword layout

**Files:**
- Modify: `css/chapter.css` (append a new block; a natural spot is right after the `.page-body` rules near line 167–177, or at end of the BODY section)

- [ ] **Step 1: Add the CSS**

Append this block to `css/chapter.css` (place it after the `.page-body` / `.body-left` rules):

```css
/* ---------------------------------------------------------------------------
   FOREWORD (chapter 0) — chalk page, no hero, no TOC (Figma 2146:5238).
   Title sits top-left on chalk (clearing the fixed topbar); a full-width orb
   banner; then the standard offset .copy column. min-height keeps the panel
   taller than one viewport so its chapter-to-chapter transition into C1 reads.
   --------------------------------------------------------------------------- */
.chapter-panel--foreword .page-body.foreword {
  min-height: 100vh;
  padding-top: clamp(96px, 12vh, 140px);   /* clears the topbar logo/hamburger */
}
.foreword__title {
  margin: 0 0 0 clamp(20px, 5vw, 78px);    /* hug the left, ~78px gutter at 1440 (Figma) */
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(2.2rem, 5.2vw, 75px);
  line-height: 1.6;
  color: var(--midnight);
}
.foreword__graphic {
  display: block;
  width: 100%;
  height: auto;
  margin: clamp(24px, 4vh, 40px) 0;        /* banner sits between title and copy */
}
/* The copy column keeps the shared .copy offset; just trim its top padding so it
   follows the banner rather than the (absent) hero band. */
.foreword__copy { padding-top: clamp(32px, 5vh, 78px); }
```

- [ ] **Step 2: Verify the rule lands**

Run: `cd "/Users/yuyang/GTC Design Playbook Site" && grep -n 'chapter-panel--foreword\|foreword__title\|foreword__graphic\|foreword__copy' css/chapter.css`
Expected: four matches.

- [ ] **Step 3: Visual check vs Figma**

Reload `http://localhost:8124/playbook.html` headless via CDP, screenshot at 1440×900. Confirm:
- "Foreword" title top-left in Boldonse, midnight, clearing the topbar.
- Orb banner full-width below the title.
- The four copy blocks in the right-offset column (left half empty), DM Sans headings + Source Serif body.
- Reveals fire (blocks visible after entering); no console errors.

Compare against the Figma screenshot (node `2146:5238`).

- [ ] **Step 4: Responsive check**

Screenshot at 900×900 (below the 1180 breakpoint): copy collapses to a single centred column; title/banner remain full-width and legible.

- [ ] **Step 5: Commit**

```bash
cd "/Users/yuyang/GTC Design Playbook Site" && git add css/chapter.css && git commit -m "feat(reader): style Foreword layout (title, banner, copy)"
```

---

### Task 3: Route `/foreword` ↔ `#ch0`

**Files:**
- Modify: `js/routes.js`

- [ ] **Step 1: Map the chapter list to include ch0 with a custom path**

In `js/routes.js`, replace this block:

```js
  ["ch1", "ch2", "ch3"].forEach(function (cid) {
    var path = "/chapter-" + cid.slice(2);
    byId[cid] = path;
    byPath[path] = cid;
  });
```

with:

```js
  // ch0 is the Foreword — it opts out of the /chapter-N scheme and lives at /foreword.
  byId["ch0"] = "/foreword";
  byPath["/foreword"] = "ch0";

  ["ch1", "ch2", "ch3"].forEach(function (cid) {
    var path = "/chapter-" + cid.slice(2);
    byId[cid] = path;
    byPath[path] = cid;
  });
```

- [ ] **Step 2: Extend `isReaderPath` to match `/foreword`**

Replace:

```js
    isReaderPath: function (path) { return /^\/chapter-\d+(\/|$)/.test(norm(path)); },
```

with:

```js
    isReaderPath: function (path) {
      var p = norm(path);
      return p === "/foreword" || /^\/chapter-\d+(\/|$)/.test(p);
    },
```

- [ ] **Step 3: Verify the mapping in the page**

Reload `http://localhost:8124/playbook.html`; in the CDP/JS console evaluate:
```js
GTCRoutes.idToPath("ch0")        // → "/foreword"
GTCRoutes.pathToId("/foreword")  // → "ch0"
GTCRoutes.isReaderPath("/foreword") // → true
```
Expected: the three values above.

- [ ] **Step 4: Verify scroll-spy writes the path**

Scroll to the Foreword (top of `/playbook.html`) after load settles; the address bar should read `…/foreword` (urlSync `replaceState`). Scroll into Chapter 1; it should change to `/chapter-1`.

- [ ] **Step 5: Commit**

```bash
cd "/Users/yuyang/GTC Design Playbook Site" && git add js/routes.js && git commit -m "feat(routes): map /foreword <-> ch0"
```

---

### Task 4: Drawer-menu Foreword row

**Files:**
- Modify: `playbook.html` (the `.menu__list` item currently holding the `data-prologue-open` button)

- [ ] **Step 1: Replace the Prologue menu item with a Foreword link**

Find this `<li>` in `playbook.html`:

```html
        <li class="menu__item">
          <!-- Reopens the prologue note; data-menu-close lets menuScene close the drawer on the same click. -->
          <button class="menu__row menu__row--prologue" type="button" data-prologue-open data-menu-close>
            <span class="menu__icon" aria-hidden="true"></span>
            <span class="menu__text">
              <span class="menu__num">00</span>
              <span class="menu__title">Prologue</span>
            </span>
          </button>
        </li>
```

Replace it with:

```html
        <li class="menu__item">
          <a class="menu__row" data-href="/foreword" href="/foreword">
            <span class="menu__icon" aria-hidden="true"></span>
            <span class="menu__text">
              <span class="menu__num">00</span>
              <span class="menu__title">Foreword</span>
            </span>
          </a>
        </li>
```

(Note: this is also the line range that may carry a trailing comment/whitespace — match on the `data-prologue-open` button text. The icon slot stays empty: there is no `menu_0.svg`, matching how the Prologue row looked.)

- [ ] **Step 2: Verify**

Run: `cd "/Users/yuyang/GTC Design Playbook Site" && grep -n 'menu__row--prologue\|data-prologue-open\|data-href="/foreword"' playbook.html`
Expected: only the `data-href="/foreword"` match remains (the two prologue matches are gone).

- [ ] **Step 3: Behaviour check**

Reload `/playbook.html`, open the drawer (hamburger), click the "00 Foreword" row: the drawer closes and the reader smooth-scrolls to the Foreword (`#ch0`); the address bar shows `/foreword`. No console errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/yuyang/GTC Design Playbook Site" && git add playbook.html && git commit -m "feat(menu): Foreword row deep-links to /foreword"
```

---

### Task 5: Remove the Prologue modal from `playbook.html`

**Files:**
- Modify: `playbook.html`

- [ ] **Step 1: Remove the stylesheet link**

Delete this line:
```html
  <link rel="stylesheet" href="css/prologue.css" />
```

- [ ] **Step 2: Remove the script tag**

Delete this line:
```html
  <script type="module" src="js/prologue.js"></script>
```

- [ ] **Step 3: Remove the `#prologue` overlay markup**

Delete the entire block beginning with:
```html
  <!-- Prologue — first-visit note overlay (js/prologue.js); hidden until opened. -->
  <div class="prologue" id="prologue" role="dialog" aria-modal="true" aria-labelledby="prologueTitle" hidden>
```
through its closing `</div>` (the outermost `.prologue` div — ends just before the `<script src="vendor/gsap.min.js">` block).

- [ ] **Step 4: Verify no prologue refs remain**

Run: `cd "/Users/yuyang/GTC Design Playbook Site" && grep -in 'prologue' playbook.html`
Expected: **no output**.

- [ ] **Step 5: Behaviour check**

Reload `/playbook.html`: loads clean, no 404 for `prologue.css`/`prologue.js` in the network log, no console errors, reader + menu still work.

- [ ] **Step 6: Commit**

```bash
cd "/Users/yuyang/GTC Design Playbook Site" && git add playbook.html && git commit -m "chore(reader): remove prologue modal (superseded by Foreword)"
```

---

### Task 6: Remove the Prologue from `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Remove the stylesheet link**

Delete:
```html
  <link rel="stylesheet" href="css/prologue.css" />
```

- [ ] **Step 2: Remove the script tag**

Delete:
```html
  <script type="module" src="js/prologue.js"></script>
```

- [ ] **Step 3: Remove the intro Prologue button**

Delete this line inside `.intro-reveal`:
```html
          <button class="intro__prologue" type="button" data-prologue-open>Prologue</button>
```

- [ ] **Step 4: Remove the `#prologue` overlay markup**

Delete the entire block beginning with:
```html
  <!-- Prologue — first-visit note overlay (js/prologue.js); hidden until opened. -->
  <div class="prologue" id="prologue" role="dialog" aria-modal="true" aria-labelledby="prologueTitle" hidden>
```
through its closing outermost `</div>`.

- [ ] **Step 5: Verify**

Run: `cd "/Users/yuyang/GTC Design Playbook Site" && grep -in 'prologue' index.html`
Expected: **no output**.

- [ ] **Step 6: Behaviour check**

Reload `http://localhost:8124/index.html` headless; the landing cover + after-scroll intro reveal still work, no 404s, no console errors, and no "Prologue" button appears in the intro.

- [ ] **Step 7: Commit**

```bash
cd "/Users/yuyang/GTC Design Playbook Site" && git add index.html && git commit -m "chore(landing): remove prologue modal + intro trigger"
```

---

### Task 7: Remove the `.intro__prologue` motion/style hooks

**Files:**
- Modify: `js/main.js` (lines ~144 and ~160)
- Modify: `css/styles.css` (lines ~385 and ~393)

- [ ] **Step 1: Remove the `gsap.set` line in `main.js`**

Delete:
```js
  gsap.set(".intro__prologue", { autoAlpha: 0, y: 18 });   // reveals with the intro text, never on the cover
```

- [ ] **Step 2: Remove the `.to` tween line in `main.js`**

Delete:
```js
      .to(".intro__prologue", { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 1.05);
```
Note: this line ends a tween chain with `;`. After removal, ensure the **previous** `.to(...)` in that chain now ends the statement with `;` (it likely ends in `)` followed by this line). If the previous line ends in `)` without a semicolon, add one so the chain terminates correctly. Verify the file parses (Step 4).

- [ ] **Step 3: Remove the two `.intro__prologue` rules in `styles.css`**

Delete:
```css
.js .intro__prologue { opacity: 0; }
```
and (inside its media block):
```css
  .js .intro__prologue { opacity: 1; }
```

- [ ] **Step 4: Verify no refs remain + JS parses**

Run: `cd "/Users/yuyang/GTC Design Playbook Site" && grep -rin 'intro__prologue\|prologue' js/main.js css/styles.css`
Expected: **no output**.

Run: `node --check js/main.js`
Expected: no output (exit 0 — valid syntax).

- [ ] **Step 5: Behaviour check**

Reload `/index.html` headless; intro reveal animates with no errors (the removed button no longer referenced).

- [ ] **Step 6: Commit**

```bash
cd "/Users/yuyang/GTC Design Playbook Site" && git add js/main.js css/styles.css && git commit -m "chore: drop intro__prologue tween + styles"
```

---

### Task 8: Delete the prologue files

**Files:**
- Delete: `css/prologue.css`, `js/prologue.js`, `assets/prologue.webp`

- [ ] **Step 1: Confirm nothing references them anymore**

Run: `cd "/Users/yuyang/GTC Design Playbook Site" && grep -rln 'prologue' --include=*.html --include=*.js --include=*.css .`
Expected: **no output** (only `docs/**` specs may mention it — those are fine).

- [ ] **Step 2: Delete the files**

Run:
```bash
cd "/Users/yuyang/GTC Design Playbook Site" && git rm css/prologue.css js/prologue.js assets/prologue.webp
```
(If `assets/prologue.webp` is still untracked rather than committed, use `rm -f assets/prologue.webp` instead.)

- [ ] **Step 3: Verify**

Run: `cd "/Users/yuyang/GTC Design Playbook Site" && ls css/prologue.css js/prologue.js assets/prologue.webp 2>&1`
Expected: three "No such file" errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/yuyang/GTC Design Playbook Site" && git add -A && git commit -m "chore: delete prologue css/js/asset"
```

---

### Task 9: Let the standalone init path cover the no-hero Foreword

**Files:**
- Modify: `js/chapter.js` (the `else if (document.querySelector(".page-hero"))` branch, ~line 43)

**Why:** `panels = toArray(".chapter-panel")` already initialises `#ch0` in the reader (first branch). But the standalone `foreword.html` (Task 10) has **no `.page-hero`**, so the standalone branch would skip `initChapter(document)`, leaving its `.reveal` blocks stuck at `opacity:0` (`.js .reveal` rule). Broaden the guard to also match the Foreword page.

- [ ] **Step 1: Broaden the condition**

Replace:
```js
} else if (document.querySelector(".page-hero")) {
```
with:
```js
} else if (document.querySelector(".page-hero, .page-body.foreword")) {
  // .page-body.foreword → the standalone Foreword page (no hero). Reader panels
  // are handled by the branch above, so this only matches the standalone file.
```

- [ ] **Step 2: Verify the reader is unaffected**

Reload `/playbook.html` headless: still reaches the `panels.length` branch (4 panels), reveals + transitions work, no console errors. (`node --check js/chapter.js` → exit 0.)

- [ ] **Step 3: Commit**

```bash
cd "/Users/yuyang/GTC Design Playbook Site" && node --check js/chapter.js && git add js/chapter.js && git commit -m "feat(chapter): standalone init covers the no-hero Foreword page"
```

---

### Task 10: Standalone `foreword.html` fallback

**Files:**
- Create: `foreword.html`

Model on the other standalone chapter pages' shell (topbar, fixed rail, `#menu` drawer, `main.js` + `chapter.js`, **no** `routes.js`), with the Foreword body (no `.page-hero`, no `.toc`).

- [ ] **Step 1: Read the reference shell**

Read `why-we-exist.html` in full to copy its exact `<head>` (stylesheets, font preloads, `gate.js`, favicon), `.topbar`, `.rail`, `#smooth-wrapper`/`#smooth-content` wrappers, the `#menu` drawer markup, and the trailing vendor + module `<script>` tags. Reproduce those wrappers exactly; only the `<main>` body differs.

- [ ] **Step 2: Write `foreword.html`**

Create `foreword.html` with the same shell as `why-we-exist.html`, except:
- `<title>`: `Foreword — The Design Playbook`.
- **Do NOT** include `<script src="js/routes.js">` (standalone pages omit it, like the other chapter files).
- Rail label: `<p class="rail__label">foreword</p>`.
- The `<main>` content is the Foreword body **without** the `.chapter-panel`/`.chapter-panel__scale` wrappers:

```html
  <div id="smooth-wrapper">
    <div id="smooth-content">
      <main class="playbook">
        <section class="page-body foreword chapter-panel--foreword">
          <div class="page-body__canvas">
            <h1 class="foreword__title reveal">Foreword</h1>
            <img class="foreword__graphic reveal" src="assets/foreword_Graphic.png"
                 width="1440" height="291" alt="" />
            <article class="copy foreword__copy">
              <h2 class="subsection-head reveal">For us, the GTC Design Team</h2>
              <p class="reveal">This playbook is for us, the GovTech Consulting Design team. We focus on a specific part of design: discovery and creating the conditions for action. Not building, not developing. We work upstream, where the problem gets defined and the direction gets set. If you&rsquo;re on the team, this is your document.</p>

              <h2 class="subsection-head reveal">Open for a reason</h2>
              <p class="reveal">Because good thinking gets sharper with honest reactions. We made it public so anyone can read it, push back on it, or bring it up over a meal. That kind of conversation is exactly what we&rsquo;re hoping for.</p>

              <h2 class="subsection-head reveal">Not a methods guide</h2>
              <p class="reveal">You won&rsquo;t find research techniques or workshop instructions here. What you will find is our point of view: on what design actually is and where it&rsquo;s going, on why discovery is changing more dramatically than most people realise, on why prototyping means building to test and not building to release, on how the lines between design, product, and engineering are shifting, and on what it means to do all of this in government, for the public, at this particular moment in time.</p>

              <h2 class="subsection-head reveal">Always in draft</h2>
              <p class="reveal">This is not an excuse to leave things unfinished. It&rsquo;s a declaration that we are in a moment of genuine flux, learning by doing, testing what we believe, and updating this as we go. Every project is a prototype. So is this.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  </div>
```
The `chapter-panel--foreword` class is included on the `.page-body` so the `min-height`/`padding-top` rule from Task 2 applies on the standalone page too (the rule selector is `.chapter-panel--foreword .page-body.foreword`).

> **Correction:** the Task 2 selector is `.chapter-panel--foreword .page-body.foreword` (descendant). On the standalone page there is no separate `.chapter-panel--foreword` ancestor. So put **both** classes on the single element AND adjust the Task 2 selector to also match a single element — see Step 3.

- [ ] **Step 3: Make the Task-2 min-height rule match the standalone element**

In `css/chapter.css`, change the Foreword body selector so it matches both the reader (ancestor + descendant) and the standalone (same element):

Replace:
```css
.chapter-panel--foreword .page-body.foreword {
```
with:
```css
.chapter-panel--foreword .page-body.foreword,
.page-body.foreword.chapter-panel--foreword {
```

- [ ] **Step 4: Verify standalone renders**

Open `http://localhost:8124/foreword.html` headless via CDP, screenshot 1440×900. Confirm: Foreword title top-left, banner, copy column all **visible** (reveals ran via the broadened init from Task 9), rail shows "foreword", menu opens, no console errors. (`node --check` not needed — HTML.)

- [ ] **Step 5: Commit**

```bash
cd "/Users/yuyang/GTC Design Playbook Site" && git add foreword.html css/chapter.css && git commit -m "feat: standalone foreword.html fallback page"
```

---

### Task 11: Update docs

**Files:**
- Modify: `CLAUDE.md` (Status/next + the surfaces sentence), `.claude/docs/chapter-pages.md`, `.claude/docs/reader.md`, `.claude/docs/architecture.md`

- [ ] **Step 1: Note the Foreword in `reader.md`**

In `.claude/docs/reader.md` → "Structure", add a sentence: the reader now opens with a **Foreword** panel (`#ch0`, `.chapter-panel--foreword`) before `#ch1` — chalk, no hero, no TOC — that transitions into C1 like any panel; its clean path is `/foreword` (a `routes.js` special-case, not `/chapter-0`).

- [ ] **Step 2: Note the Foreword layout in `chapter-pages.md`**

Add a short "Foreword (chapter 0)" note: no hero / no TOC variant of the page system; title on chalk top-left via `.foreword__title`, full-width `assets/foreword_Graphic.png` banner via `.foreword__graphic`, then the shared `.copy` column. Lives in the reader (`#ch0`) and as standalone `foreword.html`.

- [ ] **Step 3: Note files in `architecture.md`**

Add `foreword.html` to the page/file map (a fourth standalone page, unlinked fallback) and mention the `/foreword` route special-case in `routes.js`. Remove any prologue.css/prologue.js entries if present.

- [ ] **Step 4: Update `CLAUDE.md` status**

- Update the surfaces sentence (landing / reader / standalone) to mention the reader now opens with the Foreword.
- In Status/next, add a ✅ line for the Foreword chapter, and remove the Prologue modal from any status/next notes if mentioned.

- [ ] **Step 5: Verify**

Run: `cd "/Users/yuyang/GTC Design Playbook Site" && grep -rin 'foreword' CLAUDE.md .claude/docs/`
Expected: matches in `reader.md`, `chapter-pages.md`, `architecture.md`, `CLAUDE.md`.

- [ ] **Step 6: Commit**

```bash
cd "/Users/yuyang/GTC Design Playbook Site" && git add CLAUDE.md .claude/docs && git commit -m "docs: document the Foreword chapter + /foreword route"
```

---

### Task 12: Full-flow verification

**Files:** none (verification only)

- [ ] **Step 1: Reader end-to-end (headless CDP)**

With the server running, load `/playbook.html` and, per `gotchas.md` headless verification (drive the GSAP ticker manually if needed):
- Foreword renders chalk, no hero, title top-left, banner, four copy blocks (reveals fired).
- Scroll `ch0 → ch1`: the panel scale/fade transition fires and Chapter 1's orange hero rises over with rounded top corners.
- Rail reads "foreword" over the Foreword, then switches to "why we exist, and the moment" entering C1.
- Address bar: `/foreword` over the Foreword → `/chapter-1` in C1.
- No console errors anywhere in the scroll.

- [ ] **Step 2: Menu + standalone**

- Drawer "00 Foreword" row scrolls to `#ch0` and sets `/foreword`.
- `/foreword.html` (standalone) renders correctly with visible copy + rail.

- [ ] **Step 3: Reduced motion**

Emulate `prefers-reduced-motion: reduce` (CDP `Emulation.setEmulatedMedia`); reload `/playbook.html`: chapters stack and scroll natively, Foreword copy is fully visible (no hidden `.reveal`), no errors.

- [ ] **Step 4: No prologue residue anywhere**

Run: `cd "/Users/yuyang/GTC Design Playbook Site" && grep -rln 'prologue' --include=*.html --include=*.js --include=*.css .`
Expected: **no output**.

- [ ] **Step 5: Final tidy commit (if any verification fixes were needed)**

```bash
cd "/Users/yuyang/GTC Design Playbook Site" && git add -A && git commit -m "fix: foreword verification follow-ups" || echo "nothing to commit"
```

---

## Self-review notes

- **Spec coverage:** panel (T1), CSS/Figma match (T2), `/foreword` route + `isReaderPath` (T3), drawer menu (T4), prologue removal across playbook/index/main/styles/files (T5–T8), standalone page (T9–T10), docs (T11), verification incl. reduced-motion + deep-link (T3/T12). All spec sections map to a task.
- **No-hero standalone gotcha** is handled explicitly (T9) — without it the standalone copy would be invisible.
- **CSS selector consistency:** the Foreword body min-height rule is introduced in T2 and broadened in T10/Step 3 to match the standalone single-element case; both reference `.page-body.foreword` + `.chapter-panel--foreword`. Class names (`foreword__title`, `foreword__graphic`, `foreword__copy`) are identical across T1, T2, T10.
- **No new assets needed** — `assets/foreword_Graphic.png` (1440×291) already exists.
