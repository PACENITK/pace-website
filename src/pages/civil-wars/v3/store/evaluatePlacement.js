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

export function moveFee(buildingId) {
  return buildingsById[buildingId].cost * config.moveCostRate;
}

// Same shape as evaluatePlacement, but against the board with the
// building already picked up off its origin tile -- so a hydro station
// moving next to a *different* dam, or a dam moving to a new river
// tile, is checked against the board it would actually land on, not
// the one it's leaving. Affordability is checked separately against
// the 10% move fee, not canPlace's own full-cost gate (ctx.cash is set
// to Infinity so that gate never fires here).
export function evaluateMove(buildingId, fromRow, fromCol, toRow, toCol, state) {
  const fromKey = tileKey(fromRow, fromCol);
  const toKey = tileKey(toRow, toCol);
  if (fromKey === toKey) return { ok: false, reason: "pick a different tile to move to" };
  if (state.damagedTiles[fromKey]) return { ok: false, reason: "repair this building before moving it" };

  const placedWithoutSource = { ...state.placed };
  delete placedWithoutSource[fromKey];
  if (placedWithoutSource[toKey]) return { ok: false, reason: "That tile already has a building" };
  if (state.extraSlums && state.extraSlums[toKey]) return { ok: false, reason: "tile not buildable" };

  const tileType = map.tiles[toRow][toCol].type;
  const stats = computeCityStats(
    map,
    placedWithoutSource,
    state.slumUpgraded,
    config,
    state.residentialDemandMultiplier,
    floodExtras(state)
  );
  const ctx = {
    tile: { type: tileType, buildable: isBuildable(tileType) },
    cash: Infinity,
    hasService: (svc) => Object.values(placedWithoutSource).some((id) => buildingsById[id].serves === svc),
    countById: (id) => Object.values(placedWithoutSource).filter((v) => v === id).length,
    transportCount: Object.values(placedWithoutSource).filter((id) => buildingsById[id].category === CATEGORY.TRANSPORT)
      .length,
    popInRadius: (radius) =>
      Object.values(stats.tileStats).reduce(
        (sum, t) => (t.pop > 0 && chebyshev(toRow, toCol, t.row, t.col) <= radius ? sum + t.pop : sum),
        0
      ),
    hasAdjacentDamWithCapacity: hasAdjacentDamWithCapacity(toRow, toCol, placedWithoutSource, config, chebyshev),
  };
  const result = canPlace(buildingId, ctx);
  if (!result.ok) return result;

  const fee = moveFee(buildingId);
  if (state.cash < fee) return { ok: false, reason: "insufficient cash for the move fee" };
  return { ok: true, fee };
}
