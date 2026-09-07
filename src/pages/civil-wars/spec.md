# Urban Mayhem — Balance Simulation Spec

A build brief for Claude Code. This is a **standalone script**, not part of the game UI. It runs 100,000 randomised cities through the scoring engine and reports whether the game is balanced.

**The question this answers is not "what is the best city."** It is: *do different reasonable strategies land far enough apart, and does skill beat luck?* If the answer is no, the rules need changing before the event.

**Source of truth: `urban-mayhem-rules-v3.md`.** Every cost, capacity, radius and penalty comes from there. Where this spec and the rulebook disagree, the rulebook wins — and flag the mismatch in your report.

---

## 1. Hard requirement: shared engine

The simulation and the game page **must import the same scoring module**. Not a copy, not a reimplementation.

If that module doesn't exist yet as a standalone unit, extract it first:

```
src/pages/civil-wars/engine/
  types.js          shared shapes
  buildings.js      building definitions
  tileTypes.js      settlement definitions
  config.js         every tunable constant, no magic numbers elsewhere
  allocate.js       distance-ring allocation
  score.js          scoring from a city state
  simulate.js       runs a full 6-year game given a decision sequence
```

The React page imports from here. The simulation imports from here. If the two ever diverge, the tuning is worthless.

The engine must be **pure** — no React, no DOM, no randomness inside it. Given the same city state and the same twist sequence it returns the same score, every time.

---

## 2. What gets randomised

**Do not randomise tile coordinates.** A hospital on a random tile serves nobody, and 100,000 garbage cities measure nothing but noise.

Randomise the **strategy**, then let a fixed heuristic place buildings sensibly according to it.

### The strategy vector

Each run samples one of these. Ranges given; sample uniformly unless noted.

| Field | Range | Meaning |
|---|---|---|
| `serviceShare` | 0.20 – 0.70 | fraction of budget aimed at services |
| `housingShare` | 0.00 – 0.50 | fraction aimed at new residential |
| `commercialShare` | 0.00 – 0.50 | fraction aimed at income buildings |
| `cashReserve` | 0.00 – 0.35 | fraction held back for twists |
| `housingSizeBias` | small / medium / large / mixed | which residential tier is preferred |
| `industryAppetite` | none / small / medium / large | biggest industry it will build |
| `damPolicy` | never / early / after-flood | flood protection stance |
| `drainagePolicy` | none / partial / full | storm drainage on low-lying tiles |
| `olympicsIntent` | ignore / opportunistic / committed | whether it builds towards the Olympics |
| `slumUpgrades` | 0 – 4 | how many slums it rehouses |
| `serviceOrder` | permutation of the 8 services | which needs it prioritises |
| `expansionTiming` | year 0 / spread / late | when new housing goes up |

Normalise the four share fields to sum to 1.

### Placement heuristic (fixed, not random)

Given the strategy, each purchase decision follows the same logic every time:

1. **Service buildings** → the tile that covers the most currently-unserved demand units of that service, within radius. Ties broken by lowest tile index.
2. **Residential** → the tile with the most existing service coverage available, at least 3 tiles from any industry.
3. **Industry** → the tile furthest from any residential or slum tile that still meets its prerequisites.
4. **Parks** → adjacent to residential tiles inside an industry's pollution radius first, then to the highest unserved environment demand.
5. **Dam** → the river tile furthest upstream that protects the most low-lying tiles.
6. **Drainage** → low-lying tiles holding the most valuable buildings.
7. **Commercial** → wherever its population prerequisite is met, nearest to the densest housing.

A run that cannot afford its next intended purchase skips it and banks the cash. No debt. No backtracking.

---

## 3. What else varies per run

- **Twist order** — random permutation of the pool, with Olympics fixed at year 4
- **Which three** of flood / pandemic / immigration appear (if the pool is larger than 3)
- **Treasure tile** — uniformly random over all buildable tiles, revealed at the end

These are **luck variables**. Record them separately from the strategy vector — separating their effect from the strategy's is the main point of the whole exercise.

---

## 4. Runs

**100,000 runs.** Seed the RNG from a CLI argument so any run is reproducible.

Also run, separately and labelled, the **hand-written reference strategies** so their scores appear alongside the random population:

`services_first`, `industry_rush`, `max_population`, `balanced`, `hoard_cash`, `olympics_focused`, `slum_rehousing`, `careless_baseline`

Each of these against **every twist ordering**, not just one.

---

## 5. The report

Write to `sim-report.md` plus a raw `results.csv`. The report must answer these six questions directly, each with a number and a verdict.

### Q1 — Does skill beat luck? (most important)

Take 200 strategy vectors. Run each against 100 different luck seeds.

