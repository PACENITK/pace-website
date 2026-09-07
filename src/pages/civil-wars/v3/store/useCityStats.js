import { useMemo } from "react";
import useGameStore from "./useGameStore.js";
import { computeCityStats, config } from "../engine.js";

// Score/coverage/allocation are always derived, never stored -- the
// engine's computeCityStats is a pure function of the board, so it's
// recomputed reactively via useMemo instead of duplicated into state
// that could drift from the buildings actually placed.
export default function useCityStats() {
  const map = useGameStore((s) => s.map);
  const placed = useGameStore((s) => s.placed);
  const slumUpgraded = useGameStore((s) => s.slumUpgraded);
  const residentialDemandMultiplier = useGameStore((s) => s.residentialDemandMultiplier);
  return useMemo(
    () => computeCityStats(map, placed, slumUpgraded, config, residentialDemandMultiplier),
    [map, placed, slumUpgraded, residentialDemandMultiplier]
  );
}
