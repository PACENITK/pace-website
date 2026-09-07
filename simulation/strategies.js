// Strategy-vector sampler, the fixed placement heuristic, and the 8
// hand-written reference strategies (balance-simulation spec §2).
import { SERVICES } from "./engine/tileTypes.js";
import buildingsById, { canPlace } from "./engine/buildings.js";
import { computeCityStats } from "./engine/score.js";
import { chebyshev } from "./engine/allocate.js";
import config from "./engine/config.js";
import { randRange, randInt, choice, shuffle } from "./rng.js";

function tileKey(r, c) {
  return `${r},${c}`;
}

export function sampleStrategy(rng) {
  let serviceShare = randRange(rng, 0.2, 0.7);
  let housingShare = randRange(rng, 0.0, 0.5);
  let commercialShare = randRange(rng, 0.0, 0.5);
  let cashReserve = randRange(rng, 0.0, 0.35);
  const sum = serviceShare + housingShare + commercialShare + cashReserve;
  serviceShare /= sum;
  housingShare /= sum;
  commercialShare /= sum;
  cashReserve /= sum;

  return {
    serviceShare,
    housingShare,
    commercialShare,
    cashReserve,
    housingSizeBias: choice(rng, ["small", "medium", "large", "mixed"]),
    industryAppetite: choice(rng, ["none", "small", "medium", "large"]),
    damPolicy: choice(rng, ["never", "early", "after-flood"]),
    drainagePolicy: choice(rng, ["none", "partial", "full"]),
    olympicsIntent: choice(rng, ["ignore", "opportunistic", "committed"]),
    slumUpgrades: randInt(rng, 0, 4),
    serviceOrder: shuffle(rng, SERVICES),
    expansionTiming: choice(rng, ["year0", "spread", "late"]),
  };
}

// Rotating each reference strategy's serviceOrder by a different offset
// avoids an artifact where every hand-written strategy processes the
// same service last (transport/food, at the tail of SERVICES) and
// starves it regardless of theme -- sampleStrategy() already shuffles
// this per run, but a fixed benchmark set needs its own variety.
function rotate(offset) {
  const arr = SERVICES.slice();
  return arr.slice(offset).concat(arr.slice(0, offset));
}

export const REFERENCE_STRATEGIES = {
  services_first: {
    serviceShare: 0.65, housingShare: 0.1, commercialShare: 0.1, cashReserve: 0.15,
    housingSizeBias: "small", industryAppetite: "none", damPolicy: "early",
    drainagePolicy: "full", olympicsIntent: "ignore", slumUpgrades: 2,
    serviceOrder: rotate(0), expansionTiming: "spread",
  },
  industry_rush: {
    serviceShare: 0.3, housingShare: 0.1, commercialShare: 0.5, cashReserve: 0.1,
    housingSizeBias: "small", industryAppetite: "large", damPolicy: "never",
    drainagePolicy: "none", olympicsIntent: "ignore", slumUpgrades: 0,
    serviceOrder: rotate(1), expansionTiming: "year0",
  },
  max_population: {
    serviceShare: 0.35, housingShare: 0.5, commercialShare: 0.05, cashReserve: 0.1,
    housingSizeBias: "large", industryAppetite: "none", damPolicy: "never",
    drainagePolicy: "none", olympicsIntent: "ignore", slumUpgrades: 0,
    serviceOrder: rotate(2), expansionTiming: "year0",
  },
  balanced: {
    serviceShare: 0.4, housingShare: 0.25, commercialShare: 0.2, cashReserve: 0.15,
    housingSizeBias: "mixed", industryAppetite: "small", damPolicy: "early",
    drainagePolicy: "partial", olympicsIntent: "opportunistic", slumUpgrades: 2,
    serviceOrder: rotate(3), expansionTiming: "spread",
  },
  hoard_cash: {
    serviceShare: 0.3, housingShare: 0.15, commercialShare: 0.2, cashReserve: 0.35,
    housingSizeBias: "small", industryAppetite: "none", damPolicy: "never",
    drainagePolicy: "none", olympicsIntent: "ignore", slumUpgrades: 0,
    serviceOrder: rotate(4), expansionTiming: "late",
  },
  olympics_focused: {
    serviceShare: 0.3, housingShare: 0.15, commercialShare: 0.4, cashReserve: 0.15,
    housingSizeBias: "medium", industryAppetite: "none", damPolicy: "never",
    drainagePolicy: "none", olympicsIntent: "committed", slumUpgrades: 0,
    serviceOrder: rotate(5), expansionTiming: "year0",
  },
  slum_rehousing: {
    serviceShare: 0.45, housingShare: 0.15, commercialShare: 0.15, cashReserve: 0.25,
    housingSizeBias: "small", industryAppetite: "none", damPolicy: "early",
    drainagePolicy: "full", olympicsIntent: "ignore", slumUpgrades: 4,
    serviceOrder: rotate(6), expansionTiming: "spread",
  },
  careless_baseline: {
    serviceShare: 0.1, housingShare: 0.6, commercialShare: 0.2, cashReserve: 0.1,
    housingSizeBias: "large", industryAppetite: "large", damPolicy: "never",
    drainagePolicy: "none", olympicsIntent: "ignore", slumUpgrades: 0,
    serviceOrder: rotate(7), expansionTiming: "year0",
  },
};

