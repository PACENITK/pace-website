# Handoff: Urban Mayhem — Team View

## Overview

The Team View is the main game screen of **Civil Wars v3 "Urban Mayhem"** — a live, competitive
city-building game played by student teams at a civil engineering fest. Each team has ₹3,000 Cr and
a 16×12 tile city grid carrying an inherited slum/colony population. Over Year 0 (planning) + 5
years they place buildings to serve 9 city services, survive shared twist events, and are scored at
the end.

This screen is ~90% of what players see. It is a full-viewport landscape (laptop) layout:
**building palette | city grid | city status**, under a full-width topbar.

One deliberate product decision: **the live score is NOT shown to teams.** The right column is a
*status* panel — treasury, population, per-service served/demand with spare capacity, and a
plain-English "open needs" list — not a scoreboard. Scoring stays sealed until Year 5.

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes showing intended
look and behavior, **not production code to copy directly**.

`Team View.dc.html` is a streaming "Design Component": a template plus a small logic class, with
all styling inline. It is a *visual specification*, not an architecture proposal. There is already
a live Urban Mayhem app with real tile/building art wired in — the task is to **recreate this design
inside that existing codebase**, using its established component patterns, state management and
styling approach. Do not port the `.dc.html` file itself.

Open `Team View.dc.html` in a browser to interact with it (hover tiles, hover the needs rows).

## Fidelity

**High-fidelity.** Final colors, typography, spacing, radii, shadows, iconography and copy. Recreate
pixel-closely. Two caveats:

1. It is a **static mockup** — the board state, cash, and all numbers are hard-coded sample data
   representing a plausible mid-game position (Year 2, ₹115 Cr left, 23,500 population). No real
   game logic runs. Drag-and-drop is *depicted*, not implemented: the green "legal", red "blocked",
   radius-ghost and lifted-drag-card overlays are absolutely-positioned illustrations of those
   states, not live drag feedback.
2. Building/tile art is represented by **Phosphor duotone icons** as stand-ins. In the real app they
   should be the commissioned painterly illustrations. Every built tile in the mockup is a
   drag-and-drop image slot so real art can be dropped in to evaluate the design.

## Design Tokens

The design is bound to the **Broadsheet** design system (newsprint serif, paper ground, print
accents), with its two process accents **re-inked** to match the commissioned illustration palette:
Broadsheet's process cyan becomes the art's slate blue, its magenta becomes the art's rust orange,
and the paper warms. Ramp steps, radii, spacing and the serif are all unchanged Broadsheet.

Colors are declared once as CSS custom properties on `:root` and referenced by `var()` everywhere —
there are no ad-hoc hexes in the layout. Map these onto your codebase's own token layer.

| Token | Value | Role |
|---|---|---|
| `--color-text` | `#201e1d` | Ink / all body text |
| `--game-paper` | `#f4f1ea` | Panel ground (topbar, palette, status) |
| `--game-paper-2` | `#faf8f3` | Inset card ground inside panels |
| `--game-rule` | `#d9d3c6` | Hairline borders and dividers |
| `--game-slate` | `#2b4c6f` | Primary accent — treasury HUD, interactive, bars |
| `--game-slate-dk` | `#1d3550` | Pressed / hover of the primary accent |
| `--game-rust` | `#a8442a` | Second spot color — warnings, needs, rehouse action |
| `--game-ok` | `#2e7d32` | Valid placement, met services |
| `--game-bad` | `#b3261e` | Illegal placement, unmet services |
| `--game-mute` | `#8a8172` | Uppercase section labels, secondary meta |

Additional literals used by the board and chrome (these are *artwork* colors rather than interface
tokens, and are the values to match against the real illustrations):

| Value | Role |
|---|---|
| `#e9e5db` | App background behind the panels |
| `#7f8f4e` | Olive grass ground / empty buildable tile |
| `#4a6f8f` | River tile |
| `#9d968a` | Road tile (with a centred white dash) |
| `#a8845c` | Slum tile (fine dark corrugation stripes) |
| `#c2a578` | Colony tile (45° light hatch) |
| `rgba(60,90,75,.55)` / `rgba(40,70,58,.55)` | Low-lying / flood-risk overlay, 135° stripes |
| `#3fa14a` | Filled service pip |
| `rgba(255,255,255,.30)` | Hollow service pip |
| `#f4e9c9` / `#d8c48c` / `#6b5a1e` | "Placing: …" chip fill / border / text |
| `#eef1e4` / `#cdd4b8` | Risk-watch callout fill / border |
| `#eef2f6` / `#dae3ea` | Palette icon thumbnail fill / border |
| `#fffdf6` / `#cfc7b4` | Bevel highlight (inset top) / bevel shadow (1px bottom) |

