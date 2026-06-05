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

## Menu deep-linking

The reader's drawer rows carry in-page `data-href="#chN"`; `menuScene` does
`smoother.scrollTo(target, false)` **on click, before the close fade runs** (unlocking page scroll
first) — so the closing overlay uncovers the destination already in place, with **no flash of the
chapter you were on**. (Scrolling *after* the fade — the obvious order — showed the old chapter for a
beat, then jumped.) Arriving with a `#chN` hash from another page (the `index.html` books are
`playbook.html#chN`) is handled by `handleDeepLink()` on load, which jumps instantly after pin
spacing is finalised. Both land you at the chapter top; scrolling on runs the next transition normally.

## Reduced motion

`panelTransitions` bails, so the chapters simply stack and scroll natively (no scale/fade);
deep-link falls back to `scrollIntoView`. The standalone chapter files remain as a deeper fallback
(no longer linked from any menu).
