import React from "react";
import PropTypes from "prop-types";
import { Check, ArrowFatLinesUp } from "@phosphor-icons/react";
import { SERVICES } from "../data/serviceMeta.js";
import { BUILDING_ICON } from "../data/buildingMeta.js";
import { TILE_ART, LOWLYING_ART, BUILDING_ART } from "../art.js";

const TILE_CLASS = {
  empty: "",
  river: "cw3-tile--river",
  road: "cw3-tile--road",
  slum: "cw3-tile--slum",
  colony: "cw3-tile--colony",
};

// Types with their own dedicated art (TILE_ART) that must stay visible
// even when the tile is also flagged lowLying -- a flooded slum is
// still a slum, and swapping in the generic marshy-ground art made it
// unreadable ("slum overlapping with low-lying area"). The lowLying
// tint (.cw3-tile--lowlying::after) still layers on top regardless, so
// the flood-risk signal isn't lost, it's just an overlay instead of a
// full art replacement.
const KEEP_OWN_ART_WHEN_LOWLYING = new Set(["slum", "colony"]);

// Renders only what has to stay clipped to this one tile's box (art/icon,
// service pips, slum badge). Anything that needs to visually escape a
// single tile -- the radius ghost, drop-validity chips, the hover
// tooltip, the rehouse chip -- is drawn by CityGridV3 as a sibling
// overlay positioned in board percentages, since this tile and its
// parent grid are both `overflow:hidden` (see civil-wars-v3.css).
function TileV3({
  row,
  col,
  tile,
  buildingId,
  previewBuildingId,
  tileStat,
  upgraded,
  isMoveSource,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragOver,
  onDrop,
}) {
  const shownBuildingId = buildingId || previewBuildingId || null;
  const BuildingIcon = shownBuildingId ? BUILDING_ICON[shownBuildingId] : null;
  const buildingArt = shownBuildingId ? BUILDING_ART[shownBuildingId] : null;
  const hasDemand = !!tileStat && tileStat.pop > 0;
  const tileArt =
    tile.lowLying && !KEEP_OWN_ART_WHEN_LOWLYING.has(tile.type) ? LOWLYING_ART : TILE_ART[tile.type];
  const isPreview = !buildingId && !!previewBuildingId;

  const classes = [
    "cw3-tile",
    tileArt ? "" : TILE_CLASS[tile.type] || "",
    tile.lowLying ? "cw3-tile--lowlying" : "",
    tileStat && tileStat.pollution ? "cw3-tile--polluted" : "",
    tileStat && tileStat.sewageNuisance ? "cw3-tile--sewage-nuisance" : "",
    isMoveSource ? "cw3-tile--move-source" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={tileArt ? { backgroundImage: `url(${tileArt})` } : undefined}
      data-row={row}
      data-col={col}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {tile.type === "slum" && upgraded && (
        <span className="cw3-slum-badge cw3-slum-badge--done" style={{ width: "2.6cqw", height: "2.6cqw" }}>
          <Check size={"1.6cqw"} weight="bold" />
        </span>
      )}
      {tile.type === "slum" && !upgraded && (
        <span className="cw3-slum-badge cw3-slum-badge--pending" style={{ width: "2.6cqw", height: "2.6cqw" }}>
          <ArrowFatLinesUp size={"1.6cqw"} weight="bold" />
        </span>
      )}

      {buildingArt ? (
        <div
          className={`cw3-tile-building-art${isPreview ? " cw3-tile-building-art--preview" : ""}`}
          style={{ backgroundImage: `url(${buildingArt})` }}
        />
      ) : (
        BuildingIcon && (
          <div
            className={`cw3-tile-building-icon${isPreview ? " cw3-tile-building-icon--preview" : ""}`}
            style={{ fontSize: "3.4cqw" }}
          >
            <BuildingIcon size="1em" weight="duotone" />
          </div>
        )
      )}

      {hasDemand && (
        <div className="cw3-tile-pips">
          {SERVICES.map((service) => {
            const filled = tileStat.served[service] >= tileStat.demand[service];
            return (
              <span
                key={service}
                className={`cw3-pip ${filled ? "cw3-pip--filled" : "cw3-pip--hollow"}`}
                style={{ width: ".55cqw", height: ".55cqw" }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

TileV3.propTypes = {
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  tile: PropTypes.shape({ type: PropTypes.string.isRequired, lowLying: PropTypes.bool }).isRequired,
  buildingId: PropTypes.string,
  previewBuildingId: PropTypes.string,
  tileStat: PropTypes.object,
  upgraded: PropTypes.bool,
  isMoveSource: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
};

export default TileV3;
