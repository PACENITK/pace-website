# URBAN MAYHEM — PLAYER HANDOUT

**Build smart. Survive the unexpected.**

Round 2 of Civil Unleashed · Teams of 3–4 · Laptop-based · ~50 minutes

> This handout is everything you need to start. The interface enforces every rule in
> here — nothing needs memorising. Numbers may be tuned slightly before the event; the
> screen is always the source of truth.

---

## 1. THE BRIEF

**You are a city development authority. You have ₹3,000 crore.**

**People already live here.** Four slums and two colonies — 11,000 people — are on your
map from the first second. They need water, health, schools and more, and they are your
responsibility.

**Build homes and people arrive.** Every home you build needs the same services. Build
faster than you can serve and your city scores nothing.

**Every home shows what it needs.** Nine icons on the tile. Filled means served, hollow
means not. Your only real job is filling icons.

**Your city earns money every year.** Shops, industry and transport pay. Hospitals and
schools cost. You need both.

**Every year, something happens.** You will not be told what, or when, until it does.
Some years will cost money, some will change the board, some will affect your score. Keep
cash and land in reserve — a city with nothing spare cannot react.

**You get a 10-minute practice run first.** Join early and build freely on a throwaway
board to learn the interface. When practice ends, the organiser wipes every board and the
real, scored game begins from Year 0.

**A computer scores everything. No judges.**

---

## 2. THE MAP

A **16 × 12 grid** — 192 tiles.

| Feature | Rule |
|---|---|
| **River** | Runs straight across one row, spanning all 16 columns. **It flows left → right** — the left edge is upstream, the right edge is downstream. Not buildable; dams can only be placed on river tiles. |
| **Low-lying zones** | Three rows nearest the river are marked with a wave icon and graded **Zone A** (the two rows touching the river, one on each side) and **Zone B** (one further row, on a single bank). Building there is allowed. |

That leaves roughly **170 buildable tiles**. You will not have money for all of them.

---

## 3. THE CITY YOU INHERIT

| Settlement | Tiles | People each | Demand units |
|---|---|---|---|
| Slum cluster | 4 | 2,000 | **2** of each service |
| Housing colony | 2 | 1,500 | **2** of each service |

**11,000 people, 12 demand units of every service, before you build anything.**

- **Slums cannot be demolished.** You cannot solve them by removing them.
- **Slums are scored harder:** every missing service costs **−10 per unit** instead of −5,
  and a slum with no sanitation in range loses an extra **−50**.
- **Two of the four slums sit in Zone A**, the low-lying band closest to the river.

### Slum upgrade — ₹60 Cr

Rehouse a slum and it becomes a Residential Medium: 2,500 people, normal penalties, no
sanitation clause.

- **+75 score** per slum upgraded
- Population rises 2,000 → 2,500, so its service demand goes **up**

---

## 4. POPULATION YOU BUILD

| Building | Cost | People | Demand units |
|---|---|---|---|
| Residential — Small | ₹30 Cr | 1,000 | **1** of each service |
| Residential — Medium | ₹50 Cr | 2,500 | **3** of each service |
| Residential — Large | ₹70 Cr | 5,000 | **5** of each service |

A **demand unit** is the game's measure of need. A Residential Large needs 5 units of
power, 5 of water, 5 of health, and so on across all nine services.

Large is the best value per person and the hardest to serve. Small spreads demand thin —
easier to cover, more expensive per head.

**Population alone scores nothing.** 50,000 unserved people score worse than 15,000
well-served ones.

---

## 5. THE NINE SERVICES

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

Food works differently: farms serve the whole city. The other eight all depend on distance.

### Radius

Radius is measured in **grid steps, with diagonals counting as one step**. A radius of 2 is
the 5×5 square centred on the building.

- A building **serves its own tile** (distance 0).
- **Nothing blocks radius** — not the river, not other buildings.
- **The map edge clips it.** A hospital in the corner reaches 9 tiles instead of 25.
  Corner placement wastes money.

Coverage by radius: 1 → 9 tiles · 2 → 25 · 3 → 49 · 4 → 81 · 5 → 121

### Allocation

When a service building has less capacity than the demand around it, it serves the
**nearest homes first**. The rest go unserved. This is calculated in a fixed order, so
**the same city always scores the same** regardless of what order you built it in.

---

## 6. THE BUILDING LIST

### Essential services

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

There is no power plant. Power comes only from hydro stations, and a hydro station only
exists next to a dam. **"Requires Power" / "Requires Water" is a yes/no gate, not an
amount** — it just means a hydro station (or a water building) must already exist somewhere
on the board. A hospital, school or sewage plant consumes **no** power or water; it only
needs one to exist. The only things that spend your power and water supply are **homes**
(1 of each per demand unit) and **industry** (a flat 2 / 4 / 7 per factory). Safety station
covers police and fire together.

