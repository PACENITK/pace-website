import tileTypes, { SERVICES, effectiveSettlement } from "./tileTypes.js";
import buildingsById from "./buildings.js";
import { allocate, chebyshev } from "./allocate.js";

function tileKey(r, c) {
  return `${r},${c}`;
}

// Static-snapshot scoring, Part I. Everything here is a pure function of
// (map, placed, slumUpgraded, config) -- never accumulated -- and
// excludes anything that depends on game history rather than the
// current board: cash bonus and twist-specific bonuses/penalties
// (pandemic, Olympics, flood) are added on top by simulate.js, since
// those require knowing what happened across years, not just the
// current tiles.
//
// residentialDemandMultiplier > 1 models immigration: population and
// demand on player-built residential tiles rise above rated capacity
// (rules.md Part H) while inherited slum/colony demand is untouched --
// immigrants move into homes you built, not into the inherited city.
export function computeCityStats(map, placed, slumUpgraded, config, residentialDemandMultiplier = 1) {
  const { width, height, tiles } = map;

  const placedList = Object.entries(placed).map(([key, id]) => {
    const [row, col] = key.split(",").map(Number);
    return { key, row, col, id, def: buildingsById[id] };
  });

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
    const totalDemand = citizenDemand.map((row, r) => row.map((d, c) => d + industryDemand[r][c]));

    const servers = placedList
      .filter((b) => b.def.serves === service)
      .map((b) => ({ key: b.key, row: b.row, col: b.col, capacity: b.def.capacity, radius: b.def.radius }));

    const result = allocate(totalDemand, servers, width, height);
    perService[service] = result;

    if (service === "power" || service === "water") {
      let citizenServed = 0;
      let citizenDemandTotal = 0;
      let industryServed = 0;
      let industryDemandTotal = 0;
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          const servedHere = result.served[r][c];
          if (industryDemand[r][c] > 0) {
            industryServed += servedHere;
            industryDemandTotal += industryDemand[r][c];
          } else if (citizenDemand[r][c] > 0) {
            citizenServed += Math.min(servedHere, citizenDemand[r][c]);
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
  });

  const tileStats = {};
  let servicePoints = 0;
  let unservedPenaltyTotal = 0;
  let slumSanitationPenaltyTotal = 0;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const key = tileKey(r, c);
      const demand = {};
      const served = {};
      let tilePoints = 0;
      let tilePenalty = 0;

      SERVICES.forEach((service) => {
        const d = demandUnits[r][c];
        const s = Math.min(perService[service].served[r][c], d);
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
  industryList.forEach(({ row, col, def }) => {
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (pop[r][c] <= 0) continue;
        if (chebyshev(row, col, r, c) > def.pollutionRadius) continue;
        const key = tileKey(r, c);
        if (tileStats[key].pollution) continue;
        const waived = parkPositions.some((p) => chebyshev(p.row, p.col, r, c) <= 1);
        if (waived) continue;
        tileStats[key].pollution = true;
        tileStats[key].points -= config.pollutionPenaltyNoPark;
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
        totalServed += Math.min(perService[service].served[r][c], demandUnits[r][c]);
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

export { tileTypes };
