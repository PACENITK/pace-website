import React from "react";
import { X, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { SERVICES } from "../engine.js";
import { SERVICE_ICON } from "./TileV3.jsx";
import { explainUnmet } from "./explainUnmet.js";
import useGameStore from "../store/useGameStore.js";

const SERVICE_LABEL = {
  power: "Power",
  water: "Water",
  health: "Health",
  education: "Education",
  environment: "Environment",
  safety: "Safety",
  sanitation: "Sanitation",
  transport: "Transport",
  food: "Food",
};

const TILE_LABEL = {
  empty: "Residential",
  slum: "Slum",
  colony: "Colony",
};

function ServiceRow({ service, tileStat, row, col, placed }) {
  const Icon = SERVICE_ICON[service];
  const demand = tileStat.demand[service];
  const served = tileStat.served[service];
  const fully = served >= demand;
  const partial = !fully && served > 0;

  let StatusIcon, statusClass, statusLabel, reason;
  if (fully) {
    StatusIcon = CheckCircle2;
    statusClass = "cw3-tdp-svc--met";
    statusLabel = "Met";
  } else if (partial) {
    StatusIcon = AlertTriangle;
    statusClass = "cw3-tdp-svc--partial";
    statusLabel = "Partial";
    reason = explainUnmet(service, row, col, placed);
  } else {
    StatusIcon = Circle;
    statusClass = "cw3-tdp-svc--unmet";
    statusLabel = "Not met";
    reason = explainUnmet(service, row, col, placed);
  }

  return (
    <div className={`cw3-tdp-svc-row ${statusClass}`}>
      <div className="cw3-tdp-svc-left">
        <Icon size={13} className="cw3-tdp-svc-icon" />
        <span className="cw3-tdp-svc-name">{SERVICE_LABEL[service]}</span>
      </div>
      <div className="cw3-tdp-svc-right">
        <span className="cw3-tdp-svc-nums">{served} / {demand}</span>
        <StatusIcon size={13} className="cw3-tdp-svc-status-icon" />
        <span className="cw3-tdp-svc-status-label">{statusLabel}</span>
      </div>
      {reason && <div className="cw3-tdp-svc-reason">{reason}</div>}
    </div>
  );
}

function TileDetailPanel({ tileKey, tileStat, tile, onClose }) {
  const placed = useGameStore((s) => s.placed);

  if (!tileKey || !tileStat || tileStat.pop <= 0) return null;

  const [row, col] = tileKey.split(",").map(Number);
  const unmetCount = SERVICES.filter((s) => tileStat.served[s] < tileStat.demand[s]).length;
  const allMet = unmetCount === 0;

  return (
    <div className="cw3-tdp-backdrop" onClick={onClose}>
      <div className="cw3-tdp" onClick={(e) => e.stopPropagation()}>
        <div className="cw3-tdp-header">
          <div>
            <div className="cw3-tdp-tile-label">{TILE_LABEL[tile.type] || tile.type}</div>
            <div className="cw3-tdp-pop">{Math.round(tileStat.pop).toLocaleString()} people</div>
          </div>
          <button className="cw3-tdp-close" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className={`cw3-tdp-summary ${allMet ? "cw3-tdp-summary--ok" : "cw3-tdp-summary--warn"}`}>
          {allMet
            ? "✓ All 9 services are fully met"
            : `${unmetCount} of 9 service${unmetCount > 1 ? "s" : ""} not fully met`}
        </div>

        {tileStat.pollution && (
          <div className="cw3-tdp-alert">
            ⚠️ <strong>Pollution penalty</strong> — industry nearby strips Environment. Place a Park within 1 tile to cancel.
          </div>
        )}
        {tileStat.sewageNuisance && (
          <div className="cw3-tdp-alert">
            ⚠️ <strong>Sewage nuisance</strong> — adjacent to a Sewage Plant (−20 pts).
          </div>
        )}

        <div className="cw3-tdp-services">
          {SERVICES.map((service) => (
            <ServiceRow
              key={service}
              service={service}
              tileStat={tileStat}
              row={row}
              col={col}
              placed={placed}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TileDetailPanel;
