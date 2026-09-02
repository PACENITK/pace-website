import tileTypes, { SERVICES } from "../data/tileTypes.js";
import { BUILDINGS_BY_ID } from "../data/buildings.js";
import { allocateService, chebyshev } from "./allocate.js";

// Everything here is a pure function of (map, placed, config) — never
// accumulated. Recompute the whole thing from scratch every time.
export function computeCityStats(map, placed, config) {
  const { width, height, tiles } = map;

  const placedBuildings = Object.entries(placed).map(([key, id]) => {
    const [row, col] = key.split(",").map(Number);
    return { key, row, col, id, def: BUILDINGS_BY_ID[id] };
  });

  const perService = {};
  SERVICES.forEach((service) => {
    perService[service] = allocateService(service, map, placedBuildings);
  });

  const buildingUsage = {};
  placedBuildings.forEach(({ key, def }) => {
    buildingUsage[key] = { used: 0, total: def.capacity };
  });
  SERVICES.forEach((service) => {
    Object.entries(perService[service].buildingUsed).forEach(([key, used]) => {
      buildingUsage[key] = { used, total: buildingUsage[key].total };
    });
  });

  const tileStats = {};
  let servicePoints = 0;
  let slumPenaltyTotal = 0;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const type = tiles[r][c];
      const demandRow = tileTypes[type];
      const key = `${r},${c}`;
      const demand = {};
      const served = {};
      const servedBy = {};
      let unmetOnSlum = 0;
      let tilePoints = 0;

      SERVICES.forEach((service) => {
        const d = demandRow[service];
        const s = perService[service].served[r][c];
        demand[service] = d;
        served[service] = s;
        servedBy[service] = perService[service].servedBy[r][c];
        tilePoints += s * config.pointsPerServiceUnit;
        if (type === "slum") unmetOnSlum += d - s;
      });

      const slumPenalty = type === "slum" ? unmetOnSlum * config.slumUnmetPenalty : 0;
      slumPenaltyTotal += slumPenalty;
      servicePoints += tilePoints;

      tileStats[key] = {
        row: r,
        col: c,
        type,
        pop: demandRow.pop,
        demand,
        served,
        servedBy,
        slumPenalty,
        pollution: false,
        sewage: false,
        points: tilePoints - slumPenalty,
      };
    }
  }

  // Pollution: populated tiles at Chebyshev distance 1 from a factory,
  // waived if a park sits within distance <=1 of the affected tile.
  const factoryPositions = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (tiles[r][c] === "factory") factoryPositions.push({ r, c });
    }
  }
  const parkPositions = placedBuildings
    .filter(({ def }) => def.type === "park")
    .map(({ row, col }) => ({ row, col }));

  let pollutionCount = 0;
  if (factoryPositions.length > 0) {
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (tileTypes[tiles[r][c]].pop <= 0) continue;
        const nearFactory = factoryPositions.some((f) => chebyshev(f.r, f.c, r, c) === 1);
        if (!nearFactory) continue;
        const waived = parkPositions.some((p) => chebyshev(p.row, p.col, r, c) <= 1);
        if (waived) continue;
        const key = `${r},${c}`;
        tileStats[key].pollution = true;
        tileStats[key].points -= config.pollutionPenalty;
        pollutionCount += 1;
      }
    }
  }

  // Sewage nuisance: populated tiles at Chebyshev distance 1 from a
  // sewage plant.
  const sewagePositions = placedBuildings
    .filter(({ def }) => def.type === "sewage")
    .map(({ row, col }) => ({ row, col }));

  let sewageCount = 0;
  if (sewagePositions.length > 0) {
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (tileTypes[tiles[r][c]].pop <= 0) continue;
        const nearSewage = sewagePositions.some((s) => chebyshev(s.row, s.col, r, c) === 1);
        if (!nearSewage) continue;
        const key = `${r},${c}`;
        tileStats[key].sewage = true;
        tileStats[key].points -= config.sewageNuisancePenalty;
        sewageCount += 1;
      }
    }
  }

  const pollutionPenalty = pollutionCount * config.pollutionPenalty;
  const sewagePenalty = sewageCount * config.sewageNuisancePenalty;

  const spent = placedBuildings.reduce((sum, { def }) => sum + def.cost, 0);
  const budget = config.startingBudget - spent;
  const savingsBonus = budget * config.savingsRatePer1Cr;

  const rawTotal =
    servicePoints - slumPenaltyTotal - pollutionPenalty - sewagePenalty + savingsBonus;
  const total = Math.floor(rawTotal);

  const coverage = {};
  SERVICES.forEach((service) => {
    let totalDemand = 0;
    let totalServed = 0;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        totalDemand += tileTypes[tiles[r][c]][service];
        totalServed += perService[service].served[r][c];
      }
    }
    coverage[service] = { served: totalServed, total: totalDemand };
  });

  return {
    tileStats,
    buildingUsage,
    coverage,
    budget,
    spent,
    breakdown: {
      servicePoints,
      slumPenalty: slumPenaltyTotal,
      pollutionPenalty,
      sewagePenalty,
      savingsBonus,
      total,
    },
  };
}
