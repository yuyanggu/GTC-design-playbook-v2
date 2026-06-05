# Design spec — source, tokens, type, layout

The visual contract: Figma source of truth, colour/theme tokens, the type system, and the
reference layout coordinates.

## Design source

Figma file `DGg9Fqa2owVvSHvOvHBaTA` ("GTC Playbook Design (Copy)"). Key nodes:

- `1:2` type system · `2:20` typesetting sample
- `2:112` Desktop – Cover 1 (1440×1024) · `2:13723` Desktop – Cover 3 (1440×1428)
- `2:18242` scroll-state title (letters + gradient streaks, 599×710) → source of `Title_Streaks.png`
- `2043:1638` Landing_After Scroll (the after-scroll reveal state)
- `2008:147` Explore button · `2:22779` Menu (bookshelf, 1440×1024) · `2:22921` Menu hover (book 1 → orange)
  — **note:** the bookshelf menu was superseded by the right-side drawer; these nodes now match only
  `index.html`'s landing shelf, not the live Menu.
- `2:23049` (etc.) chapter pages.

## Design tokens

| Token | Value |
|------|-------|
| `--midnight` | `#012233` (Figma "Midnight") |
| `--chalk` | `#f6f2e7` (Figma "Chalk", page bg) |
| `--blue` / `--orange` / `--gray3` | `#4F94CF` (interactive books 1–3; ch2 hero) · `#F9A518` (book hover; ch1 hero/accent) · `#C7C7CC` (shelf spines) |
| `--book-dark` | `rgba(27,31,38,0.72)` (book 4 "coming soon") |
| `--sky` / `--pink` | `#73AAE5` (blue petal) · `#F394BE` (pink petal) |
| `--skeleton` / `--toc-gray` | `#D9D9D9` (TOC spine bars) · `rgba(27,31,38,0.47)` (inactive TOC row) |
| Accent palette | pink `#F394BE`, blues `#AED3ED / #73AAE5 / #4F94CF`, orange/gold (gradient only) |
| Explore pill gradient | `linear-gradient(0deg, #ffa8cd 0%, #fdd193 100%)` (pink→peach, +1px `#000`/20% inner stroke) |

### Per-chapter theme vars

Set on a chapter's `<body>` (or the `.chapter-panel` in the reader). Defaults = chapter 1's orange,
so **ch1 sets none**.

- `--hero-bg` — hero band colour
- `--hero-title` — title colour on the hero
- `--accent` — drives `.copy__heading`, `.section-head`, active TOC row + progress fill
- `--rail-fg` — rail label colour; set to `--chalk` on **dark** heroes so it stays legible
- `--flower-aspect` — hero graphic aspect ratio

Ch2 = blue (`--blue`); ch3 = midnight (`--midnight`, with `--rail-fg: --chalk`).

### Fonts

Boldonse (display), DM Sans (variable, opsz 14 — Light 300 / Medium 500 / Bold 700), Source Serif 4
(Regular + Italic). All self-hosted as woff2 from Google Fonts (`assets/fonts/`).

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

## Layout coordinates

Reference 1440-wide frames; CSS uses fluid %/vh/clamp.

- **Cover 1 (1440×1024):** eyebrow top 49 (≈4.78vh) centered · `Opening_Title.svg` 606×230
  dead-centered · subtitle top 665 (≈64.9vh) centered · `arrow.svg` top 934 (≈91.2vh) centered.
- **Cover 3 (1440×1428):** title docked top 119 (≈8.3%) and grows to 599×710 with streaks ·
  `Align_Graphic.svg` 396² at left 210 / top 915 · text block left 626 / top 915 / width 604.
