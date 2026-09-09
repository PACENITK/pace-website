# URBAN MAYHEM — v4

**Build smart. Survive the unexpected.**

Round 2 of Civil Unleashed · Teams of 3–4 · Laptop-based · ~50 minutes

> **Note on the numbers.** Every cost, capacity and income figure in this document is provisional until the balance simulation has been run. Treat the structure as settled and the numbers as a first pass.

---

# PART A — THE PLAYER BRIEF

*This is all that gets said out loud before the game. Everything else is taught by the screen.*

**You are a city development authority. You have ₹3,000 crore.**

**People already live here.** Four slums and two colonies — 11,000 people — are on your map from the first second. They need water, health, schools and more, and they are your responsibility.

**Build homes and people arrive.** Every home you build needs the same services. Build faster than you can serve and your city scores nothing.

**Every home shows what it needs.** Nine icons on the tile. Filled means served, hollow means not. Your only real job is filling icons.

**Your city earns money every year.** Shops, industry and transport pay. Hospitals and schools cost. You need both.

**Five things will go wrong.** You don't know which or when. Keep money aside.

**Look at the flood bands now.** The two rows hugging the river are marked Severe, the next two out are marked Moderate. That's where the flood will hit, and how hard.

**A computer scores everything.** No judges.

That's the brief. Everything below is reference — the interface enforces all of it, and nothing needs memorising.

---

# PART B — THE MAP

A **16 × 12 grid** — 192 tiles.

| Feature | Rule |
|---|---|
| **River** | Runs across the map, 16 columns wide. Not buildable. Dams go here and nowhere else. |
| **Flood zones** | Three low-lying rows, marked with a wave icon, in an asymmetric band: **Zone A** (Severe) sits one row on each side of the river; **Zone B** (Moderate) sits two rows out, but only on one side. Buildable. This is where the flood hits, and how hard. |

Roughly **170 buildable tiles**. You will not have money for all of them.

---

# PART C — POPULATION

## The city you inherit

| Settlement | Tiles | People each | Demand units |
|---|---|---|---|
| Slum cluster | 4 | 2,000 | **2** of each service |
| Housing colony | 2 | 1,500 | **2** of each service |

**11,000 people, 12 demand units of every service, before you build anything.**

**Slums cannot be demolished.** You cannot solve them by removing them.

**Slums are scored harder:**
- Every missing service costs **−10 per unit** instead of −5
- A slum with no sanitation in range loses an extra **−50**
- During a waterborne outbreak, slums count **double** toward the hospital requirement

**Two of the four slums sit in Zone A**, the severe flood band. When you weigh up a ₹100 Cr dam, you are deciding about 4,000 people, not a building's resale value.

### Slum upgrade — ₹60 Cr

Rehouse a slum and it becomes a Residential Medium: 2,500 people, normal penalties, no sanitation clause.

- **+75 score** per slum upgraded
- Population rises 2,000 → 2,500, so your service demand goes **up**
- All four costs ₹240 Cr for +300 score

## Population you build

| Building | Cost | People | Demand units |
|---|---|---|---|
| Residential — Small | ₹30 Cr | 1,000 | **1** of each service |
| Residential — Medium | ₹50 Cr | 2,500 | **3** of each service |
| Residential — Large | ₹70 Cr | 5,000 | **5** of each service |

A **demand unit** is the game's measure of need. A Residential Large needs 5 units of power, 5 of water, 5 of health, and so on across all nine services.

Large is the best value per person and the hardest to serve. Small spreads demand thin — easier to cover, more expensive per head.

**Population alone scores nothing.** 50,000 unserved people score worse than 15,000 well-served ones.

---

# PART D — THE NINE SERVICES

| Service | Provided by |
|---|---|
| Power | Hydro station (needs a dam) |
| Water | Water tank / treatment plant |
| Health | Hospital |
| Education | School |
| Environment | Park |
| Safety | Safety station |
| Sanitation | Sewage plant |
| Transport | Bus stand / railway / metro / airport |
| Food | Farm — **city-wide, no distance check** |

Food is listed ninth because it works differently: farms serve the whole city. The other eight all depend on distance.

