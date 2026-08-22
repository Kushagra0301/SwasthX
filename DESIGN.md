# Design

Visual world: **Cold Luxury**. Graphite and chrome, one saturated cobalt accent, used sparingly.
The reference points are precision instruments and machined hardware, not gyms and not clinics.
The old world (pure monochrome, Fraunces serif, uniform icon-cards) is anti-reference: it is
evidence of what this product looked like, and nothing from it carries forward.

## Theme

Dark only, locked at the page level. No light mode, no section inverts. `color-scheme: dark`
is declared so browser-drawn surfaces follow.

## Color

Defined once in `app/globals.css` as CSS custom properties, exposed to Tailwind v4 via
`@theme inline`. Components never write raw hex.

| Token | Value | Role |
|---|---|---|
| `--ink` | `#0E1013` | Page ground. Cool off-black, never `#000`. |
| `--surface` | `#16191D` | Panels and cards, one step off the ground. |
| `--raised` | `#1E2228` | Controls, inputs, chips sitting on a surface. |
| `--hairline` | `#262B32` | Default 1px separations. |
| `--edge` | `#343A43` | Hover and focus borders, stronger divisions. |
| `--text` | `#E4E8EE` | Primary text. 15.6:1 on ink. |
| `--muted` | `#9AA3AF` | Secondary text. 7.5:1 on ink, 6.9:1 on surface. |
| `--faint` | `#79828F` | Tertiary text and captions. 4.9:1 on ink, the floor. |
| `--accent` | `#2F6BFF` | Cobalt. Filled actions only, with white text (4.5:1). |
| `--accent-hover` | `#4C82FF` | Hover for filled actions. |
| `--accent-text` | `#5B8CFF` | Cobalt as *text or icon* on dark. 6.1:1 on ink. |
| `--accent-weak` | `rgb(47 107 255 / 0.10)` | Accent wash behind selected states. |
| `--positive` | `#3DDC97` | Status only. Success toasts, valid state. |
| `--negative` | `#F2555A` | Status only. Errors, destructive. |

Rules: cobalt is the only accent and it appears on every page identically. `--positive` and
`--negative` are semantic status, never decoration and never a second accent. Anything below
`--faint` in contrast is not shipped.

## Type

Three faces, loaded through `next/font/google`, each with a distinct job.

- **Space Grotesk** (`--font-display`) headings and the wordmark. Its disjointed terminals are
  the one warm-blooded thing in a cold palette. Tracking `-0.03em` at display sizes.
- **Archivo** (`--font-body`) body, labels, controls. Neutral, wide aperture, reads at 14px.
- **JetBrains Mono** (`--font-mono`) numbers that are measurements: calories, grams, sets, reps,
  days, plan IDs. Never used as a costume for "technical".

Display caps at `clamp(2.6rem, 6vw, 4.6rem)`. Body measure capped at 68ch. Numeric data uses
`font-variant-numeric: tabular-nums` so columns of figures align.

## Shape

One documented radius rule, applied everywhere:

- Panels and cards: `14px`
- Inputs, buttons, chips: `10px`
- Pills and avatars: full

No other radii. Borders are 1px `--hairline` by default; a selected control gets 1px `--accent`,
never a thicker or colored left edge.

## Depth

Shadows carry a real offset and a soft blur, tinted toward the ground rather than pure black:
`0 18px 40px -24px rgb(3 5 9 / 0.9)`. Raised controls additionally take an inset top highlight
`inset 0 1px 0 rgb(255 255 255 / 0.04)` so edges catch light like machined metal. No zero-offset
halos, no glow.

## Motion

framer-motion 13, every animated component a `'use client'` leaf. One authored moment per view
rather than an identical entrance bolted onto every section.

- Entrances: `y: 14 -> 0`, `opacity: 0 -> 1`, `ease: [0.16, 1, 0.3, 1]`, 0.55s, staggered 0.06s.
- Scroll reveals via `useInView({ once: true, amount: 0.25 })`, never a scroll event listener.
- Pointer physics via `useMotionValue`/`useSpring`, never React state.
- Result numbers count up once on arrival, because the number is the payload.
- Everything collapses to a static, already-visible default under `prefers-reduced-motion`,
  checked with `useReducedMotion()`.

## Browser surfaces

Themed from the palette, not left to the browser: text selection, caret, custom scrollbar,
focus ring (2px `--accent-text` at 2px offset), `::placeholder`, underline offset, and tabular
numerals.

## Structural bans

Carried from the craft floor and binding on every surface here:

- No eyebrow or kicker labels above headings.
- No grid of same-size icon + heading + text cards as page structure.
- No hero stat block of big number over small label.
- No section numbers (01 / 02 / 03).
- No nested cards. A panel does not contain another panel with its own border and background.
- No gradient text, no glass-as-decoration, no colored left borders.
- No invented proof: no fake logos, counts, testimonials, or precision specs.

## Icons

Phosphor, via `react-icons/pi`, one family across the app, `weight="regular"` equivalent set at
a consistent size per context (16px inline, 20px in controls, 24px in feature positions). The
previous Feather set is fully retired. No emoji and no unicode glyphs standing in for icons.
