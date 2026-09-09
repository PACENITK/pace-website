import buildingsById from "./buildings.js";
import { computeCityStats } from "./score.js";
import { chebyshev } from "./allocate.js";

function tileKey(r, c) {
  return `${r},${c}`;
}

// Category buckets for the v4 flood repair table (config.floodRepair).
// "destructible" (park/drainage/farm) is destroyed outright in Zone A,
// damaged-with-repair in Zone B; everything else is damaged-with-repair
// in both zones at different rates. Hydro joins essentialService
// (v4's own table lists it alongside hospital/school/sewage/water/
// safety at the same 40%/20% rates).
function floodCategory(id) {
  const def = buildingsById[id];
  if (id === "hydro_station") return "essentialService";
  if (["hospital", "school", "sewage_plant", "water_tank", "water_treatment", "safety_station"].includes(id)) {
    return "essentialService";
  }
  if (["park", "storm_drainage", "farm"].includes(id)) return "destructible";
  if (def.category === "residential") return "residential";
  if (def.category === "economy" || def.category === "industry") return "commercialIndustry";
  return null; // dam itself, and anything else with no listed repair economics
}

// Which columns a dam at `damCol` protects -- downstream = higher
// column index, matching the river's own left-to-right riverPath
// order used everywhere else in this engine (map.js/data builds
// riverPath in increasing column order).
function damProtectedColumns(damCol, span) {
  const cols = new Set();
  for (let c = damCol; c < damCol + span; c++) cols.add(c);
  return cols;
}

function damPositions(placed) {
  return Object.entries(placed)
    .filter(([, id]) => id === "dam")
    .map(([key]) => key.split(",").map(Number));
}

// True if any dam's protected column-span covers this column -- full
// immunity, the strongest protection tier.
function isDamProtected(col, placed, config) {
  return damPositions(placed).some(([, damCol]) => damProtectedColumns(damCol, config.damProtectionSpan).has(col));
}

// A hydro station's protection is specifically about *its own* dam --
// v4: "A hydro station downstream of its own dam is protected.
// Upstream, it is not." A hydro can only exist adjacent to a dam at
// all (canPlace's prerequisite), so "its own dam" is whichever
// adjacent dam is protecting it; if more than one dam is adjacent
// (rare -- two dams built within 1 tile of each other), protected if
// *any* of them would cover it, same generous-union rule as every
// other building's protection check.
function isHydroProtected(row, col, placed, config) {
  const adjacentDams = damPositions(placed).filter(([dr, dc]) => chebyshev(dr, dc, row, col) <= config.hydroAdjacencyRadius);
  return adjacentDams.some(([, damCol]) => damProtectedColumns(damCol, config.damProtectionSpan).has(col));
}

function isDrainageProtected(row, col, placed, config) {
  return Object.entries(placed).some(
    ([key, id]) => id === "storm_drainage" && chebyshev(...key.split(",").map(Number), row, col) <= config.floodDrainageRadius
  );
}

