import { create } from "zustand";
import { map, config } from "../engine.js";
import { evaluatePlacement, evaluateMove } from "./evaluatePlacement.js";
import { joinTeam, fetchState, placeBuilding, rehouseSlum, moveBuilding, repairBuilding, claimTreasure } from "../api/urbanMayhemClient.js";

function tileKey(r, c) {
  return `${r},${c}`;
}

function applyServerState(set, data) {
  set({
    cash: data.cash,
    placed: data.placed,
    slumUpgraded: new Set(data.slumUpgraded),
    residentialDemandMultiplier: data.residentialDemandMultiplier,
    damagedTiles: data.damagedTiles || {},
    extraSlums: data.extraSlums || {},
    pollutionSpillTiles: new Set(data.pollutionSpillTiles || []),
    year: data.year,
    locked: data.locked,
    phase: data.phase || "live",
    practiceEndsAt: data.practiceEndsAt || null,
    treasureRevealed: data.treasureRevealed || false,
    treasureClaimed: data.treasureClaimed || false,
    treasureTile: data.treasureTile || null,
  });
}

function initialState() {
  return {
    map,
    joined: false,
    joinError: null,
    teamName: null,
    cash: config.startingBudget,
    placed: {},
    slumUpgraded: new Set(),
    residentialDemandMultiplier: 1,
    damagedTiles: {},
    extraSlums: {},
    pollutionSpillTiles: new Set(),
    year: 0,
    locked: false,
    phase: "live",
    practiceEndsAt: null,
    practiceJustEnded: false,
    treasureRevealed: false,
    treasureClaimed: false,
    treasureTile: null,
    shownTwistYear: 0,
    selectedBuilding: null,
    moveFrom: null,
    hoveredTile: null,
    activeModal: null,
    pendingAction: null,
    lastError: null,
  };
}

const useNetworkGameStore = create((set, get) => ({
  ...initialState(),

  join: async (code) => {
    try {
      const res = await joinTeam(code);
      set({ joined: true, teamName: res.teamName, joinError: null });
      await get().refresh();
      setInterval(() => get().refresh(), 2500);
    } catch (err) {
      set({ joinError: err.response?.data?.error || "Couldn't join with that code." });
    }
  },

  refresh: async () => {
    const state = get();
    try {
      const data = await fetchState();
      const practiceJustEnded = state.phase === "practice" && data.phase === "live";
      applyServerState(set, data);
      if (practiceJustEnded) {
        set({ practiceJustEnded: true });
        setTimeout(() => set({ practiceJustEnded: false }), 8000);
      }
      if (data.lastTwistYear && data.lastTwistYear > state.shownTwistYear && data.lastTwistResult) {
        set({
          activeModal: {
            type: "twist",
            twist: data.lastTwistResult.twist,
            result: data.lastTwistResult.result,
            floorResult: data.lastTwistResult.floorResult,
            year: data.lastTwistYear,
          },
          shownTwistYear: data.lastTwistYear,
        });
      }
    } catch {
      // A dropped poll isn't worth surfacing as an error banner; the next
      // one 2.5s later will most likely succeed.
    }
  },

  dismissPracticeBanner: () => set({ practiceJustEnded: false }),

  selectBuilding: (id) =>
    set((state) => ({
      selectedBuilding: state.selectedBuilding === id ? null : id,
      moveFrom: null,
      lastError: null,
    })),

  beginDrag: (id) => set({ selectedBuilding: id, moveFrom: null, lastError: null }),

  hoverTile: (key) => set({ hoveredTile: key }),
  clearHover: () => set({ hoveredTile: null }),

  previewPlacement: (row, col) => {
    const state = get();
    if (!state.selectedBuilding) return null;
    return evaluatePlacement(state.selectedBuilding, row, col, state);
  },

  proposePlacement: (row, col) => {
    const state = get();
    if (!state.selectedBuilding) return;
    const result = evaluatePlacement(state.selectedBuilding, row, col, state);
    if (!result.ok) {
      set({ lastError: result.reason });
      return;
    }
    set({ pendingAction: { type: "place", row, col, buildingId: state.selectedBuilding }, lastError: null });
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

  proposeClaimTreasure: () => {
    const state = get();
    if (!state.treasureRevealed || state.treasureClaimed) return;
    set({ pendingAction: { type: "claim_treasure" }, lastError: null });
  },

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

  cancelPendingAction: () => set({ pendingAction: null }),

  confirmPendingAction: async () => {
    const state = get();
    const { pendingAction } = state;
    if (!pendingAction) return;
    try {
      let data;
      if (pendingAction.type === "place") {
        data = await placeBuilding(pendingAction.row, pendingAction.col, pendingAction.buildingId);
      } else if (pendingAction.type === "rehouse") {
        data = await rehouseSlum(pendingAction.row, pendingAction.col);
      } else if (pendingAction.type === "move") {
        data = await moveBuilding(pendingAction.fromRow, pendingAction.fromCol, pendingAction.toRow, pendingAction.toCol);
      } else if (pendingAction.type === "repair") {
        data = await repairBuilding(pendingAction.row, pendingAction.col);
      } else if (pendingAction.type === "claim_treasure") {
        data = await claimTreasure();
      } else {
        set({ pendingAction: null });
        return;
      }
      applyServerState(set, data);
      set({ selectedBuilding: null, moveFrom: null, pendingAction: null, lastError: null });
    } catch (err) {
      set({ pendingAction: null, moveFrom: null, lastError: err.response?.data?.error || "Action failed" });
    }
  },

  closeModal: () => set({ activeModal: null }),
}));

export default useNetworkGameStore;
