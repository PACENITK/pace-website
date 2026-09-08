# Urban Mayhem v3 -- Balance Simulation Report

Seed `urban-mayhem-v3` · 10000 random runs + 48 reference-strategy runs + 20000 Q1 runs, in 626.9s (20.1 ms/run).

## Interpretation calls made by this simulation

1. **9 services, not 8.** Part D's own table and the inherited-city cost table both list Power/Water/Health/Education/Environment/Safety/Sanitation/Transport/Food -- 9 rows. Only the player brief and the Part I worked example say "eight." This engine implements 9; a fully-served Residential Large scores 5x9x10 = **450**, not the 400 in the doc.
2. **Slum upgrade** is a per-tile flag (2,000->2,500 pop, 2->3 demand units, drops the slum penalty and sanitation clause), not a placed building.
3. **Residential demand** uses the same demand grid as inherited slums/colonies -- one mechanism for both.
4. **Citizens get strict priority over industry for shared power/water capacity** -- each service is allocated to citizen demand first (full capacity), then whatever's left over goes to industry. See "Industry vs. citizen contention" below for how much this actually protects citizens.
5. **Pandemic requirement**: `ceil((non-slum pop + 2 x slum pop) / 2500)` hospitals, i.e. slums count double toward the requirement, read literally.
6. **Twist pool** is exactly {flood, pandemic, immigration} for years 1-3 (pool size == slot count), so every run gets all three, only the order varies. Olympics is always year 4, treasure year 5.

## Inherited-city cost, recomputed from the engine

Serving all 11,000 inherited people and nothing else, using the actual 16x12 map and the fixed placement heuristic's building choices, costs **₹1125 Cr** for 100% coverage on all 9 services -- not the ₹845 Cr in the organiser notes.

| Service | Buildings |
|---|---|
| Power plant | 1 (₹100 Cr) |
| Water treatment plant | 2 (₹160 Cr) |
| Hospital | 6 (₹300 Cr) |
| School | 6 (₹180 Cr) |
| Park | 6 (₹60 Cr) |
| Safety station | 3 (₹75 Cr) |
| Sewage plant | 3 (₹120 Cr) |
| Bus stand | 3 (₹90 Cr) |
| Farm | 2 (₹40 Cr) |

That leaves **₹1875 Cr** of genuine choice, against the organiser notes' target of ₹1,000-1,500 Cr. The gap from ₹845 Cr is mostly real geographic spread costing more hospitals/schools than pure demand/capacity division assumes (rules.md's own caveat: "corner placement wastes money") -- so this total is itself an upper bound, not a proven minimum.

## Q1 -- Does skill beat luck?

- Within-strategy variance (luck alone, 200 strategies x 100 luck seeds each): **19791**
- Between-strategy variance (decisions alone): **2440567**
- Ratio (between/within): **123.31** -- target > 3.0 -- **PASS**
- Treasure's share of luck variance alone (30 strategies x 40 treasure-only seeds, twist order held fixed): **13.7%** of within-strategy variance.
Decisions move the score more than luck does.

## Q2 -- Is there a dominant strategy?

No single field is shared by more than 60% of the top 1% of runs (n=100). No suspected dominant choice.

## Q3 -- Is the leaderboard compressed?

| Percentile | Score |
|---|---|
| 10th | -1264 |
| 25th | -129 |
| 50th | 1036 |
| 75th | 1747 |
| 90th | 2083 |
| 99th | 2482 |

Gap between 75th and 90th percentile: **19.2%** of the 75th-percentile score.

## Q4 -- Any dead buildings?

| Building | In top 10% | In bottom 10% |
|---|---|---|
| Stadium | 87% | 50% |
| Hotel | 95% | 60% |
| Residential - Small | 58% | 29% |
| Bus stand | 100% | 72% |
| Sewage plant | 100% | 73% |
| Farm | 100% | 78% |
| Safety station | 100% | 80% |
| School | 100% | 81% |
| Storm drainage | 73% | 57% |
| Market | 64% | 50% |
| Hospital | 100% | 87% |
| Dam | 65% | 57% |
| Industry - Medium | 25% | 17% |
| Industry - Small | 24% | 16% |
| Industry - Large | 22% | 16% |
| Metro | 10% | 6% |
| Airport | 7% | 4% |
| Restaurant | 98% | 96% |
| Railway station | 15% | 14% |
| Park | 100% | 99% |
| Water treatment plant | 100% | 100% |
| Power plant | 100% | 100% |
| Residential - Medium | 42% | 55% |
| Mall | 1% | 21% |
| Residential - Large | 29% | 65% |
| Water tank | 8% | 97% |

Every building appears in at least some top-10% cities.

## Q5 -- Do the twists discriminate?