- **Within-strategy variance** — how much a single strategy's score moves purely on luck
- **Between-strategy variance** — how much the mean score moves across strategies

Report the ratio. **Between must be clearly larger than within.** If luck moves scores more than decisions do, the event is a lottery — say so plainly at the top of the report.

Report separately how much of the luck variance is the treasure alone. That is a known, deliberate risk in the design and its size needs to be visible.

### Q2 — Is there a dominant strategy?

Report the top 1% of runs and what their strategy vectors have in common. If more than 60% of the top 1% share a value on any single field (e.g. `industryAppetite = large`), name it as a suspected dominant choice.

### Q3 — Is the leaderboard compressed?

Report the score at the 10th, 25th, 50th, 75th, 90th, 99th percentile. Report the gap between 75th and 90th as a percentage — that is roughly the gap between a good team and a very good team on the day.

### Q4 — Any dead buildings?

For each building type, report how often it appears in the **top 10%** of cities versus the **bottom 10%**.

- Never in the top 10% → dead, mispriced, cut it or fix it
- Equally common in both → decorative, it isn't a decision
- Far more common in the top → a real, meaningful choice

### Q5 — Do the twists discriminate?

For each twist, compare mean scores of runs that prepared for it against runs that didn't.

- Gap near zero → the twist does nothing, preparing is wasted money
- Gap enormous → the twist decides the game and its order matters too much

### Q6 — Where does the money go?

Mean spend per category across all runs, and separately across the top 10%. Report mean end-of-game cash. If the top 10% end with large unspent cash, something is unaffordable or unattractive and should be repriced.

### Q7 — Is land or money the binding constraint?

For each run, record buildings placed, buildable tiles used, and end-of-game cash. Report the fraction of runs that **ran out of tiles before running out of money**.

If that fraction is above about 20%, the map is too small for the budget and *where* to build has stopped being a decision — teams are just filling squares. If it is near zero and mean end cash is high, the map is too large or the budget too small.

This is the check that decides the grid size, and it matters more than any single price.

---

## 6. Sweep mode

A second entry point that re-runs a smaller batch (5,000) across a grid of config values, so the effect of a change is visible without editing files by hand:

- `STARTING_BUDGET`: 2400 / 3000 / 3600
- `GRID`: 12×9 / 15×10 / 16×12
- `INHERITED_SETTLEMENTS`: 4 slums + 2 colonies / 6 slums + 4 colonies
- `HOSPITAL_COST`: 40 / 50 / 65
- `INCOME_MULTIPLIER`: 0.8 / 1.0 / 1.3 (1.0 = the v3 figures as written)
- `TREASURE_VALUE`: 0 / 300

Output a table: for each combination, the Q1 ratio, the Q3 spread, the count of dead buildings, and **mean buildings placed as a fraction of buildable tiles** (target roughly 0.45–0.55 — above that, land is the binding constraint rather than money).

**This table is the actual deliverable** — it tells us which numbers to ship.

The `TREASURE_VALUE: 0` row is not a proposal to remove the treasure. It isolates how much of the leaderboard the treasure is deciding, which is the single thing to check given it is pure luck.

---

## 7. Targets

The config passes if:

| Check | Target |
|---|---|
| Between-strategy variance ÷ within-strategy variance | **> 3.0** |
| Careless baseline ÷ 90th percentile | **< 0.45** |
| Strategies within 10% of the best | **at least 3** |
| Buildings never appearing in the top 10% | **0** |
| Any strategy winning under every twist ordering | **none** |
| Mean end cash in the top 10% | **< 15% of starting budget** |
| Runs that exhausted tiles before money | **< 20%** |
| Mean buildings ÷ buildable tiles | **0.45 – 0.55** |

Report each as pass or fail with the actual figure.

---

## 8. Tune against the 80th percentile

A random search will find exploits no first-year will ever discover. **Do not tune against the single best run.** The 80th percentile is roughly "a smart team that thought about it," and that is the player to balance for.

If the best random run scores far above anything the hand-written strategies reach, that gap is theoretical — note it and move on.

---

## 9. Performance

Each city is a few thousand operations. 100,000 runs should finish in well under a minute in plain Node. Do not add workers, clustering, or a database. If it is slow, the engine has an accidental O(n²) — find it, since the game page will have the same problem.

---

## 10. Done when

- `npm run sim` produces `sim-report.md` and `results.csv`
- The same seed reproduces identical results
- All six questions are answered with numbers and a verdict, not just data dumps
- The sweep table exists and names a recommended config
- The engine is shared with the game page, verified by scoring one identical city through both paths and getting the same number

Report any rule that was ambiguous enough that you had to pick an interpretation. Those are spec bugs, and they will be bugs in the live event too.
