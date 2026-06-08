# The continuous reader (`playbook.html`)

The canonical way to read the playbook: all three chapters stacked in one document so scrolling
flows seamlessly from chapter to chapter. Builds on the shared chapter system
([chapter-pages.md](chapter-pages.md)) with reader-only functions in `js/chapter.js`
(`panelTransitions`, `railSync`, `railReveal`, `handleDeepLink`) and the `css/playbook.css` layer.

## Structure

Each chapter is the standalone skeleton (hero + body) wrapped in `.section.chapter-panel` (id `#chN`,
theme vars + `data-rail` label + optional `data-rail-fg` on dark heroes) → `.chapter-panel__scale`
(the layer the transition animates). One shared rail + one `#menu` + one ScrollSmoother for the
whole document.

## The chapter-to-chapter effect (`panelTransitions`)

Ported from the GSAP "stacked panels" ScrollTrigger demo. Within a chapter everything scrolls
normally (hero → body, TOC pinned). Only at the **very bottom** does the panel pin (`start "bottom
bottom"`, scrub, `pinSpacing:false`, `pinType:"transform"`) and its `.chapter-panel__scale` scale
1→0.7 + fade 1→0 while the **next chapter scrolls up and over it** (`pinSpacing:false` reserves no
spacer). The **last chapter never transitions out** (`arr.slice(0,-1)`). The demo's clipped-slide +
`fakeScrollRatio` machinery is **dropped** — our chapters are naturally tall/scrollable, so only the
boundary scale/fade is ported.

## Snap (quick, direction-biased, never half-cut)

The pin spans **exactly one viewport** (`end "+=" innerHeight`) — this is **required**, not tunable:
with `pinSpacing:false` the next chapter rises by exactly the pin distance, so it needs a full
viewport to travel from viewport-bottom up to viewport-top and land flush (shorter left it stopping
partway up). The *quickness* comes from the snap, not from shortening the pin:

```
snap: { snapTo:[0,1], directional:true, delay:0.02, duration:{min:.18,max:.34}, ease:"power2.out" }
```

`directional:true` biases the snap to the scroll direction — a small **down** nudge completes into
the next chapter, a small **up** nudge returns — and `delay:0.02` fires it almost the instant you
stop, so it commits with a flick. Snap is only active inside the pin's range, so reading within a
chapter is unaffected.

## The look (black + rounded corners)

`.chapter-panel` is **black**, seen only mid-transition — the scale pulls the shrinking chapter in
horizontally (black down both sides) while the next chapter, with its **rounded top corners**
(`.chapter-panel__scale` `border-radius` + `overflow:hidden`), rises up over it against the black.
The outgoing chapter's own top edge is off-screen (it's multi-viewport tall), so the rounded top
reads on the **incoming** chapter. The `overflow:hidden` does **not** break the in-panel TOC pin
(verified `top≈100`).