// ---- board helpers -------------------------------------------------

export function emptyBuildableTiles(map, state) {
  const out = [];
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      const key = tileKey(r, c);
      if (state.placed[key]) continue;
      if (map.tiles[r][c].type === "empty") out.push({ r, c, key, lowLying: map.tiles[r][c].lowLying });
    }
  }
  return out;
}

function riverTiles(map, state) {
  const out = [];
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      const key = tileKey(r, c);
      if (state.placed[key]) continue;
      if (map.tiles[r][c].type === "river") out.push({ r, c, key });
    }
  }
  return out;
}

function countById(state, id) {
  let n = 0;
  for (const v of Object.values(state.placed)) if (v === id) n += 1;
  return n;
}
function hasService(state, service) {
  return Object.values(state.placed).some((id) => buildingsById[id].serves === service);
}
function transportCount(state) {
  return Object.values(state.placed).filter((id) => buildingsById[id].category === "transport").length;
}

// `cache` holds facts about state.placed that don't change while
// scanning candidates within a single guard-loop iteration (it's only
// invalidated once a building actually gets placed) -- computing them
// once instead of per-candidate avoids an O(candidates * buildings)
// rescan that used to dominate placeCommercial's runtime.
function buildPlacementCache(state) {
  const idCounts = {};
  let hasPower = false;
  let hasWater = false;
  let transport = 0;
  for (const id of Object.values(state.placed)) {
    idCounts[id] = (idCounts[id] || 0) + 1;
    const def = buildingsById[id];
    if (def.serves === "power") hasPower = true;
    if (def.serves === "water") hasWater = true;
    if (def.category === "transport") transport += 1;
  }
  return { idCounts, hasPower, hasWater, transport };
}

function makeCtx(map, state, r, c, popLookup, cache) {
  return {
    tile: { type: map.tiles[r][c].type, buildable: map.tiles[r][c].type === "empty" },
    cash: state.cash,
    hasService: (svc) => (svc === "power" ? cache.hasPower : svc === "water" ? cache.hasWater : hasService(state, svc)),
    countById: (id) => cache.idCounts[id] || 0,
    transportCount: cache.transport,
    popInRadius: (radius) => popLookup(r, c, Number.isFinite(radius) ? radius : 0),
  };
}

// `buildableTiles`, when given, is a shared mutable list rebuilt once
// per year (see runPurchasePhase) rather than rescanned on every guard
// iteration of every sub-phase -- rescanning all 192 tiles from
// scratch on each of the ~150-200 placement attempts per year was a
// meaningful share of the original runtime (see sim-report.md perf
// note). Placing a building splices it out in O(n) instead of O(tiles).
function place(state, key, id, cost, buildableTiles) {
  state.placed[key] = id;
  state.cash -= cost;
  if (buildableTiles) {
    const idx = buildableTiles.findIndex((t) => t.key === key);
    if (idx !== -1) buildableTiles.splice(idx, 1);
  }
}