## Radius

Radius is measured in **grid steps, with diagonals counting as one step**. A radius of 2 is the 5×5 square centred on the building.

- A building **serves its own tile** (distance 0)
- **Nothing blocks radius** — not the river, not other buildings
- **The map edge clips it.** A hospital in the corner reaches 9 tiles instead of 25. Corner placement wastes money.

Coverage by radius: 1 → 9 tiles · 2 → 25 · 3 → 49 · 4 → 81 · 5 → 121

## Allocation

When a service building has less capacity than the demand around it, it serves the **nearest homes first**. The rest go unserved.

This is calculated in a fixed order, so **the same city always scores the same** regardless of what order you built it in.

---

# PART E — THE BUILDING LIST

## Essential services

| Building | Cost | Serves | Supplies | Radius | Yearly | Requires |
|---|---|---|---|---|---|---|
| **Hydro station** | **₹70 Cr** | Power | 20 units | 5 | −₹2 Cr | Adjacent to a dam. Max 2 per dam. |
| Water tank | ₹25 Cr | Water | 3 units | 2 | −₹1 Cr | Power |
| Water treatment plant | ₹80 Cr | Water | 12 units | 4 | −₹3 Cr | Power |
| **Hospital** | **₹50 Cr** | Health | 3 units | 3 | −₹4 Cr | Power, Water |
| School | ₹30 Cr | Education | 3 units | 3 | −₹1 Cr | Power |
| Park | ₹10 Cr | Environment | 2 units | 1 | −₹0.5 Cr | — |
| Safety station | ₹25 Cr | Safety | 5 units | 3 | −₹1 Cr | Power |
| Sewage plant | ₹40 Cr | Sanitation | 6 units | 3 | −₹2 Cr | Power, Water |
| Farm | ₹20 Cr | Food | 6 units | city-wide | −₹0.5 Cr | Water |

There is no power plant. Power comes only from hydro stations, and a hydro station only exists next to a dam — see Protection below. **Every "Requires Power" line in this document means "requires hydro coverage somewhere on the board."**

Safety station covers police and fire together.

**Read this against the residential table.** A Residential Large needs 5 health units. A hospital supplies 3. That block alone needs two hospitals — ₹100 Cr of health for a ₹70 Cr building. Dense housing is only cheap until you pay for its services.

## Protection

| Building | Cost | Effect | Radius | Yearly | Requires |
|---|---|---|---|---|---|
| Storm drainage | ₹15 Cr | Halves flood repair costs nearby | 2 | −₹0.5 Cr | — |
| **Dam** | **₹100 Cr** | Protects **6 columns downstream**, full immunity. Enables hydro stations. | 6 columns | −₹3 Cr | River tile only |

**A dam can only be placed on a river tile**, and protects only the 6 columns *downstream* of it — full immunity, not a discount. The river is 16 columns wide, so one dam covers well under half of it. **More than one dam is allowed**, and where you place each one is the real decision.

**A hydro station downstream of its own dam is protected. Built upstream of it, it is not.** Lose an unprotected hydro station and everything that needs power goes down with it, wherever it sits on the board.

## Transport

| Building | Cost | Covers | Radius | Yearly | Requires |
|---|---|---|---|---|---|
| Bus stand | ₹30 Cr | 5 units | 3 | −₹1 Cr | Power |
| Railway station | ₹100 Cr | 15 units | city-wide | **+₹20 Cr** | Power, 1 bus stand |
| Metro | ₹120 Cr | 25 units | city-wide | **+₹15 Cr** | Railway station |
| Airport | ₹150 Cr | 10 units | city-wide | **+₹25 Cr** | Power, railway station |

Bus stands are cheap but need placing near people. A railway station covers everyone at once and pays for itself in five years.

## Economy

