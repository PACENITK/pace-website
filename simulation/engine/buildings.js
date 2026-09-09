// Full v3 building list, Part E. `requires` entries are simple string
// tokens interpreted by canPlace() below: "power"/"water" (at least one
// building serving that service exists), "X:N" (at least N buildings
// with id/category X exist), "popInRadius:N" (N population within the
// building's own radius).
export const CATEGORY = {
  RESIDENTIAL: "residential",
  ESSENTIAL: "essential",
  PROTECTION: "protection",
  TRANSPORT: "transport",
  ECONOMY: "economy",
  INDUSTRY: "industry",
};

const INF = Infinity;

const buildings = {
  residential_small: {
    id: "residential_small",
    name: "Residential - Small",
    category: CATEGORY.RESIDENTIAL,
    cost: 30,
    yearly: 0,
    populates: { pop: 1000, demandUnits: 1 },
    requires: [],
  },
  residential_medium: {
    id: "residential_medium",
    name: "Residential - Medium",
    category: CATEGORY.RESIDENTIAL,
    cost: 50,
    yearly: 0,
    populates: { pop: 2500, demandUnits: 3 },
    requires: [],
  },
  residential_large: {
    id: "residential_large",
    name: "Residential - Large",
    category: CATEGORY.RESIDENTIAL,
    cost: 70,
    yearly: 0,
    populates: { pop: 5000, demandUnits: 5 },
    requires: [],
  },

  water_tank: {
    id: "water_tank",
    name: "Water tank",
    category: CATEGORY.ESSENTIAL,
    cost: 25,
    yearly: -1,
    serves: "water",
    capacity: 3,
    radius: 2,
    requires: ["power"],
  },
  water_treatment: {
    id: "water_treatment",
    name: "Water treatment plant",
    category: CATEGORY.ESSENTIAL,
    cost: 80,
    yearly: -3,
    serves: "water",
    capacity: 12,
    radius: 4,
    requires: ["power"],
  },
  hospital: {
    id: "hospital",
    name: "Hospital",
    category: CATEGORY.ESSENTIAL,
    cost: 50,
    yearly: -4,
    serves: "health",
    capacity: 3,
    radius: 3,
    requires: ["power", "water"],
  },
  school: {
    id: "school",
    name: "School",
    category: CATEGORY.ESSENTIAL,
    cost: 30,
    yearly: -1,
    serves: "education",
    capacity: 3,
    radius: 3,
    requires: ["power"],
  },
  park: {
    id: "park",
    name: "Park",
    category: CATEGORY.ESSENTIAL,
    cost: 10,
    yearly: -0.5,
    serves: "environment",
    capacity: 2,
    radius: 1,
    requires: [],
  },
  safety_station: {
    id: "safety_station",
    name: "Safety station",
    category: CATEGORY.ESSENTIAL,
    cost: 25,
    yearly: -1,
    serves: "safety",
    capacity: 5,
    radius: 3,
    requires: ["power"],
  },
  sewage_plant: {
    id: "sewage_plant",
    name: "Sewage plant",
    category: CATEGORY.ESSENTIAL,
    cost: 40,
    yearly: -2,
    serves: "sanitation",
    capacity: 6,
    radius: 3,
    requires: ["power", "water"],
  },
  farm: {
    id: "farm",
    name: "Farm",
    category: CATEGORY.ESSENTIAL,
    cost: 20,
    yearly: -0.5,
    serves: "food",
    capacity: 6,
    radius: INF,
    requires: ["water"],
  },

  storm_drainage: {
    id: "storm_drainage",
    name: "Storm drainage",
    category: CATEGORY.PROTECTION,
    cost: 15,
    yearly: -0.5,
    radius: 2,
    requires: [],
  },
  // v4 Part A: power is dam + hydro only. A dam itself supplies no
  // power (serves is intentionally absent) -- it enables hydro
  // stations built adjacent to it and protects a column span
  // downstream (config.damProtectionSpan). More than one dam is
  // allowed; the river is 16 columns wide and one dam covers 6, so a
  // second dam is a real (sweepable) choice, not a formality.
  dam: {
    id: "dam",
    name: "Dam",
    category: CATEGORY.PROTECTION,
    cost: 100,
    yearly: -3,
    requires: [],
    riverOnly: true,
  },
  hydro_station: {
    id: "hydro_station",
    name: "Hydro station",
    category: CATEGORY.ESSENTIAL,
    cost: 70,
    yearly: -2,
    serves: "power",
    capacity: 20,
    radius: 5,
    // Handled specially in canPlace() below, not by the generic
    // requires-string machinery: needs to know *which* dams exist and
    // how many hydro stations are already attached to each (max 2 per
    // dam), which a plain "X:N" count string can't express. No
    // attachment is persisted anywhere -- both this check and flood
    // protection re-derive "which dam" fresh from the board every
    // time (see ctx.adjacentDamWithCapacity below and twists.js).
    requires: ["adjacentDamWithCapacity"],
  },

  bus_stand: {
    id: "bus_stand",
    name: "Bus stand",
    category: CATEGORY.TRANSPORT,
    cost: 30,
    yearly: -1,
    serves: "transport",
    capacity: 5,
    radius: 3,
    requires: ["power"],
  },
  railway: {
    id: "railway",
    name: "Railway station",
    category: CATEGORY.TRANSPORT,
    cost: 100,
    yearly: 20,
    serves: "transport",
    capacity: 15,
    radius: INF,
    requires: ["power", "bus_stand:1"],
  },
  metro: {
    id: "metro",
    name: "Metro",
    category: CATEGORY.TRANSPORT,
    cost: 120,
    yearly: 15,
    serves: "transport",
    capacity: 25,
    radius: INF,
    requires: ["railway:1"],
  },
  airport: {
    id: "airport",
    name: "Airport",
    category: CATEGORY.TRANSPORT,
    cost: 150,
    yearly: 25,
    serves: "transport",
    capacity: 10,
    radius: INF,
    requires: ["power", "railway:1"],
  },

  market: {
    id: "market",
    name: "Market",
    category: CATEGORY.ECONOMY,
    cost: 30,
    yearly: 10,
    radius: 3,
    requires: ["popInRadius:5000"],
  },
  restaurant: {
    id: "restaurant",
    name: "Restaurant",
    category: CATEGORY.ECONOMY,
    cost: 15,
    yearly: 8,
    radius: 2,
    requires: ["popInRadius:2500"],
  },
  hotel: {
    id: "hotel",
    name: "Hotel",
    category: CATEGORY.ECONOMY,
    cost: 40,
    yearly: 18,
    radius: 2,
    requires: ["transport:1"],
  },
  mall: {
    id: "mall",
    name: "Mall",
    category: CATEGORY.ECONOMY,
    cost: 45,
    yearly: 22,
    radius: 3,
    requires: ["popInRadius:10000"],
  },
  stadium: {
    id: "stadium",
    name: "Stadium",
    category: CATEGORY.ECONOMY,
    cost: 100,
    yearly: 20,
    radius: 0,
    requires: ["power", "transport:1"],
  },

  industry_small: {
    id: "industry_small",
    name: "Industry - Small",
    category: CATEGORY.INDUSTRY,
    cost: 40,
    yearly: 15,
    requires: ["power", "water", "transport:1"],
    pollutionRadius: 1,
    consumes: { power: 2, water: 2 },
  },
  industry_medium: {
    id: "industry_medium",
    name: "Industry - Medium",
    category: CATEGORY.INDUSTRY,
    cost: 80,
    yearly: 35,
    requires: ["power", "water", "transport:1"],
    pollutionRadius: 2,
    consumes: { power: 4, water: 4 },
  },
  industry_large: {
    id: "industry_large",
    name: "Industry - Large",
    category: CATEGORY.INDUSTRY,
    cost: 140,
    yearly: 60,
    requires: ["power", "water", "transport:1"],
    pollutionRadius: 3,
    consumes: { power: 7, water: 7 },
  },
};