// ---- purchase phase --------------------------------------------------
//
// One computeCityStats() snapshot drives every decision for the whole
// year; a local `remaining` grid (copied from that snapshot) is
// approximately decremented as buildings are placed within the year so
// later decisions in the same pass don't pile onto already-covered
// demand. This keeps 100k full 6-year runs tractable -- exact
// ring/nearest-first reallocation only happens once per year (via
// computeCityStats, for income/scoring) rather than after every single
// purchase. Final scores are always exact; only in-year placement
// ranking is approximate.
export function runPurchasePhase(state, map, strategy, cfg, year) {
  if (year === 0) doSlumUpgrades(state, map, strategy, cfg);

  const stats = computeCityStats(map, state.placed, state.slumUpgraded, cfg, state.residentialDemandMultiplier || 1);
  // 2D arrays (not "r,c"-keyed objects) so the coverage scan in
  // fillService can use a summed-area table instead of an O(radius^2)
  // rescan per candidate tile per placement -- with ~160 candidates and
  // up to 40 placements per service, that rescan was the dominant cost
  // in a naive version of this heuristic (see sim-report.md perf note).
  const remaining = {};
  SERVICES.forEach((s) => {
    const grid = [];
    for (let r = 0; r < map.height; r++) {
      const row = [];
      for (let c = 0; c < map.width; c++) {
        const t = stats.tileStats[tileKey(r, c)];
        row.push(Math.max(0, (t?.demand[s] || 0) - (t?.served[s] || 0)));
      }
      grid.push(row);
    }
    remaining[s] = grid;
  });

  // Population-in-radius is checked by canPlace() for every candidate
  // tile on every attempt (market/mall/restaurant prerequisites) -- a
  // per-call O(radius^2) rescan there was, along with fillService's
  // coverage scan, one of the two dominant costs in a naive version of
  // this heuristic. A single prefix-sum table (population is fixed for
  // the whole year, same snapshot as `remaining` above) makes each
  // lookup O(1) instead.
  const popGrid = [];
  for (let r = 0; r < map.height; r++) {
    const row = [];
    for (let c = 0; c < map.width; c++) row.push(stats.tileStats[tileKey(r, c)]?.pop || 0);
    popGrid.push(row);
  }
  const popPrefix = buildPrefixSum(popGrid, map.width, map.height);
  function popLookup(r, c, radius) {
    return boxSum(popPrefix, r - radius, c - radius, r + radius, c + radius, map.width, map.height);
  }

  // Rebuilt once per year and shared by every sub-phase below, each of
  // which splices its own placements out via place()'s buildableTiles
  // argument -- see place() for why this replaces a per-attempt rescan.
  const buildableTiles = emptyBuildableTiles(map, state);

  const reserve = state.cash * strategy.cashReserve;
  let budget = Math.max(0, state.cash - reserve);

  budget = ensurePower(state, map, budget, buildableTiles);
  const totalShare = strategy.serviceShare + strategy.housingShare + strategy.commercialShare || 1;
  let serviceBudget = budget * (strategy.serviceShare / totalShare);
  let housingBudget = budget * (strategy.housingShare / totalShare);
  let commercialBudget = budget * (strategy.commercialShare / totalShare);

  const order = ["water", ...strategy.serviceOrder.filter((s) => s !== "water" && s !== "power")];
  for (const service of order) {
    serviceBudget = fillService(state, map, service, serviceBudget, remaining, buildableTiles);
  }

  if (shouldExpandHousing(strategy, year)) {
    housingBudget = placeHousing(state, map, strategy, housingBudget, buildableTiles);
  }

  commercialBudget = placeCommercial(state, map, strategy, commercialBudget, popLookup, buildableTiles);

  applyProtectionPolicy(state, map, strategy, year);
}

function doSlumUpgrades(state, map, strategy, cfg) {
  let left = strategy.slumUpgrades;
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      if (left <= 0) return;
      if (map.tiles[r][c].type !== "slum") continue;
      const key = tileKey(r, c);
      if (state.slumUpgraded.has(key)) continue;
      if (state.cash < cfg.slumUpgradeCost) return;
      state.slumUpgraded.add(key);
      state.cash -= cfg.slumUpgradeCost;
      left -= 1;
    }
  }
}

export function ensurePower(state, map, budget, buildableTiles) {
  if (hasService(state, "power")) return budget;
  const def = buildingsById.power_plant;
  if (budget < def.cost || state.cash < def.cost) return budget;
  if (buildableTiles.length === 0) return budget;
  // Centre-ish placement: minimise max distance to map centre so the
  // radius-5 plant clips the map edge as little as possible.
  const cy = map.height / 2;
  const cx = map.width / 2;
  let best = buildableTiles[0];
  let bestDist = chebyshev(best.r, best.c, cy, cx);
  for (const cand of buildableTiles) {
    const d = chebyshev(cand.r, cand.c, cy, cx);
    if (d < bestDist) {
      bestDist = d;
      best = cand;
    }
  }
  place(state, best.key, "power_plant", def.cost, buildableTiles);
  return budget - def.cost;
}

