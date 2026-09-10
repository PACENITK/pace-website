import { create } from "zustand";
import { buildingsById, CATEGORY, SERVICES, config, computeCityStats, chebyshev, twists, map } from "../engine.js";
import { floodExtras, evaluatePlacement, evaluateMove, moveFee } from "./evaluatePlacement.js";

function tileKey(r, c) {
  return `${r},${c}`;
}

// v4: the Years 1-3 twist order is fixed, not drawn -- Flood, then
// Waterborne outbreak, then Immigration, every game (rules.md Part G/H).
// A known order is what lets the rules state, year by year, exactly
// what each twist puts at stake. Olympics is always Year 4, Treasure
// always Year 5.
const TWIST_ORDER = ["flood", "pandemic", "immigration"];

function randomTreasureTile() {
  return '3,7';
}

// The treasure tile is drawn once here, the same way an organizer would
// draw it before a real event -- shared by every viewer of this store,
// never re-rolled per action (rules.md Part H/K: "twists apply to all
// teams at the same moment", one shared draw).
function initialState() {
  return {
    map,
    cash: config.startingBudget,
    placed: {},
    slumUpgraded: new Set(),
    residentialDemandMultiplier: 1,
    // v4: new slum tiles from immigration ("r,c" -> {pop, demandUnits}),
    // tiles put offline by a flood ("r,c" -> {repairCost, id, zone}),
    // and industry tiles with a permanent flood pollution spill.
    extraSlums: {},
    damagedTiles: {},
    pollutionSpillTiles: new Set(),
    year: 0,
    twistOrder: TWIST_ORDER.slice(),
    treasureTile: randomTreasureTile(),
    treasureRevealed: false,
    treasureClaimed: false,
    twistLog: [],
    cumulativeScoreAdjustment: 0,
    selectedBuilding: null,
    // A building picked up off the board (click a placed building, not
    // the palette) and awaiting a destination tile -- see beginMove().
    // Mutually exclusive with selectedBuilding: starting one clears the
    // other.
    moveFrom: null,
    hoveredTile: null,
    activeModal: null,
    lastError: null,
    // pendingAction: a placement/rehouse/repair/move proposed by a click
    // or drop, awaiting the confirmation modal -- nothing here has
    // touched cash or the board yet. undoable: the most recently
    // *confirmed* action, reversible for a 5s window (UndoBanner owns
    // the timer and calls clearUndoable() when it lapses) -- a safety
    // net for a fast-paced in-person event where a mis-tap costs real
    // budget.
    pendingAction: null,
    undoable: null,
  };
}

