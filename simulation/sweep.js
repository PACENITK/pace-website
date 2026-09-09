// Sweep mode (balance-simulation spec §6): re-runs a smaller batch
// across one config value at a time (holding everything else at the
// v3-as-written baseline), so the effect of a single change is visible
// without editing files by hand. A full cartesian product across all
// six dimensions would be 3x3x2x3x3x2 = 972 cells -- intractable at
// any reasonable batch size -- so this does the standard one-factor-
// at-a-time sensitivity sweep instead: one row per (dimension, value).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMap } from "./data/map.js";
import baseConfig from "./engine/config.js";
import buildingsById from "./engine/buildings.js";
import { simulateGame } from "./engine/simulate.js";
import { sampleStrategy } from "./strategies.js";
import { makeRng, permutations, randInt } from "./rng.js";
import { mean, variance, percentile, fmt } from "./stats.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SEED = process.argv[2] || "sweep-seed";
const BATCH = Number(process.argv[3]) || 5000;

const TWIST_PERMS = permutations(["flood", "pandemic", "immigration"]);

function baseMap() {
  return buildMap({
    width: 16,
    height: 12,
    riverRow: 6,
    slumTiles: [
      { row: 5, col: 2 },
      { row: 5, col: 11 },
      { row: 2, col: 4 },
      { row: 9, col: 12 },
    ],
    lowlandSlumKeys: new Set(["5,2", "5,11"]),
    colonyTiles: [
      { row: 1, col: 8 },
      { row: 10, col: 3 },
    ],
    // Mirrors data/map.js's live map exactly: no road tiles, asymmetric
    // 3-row flood band.
    skipBelowZoneB: true,
  });
}

// Roughly proportional layouts at the two alternative grid sizes from
// Part L's organiser notes.
function mapForGrid(size) {
  if (size === "12x9") {
    return buildMap({
      width: 12, height: 9, riverRow: 4,
      slumTiles: [{ row: 3, col: 1 }, { row: 3, col: 8 }, { row: 1, col: 3 }, { row: 6, col: 9 }],
      lowlandSlumKeys: new Set(["3,1", "3,8"]),
      colonyTiles: [{ row: 0, col: 6 }, { row: 7, col: 2 }],
      roadTiles: [{ row: 8, col: 0 }, { row: 8, col: 1 }, { row: 8, col: 2 }, { row: 8, col: 3 }],
    });
  }
  if (size === "15x10") {
    return buildMap({
      width: 15, height: 10, riverRow: 5,
      slumTiles: [{ row: 4, col: 1 }, { row: 4, col: 10 }, { row: 1, col: 3 }, { row: 7, col: 11 }],
      lowlandSlumKeys: new Set(["4,1", "4,10"]),
      colonyTiles: [{ row: 0, col: 7 }, { row: 8, col: 3 }],
      roadTiles: [{ row: 9, col: 0 }, { row: 9, col: 1 }, { row: 9, col: 2 }, { row: 9, col: 3 }, { row: 9, col: 4 }],
    });
  }
  return baseMap(); // "16x12"
}

function mapForSettlements(spec) {
  if (spec === "6+4") {
    return buildMap({
      width: 16, height: 12, riverRow: 6,
      slumTiles: [
        { row: 5, col: 2 }, { row: 5, col: 11 }, { row: 2, col: 4 },
        { row: 9, col: 12 }, { row: 2, col: 13 }, { row: 9, col: 3 },
      ],
      lowlandSlumKeys: new Set(["5,2", "5,11"]),
      colonyTiles: [{ row: 1, col: 8 }, { row: 10, col: 3 }, { row: 0, col: 2 }, { row: 11, col: 13 }],
      roadTiles: [{ row: 11, col: 0 }, { row: 11, col: 1 }],
    });
  }
  return baseMap(); // "4+2"
}

function countBuildableTiles(m) {
  let n = 0;
  for (let r = 0; r < m.height; r++) for (let c = 0; c < m.width; c++) if (m.tiles[r][c].type === "empty") n += 1;
  return n;
}

function randomTreasureTile(rng, m) {
  return `${randInt(rng, 0, m.height - 1)},${randInt(rng, 0, m.width - 1)}`;
}