// Prefix-sum ("summed-area table") over a 2D grid so the sum of any
// axis-aligned box -- exactly what a Chebyshev-radius coverage area is
// -- is an O(1) lookup instead of an O(radius^2) rescan. Rebuilt after
// every placement (O(tiles), cheap) rather than rescanning per
// candidate tile (O(candidates * radius^2), the actual hot path).
function buildPrefixSum(grid, width, height) {
  const sum = Array.from({ length: height + 1 }, () => new Array(width + 1).fill(0));
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      sum[r + 1][c + 1] = grid[r][c] + sum[r][c + 1] + sum[r + 1][c] - sum[r][c];
    }
  }
  return sum;
}
function boxSum(prefix, r0, c0, r1, c1, width, height) {
  r0 = Math.max(0, r0);
  c0 = Math.max(0, c0);
  r1 = Math.min(height - 1, r1);
  c1 = Math.min(width - 1, c1);
  if (r1 < r0 || c1 < c0) return 0;
  return prefix[r1 + 1][c1 + 1] - prefix[r0][c1 + 1] - prefix[r1 + 1][c0] + prefix[r0][c0];
}
function gridTotal(grid, width, height) {
  let total = 0;
  for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) total += grid[r][c];
  return total;
}

// Cheapest tier per service that the strategy can afford right now,
// repeatedly placed on the tile covering the most currently-unserved
// demand for that service within its radius, until budget/coverage runs
// out. No backtracking, no debt.
export function fillService(state, map, service, budget, remaining, buildableTiles) {
  // Every essential-service building serves exactly one service; the
  // one exception is transport, which is also served by railway/metro/
  // airport (city-wide, income-generating, chained prerequisites) --
  // those are placed alongside other commercial buildings in
  // placeCommercial instead, so only bus_stand is a "fill coverage"
  // candidate here.
  const candidateIds = Object.values(buildingsById).filter(
    (b) => b.serves === service && (service !== "transport" || b.id === "bus_stand")
  );
  if (candidateIds.length === 0) return budget;
  const { width, height } = map;
  const grid = remaining[service];

  let guard = 0;
  while (budget > 0 && guard < 40) {
    guard += 1;
    const totalUnserved = gridTotal(grid, width, height);
    if (totalUnserved <= 0) break;

    // Gate by prerequisites (power/water) before affordability -- a
    // building can be cheap and still illegal to place yet.
    const cache = buildPlacementCache(state);
    const gateCtx = {
      tile: { type: "empty", buildable: true },
      cash: state.cash,
      hasService: (svc) => (svc === "power" ? cache.hasPower : svc === "water" ? cache.hasWater : false),
      countById: (id) => cache.idCounts[id] || 0,
      transportCount: cache.transport,
      popInRadius: () => 0,
    };
    const legal = candidateIds.filter((b) => canPlace(b.id, gateCtx).ok);
    const affordable = legal.filter((b) => b.cost <= budget && b.cost <= state.cash);
    if (affordable.length === 0) break;
    const def = affordable.sort((a, b) => a.cost - b.cost)[0];

    if (buildableTiles.length === 0) break;

    const radius = Number.isFinite(def.radius) ? def.radius : Infinity;
    const prefix = Number.isFinite(radius) ? buildPrefixSum(grid, width, height) : null;

    let bestTile = null;
    let bestCoverage = -Infinity;
    for (const cand of buildableTiles) {
      const coverage = prefix
        ? boxSum(prefix, cand.r - radius, cand.c - radius, cand.r + radius, cand.c + radius, width, height)
        : totalUnserved; // city-wide: covers everything remaining
      if (coverage > bestCoverage) {
        bestCoverage = coverage;
        bestTile = cand;
      }
    }
    if (!bestTile || bestCoverage <= 0) break;

    place(state, bestTile.key, def.id, def.cost, buildableTiles);
    budget -= def.cost;

    let spare = def.capacity;
    if (!Number.isFinite(radius)) {
      for (let r = 0; r < height && spare > 0; r++) {
        for (let c = 0; c < width && spare > 0; c++) {
          const take = Math.min(spare, grid[r][c]);
          grid[r][c] -= take;
          spare -= take;
        }
      }
    } else {
      for (let d = 0; d <= radius && spare > 0; d++) {
        for (let r = Math.max(0, bestTile.r - d); r <= Math.min(height - 1, bestTile.r + d) && spare > 0; r++) {
          for (let c = Math.max(0, bestTile.c - d); c <= Math.min(width - 1, bestTile.c + d) && spare > 0; c++) {
            if (chebyshev(bestTile.r, bestTile.c, r, c) !== d) continue;
            const take = Math.min(spare, grid[r][c]);
            grid[r][c] -= take;
            spare -= take;
          }
        }
      }
    }
  }
  return budget;
}