| Building | Cost | Yearly | Radius | Requires |
|---|---|---|---|---|
| Market | ₹30 Cr | **+₹10 Cr** | 3 | 5,000 population in radius |
| Restaurant | ₹15 Cr | **+₹8 Cr** | 2 | 2,500 population in radius |
| Hotel | ₹40 Cr | **+₹18 Cr** | 2 | 1 transport building |
| Mall | ₹45 Cr | **+₹22 Cr** | 3 | 10,000 population in radius |
| Stadium | ₹100 Cr | **+₹20 Cr** | — | Power, 1 transport building |
| Industry — Small | ₹40 Cr | **+₹15 Cr** | pollutes 1 | Power, water, 1 transport |
| Industry — Medium | ₹80 Cr | **+₹35 Cr** | pollutes 2 | Power, water, 1 transport |
| Industry — Large | ₹140 Cr | **+₹60 Cr** | pollutes 3 | Power, water, 1 transport |

### Industries consume services too

| Industry | Power used | Water used |
|---|---|---|
| Small | 2 units | 2 units |
| Medium | 4 units | 4 units |
| Large | 7 units | 7 units |

A Large industry drinks more than half a water treatment plant. The allocation system **does not favour citizens over factories** — build one without expanding utilities and your own people go without.

### Industries pollute

Every home or slum inside the pollution radius **loses its Environment service** unless a park sits within 1 tile of that home.

A Large industry poisons a 7×7 block — 49 tiles, a quarter of the whole map. Best income in the game, hardest thing to place.

---

# PART F — MONEY

**Income is paid once a year**, calculated from the buildings standing at that moment.

**Yearly balance = sum of every building's yearly figure.** Services are negative, commercial is positive. It's paid straight into your spendable balance — one number, once a year.

**You cannot spend below zero.** There is no debt, no loans, no bankruptcy. The interface simply blocks any purchase you cannot afford.

**Income is halved** in any year where more than a third of your population is unserved on three or more services. A neglected city does not produce.

**Selling a building refunds 50%.**

**Moving a building costs 10% of its price.** Pick up anything you've already placed and drop it on a different empty tile — a ₹100 Cr dam costs ₹10 Cr to relocate. Everything it was serving goes back to unserved the moment it lifts off, and its coverage is recalculated fresh from wherever it lands — same radius, same rules as a brand-new placement (a hydro station still needs a dam next to its new spot; a dam still needs a river tile). There's no limit on how many times you move something, other than paying the fee each time.

---

# PART G — THE YEARS

| | Duration | What happens |
|---|---|---|
| **Year 0** | 15 min | Planning. Build freely. No income, no costs yet. |
| **Year 1** | 6 min | Income paid. **Twist 1.** |
| **Year 2** | 6 min | Income paid. **Twist 2.** |
| **Year 3** | 6 min | Income paid. **Twist 3.** |
| **Year 4** | 6 min | Income paid. **Olympics.** |
| **Year 5** | 5 min | Income paid. **Treasure revealed.** Final spend. |
| **Year 6** | — | Scoring. Leaderboard. |

Organisers advance the year. Everyone moves together. A year can be held open if teams are struggling.

## Mandatory floor

Checked once, when Year 0 ends — not a twist, and it never blocks you from building. Four items, roughly ₹300 Cr of your ₹3,000 Cr:

- 1 dam + 1 hydro station
- Water covering all inherited demand
- 1 sewage plant
- 1 hospital

**Miss any of them and you take −100 score, and your income is halved in Year 1.** A confused team keeps playing — it just starts Year 1 behind. Everything else stays optional.

---

# PART H — THE TWISTS

Three of Flood, Waterborne outbreak and Immigration fill years 1–3, in an order you won't know. Olympics is always year 4. Treasure is always year 5.

## Flood

The river bursts. **Every tile in a flood zone is hit** — and those tiles are marked from the first minute, graded into two bands across three rows total.

| Zone | Rows from the river | Tiles | Severity |
|---|---|---|---|
| **A** | ±1 (both sides) | 32 | Severe |
| **B** | 2 (one side only) | 16 | Moderate |

**Population is never destroyed.** A flooded slum or home keeps its people — it just stops delivering services until repaired. Removing people would reward teams who neglected them.