**Typography.** One family throughout: **Source Serif 4** (`--font-body` / `--font-heading`),
weights 400/600/700, plus the true italic at 400. No sans-serif anywhere — in Broadsheet the serif
*is* the chrome. All figures use `font-variant-numeric: tabular-nums`.

Type scale as used:

| Use | Spec |
|---|---|
| Game title | 700 17px/1, letter-spacing .02em |
| Kicker ("CIVIL WARS III") | 600 8.5px/1, .2em, uppercase, `--game-mute` |
| Year ("Year 2") | 700 26px/1, `--game-slate` |
| Treasury figure | 700 40px/.92, letter-spacing −.01em, `#fffdf6` |
| Panel section label | 600 9px/1, .18em, uppercase, `--game-mute` |
| Palette group header | 700 11px/1, .1em, uppercase |
| Palette building name | 600 11.5px/1.15 |
| Palette sub-note / cost | 400 9.5px/1 · 600 11px/1 |
| Status stat figure | 700 19px/1 |
| Service row label / figures | 400 11.5px/1 · 600 11px/1 |
| Status chip (AT CAP / SHORT) | 600 9px/1.3, .06em, uppercase |
| Body copy (needs, risk watch) | 400 11–11.5px/1.35–1.45, `text-wrap: pretty` |
| Board overlays | sized in `cqw` so they scale with the board (see below) |

**Spacing.** Broadsheet's 1.25× scale: 5 / 10 / 15 / 20 / 30 / 40px. In practice: 12px page padding
and column gap, 10–14px panel padding, 7–8px between list rows.

**Radii.** 2px on nearly everything (Broadsheet `--radius-md`); 3px on the large panels and the
board; 50% on pips and badges.

**Shadows.** Panels get a "printed card" bevel rather than a soft drop shadow:
`inset 0 1px 0 #fffdf6, 0 1px 0 #cfc7b4, 0 3px 10px rgba(32,28,26,.10)`.
The board gets `0 6px 22px rgba(32,28,26,.22), inset 0 0 0 1px rgba(255,255,255,.12)`.
Tooltip / lifted drag card: `0 8px 20px rgba(32,28,26,.30)`.

## Screens / Views

### Team View (single screen, full viewport)

**Purpose.** A team places buildings on their grid, sees at a glance which of the 9 services their
population is missing and why, and watches their cash.

**Root layout.** `height: 100vh; min-height: 640px`, two rows: `auto` topbar + `minmax(0,1fr)` main.
`overflow: hidden` — the screen never scrolls; the two side panels scroll internally.

**Main grid.** `grid-template-columns: minmax(238px,296px) minmax(0,1fr) minmax(262px,340px)`,
`gap: 12px`, `padding: 12px`, `min-height: 0`.

> **Critical layout note.** Every grid child that must not be widened by its content needs BOTH
> `grid-template-columns: minmax(0,1fr)` (an explicit track — an implicit `auto` track sizes to
> max-content and will blow out the column) and `min-width: 0`. The legend strips inside the center
> column also `flex-wrap`. This was the one hard bug in building the mockup; reproduce the guards.

---

#### Topbar — 56px, `--game-paper`, `border-bottom: 2px solid --color-text`

A row of hairline-separated cells, left to right:

1. **Brand.** 26px slate square (1.5px ink border, 2px radius, inset white highlight) holding a
   `ph-buildings` icon in paper; then "Urban Mayhem" over the kicker "CIVIL WARS III".
2. **Year.** "Year 2" at 26px slate, beside the phase in muted uppercase ("Planning" for Year 0,
   otherwise "Build phase"). Then a 6-dot year rail: past years `#6b8aa3` 7px, the current year a
   16px-wide slate pill, future years `--game-rule` 7px — all 7px tall, 4px radius, 4px gap.
3. **Team.** `ph-users-three` icon, "TEAM 07" kicker over "Spandan Engineers".
4. **Spacer**, then actions: **Checkpoint** (`.btn .btn-secondary`), **Reset** (`.btn .btn-ghost`),
   **Organizer console** (`.btn .btn-primary`, links to the organizer screen). All 30px tall, 12px
   text, with a 14px leading duotone icon.

---

#### Left column — Treasury + Building palette

Two rows: `auto` treasury card + `minmax(0,1fr)` scrolling palette.

