import { describe, it, expect } from "vitest";
import { allocate, chebyshev } from "./allocate.js";

function zeros(width, height) {
  return Array.from({ length: height }, () => Array(width).fill(0));
}

describe("chebyshev", () => {
  it("is the max of the row/col deltas (grid/diagonal distance)", () => {
    expect(chebyshev(0, 0, 0, 0)).toBe(0);
    expect(chebyshev(0, 0, 3, 0)).toBe(3);
    expect(chebyshev(0, 0, 0, 4)).toBe(4);
    expect(chebyshev(0, 0, 3, 4)).toBe(4);
    expect(chebyshev(5, 5, 2, 1)).toBe(4);
  });
});

describe("allocate", () => {
  it("serves nothing when there are no servers", () => {
    const demand = zeros(3, 3);
    demand[1][1] = 5;
    const { served, remaining, buildingUsed } = allocate(demand, [], 3, 3);
    expect(served).toEqual(zeros(3, 3));
    expect(remaining).toEqual(demand);
    expect(buildingUsed).toEqual({});
  });

  it("fully serves demand within radius when capacity is sufficient", () => {
    const demand = zeros(5, 5);
    demand[2][2] = 3;
    const servers = [{ key: "s", row: 2, col: 3, capacity: 10, radius: 2 }];
    const { served, remaining, buildingUsed } = allocate(demand, servers, 5, 5);
    expect(served[2][2]).toBe(3);
    expect(remaining[2][2]).toBe(0);
    expect(buildingUsed.s).toBe(3);
  });

  it("does not serve demand outside the server's radius", () => {
    const demand = zeros(5, 5);
    demand[0][0] = 4;
    const servers = [{ key: "s", row: 4, col: 4, capacity: 100, radius: 1 }];
    const { served } = allocate(demand, servers, 5, 5);
    expect(served[0][0]).toBe(0);
  });

  it("serves nearest tiles first when capacity is scarce (distance-ring order)", () => {
    // A server at (2,2) with capacity 1 and two tiles at distance 1 and 2.
    const demand = zeros(5, 5);
    demand[3][2] = 1; // distance 1
    demand[0][2] = 1; // distance 2
    const servers = [{ key: "s", row: 2, col: 2, capacity: 1, radius: 2 }];
    const { served } = allocate(demand, servers, 5, 5);
    expect(served[3][2]).toBe(1); // nearer tile served first
    expect(served[0][2]).toBe(0); // capacity exhausted before reaching the farther tile
  });

  it("breaks same-distance ties by tile index, deterministically", () => {
    // Two tiles equidistant (distance 1) from the server, capacity for only one.
    const demand = zeros(3, 3);
    demand[0][1] = 1; // tileIndex 1
    demand[1][0] = 1; // tileIndex 3
    const servers = [{ key: "s", row: 1, col: 1, capacity: 1, radius: 1 }];
    const { served } = allocate(demand, servers, 3, 3);
    // Lower tileIndex (row-major r*width+c) wins the tie.
    expect(served[0][1]).toBe(1);
    expect(served[1][0]).toBe(0);
  });

  it("splits capacity across multiple partially-overlapping servers without double-serving a tile", () => {
    const demand = zeros(5, 1);
    demand[0][2] = 4;
    const servers = [
      { key: "a", row: 0, col: 0, capacity: 2, radius: 3 },
      { key: "b", row: 0, col: 4, capacity: 2, radius: 3 },
    ];
    const { served, buildingUsed } = allocate(demand, servers, 5, 1);
    expect(served[0][2]).toBe(4);
    expect(buildingUsed.a + buildingUsed.b).toBe(4);
  });

  it("treats an Infinity-radius server as city-wide and gives it first claim over radius-limited servers", () => {
    const demand = zeros(3, 1);
    demand[0][0] = 2;
    const servers = [
      { key: "cityWide", row: 0, col: 2, capacity: 1, radius: Infinity },
      { key: "local", row: 0, col: 0, capacity: 5, radius: 1 },
    ];
    const { served, buildingUsed } = allocate(demand, servers, 3, 1);
    expect(served[0][0]).toBe(2);
    // City-wide server claims its full capacity (1) first; the local
    // radius server only picks up what's left (1).
    expect(buildingUsed.cityWide).toBe(1);
    expect(buildingUsed.local).toBe(1);
  });

  it("never over-serves a tile beyond its own demand even with excess capacity", () => {
    const demand = zeros(3, 3);
    demand[1][1] = 2;
    const servers = [{ key: "s", row: 1, col: 1, capacity: 999, radius: 1 }];
    const { served, remaining } = allocate(demand, servers, 3, 3);
    expect(served[1][1]).toBe(2);
    expect(remaining[1][1]).toBe(0);
  });
});
