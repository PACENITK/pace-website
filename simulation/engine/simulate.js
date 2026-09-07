import buildingsById from "./buildings.js";
import { SERVICES } from "./tileTypes.js";
import { computeCityStats } from "./score.js";
import * as twists from "./twists.js";
import { runPurchasePhase } from "../strategies.js";

function tileKey(r, c) {
  return `${r},${c}`;
}

function servicesUnservedShare(stats, cfg) {
  let popWithManyUnserved = 0;
  Object.values(stats.tileStats).forEach((t) => {
    if (t.pop <= 0) return;
    const unmetCount = SERVICES.filter((s) => t.served[s] < t.demand[s]).length;
    if (unmetCount >= cfg.incomeHalvedMinServicesUnserved) popWithManyUnserved += t.pop;
  });
  const share = stats.totalPop > 0 ? popWithManyUnserved / stats.totalPop : 0;
  return share > cfg.incomeHalvedUnservedShare;
}

// Runs one full Year 0 -> Year 6 game. `twistOrder` is a 3-element
// permutation of [flood, pandemic, immigration] for years 1-3 (Part H:
// the pool exactly equals the slot count, so every run gets all three,
// only the order varies). Olympics is always year 4, treasure year 5,
// per Part G.
export function simulateGame(map, strategy, twistOrder, treasureTile, cfg) {
  const state = {
    cash: cfg.startingBudget,
    placed: {},
    slumUpgraded: new Set(),
    residentialDemandMultiplier: 1,
    immigrationOverflow: 0,
  };

  const log = [];
  let cumulativeScoreAdjustment = 0;
  let pandemicResult = null;
  let olympicsResult = null;
  let floodEvents = [];

  runPurchasePhase(state, map, strategy, cfg, 0);
  log.push({ year: 0, cash: state.cash, spent: cfg.startingBudget - state.cash });

  const yearTwist = { 1: twistOrder[0], 2: twistOrder[1], 3: twistOrder[2], 4: "olympics", 5: "treasure" };

  for (let year = 1; year <= 5; year++) {
    const stats = computeCityStats(map, state.placed, state.slumUpgraded, cfg, state.residentialDemandMultiplier);
    let grossIncome = 0;
    Object.values(state.placed).forEach((id) => {
      grossIncome += buildingsById[id].yearly;
    });
    let incomeMultiplier = servicesUnservedShare(stats, cfg) ? 0.5 : 1;

    const twist = yearTwist[year];
    let twistResult = null;

    if (twist === "flood") {
      twistResult = twists.applyFlood(state, map, cfg);
      floodEvents.push(twistResult);
    } else if (twist === "pandemic") {
      twistResult = twists.applyPandemic(state, map, cfg);
      pandemicResult = twistResult;
      incomeMultiplier = Math.min(incomeMultiplier, twistResult.incomeMultiplier);
      state.cash += twistResult.cashBonus;
      cumulativeScoreAdjustment -= twistResult.scorePenalty;
    } else if (twist === "immigration") {
      twistResult = twists.applyImmigration(state, cfg);
      state.residentialDemandMultiplier = 1 + (state.immigrationOverflow || 0);
    } else if (twist === "olympics") {
      twistResult = twists.evaluateOlympics(state, cfg);
      olympicsResult = twistResult;
      state.cash += twistResult.cashBonus;
      cumulativeScoreAdjustment += twistResult.scoreDelta;
    } else if (twist === "treasure") {
      twistResult = twists.revealTreasure(state, treasureTile, cfg);
      state.cash += twistResult.cashGain;
    }

    state.cash = Math.max(0, state.cash + grossIncome * incomeMultiplier);

    const cashBefore = state.cash;
    runPurchasePhase(state, map, strategy, cfg, year);
    log.push({ year, twist, twistResult, grossIncome, incomeMultiplier, cashAfterCost: cashBefore, cashEnd: state.cash });
  }

  const finalStats = computeCityStats(map, state.placed, state.slumUpgraded, cfg, state.residentialDemandMultiplier);
  const cashBonus = state.cash * cfg.cashPointsPer1Cr;
  const finalScore = Math.floor(finalStats.breakdown.staticTotal + cashBonus + cumulativeScoreAdjustment);

  const buildingsPlaced = Object.keys(state.placed).length;

  return {
    state,
    log,
    finalStats,
    finalScore,
    finalCash: state.cash,
    cashBonus,
    cumulativeScoreAdjustment,
    pandemicResult,
    olympicsResult,
    floodEvents,
    buildingsPlaced,
    tilesUsed: buildingsPlaced,
  };
}
