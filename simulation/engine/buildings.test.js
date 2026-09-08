import { describe, it, expect } from "vitest";
import buildings, { canPlace } from "./buildings.js";

// Base context with everything permissive; individual tests override
// just the field they're exercising so each assertion is obviously
// about one rule.
function baseCtx(overrides = {}) {
  return {
    tile: { type: "empty", buildable: true },
    cash: 1000,
    hasService: () => true,
    countById: () => 99,
    transportCount: 99,
    popInRadius: () => 1e9,
    ...overrides,
  };
}

describe("canPlace", () => {
  it("rejects an unknown building id", () => {
    expect(canPlace("not_a_building", baseCtx())).toEqual({ ok: false, reason: "unknown building" });
  });

  it("allows a plain building with no prerequisites on buildable land with enough cash", () => {
    expect(canPlace("park", baseCtx())).toEqual({ ok: true });
  });

  it("rejects placement on non-buildable terrain", () => {
    const result = canPlace("park", baseCtx({ tile: { type: "river", buildable: false } }));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/not buildable/);
  });

  it("rejects insufficient cash regardless of terrain/prerequisites", () => {
    const result = canPlace("power_plant", baseCtx({ cash: buildings.power_plant.cost - 1 }));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/cash/);
  });

  it("accepts cash exactly equal to cost", () => {
    expect(canPlace("power_plant", baseCtx({ cash: buildings.power_plant.cost }))).toEqual({ ok: true });
  });

  describe("dam (riverOnly)", () => {
    it("requires a river tile even though it would otherwise not be 'buildable'", () => {
      const result = canPlace("dam", baseCtx({ tile: { type: "river", buildable: false } }));
      expect(result.ok).toBe(true);
    });

    it("rejects a dam on any non-river tile, including normally-buildable empty ground", () => {
      const result = canPlace("dam", baseCtx({ tile: { type: "empty", buildable: true } }));
      expect(result).toEqual({ ok: false, reason: "dam must be on a river tile" });
    });
  });

  describe("service prerequisites", () => {
    it("rejects a building that requires power when no power service exists", () => {
      const result = canPlace("water_tank", baseCtx({ hasService: (svc) => svc !== "power" }));
      expect(result).toEqual({ ok: false, reason: "requires power" });
    });

    it("rejects a building that requires water when no water service exists", () => {
      const result = canPlace("hospital", baseCtx({ hasService: (svc) => svc !== "water" }));
      expect(result).toEqual({ ok: false, reason: "requires water" });
    });

    it("checks every requirement, not just the first (hospital needs both power and water)", () => {
      const missingPower = canPlace("hospital", baseCtx({ hasService: (svc) => svc !== "power" }));
      const missingWater = canPlace("hospital", baseCtx({ hasService: (svc) => svc !== "water" }));
      const missingBoth = canPlace("hospital", baseCtx({ hasService: () => false }));
      expect(missingPower.ok).toBe(false);
      expect(missingWater.ok).toBe(false);
      expect(missingBoth.ok).toBe(false);
    });
  });

  describe("counted prerequisites", () => {
    it("rejects a railway station without a bus stand built first", () => {
      const result = canPlace("railway", baseCtx({ countById: (id) => (id === "bus_stand" ? 0 : 99) }));
      expect(result).toEqual({ ok: false, reason: "requires a bus stand" });
    });

    it("accepts a railway station once a bus stand exists", () => {
      const result = canPlace("railway", baseCtx({ countById: (id) => (id === "bus_stand" ? 1 : 99) }));
      expect(result.ok).toBe(true);
    });

    it("rejects a metro without an existing railway station", () => {
      const result = canPlace("metro", baseCtx({ countById: (id) => (id === "railway" ? 0 : 99) }));
      expect(result).toEqual({ ok: false, reason: "requires a railway station" });
    });

    it("rejects a hotel with no transport building yet", () => {
      const result = canPlace("hotel", baseCtx({ transportCount: 0 }));
      expect(result).toEqual({ ok: false, reason: "requires a transport building" });
    });

    it("accepts a hotel once at least one transport building exists", () => {
      const result = canPlace("hotel", baseCtx({ transportCount: 1 }));
      expect(result.ok).toBe(true);
    });
  });

  describe("population-in-radius prerequisites", () => {
    it("rejects a market without enough population within its own radius", () => {
      const result = canPlace("market", baseCtx({ popInRadius: () => 4999 }));
      expect(result).toEqual({ ok: false, reason: "insufficient population nearby" });
    });

    it("accepts a market with exactly the required population nearby", () => {
      const result = canPlace("market", baseCtx({ popInRadius: () => 5000 }));
      expect(result.ok).toBe(true);
    });

    it("checks popInRadius against the building's own radius, not an arbitrary one", () => {
      let queriedRadius = null;
      canPlace(
        "mall",
        baseCtx({
          popInRadius: (radius) => {
            queriedRadius = radius;
            return 10000;
          },
        })
      );
      expect(queriedRadius).toBe(buildings.mall.radius);
    });
  });

  describe("industry", () => {
    it("requires power, water, and a transport building all at once", () => {
      const okAll = canPlace("industry_small", baseCtx());
      expect(okAll.ok).toBe(true);

      const noTransport = canPlace("industry_small", baseCtx({ transportCount: 0 }));
      expect(noTransport.ok).toBe(false);

      const noPower = canPlace("industry_small", baseCtx({ hasService: (svc) => svc !== "power" }));
      expect(noPower.ok).toBe(false);
    });
  });
});
