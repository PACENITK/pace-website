// Server-side ports of the exact logic src/pages/civil-wars/v3/store/
// useGameStore.js runs client-side -- same shape, same formulas, so a
// team's browser preview and the authoritative server never disagree.
// Every function here takes an already-loaded `engine` (see engine.js)
// plus plain data (never a Mongoose document directly, so these stay
// easy to unit-test without a database).

function tileKey(r, c) {
  return `${r},${c}`;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomTreasureTile(map) {
  return tileKey(Math.floor(Math.random() * map.height), Math.floor(Math.random() * map.width));
}

function createInitialTeamState(engine) {
  return {
    cash: engine.config.startingBudget,
    placed: {},
    slumUpgraded: [],
    residentialDemandMultiplier: 1,
    immigrationOverflow: 0,
    cumulativeScoreAdjustment: 0,
    damagedTiles: {},
    extraSlums: {},
    pollutionSpillTiles: [],
    lastTwistResult: null,
    lastTwistYear: 0,
    year: 0,
    actionSeq: 0,
    lastError: null,
  };
}

// Drawn once at event start, shared by every team -- rules.md Part H/K:
// "twists apply to all teams at the same moment," one shared draw.
function createInitialGlobal(engine) {
  return {
    year: 0,
    locked: false,
    twistOrder: shuffle(['flood', 'pandemic', 'immigration']),
    treasureTile: randomTreasureTile(engine.map),
    twistLog: [],
  };
}

function floodExtras(teamState) {
  return {
    extraSlums: teamState.extraSlums,
    damagedTiles: teamState.damagedTiles,
    pollutionSpillTiles: teamState.pollutionSpillTiles,
  };
}

// Same ctx shape buildings.js's canPlace() expects as the client store
// builds -- kept identical on purpose so a placement that previews as
// legal in the browser is never rejected server-side for a different
// reason.
function evaluatePlacement(engine, buildingId, row, col, teamState) {
  const { placed, cash, slumUpgraded, residentialDemandMultiplier } = teamState;
  const key = tileKey(row, col);
  if (placed[key]) return { ok: false, reason: 'That tile already has a building' };
  if (teamState.extraSlums && teamState.extraSlums[key]) return { ok: false, reason: 'tile not buildable' };
  const tileType = engine.map.tiles[row][col].type;
  const slumUpgradedSet = new Set(slumUpgraded);
  const stats = engine.computeCityStats(
    engine.map,
    placed,
    slumUpgradedSet,
    engine.config,
    residentialDemandMultiplier,
    floodExtras(teamState)
  );
  const ctx = {
    tile: { type: tileType, buildable: engine.isBuildable(tileType) },
    cash,
    hasService: (svc) => Object.values(placed).some((id) => engine.buildingsById[id].serves === svc),
    countById: (id) => Object.values(placed).filter((v) => v === id).length,
    transportCount: Object.values(placed).filter((id) => engine.buildingsById[id].category === engine.CATEGORY.TRANSPORT)
      .length,
    popInRadius: (radius) =>
      Object.values(stats.tileStats).reduce(
        (sum, t) => (t.pop > 0 && engine.chebyshev(row, col, t.row, t.col) <= radius ? sum + t.pop : sum),
        0
      ),
    hasAdjacentDamWithCapacity: engine.hasAdjacentDamWithCapacity(row, col, placed, engine.config, engine.chebyshev),
  };
  return engine.canPlace(buildingId, ctx);
}

// Mutates teamState in place (deduct cost, add to placed) once
// evaluatePlacement has already said ok:true -- callers must not skip
// that check.
function applyPlacement(teamState, buildingId, row, col, cost) {
  teamState.placed[tileKey(row, col)] = buildingId;
  teamState.cash -= cost;
}

function applyRehouse(teamState, row, col, cost) {
  teamState.slumUpgraded.push(tileKey(row, col));
  teamState.cash -= cost;
}

// Never shown to teams continuously (Part I: only right after a
// twist reveal) but this is what the Organizer Console leaderboard and
// the final reveal both read live.
function computeScore(engine, teamState) {
  const slumUpgradedSet = new Set(teamState.slumUpgraded);
  const stats = engine.computeCityStats(
    engine.map,
    teamState.placed,
    slumUpgradedSet,
    engine.config,
    teamState.residentialDemandMultiplier,
    floodExtras(teamState)
  );
  return engine.computeScore(stats, teamState.cash, teamState.cumulativeScoreAdjustment, engine.config);
}

// Runs one team through one year's transition -- income, then twist
// (a team that's about to get hit by the pandemic still collected the
// year's income first) -- mutating teamState in place. Mirrors
// useGameStore.js's advanceYear exactly, just operating on a plain
// team-state object instead of Zustand state.
function applyYearTransition(engine, teamState, global, nextYear, twistName) {
  const slumUpgradedSet = new Set(teamState.slumUpgraded);
  const stats = engine.computeCityStats(
    engine.map,
    teamState.placed,
    slumUpgradedSet,
    engine.config,
    teamState.residentialDemandMultiplier,
    floodExtras(teamState)
  );

  let grossIncome = 0;
  Object.values(teamState.placed).forEach((id) => {
    grossIncome += engine.buildingsById[id].yearly;
  });

  let popWithManyUnserved = 0;
  Object.values(stats.tileStats).forEach((t) => {
    if (t.pop <= 0) return;
    const unmetCount = engine.SERVICES.filter((s) => t.served[s] < t.demand[s]).length;
    if (unmetCount >= engine.config.incomeHalvedMinServicesUnserved) popWithManyUnserved += t.pop;
  });
  const unservedShare = stats.totalPop > 0 ? popWithManyUnserved / stats.totalPop : 0;
  let incomeMultiplier = unservedShare > engine.config.incomeHalvedUnservedShare ? 0.5 : 1;

  let floorResult = null;
  if (nextYear === 1) {
    floorResult = engine.twists.checkMandatoryFloor(stats, teamState.placed);
  }

  const mutable = {
    cash: teamState.cash,
    placed: { ...teamState.placed },
    slumUpgraded: new Set(teamState.slumUpgraded),
    extraSlums: { ...teamState.extraSlums },
    damagedTiles: { ...teamState.damagedTiles },
    pollutionSpillTiles: new Set(teamState.pollutionSpillTiles),
    residentialDemandMultiplier: teamState.residentialDemandMultiplier,
  };

  let twistResult = null;
  let scoreDelta = 0;

  if (twistName === 'flood') {
    twistResult = engine.twists.applyFlood(mutable, engine.map, engine.config);
  } else if (twistName === 'pandemic') {
    twistResult = engine.twists.applyOutbreak(mutable, engine.map, engine.config);
    incomeMultiplier = Math.min(incomeMultiplier, twistResult.incomeMultiplier);
    mutable.cash += twistResult.cashBonus;
    scoreDelta += twistResult.scoreDelta;
  } else if (twistName === 'immigration') {
    twistResult = engine.twists.applyImmigrationSlums(mutable, engine.map, engine.config);
  } else if (twistName === 'olympics') {
    twistResult = engine.twists.evaluateOlympics(mutable, engine.config);
    mutable.cash += twistResult.cashBonus;
    scoreDelta += twistResult.scoreDelta;
  } else if (twistName === 'treasure') {
    twistResult = engine.twists.revealTreasure(mutable, global.treasureTile, engine.config);
    mutable.cash += twistResult.cashGain;
  }

  if (floorResult && !floorResult.met) {
    scoreDelta -= engine.config.mandatoryFloorScorePenalty;
    incomeMultiplier = Math.min(incomeMultiplier, engine.config.mandatoryFloorIncomeMultiplier);
  }

  mutable.cash = Math.max(0, mutable.cash + grossIncome * incomeMultiplier);

  teamState.cash = mutable.cash;
  teamState.placed = mutable.placed;
  teamState.extraSlums = mutable.extraSlums;
  teamState.damagedTiles = mutable.damagedTiles;
  teamState.pollutionSpillTiles = Array.from(mutable.pollutionSpillTiles);
  teamState.residentialDemandMultiplier = mutable.residentialDemandMultiplier;
  teamState.cumulativeScoreAdjustment += scoreDelta;
  teamState.year = nextYear;
  teamState.lastTwistResult = { twist: twistName, result: twistResult, floorResult };
  teamState.lastTwistYear = nextYear;

  return { twistResult, grossIncome, incomeMultiplier, scoreDelta, floorResult };
}

// Year -> twist name mapping, identical to useGameStore.js's yearTwist
// table: years 1-3 come from the shared shuffled draw, 4 is always
// Olympics, 5 is always Treasure.
function twistForYear(global, year) {
  const table = {
    1: global.twistOrder[0],
    2: global.twistOrder[1],
    3: global.twistOrder[2],
    4: 'olympics',
    5: 'treasure',
  };
  return table[year];
}

module.exports = {
  tileKey,
  shuffle,
  randomTreasureTile,
  createInitialTeamState,
  createInitialGlobal,
  evaluatePlacement,
  applyPlacement,
  applyRehouse,
  computeScore,
  applyYearTransition,
  twistForYear,
};