**Treasury card.** Solid `--game-slate`, 1px `#16283c` border, inset white highlight, plus a soft
radial white glow at 88% 10%. Contents:
- Label row: "TREASURY" (`#a9bccd`) and "of ₹3,000 Cr" right-aligned.
- Figure row: "₹" 22px `#c9d6e2` · **115** 700 40px `#fffdf6` · "Cr" 600 14px · right-aligned
  `+43 / yr` in `#8fd694` with a `ph-trend-up` icon.
- A 5px stacked allocation bar (34/22/18/22%) in four steps of the slate ramp
  (`#c9d6e2 → #a9bccd → #8fa8bd → #6b8aa3`) on a `rgba(255,255,255,.16)` track.
- A wrapping legend: "Essentials ₹980 · Housing ₹640 · Transport ₹520 · Economy & industry ₹745".

**Palette panel.** `--game-paper`, hairline border, bevel shadow, `overflow-y: auto`.
- **Sticky header** (`--game-paper`, hairline bottom): "BUILDING PALETTE" and, right, a rust
  "drag to place" hint with a `ph-hand-grabbing` icon.
- **Six groups**, in order: Essentials (9) · Residential (3) · Protection (2) · Transport (4) ·
  Economy (5) · Industry (3). Group header = caret + uppercase name + a hairline that fills the
  remaining width + a right-side count.
- **Locked groups** (Protection, Transport, Economy, Industry at Year 0): header caret becomes
  `ph-lock-simple`, header drops to 70% opacity, and the right side becomes a neutral tag reading
  "UNLOCKS Y1". Unlocked, that slot reads a muted "open". All four unlock at Year 1.
- **Building card** — `display: flex`, 8px gap, `padding: 6px 8px 6px 2px`, 1px `--game-rule`
  border, 2px radius, `--game-paper-2` ground, `inset 0 1px 0 #fffdf6, 0 1px 0 #e2ddd0` bevel,
  `cursor: grab`, `draggable="true"`. Left to right:
  - 12px **grip** column, `ph-dots-six-vertical`, `#a09684` — the "liftable" affordance.
  - 30px **thumbnail**: `#eef2f6` fill, `#dae3ea` border, 2px radius, 17px slate duotone icon.
    *In production this is the building's art thumbnail.*
  - **Name** (600 11.5px, ellipsised) over a **sub-note** (9.5px muted) — the sub-note carries what
    the building does: "Power · 20,000 cap", "houses 2,500", "+₹22/yr", "river tiles only",
    "+₹35/yr · pollutes more".
  - **Cost**, right-aligned, 600 11px tabular.
  - **Hover** (affordable only): `translateY(-1px)`, border → `--game-slate`, shadow →
    `inset 0 1px 0 #fffdf6, 0 3px 8px rgba(43,76,111,.20)`.
  - **Can't afford**: opacity .52, ground `#f0ede4`, `cursor: not-allowed`, no bevel, cost and
    sub-note in rust, and the sub-note is **replaced** by "Short ₹N Cr" — the exact shortfall, not a
    generic disabled state.
  - **Locked**: same dimming, sub-note replaced by "Unlocks Year 1", icon and cost in `#a09684`.

Full building data (26 buildings) is in `Team View.dc.html`'s logic class, matching the game spec.

---

#### Center column — City grid

Three rows: `auto` legend · `minmax(0,1fr)` board · `auto` caption. Both strips wrap.

