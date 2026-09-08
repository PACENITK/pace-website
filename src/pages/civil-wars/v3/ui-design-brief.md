# Civil Wars v3 ("Urban Mayhem") — UI Design Brief

## What this is

A live, competitive city-building game played by student teams at a physical civil engineering fest event. Each team gets ₹3,000 Cr and a 16×12 tile city grid that already has an inherited slum/colony population on it. Over a game session (Year 0 planning + 5 "years"), teams place buildings to serve 9 city services, survive random-but-shared twist events (flood, pandemic, immigration surge, an Olympics bid, a hidden treasure tile), and are scored at the end. An organizer runs a shared control console that advances the year and reveals twists for everyone simultaneously.

This needs a genuinely polished, game-like UI — not a spreadsheet or a form. Think city-builder game (SimCity/Cities: Skylines-adjacent) crossed with a clean data dashboard for the scoring side.

## Existing visual style to match (do not invent a new one)

We already have real, commissioned illustrated art in this style — top-down/bird's-eye, painterly with visible ink outlines, olive-green grass ground, muted earth-tone palette (rust orange, slate blue, warm grey, cream), light hand-drawn texture (grass tufts, small stones). Every new screen/component should read as belonging next to this art, not clash with it.

Existing art assets (already built and wired into the live app):
- **Tiles**: empty ground, slum (dense corrugated-roof shanty cluster), colony (mid-density housing)
- **Buildings**: hospital (cross-roofed clinic with driveway), school, park, sewage plant, storm drainage, water treatment plant (multi-clarifier facility)
- **Overlay**: a marshy/flood-prone "low-lying" ground texture applied on top of any tile type

Current UI color tokens (feel free to refine, but this is the existing base):
- Accent: `#2b4c6f` (dark slate blue)
- Panel background: `#faf8f3` (warm off-white)
- Ink/text: `#1a1a1a`
- Hairline/border: `#dedad0`
- Success/valid: `#2e7d32` (green)
- Error/invalid: `#b3261e` (red)
- Tile rendering size: 56px square, 16×12 grid (896×672px board)

## Screens needed

### 1. Team View (the main game screen — highest priority)

Full-viewport, 3-column game layout:

**Left — Building Palette**
- Live cash display (₹ Cr, large, prominent — this is the team's core resource, should feel like a game HUD element)
- Buildings grouped by category, each category collapsible/tiered:
  - **Essentials** (unlocked Year 0): Power plant, Water tank, Water treatment plant, Hospital, School, Park, Safety station, Sewage plant, Farm
  - **Residential** (unlocked Year 0): Residential Small / Medium / Large
  - **Protection** (unlocks Year 1): Storm drainage, Dam
  - **Transport** (unlocks Year 1): Bus stand, Railway station, Metro, Airport
  - **Economy** (unlocks Year 1): Market, Restaurant, Hotel, Mall, Stadium
  - **Industry** (unlocks Year 1): Industry Small / Medium / Large
- Each building shown as a card/button: icon or art thumbnail, name, cost, a visual "can't afford" or "locked" state (greyed out)
- Buildings are **draggable** onto the grid (drag handle affordance), and also clickable-to-select as an alternative
- Locked categories show a lock icon + "Unlocks Year N"

**Center — City Grid**
- 16×12 tile board, top-down, each tile 56px (or larger for a hero mockup)
- Tile types: empty ground, slum, colony, river, road — each visually distinct
- A "low-lying" flood-risk overlay can appear on any tile
- Placed buildings render as their art/icon sitting on the tile
- Each residential/populated tile shows a small row of up to 9 tiny service icons underneath the building — filled/colored if that service is met, hollow/grey if not (power, water, health, education, environment, safety, sanitation, transport, food)
- Hovering a tile with a building selected shows a **radius-preview ghost overlay** — a soft highlighted region showing exactly what the building would cover if placed there
- **Drag-over feedback**: while dragging a building over the grid, the hovered tile glows **green** if the placement is legal, **red** if illegal (occupied, wrong terrain, missing prerequisite, etc.)
- Hovering a populated tile shows a tooltip: population count, and for any unmet service, a plain-English reason ("no supplier in range", "at capacity", etc.)
- Slum tiles that haven't been upgraded show an "upgrade" affordance; upgraded ones show a checkmark badge

**Right — Score Panel**
- Large live total score, updates in real time as the board changes
- A breakdown table: service points, unserved penalty, slum sanitation penalty, pollution penalty, sewage-adjacency penalty, all-served bonus, coverage bonus, slum-rehoused bonus, cash bonus, twist adjustments
- Per-service coverage bars for all 9 services (icon + label + "X / Y served" + a progress bar)

**Topbar** (full width, above the 3 columns)
- Game title, current year indicator ("Year 0 — Planning" through "Year 5")
- Utility buttons: reset, a demo/checkpoint loader, link to the organizer console

### 2. Twist Reveal Modal (full-screen overlay, dramatic moment)

Triggered when the organizer advances a year and a twist fires. This should feel like a *reveal* — a moment of tension/drama, not a plain alert box. Five twist types, each needs its own iconography/mood:
- **Flood** — water rising, buildings destroyed, repair cost shown
- **Pandemic** — hospital requirement vs. what was built; three outcomes (met = bonus, short by 1 = income halved, short by 2+ = income zeroed + score penalty)
- **Immigration** — 5,000 new arrivals, every home's demand increases
- **Olympics** — bid qualified (big cash + score bonus) or failed (score penalty) based on stadium/hotel/restaurant counts
- **Treasure** — a hidden tile revealed; cash gained, plus whether a building on that tile was lost

Each needs: a year indicator, a title, an icon/illustration suited to the event, the specific numeric outcome, and a "Continue" action to dismiss.

### 3. Organizer Console (separate, simpler screen)

A control-room feel — this is run by one person managing the whole event, not a player. Needs:
- Current year, cash, building-count summary
- A prominent "Advance to Year N" action button (primary CTA)
- A twist log — a running list of what's happened each year with the numbers
- Reset control
- Should look authoritative/utility-focused, distinct from the playful team view — more like a dashboard than a game screen

## Full building & service data (for accurate mockup content)

**9 services**: Power, Water, Health, Education, Environment, Safety, Sanitation, Transport, Food

**26 buildings, grouped by category** (name — cost — what it serves):

| Category | Building | Cost | Serves / Yearly income |
|---|---|---|---|
| Residential | Residential – Small | ₹30 Cr | houses 1,000 people |
| Residential | Residential – Medium | ₹50 Cr | houses 2,500 people |
| Residential | Residential – Large | ₹70 Cr | houses 5,000 people |
| Essential | Power plant | ₹100 Cr | Power |
| Essential | Water tank | ₹25 Cr | Water (small) |
| Essential | Water treatment plant | ₹80 Cr | Water (large) |
| Essential | Hospital | ₹50 Cr | Health |
| Essential | School | ₹30 Cr | Education |
| Essential | Park | ₹10 Cr | Environment |
| Essential | Safety station | ₹25 Cr | Safety |
| Essential | Sewage plant | ₹40 Cr | Sanitation |
| Essential | Farm | ₹20 Cr | Food |
| Protection | Storm drainage | ₹15 Cr | flood mitigation |
| Protection | Dam | ₹100 Cr | flood mitigation (river-only) |
| Transport | Bus stand | ₹30 Cr | Transport |
| Transport | Railway station | ₹100 Cr | Transport, +₹20 Cr/yr |
| Transport | Metro | ₹120 Cr | Transport, +₹15 Cr/yr |
| Transport | Airport | ₹150 Cr | Transport, +₹25 Cr/yr |
| Economy | Market | ₹30 Cr | +₹10 Cr/yr |
| Economy | Restaurant | ₹15 Cr | +₹8 Cr/yr |
| Economy | Hotel | ₹40 Cr | +₹18 Cr/yr |
| Economy | Mall | ₹45 Cr | +₹22 Cr/yr |
| Economy | Stadium | ₹100 Cr | +₹20 Cr/yr |
| Industry | Industry – Small | ₹40 Cr | +₹15 Cr/yr, pollutes |
| Industry | Industry – Medium | ₹80 Cr | +₹35 Cr/yr, pollutes more |
| Industry | Industry – Large | ₹140 Cr | +₹60 Cr/yr, pollutes most |

**5 tile types**: empty ground (buildable), slum (upgradeable), colony, river (only buildable for the dam), road (never buildable)

**Starting state**: ₹3,000 Cr budget, 16×12 grid, an inherited slum/colony population already on the board before the team starts.

## Art still needed (so Claude Design knows what to actually produce, in the established style)

- 2 tiles: river, road
- 20 buildings: all 3 residential tiers, power plant, water tank, safety station, farm, dam, bus stand, railway, metro, airport, market, restaurant, hotel, mall, stadium, all 3 industry tiers

## Interaction/motion notes worth conveying in the mockups

- Drag-and-drop is a first-class interaction, not click-only — palette items should look "liftable"
- Live green/red validity feedback while dragging is central to the "hard to understand the rules" problem this UI is meant to solve — make it visually obvious, not subtle
- The twist reveal should feel like an event, not a toast notification — full-screen takeover, some sense of build-up/drama
- Score panel updates live and should feel satisfying (numbers ticking up) as coverage improves

## Scope priority if Claude Design needs to phase it

1. Team View — full board + palette + score panel (this is 90% of what players see)
2. Twist Reveal Modal — the highest-drama moment, worth getting right
3. Organizer Console — simpler, lower priority, but distinct "control room" tone from the team view