function shouldExpandHousing(strategy, year) {
  if (strategy.expansionTiming === "year0") return year === 0;
  if (strategy.expansionTiming === "late") return year >= 3;
  return true; // "spread"
}

const RESIDENTIAL_TIERS = ["residential_small", "residential_medium", "residential_large"];

function residentialTierFor(bias, attemptIndex) {
  if (bias === "small") return "residential_small";
  if (bias === "medium") return "residential_medium";
  if (bias === "large") return "residential_large";
  return RESIDENTIAL_TIERS[attemptIndex % RESIDENTIAL_TIERS.length]; // "mixed": cycle S/M/L
}

function placeHousing(state, map, strategy, budget, buildableTiles) {
  let guard = 0;
  while (budget > 0 && guard < 40) {
    const tierId = residentialTierFor(strategy.housingSizeBias, guard);
    guard += 1;
    const def = buildingsById[tierId];
    if (def.cost > budget || def.cost > state.cash) break;

    if (buildableTiles.length === 0) break;

    // Precomputed once per guard iteration (state.placed is fixed while
    // scanning candidates) instead of rescanning every placed building
    // for every candidate x service -- that rescan used to dominate
    // this function's runtime.
    const industryTiles = [];
    const serversByService = {};
    SERVICES.forEach((s) => (serversByService[s] = []));
    for (const [key, id] of Object.entries(state.placed)) {
      const def2 = buildingsById[id];
      const [br, bc] = key.split(",").map(Number);
      if (def2.category === "industry") industryTiles.push([br, bc]);
      if (def2.serves) serversByService[def2.serves].push({ r: br, c: bc, radius: Number.isFinite(def2.radius) ? def2.radius : Infinity });
    }

    let bestTile = null;
    let bestScore = -Infinity;
    for (const cand of buildableTiles) {
      const nearIndustry = industryTiles.some(([ir, ic]) => chebyshev(ir, ic, cand.r, cand.c) < 3);
      if (nearIndustry) continue;
      let coverageScore = 0;
      for (const service of SERVICES) {
        const has = serversByService[service].some(
          (s) => !Number.isFinite(s.radius) || chebyshev(s.r, s.c, cand.r, cand.c) <= s.radius
        );
        if (has) coverageScore += 1;
      }
      if (coverageScore > bestScore) {
        bestScore = coverageScore;
        bestTile = cand;
      }
    }
    if (!bestTile) break;

    place(state, bestTile.key, tierId, def.cost, buildableTiles);
    budget -= def.cost;
  }
  return budget;
}

const ECONOMY_ORDER = ["restaurant", "market", "railway", "hotel", "mall", "stadium", "metro", "airport"];