// Runs one batch and returns the four sweep-table metrics (spec §6/§7).
function runCell(map, cfg, rng, label) {
  const buildableTiles = countBuildableTiles(map);
  const results = [];
  for (let i = 0; i < BATCH; i++) {
    const strategy = sampleStrategy(rng);
    const twistOrder = TWIST_PERMS[randInt(rng, 0, TWIST_PERMS.length - 1)];
    const treasureTile = randomTreasureTile(rng, map);
    results.push(simulateGame(map, strategy, twistOrder, treasureTile, cfg));
  }

  const scores = results.map((r) => r.finalScore);
  const p75 = percentile(scores, 75);
  const p90 = percentile(scores, 90);
  const q3Spread = p75 !== 0 ? ((p90 - p75) / Math.abs(p75)) * 100 : NaN;

  // Cheap Q1 approximation (20 strategies x 10 luck seeds) -- the
  // sweep's job is relative comparison across cells, not a precise
  // Q1 figure (that's what run.js's full 200x100 pass is for).
  const q1Samples = [];
  for (let i = 0; i < 20; i++) {
    const strategy = sampleStrategy(rng);
    const seedScores = [];
    for (let j = 0; j < 10; j++) {
      const twistOrder = TWIST_PERMS[randInt(rng, 0, TWIST_PERMS.length - 1)];
      const treasureTile = randomTreasureTile(rng, map);
      seedScores.push(simulateGame(map, strategy, twistOrder, treasureTile, cfg).finalScore);
    }
    q1Samples.push({ mean: mean(seedScores), variance: variance(seedScores) });
  }
  const within = mean(q1Samples.map((s) => s.variance));
  const between = variance(q1Samples.map((s) => s.mean));
  const q1Ratio = within > 0 ? between / within : Infinity;

  const sorted = results.slice().sort((a, b) => b.finalScore - a.finalScore);
  const top10n = Math.max(1, Math.floor(results.length * 0.1));
  const top10 = sorted.slice(0, top10n);
  const bottom10 = sorted.slice(-top10n);
  const deadCount = Object.keys(buildingsById).filter((id) => {
    const inTop = top10.some((r) => r.state.placed && Object.values(r.state.placed).includes(id));
    return !inTop;
  }).length;

  const meanBuildingsFraction = mean(results.map((r) => r.tilesUsed / buildableTiles));

  console.log(`  ${label}: q1=${fmt(q1Ratio, 2)} q3=${fmt(q3Spread, 1)}% dead=${deadCount} frac=${fmt(meanBuildingsFraction, 2)}`);
  return { label, q1Ratio, q3Spread, deadCount, meanBuildingsFraction };
}

console.log(`Urban Mayhem sweep -- seed=${SEED} batch=${BATCH} per cell`);
const rng = makeRng(SEED);
const rows = [];

console.log("STARTING_BUDGET:");
for (const budget of [2400, 3000, 3600]) {
  const cfg = { ...baseConfig, startingBudget: budget };
  rows.push(runCell(baseMap(), cfg, rng, `STARTING_BUDGET=${budget}`));
}

console.log("GRID:");
for (const size of ["12x9", "15x10", "16x12"]) {
  rows.push(runCell(mapForGrid(size), baseConfig, rng, `GRID=${size}`));
}

console.log("INHERITED_SETTLEMENTS:");
for (const spec of ["4+2", "6+4"]) {
  rows.push(runCell(mapForSettlements(spec), baseConfig, rng, `INHERITED_SETTLEMENTS=${spec}`));
}

console.log("HOSPITAL_COST:");
const originalHospitalCost = buildingsById.hospital.cost;
for (const cost of [40, 50, 65]) {
  buildingsById.hospital.cost = cost;
  rows.push(runCell(baseMap(), baseConfig, rng, `HOSPITAL_COST=${cost}`));
}
buildingsById.hospital.cost = originalHospitalCost;

console.log("INCOME_MULTIPLIER:");
const originalYearly = {};
Object.keys(buildingsById).forEach((id) => (originalYearly[id] = buildingsById[id].yearly));
for (const multiplier of [0.8, 1.0, 1.3]) {
  Object.keys(buildingsById).forEach((id) => {
    buildingsById[id].yearly = originalYearly[id] * multiplier;
  });
  rows.push(runCell(baseMap(), baseConfig, rng, `INCOME_MULTIPLIER=${multiplier}`));
}
Object.keys(buildingsById).forEach((id) => (buildingsById[id].yearly = originalYearly[id]));

console.log("TREASURE_VALUE:");
for (const value of [0, 300]) {
  const cfg = { ...baseConfig, treasureValue: value };
  rows.push(runCell(baseMap(), cfg, rng, `TREASURE_VALUE=${value}`));
}

const lines = [];
lines.push("# Urban Mayhem v3 -- Config Sweep");
lines.push("");
lines.push(`Seed \`${SEED}\` · ${BATCH} runs per cell (one-factor-at-a-time; a full cartesian sweep across all six dimensions would be 972 cells and was not attempted -- see comment at the top of sweep.js).`);
lines.push("");
lines.push("| Cell | Q1 ratio (between/within) | Q3 spread (75th->90th, %) | Dead buildings | Mean buildings/tiles |");
lines.push("|---|---|---|---|---|");
rows.forEach((r) => {
  lines.push(`| ${r.label} | ${fmt(r.q1Ratio, 2)} | ${fmt(r.q3Spread, 1)}% | ${r.deadCount} | ${fmt(r.meanBuildingsFraction, 2)} |`);
});
lines.push("");
lines.push("Recommended config: the row(s) above with Q1 ratio comfortably > 3.0, buildings/tiles fraction in 0.45-0.55, and no dead buildings. Cross-reference against sim-report.md's targets table for the full-precision numbers on the baseline (as-written) config.");

fs.writeFileSync(path.join(__dirname, "sweep-report.md"), lines.join("\n"));
console.log("Wrote simulation/sweep-report.md");
