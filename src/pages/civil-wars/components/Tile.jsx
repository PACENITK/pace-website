import React from "react";
import PropTypes from "prop-types";
import { BUILDINGS_BY_ID } from "../data/buildings.js";

function BuildingLayer({ id, extraClass }) {
  const def = BUILDINGS_BY_ID[id];
  if (!def) return null;
  return (
    <div className={`cw-tile-building${extraClass ? ` ${extraClass}` : ""}`}>
      <div
        className="cw-tile-building-art"
        style={{ backgroundImage: `url(/civil-wars/buildings/bld_${def.image}.png)` }}
      />
      {def.size && <span className="cw-tile-building-badge">{def.size}</span>}
    </div>
  );
}

BuildingLayer.propTypes = {
  id: PropTypes.string.isRequired,
  extraClass: PropTypes.string,
};

function Tile({ type, row, col, building, previewBuilding, inspected, onClick, onMouseEnter, onMouseLeave }) {
  const rotation = type === "empty" ? ((row * 7 + col) % 4) * 90 : 0;

  const tileStyle = {
    backgroundImage: `url(/civil-wars/tiles/tile_${type}.png)`,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
  };

  return (
    <div
      className={`cw-tile${inspected ? " cw-tile--inspected" : ""}`}
      style={tileStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {building && <BuildingLayer id={building} />}
      {previewBuilding && !building && (
        <BuildingLayer id={previewBuilding} extraClass="cw-tile-building--preview" />
      )}
    </div>
  );
}

Tile.propTypes = {
  type: PropTypes.string.isRequired,
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  building: PropTypes.string,
  previewBuilding: PropTypes.string,
  inspected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
};

export default Tile;