// ctx: { tile: {type, buildable}, cash, hasService(svc), countById(id),
//        transportCount, popInRadius(radius), hasAdjacentDamWithCapacity }
// hasAdjacentDamWithCapacity is precomputed by the caller (it needs the
// candidate tile's own row/col, which canPlace itself is never given --
// same reason popInRadius is a closure rather than a raw number).
export function canPlace(buildingId, ctx) {
  const def = buildings[buildingId];
  if (!def) return { ok: false, reason: "unknown building" };
  if (def.riverOnly) {
    if (ctx.tile.type !== "river") return { ok: false, reason: "dam must be on a river tile" };
  } else if (!ctx.tile.buildable) {
    return { ok: false, reason: "tile not buildable" };
  }
  if (ctx.cash < def.cost) return { ok: false, reason: "insufficient cash" };

  for (const req of def.requires) {
    if (req === "power" && !ctx.hasService("power")) return { ok: false, reason: "requires power" };
    if (req === "water" && !ctx.hasService("water")) return { ok: false, reason: "requires water" };
    if (req === "adjacentDamWithCapacity" && !ctx.hasAdjacentDamWithCapacity) {
      return { ok: false, reason: "requires an adjacent dam with fewer than 2 hydro stations already" };
    }
    if (req.startsWith("transport:")) {
      const n = Number(req.split(":")[1]);
      if (ctx.transportCount < n) return { ok: false, reason: "requires a transport building" };
    } else if (req.startsWith("bus_stand:")) {
      const n = Number(req.split(":")[1]);
      if (ctx.countById("bus_stand") < n) return { ok: false, reason: "requires a bus stand" };
    } else if (req.startsWith("railway:")) {
      const n = Number(req.split(":")[1]);
      if (ctx.countById("railway") < n) return { ok: false, reason: "requires a railway station" };
    } else if (req.startsWith("popInRadius:")) {
      const n = Number(req.split(":")[1]);
      if (ctx.popInRadius(def.radius) < n) return { ok: false, reason: "insufficient population nearby" };
    }
  }
  return { ok: true };
}

