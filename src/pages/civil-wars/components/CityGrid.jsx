import React from "react";
import PropTypes from "prop-types";
import Tile from "./Tile";

function CityGrid({
  map,
  placed,
  selectedBuilding,
  onTileClick,
  hoveredTile,
  onHoverTile,
  onLeaveTile,
  inspectedTile,
  radiusOverlay,
}) {
  const clampedLeft = radiusOverlay ? Math.max(0, radiusOverlay.col - radiusOverlay.radius) : 0;
  const clampedTop = radiusOverlay ? Math.max(0, radiusOverlay.row - radiusOverlay.radius) : 0;
  const clampedRight = radiusOverlay
    ? Math.min(map.width - 1, radiusOverlay.col + radiusOverlay.radius)
    : 0;
  const clampedBottom = radiusOverlay
    ? Math.min(map.height - 1, radiusOverlay.row + radiusOverlay.radius)
    : 0;

  return (
    <div
      className="cw-grid"
      style={{
        "--cols": map.width,
        "--rows": map.height,
      }}
    >
      <div className="cw-grid-overlay" />

      {radiusOverlay && (
        <div
          className="cw-radius-overlay"
          style={{
            left: `calc(var(--cw-tile-size) * ${clampedLeft})`,
            top: `calc(var(--cw-tile-size) * ${clampedTop})`,
            width: `calc(var(--cw-tile-size) * ${clampedRight - clampedLeft + 1})`,
            height: `calc(var(--cw-tile-size) * ${clampedBottom - clampedTop + 1})`,
          }}
        >
          <span className="cw-radius-overlay-label">
            {radiusOverlay.used} / {radiusOverlay.total}
          </span>
        </div>
      )}

      {map.tiles.map((rowTiles, row) =>
        rowTiles.map((type, col) => {
          const key = `${row},${col}`;
          const building = placed[key] || null;
          const isHovered = hoveredTile === key;
          return (
            <Tile
              key={key}
              type={type}
              row={row}
              col={col}
              building={building}
              previewBuilding={isHovered ? selectedBuilding : null}
              inspected={inspectedTile === key}
              onClick={(e) => onTileClick(row, col, e)}
              onMouseEnter={() => onHoverTile(key)}
              onMouseLeave={onLeaveTile}
            />
          );
        })
      )}
    </div>
  );
}

CityGrid.propTypes = {
  map: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    tiles: PropTypes.array.isRequired,
  }).isRequired,
  placed: PropTypes.object.isRequired,
  selectedBuilding: PropTypes.string,
  onTileClick: PropTypes.func.isRequired,
  hoveredTile: PropTypes.string,
  onHoverTile: PropTypes.func.isRequired,
  onLeaveTile: PropTypes.func.isRequired,
  inspectedTile: PropTypes.string,
  radiusOverlay: PropTypes.shape({
    row: PropTypes.number.isRequired,
    col: PropTypes.number.isRequired,
    radius: PropTypes.number.isRequired,
    used: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }),
};

export default CityGrid;
