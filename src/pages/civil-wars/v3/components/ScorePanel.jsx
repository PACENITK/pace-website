import React from "react";
import useGameStore from "../store/useGameStore.js";
import useCityStats from "../store/useCityStats.js";
import { SERVICES, config } from "../engine.js";
import { SERVICE_ICON } from "../data/serviceMeta.js";

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

function fmt(n) {
  const r = Math.round(n * 10) / 10;
  return r > 0 ? `+${r}` : `${r}`;
}

// Score is always computed here, never trusted from any other piece of
// local state -- same computeCityStats + config the simulation and
// (eventually) the backend use, so what the player sees during play is
// exactly what the authoritative scorer will say at the end.
function ScorePanel() {
  const year = useGameStore((s) => s.year);
  const cash = useGameStore((s) => s.cash);
  const cumulativeScoreAdjustment = useGameStore((s) => s.cumulativeScoreAdjustment);
  const stats = useCityStats();
  const { breakdown, coverage } = stats;
  const cashBonus = cash * config.cashPointsPer1Cr;
  const finalScore = Math.floor(breakdown.staticTotal + cashBonus + cumulativeScoreAdjustment);

  return (
    <div className="cw3-score">
      <div className="cw3-score-year">Year {year}</div>
      <div className="cw3-score-total">{finalScore} pts</div>

      <div className="cw3-score-section-label">Breakdown</div>
      <table className="cw3-score-table">
        <tbody>
          <tr>
            <td>Service points</td>
            <td>{fmt(breakdown.servicePoints)}</td>
          </tr>
          <tr>
            <td>Unserved penalty</td>
            <td>{fmt(-breakdown.unservedPenalty)}</td>
          </tr>
          <tr>
            <td>Slum sanitation penalty</td>
            <td>{fmt(-breakdown.slumSanitationPenalty)}</td>
          </tr>
          <tr>
            <td>Pollution penalty</td>
            <td>{fmt(-breakdown.pollutionPenalty)}</td>
          </tr>
          <tr>
            <td>Sewage adjacency penalty</td>
            <td>{fmt(-breakdown.sewagePenalty)}</td>
          </tr>
          <tr>
            <td>All-served bonus</td>
            <td>{fmt(breakdown.allServedBonus)}</td>
          </tr>
          <tr>
            <td>Coverage bonus</td>
            <td>{fmt(breakdown.coverageBonus)}</td>
          </tr>
          <tr>
            <td>Slum rehoused bonus</td>
            <td>{fmt(breakdown.slumRehousedBonus)}</td>
          </tr>
          <tr>
            <td>Cash bonus</td>
            <td>{fmt(cashBonus)}</td>
          </tr>
          <tr>
            <td>Twist adjustments</td>
            <td>{fmt(cumulativeScoreAdjustment)}</td>
          </tr>
        </tbody>
      </table>

      <div className="cw3-score-section-label">Coverage</div>
      {SERVICES.map((service) => {
        const Icon = SERVICE_ICON[service];
        const { served, total } = coverage[service];
        const pct = total > 0 ? Math.min(100, (served / total) * 100) : 100;
        return (
          <div className="cw3-coverage-row" key={service}>
            <div className="cw3-coverage-row-label">
              <span>
                <Icon size={12} /> {SERVICE_LABEL[service]}
              </span>
              <span>
                {served} / {total}
              </span>
            </div>
            <div className="cw3-coverage-bar-track">
              <div className="cw3-coverage-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ScorePanel;
