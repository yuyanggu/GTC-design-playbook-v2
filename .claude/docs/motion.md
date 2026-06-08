# Motion — libraries & landing choreography

Animation philosophy plus the landing-page (`index.html`) motion: hero scroll master, gradient
streaks, the pinwheel, the after-scroll reveal, cloud drift, and the magnetic button.
Chapter/reader motion lives with its surface ([chapter-pages.md](chapter-pages.md),
[reader.md](reader.md)); the universal lessons are in [gotchas.md](gotchas.md).

## Library philosophy

- **GSAP + ScrollTrigger + ScrollSmoother** own almost all motion: the page smooth-scroll
  (`#smooth-wrapper > #smooth-content`, `smooth:1`) **on chapter pages + the reader only** — the
  **landing page opts OUT** (detected by `#hero`) for native, 1:1, delay-free scroll, with its
  hero/pinwheel pins falling back to native pinning. GSAP also drives the pinned/scrubbed scenes,
  scroll fades, the pinwheel, the after-scroll reveal, the Menu drawer, the landing shelf, the cloud
  drift, and the Explore magnetic pull.
- **CustomEase + CustomWiggle** (now-free GSAP plugins) are vendored + registered but **currently
  unused** (the idle `wiggle()` was removed — the button is static at rest); kept for a possible
  hover wiggle.
- **motion.dev (Motion One)** is used for **one** entrance only (`.titleblock__media` load-in).
  Everything else is GSAP — see the "two libraries over one property" gotcha.

## Scroll choreography (home-v2)

On `index.html` everything is driven by **`heroScene()`** — one paused, reversible timeline played
on first scroll-down and reversed on scroll-up:

1. cover (`#arrow` / `.eyebrow--top` / `.lockup`) fades out,
2. the pinwheel glides UP (`pinwheelProx.scrolled` 0→1) to the header slot + shrinks,
3. the top-left `.home-logo` fades in,
4. the header **line-clip wipe** runs (its own decoupled `titleTl`),
5. the `.intro__body` paragraphs fade up,
6. the landing books/spines rise.

The **header wipe lives on its own `titleTl`** so its EXIT runs faster (`timeScale 2.2`) than its
0.8s entrance while everything else reverses at normal speed. `heroScene` early-returns on chapter
pages; under reduced motion it bails and CSS shows the after-scroll state statically.

> **Touch devices scrub.** `heroScene` branches with `gsap.matchMedia()`: `(pointer: fine)`
> keeps the timed play-once master above; `(pointer: coarse)` builds one timeline (master
> tweens + the title wipe folded in at 0.5) attached to a `scrub: 0.6`, `anticipatePin: 1`
> pinned ScrollTrigger so the transition tracks the finger 1:1 in both directions. The
> load-in (`loadTl`) is force-completed on the first scrub frame. Globally,
> `ScrollTrigger.config({ ignoreMobileResize: true })` stops the mobile address bar's
> show/hide resize from refreshing the pin mid-scroll.

> **Legacy (pre-home-v2 cover).** The old landing was two pinned scenes back-to-back:
> a scrubbed `#hero` pin (eyebrow/subtitle/arrow fade out, title block rises, streaks grow) then a
> separate `#intro` pin that ran the pinwheel rise → hold → timed align/reveal (`RISE_END`,
> `ALIGN_AT`, hysteresis `GAP`). That `#intro`/`ALIGN_AT`/`transition` machinery is no longer in the
> markup; the tunables survive inside `pinwheelScene` but are superseded by the load + scroll model below.

## The signature motion (gradient streaks)

The "gradient grows out of PLAYBOOK" effect = `title_streaks_2.png` (the gradient **PLAYBOOK** word
that bleeds down + fades out) sitting **behind** the crisp `Opening_Title.svg` letters. It's
registered to the lockup's PLAYBOOK line so the gradient letters sit exactly under the navy ones
(`left:0`, `width:100%` = full 606px lockup width; `top:52.6%` = the PLAYBOOK line, y 121 of the
606×230 lockup); the bleed extends below. Since the gradient letters are occluded by the opaque navy
letters, only the downward bleed reads.

It's revealed top→bottom by animating `--streak-hide` (100%→0%) via a **feathered `mask-image`** (a
`linear-gradient` whose black→transparent boundary tracks `100% − --streak-hide` with a ±6% soft
band), NOT a hard `clip-path`, so the reveal edge is soft (no harsh scroll line). Keep the streaks a
separate layer so the navy lettering stays vector-crisp.

## The pinwheel (rise → align → wind)

Lives in `pinwheelScene()`. The element is a **JS-injected fixed traveler** appended to `<body>`:
`.pinwheel` (outer — owns position/scale, written every frame by a `gsap.ticker` callback) →
`.pinwheel__spin` (inner — owns rotation, the wind) → `<img>`. The traveler is `aria-hidden`.

