import { describe, it, expect } from "vitest";
import { applyFlood, applyPandemic, applyImmigration, evaluateOlympics, revealTreasure } from "./twists.js";
import config from "./config.js";

function riverMap({ width, height, riverRow }) {
  const tiles = Array.from({ length: height }, (_, r) =>
    Array.from({ length: width }, () => ({ type: r === riverRow ? "river" : "empty", lowLying: r !== riverRow }))
  );
  const riverPath = Array.from({ length: width }, (_, c) => ({ row: riverRow, col: c }));
  return { width, height, tiles, riverPath };
}

describe("applyFlood", () => {
  it("protects a building downstream of a dam, destroys the equivalent building upstream", () => {
    // Dam at col 2. A tile's "nearest river point" ties are broken by
    // whichever point is scanned first (upstream-to-downstream order),
    // so col 3 unambiguously resolves nearest-to-col-2 (index 2, at/after
    // the dam) while col 0 unambiguously resolves nearest-to-col-0
    // (index 0, before the dam).
    const map = riverMap({ width: 5, height: 3, riverRow: 1 });
    const state = {
      placed: { "1,2": "dam", "0,3": "downstream_hut", "0,0": "upstream_hut" },
      slumUpgraded: new Set(),
    };
    const result = applyFlood(state, map, config);

    expect(result.destroyed).toEqual(["0,0"]);
    expect(state.placed).toEqual({ "1,2": "dam", "0,3": "downstream_hut" });
  });

  it("protects any low-lying building within a storm drain's radius, independent of river flow order", () => {
    const map = { width: 5, height: 1, tiles: [Array.from({ length: 5 }, () => ({ type: "empty", lowLying: true }))], riverPath: [] };
    const state = {
      placed: { "0,0": "storm_drainage", "0,1": "hut_near", "0,4": "hut_far" },
      slumUpgraded: new Set(),
    };
    const result = applyFlood(state, map, config);

    expect(result.destroyed).toEqual(["0,4"]);
    expect(state.placed).toEqual({ "0,0": "storm_drainage", "0,1": "hut_near" });
  });

  it("never destroys a building on non-low-lying ground, protection or not", () => {
    const map = { width: 1, height: 1, tiles: [[{ type: "empty", lowLying: false }]], riverPath: [] };
    const state = { placed: { "0,0": "hut" }, slumUpgraded: new Set() };
    const result = applyFlood(state, map, config);

    expect(result.destroyed).toEqual([]);
    expect(state.placed).toEqual({ "0,0": "hut" });
  });
});

describe("applyPandemic", () => {
  // weightedPop = nonSlumPop + 2*slumPop = 1500 + 2*2000 = 5500
  // required = ceil(5500 / pandemicPopPerHospital[2500]) = 3
  function makeState(hospitalCount) {
    const placed = {};
    for (let i = 0; i < hospitalCount; i++) placed[`0,${2 + i}`] = "hospital";
    return {
      map: { width: 5, height: 1, tiles: [[{ type: "slum", lowLying: false }, { type: "colony", lowLying: false }, ...Array(3).fill({ type: "empty", lowLying: false })]] },
      state: { placed, slumUpgraded: new Set() },
    };
  }

  it("rewards a met requirement with a cash bonus and no penalty", () => {
    const { map, state } = makeState(3);
    const result = applyPandemic(state, map, config);
    expect(result).toEqual({
      required: 3,
      hospitalsBuilt: 3,
      shortfall: 0,
      incomeMultiplier: 1,
      scorePenalty: 0,
      cashBonus: config.pandemicMetBonusCash,
      met: true,
    });
  });

  it("halves income (no score penalty) when short by exactly 1 hospital", () => {
    const { map, state } = makeState(2);
    const result = applyPandemic(state, map, config);
    expect(result.shortfall).toBe(1);
    expect(result.incomeMultiplier).toBe(config.pandemicShort1IncomeMultiplier);
    expect(result.scorePenalty).toBe(0);
    expect(result.cashBonus).toBe(0);
    expect(result.met).toBe(false);
  });

  it("zeroes income and applies the score penalty when short by 2 or more", () => {
    const { map, state } = makeState(0);
    const result = applyPandemic(state, map, config);
    expect(result.shortfall).toBe(3);
    expect(result.incomeMultiplier).toBe(config.pandemicShort2PlusIncomeMultiplier);
    expect(result.scorePenalty).toBe(config.pandemicShort2PlusScorePenalty);
  });
});

describe("applyImmigration", () => {
  it("does nothing when no residential buildings exist yet", () => {
    const state = { placed: {} };
    const result = applyImmigration(state, config);
    expect(result).toEqual({ overflowFactor: 0 });
    expect(state.immigrationOverflow).toBeUndefined();
  });

  it("computes overflow as immigrationPeople / total residential population", () => {
    const state = { placed: { "0,0": "residential_small" } }; // pop 1000
    const result = applyImmigration(state, config);
    expect(result.overflowFactor).toBe(config.immigrationPeople / 1000);
    expect(state.immigrationOverflow).toBe(result.overflowFactor);
  });

  it("accumulates overflow across repeated calls instead of overwriting it", () => {
    const state = { placed: { "0,0": "residential_small" } };
    const first = applyImmigration(state, config);
    const second = applyImmigration(state, config);
    expect(state.immigrationOverflow).toBeCloseTo(first.overflowFactor + second.overflowFactor);
  });
});

describe("evaluateOlympics", () => {
  it("fails the bid (score penalty, no cash) when requirements aren't met", () => {
    const state = { placed: { "0,0": "stadium" } };
    const result = evaluateOlympics(state, config);
    expect(result.qualified).toBe(false);
    expect(result.cashBonus).toBe(0);
    expect(result.scoreDelta).toBe(config.olympicsFailScore);
  });

  it("qualifies the bid once stadium/hotel/restaurant counts all meet their thresholds", () => {
    const req = config.olympicsRequirements;
    const placed = {};
    let i = 0;
    for (let s = 0; s < req.stadium; s++) placed[`stadium-${i++}`] = "stadium";
    for (let h = 0; h < req.hotel; h++) placed[`hotel-${i++}`] = "hotel";
    for (let r = 0; r < req.restaurant; r++) placed[`restaurant-${i++}`] = "restaurant";

    const result = evaluateOlympics({ placed }, config);
    expect(result.qualified).toBe(true);
    expect(result.cashBonus).toBe(config.olympicsQualifiedCash);
    expect(result.scoreDelta).toBe(config.olympicsQualifiedScore);
  });
});

describe("revealTreasure", () => {
  it("pays out with nothing demolished when the treasure tile is empty", () => {
    const state = { placed: { "1,1": "park" } };
    const result = revealTreasure(state, "9,9", config);
    expect(result).toEqual({ cashGain: config.treasureValue, demolished: null });
    expect(state.placed).toEqual({ "1,1": "park" });
  });

  it("demolishes whatever was built on the treasure tile, but still pays out the same amount", () => {
    const state = { placed: { "1,1": "park" } };
    const result = revealTreasure(state, "1,1", config);
    expect(result.cashGain).toBe(config.treasureValue);
    expect(result.demolished).toEqual({ tile: "1,1", buildingId: "park" });
    expect(state.placed).toEqual({});
  });
});