function placeCommercial(state, map, strategy, budget, popLookup, buildableTiles) {
  let guard = 0;

  const industryTier =
    strategy.industryAppetite === "large"
      ? "industry_large"
      : strategy.industryAppetite === "medium"
      ? "industry_medium"
      : strategy.industryAppetite === "small"
      ? "industry_small"
      : null;

  const wantsOlympics = strategy.olympicsIntent !== "ignore";
  const order = wantsOlympics ? ["stadium", "hotel", "hotel", "hotel", "hotel", "hotel", "restaurant", "restaurant", "restaurant", "market", "mall"] : ECONOMY_ORDER;
  const attemptOrder = industryTier ? [industryTier, ...order] : order;

  // Settlement tiles never change within a game -- computed once here
  // rather than rescanned on every guard iteration.
  const settlementTiles = [];
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      const type = map.tiles[r][c].type;
      if (type === "slum" || type === "colony") settlementTiles.push([r, c]);
    }
  }

  let idx = 0;
  while (budget > 0 && guard < 60 && idx < attemptOrder.length * 4) {
    guard += 1;
    const id = attemptOrder[idx % attemptOrder.length];
    idx += 1;
    const def = buildingsById[id];
    if (!def) continue;
    if (def.cost > budget || def.cost > state.cash) {
      if (idx > attemptOrder.length * 3) break;
      continue;
    }

    if (buildableTiles.length === 0) break;

    const cache = buildPlacementCache(state);
    const populated = settlementTiles.slice();
    for (const [key, bid] of Object.entries(state.placed)) {
      if (buildingsById[bid].category === "residential") populated.push(key.split(",").map(Number));
    }

    let bestTile = null;
    if (def.category === "industry") {
      let bestDist = -Infinity;
      for (const cand of buildableTiles) {
        const ctx = makeCtx(map, state, cand.r, cand.c, popLookup, cache);
        if (!canPlace(id, ctx).ok) continue;
        let minDist = 99;
        for (const [pr, pc] of populated) minDist = Math.min(minDist, chebyshev(pr, pc, cand.r, cand.c));
        if (minDist > bestDist) {
          bestDist = minDist;
          bestTile = cand;
        }
      }
    } else {
      let bestScore = -Infinity;
      for (const cand of buildableTiles) {
        const ctx = makeCtx(map, state, cand.r, cand.c, popLookup, cache);
        if (!canPlace(id, ctx).ok) continue;
        let dist = populated.length === 0 ? 0 : Infinity;
        for (const [pr, pc] of populated) dist = Math.min(dist, chebyshev(pr, pc, cand.r, cand.c));
        const score = -dist;
        if (score > bestScore) {
          bestScore = score;
          bestTile = cand;
        }
      }
    }

    if (!bestTile) continue;
    place(state, bestTile.key, id, def.cost, buildableTiles);
    budget -= def.cost;
  }
  return budget;
}

function applyProtectionPolicy(state, map, strategy, year) {
  if (strategy.damPolicy === "early" && year === 0) placeDam(state, map);
  if (strategy.damPolicy === "after-flood" && year >= 1 && !countById(state, "dam")) placeDam(state, map);

  if (strategy.drainagePolicy === "none") return;
  const targetFraction = strategy.drainagePolicy === "full" ? 1 : 0.5;
  placeDrainage(state, map, targetFraction);
}

function placeDam(state, map) {
  const def = buildingsById.dam;
  if (state.cash < def.cost) return;
  const candidates = riverTiles(map, state);
  if (candidates.length === 0) return;

  const flowIndex = new Map(map.riverPath.map((p, i) => [tileKey(p.row, p.col), i]));
  let bestTile = null;
  let bestProtects = -Infinity;
  for (const cand of candidates) {
    const idx = flowIndex.get(cand.key);
    if (idx === undefined) continue;
    let protects = 0;
    for (let r = 0; r < map.height; r++) {
      for (let c = 0; c < map.width; c++) {
        if (!map.tiles[r][c].lowLying) continue;
        if (chebyshev(cand.r, cand.c, r, c) > config.damDownstreamRadius) continue;
        protects += 1;
      }
    }
    if (protects > bestProtects) {
      bestProtects = protects;
      bestTile = cand;
    }
  }
  if (!bestTile || bestProtects <= 0) return;
  place(state, bestTile.key, "dam", def.cost);
}

function placeDrainage(state, map, targetFraction) {
  const def = buildingsById.storm_drainage;
  const lowLyingBuilt = [];
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      const key = tileKey(r, c);
      if (!map.tiles[r][c].lowLying) continue;
      if (!state.placed[key]) continue;
      lowLyingBuilt.push({ r, c, key, cost: buildingsById[state.placed[key]].cost });
    }
  }
  lowLyingBuilt.sort((a, b) => b.cost - a.cost);
  const targetCount = Math.ceil(lowLyingBuilt.length * targetFraction);

  let guard = 0;
  let covered = 0;
  const drainagePlaced = [];
  for (const target of lowLyingBuilt) {
    if (covered >= targetCount) break;
    if (state.cash < def.cost) break;
    guard += 1;
    if (guard > 20) break;
    const alreadyCovered = drainagePlaced.some((d) => chebyshev(d.r, d.c, target.r, target.c) <= config.floodDrainageRadius);
    if (alreadyCovered) {
      covered += 1;
      continue;
    }
    const candidates = emptyBuildableTiles(map, state).filter(
      (cand) => chebyshev(cand.r, cand.c, target.r, target.c) <= config.floodDrainageRadius
    );
    if (candidates.length === 0) continue;
    const tile = candidates[0];
    place(state, tile.key, "storm_drainage", def.cost);
    drainagePlaced.push(tile);
    covered += 1;
  }
}