// v4 Part C/D rewrite: graded flood zones (A severe, B moderate)
// replace the old flat lowLying boolean, and damage is now a repair
// cost/offline period rather than a binary destroy. Population is
// never destroyed -- a hit settlement tile (slum or residential) keeps
// its declared pop/demand but goes "damaged" (services cut, permanently
// unserved in computeCityStats until repaired). A hit park/drainage/
// farm in Zone A is destroyed outright (removed from `placed`, cost
// lost, no repair option) since a storm drain's own halving doesn't
// downgrade that outcome (see config.js's comment on this).
//
// Mutates `state.placed` (destroys), `state.damagedTiles` (adds repair
// entries) and `state.pollutionSpillTiles` (industry-only) in place;
// returns a summary for the reveal modal / action log.
export function applyFlood(state, map, config) {
  state.damagedTiles = state.damagedTiles || {};
  state.pollutionSpillTiles = state.pollutionSpillTiles || new Set();

  const destroyed = [];
  const damaged = [];

  // Built buildings in a flood zone.
  for (const [key, id] of Object.entries(state.placed)) {
    const [r, c] = key.split(",").map(Number);
    const zone = map.tiles[r][c].floodZone;
    if (!zone) continue;
    if (id === "dam") continue; // a dam doesn't damage itself

    const isHydro = id === "hydro_station";
    const protectedByDam = isHydro ? isHydroProtected(r, c, state.placed, config) : isDamProtected(c, state.placed, config);
    if (protectedByDam) continue;

    const drainageHalves = !isHydro && config.floodDrainageHalvesRepair && isDrainageProtected(r, c, state.placed, config);
    const category = floodCategory(id);
    if (!category) continue;

    const rate = config.floodRepair[category][zone];
    if (rate === null) {
      // destructible, Zone A -- destroyed outright, drainage can't save it.
      delete state.placed[key];
      destroyed.push({ key, id });
      continue;
    }
    const def = buildingsById[id];
    let repairCost = category === "slum" ? rate : Math.round(def.cost * rate);
    if (drainageHalves) repairCost = Math.round(repairCost / 2);
    state.damagedTiles[key] = { repairCost, id, zone };
    damaged.push({ key, id, zone, repairCost });

    if (def.category === "industry" && zone === "A") {
      state.pollutionSpillTiles.add(key);
    }
  }

  // Inherited/immigration slum tiles in a flood zone (not in `placed`
  // at all -- a slum is settlement, not a building).
  const extraSlums = state.extraSlums || {};
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      const key = tileKey(r, c);
      const isSlumTile = map.tiles[r][c].type === "slum" || extraSlums[key];
      if (!isSlumTile) continue;
      if (state.slumUpgraded && state.slumUpgraded.has(key)) continue; // rehoused -> now residential, handled above if ever "placed" (it isn't) -- rehoused slums simply aren't slums anymore, no slum-row damage applies
      const zone = map.tiles[r][c].floodZone;
      if (!zone) continue;
      if (isDamProtected(c, state.placed, config)) continue;
      const drainageHalves = config.floodDrainageHalvesRepair && isDrainageProtected(r, c, state.placed, config);
      let repairCost = config.floodRepair.slum[zone];
      if (drainageHalves) repairCost = Math.round(repairCost / 2);
      state.damagedTiles[key] = { repairCost, id: "slum", zone };
      damaged.push({ key, id: "slum", zone, repairCost });
    }
  }

  return { destroyed, damaged };
}

// v4 Part B: checked once, at the Year 0 -> 1 transition only -- not a
// twist, and never blocks (a confused team keeps playing). Water uses
// the city-wide coverage total (computeCityStats().coverage.water)
// rather than a per-tile strict check, matching "covering all
// inherited demand units" read as an aggregate, not tile-by-tile.
export function checkMandatoryFloor(stats, placed) {
  const failed = [];
  const hasDam = Object.values(placed).some((id) => id === "dam");
  const hasHydro = Object.values(placed).some((id) => id === "hydro_station");
  if (!hasDam || !hasHydro) failed.push("dam + hydro station");
  if (stats.coverage.water.served < stats.coverage.water.total) failed.push("full water coverage");
  if (!Object.values(placed).some((id) => id === "sewage_plant")) failed.push("a sewage plant");
  if (!Object.values(placed).some((id) => id === "hospital")) failed.push("a hospital");
  return { met: failed.length === 0, failed };
}

// v4 Part E rewrite: waterborne outbreak, two checks instead of one.
//
// Containment: a home is "infected" if no sewage plant actually
// reaches it (served.sanitation <= 0 -- read "without...in range"
// literally, not "partially served"), OR its water comes only from
// water tank(s) and none of those tanks are themselves within a
// sewage plant's range (a water-treatment plant has no such exposure --
// this is the treatment plant's reason to exist over three tanks).
// Treatment: 1 hospital per 2,500 weighted-infected population, slums
// counting double, exactly like the old pandemic model's formula.
export function applyOutbreak(state, map, config) {
  const stats = computeCityStats(
    map,
    state.placed,
    state.slumUpgraded,
    config,
    state.residentialDemandMultiplier || 1,
    { extraSlums: state.extraSlums, damagedTiles: state.damagedTiles, pollutionSpillTiles: state.pollutionSpillTiles }
  );

  const waterTankPositions = Object.entries(state.placed)
    .filter(([, id]) => id === "water_tank")
    .map(([key]) => key);
  const tankExposed = new Map(); // tank key -> is it itself within sewage range
  waterTankPositions.forEach((key) => {
    const [r, c] = key.split(",").map(Number);
    const near = Object.entries(state.placed).some(
      ([sKey, sId]) => sId === "sewage_plant" && chebyshev(...sKey.split(",").map(Number), r, c) <= buildingsById.sewage_plant.radius
    );
    tankExposed.set(key, near);
  });

  let infectedSlumPop = 0;
  let infectedNonSlumPop = 0;
  Object.values(stats.tileStats).forEach((t) => {
    if (t.pop <= 0) return;
    const containedBySewage = t.served.sanitation > 0;
    if (!containedBySewage) {
      if (t.isSlum) infectedSlumPop += t.pop;
      else infectedNonSlumPop += t.pop;
      return;
    }
    const waterSuppliers = stats.perService.water.servedBy[t.row][t.col];
    const onlyTanks = waterSuppliers.length > 0 && waterSuppliers.every((s) => state.placed[s.key] === "water_tank");
    const anyTankExposed = waterSuppliers.some((s) => state.placed[s.key] === "water_tank" && tankExposed.get(s.key));
    if (onlyTanks && !anyTankExposed) {
      if (t.isSlum) infectedSlumPop += t.pop;
      else infectedNonSlumPop += t.pop;
    }
  });

  const infectedPop = infectedSlumPop + infectedNonSlumPop;
  const weightedPop = infectedNonSlumPop + config.outbreakSlumMultiplier * infectedSlumPop;
  const required = infectedPop > 0 ? Math.ceil(weightedPop / config.outbreakPopPerHospital) : 0;
  const hospitalsBuilt = Object.values(state.placed).filter((id) => id === "hospital").length;
  const shortfall = Math.max(0, required - hospitalsBuilt);

  let incomeMultiplier = 1;
  let scoreDelta = 0;
  let cashBonus = 0;
  let tier;

  if (infectedPop === 0) {
    tier = "none";
    cashBonus = config.outbreakNoneCashBonus;
    scoreDelta = config.outbreakNoneScoreBonus;
  } else if (shortfall === 0) {
    tier = "treated";
  } else if (hospitalsBuilt === 0) {
    tier = "noHospital";
    scoreDelta = -config.outbreakNoHospitalScorePenalty;
    incomeMultiplier = config.outbreakNoHospitalIncomeMultiplier;
  } else {
    tier = "short";
    scoreDelta = -config.outbreakShortPenaltyPerHospital * shortfall;
    incomeMultiplier = config.outbreakShortIncomeMultiplier;
  }

  return { tier, infectedPop, infectedSlumPop, infectedNonSlumPop, required, hospitalsBuilt, shortfall, incomeMultiplier, scoreDelta, cashBonus };
}

