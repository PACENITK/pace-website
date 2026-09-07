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

  power_plant: {
    id: "power_plant",
    name: "Power plant",
    category: CATEGORY.ESSENTIAL,
    cost: 100,
    yearly: -4,
    serves: "power",
    capacity: 15,
    radius: 5,
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
  dam: {
    id: "dam",
    name: "Dam",
    category: CATEGORY.PROTECTION,
    cost: 100,
    yearly: -3,
    radius: 4,
    requires: ["power"],
    riverOnly: true,
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
    cost: 60,
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
//        transportCount, popInRadius(radius) }
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

export default buildings;