| Building | Zone A unprotected | Zone B unprotected |
|---|---|---|
| Slum | Services cut, demand stays, **₹40 Cr to restore** | Cut 1 year, ₹20 Cr |
| Residential | Offline, **50% of cost to repair** | 25% |
| Hospital / school / sewage / water / safety | Offline 1 year, **40% to repair** | 20% |
| **Hydro station** | Offline — everything it powers fails too. **40% to repair** | 20% |
| Park / drainage / farm | **Destroyed outright, cost lost** | 30% to repair |
| Commercial / industry | Income stops until repaired, 40% | 20% |
| Industry (extra) | Pollution radius **+1, permanently**, on top of repair | — |

**Protection.** Downstream of a dam → no damage, full stop — for the dam's own protected buildings and for a hydro station downstream of its own dam. Storm drainage within 2 tiles halves whatever repair percentage applies, but it can't stop a Zone A park/drainage/farm from being destroyed outright.

A dam is ₹100 Cr. Drainage is ₹15 Cr. An unprotected hydro station going down doesn't just cost its own repair — everything it powers stops working until it's fixed.

## Waterborne outbreak

Two checks, not one.

**Containment.** A home is infected if no sewage plant reaches it. A home fed only by water tank(s) is also infected, unless one of those tanks is itself within a sewage plant's range — a water treatment plant carries no such exposure. This is the ₹80 Cr treatment plant's reason to exist over three ₹25 Cr tanks.

**Treatment.** Infected population needs **1 hospital per 2,500 people** — slums count double.

| Situation | Effect |
|---|---|
| No infections | **+₹50 Cr, +50 score** |
| Infected, fully treated | Nothing |
| Infected, short on hospitals | **−50 score per missing hospital**, income halved |
| Infected, no hospital anywhere | **−150 score**, income zero |

Nothing can be done after it's announced except emergency-building hospitals at full price.

## Immigration

**Two new slum tiles appear** on empty land near your existing settlements — 2,500 people each, same demand profile as a rehoused slum.

They arrive completely unserved, on tiles you don't control the placement of. Leave land and cash spare near your city — the alternative is scrambling to reach two new slums from wherever they happen to land.

## Olympics

The city bids to host. **Requirements:**

- **1 stadium**
- **5 hotels**
- **3 restaurants**

| Result | Effect |
|---|---|
| Qualified | **+₹500 Cr and +150 score** |
| Not qualified | **−50 score** |

Announced at the start of the game. The required buildings all generate income anyway, so building towards them is not wasted money — but 5 hotels and a stadium is ₹300 Cr you could have spent on services.

## Treasure

**One tile on the map holds treasure worth ₹300 Cr.** Which tile is not revealed until the end of Year 5.

| Situation | Result |
|---|---|
| That tile is empty | You receive the full **₹300 Cr** |
| You built there | You may claim the ₹300 Cr, but the building is **demolished and its cost lost**, along with whatever it was serving |

You cannot plan for this. It is the one piece of pure luck in the game, and it is there for the drama of the final reveal.

---

# PART I — SCORING

## When you see it

**You never see your score, or anyone else's, while the game is running.** No number on your own screen — not in Year 0, not after a twist, not at any point before Year 6. All you ever see is what's served and what isn't (the pips on each tile, Part D) — never a total.

**The organizer sees every team's score, live and ranked, throughout the event** (Part L's Organizer Console). That's for pacing and watching the event, not for players.

**Year 6 is the only reveal.** One number per team, calculated exactly as below, ranked against everyone else. Nobody — not even the organizer showing it — is doing any judging; it's the same formula that's been running the whole time, just never displayed until now.

Everything below this line — every number, every formula — is public. It's only the running total that's never shown until Year 6.

## Points

**+10 per demand unit delivered.**

A Residential Large fully served: 5 units × 9 services × 10 = **450 points**.
Same block, 4 services covered: **200 points**.
Same block, nothing: **0 points** — and it cost ₹70 Cr.

Partial coverage counts. A hospital with 3 spare units serving a block needing 5 delivers 3 units of health, not zero.

## Bonuses

| Bonus | Points |
|---|---|
| 100% of population has all 9 services | +200 |
| Olympics qualified | +150 |
| Outbreak: no infections | +50 |
| Each service at 90%+ city-wide | +25 each |
| Each slum rehoused | +75 |

