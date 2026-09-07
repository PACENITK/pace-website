# Urban Mayhem v3 -- Balance Simulation Report

Seed `urban-mayhem-v3` · 10000 random runs + 48 reference-strategy runs + 20000 Q1 runs, in 370.2s (11.8 ms/run).

## Interpretation calls made by this simulation

1. **9 services, not 8.** Part D's own table and the inherited-city cost table both list Power/Water/Health/Education/Environment/Safety/Sanitation/Transport/Food -- 9 rows. Only the player brief and the Part I worked example say "eight." This engine implements 9; a fully-served Residential Large scores 5x9x10 = **450**, not the 400 in the doc.
2. **Slum upgrade** is a per-tile flag (2,000->2,500 pop, 2->3 demand units, drops the slum penalty and sanitation clause), not a placed building.
3. **Residential demand** uses the same demand grid as inherited slums/colonies -- one mechanism for both.
4. **Industry consumes power/water in the same nearest-first allocation ring as citizens** -- no built-in favouritism either way. See "Industry vs. citizen contention" below for how often this actually costs citizens capacity.
5. **Pandemic requirement**: `ceil((non-slum pop + 2 x slum pop) / 2500)` hospitals, i.e. slums count double toward the requirement, read literally.
6. **Twist pool** is exactly {flood, pandemic, immigration} for years 1-3 (pool size == slot count), so every run gets all three, only the order varies. Olympics is always year 4, treasure year 5.

## Inherited-city cost, recomputed from the engine

Serving all 11,000 inherited people and nothing else, using the actual 16x12 map and the fixed placement heuristic's building choices, costs **₹1090 Cr** for 100% coverage on all 9 services -- not the ₹845 Cr in the organiser notes.

| Service | Buildings |
|---|---|
| Power plant | 1 (₹100 Cr) |
| Water tank | 5 (₹125 Cr) |
| Hospital | 6 (₹300 Cr) |
| School | 6 (₹180 Cr) |
| Park | 6 (₹60 Cr) |
| Safety station | 3 (₹75 Cr) |
| Sewage plant | 3 (₹120 Cr) |
| Bus stand | 3 (₹90 Cr) |
| Farm | 2 (₹40 Cr) |

That leaves **₹1910 Cr** of genuine choice, against the organiser notes' target of ₹1,000-1,500 Cr. The gap from ₹845 Cr is mostly the heuristic reaching for the cheapest per-unit building first (5 water tanks instead of 1-2 treatment plants) and real geographic spread costing more hospitals/schools than pure demand/capacity division assumes (rules.md's own caveat: "corner placement wastes money") -- so ₹1,090 Cr is itself an upper bound, not a proven minimum.

## Q1 -- Does skill beat luck?

- Within-strategy variance (luck alone, 200 strategies x 100 luck seeds each): **23154**
- Between-strategy variance (decisions alone): **2448263**
- Ratio (between/within): **105.74** -- target > 3.0 -- **PASS**
- Treasure's share of luck variance alone (30 strategies x 40 treasure-only seeds, twist order held fixed): **11.0%** of within-strategy variance.
Decisions move the score more than luck does.

## Q2 -- Is there a dominant strategy?

No single field is shared by more than 60% of the top 1% of runs (n=100). No suspected dominant choice.

## Q3 -- Is the leaderboard compressed?

| Percentile | Score |
|---|---|
| 10th | -1395 |
| 25th | -268 |
| 50th | 941 |
| 75th | 1642 |
| 90th | 1988 |
| 99th | 2395 |

Gap between 75th and 90th percentile: **21.1%** of the 75th-percentile score.

## Q4 -- Any dead buildings?

| Building | In top 10% | In bottom 10% |
|---|---|---|
| Residential - Small | 61% | 30% |
| Stadium | 84% | 53% |
| Hotel | 94% | 64% |
| Bus stand | 100% | 75% |
| Sewage plant | 100% | 75% |
| Farm | 100% | 80% |
| Safety station | 100% | 80% |
| School | 100% | 82% |
| Market | 61% | 48% |
| Hospital | 100% | 88% |
| Storm drainage | 68% | 59% |
| Metro | 14% | 6% |
| Industry - Small | 24% | 17% |
| Railway station | 20% | 13% |
| Airport | 10% | 4% |
| Dam | 65% | 60% |
| Industry - Medium | 22% | 18% |
| Industry - Large | 22% | 17% |
| Restaurant | 99% | 95% |
| Park | 100% | 98% |
| Power plant | 100% | 100% |
| Water tank | 100% | 100% |
| Water treatment plant | 0% | 0% |
| Residential - Medium | 41% | 56% |
| Mall | 0% | 18% |
| Residential - Large | 25% | 66% |

