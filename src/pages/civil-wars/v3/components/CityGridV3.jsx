import React, { useMemo, useState } from "react";
import TileV3 from "./TileV3.jsx";
import TileDetailPanel from "./TileDetailPanel.jsx";
import useGameStore from "../store/useGameStore.js";
import useCityStats from "../store/useCityStats.js";
import { buildingsById } from "../engine.js";

function CityGridV3() {
  const map = useGameStore((s) => s.map);
  const placed = useGameStore((s) => s.placed);
  const slumUpgraded = useGameStore((s) => s.slumUpgraded);
  const selectedBuilding = useGameStore((s) => s.selectedBuilding);
  const hoveredTile = useGameStore((s) => s.hoveredTile);
  const hoverTile = useGameStore((s) => s.hoverTile);
  const clearHover = useGameStore((s) => s.clearHover);
  const placeBuilding = useGameStore((s) => s.placeBuilding);
  const upgradeSlum = useGameStore((s) => s.upgradeSlum);
  const previewPlacement = useGameStore((s) => s.previewPlacement);
  const stats = useCityStats();

  // Tile detail panel — opened by clicking a populated tile when not placing
  const [inspectedKey, setInspectedKey] = useState(null);

  // The pre-placement radius ghost -- replaces having to read Part D's
  // "Allocation"/radius rules at all: hover a tile with a building
  // selected and see exactly what it would cover.
  const radiusOverlay = useMemo(() => {
    if (!selectedBuilding || !hoveredTile) return null;
    const def = buildingsById[selectedBuilding];
    if (!def || !Number.isFinite(def.radius) || def.radius <= 0) return null;
    const [row, col] = hoveredTile.split(",").map(Number);
    return { row, col, radius: def.radius };
  }, [selectedBuilding, hoveredTile]);

  const clampedLeft = radiusOverlay ? Math.max(0, radiusOverlay.col - radiusOverlay.radius) : 0;
  const clampedTop = radiusOverlay ? Math.max(0, radiusOverlay.row - radiusOverlay.radius) : 0;
  const clampedRight = radiusOverlay ? Math.min(map.width - 1, radiusOverlay.col + radiusOverlay.radius) : 0;
  const clampedBottom = radiusOverlay ? Math.min(map.height - 1, radiusOverlay.row + radiusOverlay.radius) : 0;

  function handleTileClick(row, col) {
    const key = `${row},${col}`;
    const type = map.tiles[row][col].type;

    // Slum upgrade (no building selected, unupgraded slum)
    if (!selectedBuilding && type === "slum" && !slumUpgraded.has(key)) {
      upgradeSlum(row, col);
      return;
    }

    // Place building if one is selected
    if (selectedBuilding && !placed[key]) {
      placeBuilding(row, col);
      setInspectedKey(null);
      return;
    }

    // Inspect populated tile (no building selected)
    const tileStat = stats.tileStats[key];
    if (!selectedBuilding && tileStat && tileStat.pop > 0) {
      setInspectedKey((prev) => (prev === key ? null : key));
      return;
    }

    // Click elsewhere → close panel
    setInspectedKey(null);
  }

  // Live validation while dragging a building over the grid -- runs the
  // same canPlace() check placeBuilding uses on drop, so the green/red
  // highlight never promises something the drop can't deliver.
  const dropPreview =
    selectedBuilding && hoveredTile ? previewPlacement(...hoveredTile.split(",").map(Number)) : null;

  function handleDragOver(row, col, e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const key = `${row},${col}`;
    if (hoveredTile !== key) hoverTile(key);
  }

  function handleDrop(row, col, e) {
    e.preventDefault();
    if (selectedBuilding) placeBuilding(row, col);
    clearHover();
    setInspectedKey(null);
  }

  const inspectedTileStat = inspectedKey ? stats.tileStats[inspectedKey] : null;
  const inspectedTileData = inspectedKey
    ? map.tiles[Number(inspectedKey.split(",")[0])][Number(inspectedKey.split(",")[1])]
    : null;

  return (
    <>
      <div className="cw3-grid" style={{ "--cols": map.width, "--rows": map.height }}>
        <div className="cw3-grid-overlay" />
        {radiusOverlay && (
          <div
            className="cw3-radius-overlay"
            style={{
              left: `calc(var(--cw3-tile-size) * ${clampedLeft})`,
              top: `calc(var(--cw3-tile-size) * ${clampedTop})`,
              width: `calc(var(--cw3-tile-size) * ${clampedRight - clampedLeft + 1})`,
              height: `calc(var(--cw3-tile-size) * ${clampedBottom - clampedTop + 1})`,
            }}
          />
        )}
        {map.tiles.map((rowTiles, row) =>
          rowTiles.map((tile, col) => {
            const key = `${row},${col}`;
            return (
              <TileV3
                key={key}
                row={row}
                col={col}
                tile={tile}
                buildingId={placed[key] || null}
                previewBuildingId={hoveredTile === key ? selectedBuilding : null}
                tileStat={stats.tileStats[key]}
                upgraded={slumUpgraded.has(key)}
                inspected={inspectedKey === key}
                dropState={hoveredTile === key && dropPreview ? (dropPreview.ok ? "valid" : "invalid") : null}
                onClick={() => handleTileClick(row, col)}
                onMouseEnter={() => hoverTile(key)}
                onMouseLeave={clearHover}
                onDragOver={(e) => handleDragOver(row, col, e)}
                onDrop={(e) => handleDrop(row, col, e)}
              />
            );
          })
        )}
      </div>

      {inspectedKey && inspectedTileStat && inspectedTileData && (
        <TileDetailPanel
          tileKey={inspectedKey}
          tileStat={inspectedTileStat}
          tile={inspectedTileData}
          onClose={() => setInspectedKey(null)}
        />
      )}
    </>
  );
}

export default CityGridV3;
