// Pure derivations for the City Status panel. Mirrors useCityStats.js's
// own pattern (pure functions of the board, recomputed via useMemo in
// the component -- nothing here is stored). Everything is computed from
// the real board/engine, not copied from the mockup's hand-picked
// sample numbers.
import { buildingsById, config } from "../engine.js";
import { SERVICES } from "../data/serviceMeta.js";
import { colLabel } from "../format.js";
import { explainUnmet } from "../components/explainUnmet.js";

// The engine tracks demand/capacity in small "demand unit" counts, but
// the design's ledger reads like population figures (matching the
// "Population" stat card's scale). Converting: each tile contributes
// its own population weighted by how much of its own demand is met, so
// the sums stay population-scale without inventing numbers.
export function computeServicePopulation(tileStats, service) {
  let demandPop = 0;
  let servedPop = 0;
  let demandUnits = 0;
  Object.values(tileStats).forEach((t) => {
    const d = t.demand[service];
    if (d <= 0) return;
    demandPop += t.pop;
    servedPop += t.pop * (t.served[service] / d);
    demandUnits += d;
  });
  return { servedPop, demandPop, demandUnits };
}

// Built capacity is in the same "demand unit" scale, not population --
// converted to the same population scale using that service's own
// population-per-unit ratio (not a city-wide average), so a service
// with only small homes in range isn't over/under-stated.
export function computeServiceCapacity(placed, service, demandPop, demandUnits) {
  const capacityUnits = Object.values(placed).reduce((sum, id) => {
    const def = buildingsById[id];
    return def.serves === service ? sum + def.capacity : sum;
  }, 0);
  const popPerUnit = demandUnits > 0 ? demandPop / demandUnits : 0;
  return capacityUnits * popPerUnit;
}

// Four-state status chip. Thresholds are an original, monotonic rule
// (not reverse-engineered from the mockup's sample row, which uses a
// flat placeholder demand figure for every service and isn't a real
// formula to match): "at cap" means built capacity is nearly maxed out
// regardless of demand met; "short" means capacity exists but isn't
// reaching demand (a placement problem, which is the whole point of
// the ledger's spare-capacity segment); "critical" is a severe shortfall.
export function computeServiceStatus({ servedPop, demandPop, capacityPop }) {
  if (demandPop <= 0) return "ok";
  const servedFrac = servedPop / demandPop;
  const utilization = capacityPop > 0 ? servedPop / capacityPop : 1;
  if (servedFrac < 0.5) return "critical";
  if (utilization >= 0.95) return "at cap";
  if (servedFrac >= 0.9) return "ok";
  return "short";
}

const TILE_LABEL = { empty: "Residential", slum: "Slum", colony: "Colony" };

function tileIdentity(tileStat, buildingId) {
  if (buildingId) return buildingsById[buildingId].name;
  return TILE_LABEL[tileStat.type] || tileStat.type;
}

// One row per populated tile that isn't fully served (or an un-rehoused
// slum), sorted by how many people it affects. A best-effort real
// derivation -- it won't reproduce the mockup's hand-written sample
// sentences verbatim, since those were authored for one demo board.
export function computeNeeds(stats, placed, slumUpgraded, map) {
  const needs = [];

  Object.entries(stats.tileStats).forEach(([key, t]) => {
    if (t.pop <= 0) return;
    const [row, col] = key.split(",").map(Number);
    const isUnupgradedSlum = map.tiles[row][col].type === "slum" && !slumUpgraded.has(key);
    const unmet = SERVICES.filter((s) => t.served[s] < t.demand[s]);

    if (isUnupgradedSlum) {
      needs.push({
        key: `${key}-rehouse`,
        icon: "rehouse",
        where: `${tileIdentity(t, placed[key])} · ${colLabel(row, col)}`,
        pop: t.pop,
        why: `Not yet rehoused${
          unmet.length > 0 ? ` and unserved on ${unmet.length} of ${SERVICES.length} services` : ""
        }, carrying the slum sanitation penalty.`,
        fix: `Rehouse, ₹${config.slumUpgradeCost} Cr`,
      });
      return;
    }
    if (unmet.length === 0) return;

    // The unmet service affecting the most people city-wide is the one
    // worth surfacing first for this tile.
    const service = unmet.reduce((worst, s) =>
      computeServicePopulation(stats.tileStats, s).demandPop >
      computeServicePopulation(stats.tileStats, worst).demandPop
        ? s
        : worst
    );
    const cheapestSupplier = Object.values(buildingsById)
      .filter((def) => def.serves === service)
      .sort((a, b) => a.cost - b.cost)[0];

    needs.push({
      key: `${key}-${service}`,
      icon: service,
      where: `${tileIdentity(t, placed[key])} · ${colLabel(row, col)}`,
      pop: t.pop,
      why: explainUnmet(service, row, col, placed),
      fix: cheapestSupplier ? `${cheapestSupplier.name}, ₹${cheapestSupplier.cost} Cr` : "Add capacity",
    });
  });

  needs.sort((a, b) => b.pop - a.pop);
  return needs;
}

// Structural risk signals already present in tileStats/map -- rendered
// as short lines rather than the mockup's single fixed sentence, since
// zero, one, or several of these can be true on a given board.
export function computeRiskWatch(stats, placed, map) {
  const lines = [];

  let lowLyingCount = 0;
  for (let r = 0; r < map.height; r++) {
    for (let c = 0; c < map.width; c++) {
      if (map.tiles[r][c].lowLying) lowLyingCount += 1;
    }
  }
  const stormDrainCount = Object.values(placed).filter((id) => id === "storm_drainage").length;
  if (lowLyingCount > 0) {
    lines.push(
      `${lowLyingCount} tile${lowLyingCount === 1 ? "" : "s"} sit on low-lying ground; ${stormDrainCount} storm drain${
        stormDrainCount === 1 ? "" : "s"
      } built.`
    );
  }

  const pollutedTiles = Object.entries(stats.tileStats).filter(([, t]) => t.pollution);
  if (pollutedTiles.length > 0) {
    const [key] = pollutedTiles[0];
    const [row, col] = key.split(",").map(Number);
    lines.push(
      `${pollutedTiles.length} tile${pollutedTiles.length === 1 ? "" : "s"} (incl. ${colLabel(
        row,
        col
      )}) sit near industry with no park within 1 tile.`
    );
  }

  const sewageTiles = Object.entries(stats.tileStats).filter(([, t]) => t.sewageNuisance);
  if (sewageTiles.length > 0) {
    lines.push(
      `${sewageTiles.length} tile${sewageTiles.length === 1 ? "" : "s"} sit directly adjacent to a sewage plant.`
    );
  }

  return lines;
}

export function computeBuiltChips(placed) {
  const counts = {};
  Object.values(placed).forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([id, count]) => ({ id, name: buildingsById[id].name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
