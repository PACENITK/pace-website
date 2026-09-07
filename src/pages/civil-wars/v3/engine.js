// Single import point for the v3 rules engine. Everything here is the
// same pure, UI-agnostic module used by the balance simulator
// (simulation/run.js) -- no building cost, capacity, or scoring formula
// is ever redeclared in src/. The eventual backend (Phase 2) imports
// these exact files server-side too, so validation never drifts
// between what the frontend previews and what gets authoritatively
// scored.
export { default as buildingsById, canPlace, CATEGORY } from "../../../../simulation/engine/buildings.js";
export { default as tileTypes, SERVICES, effectiveSettlement, isBuildable } from "../../../../simulation/engine/tileTypes.js";
export { default as config } from "../../../../simulation/engine/config.js";
export { computeCityStats } from "../../../../simulation/engine/score.js";
export { chebyshev, allocate } from "../../../../simulation/engine/allocate.js";
export * as twists from "../../../../simulation/engine/twists.js";
export { default as map } from "../../../../simulation/data/map.js";