**Legend strip.** "CITY GRID — 16 × 12" · hairline · three swatch+label pairs (green "legal
placement", red "blocked", slate-outlined "service radius") · spacer · a sand-colored chip
"Placing: Water treatment plant" with a `ph-cursor-click` icon — the currently-selected palette
item.

**Board sizing (important).** The board must always be square-tiled and never exceed its column, so
it is sized from the *lesser* of available width and height:

```
wrapper: display:flex; align-items:center; justify-content:center;
         min-height:0; min-width:0; container-type:size;
board:   width: min(100cqw, 133.333cqh); aspect-ratio: 4/3; container-type:size;
```

The board is itself a size container, so every overlay inside it is sized in `cqw` and scales with
the board — one board, any viewport, no breakpoints. In the target codebase, either keep this CSS
approach or compute a tile size in JS from the container box; do not hard-code 56px.

**Board frame.** 2px ink border, 3px radius, `overflow: hidden`, olive `#7f8f4e` ground with two
soft radial gradients for painterly unevenness, plus the board shadow above.

**Tile grid.** `position: absolute; inset: 0`, `grid-template-columns: repeat(16,1fr)`,
`grid-template-rows: repeat(12,1fr)`. No gap — separation comes from
`inset 0 0 0 .5px rgba(32,28,26,.14)` on each tile.

**Tile types** (see the token table for colors): empty ground carries two tiny radial specks as
grass-tuft/stone texture; river is a 115° highlight stripe; road is a centred white dash; slum is
fine 90° dark corrugation; colony is a 45° light hatch. The **low-lying overlay** is an extra 135°
stripe layer composited on top of whatever the tile already is.

**On a tile.**
- **Building icon** — 3.4cqw, `#f7f4ec`, `text-shadow: 0 1px 2px rgba(32,28,26,.55)`, centred at
  50%/44%. *Replace with the building art.*
- **Service pips** — for any populated tile, a centred row of nine .55cqw dots, .28cqw gap, .35cqw
  from the bottom. Met = `#3fa14a`; unmet = `rgba(255,255,255,.30)` with a hairline inset ring.
  Order is fixed: Power · Water · Health · Education · Environment · Safety · Sanitation ·
  Transport · Food.
- **Slum badge** — top-right 2.6cqw circle: rust with `ph-arrow-fat-lines-up` when the slum is not
  yet rehoused, green with `ph-check` when it has been.

**Sample board** (r,c zero-indexed, as built in the mockup): river runs c13 r0–3 → c12 r4–7 → c11
r8–11; roads along r6 c0–10, down c4 all rows, and down c9 r6–11; a slum belt at (8,1) (8,2) (9,1)
(9,2) (9,3)* (10,1)* (10,2) (*= rehoused); a colony block at (2,6) (2,7) (3,6) (3,7); low-lying
ground on (7,13) (8,12) (9,12) (10,12) (10,13) (11,12) (11,14); and 16 placed buildings.

**Board overlays** — these are the *drag-and-drop language*, and they are intentionally loud:
- **Radius ghost** — the region the selected building would cover if placed on the hovered tile:
  `rgba(201,214,226,.30)` fill, 1.5px dashed `#4a6f8f`, 3px radius, plus a very slight scrim over
  everything outside it (`box-shadow: 0 0 0 100vmax rgba(32,28,26,.06)`). A slate caption sits above
  it: "COVERS 5 × 5 · 12,000 PEOPLE". In the mockup this is a 5×5 region at rows 6–10, cols 6–10.
- **Legal target** — the hovered tile fills `rgba(46,125,50,.30)` and pulses on a 1.6s
  ease-in-out loop between `inset 0 0 0 2px #2e7d32, 0 0 0 3px rgba(46,125,50,.28)` and
  `… 0 0 0 7px rgba(46,125,50,.12)`. A green "✓ Buildable — I-9" chip sits beside it.
- **Illegal target** — identical construction in `--game-bad`, with a `ph-prohibit` chip carrying
  the *reason*: "Road tile — never buildable". The reason text is the point; never show a bare red
  square.
- **Lifted drag card** — the palette card following the cursor: paper ground, 1px slate border,
  `rotate(-7deg)`, `drop-shadow(0 6px 12px rgba(32,28,26,.4))`, showing icon + name + cost.
- **Rehouse affordance** — a rust chip on a slum tile: "Rehouse slum — ₹40 Cr".
- **Press furniture** — a small crosshair registration target and "Y2 · PLATE" at 50% opacity in
  the bottom-right corner. Purely decorative, from the Broadsheet system.

**Tile tooltip — hover only.** Nothing about unmet requirements is shown at rest; it appears only
while a populated tile is hovered, anchored beside that tile (flipping to the tile's left once the
column index is ≥ 9, and clamped so it can't run off the bottom). 20cqw wide, paper ground, 1px ink
border, 3px radius, `pointer-events: none`. Structure:
- Header strip (`#eae6da`, hairline bottom): the tile's identity and coordinate — "Colony · G-3",
  "Slum · B-9", "Rehoused slum · B-11", "Residential M · C-8" — and the resident count.
- One red row per **unmet** service: duotone icon + bold service name + a plain-English reason.
  Reason strings by service: Power "power plant at capacity" · Water "no supplier in range" ·
  Health "no hospital in range" · Education "no school in range" · Environment "no park in range" ·
  Safety "no safety station in range" · Sanitation "sewage plant at capacity" · Transport "no
  supplier in range" · Food "no farm in range".
- Hairline, then one green `ph-check` line listing the met services.

Populations used for the tooltip: slum tile 1,300 · colony tile 1,500 · Residential S/M/L
1,000 / 2,500 / 5,000.

**Caption strip.** Three wrapping hints: an art-drop reminder (mockup-only), the service-pip legend
(three filled dots + one hollow, "service pips under each home — filled = served"), and a
low-lying swatch with its label.

---

#### Right column — City status

One scrolling panel, `--game-paper`, sticky header with a **2px ink** bottom rule: "City status"
and, right, "scoring sealed until Year 5". Body is a 16px-gap stack:

1. **Two stat cards** (2-col grid, `--game-paper-2`, `#e2ddd0` border):
   **Population** 23,500 with "9,000 inherited slum"; **Fully served** 6,500 in green over
   "/ 23,500", with "17,000 missing ≥1 service" in rust.
2. **Service ledger.** Header "SERVICE LEDGER" + "served / demand · spare capacity". Nine rows,
   `grid-template-columns: 16px 1fr auto`, 7px gap:
   - 15px duotone service icon (rust if that service is critical, else slate).
   - Name and, right-aligned, `served / demand` in tabular figures (the demand half muted).
   - A 5px, 3px-radius bar on an `#e2ddd0` track with **two segments**: served (slate, or rust when
     critical) and then, continuing from it, *spare capacity that is out of range* as a 135° hatch
     (`#a9bccd`/`#c9d6e2`). This is the "how much is occupied vs. how much is available" read the
     brief asked for — a team can see they have built enough capacity but placed it wrong.
   - A fixed 52px status chip: `ok` (green tint) · `short` (sand) · `at cap` (slate tint) ·
     `critical` (red tint), each `fill / 1px border / text` from its ramp.
   - Below the rows, a legend explaining the solid vs. hatched segments.
   - Sample data (served / demand 23,500 / capacity / state): Power 18,500 / 20,000 at cap ·
     Water 11,000 / 15,000 short · Health 14,000 / 16,000 short · Education 16,500 / 18,000 short ·
     Environment 8,500 / 9,000 critical · Safety 12,000 / 14,000 short · Sanitation 9,000 / 9,000
     at cap · Transport 13,500 / 17,000 short · Food 17,000 / 22,000 ok.
3. **Open needs.** Header "OPEN NEEDS" + a red "5 unresolved" tag. Each row is
   `grid-template-columns: 18px 1fr`, `--game-paper-2` ground, hairline border, `cursor: pointer`.
   **Collapsed at rest**: a rust 16px icon, the location ("Colony H-3", "Slum B-9 → D-11",
   "Residential – Large K-3", "Industry – Small O-12"), the population/scope in muted tabular
   figures, and a right-aligned caret. **On hover** the row tints (`#f2f6f9` / `#a9bccd` border),
   the caret flips up, and two lines reveal: the reason in body copy, then a small slate-tinted
   "fix" chip. Example: *"No water supplier within range. Nearest is the water treatment plant at
   N-6 — 7 tiles away."* → chip "Place a water tank around J-4".
4. **Built this far.** A wrapping row of neutral count chips: "Power × 1", "Water × 2",
   "Homes × 3", etc., each with a 12px slate icon.
5. **Risk watch.** A muted-green callout (`#eef1e4` / `#cdd4b8`) with a rust `ph-warning-diamond`:
   "6 tiles sit on low-lying ground; 1 storm drain built. Industry O-12 pollutes within 2 tiles of
   Park H-8."

## Interactions & Behavior

Implemented in the mockup:
- **Tile hover** → the unmet-service tooltip, anchored and side-flipped as described. Leaving the
  tile clears it. Nothing requirement-related is visible at rest — this was an explicit request.
- **Needs row hover** → expands the reason + fix chip; collapses on leave.
- **Palette card hover** → lift, slate border, deepened shadow. Suppressed when the card is
  unaffordable or locked.
- **Buttons** → Broadsheet's own hover/pressed/`:focus-visible` states (2px accent ring, offset 2px).

Depicted but not implemented — build these for real:
- **Drag and drop.** Palette cards are `draggable="true"` and carry a grip. On drag start, lift the
  card under the cursor (the tilted card treatment above). On drag over a tile, validate and paint
  the tile green or red **with the reason chip** — occupied, wrong terrain, missing prerequisite,
  can't afford. Click-to-select is the equivalent alternative path, and the selected building shows
  in the "Placing: …" chip.
- **Radius preview.** While a building is selected/dragged, hovering a tile draws the ghost region
  it would cover, captioned with the coverage and the people reached.
- **Slum rehousing.** The rust chip on an un-rehoused slum tile is the action; on success the badge
  becomes the green check and the tile's pips update.
- **Live status.** Cash, population, the service ledger and the needs list all recompute whenever
  the board changes. Animate the figures rather than snapping them — the brief asks for this to feel
  satisfying. Score is deliberately **not** part of this.
- **Year advance.** Driven by the organizer console; unlocks the four Year-1 categories, pays
  income, and can fire a twist.

Animation inventory: two 1.6s infinite pulse keyframes (`pulseG`, `pulseR`) for the drop targets;
.12s ease on palette-card `transform`/`box-shadow`. Nothing else moves.

## State Management

The mockup holds only what hover needs:
- `hoverTile: number | null` — flat index into the 192-tile array; drives the tooltip.
- `hoverNeed: number | null` — index into the needs list; drives the row expansion.
- `currentYear: 0..5` — a prop, exposed as a tweak. Year 0 renders the locked-category state and the
  "Planning" phase label; ≥1 renders "Build phase" and unlocked categories.

Everything else — cash, the board, the ledger, the needs — is hard-coded sample data.

The real screen needs, at minimum: cash and per-category spend; the tile array (terrain, low-lying
flag, occupant, rehoused flag); per-populated-tile service satisfaction plus a *reason* per unmet
service (the reason strings are UI copy driven by the solver — range miss vs. capacity miss are
different messages); per-service served / demand / total capacity; the derived needs list; the
selected or dragged building and the hovered tile; and the year + unlock state. It also subscribes
to the organizer's year/twist broadcast.

## Assets

- **Icons — Phosphor, duotone weight** (`@phosphor-icons/web@2.1.1`), per the Broadsheet system.
  Services: `ph-lightning` `ph-drop` `ph-heartbeat` `ph-book-open` `ph-tree` `ph-shield-check`
  `ph-recycle` `ph-bus` `ph-bowl-food`. Buildings: `ph-house-line` `ph-house` `ph-buildings`
  `ph-drop-half` `ph-first-aid-kit` `ph-graduation-cap` `ph-plant` `ph-waves` `ph-wall` `ph-train`
  `ph-train-simple` `ph-airplane-tilt` `ph-storefront` `ph-fork-knife` `ph-bed` `ph-shopping-bag`
  `ph-trophy` `ph-factory` `ph-lightning`. UI: `ph-users-three` `ph-trend-up` `ph-hand-grabbing`
  `ph-dots-six-vertical` `ph-caret-down` `ph-caret-up` `ph-lock-simple` `ph-cursor-click`
  `ph-check-circle` `ph-prohibit` `ph-check` `ph-arrow-fat-lines-up` `ph-warning-diamond`
  `ph-bookmark-simple` `ph-arrow-counter-clockwise` `ph-sliders` `ph-image`.
- **Font** — Source Serif 4 from Google Fonts, weights 400/600/700 + italic 400.
- **Tile and building art** — the commissioned illustrations. Already exist for: empty ground, slum,
  colony, low-lying overlay, hospital, school, park, sewage plant, storm drainage, water treatment
  plant. **Still needed:** 2 tiles (river, road) and 20 buildings (Residential S/M/L, power plant,
  water tank, safety station, farm, dam, bus stand, railway, metro, airport, market, restaurant,
  hotel, mall, stadium, Industry S/M/L). The mockup substitutes Phosphor icons for all of these.
- `image-slot.js` is a mockup-only convenience (drag real art onto a tile to preview it). It has no
  place in production.

## Files

- `Team View.dc.html` — the design. Template + logic class; all styling inline; the `:root` token
  block and the two pulse keyframes are in the `<helmet>` at the top.
- `image-slot.js` — the drag-and-drop image placeholder used by the board tiles. Mockup only.
- `_ds/broadsheet-.../styles.css` + `_ds_bundle.js` + `readme.md` — the Broadsheet design system:
  the token sheet, the `.btn` / `.tag` / `.card` component layer, and the written guidance. Read
  `readme.md` before changing anything visual.

## Not in this handoff

Two screens from the brief are still to be designed:

1. **Twist Reveal Modal** — a full-screen dramatic takeover for the five twists (Flood, Pandemic,
   Immigration, Olympics, Treasure), fired when the organizer advances the year.
2. **Organizer Console** — the control-room screen: year/cash/building summary, a prominent "Advance
   to Year N" CTA, a twist log, and a reset control.
