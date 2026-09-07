// The 9 services, per rules.md Part D. The rulebook's own tables (the
// building list, the ₹845 Cr inherited-city cost breakdown) are only
// internally consistent if Food counts as a full 9th service alongside
// the eight distance-based ones -- the "eight services" phrasing
// elsewhere in the doc is the stale reference. See sim-report.md for
// the consequence (a fully-served Residential Large scores 450, not
// the 400 the doc's worked example gives).
export const SERVICES = [
  "power",
  "water",
  "health",
  "education",
  "environment",
  "safety",
  "sanitation",
  "transport",
  "food",
];

// Inherited settlement types + base terrain (Part B/C). Demand units
// are per service. Terrain tiles carry no population and no demand.
const tileTypes = {
  slum: { pop: 2000, demandUnits: 2, buildable: false, settlement: true, isSlum: true },
  colony: { pop: 1500, demandUnits: 2, buildable: false, settlement: true, isSlum: false },
  empty: { pop: 0, demandUnits: 0, buildable: true, settlement: false, isSlum: false },
  river: { pop: 0, demandUnits: 0, buildable: false, settlement: false, isSlum: false },
  road: { pop: 0, demandUnits: 0, buildable: false, settlement: false, isSlum: false },
};

// A slum's demand/population profile, aware of the ₹60 Cr upgrade
// action (Part C: "Rehouse a slum and it becomes a Residential Medium:
// 2,500 people, normal penalties, no sanitation clause"). Colonies and
// terrain are unaffected by the upgrade flag.
export function effectiveSettlement(type, upgraded, cfg) {
  const base = tileTypes[type];
  if (!base || !base.settlement) return { pop: 0, demandUnits: 0, isSlum: false };
  if (base.isSlum && upgraded) {
    return { pop: cfg.slumUpgradedPop, demandUnits: cfg.slumUpgradedDemandUnits, isSlum: false };
  }
  return { pop: base.pop, demandUnits: base.demandUnits, isSlum: base.isSlum };
}

export function isBuildable(type) {
  return !!tileTypes[type] && tileTypes[type].buildable;
}

export default tileTypes;
