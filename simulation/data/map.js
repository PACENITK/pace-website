// Hand-authored 16x12 grid (Part B): a river band with a low-lying
// buffer on each side, a short existing-road segment, 4 slum tiles (2
// of them on the low-lying band, per "two of the four slums sit on
// low-lying land"), and 2 colony tiles. Everything else is empty/
// buildable -- 192 - 16 (river) - 6 (road) - 4 (slum) - 2 (colony) =
// 164 buildable tiles, matching "roughly 160."
//
// buildMap() is parametric so sweep.js can generate proportionally
// similar maps at other grid sizes (Part L's 12x9/15x10 alternatives)
// and with more inherited settlements, without duplicating this logic.
export function buildMap({ width, height, slumTiles, lowlandSlumKeys, colonyTiles, roadTiles, riverRow }) {
  const tiles = [];
  for (let r = 0; r < height; r++) {
    const row = [];
    for (let c = 0; c < width; c++) row.push({ type: "empty", lowLying: false });
    tiles.push(row);
  }

  for (let c = 0; c < width; c++) tiles[riverRow][c] = { type: "river", lowLying: false };

  for (let c = 0; c < width; c++) {
    if (riverRow - 1 >= 0 && tiles[riverRow - 1][c].type === "empty") tiles[riverRow - 1][c].lowLying = true;
    if (riverRow + 1 < height && tiles[riverRow + 1][c].type === "empty") tiles[riverRow + 1][c].lowLying = true;
  }

  roadTiles.forEach(({ row, col }) => {
    tiles[row][col] = { type: "road", lowLying: false };
  });
  slumTiles.forEach(({ row, col }) => {
    tiles[row][col] = { type: "slum", lowLying: lowlandSlumKeys.has(`${row},${col}`) };
  });
  colonyTiles.forEach(({ row, col }) => {
    tiles[row][col] = { type: "colony", lowLying: false };
  });

  const riverPath = [];
  for (let c = 0; c < width; c++) riverPath.push({ row: riverRow, col: c });

  return { width, height, tiles, riverPath };
}

const map = buildMap({
  width: 16,
  height: 12,
  riverRow: 6,
  slumTiles: [
    { row: 5, col: 2 },
    { row: 5, col: 11 },
    { row: 2, col: 4 },
    { row: 9, col: 12 },
  ],
  lowlandSlumKeys: new Set(["5,2", "5,11"]),
  colonyTiles: [
    { row: 1, col: 8 },
    { row: 10, col: 3 },
  ],
  roadTiles: [
    { row: 11, col: 0 },
    { row: 11, col: 1 },
    { row: 11, col: 2 },
    { row: 11, col: 3 },
    { row: 11, col: 4 },
    { row: 11, col: 5 },
  ],
});

export default map;
