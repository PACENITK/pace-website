import React from "react";
import PropTypes from "prop-types";

function fmt(n) {
  const rounded = Math.round(n * 10) / 10;
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

function ScoreBreakdown({ breakdown }) {
  const { servicePoints, slumPenalty, pollutionPenalty, sewagePenalty, savingsBonus, total } =
    breakdown;

  return (
    <div className="cw-breakdown">
      <div className="cw-stats-section-label">Score breakdown</div>
      <table className="cw-breakdown-table">
        <tbody>
          <tr>
            <td>Service points</td>
            <td>{fmt(servicePoints)}</td>
          </tr>
          <tr>
            <td>Slum penalty</td>
            <td>{fmt(-slumPenalty)}</td>
          </tr>
          <tr>
            <td>Pollution penalty</td>
            <td>{fmt(-pollutionPenalty)}</td>
          </tr>
          <tr>
            <td>Sewage penalty</td>
            <td>{fmt(-sewagePenalty)}</td>
          </tr>
          <tr>
            <td>Savings bonus</td>
            <td>{fmt(savingsBonus)}</td>
          </tr>
          <tr className="cw-breakdown-total">
            <td>Total</td>
            <td>{total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

ScoreBreakdown.propTypes = {
  breakdown: PropTypes.shape({
    servicePoints: PropTypes.number.isRequired,
    slumPenalty: PropTypes.number.isRequired,
    pollutionPenalty: PropTypes.number.isRequired,
    sewagePenalty: PropTypes.number.isRequired,
    savingsBonus: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
};

export default ScoreBreakdown;