**Dead/mispriced buildings (never in top 10%): Water treatment plant, Mall**

## Q5 -- Do the twists discriminate?

| Twist | "Prepared" (definition) | Mean score | "Unprepared" | Mean score | Gap |
|---|---|---|---|---|---|
| Flood | built a dam or storm drainage | n=8809, 594 | did not | n=1191, 350 | 244 |
| Pandemic | hospital requirement met | n=1211, 1746 | not met | n=8789, 402 | 1345 |
| Immigration (proxy: serviceShare >= median) | above-median serviceShare | n=5000, 1083 | below | n=5000, 46 | 1037 |

Immigration has no direct "prepared" flag in the strategy vector, so its row uses service-investment share as a proxy for headroom -- read it as directional, not exact.

## Q6 -- Where does the money go?

| Category | Mean spend (all runs) | Mean spend (top 10%) |
|---|---|---|
| residential | ₹577 Cr | ₹255 Cr |
| essential | ₹1392 Cr | ₹1637 Cr |
| protection | ₹324 Cr | ₹362 Cr |
| transport | ₹227 Cr | ₹256 Cr |
| economy | ₹752 Cr | ₹871 Cr |
| industry | ₹235 Cr | ₹272 Cr |
| slumUpgrade | ₹121 Cr | ₹181 Cr |

Mean end-of-game cash: **₹207 Cr** (all runs), **₹313 Cr** (top 10%, 10.4% of starting budget).

## Q7 -- Is land or money the binding constraint?

- Mean buildings placed / buildable tiles: **0.67** (target 0.45-0.55)
- Runs that used up nearly all buildable tiles while still holding cash: **0.3%** (target < 20%)
Land looks like the binding constraint more often than money -- the map may be too small for this budget.
Caveat: the placement heuristic always buys the cheapest affordable building for a service before a bigger one (e.g. a ₹25 Cr water tank over an ₹80 Cr treatment plant), so it places more, smaller buildings than an efficiency-minded human would. This likely inflates the tiles-used fraction above -- treat it as an upper bound on how binding land actually is, not a precise estimate.

## Industry vs. citizen contention (power/water)

Industry and citizens draw from the same power/water capacity in the same nearest-first allocation ring, with no built-in tie-break favouring homes. This tracks how often that actually costs citizens capacity.

| | Industry's share of built capacity used | Citizen shortfall (% of citizen demand unserved) |
|---|---|---|
| Power, all runs | 2.4% | 63.8% |
| Power, top 10% | 2.5% | 48.0% |
| Water, all runs | 3.9% | 19.8% |
| Water, top 10% | 3.7% | 10.3% |

**Citizen shortfall in top strategies is meaningful -- add a tie-break favouring homes at equal distance before the event.**

## Targets

| Check | Target | Actual | Result |
|---|---|---|---|
| Between/within strategy variance | > 3.0 | 105.74 | PASS |
| Careless baseline / 90th percentile | < 0.45 | mean -4543 (negative -- ratio not meaningful) | PASS |
| Strategies within 10% of best | >= 3 | 2 | FAIL |
| Buildings never in top 10% | 0 | 2 | FAIL |
| One strategy wins every ordering | none | no | PASS |
| Mean end cash, top 10% (% of budget) | < 15% | 10.4% | PASS |
| Runs exhausting tiles before money | < 20% | 0.3% | PASS |
| Mean buildings / buildable tiles | 0.45-0.55 | 0.67 | FAIL |

## Reference strategies (mean score across all 6 twist orderings)

| Strategy | Mean score | Min | Max |
|---|---|---|---|
| services_first | 1984 | 1840 | 2273 |
| industry_rush | 830 | 679 | 976 |
| max_population | -3512 | -3544 | -3465 |
| balanced | -364 | -526 | -182 |
| hoard_cash | 1639 | 1386 | 1917 |
| olympics_focused | 521 | 462 | 615 |
| slum_rehousing | 1908 | 1520 | 2161 |
| careless_baseline | -4543 | -4592 | -4489 |

## Performance

Measured **11.85 ms/run** on this machine (Node v22.23.2) -- a full 100,000-run population would take roughly **19.7 minutes**, not "well under a minute" as targeted. The dominant remaining cost is the placement heuristic's per-candidate `canPlace()` checks; see strategies.js comments for the optimizations already applied (summed-area tables for coverage/population lookups, a shared per-year buildable-tile list, and a per-guard-iteration placement cache) which took this from ~254 ms/run to ~12 ms/run. Re-run with a larger `COUNT` argument for the full sample: `node simulation/run.js <seed> 100000`.
