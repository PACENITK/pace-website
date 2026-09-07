// Real illustrated art (top-down, painterly/ink-outline, olive-green
// ground, muted earth palette) added earlier under public/civil-wars/.
// Only the entries below actually exist as files -- everything else in
// tileTypes.js/buildings.js still renders via the lucide-react icon
// fallback in TileV3.jsx until matching art is generated and dropped in
// public/civil-wars/{tiles,buildings}/ + added here.
export const TILE_ART = {
  empty: "/civil-wars/tiles/tile_empty.png",
  slum: "/civil-wars/tiles/tile_slum.png",
  colony: "/civil-wars/tiles/tile_colony.png",
  // river, road: no art yet -- see MISSING list below.
};

// Applied over TILE_ART when tile.lowLying is true (marshy/flood-prone
// ground), regardless of base type -- lowLying is a flag in v3, not its
// own tile type, unlike the v1 prototype this art was drawn for.
export const LOWLYING_ART = "/civil-wars/tiles/tile_lowland.png";

export const BUILDING_ART = {
  hospital: "/civil-wars/buildings/bld_hospital.png",
  school: "/civil-wars/buildings/bld_school.png",
  park: "/civil-wars/buildings/bld_park.png",
  sewage_plant: "/civil-wars/buildings/bld_sewage.png",
  storm_drainage: "/civil-wars/buildings/bld_drainage.png",
  // bld_water.png is a multi-clarifier treatment facility, not a single
  // tank -- matched to water_treatment; water_tank stays on the icon
  // fallback until a distinct tank image exists.
  water_treatment: "/civil-wars/buildings/bld_water.png",
};

// Generated but not wired to any current v3 tile/building id:
// tile_factory.png (v1 had a "factory" tile type; v3 has no such tile --
// industry is a building placed on an empty tile).
