// Single import point for the Urban Mayhem rules engine on the server
// side -- mirrors src/pages/civil-wars/v3/engine.js's own comment:
// nothing here is a second implementation of a rule. It's the exact
// same simulation/engine/*.js the frontend and the balance simulator
// use, so the browser preview and the authoritative server can never
// disagree.
//
// simulation/ is ESM ("type": "module" at the repo root); this backend
// is CommonJS (no "type" field, plain require()/module.exports
// throughout). A CJS file cannot require() an ESM file directly --
// Node throws ERR_REQUIRE_ESM -- so this loads it via dynamic import()
// once and caches the resolved module set. Every route handler that
// needs the engine does `const engine = await loadEngine();` before
// using it.
let enginePromise = null;

function loadEngine() {
  if (!enginePromise) {
    enginePromise = Promise.all([
      import('../../simulation/engine/buildings.js'),
      import('../../simulation/engine/tileTypes.js'),
      import('../../simulation/engine/config.js'),
      import('../../simulation/engine/score.js'),
      import('../../simulation/engine/allocate.js'),
      import('../../simulation/engine/twists.js'),
      import('../../simulation/data/map.js'),
    ]).then(([buildingsMod, tileTypesMod, configMod, scoreMod, allocateMod, twistsMod, mapMod]) => ({
      buildingsById: buildingsMod.default,
      canPlace: buildingsMod.canPlace,
      CATEGORY: buildingsMod.CATEGORY,
      hasAdjacentDamWithCapacity: buildingsMod.hasAdjacentDamWithCapacity,
      SERVICES: tileTypesMod.SERVICES,
      isBuildable: tileTypesMod.isBuildable,
      config: configMod.default,
      computeCityStats: scoreMod.computeCityStats,
      computeScore: scoreMod.computeScore,
      computeScoreParts: scoreMod.computeScoreParts,
      chebyshev: allocateMod.chebyshev,
      twists: twistsMod,
      map: mapMod.default,
    }));
  }
  return enginePromise;
}

module.exports = { loadEngine };