| Twist | "Prepared" (definition) | Mean score | "Unprepared" | Mean score | Gap |
|---|---|---|---|---|---|
| Flood | built a dam or storm drainage | n=8808, 725 | did not | n=1192, 305 | 420 |
| Pandemic | hospital requirement met | n=1153, 1847 | not met | n=8847, 522 | 1324 |
| Immigration (proxy: serviceShare >= median) | above-median serviceShare | n=5000, 1186 | below | n=5000, 164 | 1022 |

Immigration has no direct "prepared" flag in the strategy vector, so its row uses service-investment share as a proxy for headroom -- read it as directional, not exact.

## Q6 -- Where does the money go?

| Category | Mean spend (all runs) | Mean spend (top 10%) |
|---|---|---|
| residential | ₹571 Cr | ₹252 Cr |
| essential | ₹1378 Cr | ₹1666 Cr |
| protection | ₹329 Cr | ₹391 Cr |
| transport | ₹222 Cr | ₹233 Cr |
| economy | ₹752 Cr | ₹925 Cr |
| industry | ₹230 Cr | ₹294 Cr |
| slumUpgrade | ₹121 Cr | ₹182 Cr |

Mean end-of-game cash: **₹194 Cr** (all runs), **₹294 Cr** (top 10%, 9.8% of starting budget).

## Q7 -- Is land or money the binding constraint?

- Mean buildings placed / buildable tiles: **0.61** (target 0.45-0.55)
- Runs that used up nearly all buildable tiles while still holding cash: **0.2%** (target < 20%)
Land looks like the binding constraint more often than money -- the map may be too small for this budget.
Caveat: the placement heuristic picks the most cost-efficient affordable tier for a service (by cost/capacity) rather than doing true multi-building lookahead, and most services only have one tier to begin with -- so it still places somewhat more, smaller buildings than an optimising human would. This likely inflates the tiles-used fraction above -- treat it as an upper bound on how binding land actually is, not a precise estimate.

## Industry vs. citizen contention (power/water)

Citizens are allocated power/water first, against full capacity; industry only claims what's left over. "Industry's share of built capacity used" should now stay small -- if it doesn't, the priority isn't working. "Citizen shortfall" is citizens' own unserved demand regardless of cause -- once industry's share is near zero, a high citizen-shortfall number means capacity is simply under-built for the population, not that industry is competing for it.

| | Industry's share of built capacity used | Citizen shortfall (% of citizen demand unserved) |
|---|---|---|
| Power, all runs | 0.2% | 61.6% |
| Power, top 10% | 0.0% | 46.3% |
| Water, all runs | 2.4% | 7.1% |
| Water, top 10% | 3.8% | 1.6% |

Industry's share of top-strategy capacity is small and consistent with citizens being served first (it's leftover capacity, not contested capacity). Any remaining citizen shortfall reflects overall power/water capacity relative to population, not industry contention, and needs a different fix (more capacity, not a different allocation rule).

## Targets

| Check | Target | Actual | Result |
|---|---|---|---|
| Between/within strategy variance | > 3.0 | 123.31 | PASS |
| Careless baseline / 90th percentile | < 0.45 | mean -5493 (negative -- ratio not meaningful) | PASS |
| Strategies within 10% of best | >= 3 | 2 | FAIL |
| Buildings never in top 10% | 0 | 0 | PASS |
| One strategy wins every ordering | none | no | PASS |
| Mean end cash, top 10% (% of budget) | < 15% | 9.8% | PASS |
| Runs exhausting tiles before money | < 20% | 0.2% | PASS |
| Mean buildings / buildable tiles | 0.45-0.55 | 0.61 | FAIL |

## Reference strategies (mean score across all 6 twist orderings)

| Strategy | Mean score | Min | Max |
|---|---|---|---|
| services_first | 2059 | 1896 | 2240 |
| industry_rush | 359 | 114 | 790 |
| max_population | -3977 | -4057 | -3862 |
| balanced | -220 | -296 | -124 |
| hoard_cash | 1644 | 1398 | 1852 |
| olympics_focused | 330 | 186 | 381 |
| slum_rehousing | 1912 | 1701 | 2090 |
| careless_baseline | -5493 | -5612 | -5287 |

## Performance

Measured **20.06 ms/run** on this machine (Node v22.23.2) -- a full 100,000-run population would take roughly **33.4 minutes**, not "well under a minute" as targeted. The dominant remaining cost is the placement heuristic's per-candidate `canPlace()` checks; see strategies.js comments for the optimizations already applied (summed-area tables for coverage/population lookups, a shared per-year buildable-tile list, and a per-guard-iteration placement cache) which took this from ~254 ms/run to ~20 ms/run. Re-run with a larger `COUNT` argument for the full sample: `node simulation/run.js <seed> 100000`.
