# GTC — The Design Playbook

A polished, awwwards-grade **static single-page website** for the GovTech Consulting ("GTC")
Design Playbook. Currently the **header is built** (above-the-fold cover + the scroll
transition where a colour gradient bleeds down from the `PLAYBOOK` lettering and the intro
"What this is" section is revealed). More sections will be added below over time.

## Tech stack
- **Plain HTML / CSS / vanilla JS** (ES modules). No framework, no build step.
- **GSAP + ScrollTrigger** — the pinned, scrubbed scroll scene (title rises, gradient streaks grow).
- **motion.dev (Motion One)** — entrance micro-animations (hero load-in, intro reveal stagger).
- Everything is **vendored locally** (`vendor/`) and **fonts are self-hosted** (`assets/fonts/`) → fully offline-capable. Do not switch to CDNs.

## Run / preview
```bash
python3 -m http.server 8124    # then open http://localhost:8124/index.html
```
There is a `.claude/launch.json` config named `gtc-static` for the preview tooling.

## File map
- `index.html` — two `<section>`s: `#hero` (Cover 1 → reveal stage) and `#intro` (Cover 3 "What this is").
- `css/styles.css` — tokens (`:root`), `@font-face`, the type system, layout, motion base states.
- `js/main.js` — `heroIntro()` (motion.dev), `arrowBob()`, `scrollScene()` (GSAP pin/scrub), `introReveal()` (ScrollTrigger → motion).
- `assets/` — `Opening_Title.svg` (606×230 navy lockup), `arrow.svg` (57×45), `Align_Graphic.svg` (pinwheel), `Title_Streaks.png` (the gradient bleed, transparent, tucked behind the title letters), `fonts/`.
- `vendor/` — `gsap.min.js`, `ScrollTrigger.min.js`, `motion.esm.js`.
- `.figma_ref/` — Figma reference screenshots for visual diffing (not shipped/served).

## Design source
Figma file `DGg9Fqa2owVvSHvOvHBaTA` ("GTC Playbook Design (Copy)"). Key nodes:
- `1:2` type system · `2:20` typesetting sample
- `2:112` Desktop – Cover 1 (1440×1024) · `2:13723` Desktop – Cover 3 (1440×1428)
- `2:18242` scroll-state title (letters + gradient streaks, 599×710) → source of `Title_Streaks.png`

## Design tokens
| Token | Value |
|------|-------|
| `--midnight` | `#012233` (Figma "Midnight") |
| `--chalk` | `#f6f2e7` (Figma "Chalk", page bg) |
| Accent palette | pink `#F394BE`, blues `#AED3ED / #73AAE5 / #4F94CF`, orange/gold (gradient only) |

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

## The signature motion (gradient streaks)
The "gradient grows out of PLAYBOOK" effect = `Title_Streaks.png` (the exact Figma artwork,
cropped to **streaks-only, transparent**, at the letter baseline) sitting **behind** the crisp
`Opening_Title.svg` letters. It's revealed top→bottom by animating a CSS custom property
`--streak-hide` (100% → 0%) inside `clip-path: inset(0 0 var(--streak-hide) 0)`, scrubbed to
scroll inside the pinned hero timeline. Keep the streaks a separate layer from the letters so
the navy lettering stays vector-crisp.

## Conventions & gotchas
- Center absolutely-positioned hero elements with `left:0;right:0;margin-inline:auto` (NOT
  `transform: translateX(-50%)`) so GSAP can own the `transform` for animation without conflict.
- GSAP-animated CSS custom props must be **declared with a real initial value** (e.g.
  `--streak-hide: 100%`), otherwise GSAP reads an empty start and jumps to the end value.
- Always honour `prefers-reduced-motion`: show end-states, skip the scrub.
- After font load, call `ScrollTrigger.refresh()` (metrics shift can break pin distances).
- The preview screenshot tool may render at a different viewport than `preview_resize`/eval
  reports — trust eval/`getBoundingClientRect` measurements for exact-position verification.

## Status / next
- ✅ Header: Cover 1, pinned gradient-reveal scene, Cover 3 "What this is". Responsive + reduced-motion. No console errors.
- ⏭️ Sections below Cover 3 are not built yet.