// Dam<->hydro relationship helpers, shared by canPlace's context builder
// (evaluatePlacement in useGameStore.js / backend game/state.js) and
// twists.js's flood protection check. Nothing about a hydro's dam is
// ever persisted -- both call sites re-derive "which dam(s)" fresh from
// `placed` and a chebyshev() function every time, same stateless
// philosophy as the rest of this engine (score.js, allocate.js).
export function findAdjacentDams(row, col, placed, chebyshev, radius) {
  const dams = [];
  for (const [key, id] of Object.entries(placed)) {
    if (id !== "dam") continue;
    const [dr, dc] = key.split(",").map(Number);
    if (chebyshev(dr, dc, row, col) <= radius) dams.push({ row: dr, col: dc, key });
  }
  return dams;
}

export function countHydroAdjacentToDam(damRow, damCol, placed, chebyshev, radius) {
  let count = 0;
  for (const [key, id] of Object.entries(placed)) {
    if (id !== "hydro_station") continue;
    const [hr, hc] = key.split(",").map(Number);
    if (chebyshev(damRow, damCol, hr, hc) <= radius) count += 1;
  }
  return count;
}

// True if at least one dam adjacent to (row,col) still has room for
// another hydro station (max hydroMaxPerDam already attached).
export function hasAdjacentDamWithCapacity(row, col, placed, config, chebyshev) {
  const dams = findAdjacentDams(row, col, placed, chebyshev, config.hydroAdjacencyRadius);
  return dams.some(
    (dam) => countHydroAdjacentToDam(dam.row, dam.col, placed, chebyshev, config.hydroAdjacencyRadius) < config.hydroMaxPerDam
  );
}

export default buildings;
