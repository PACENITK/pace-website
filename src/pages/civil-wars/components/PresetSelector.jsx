import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { computeCityStats } from "../engine/score.js";

function PresetSelector({ presets, map, config, onLoad }) {
  const scored = useMemo(
    () =>
      presets.map((preset) => ({
        ...preset,
        total: computeCityStats(map, preset.placed, config).breakdown.total,
      })),
    [presets, map, config]
  );

  return (
    <div className="cw-presets">
      <div className="cw-stats-section-label">Preset cities</div>
      {scored.map((preset) => (
        <div className="cw-preset-row" key={preset.id}>
          <button type="button" className="cw-preset-load" onClick={() => onLoad(preset.placed)}>
            {preset.label}
          </button>
          <span className="cw-preset-score">{preset.total}</span>
        </div>
      ))}
    </div>
  );
}

PresetSelector.propTypes = {
  presets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      placed: PropTypes.object.isRequired,
    })
  ).isRequired,
  map: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  onLoad: PropTypes.func.isRequired,
};

export default PresetSelector;
