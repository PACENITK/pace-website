import buildingsById from "./buildings.js";
import { computeCityStats } from "./score.js";
import { chebyshev } from "./allocate.js";

function tileKey(r, c) {
  return `${r},${c}`;
}

// Every low-lying tile carrying a placed building is checked against
// dam/drainage protection (Part H "Flood"). Inherited slum/colony tiles
// can't be demolished and aren't "buildings," so they're never
// destroyed directly -- but a low-lying slum that loses its nearby
// service buildings still goes unserved next allocation pass. This is
// a documented interpretation call: the rulebook's flood table is
// written in terms of buildings, not settlement tiles.
export function computeDamProtectedTiles(placed, map, config) {
  const damPositions = Object.entries(placed)
    .filter(([, id]) => id === "dam")
    .map(([key]) => key.split(",").map(Number));
  if (damPositions.length === 0) return new Set();

  const flowIndex = new Map(map.riverPath.map((p, i) => [`${p.row},${p.col}`, i]));
  const protectedTiles = new Set();

  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      if (!map.tiles[r][c].lowLying) continue;
      let nearestRiverIdx = 0;
      let nearestDist = Infinity;
      map.riverPath.forEach((p, i) => {
        const dist = chebyshev(p.row, p.col, r, c);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestRiverIdx = i;
        }
      });
      for (const [dr, dc] of damPositions) {
        const damIdx = flowIndex.get(`${dr},${dc}`);
        if (damIdx === undefined) continue;
        if (chebyshev(dr, dc, r, c) > config.damDownstreamRadius) continue;
        // "protects tiles downstream of it" -- same or later position in
        // the river's flow order as the dam itself.
        if (nearestRiverIdx >= damIdx) protectedTiles.add(tileKey(r, c));
      }
    }
  }
  return protectedTiles;
}

export function computeDrainageProtectedTiles(placed, map, config) {
  const drainagePositions = Object.entries(placed)
    .filter(([, id]) => id === "storm_drainage")
    .map(([key]) => key.split(",").map(Number));
  const protectedTiles = new Set();
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      if (!map.tiles[r][c].lowLying) continue;
      const covered = drainagePositions.some(([dr, dc]) => chebyshev(dr, dc, r, c) <= config.floodDrainageRadius);
      if (covered) protectedTiles.add(tileKey(r, c));
    }
  }
  return protectedTiles;
}

export function applyFlood(state, map, config) {
  const damProtected = computeDamProtectedTiles(state.placed, map, config);
  const drainageProtected = computeDrainageProtectedTiles(state.placed, map, config);

  const destroyed = [];
  let repairCost = 0;
  for (const [key, buildingId] of Object.entries(state.placed)) {
    const [r, c] = key.split(",").map(Number);
    if (!map.tiles[r][c].lowLying) continue;
    if (damProtected.has(key)) continue;
    const def = buildingsById[buildingId];
    if (drainageProtected.has(key)) {
      repairCost += def.cost * config.floodDrainageRepairFraction;
    } else {
      destroyed.push(key);
    }
  }
  destroyed.forEach((key) => delete state.placed[key]);
  state.cash = Math.max(0, state.cash - repairCost);
  return { destroyed, repairCost };
}

// "1 hospital required per 2,500 people. Slums count double." Read
// literally: weighted population = non-slum pop + 2x slum pop.
export function applyPandemic(state, map, config) {
  const stats = computeCityStats(map, state.placed, state.slumUpgraded, config, state.residentialDemandMultiplier || 1);
  let slumPop = 0;
  let nonSlumPop = 0;
  Object.values(stats.tileStats).forEach((t) => {
    if (t.pop <= 0) return;
    if (t.isSlum) slumPop += t.pop;
    else nonSlumPop += t.pop;
  });
  const weightedPop = nonSlumPop + config.pandemicSlumMultiplier * slumPop;
  const required = Math.ceil(weightedPop / config.pandemicPopPerHospital);
  const hospitalsBuilt = Object.values(state.placed).filter((id) => id === "hospital").length;
  const shortfall = Math.max(0, required - hospitalsBuilt);

  let incomeMultiplier = 1;
  let scorePenalty = 0;
  let cashBonus = 0;
  if (shortfall === 0) cashBonus = config.pandemicMetBonusCash;
  else if (shortfall === 1) incomeMultiplier = config.pandemicShort1IncomeMultiplier;
  else {
    incomeMultiplier = config.pandemicShort2PlusIncomeMultiplier;
    scorePenalty = config.pandemicShort2PlusScorePenalty;
  }
  return { required, hospitalsBuilt, shortfall, incomeMultiplier, scorePenalty, cashBonus, met: shortfall === 0 };
}

// "5,000 people arrive... added to your existing homes above their
// rated capacity -- every residential building's population and demand
// rises proportionally." Modeled as a multiplier on player-built
// residential tiles only (inherited slums/colonies have no "rated
// capacity" to overflow).
export function applyImmigration(state, config) {
  const residentialPop = Object.values(state.placed)
    .filter((id) => buildingsById[id].category === "residential")
    .reduce((s, id) => s + buildingsById[id].populates.pop, 0);
  if (residentialPop === 0) return { overflowFactor: 0 };
  const overflowFactor = config.immigrationPeople / residentialPop;
  state.immigrationOverflow = (state.immigrationOverflow || 0) + overflowFactor;
  return { overflowFactor };
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
