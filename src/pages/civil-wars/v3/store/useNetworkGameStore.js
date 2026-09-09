import { create } from "zustand";
import { map, config } from "../engine.js";
import { evaluatePlacement } from "./evaluatePlacement.js";
import { joinTeam, fetchState, placeBuilding, rehouseSlum } from "../api/urbanMayhemClient.js";

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
    shownTwistYear: 0,
    selectedBuilding: null,
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
      applyServerState(set, data);
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

  selectBuilding: (id) =>
    set((state) => ({ selectedBuilding: state.selectedBuilding === id ? null : id, lastError: null })),

  beginDrag: (id) => set({ selectedBuilding: id, lastError: null }),

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

  // Repairs, moves and undo aren't wired up server-side yet -- surface a
  // clear message rather than silently doing nothing.
  proposeRepair: () => set({ lastError: "Repairing isn't available online yet" }),
  beginMove: () => set({ lastError: "Moving a building isn't available online yet" }),
  cancelMove: () => {},
  proposeMove: () => {},
  previewMove: () => null,

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
      } else {
        set({ pendingAction: null });
        return;
      }
      applyServerState(set, data);
      set({ selectedBuilding: null, pendingAction: null, lastError: null });
    } catch (err) {
      set({ pendingAction: null, lastError: err.response?.data?.error || "Action failed" });
    }
  },

  closeModal: () => set({ activeModal: null }),
}));

export default useNetworkGameStore;
