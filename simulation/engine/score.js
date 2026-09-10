import tileTypes, { SERVICES, effectiveSettlement } from "./tileTypes.js";
import buildingsById from "./buildings.js";
import { allocate, chebyshev } from "./allocate.js";

function tileKey(r, c) {
  return `${r},${c}`;
}

// Static-snapshot scoring, Part I. Everything here is a pure function of
// (map, placed, slumUpgraded, config, ...) -- never accumulated -- and
// excludes anything that depends on game history rather than the
// current board: cash bonus and twist-specific bonuses/penalties
// (outbreak, Olympics, flood) are added on top by simulate.js/
// useGameStore.js/backend game/state.js, since those require knowing
// what happened across years, not just the current tiles.
//
// residentialDemandMultiplier > 1 models immigration overflow on
// player-built homes (kept from v3 for that specific mechanic --
// immigration itself is now new slum tiles, see the `flood` param
// below, not a demand multiplier).
//
// `flood` (v4 addition, all optional, default = no flood damage yet):
//   - extraSlums: { "r,c": {pop, demandUnits} } -- tiles immigration
//     turned into new slums. These can't be represented by mutating
//     the shared `map` singleton (mutating a module-level import would
//     corrupt every other team/game using the same import), so they
//     live entirely in per-team state and get merged in here instead.
//   - damagedTiles: Set-like (has(key)) of tiles a flood put offline.
//     A damaged tile's own demand can never be served (services cut)
//     regardless of what's in range, and it's excluded from every
//     "this building is functioning" computation elsewhere (serving
//     others, pollution source, pollution waiver, sewage nuisance
//     source) -- one consistent rule: damaged reads as "doesn't
//     functionally exist right now," not "destroyed" (it still
//     occupies its tile and still costs money to repair).
//   - pollutionSpillTiles: Set-like of industry tiles with a permanent
//     +1 pollutionRadius from a past flood spill (v4 Part D "extra").
export function computeCityStats(
  map,
  placed,
  slumUpgraded,
  config,
  residentialDemandMultiplier = 1,
  flood = {}
) {
  const { width, height, tiles } = map;
  const extraSlums = flood.extraSlums || {};
  const damagedTiles = flood.damagedTiles || new Set();
  const pollutionSpillTiles = flood.pollutionSpillTiles || new Set();
  const isDamaged = (key) => (damagedTiles.has ? damagedTiles.has(key) : !!damagedTiles[key]);
  const isSpilled = (key) => (pollutionSpillTiles.has ? pollutionSpillTiles.has(key) : !!pollutionSpillTiles[key]);

  const placedList = Object.entries(placed)
    .map(([key, id]) => ({ key, row: Number(key.split(",")[0]), col: Number(key.split(",")[1]), id, def: buildingsById[id] }))
    .filter((b) => !isDamaged(b.key)); // damaged buildings don't functionally exist right now

  const demandUnits = tiles.map((row) => row.map(() => 0));
  const pop = tiles.map((row) => row.map(() => 0));
  const isSlum = tiles.map((row) => row.map(() => false));

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const type = tiles[r][c].type;
      const settlement = effectiveSettlement(type, slumUpgraded.has(tileKey(r, c)), config);
      demandUnits[r][c] = settlement.demandUnits;
      pop[r][c] = settlement.pop;
      isSlum[r][c] = settlement.isSlum;
    }
  }
  Object.entries(extraSlums).forEach(([key, s]) => {
    const [r, c] = key.split(",").map(Number);
    demandUnits[r][c] = s.demandUnits;
    pop[r][c] = s.pop;
    isSlum[r][c] = true;
  });
  // placedList already excludes damaged buildings, so a damaged
  // residential tile falls through to here with whatever the static
  // map says for that tile (0 for ordinary "empty" ground) -- its
  // population isn't destroyed, it's just not counted as a functioning
  // residential building while offline. Re-added explicitly below so
  // "population never destroyed" still holds for a damaged home.
  Object.entries(placed)
    .filter(([key]) => isDamaged(key))
    .forEach(([key, id]) => {
      const def = buildingsById[id];
      if (def.category !== "residential") return;
      const [r, c] = key.split(",").map(Number);
      demandUnits[r][c] = def.populates.demandUnits * residentialDemandMultiplier;
      pop[r][c] = def.populates.pop * residentialDemandMultiplier;
    });
  placedList.forEach(({ row, col, def }) => {
    if (def.category === "residential") {
      demandUnits[row][col] = def.populates.demandUnits * residentialDemandMultiplier;
      pop[row][col] = def.populates.pop * residentialDemandMultiplier;
    }
  });

  const industryList = placedList.filter((b) => b.def.category === "industry");

  const perService = {};
  const contention = {};

  SERVICES.forEach((service) => {
    const citizenDemand = demandUnits.map((row) => row.slice());
    const industryDemand = tiles.map((row) => row.map(() => 0));
    if (service === "power" || service === "water") {
      industryList.forEach(({ row, col, def }) => {
        industryDemand[row][col] += def.consumes[service] || 0;
      });
    }

    const servers = placedList
      .filter((b) => b.def.serves === service)
      .map((b) => ({ key: b.key, row: b.row, col: b.col, capacity: b.def.capacity, radius: b.def.radius }));

    // Citizens get strict priority over industry for shared power/water
    // capacity: allocate citizen demand first against full capacity,
    // then let industry claim only what's left over. Plain nearest-first
    // over a merged demand grid let industry -- which sits close to
    // essentials by its own prerequisites -- starve distant homes (see
    // sim-report.md's "Industry vs. citizen contention" finding: up to
    // 48% citizen power shortfall in top-scoring runs). Every other
    // service has no industry demand, so this is a no-op there.
    const citizenResult = allocate(citizenDemand, servers, width, height);
    let result = citizenResult;

    if (service === "power" || service === "water") {
      const serversAfterCitizens = servers.map((s) => ({
        ...s,
        capacity: Math.max(0, s.capacity - (citizenResult.buildingUsed[s.key] || 0)),
      }));
      const industryResult = allocate(industryDemand, serversAfterCitizens, width, height);

      const served = citizenResult.served.map((row, r) => row.map((v, c) => v + industryResult.served[r][c]));
      const servedBy = citizenResult.servedBy.map((row, r) =>
        row.map((list, c) => list.concat(industryResult.servedBy[r][c]))
      );
      const buildingUsed = {};
      servers.forEach((s) => {
        buildingUsed[s.key] = (citizenResult.buildingUsed[s.key] || 0) + (industryResult.buildingUsed[s.key] || 0);
      });
      result = { served, servedBy, buildingUsed };

      let citizenServed = 0;
      let citizenDemandTotal = 0;
      let industryServed = 0;
      let industryDemandTotal = 0;
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          if (industryDemand[r][c] > 0) {
            industryServed += industryResult.served[r][c];
            industryDemandTotal += industryDemand[r][c];
          } else if (citizenDemand[r][c] > 0) {
            citizenServed += Math.min(citizenResult.served[r][c], citizenDemand[r][c]);
            citizenDemandTotal += citizenDemand[r][c];
          }
        }
      }
      const totalCapacity = servers.reduce((s, b) => s + b.capacity, 0);
      contention[service] = {
        citizenDemand: citizenDemandTotal,
        citizenServed,
        citizenShortfall: citizenDemandTotal - citizenServed,
        industryDemand: industryDemandTotal,
        industryServed,
        totalCapacity,
        industryShareOfCapacity: totalCapacity > 0 ? industryServed / totalCapacity : 0,
      };
    }

    perService[service] = result;
  });

  const tileStats = {};
  let servicePoints = 0;
  let unservedPenaltyTotal = 0;
  let slumSanitationPenaltyTotal = 0;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const key = tileKey(r, c);
      const damaged = isDamaged(key);
      const demand = {};
      const served = {};
      let tilePoints = 0;
      let tilePenalty = 0;

      SERVICES.forEach((service) => {
        const d = demandUnits[r][c];
        // A damaged tile's demand is permanently unserved while
        // offline -- "services cut" -- regardless of what capacity
        // would otherwise reach it.
        const s = damaged ? 0 : Math.min(perService[service].served[r][c], d);
        demand[service] = d;
        served[service] = s;
        const unmet = Math.max(0, d - s);
        tilePoints += s * config.pointsPerServiceUnit;
        const penaltyRate = isSlum[r][c] ? config.slumUnservedPenaltyPerUnit : config.unservedPenaltyPerUnit;
        tilePenalty += unmet * penaltyRate;
      });

      let sanitationPenalty = 0;
      if (isSlum[r][c] && demand.sanitation > 0 && served.sanitation <= 0) {
        sanitationPenalty = config.slumNoSanitationPenalty;
      }

      unservedPenaltyTotal += tilePenalty;
      slumSanitationPenaltyTotal += sanitationPenalty;
      servicePoints += tilePoints;

      tileStats[key] = {
        row: r,
        col: c,
        type: tiles[r][c].type,
        pop: pop[r][c],
        isSlum: isSlum[r][c],
        damaged,
        demand,
        served,
        pollution: false,
        sewageNuisance: false,
        points: tilePoints - tilePenalty - sanitationPenalty,
      };
    }
  }

  const parkPositions = placedList
    .filter((b) => b.def.serves === "environment")
    .map((b) => ({ row: b.row, col: b.col }));
  let pollutionCount = 0;
  industryList.forEach(({ row, col, def, key }) => {
    const effectiveRadius = def.pollutionRadius + (isSpilled(key) ? config.industryFloodPollutionSpillRadius : 0);
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (pop[r][c] <= 0) continue;
        if (chebyshev(row, col, r, c) > effectiveRadius) continue;
        const tKey = tileKey(r, c);
        if (tileStats[tKey].pollution) continue;
        const waived = parkPositions.some((p) => chebyshev(p.row, p.col, r, c) <= 1);
        if (waived) continue;
        tileStats[tKey].pollution = true;
        tileStats[tKey].points -= config.pollutionPenaltyNoPark;
        pollutionCount += 1;
      }
    }
  });
  const pollutionPenaltyTotal = pollutionCount * config.pollutionPenaltyNoPark;

  const sewagePositions = placedList
    .filter((b) => b.def.serves === "sanitation")
    .map((b) => ({ row: b.row, col: b.col }));
  let sewageCount = 0;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (pop[r][c] <= 0) continue;
      const near = sewagePositions.some((s) => chebyshev(s.row, s.col, r, c) === 1);
      if (!near) continue;
      tileStats[tileKey(r, c)].sewageNuisance = true;
      tileStats[tileKey(r, c)].points -= config.sewageAdjacencyPenalty;
      sewageCount += 1;
    }
  }
  const sewagePenaltyTotal = sewageCount * config.sewageAdjacencyPenalty;

  const coverage = {};
  let totalPop = 0;
  let fullyServedPop = 0;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (pop[r][c] <= 0) continue;
      totalPop += pop[r][c];
      const t = tileStats[tileKey(r, c)];
      const allServed = SERVICES.every((s) => t.served[s] >= t.demand[s]);
      if (allServed) fullyServedPop += pop[r][c];
    }
  }
  SERVICES.forEach((service) => {
    let totalDemand = 0;
    let totalServed = 0;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        totalDemand += demandUnits[r][c];
        totalServed += Math.min(tileStats[tileKey(r, c)].served[service], demandUnits[r][c]);
      }
    }
    coverage[service] = { served: totalServed, total: totalDemand, pct: totalDemand > 0 ? totalServed / totalDemand : 1 };
  });

  const allServedBonus = totalPop > 0 && fullyServedPop === totalPop ? config.allServedBonus : 0;
  const coverageBonusCount = SERVICES.filter((s) => coverage[s].pct >= config.serviceCoverageBonusThreshold).length;
  const coverageBonus = coverageBonusCount * config.serviceCoverageBonus;
  const slumRehousedBonus = slumUpgraded.size * config.slumRehousedBonus;

  const staticTotal =
    servicePoints -
    unservedPenaltyTotal -
    slumSanitationPenaltyTotal -
    pollutionPenaltyTotal -
    sewagePenaltyTotal +
    allServedBonus +
    coverageBonus +
    slumRehousedBonus;

  return {
    tileStats,
    coverage,
    contention,
    // Raw per-service allocation results (served/servedBy/buildingUsed
    // grids), exposed mainly for the outbreak twist's water-provenance
    // check (which building's water reaches which tile) -- not needed
    // for ordinary scoring/UI use, which should prefer tileStats.
    perService,
    totalPop,
    fullyServedPop,
    breakdown: {
      servicePoints,
      unservedPenalty: unservedPenaltyTotal,
      slumSanitationPenalty: slumSanitationPenaltyTotal,
      pollutionPenalty: pollutionPenaltyTotal,
      sewagePenalty: sewagePenaltyTotal,
      allServedBonus,
      coverageBonus,
      slumRehousedBonus,
      staticTotal,
    },
  };
}

