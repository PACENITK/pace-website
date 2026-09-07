// Shared shapes, documented for reference -- plain JS, no runtime code.
// Both the simulator and (eventually) the game page should treat these
// as the contract for engine/*.js functions.

/**
 * @typedef {Object} Tile
 * @property {"slum"|"colony"|"empty"|"river"|"road"} type
 * @property {boolean} lowLying
 */

/**
 * @typedef {Object} CityMap
 * @property {number} width
 * @property {number} height
 * @property {Tile[][]} tiles
 * @property {{row:number,col:number}[]} riverPath  upstream -> downstream order
 */

/**
 * @typedef {Object} StrategyVector
 * @property {number} serviceShare
 * @property {number} housingShare
 * @property {number} commercialShare
 * @property {number} cashReserve
 * @property {"small"|"medium"|"large"|"mixed"} housingSizeBias
 * @property {"none"|"small"|"medium"|"large"} industryAppetite
 * @property {"never"|"early"|"after-flood"} damPolicy
 * @property {"none"|"partial"|"full"} drainagePolicy
 * @property {"ignore"|"opportunistic"|"committed"} olympicsIntent
 * @property {number} slumUpgrades  0-4
 * @property {string[]} serviceOrder  permutation of SERVICES
 * @property {"year0"|"spread"|"late"} expansionTiming
 */

/**
 * @typedef {Object} CityState
 * @property {number} cash
 * @property {Object<string,string>} placed  "row,col" -> buildingId
 * @property {Set<string>} slumUpgraded  "row,col" keys of rehoused slums
 * @property {number} [residentialDemandMultiplier]  >1 once immigration hits
 */

/**
 * @typedef {Object} RunResult
 * @property {string} label
 * @property {import("./types.js").StrategyVector} strategy
 * @property {string[]} twistOrder  years 1-3, in order
 * @property {string} treasureTile
 * @property {number} finalScore
 * @property {number} finalCash
 * @property {number} buildingsPlaced
 * @property {number} tilesUsed
 */

export {};
