import {
  buildingsById,
  canPlace,
  CATEGORY,
  isBuildable,
  config,
  computeCityStats,
  chebyshev,
  hasAdjacentDamWithCapacity,
  map,
} from "../engine.js";

function tileKey(r, c) {
  return `${r},${c}`;
}

export function floodExtras(state) {
  return { extraSlums: state.extraSlums, damagedTiles: state.damagedTiles, pollutionSpillTiles: state.pollutionSpillTiles };
}

export function evaluatePlacement(buildingId, row, col, state) {
  const { placed, cash, slumUpgraded, residentialDemandMultiplier } = state;
  const key = tileKey(row, col);
  if (placed[key]) return { ok: false, reason: "That tile already has a building" };
  if (state.extraSlums && state.extraSlums[key]) return { ok: false, reason: "tile not buildable" };
  const tileType = map.tiles[row][col].type;
  const stats = computeCityStats(map, placed, slumUpgraded, config, residentialDemandMultiplier, floodExtras(state));
  const ctx = {
    tile: { type: tileType, buildable: isBuildable(tileType) },
    cash,
    hasService: (svc) => Object.values(placed).some((id) => buildingsById[id].serves === svc),
    countById: (id) => Object.values(placed).filter((v) => v === id).length,
    transportCount: Object.values(placed).filter((id) => buildingsById[id].category === CATEGORY.TRANSPORT).length,
    popInRadius: (radius) =>
      Object.values(stats.tileStats).reduce(
        (sum, t) => (t.pop > 0 && chebyshev(row, col, t.row, t.col) <= radius ? sum + t.pop : sum),
        0
      ),
    hasAdjacentDamWithCapacity: hasAdjacentDamWithCapacity(row, col, placed, config, chebyshev),
  };
  return canPlace(buildingId, ctx);
}