**Read this against the residential table.** A Residential Large needs 5 health units; a
hospital supplies 3. That block alone needs two hospitals. Dense housing is only cheap
until you pay for its services.

### Infrastructure

| Building | Cost | Effect | Radius | Yearly | Requires |
|---|---|---|---|---|---|
| Storm drainage | ₹15 Cr | Reduces river-flood repair costs for nearby buildings | 2 (5×5 block) | −₹0.5 Cr | — |
| **Dam** | **₹100 Cr** | Enables hydro stations. Shields the strip of columns downstream of it from river flooding. | 6 columns | −₹3 Cr | River tile only |

**The dam.** It sits on a river tile — you pick the column. It enables hydro power for the
6-column-wide strip running downstream of it (its own column plus the 5 to its right; water
flows left-to-right). A hydro station built on the dam's column or downstream of it sits in
that strip; built on the upstream side it does not. More than one dam is allowed.

### Transport

| Building | Cost | Covers | Radius | Yearly | Requires |
|---|---|---|---|---|---|
| Bus stand | ₹30 Cr | 5 units | 3 | −₹1 Cr | Power |
| Railway station | ₹100 Cr | 15 units | city-wide | **+₹20 Cr** | Power, 1 bus stand |
| Metro | ₹120 Cr | 25 units | city-wide | **+₹15 Cr** | Railway station |
| Airport | ₹150 Cr | 10 units | city-wide | **+₹25 Cr** | Power, railway station |

A railway station covers everyone at once and pays for itself in five years.

### Economy

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

**Industries consume services too** — they draw power and water from the same pool your
citizens use (Small 2/2, Medium 4/4, Large 7/7 units), at no priority. Build one without
expanding utilities and your own people go without.

**Industries pollute.** Every home or slum inside the pollution radius **loses its
Environment service** unless a park sits within 1 tile of that home. A Large industry
poisons a 7×7 block — best income in the game, hardest thing to place.

---

## 7. MONEY

- **Income is paid once a year**, at the start of the year, from the buildings then
  standing. Yearly balance = the sum of every building's yearly figure (services negative,
  commercial positive). One number, once a year.
- **You cannot spend below zero.** No debt, no loans. The interface blocks any purchase you
  can't afford.
- **Income is halved** in any year where more than a third of your population is unserved on
  three or more services. A neglected city does not produce.
- **There is no selling.** Once a building is placed and its 5-second undo window passes, it
  is on the board for good.
- **Undo — 5 seconds, full refund.** Every action (place, rehouse, move, repair) shows an
  Undo button for 5 seconds. Use it and every rupee comes back. Let the window pass and it's
  committed.
- **Moving a building costs 10% of its price.** Pick up anything already placed and drop it
  on an empty tile; its coverage recalculates fresh from the new spot (a dam still needs a
  river tile, a hydro still needs a dam beside it). Moving gives **no** cash back.

Cash is your buffer for whatever each year brings. Hoarding is not a strategy — but neither
is spending to zero.

---

## 8. THE YEARS

| | Duration | What happens |
|---|---|---|
| **Practice** | ~10 min | Free play on a throwaway board. Wiped clean when the organiser ends it. |
| **Year 0** | 15 min | Planning. Build freely. No income, no costs yet. The mandatory floor is checked when it ends. |
| **Years 1–5** | ~6 min each | Income paid at the start. **An event happens each year** — you find out what when it lands. It may cost cash, change the board, or move your score. |
| **Year 6** | — | Scoring. Leaderboard. |

The organiser advances the year; everyone moves together. A year can be held open longer if
teams are struggling.

### The mandatory floor

Checked once, when Year 0 ends — it never blocks you from building. Four items, roughly
₹300 Cr of your ₹3,000 Cr:

- 1 dam + 1 hydro station
- Water covering all inherited demand
- 1 sewage plant
- 1 hospital

**Miss any of them and you take −100 score, and your income is halved in Year 1.** A
confused team keeps playing — it just starts Year 1 behind. Everything else stays optional.

---

## 9. SCORING

### When you see it

**You never see your score, or anyone else's, while the game is running.** Not in Year 0,
not after an event, not at any point before Year 6. All you ever see is what's served and
what isn't — the pips on each tile — never a total.

**Year 6 is the only reveal.** One number per team, calculated exactly as below, ranked
against everyone else. There is no judging — it's the same formula running the whole time,
just never displayed until now. Every number and formula below is public; only the running
total is hidden.

### Points

**+10 per demand unit delivered.**

