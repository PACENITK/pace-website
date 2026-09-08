import { describe, it, expect } from "vitest";
import { SERVICES, effectiveSettlement, isBuildable } from "./tileTypes.js";
import config from "./config.js";

describe("SERVICES", () => {
  it("has all 9 services, in the fixed pip/tooltip order", () => {
    expect(SERVICES).toEqual([
      "power",
      "water",
      "health",
      "education",
      "environment",
      "safety",
      "sanitation",
      "transport",
      "food",
    ]);
  });
});

describe("effectiveSettlement", () => {
  it("returns a slum's base pop/demand when not upgraded", () => {
    expect(effectiveSettlement("slum", false, config)).toEqual({
      pop: 2000,
      demandUnits: 2,
      isSlum: true,
    });
  });

  it("converts a rehoused slum to the upgraded profile, no longer flagged as a slum", () => {
    expect(effectiveSettlement("slum", true, config)).toEqual({
      pop: config.slumUpgradedPop,
      demandUnits: config.slumUpgradedDemandUnits,
      isSlum: false,
    });
  });

  it("returns a colony's pop/demand regardless of the upgraded flag (colonies can't be rehoused)", () => {
    expect(effectiveSettlement("colony", false, config)).toEqual({
      pop: 1500,
      demandUnits: 2,
      isSlum: false,
    });
    expect(effectiveSettlement("colony", true, config)).toEqual({
      pop: 1500,
      demandUnits: 2,
      isSlum: false,
    });
  });

  it("returns zero pop/demand for non-settlement terrain (empty/river/road)", () => {
    for (const type of ["empty", "river", "road"]) {
      expect(effectiveSettlement(type, false, config)).toEqual({ pop: 0, demandUnits: 0, isSlum: false });
    }
  });

  it("returns zero pop/demand for an unknown tile type rather than throwing", () => {
    expect(effectiveSettlement("nonsense", false, config)).toEqual({ pop: 0, demandUnits: 0, isSlum: false });
  });
});

describe("isBuildable", () => {
  it("is true only for empty ground", () => {
    expect(isBuildable("empty")).toBe(true);
    expect(isBuildable("slum")).toBe(false);
    expect(isBuildable("colony")).toBe(false);
    expect(isBuildable("river")).toBe(false);
    expect(isBuildable("road")).toBe(false);
  });

  it("is false for an unknown tile type", () => {
    expect(isBuildable("nonsense")).toBe(false);
  });
});
