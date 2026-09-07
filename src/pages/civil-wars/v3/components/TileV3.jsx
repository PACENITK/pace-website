import React from "react";
import PropTypes from "prop-types";
import {
  Zap,
  Droplet,
  Droplets,
  HeartPulse,
  GraduationCap,
  TreePine,
  ShieldCheck,
  Trash2,
  Bus,
  TrainFront,
  Train,
  Plane,
  Wheat,
  Home,
  Store,
  UtensilsCrossed,
  Hotel,
  ShoppingBag,
  Trophy,
  Factory,
  Waves,
  Landmark,
} from "lucide-react";
import { SERVICES } from "../engine.js";
import { explainUnmet } from "./explainUnmet.js";
import useGameStore from "../store/useGameStore.js";
import { TILE_ART, LOWLYING_ART, BUILDING_ART } from "../art.js";

const BUILDING_ICON = {
  residential_small: Home,
  residential_medium: Home,
  residential_large: Home,
  power_plant: Zap,
  water_tank: Droplet,
  water_treatment: Droplets,
  hospital: HeartPulse,
  school: GraduationCap,
  park: TreePine,
  safety_station: ShieldCheck,
  sewage_plant: Trash2,
  farm: Wheat,
  storm_drainage: Waves,
  dam: Landmark,
  bus_stand: Bus,
  railway: TrainFront,
  metro: Train,
  airport: Plane,
  market: Store,
  restaurant: UtensilsCrossed,
  hotel: Hotel,
  mall: ShoppingBag,
  stadium: Trophy,
  industry_small: Factory,
  industry_medium: Factory,
  industry_large: Factory,
};

export const SERVICE_ICON = {
  power: Zap,
  water: Droplet,
  health: HeartPulse,
  education: GraduationCap,
  environment: TreePine,
  safety: ShieldCheck,
  sanitation: Trash2,
  transport: Bus,
  food: Wheat,
};

const TILE_CLASS = {
  empty: "cw3-tile--empty",
  river: "cw3-tile--river",
  road: "cw3-tile--road",
  slum: "cw3-tile--slum",
  colony: "cw3-tile--colony",
};

function TileV3({
  row,
  col,
  tile,
  buildingId,
  previewBuildingId,
  tileStat,
  upgraded,
  dropState,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragOver,
  onDrop,
}) {
  const placed = useGameStore((s) => s.placed);
  const shownBuildingId = buildingId || previewBuildingId || null;
  const BuildingIcon = shownBuildingId ? BUILDING_ICON[shownBuildingId] : null;
  const buildingArt = shownBuildingId ? BUILDING_ART[shownBuildingId] : null;
  const hasDemand = !!tileStat && tileStat.pop > 0;
  const unmetServices = hasDemand ? SERVICES.filter((s) => tileStat.served[s] < tileStat.demand[s]) : [];
  const tileArt = tile.lowLying ? LOWLYING_ART : TILE_ART[tile.type];

  const classes = [
    "cw3-tile",
    tileArt ? "" : TILE_CLASS[tile.type] || "",
    tile.lowLying ? "cw3-tile--lowlying" : "",
    tileStat && tileStat.pollution ? "cw3-tile--polluted" : "",
    tileStat && tileStat.sewageNuisance ? "cw3-tile--sewage-nuisance" : "",
    dropState === "valid" ? "cw3-tile--drop-valid" : "",
    dropState === "invalid" ? "cw3-tile--drop-invalid" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={tileArt ? { backgroundImage: `url(${tileArt})` } : undefined}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {tile.type === "slum" && upgraded && <div className="cw3-tile-upgraded-badge">&#10003;</div>}
      {buildingArt ? (
        <div
          className={`cw3-tile-building-art${!buildingId ? " cw3-tile-building--preview" : ""}`}
          style={{ backgroundImage: `url(${buildingArt})` }}
        />
      ) : (
        BuildingIcon && (
          <div className={`cw3-tile-building${!buildingId ? " cw3-tile-building--preview" : ""}`}>
            <BuildingIcon size={18} strokeWidth={2} />
          </div>
        )
      )}
      {hasDemand && (
        <div className="cw3-tile-services">
          {SERVICES.map((service) => {
            const Icon = SERVICE_ICON[service];
            const filled = tileStat.served[service] >= tileStat.demand[service];
            return <Icon key={service} size={7} className={filled ? "cw3-svc-filled" : "cw3-svc-hollow"} />;
          })}
        </div>
      )}
      {hasDemand && (
        <div className="cw3-tile-tooltip">
          <strong>{tile.type === "empty" ? "Residential" : tile.type}</strong>
          <div>Population: {Math.round(tileStat.pop)}</div>
          {unmetServices.length === 0 && <div>All services met</div>}
          {unmetServices.map((s) => (
            <div key={s} className="cw3-tooltip-unmet">
              {s}: {explainUnmet(s, row, col, placed)}
            </div>
          ))}
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
  dropState: PropTypes.oneOf(["valid", "invalid", null]),
  onClick: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
};

export default TileV3;
