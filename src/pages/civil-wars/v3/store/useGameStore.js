import { create } from "zustand";
import {
  buildingsById,
  canPlace,
  CATEGORY,
  SERVICES,
  isBuildable,
  config,
  computeCityStats,
  chebyshev,
  twists,
  map,
} from "../engine.js";

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

function randomTreasureTile() {
  return tileKey(Math.floor(Math.random() * map.height), Math.floor(Math.random() * map.width));
}

// Shared by placeBuilding (mutating) and previewPlacement (read-only, used
// while dragging) so the drop-preview highlight can never drift from what
// actually happens on drop.
function evaluatePlacement(buildingId, row, col, state) {
  const { placed, cash, slumUpgraded, residentialDemandMultiplier } = state;
  const key = tileKey(row, col);
  if (placed[key]) return { ok: false, reason: "That tile already has a building" };
  const tileType = map.tiles[row][col].type;
  const stats = computeCityStats(map, placed, slumUpgraded, config, residentialDemandMultiplier);
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
  };
  return canPlace(buildingId, ctx);
}

// Twist order and the treasure tile are drawn once here, the same way
// an organizer would draw them before a real event -- shared by every
// viewer of this store, never re-rolled per action (rules.md Part H/K:
// "twists apply to all teams at the same moment", one shared draw).
function initialState() {
  return {
    map,
    cash: config.startingBudget,
    placed: {},
    slumUpgraded: new Set(),
    residentialDemandMultiplier: 1,
    immigrationOverflow: 0,
    year: 0,
    twistOrder: shuffle(["flood", "pandemic", "immigration"]),
    treasureTile: randomTreasureTile(),
    twistLog: [],
    cumulativeScoreAdjustment: 0,
    selectedBuilding: null,
    hoveredTile: null,
    activeModal: null,
    lastError: null,
  };
}