- A Residential Large fully served: 5 units × 9 services × 10 = **450 points**.
- Same block, 4 services covered: **200 points**.
- Same block, nothing: **0 points** — and it cost ₹70 Cr.

Partial coverage counts. A hospital with 3 spare units serving a block needing 5 delivers
3 units of health, not zero.

### Bonuses

| Bonus | Points |
|---|---|
| 100% of population has all 9 services | +200 |
| Each service at 90%+ city-wide | +25 each |
| Each slum rehoused | +75 |

### Penalties

| Penalty | Points |
|---|---|
| Unserved demand | −5 per unit (**−10** on a slum) |
| Slum with no sanitation in range | −50 each |
| Home inside industry pollution with no park | −30 each |
| Home adjacent to a sewage plant | −20 each |

### Cash

**Final cash × 0.05 points per crore.** ₹1,000 Cr left over is 50 points — about one
well-served small home. Deliberately small: hoarding is not a strategy.

### The full formula

**Score = board score + cash score + every year's event effect.**

1. **Board score** — points minus penalties plus bonuses, summed over your final board.
2. **Cash score** — final cash × 0.05.
3. **Each year's event** announces its own point and cash effect the moment it happens —
   some add, some subtract. Those are added up into your final score. Nothing is hidden
   math; you always see an event's effect when it lands. What's hidden is only the running
   sum until Year 6.

---

## 10. HOW TO WIN

- **Serve the 11,000 people you already have first.** Cheapest points on the board.
- **Dam and hydro station before anything else.** Almost nothing works without power, and a
  hydro station can't exist without a dam next to it.
- **Clear the mandatory floor before Year 0 ends.** Dam + hydro, full water coverage, a
  sewage plant, a hospital — ₹300 Cr you were probably spending anyway. Missing it costs
  more than it saves.
- **Sewage near the slums, early.** ₹40 Cr avoids −200 in penalties across the four slums.
- **Don't build homes you can't serve.** An unserved Large is ₹70 Cr of zero — and there's
  no selling it back. If you're not sure, use the 5-second undo.
- **Get income running early.** A railway station in Year 0 has more than paid for itself by
  the end, and unlocks the metro and airport.
- **Leave land and cash spare.** You'll want room and money to react as the game develops.
- **Parks are ₹10 Cr** and they cancel industry pollution. Buy them.

---

## 11. QUICK RULES SUMMARY

1. Starting budget **₹3,000 Cr**.
2. Year 0 is 15 minutes; each later year is about 6.
3. A building can be placed only if you can afford it and its prerequisites are met. The
   system blocks anything else.
4. Cost is deducted when the building is placed.
5. **No selling.** Every action can be undone within 5 seconds for a full refund; after that
   it is committed. A committed building can only be **moved** (10% of its price), never
   removed for cash.
6. One building per tile. Dams only on river tiles.
7. **You cannot go below zero.** No debt.
8. Income is paid at the start of each year from the buildings then standing.
9. Each year's event applies to all teams at the same moment. Its costs come out of your
   current balance.
10. The mandatory floor (dam + hydro, full water coverage, a sewage plant, a hospital) is
    checked once, when Year 0 ends. Missing it costs −100 score and halves Year 1 income —
    it never blocks play.
11. Final score is calculated by the system. There is no judging panel.

---

## APPENDIX — QUICK REFERENCE

### Prerequisite chain (what must exist before what)

- **Dam** needs a river tile. **Hydro station** needs a dam adjacent to it with spare
  capacity (max 2 per dam).
- **Water** (tank or treatment), **school**, **safety station**, **bus stand** need Power.
- **Hospital** and **sewage plant** need Power + Water.
- **Farm** needs Water.
- **Railway** needs Power + 1 bus stand. **Metro** needs 1 railway. **Airport** needs
  Power + 1 railway.
- **Hotel** and **stadium** need any one transport building.
- **Industry** (any size) needs Power + Water + any one transport building.
- **Market / Restaurant / Mall** need enough population within their own radius.
- **Residential**, **park**, **storm drainage** need nothing.

### How much one service building covers (in Residential Small blocks)

| Building | Capacity | Covers this many Small blocks |
|---|---|---|
| Hydro station | 20 | 20 |
| Water treatment plant | 12 | 12 |
| Sewage plant | 6 | 6 |
| Farm | 6 | 6 |
| Safety station | 5 | 5 |
| Bus stand | 5 | 5 |
| Water tank | 3 | 3 |
| Hospital | 3 | 3 |
| School | 3 | 3 |
| Park | 2 | 2 |

A Medium block counts as ×3, a Large as ×5, a slum or colony as ×2, an upgraded slum as ×3.
**Park is the tightest fit in the game** — a single Residential Large needs 2.5 of them.