// Final score = the static board score + a live cash bonus + whatever
// twists have adjusted cumulatively (rules.md Part I). Never shown to a
// team -- only the backend's Organizer Console leaderboard and the
// final reveal read this.
export function computeScore(stats, cash, cumulativeScoreAdjustment, config) {
  return computeScoreParts(stats, cash, cumulativeScoreAdjustment, config).total;
}

// Same number as computeScore(), but with every component broken out
// for the final results screen (rules.md Part I's three tables). The
// per-twist itemisation isn't here -- `twistAdjustment` is the lump
// sum; the caller reads the individual deltas from the action log.
export function computeScoreParts(stats, cash, cumulativeScoreAdjustment, config) {
  const b = stats.breakdown;
  const cashBonus = cash * config.cashPointsPer1Cr;
  const total = Math.floor(b.staticTotal + cashBonus + cumulativeScoreAdjustment);
  return {
    total,
    board: {
      servicePoints: b.servicePoints,
      unservedPenalty: -b.unservedPenalty,
      slumSanitationPenalty: -b.slumSanitationPenalty,
      pollutionPenalty: -b.pollutionPenalty,
      sewagePenalty: -b.sewagePenalty,
      allServedBonus: b.allServedBonus,
      coverageBonus: b.coverageBonus,
      slumRehousedBonus: b.slumRehousedBonus,
      total: b.staticTotal,
    },
    cashBonus: Math.round(cashBonus * 100) / 100,
    twistAdjustment: cumulativeScoreAdjustment,
  };
}

export { tileTypes };
