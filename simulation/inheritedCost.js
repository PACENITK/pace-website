import map from "./data/map.js";
import config from "./engine/config.js";
import buildingsById from "./engine/buildings.js";
import { computeCityStats } from "./engine/score.js";
import { emptyBuildableTiles, ensurePower, fillService } from "./strategies.js";

function tileKey(r, c) {
  return `${r},${c}`;
}

// "The cost of serving all 11,000 inherited people and nothing else"
// (rules.md organiser notes' own ₹845 Cr worked example), recomputed
// from the real engine and its actual map/radius placement instead of
// trusted from the doc's per-service division -- see sim-report.md.
export function computeInheritedCityCost() {
  const state = { cash: 1e9, placed: {}, slumUpgraded: new Set() };
  const budget = ensurePower(state, map, state.cash, emptyBuildableTiles(map, state));

  const order = ["water", "health", "education", "environment", "safety", "sanitation", "transport", "food"];
  for (const service of order) {
    const stats = computeCityStats(map, state.placed, state.slumUpgraded, config, 1);
    const remaining = { [service]: [] };
    for (let r = 0; r < map.height; r++) {
      const row = [];
      for (let c = 0; c < map.width; c++) {
        const t = stats.tileStats[tileKey(r, c)];
        row.push(Math.max(0, (t?.demand[service] || 0) - (t?.served[service] || 0)));
      }
      remaining[service].push(row);
    }
    const buildableTiles = emptyBuildableTiles(map, state);
    fillService(state, map, service, budget, remaining, buildableTiles);
  }

  const counts = {};
  let total = 0;
  Object.values(state.placed).forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
    total += buildingsById[id].cost;
  });

  const finalStats = computeCityStats(map, state.placed, state.slumUpgraded, config, 1);
  return { counts, total, coverage: finalStats.coverage };
}
