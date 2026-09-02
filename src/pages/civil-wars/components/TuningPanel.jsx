import React from "react";
import PropTypes from "prop-types";

const FIELDS = [
  { key: "startingBudget", label: "Starting budget (₹ Cr)", step: 1 },
  { key: "pointsPerServiceUnit", label: "Points per service unit", step: 1 },
  { key: "slumUnmetPenalty", label: "Slum unmet-demand penalty", step: 1 },
  { key: "pollutionPenalty", label: "Pollution penalty", step: 1 },
  { key: "sewageNuisancePenalty", label: "Sewage nuisance penalty", step: 1 },
  { key: "savingsRatePer1Cr", label: "Savings bonus per ₹1 Cr", step: 0.1 },
];

function TuningPanel({ config, onChange, onClose }) {
  return (
    <div className="cw-tuning">
      <div className="cw-inspector-header">
        <span className="cw-stats-section-label">Tuning</span>
        <button type="button" className="cw-inspector-close" onClick={onClose}>
          ×
        </button>
      </div>
      {FIELDS.map((field) => (
        <label className="cw-tuning-field" key={field.key}>
          <span>{field.label}</span>
          <input
            type="number"
            step={field.step}
            value={config[field.key]}
            onChange={(e) => onChange(field.key, Number(e.target.value))}
          />
        </label>
      ))}
    </div>
  );
}

TuningPanel.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TuningPanel;