const useGameStore = create((set, get) => ({
  ...initialState(),

  selectBuilding: (id) =>
    set((state) => ({
      selectedBuilding: state.selectedBuilding === id ? null : id,
      moveFrom: null,
      lastError: null,
    })),

  // Always selects (never toggles) -- used by the palette's drag start so
  // grabbing a building for a drag never accidentally deselects it.
  beginDrag: (id) => set({ selectedBuilding: id, moveFrom: null, lastError: null }),

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

  // Picks up an already-placed building for relocation -- click a tile
  // that has a building (and no palette building is selected) to start
  // a move; the next tile click proposes moving it there. Clicking the
  // same source tile again cancels (see CityGridV3's handleTileClick).
  beginMove: (row, col) => {
    const state = get();
    const key = tileKey(row, col);
    const buildingId = state.placed[key];
    if (!buildingId) return;
    if (state.damagedTiles[key]) {
      set({ lastError: "Repair this building before moving it" });
      return;
    }
    set({ moveFrom: { row, col, buildingId }, selectedBuilding: null, lastError: null });
  },

  cancelMove: () => set({ moveFrom: null, lastError: null }),

  // Read-only counterpart to evaluateMove, for the live drop preview
  // while a move is in progress -- same idea as previewPlacement.
  previewMove: (row, col) => {
    const state = get();
    if (!state.moveFrom) return null;
    return evaluateMove(state.moveFrom.buildingId, state.moveFrom.row, state.moveFrom.col, row, col, state);
  },

  proposeMove: (row, col) => {
    const state = get();
    const { moveFrom } = state;
    if (!moveFrom) return;
    const result = evaluateMove(moveFrom.buildingId, moveFrom.row, moveFrom.col, row, col, state);
    if (!result.ok) {
      set({ lastError: result.reason });
      return;
    }
    set({
      pendingAction: {
        type: "move",
        fromRow: moveFrom.row,
        fromCol: moveFrom.col,
        toRow: row,
        toCol: col,
        buildingId: moveFrom.buildingId,
        fee: result.fee,
      },
      lastError: null,
    });
  },

  // Validates a placement (same `ctx` shape buildings.js's canPlace()
  // expects, mirroring what a real backend would run server-side in
  // Phase 2) and, if legal, opens the confirmation modal instead of
  // touching the board -- nothing is spent until confirmPendingAction().
  proposePlacement: (row, col) => {
    const state = get();
    const { selectedBuilding } = state;
    if (!selectedBuilding) return;
    const result = evaluatePlacement(selectedBuilding, row, col, state);
    if (!result.ok) {
      set({ lastError: result.reason });
      return;
    }
    set({ pendingAction: { type: "place", row, col, buildingId: selectedBuilding }, lastError: null });
  },

  proposeRehouse: (row, col) => {
    const state = get();
    const key = tileKey(row, col);
    if (state.map.tiles[row][col].type !== "slum") return;
    if (state.slumUpgraded.has(key)) return;
    if (state.cash < config.slumUpgradeCost) {
      set({ lastError: "Not enough cash to upgrade this slum" });
      return;
    }
    set({ pendingAction: { type: "rehouse", row, col }, lastError: null });
  },

  // v4: pay a flood-damaged tile's repair cost to bring it back online.
  proposeRepair: (row, col) => {
    const state = get();
    const key = tileKey(row, col);
    const entry = state.damagedTiles[key];
    if (!entry) return;
    if (state.cash < entry.repairCost) {
      set({ lastError: "Not enough cash to repair this" });
      return;
    }
    set({ pendingAction: { type: "repair", row, col }, lastError: null });
  },

  cancelPendingAction: () => set({ pendingAction: null }),

  // Commits whatever proposePlacement/proposeRehouse/proposeRepair
  // staged, and opens the 5s undo window. Re-validates (board state
  // can't have changed since propose in this single-player client, but
  // this keeps the invariant that nothing reaches persisted state
  // without passing its check immediately beforehand).
  confirmPendingAction: () => {
    const state = get();
    const { pendingAction } = state;
    if (!pendingAction) return;

    if (pendingAction.type === "place") {
      const { row, col, buildingId } = pendingAction;
      const result = evaluatePlacement(buildingId, row, col, state);
      if (!result.ok) {
        set({ pendingAction: null, lastError: result.reason });
        return;
      }
      const def = buildingsById[buildingId];
      set({
        placed: { ...state.placed, [tileKey(row, col)]: buildingId },
        cash: state.cash - def.cost,
        selectedBuilding: null,
        pendingAction: null,
        lastError: null,
        undoable: { type: "place", row, col, buildingId, refund: def.cost },
      });
    } else if (pendingAction.type === "rehouse") {
      const { row, col } = pendingAction;
      const key = tileKey(row, col);
      if (state.map.tiles[row][col].type !== "slum" || state.slumUpgraded.has(key) || state.cash < config.slumUpgradeCost) {
        set({ pendingAction: null });
        return;
      }
      const next = new Set(state.slumUpgraded);
      next.add(key);
      set({
        slumUpgraded: next,
        cash: state.cash - config.slumUpgradeCost,
        pendingAction: null,
        lastError: null,
        undoable: { type: "rehouse", row, col, refund: config.slumUpgradeCost },
      });
    } else if (pendingAction.type === "repair") {
      const { row, col } = pendingAction;
      const key = tileKey(row, col);
      const entry = state.damagedTiles[key];
      if (!entry || state.cash < entry.repairCost) {
        set({ pendingAction: null });
        return;
      }
      const nextDamaged = { ...state.damagedTiles };
      delete nextDamaged[key];
      set({
        damagedTiles: nextDamaged,
        cash: state.cash - entry.repairCost,
        pendingAction: null,
        lastError: null,
        undoable: { type: "repair", row, col, refund: entry.repairCost, repairEntry: entry },
      });
    } else if (pendingAction.type === "move") {
      const { fromRow, fromCol, toRow, toCol, buildingId } = pendingAction;
      const result = evaluateMove(buildingId, fromRow, fromCol, toRow, toCol, state);
      if (!result.ok) {
        set({ pendingAction: null, moveFrom: null, lastError: result.reason });
        return;
      }
      const fromKey = tileKey(fromRow, fromCol);
      const toKey = tileKey(toRow, toCol);
      const nextPlaced = { ...state.placed };
      delete nextPlaced[fromKey];
      nextPlaced[toKey] = buildingId;
      set({
        placed: nextPlaced,
        cash: state.cash - result.fee,
        moveFrom: null,
        pendingAction: null,
        lastError: null,
        undoable: { type: "move", fromRow, fromCol, toRow, toCol, buildingId, refund: result.fee },
      });
    }
  },

  // Reverses the last confirmed action within its 5s window (called by
  // UndoBanner's click handler) -- refunds cash and removes exactly what
  // confirmPendingAction added, nothing else.
  undoLastAction: () => {
    const state = get();
    const { undoable } = state;
    if (!undoable) return;

    if (undoable.type === "place") {
      const key = tileKey(undoable.row, undoable.col);
      const nextPlaced = { ...state.placed };
      delete nextPlaced[key];
      set({ placed: nextPlaced, cash: state.cash + undoable.refund, undoable: null });
    } else if (undoable.type === "rehouse") {
      const key = tileKey(undoable.row, undoable.col);
      const next = new Set(state.slumUpgraded);
      next.delete(key);
      set({ slumUpgraded: next, cash: state.cash + undoable.refund, undoable: null });
    } else if (undoable.type === "repair") {
      const key = tileKey(undoable.row, undoable.col);
      set({
        damagedTiles: { ...state.damagedTiles, [key]: undoable.repairEntry },
        cash: state.cash + undoable.refund,
        undoable: null,
      });
    } else if (undoable.type === "move") {
      const fromKey = tileKey(undoable.fromRow, undoable.fromCol);
      const toKey = tileKey(undoable.toRow, undoable.toCol);
      const nextPlaced = { ...state.placed };
      delete nextPlaced[toKey];
      nextPlaced[fromKey] = undoable.buildingId;
      set({ placed: nextPlaced, cash: state.cash + undoable.refund, undoable: null });
    }
  },

  // Called by UndoBanner when its 5s countdown lapses -- the action
  // simply stops being reversible, nothing about the board changes.
  clearUndoable: () => set({ undoable: null }),

  // Organizer action. Mirrors simulation/engine/simulate.js's per-year
  // loop exactly (unified income model, Part F) so this store's numbers
  // never drift from what the balance simulation already validated.
  advanceYear: () => {
    const state = get();
    if (state.year >= 5) return;
    const nextYear = state.year + 1;
    const stats = computeCityStats(
      state.map,
      state.placed,
      state.slumUpgraded,
      config,
      state.residentialDemandMultiplier,
      floodExtras(state)
    );

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

    // v4 Part B: checked once, using the board exactly as Year 0 left
    // it -- before this transition's own twist (if any) has touched
    // anything. Independent of, and stacks with, whatever the twist
    // itself does.
    let floorResult = null;
    if (nextYear === 1) {
      floorResult = twists.checkMandatoryFloor(stats, state.placed);
    }

    const mutable = {
      cash: state.cash,
      placed: { ...state.placed },
      slumUpgraded: new Set(state.slumUpgraded),
      extraSlums: { ...state.extraSlums },
      damagedTiles: { ...state.damagedTiles },
      pollutionSpillTiles: new Set(state.pollutionSpillTiles),
      residentialDemandMultiplier: state.residentialDemandMultiplier,
    };

    let twistResult = null;
    let scoreDelta = 0;

    if (twistName === "flood") {
      twistResult = twists.applyFlood(mutable, state.map, config);
    } else if (twistName === "pandemic") {
      twistResult = twists.applyOutbreak(mutable, state.map, config);
      incomeMultiplier = Math.min(incomeMultiplier, twistResult.incomeMultiplier);
      mutable.cash += twistResult.cashBonus;
      scoreDelta += twistResult.scoreDelta;
    } else if (twistName === "immigration") {
      twistResult = twists.applyImmigrationSlums(mutable, state.map, config);
    } else if (twistName === "olympics") {
      twistResult = twists.evaluateOlympics(mutable, config);
      mutable.cash += twistResult.cashBonus;
      scoreDelta += twistResult.scoreDelta;
    } else if (twistName === "treasure") {
      twistResult = twists.revealTreasure(mutable, state.treasureTile, config);
    }

    if (floorResult && !floorResult.met) {
      scoreDelta -= config.mandatoryFloorScorePenalty;
      incomeMultiplier = Math.min(incomeMultiplier, config.mandatoryFloorIncomeMultiplier);
    }

    mutable.cash = Math.max(0, mutable.cash + grossIncome * incomeMultiplier);

    set({
      year: nextYear,
      cash: mutable.cash,
      placed: mutable.placed,
      extraSlums: mutable.extraSlums,
      damagedTiles: mutable.damagedTiles,
      pollutionSpillTiles: mutable.pollutionSpillTiles,
      residentialDemandMultiplier: mutable.residentialDemandMultiplier,
      treasureRevealed: twistName === "treasure" ? true : state.treasureRevealed,
      cumulativeScoreAdjustment: state.cumulativeScoreAdjustment + scoreDelta,
      twistLog: [
        ...state.twistLog,
        { year: nextYear, twist: twistName, result: twistResult, floorResult, grossIncome, incomeMultiplier },
      ],
      activeModal: { type: "twist", twist: twistName, result: twistResult, floorResult, year: nextYear },
    });
  },

  closeModal: () => set({ activeModal: null }),

  claimTreasure: () => {
    const state = get();
    if (!state.treasureRevealed) {
      set({ lastError: "Treasure has not been revealed yet" });
      return;
    }
    if (state.treasureClaimed) {
      set({ lastError: "Treasure already claimed" });
      return;
    }

    const builtId = state.placed[state.treasureTile];
    let cost = config.treasureMiningCost;
    if (builtId) {
      cost += buildingsById[builtId].cost * config.treasureDemolishRate;
    }

    if (state.cash < cost) {
      set({ lastError: "Not enough cash to claim treasure" });
      return;
    }

    const mutable = { placed: { ...state.placed } };
    const result = twists.claimTreasure(mutable, state.treasureTile, config, buildingsById);

    set({
      cash: state.cash - result.cost + result.cashGain,
      placed: mutable.placed,
      treasureClaimed: true,
      lastError: null,
    });
  },

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
      pollutionSpillTiles: new Set(checkpoint.pollutionSpillTiles || []),
    }),
}));

export default useGameStore;
