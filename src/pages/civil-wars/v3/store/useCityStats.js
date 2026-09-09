import { useMemo } from "react";
import { useActiveGameStore } from "./GameStoreContext.jsx";
import { computeCityStats, config } from "../engine.js";

// Score/coverage/allocation are always derived, never stored -- the
// engine's computeCityStats is a pure function of the board, so it's
// recomputed reactively via useMemo instead of duplicated into state
// that could drift from the buildings actually placed.
export default function useCityStats() {
  const map = useActiveGameStore((s) => s.map);
  const placed = useActiveGameStore((s) => s.placed);
  const slumUpgraded = useActiveGameStore((s) => s.slumUpgraded);
  const residentialDemandMultiplier = useActiveGameStore((s) => s.residentialDemandMultiplier);
  const extraSlums = useActiveGameStore((s) => s.extraSlums);
  const damagedTiles = useActiveGameStore((s) => s.damagedTiles);
  const pollutionSpillTiles = useActiveGameStore((s) => s.pollutionSpillTiles);
  return useMemo(
    () =>
      computeCityStats(map, placed, slumUpgraded, config, residentialDemandMultiplier, {
        extraSlums,
        damagedTiles,
        pollutionSpillTiles,
      }),
    [map, placed, slumUpgraded, residentialDemandMultiplier, extraSlums, damagedTiles, pollutionSpillTiles]
  );
}
