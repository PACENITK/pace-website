import React from "react";
import PropTypes from "prop-types";
import { SERVICES } from "../data/tileTypes.js";

const LABELS = {
  water: "Water",
  health: "Health",
  education: "Education",
  environment: "Environment",
  sanitation: "Sanitation",
};

function CoverageBars({ coverage }) {
  return (
    <div className="cw-coverage">
      <div className="cw-stats-section-label">Coverage</div>
      {SERVICES.map((service) => {
        const { served, total } = coverage[service];
        const pct = total > 0 ? Math.min(100, (served / total) * 100) : 0;
        return (
          <div className="cw-coverage-row" key={service}>
            <div className="cw-coverage-row-label">
              <span>{LABELS[service]}</span>
              <span>
                {served} / {total}
              </span>
            </div>
            <div className="cw-coverage-bar-track">
              <div className="cw-coverage-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

CoverageBars.propTypes = {
  coverage: PropTypes.objectOf(
    PropTypes.shape({
      served: PropTypes.number.isRequired,
      total: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default CoverageBars;
