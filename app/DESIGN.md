# DESIGN.md — NoticeRadar · "Signal" visual system (v2 · full rebuild)

> This is a ground-up rebuild. The previous quiet-green administrative system
> is retired. Every value below is a fresh position, NOT an evolution.

## Platform
Web SPA — React 19 + TypeScript + Vite + Tailwind v4 (CSS-token driven).

## Mode
- **Public site:** Persuade + Experience → motion may carry the voice; one rehearsed hero sequence, bold scroll reveals.
- **Student portal:** Operate + Read → expressive but fast; motion = feedback & continuity.
- **Admin portal:** Operate + verify → charged, confident, efficient.

## Visual World
**"Signal on a switchboard — dark."** Near-black warm canvas (`#0e0b05`), dark olive ink
replaced by warm sand text (`#dfc5a2`), lime accent (`#c4f204`) used sparingly. Editorial
neo-brutalist edges (2px ink borders + offset hard shadows) softened by rounded corners. Big
grotesk type carries the hierarchy; colour does the shouting so the structure stays calm.
Bento grids, no zebra tables, no glassmorphism.

## Colour Strategy — dark theme, dominant surface + sparing lime accent
Dark canvas is the gravity. Hierarchy is carried by **type weight + scale**, not colour.
The 5-colour palette maps as: warm sand `#dfc5a2` = light ink on dark · dark olive `#759104` =
border / secondary · taupe `#ab895d` = muted text · lime `#c4f204` = accent (sparing: CTAs,
loud marker, active dots only — ≤5% of any screen) · muted beige `#caaf90` = elevated surface /
info.

| Role | Token | Dark | Use |
|------|-------|------|-----|
| Canvas (dominant surface) | `bg` | `#0e0b05` | near-black warm — main background |
| Cards / elevated | `bg-elevated` | `#16120a` | card surfaces |
| Hover surface | `bg-hover` | `#1f1910` | interactive hover |
| Border | `border` | `#2d2416` | 1.5px ink borders |
| Border strong | `border-strong` | `#4a3d25` | active / focused borders |
| Ink (light on dark) | `text` | `#dfc5a2` | warm sand text — primary |
| Muted | `text-muted` | `#ab895d` | taupe secondary text |
| Text inverted | `text-inverted` | `#0e0b05` | dark text on lime / light surfaces |
| **Accent (sparing)** | `accent` | `#c4f204` | lime — CTAs, loud marker, active dots only |
| Accent soft | `accent-soft` | `rgba(196,242,4,0.15)` | subtle lime tint |
| **Loud (sparing!)** | `loud` | `#c4f204` | ONE highlighted word per headline, marker streaks |
| Loud ink | `loud-ink` | `#0e0b05` | dark text on lime for AA contrast |
| Secondary (taupe) | `coral` | `#ab895d` | soft secondary accents |
| Coral soft | `coral-soft` | `rgba(171,137,93,0.15)` | subtle taupe tint |
| Functional | `danger / warning / success / info` | red/amber/green/`#caaf90` | status only, never decoration |

Rules: accent `#c4f204` never as body-text background — on dark it sits behind ink text
(`loud-ink #0e0b05`) or as a streak; use `text-loud-ink` on `bg-accent`. Lean on
`font-semibold`/`font-bold` and the `clamp()` type scale for hierarchy before reaching
for colour.

## Typography
- **Display: Archivo Variable** (installed via @fontsource) — grotesk, weight 600–800, `tracking: -0.03em`, used for every `h1–h4` and `.text-display` via `--font-display`.
- **Body: system-ui stack.**
- Scale: display `clamp(2.5rem, 6vw, 4.5rem)` · h1 2rem · h2 1.5rem · h3 1.25rem · h4 1.0625rem · body 0.9375rem · caption 0.8125rem. Display scale jump ≥ 3:1 vs body (inspo consensus).

## Spacing & Layout
- Section rhythm: **clamp(80px, 10vw, 128px)** at every vertical seam (`.section`), single rhythm, no exceptions.
- Content column: `max-w-[min(1200px,100%)]` with symmetric `padding-inline` ≥ 24px mobile.
- Bento grids: irregular `grid-template-areas`, the lead tile spans 2×; typography—not icons—supplies tile variety.

## Surface Craft
- Cards: `rounded-xl` + `border 1.5px border-ink` + **hard offset shadow** `4px 4px 0 color(sometone)`. Hover: shadow grows to `6px 6px 0` + lift `translateY(-2px)` (150ms ease-out).
- Buttons: primary = indigo → coral gradient on hover; secondary = ink border pill; ghost = bare.
- Pills/badges: loud dot + tinted soft background, fully rounded.
- Focus: 2px indigo outline, offset 2. Never outline-none without a ring.

## Motion (implemented in `styles/globals.css`)
Tokens: `--duration-fast 120ms · normal 200ms · slow 300ms · entrance 500ms/700ms · arrive cubic-bezier(0.16,1,0.3,1) · sweep cubic-bezier(0.45,0,0.55,1)`.

1. **Hero focal sequence (landing):** badge pops → per-word soft-blur headline → ONE loud-marker word stamps in (`nr-marker-stamp`) → gradient CTA breathes → preview rises while stat counters tick.
2. **GradientShimmer** (21st.dev, WAAPI, pauses off-screen + reduced-motion): one shimmering brand line per page maximum.
3. **Stagger grids** capped 0–340ms; bento tiles rise sequentially.
4. **Feedback:** check-pop (350ms) on saves/toasts; hover lift on cards; active processing step pulse-soft (2s).
5. Everything animates transform/opacity/background-position; bounded blur ≤ 6px; no width/top/left/margin animation.
6. `prefers-reduced-motion`: slides → 200ms fade, loops stop, shimmer static, marker appears instantly.

## Component Vocabulary
`PageShell (rhythm container) · Card (offset-shadow) · Pill · StatCard · TabRail · NoticeCard · EvidenceQuote · SplitWorkspace · TableRow (thin-rule, hover-lift) · Marker (loud highlight) · GradientCTA`

## Accessibility
Focus rings mandatory; colour never the sole signal (status text always paired with a dot or label); loud-on-light uses `loud-ink` for text AA; tables are real semantic tables; reduced-motion respected everywhere.

## Direction Contract
Dark warm canvas `#0e0b05` · warm sand ink `#dfc5a2` · lime accent `#c4f204` ≤5% · Archivo display, system body · 2px ink borders + offset shadows · bento layout · one shimmer per page · status colours semantic-only · motion = arrive confidently, never bounce · hierarchy via type weight + scale.
