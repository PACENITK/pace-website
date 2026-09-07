// Distance-ring nearest-first allocation (Part D "Allocation"): a
// service building with less capacity than the demand around it serves
// the nearest tiles first, in a fixed order, so the same city always
// scores the same regardless of build order.
export function chebyshev(r1, c1, r2, c2) {
  return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
}

// demand: 2D array of numbers. servers: [{key, row, col, capacity,
// radius}] already filtered to buildings serving this one service.
// radius === Infinity means city-wide, no distance check (food,
// railway, metro, airport).
export function allocate(demand, servers, width, height) {
  const served = demand.map((row) => row.map(() => 0));
  const servedBy = demand.map((row) => row.map(() => []));
  const buildingUsed = {};

  const withSpare = servers.map((s) => ({ ...s, spare: s.capacity }));
  withSpare.forEach((s) => {
    buildingUsed[s.key] = 0;
  });

  if (withSpare.length === 0) {
    return { served, remaining: demand.map((r) => r.slice()), servedBy, buildingUsed };
  }

  const cityWide = withSpare.filter((s) => !Number.isFinite(s.radius));
  const radiusServers = withSpare.filter((s) => Number.isFinite(s.radius));

  if (cityWide.length > 0) {
    for (const server of cityWide) {
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          const unmet = demand[r][c] - served[r][c];
          if (unmet <= 0 || server.spare <= 0) continue;
          const amount = Math.min(unmet, server.spare);
          served[r][c] += amount;
          server.spare -= amount;
          buildingUsed[server.key] += amount;
          servedBy[r][c].push({ key: server.key, amount });
        }
      }
    }
  }

  if (radiusServers.length > 0) {
    const maxRadius = Math.max(...radiusServers.map((s) => s.radius));
    for (let d = 0; d <= maxRadius; d++) {
      const pairs = [];
      for (const server of radiusServers) {
        if (server.spare <= 0 || d > server.radius) continue;
        const buildingIndex = server.row * width + server.col;
        for (let r = 0; r < height; r++) {
          for (let c = 0; c < width; c++) {
            if (demand[r][c] - served[r][c] <= 0) continue;
            if (chebyshev(server.row, server.col, r, c) !== d) continue;
            pairs.push({ tileIndex: r * width + c, buildingIndex, server, r, c });
          }
        }
      }
      pairs.sort((a, b) => a.tileIndex - b.tileIndex || a.buildingIndex - b.buildingIndex);
      for (const pair of pairs) {
        const { server, r, c } = pair;
        const unmet = demand[r][c] - served[r][c];
        if (unmet <= 0 || server.spare <= 0) continue;
        const amount = Math.min(unmet, server.spare);
        served[r][c] += amount;
        server.spare -= amount;
        buildingUsed[server.key] += amount;
        servedBy[r][c].push({ key: server.key, amount });
      }
    }
  }

  const remaining = demand.map((row, r) => row.map((d, c) => d - served[r][c]));
  return { served, remaining, servedBy, buildingUsed };
}