// v4 Part F rewrite: immigration spawns 2 new slum tiles (2,500 each)
// on empty land near existing settlements, rather than inflating
// existing homes' demand -- "punished teams for building" was the
// stated reason for dropping the old model. New slums live in
// state.extraSlums ("r,c" -> {pop, demandUnits}), never as a mutation
// of the shared `map` singleton: map.tiles is one module-level object
// imported by every team/game, so writing a new type into it here
// would leak into everyone else's board.
export function applyImmigrationSlums(state, map, config) {
  const occupied = new Set(Object.keys(state.placed));
  const settlementPositions = [];
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      const key = tileKey(r, c);
      if (map.tiles[r][c].type === "slum" || map.tiles[r][c].type === "colony" || (state.extraSlums && state.extraSlums[key])) {
        settlementPositions.push([r, c]);
      }
    }
  }
  Object.entries(state.placed).forEach(([key, id]) => {
    if (buildingsById[id].category === "residential") settlementPositions.push(key.split(",").map(Number));
  });

  const candidates = [];
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      const key = tileKey(r, c);
      if (map.tiles[r][c].type !== "empty") continue;
      if (occupied.has(key)) continue;
      if (state.extraSlums && state.extraSlums[key]) continue;
      let minDist = Infinity;
      settlementPositions.forEach(([sr, sc]) => {
        minDist = Math.min(minDist, chebyshev(sr, sc, r, c));
      });
      candidates.push({ key, minDist });
    }
  }
  candidates.sort((a, b) => a.minDist - b.minDist);

  const spawned = candidates.slice(0, config.immigrationNewSlumCount).map((c) => c.key);
  state.extraSlums = state.extraSlums || {};
  spawned.forEach((key) => {
    state.extraSlums[key] = { pop: config.immigrationNewSlumPop, demandUnits: config.immigrationNewSlumDemandUnits };
  });

  return { spawned };
}

export function evaluateOlympics(state, config) {
  const counts = { stadium: 0, hotel: 0, restaurant: 0 };
  Object.values(state.placed).forEach((id) => {
    if (id in counts) counts[id] += 1;
  });
  const req = config.olympicsRequirements;
  const qualified = counts.stadium >= req.stadium && counts.hotel >= req.hotel && counts.restaurant >= req.restaurant;
  return {
    counts,
    qualified,
    cashBonus: qualified ? config.olympicsQualifiedCash : 0,
    scoreDelta: qualified ? config.olympicsQualifiedScore : config.olympicsFailScore,
  };
}

export function revealTreasure(state, treasureTile, config) {
  const builtId = state.placed[treasureTile];
  if (!builtId) return { cashGain: config.treasureValue, demolished: null };
  delete state.placed[treasureTile];
  return { cashGain: config.treasureValue, demolished: { tile: treasureTile, buildingId: builtId } };
}