**Why outer/inner two elements:** the pin writes a `transform` to `.chapter-panel` and the
scale/fade tween writes `transform`+`opacity` to `.chapter-panel__scale` — separate elements so the
two transforms never fight (same lesson as the pinwheel traveler, see [gotchas.md](gotchas.md)). The
scale `transform-origin` is `50% calc(100% − 50vh)` so a multi-viewport chapter scales about the
**viewport** centre (it's pinned bottom-aligned), not its off-screen geometric centre.

## Coexistence

Each chapter's `stickyToc` pin ends at its `.page-body` bottom — i.e. just before that chapter's
transition pin begins — so the two don't overlap. Three TOC pins + two transition pins +
ScrollSmoother all live in one document without conflict.

## Clean URLs & deep-linking

The reader uses **path URLs, not hashes**: `/chapter-2`, `/chapter-2/designing-for-everyone`
(section level — subsections scroll-track but the URL stays at the section). The scheme lives in
**`js/routes.js`** (`window.GTCRoutes`, a classic `<head>` script loaded before everything, like
`gate.js`): a single `SECTION_SLUGS` table maps `s-XY` ids ⇄ slugs (chapters derive `/chapter-N`
from `chN`). To add/rename a section, edit that table — it's the source of truth. `GTCRoutes` exposes
`idToPath`, `pathToId`, `isReaderPath`.

Three pieces make paths work:

- **Server rewrite** — `vercel.json` (`rewrites`) + `_redirects` (Netlify/CF) serve `/playbook.html`
  for any `/chapter-*` path. **Without a rewriting host a direct visit/reload 404s** — plain
  `python3 -m http.server` does NOT rewrite, so locally open `/playbook.html` (scroll-spy still
  updates the address bar in-session); deep-path reloads only resolve once deployed. To test paths
  locally, run a rewrite shim (a tiny `SimpleHTTPRequestHandler` that maps `/chapter-*` →
  `playbook.html`).
- **`<base href="/">`** in `playbook.html` `<head>` — a section path is two segments deep, so without
  it every relative asset (`css/…`, `js/…`, `assets/…`) would resolve against `/chapter-2/` and 404.
  CSS-internal `url()`s are unaffected (they resolve against the stylesheet URL). TOC rows keep
  `href="#s-XX"`, harmless because every click is `preventDefault`-intercepted.
- **The JS** — `handleDeepLink()` resolves `location.pathname` via `GTCRoutes` (legacy `#hash` still
  works as a fallback and **auto-upgrades** to a clean path on first scroll). `urlSync()` is a single
  scroll-spy ScrollTrigger that `replaceState`s the deepest in-view anchor (chapters + section heads
  only) — `replaceState` so it neither pollutes history nor triggers a browser scroll that would
  fight ScrollSmoother. It holds off writing until `urlWriteEnabled` flips true (after the initial
  deep-link resolves) so its first frame can't clobber the incoming URL.

### Anti-flash on entry (`handleDeepLink` + `revealDeepLink`)

Arriving on a deep target used to flash Chapter 1's hero before jumping. Now a pre-paint inline
script adds `html.deeplinking` (CSS hides `#smooth-content`) whenever the path is a reader path (or a
legacy hash is present, and not gated). `handleDeepLink()` then **converges**: poll-and-correct the
live rect to the target (offset 0 for a `.chapter-panel`, 120px for a section head — matching
`scroll-margin-top`), because (a) ScrollSmoother/native scroll ignore the `panelTransitions` pins so
a cold jump undershoots, and (b) the smoother silently no-ops `scrollTo` for a few hundred ms after
load until it's ready. Once landed it fades the content in; a longstop (`setTimeout(revealDeepLink,
3200)`) guarantees the page can never stay hidden. Section heads carry the `.reveal` entrance
(`translateY(24px)`, a transform that shifts the rect but not layout), so the target is snapped to
its resting state (`gsap.set({opacity:1, y:0})`) before converging — otherwise it lands 24px low.

### Menu / book navigation

The reader's drawer rows carry `data-href="/chapter-N"`; the `index.html` books carry the same.
`wireNav` (`menuScene`) resolves the path via `GTCRoutes`: when the anchor exists in-page (the
reader) it `smoother.scrollTo`s **before the close fade runs** (unlocking page scroll first) — the
closing overlay uncovers the destination already in place, **no flash of the chapter you were on**;
`urlSync` then rewrites the address bar to the clean path. When the anchor is absent (the landing) it
falls through to a full page load to `/chapter-N` (rewritten to the reader, where `handleDeepLink`
takes over).

## Reduced motion

`panelTransitions` bails, so the chapters simply stack and scroll natively (no scale/fade); the
deep-link converge uses the `window.scrollTo` branch (smoother off). `urlSync` still runs (plain
ScrollTrigger, no smoother needed). The standalone chapter files remain as a deeper fallback (no
longer linked from any menu); they don't load `routes.js`, so their `urlSync` falls back to `#id`
hashes.