## Penalties

| Penalty | Points |
|---|---|
| Unserved demand | −5 per unit (**−10** on a slum) |
| Slum with no sanitation in range | −50 each |
| Home inside industry pollution with no park | −30 each |
| Home adjacent to a sewage plant | −20 each |
| Outbreak: short on hospitals | −50 per missing hospital |
| Outbreak: no hospital anywhere | −150 |
| Olympics not qualified | −50 |

## Cash

**Final cash × 0.05 points per crore.** ₹1,000 Cr left over is 50 points — about one well-served small home.

Deliberately small. Hoarding is not a strategy; cash is what lets you survive twists.

## The full formula

Three things, added together:

1. **Board score** — Points minus Penalties plus Bonuses, all three tables above, summed over your final board.
2. **Cash score** — final cash × 0.05, from the Cash section above.
3. **Every twist's own score change**, added up as the game plays out — the mandatory-floor penalty at Year 0 if you missed it, then whatever each of Years 1–5's twists did (a pandemic's +50 or −50/−150, Olympics' +150 or −50, and so on — each one is spelled out in Part H as its own twist). Nothing here is hidden math; every twist tells you its own score effect the moment it happens. What's hidden is only the running sum.

**Score = board score + cash score + every twist's score change.**

Worked example: 380 points of board score, ₹1,200 Cr left over (60 cash points), a pandemic that hit for −50 (short one hospital), Olympics qualified (+150) → 380 + 60 − 50 + 150 = **540**.

---

# PART J — HOW TO WIN

- **Serve the 11,000 people you already have first.** Cheapest points on the board.
- **Dam and hydro station before anything else.** Almost nothing works without power, and a hydro station can't exist without a dam next to it.
- **Clear the mandatory floor before Year 0 ends.** Dam + hydro, full water coverage, a sewage plant, a hospital — ₹300 Cr you were probably spending anyway. Missing it costs more than it saves.
- **Sewage near the slums, early.** ₹40 Cr avoids −200 across four slums, and it's your only defence against a waterborne outbreak.
- **Don't build homes you can't serve.** An unserved Large is ₹70 Cr of zero.
- **Get income running early.** A railway station in Year 0 has paid for itself by Year 5 and unlocks the airport.
- **Leave land and cash spare.** Immigration drops two new, fully unserved slums near your city — you can't stop it, but you can be ready to reach them.
- **Parks are ₹10 Cr** and they cancel industry pollution. Buy them.
- **Decide on the Olympics early.** ₹500 Cr and 150 points is the biggest single swing available — but ₹300 Cr of hotels is a lot of hospitals.

---

# PART K — RULES SUMMARY

1. Starting budget **₹3,000 Cr**.
2. Year 0 is 15 minutes; each later year is 5–6 minutes.
3. A building can be placed only if you can afford it and its prerequisites are met. The system blocks anything else.
4. Cost is deducted when the building is placed.
5. Selling refunds 50%. Moving an already-placed building to a new tile costs 10% instead, and its coverage recalculates fresh from the new spot.
6. One building per tile. Dams only on river tiles.
7. **You cannot go below zero.** No debt.
8. Income is paid at the start of each year from the buildings then standing.
9. Twists apply to all teams at the same moment.
10. Twist costs come out of your current balance.
11. The mandatory floor (dam + hydro, full water coverage, a sewage plant, a hospital) is checked once, when Year 0 ends. Missing it costs −100 score and halves Year 1 income — it never blocks play.
12. The treasure tile is revealed at the end of Year 5.
13. Final score is calculated by the system using Part I. There is no judging panel.

---

# PART L — ORGANISER NOTES

## What changed from v2

- **Treasure** reverted to a single random tile revealed at the end, per the original design
- **Olympics** requirements restored to 1 stadium, 5 hotels, 3 restaurants — only the points and payout are new
- **Debt system removed** entirely; spending below zero is simply blocked
- **Grid enlarged** 12×9 (108 tiles) → **16×12 (192 tiles)**
- **Budget raised** ₹1,200 → ₹3,000 Cr

## What changed from v3