- **Home-v2 model:** on load the pinwheel rises + aligns to `#pinwheelSlot` (driven by `loadTl`);
  on scroll-down it travels UP + shrinks (~120px) to `#pinwheelSlotScrolled` via
  `pinwheelProx.scrolled`, which **`heroScene`'s master drives** through the module-level
  `pinwheelProx` shared state.
- **`place()` (per frame):** blends position + size through `prox.{rise, align, scrolled}`:
  rise (below-fold → centre) → align (centre → `#pinwheelSlot`) → scrolled (slot →
  `#pinwheelSlotScrolled`). Reads each slot's **live `getBoundingClientRect()`** so it stays
  responsive and hands off to natural scrolling once parked.
- **Wind:** `baseSpin` = endless `rotation += 360` (9s); a recursive `gust()` timeline randomly
  modulates `baseSpin.timeScale` (fast gust → calm drift) for organic, never-repeating spin.
- **Legacy tunables** (top of `pinwheelScene`, from the old `#intro` pin): `RISE_END` (0.45),
  `ALIGN_AT` (0.50, keep `RISE_END ≤ ALIGN_AT`), `CENTER_Y` (0.5), transition `duration` (0.8s).

See [gotchas.md](gotchas.md): cross-section element travel, scrubbed position + timed transition,
two transform channels.

## The after-scroll intro reveal

The landing's scroll-down state (Figma "Landing_After Scroll", node `2043:1638`): a top-left
`playbook_logo.svg`, a centred **pinwheel (≈120px) → header "A place to align, not a place to
learn." → body copy** column, and the 4-book shelf at the bottom. It replaces the cover lockup,
which fades out. Choreography is the `heroScene` master above.

- **Header line-clip:** each line is a `.line{overflow:hidden;padding-block:.2em}` wrapping a
  `<span>`; the wipe animates the span's **px `y`** (set to the measured line height) → 0. Use px
  `y`, **NOT `yPercent`** (see [gotchas.md](gotchas.md): line-clip reveal). The `padding-block`
  gives Boldonse's tall caps + comma/`g` descenders room so the clip doesn't cut glyph tops/bottoms.
- **Layout (responsive, no overlap):** `.intro-reveal` is absolutely positioned in the band
  `[top:0 → bottom:340px]` (the shelf height), `justify-content:center`, so the empty space above ==
  below and it never overlaps the shelf. Sizes (`.pinwheel-slot--scrolled`, `.intro__head`,
  `.intro__body`, gaps) use `clamp(min, min(vw, vh), max)` so the block scales with viewport
  **height**. Verified balanced + clear of the books across 2000×1050 → 1280×720 via CDP.
- **Reduced motion:** `heroScene` bails, so CSS shows the composition statically (cover hidden,
  header/body/logo shown, pinwheel parked at `#pinwheelSlotScrolled`).

## Hero "extras" fade (eyebrow / subtitle / arrow)

Animated **in** on load (GSAP `from`, captured in `heroEntrance`) and **out** on scroll (the hero
scrub, `fromTo autoAlpha 1→0`). Both are GSAP on purpose; two safeguards make the fade reliable in
both directions (see [gotchas.md](gotchas.md): load-entrance + scroll-scrub):

- the scrub uses `fromTo` with an explicit `autoAlpha:1` start + `immediateRender:false`, and
- the entrance tweens are killed on the first scroll.

## Cloud drift (`cloudDrift`)

One-direction sky drift: every `.cloud` flows LEFT→RIGHT at its own (widely staggered, index-spread)
speed, wrapping seamlessly via a `gsap.utils.wrap` modifier. Opacity is position-driven so each fades
out as it exits right / fades in entering left (× a staggered `--enter` load-in factor raised by
`loadTl`, so the two opacity owners never fight). Seeded at spread, desynced start positions; gentle
scale "breathe". Rebuilt on resize. No-op under reduced motion.

## Magnetic button ("True button")

`magneticButtons()` wires every `.mag-zone` (field) → `.mag-btn` (pill, transform target) →
`.mag-btn__bg` + `.label`. Static at rest; on `mousemove` `gsap.utils.mapRange` drives the pull
(pill `strength` 0.4, label 0.24, both `overwrite:true`), returning with `elastic.out(1,0.4)` on
leave. Only the **`--explore`** variant remains (Figma `2008:147`): pink→peach pill
(`READ THE PLAYBOOK`) on the landing; `.mag-btn__bg` carries the
`linear-gradient(0deg,#ffa8cd,#fdd193)` + inset `1px rgba(0,0,0,.2)` stroke. (The Menu's old
`--back` variant was removed with the bookshelf.)
