import tileTypes from "../data/tileTypes.js";

export function chebyshev(r1, c1, r2, c2) {
  return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
}

// Deterministic nearest-first allocation for one service, independent
// of the order buildings were placed in. See spec: for each distance
// ring, collect every eligible (building, tile) pair, sort by tile
// index then building tile index, and allocate in that fixed order.
export function allocateService(service, map, placedBuildings) {
  const { width, height, tiles } = map;

  const demand = tiles.map((row) => row.map((type) => tileTypes[type][service]));
  const served = tiles.map((row) => row.map(() => 0));
  const servedBy = tiles.map((row) => row.map(() => []));

  const servers = placedBuildings
    .filter((b) => b.def.serves === service)
    .map((b) => ({ ...b, spare: b.def.capacity }));

  const buildingUsed = {};
  servers.forEach((b) => {
    buildingUsed[b.key] = 0;
  });

  if (servers.length === 0) {
    return { served, remaining: demand, servedBy, buildingUsed };
  }

  const maxRadius = Math.max(...servers.map((b) => b.def.radius));

  for (let d = 0; d <= maxRadius; d++) {
    const pairs = [];

    for (const building of servers) {
      if (building.spare <= 0 || d > building.def.radius) continue;
      const buildingIndex = building.row * width + building.col;

      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          if (demand[r][c] - served[r][c] <= 0) continue;
          if (chebyshev(building.row, building.col, r, c) !== d) continue;
          pairs.push({ tileIndex: r * width + c, buildingIndex, building, r, c });
        }
      }
    }

    pairs.sort((a, b) => a.tileIndex - b.tileIndex || a.buildingIndex - b.buildingIndex);

    for (const pair of pairs) {
      const { building, r, c } = pair;
      const unmet = demand[r][c] - served[r][c];
      if (unmet <= 0 || building.spare <= 0) continue;
      const amount = Math.min(unmet, building.spare);
      served[r][c] += amount;
      building.spare -= amount;
      buildingUsed[building.key] += amount;
      servedBy[r][c].push({ key: building.key, id: building.id, amount });
    }
  }

  const remaining = demand.map((row, r) => row.map((d, c) => d - served[r][c]));

  return { served, remaining, servedBy, buildingUsed };
}