- **Power plant removed.** Power is now dam + hydro station only — see Part E.
- **Mandatory floor added.** Dam + hydro, water coverage, sewage, a hospital, checked once at the Year 0 → 1 transition. A penalty, not a block — see Part G.
- **Flood is graded**, not flat. Zone A (severe) and Zone B (moderate) replace the single "low-lying" boolean, each with its own repair table — see Part H.
- **Pandemic rebuilt into a waterborne outbreak** with two checks (containment via sewage/water-tank exposure, then treatment via hospitals) instead of one flat hospital-count check — see Part H.
- **Immigration rebuilt.** Two new 2,500-person slum tiles now spawn on empty land, instead of inflating demand on every existing home — see Part H.
- **Parks now only offset industry pollution.** There's no thermal plant left for them to offset.
- **Flood band trimmed to 3 rows.** Zone B used to mirror Zone A on both sides of the river (4 low-lying rows total); it's now one-sided, so the far bank only carries the Zone A row. Fewer tiles read as "probably fine to ignore," and it reads less like a rendering bug and more like a deliberate asymmetric risk.
- **Road tiles removed.** The 6-tile "existing roads" strip along the bottom-left last row wasn't teaching anything — on screen it just looked like a rendering artifact with no building on it and no explanation. Those tiles are now ordinary buildable land; buildable tile count moved 164 → 170.
- **Low-lying art no longer replaces a slum's own art.** A slum tile flagged low-lying used to render as generic marshy ground, wiping out the slum sprite entirely ("slum overlapping with low-lying area"). It now keeps its own art with the flood tint layered on top.
- **Fixed a z-index bug** where anything placed on a low-lying tile — building art, service pips, the slum badge — painted *behind* the flood-zone texture instead of on top of it, because the texture layer had no explicit stacking order.
- **Moving a building added.** Pick up anything already placed and relocate it to a new empty tile for 10% of its price; coverage recalculates from the new position exactly like a fresh placement — see Part F.

## Running the event

