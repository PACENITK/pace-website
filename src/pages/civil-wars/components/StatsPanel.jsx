import React from "react";
import PropTypes from "prop-types";
import ScoreBreakdown from "./ScoreBreakdown";
import CoverageBars from "./CoverageBars";
import TileInspector from "./TileInspector";
import TuningPanel from "./TuningPanel";
import PresetSelector from "./PresetSelector";
import ExportImport from "./ExportImport";

function StatsPanel({
  breakdown,
  budget,
  coverage,
  tilesUsed,
  totalTiles,
  inspectMode,
  onToggleInspectMode,
  inspectedTile,
  onCloseInspector,
  tuningOpen,
  onToggleTuning,
  config,
  onConfigChange,
  presets,
  map,
  onLoadPreset,
  placed,
  onImportPlaced,
}) {
  return (
    <div className="cw-stats">
      <div className="cw-stats-budget-label">Score</div>
      <div className={`cw-stats-budget${breakdown.total < 0 ? " cw-stats-budget--negative" : ""}`}>
        {breakdown.total}
      </div>
      <div className="cw-stats-sub-budget">
        Budget: <span className={budget < 0 ? "cw-stats-budget--negative" : ""}>₹{budget} Cr</span>
      </div>

      <ScoreBreakdown breakdown={breakdown} />

      <div className="cw-toolbar">
        <button
          type="button"
          className={`cw-toggle-btn${inspectMode ? " cw-toggle-btn--active" : ""}`}
          onClick={onToggleInspectMode}
        >
          Inspect
        </button>
        <button
          type="button"
          className={`cw-toggle-btn${tuningOpen ? " cw-toggle-btn--active" : ""}`}
          onClick={onToggleTuning}
        >
          Tuning
        </button>
      </div>

      {inspectedTile && <TileInspector tile={inspectedTile} onClose={onCloseInspector} />}
      {tuningOpen && (
        <TuningPanel config={config} onChange={onConfigChange} onClose={onToggleTuning} />
      )}

      <CoverageBars coverage={coverage} />

      <div className="cw-stats-row cw-stats-row--total">
        <span>Tiles used</span>
        <span>
          {tilesUsed} / {totalTiles}
        </span>
      </div>

      <PresetSelector presets={presets} map={map} config={config} onLoad={onLoadPreset} />
      <ExportImport placed={placed} onImport={onImportPlaced} />
    </div>
  );
}

StatsPanel.propTypes = {
  breakdown: PropTypes.shape({
    servicePoints: PropTypes.number.isRequired,
    slumPenalty: PropTypes.number.isRequired,
    pollutionPenalty: PropTypes.number.isRequired,
    sewagePenalty: PropTypes.number.isRequired,
    savingsBonus: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
  budget: PropTypes.number.isRequired,
  coverage: PropTypes.object.isRequired,
  tilesUsed: PropTypes.number.isRequired,
  totalTiles: PropTypes.number.isRequired,
  inspectMode: PropTypes.bool.isRequired,
  onToggleInspectMode: PropTypes.func.isRequired,
  inspectedTile: PropTypes.object,
  onCloseInspector: PropTypes.func.isRequired,
  tuningOpen: PropTypes.bool.isRequired,
  onToggleTuning: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  presets: PropTypes.array.isRequired,
  map: PropTypes.object.isRequired,
  onLoadPreset: PropTypes.func.isRequired,
  placed: PropTypes.object.isRequired,
  onImportPlaced: PropTypes.func.isRequired,
};

export default StatsPanel;
