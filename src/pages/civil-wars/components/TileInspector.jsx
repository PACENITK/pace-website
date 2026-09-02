import React from "react";
import PropTypes from "prop-types";
import { SERVICES } from "../data/tileTypes.js";
import { BUILDINGS_BY_ID } from "../data/buildings.js";

const LABELS = {
  water: "Water",
  health: "Health",
  education: "Education",
  environment: "Environment",
  sanitation: "Sanitation",
};

function TileInspector({ tile, onClose }) {
  if (!tile) return null;

  return (
    <div className="cw-inspector">
      <div className="cw-inspector-header">
        <span className="cw-stats-section-label">
          Tile ({tile.row}, {tile.col}) — {tile.type}
        </span>
        <button type="button" className="cw-inspector-close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="cw-inspector-pop">Population: {tile.pop}</div>
      <table className="cw-inspector-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Met</th>
            <th>Served by</th>
          </tr>
        </thead>
        <tbody>
          {SERVICES.map((service) => (
            <tr key={service}>
              <td>{LABELS[service]}</td>
              <td>
                {tile.served[service]} / {tile.demand[service]}
              </td>
              <td>
                {tile.servedBy[service].length === 0
                  ? "—"
                  : tile.servedBy[service]
                      .map((s) => `${BUILDINGS_BY_ID[s.id]?.name || s.id} (+${s.amount})`)
                      .join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cw-inspector-flags">
        {tile.slumPenalty > 0 && <div>Unmet-demand penalty: −{tile.slumPenalty}</div>}
        {tile.pollution && <div>Pollution penalty applied</div>}
        {tile.sewage && <div>Sewage nuisance penalty applied</div>}
      </div>
      <div className="cw-inspector-points">
        Points from this tile: <strong>{tile.points}</strong>
      </div>
    </div>
  );
}

TileInspector.propTypes = {
  tile: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default TileInspector;