One organizer laptop, one admin key. The Organizer Console: locks a year, advances it (draws and applies that year's twist to every team at once), and shows a live leaderboard — every team, ranked by score, updating continuously throughout the event. This is the one place scores are visible before Year 6 (Part I) — never show this screen to players.

## Why the grid grew

At ₹3,000 Cr a realistic city is **60–75 buildings**, and a cheap-building strategy can reach 120. On the old 12×9 map that was 90 buildable tiles against up to 120 buildings — land ran out before money did, so teams would fill every square and *where* to build stopped being a question.

The working ratio is **roughly 2 buildable tiles per building a team can afford**. At 170 buildable tiles against 60–75 buildings, that lands at about 2.5×, which leaves real room to plan.

**Render at 56px per tile** — 896 × 672 px, which fits a 1366×768 laptop with panels at 180px and 220px. Check the art at that size before committing: if a slum no longer reads as different from a colony at a glance, drop to **15×10 at 64px** rather than shrinking the tiles further.
- **Hospitals** ₹80 → ₹50 Cr
- **All commercial and transport income ×2.5** — at the old figures no income strategy ever paid back its capital

## The cost of the inherited city

Serving all 11,000 inherited people and nothing else:

| Service | Buildings | Cost |
|---|---|---|
| Power | 1 dam + 1 hydro station | ₹170 Cr |
| Water | 1 treatment plant | ₹80 Cr |
| Health | 4 hospitals | ₹200 Cr |
| Education | 4 schools | ₹120 Cr |
| Environment | 6 parks | ₹60 Cr |
| Safety | 3 stations | ₹75 Cr |
| Sanitation | 2 sewage plants | ₹80 Cr |
| Transport | 3 bus stands | ₹90 Cr |
| Food | 2 farms | ₹40 Cr |
| **Total** | | **₹915 Cr** |

Leaves about **₹2,085 Cr** of genuine choice — down from v3's ₹2,155 Cr now that power costs a dam on top of the hydro station. That is the number to watch when tuning — if it drops much below ₹1,000 Cr, nobody builds a city; much above ₹1,500 Cr and there is a real risk everyone covers everything and the scores cluster.

**At ₹3,000 Cr this is the main thing the simulation must check.** With over ₹2,100 Cr free, a team can plausibly afford full service coverage *and* the Olympics *and* industry. If the simulation shows the top 10% finishing with large unspent cash, or several strategies scoring within a few percent of each other, the budget is too high and ₹2,400 Cr is the next figure to try.

## Building relations reference

**Prerequisite chain** — what must exist before what:

- Dam needs nothing but a river tile. Hydro station needs a **dam adjacent to it with spare capacity** (max 2 hydro stations per dam).
- Water (tank or treatment), school, safety station and bus stand all need **Power** (hydro coverage).
- Hospital and sewage plant need **Power + Water**.
- Railway needs **Power + 1 bus stand**. Metro needs **1 railway**. Airport needs **Power + 1 railway**.
- Hotel and stadium need **any one transport building** (a bus stand alone is enough).
- Industry (any size) needs **Power + Water + any one transport building**.
- Market, Restaurant and Mall need enough **population within their own radius** — a population count, not a building.
- Residential buildings, park and storm drainage need nothing. Farm needs **Water**.

**Demand vs. capacity, per Residential Small (1 demand unit).** Every other block is a multiple of this: Medium ×3, Large ×5, Slum/Colony ×2, upgraded slum ×3.

| Building | Capacity | Fraction used by 1 Res. Small | 1 building fully covers |
|---|---|---|---|
| Hydro station | 20 | 0.050 | 20 Small blocks |
| Water tank | 3 | 0.333 | 3 |
| Water treatment plant | 12 | 0.083 | 12 |
| Hospital | 3 | 0.333 | 3 |
| School | 3 | 0.333 | 3 |
| Park | 2 | **0.500** | 2 |
| Safety station | 5 | 0.200 | 5 |
| Sewage plant | 6 | 0.167 | 6 |
| Bus stand | 5 | 0.200 | 5 |
| Farm | 6 | 0.167 | 6 |

Park is the tightest fit in the game — a single Residential Large (5×) needs 2.5 parks. Hospital, school and water tank tie for second-tightest at 1.667 for a Large block. Everything else has enough headroom that even a Large block barely dents one supplier — which is why "sewage near the slums, early" (Part J) is cheap advice, and why parks get repeated separately.

**Industry doesn't supply anything — it draws from the same power/water pool citizens use**, at whatever distance it sits from the hydro station or water source, with no rule currently giving homes priority at equal distance. Watch this in playtesting: if industry is measurably starving citizens of power/water, add "homes win ties" to Part D's Allocation rule.

## New sweep parameters (v4)

Three values worth A/B testing in the balance simulation before locking the event build. Current defaults, chosen as a reasonable middle ground and used throughout this document, are marked:

- **Dam protection span** — 4 / **6** / 8 columns. Decides whether a second dam is ever worth buying: at 4 columns two dams barely overlap the 16-column river's demands; at 8, one dam nearly covers half of it and a second stops paying for itself.
- **Hydro station cost** — 55 / **70** / 85. Interacts directly with the mandatory floor's ~₹300 Cr target and the ₹915 Cr inherited-city cost above.
- **Dam cost** — 80 / **100** / 120. The other half of that same power line.

## Known risks

**The treasure is luck.** Roughly a 1-in-3 chance of hitting a built tile on a full board, and nothing a team can do about it. **Check that the gap between 1st and 2nd is larger than ₹300 Cr.** If it isn't, the treasure picked your winner.

**22 buildings is a lot for a first-year.** Consider showing only Essentials and Residential in Year 0, unlocking Economy and Transport at Year 1. Same game, half the menu when they are most overwhelmed.

**Optional simplification:** merge the nine services down to six — fold safety into health, food into water, sanitation into environment. Removes three columns from every calculation with very little loss. Worth doing if the practice board shows teams struggling.

## Before the event

Run the balance simulation. The specific things to confirm:

- Strategy variance clearly exceeds luck variance
- No building never appears in a top-scoring city
- Careless scores under 45% of a strong city
- At least three different strategies land within 10% of the best
- Top teams do not end with large unspent cash
