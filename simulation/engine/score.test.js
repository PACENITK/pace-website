import { describe, it, expect } from "vitest";
import { computeCityStats } from "./score.js";
import config from "./config.js";

function makeMap(width, height) {
  const tiles = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type: "empty", lowLying: false }))
  );
  return { width, height, tiles };
}

function setTile(map, row, col, type) {
  map.tiles[row][col] = { type, lowLying: false };
}

describe("computeCityStats", () => {
  it("returns an all-zero, fully-covered result for an empty board with no settlements", () => {
    const map = makeMap(3, 3);
    const stats = computeCityStats(map, {}, new Set(), config, 1);
    expect(stats.totalPop).toBe(0);
    expect(stats.fullyServedPop).toBe(0);
    expect(stats.breakdown.servicePoints).toBe(0);
    expect(stats.breakdown.unservedPenalty).toBe(0);
    expect(stats.breakdown.allServedBonus).toBe(0);
    // No demand anywhere -> every service defaults to 100% ("nothing to
    // serve" reads as fully covered), which vacuously earns the full
    // coverage bonus for all 9 services even though nothing was built.
    for (const service of Object.keys(stats.coverage)) {
      expect(stats.coverage[service]).toEqual({ served: 0, total: 0, pct: 1 });
    }
    expect(stats.breakdown.coverageBonus).toBe(9 * config.serviceCoverageBonus);
    expect(stats.breakdown.staticTotal).toBe(9 * config.serviceCoverageBonus);
  });

  it("scores a single residential tile served by exactly one of its nine services", () => {
    const map = makeMap(3, 1);
    const placed = { "0,0": "residential_small", "0,1": "power_plant" };
    const stats = computeCityStats(map, placed, new Set(), config, 1);

    const home = stats.tileStats["0,0"];
    expect(home.pop).toBe(1000);
    expect(home.demand.power).toBe(1);
    expect(home.served.power).toBe(1);
    expect(home.served.water).toBe(0);

    // Only power is served: 1 unit * 10 pts. The other 8 services are
    // unmet (1 unit each) at the non-slum penalty rate.
    expect(stats.breakdown.servicePoints).toBe(1 * config.pointsPerServiceUnit);
    expect(stats.breakdown.unservedPenalty).toBe(8 * config.unservedPenaltyPerUnit);
    // Power is the only service at >=90% coverage citywide -> one bonus.
    expect(stats.breakdown.coverageBonus).toBe(config.serviceCoverageBonus);
    expect(stats.breakdown.allServedBonus).toBe(0);
    expect(stats.breakdown.staticTotal).toBe(
      config.pointsPerServiceUnit - 8 * config.unservedPenaltyPerUnit + config.serviceCoverageBonus
    );
  });

  it("applies the slum-no-sanitation penalty only while unserved and un-rehoused", () => {
    const map = makeMap(1, 1);
    setTile(map, 0, 0, "slum");

    const unserved = computeCityStats(map, {}, new Set(), config, 1);
    expect(unserved.tileStats["0,0"].isSlum).toBe(true);
    expect(unserved.breakdown.slumSanitationPenalty).toBe(config.slumNoSanitationPenalty);
    // All 9 services unmet at the (higher) slum penalty rate.
    expect(unserved.breakdown.unservedPenalty).toBe(9 * 2 * config.slumUnservedPenaltyPerUnit);

    const rehoused = computeCityStats(map, {}, new Set(["0,0"]), config, 1);
    expect(rehoused.tileStats["0,0"].isSlum).toBe(false);
    expect(rehoused.tileStats["0,0"].pop).toBe(config.slumUpgradedPop);
    expect(rehoused.breakdown.slumSanitationPenalty).toBe(0);
    expect(rehoused.breakdown.slumRehousedBonus).toBe(config.slumRehousedBonus);
  });

  it("flags industry pollution on nearby homes, and waives it when a park is within 1 tile of the home", () => {
    const map = makeMap(2, 2);
    const placedNoPark = { "0,0": "residential_small", "0,1": "industry_small" };
    const polluted = computeCityStats(map, placedNoPark, new Set(), config, 1);
    expect(polluted.tileStats["0,0"].pollution).toBe(true);
    expect(polluted.breakdown.pollutionPenalty).toBe(config.pollutionPenaltyNoPark);

    const placedWithPark = { ...placedNoPark, "1,0": "park" };
    const waived = computeCityStats(map, placedWithPark, new Set(), config, 1);
    expect(waived.tileStats["0,0"].pollution).toBe(false);
    expect(waived.breakdown.pollutionPenalty).toBe(0);
  });

  it("flags sewage-adjacency nuisance at exactly distance 1, not at distance 2", () => {
    const adjacentMap = makeMap(3, 1);
    const adjacent = computeCityStats(
      adjacentMap,
      { "0,0": "residential_small", "0,1": "sewage_plant" },
      new Set(),
      config,
      1
    );
    expect(adjacent.tileStats["0,0"].sewageNuisance).toBe(true);
    expect(adjacent.breakdown.sewagePenalty).toBe(config.sewageAdjacencyPenalty);

    const farMap = makeMap(3, 1);
    const far = computeCityStats(
      farMap,
      { "0,0": "residential_small", "0,2": "sewage_plant" },
      new Set(),
      config,
      1
    );
    expect(far.tileStats["0,0"].sewageNuisance).toBe(false);
    expect(far.breakdown.sewagePenalty).toBe(0);
  });

  it("gives citizens strict priority over industry for shared power/water capacity", () => {
    const map = makeMap(3, 1);
    const placed = {
      "0,0": "water_tank", // capacity 3, radius 2
      "0,1": "residential_large", // demandUnits 5 -> needs 5 water
      "0,2": "industry_small", // consumes 2 water
    };
    const stats = computeCityStats(map, placed, new Set(), config, 1);

    expect(stats.tileStats["0,1"].demand.water).toBe(5);
    // Capacity (3) is less than citizen demand (5): citizens take all of
    // it, industry gets none of the shared pool.
    expect(stats.tileStats["0,1"].served.water).toBe(3);
    expect(stats.contention.water).toEqual({
      citizenDemand: 5,
      citizenServed: 3,
      citizenShortfall: 2,
      industryDemand: 2,
      industryServed: 0,
      totalCapacity: 3,
      industryShareOfCapacity: 0,
    });
  });

  it("fully scores a home served on all 9 services: all-served bonus + full coverage bonus", () => {
    const map = makeMap(11, 11);
    const placed = {
      "5,5": "residential_small",
      "4,5": "park", // radius 1 -- the tight one, kept adjacent
      "5,3": "water_tank", // radius 2
      "5,7": "hospital", // radius 3
      "3,5": "school", // radius 3
      "7,5": "safety_station", // radius 3
      "3,3": "sewage_plant", // radius 3, distance 2 (avoids the adjacency-nuisance rule)
      "3,7": "bus_stand", // radius 3
      "7,7": "power_plant", // radius 5
      "0,0": "farm", // radius Infinity -- distance doesn't matter
    };
    const stats = computeCityStats(map, placed, new Set(), config, 1);

    const home = stats.tileStats["5,5"];
    expect(home.pop).toBe(1000);
    for (const service of Object.keys(home.served)) {
      expect(home.served[service]).toBeGreaterThanOrEqual(home.demand[service]);
    }
    expect(home.sewageNuisance).toBe(false);
    expect(home.pollution).toBe(false);

    expect(stats.totalPop).toBe(1000);
    expect(stats.fullyServedPop).toBe(1000);
    expect(stats.breakdown.servicePoints).toBe(9 * config.pointsPerServiceUnit);
    expect(stats.breakdown.unservedPenalty).toBe(0);
    expect(stats.breakdown.allServedBonus).toBe(config.allServedBonus);
    expect(stats.breakdown.coverageBonus).toBe(9 * config.serviceCoverageBonus);
    expect(stats.breakdown.staticTotal).toBe(
      9 * config.pointsPerServiceUnit + config.allServedBonus + 9 * config.serviceCoverageBonus
    );
  });

  it("scales a player-built residential tile's demand by residentialDemandMultiplier (immigration), leaving inherited settlements untouched", () => {
    const map = makeMap(2, 1);
    setTile(map, 0, 1, "slum");
    const placed = { "0,0": "residential_small" };

    const base = computeCityStats(map, placed, new Set(), config, 1);
    const overflow = computeCityStats(map, placed, new Set(), config, 1.4);

    expect(overflow.tileStats["0,0"].pop).toBeCloseTo(1000 * 1.4);
    expect(overflow.tileStats["0,0"].demand.power).toBeCloseTo(1 * 1.4);
    // The inherited slum is not a "residential" building placement, so
    // the multiplier must not touch it.
    expect(overflow.tileStats["0,1"].pop).toBe(base.tileStats["0,1"].pop);
    expect(overflow.tileStats["0,1"].demand.power).toBe(base.tileStats["0,1"].demand.power);
  });
});