const useGameStore = create((set, get) => ({
  ...initialState(),

  selectBuilding: (id) =>
    set((state) => ({
      selectedBuilding: state.selectedBuilding === id ? null : id,
      lastError: null,
    })),

  // Always selects (never toggles) -- used by the palette's drag start so
  // grabbing a building for a drag never accidentally deselects it.
  beginDrag: (id) => set({ selectedBuilding: id, lastError: null }),

  hoverTile: (key) => set({ hoveredTile: key }),
  clearHover: () => set({ hoveredTile: null }),

  // Read-only check for the currently selected building against a tile --
  // drives the live green/red drop highlight while dragging, using the
  // exact same canPlace() call placeBuilding will make on drop.
  previewPlacement: (row, col) => {
    const state = get();
    if (!state.selectedBuilding) return null;
    return evaluatePlacement(state.selectedBuilding, row, col, state);
  },

  // Mirrors the validation a real backend would run server-side
  // (Phase 2): builds the same `ctx` shape buildings.js's canPlace()
  // expects, using the live board instead of a simulated one.
  placeBuilding: (row, col) => {
    const state = get();
    const { selectedBuilding, placed, cash } = state;
    if (!selectedBuilding) return;
    const result = evaluatePlacement(selectedBuilding, row, col, state);
    if (!result.ok) {
      set({ lastError: result.reason });
      return;
    }
    const def = buildingsById[selectedBuilding];
    set({
      placed: { ...placed, [tileKey(row, col)]: selectedBuilding },
      cash: cash - def.cost,
      selectedBuilding: null,
      lastError: null,
    });
  },

  upgradeSlum: (row, col) => {
    const state = get();
    const key = tileKey(row, col);
    if (state.map.tiles[row][col].type !== "slum") return;
    if (state.slumUpgraded.has(key)) return;
    if (state.cash < config.slumUpgradeCost) {
      set({ lastError: "Not enough cash to upgrade this slum" });
      return;
    }
    const next = new Set(state.slumUpgraded);
    next.add(key);
    set({ slumUpgraded: next, cash: state.cash - config.slumUpgradeCost, lastError: null });
  },

  // Organizer action. Mirrors simulation/engine/simulate.js's per-year
  // loop exactly (unified income model, Part F) so this store's numbers
  // never drift from what the balance simulation already validated.
  advanceYear: () => {
    const state = get();
    if (state.year >= 5) return;
    const nextYear = state.year + 1;
    const stats = computeCityStats(state.map, state.placed, state.slumUpgraded, config, state.residentialDemandMultiplier);

    let grossIncome = 0;
    Object.values(state.placed).forEach((id) => {
      grossIncome += buildingsById[id].yearly;
    });

    let popWithManyUnserved = 0;
    Object.values(stats.tileStats).forEach((t) => {
      if (t.pop <= 0) return;
      const unmetCount = SERVICES.filter((s) => t.served[s] < t.demand[s]).length;
      if (unmetCount >= config.incomeHalvedMinServicesUnserved) popWithManyUnserved += t.pop;
    });
    const unservedShare = stats.totalPop > 0 ? popWithManyUnserved / stats.totalPop : 0;
    let incomeMultiplier = unservedShare > config.incomeHalvedUnservedShare ? 0.5 : 1;

    const yearTwist = {
      1: state.twistOrder[0],
      2: state.twistOrder[1],
      3: state.twistOrder[2],
      4: "olympics",
      5: "treasure",
    };
    const twistName = yearTwist[nextYear];

    const mutable = {
      cash: state.cash,
      placed: { ...state.placed },
      residentialDemandMultiplier: state.residentialDemandMultiplier,
      immigrationOverflow: state.immigrationOverflow,
    };

    let twistResult = null;
    let scoreDelta = 0;

    if (twistName === "flood") {
      twistResult = twists.applyFlood(mutable, state.map, config);
    } else if (twistName === "pandemic") {
      twistResult = twists.applyPandemic(mutable, state.map, config);
      incomeMultiplier = Math.min(incomeMultiplier, twistResult.incomeMultiplier);
      mutable.cash += twistResult.cashBonus;
      scoreDelta -= twistResult.scorePenalty;
    } else if (twistName === "immigration") {
      twistResult = twists.applyImmigration(mutable, config);
      mutable.residentialDemandMultiplier = 1 + (mutable.immigrationOverflow || 0);
    } else if (twistName === "olympics") {
      twistResult = twists.evaluateOlympics(mutable, config);
      mutable.cash += twistResult.cashBonus;
      scoreDelta += twistResult.scoreDelta;
    } else if (twistName === "treasure") {
      twistResult = twists.revealTreasure(mutable, state.treasureTile, config);
      mutable.cash += twistResult.cashGain;
    }

    mutable.cash = Math.max(0, mutable.cash + grossIncome * incomeMultiplier);

    set({
      year: nextYear,
      cash: mutable.cash,
      placed: mutable.placed,
      residentialDemandMultiplier: mutable.residentialDemandMultiplier,
      immigrationOverflow: mutable.immigrationOverflow,
      cumulativeScoreAdjustment: state.cumulativeScoreAdjustment + scoreDelta,
      twistLog: [
        ...state.twistLog,
        { year: nextYear, twist: twistName, result: twistResult, grossIncome, incomeMultiplier },
      ],
      activeModal: { type: "twist", twist: twistName, result: twistResult, year: nextYear },
    });
  },

  closeModal: () => set({ activeModal: null }),

  resetGame: () => set(initialState()),

  // Dev/demo convenience: jump straight to a hand-authored mid-game
  // board (see data/mockGameState.js) instead of replaying Year 0-2
  // manually every reload. Bypasses canPlace validation on purpose --
  // it's fixture data, not a real playthrough.
  loadCheckpoint: (checkpoint) =>
    set({
      ...initialState(),
      ...checkpoint,
      slumUpgraded: new Set(checkpoint.slumUpgraded || []),
    }),
}));

export default useGameStore;
