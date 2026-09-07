import React from "react";
import useGameStore from "../store/useGameStore.js";
import "../civil-wars-v3.css";

// Phase 1 stand-in for the real organizer control surface: today it
// drives the same in-browser Zustand store as the team view (no
// network), which is enough to validate the advance-year/reveal-twist
// interaction design. Phase 2 swaps this to hit the backend so one
// organizer action can push to every team's client at once.
function OrganizerConsole() {
  const year = useGameStore((s) => s.year);
  const cash = useGameStore((s) => s.cash);
  const placed = useGameStore((s) => s.placed);
  const twistLog = useGameStore((s) => s.twistLog);
  const advanceYear = useGameStore((s) => s.advanceYear);
  const resetGame = useGameStore((s) => s.resetGame);

  return (
    <div className="cw3-organizer">
      <h1>Organizer console</h1>
      <p>
        Year {year} of 5 · Cash ₹{cash.toFixed(1)} Cr · {Object.keys(placed).length} buildings placed
      </p>
      <button type="button" className="cw3-organizer-advance" onClick={advanceYear} disabled={year >= 5}>
        {year >= 5 ? "Game complete" : `Advance to Year ${year + 1} →`}
      </button>
      <button type="button" className="cw3-organizer-reset" onClick={resetGame}>
        Reset game
      </button>

      <h2>Twist log</h2>
      {twistLog.length === 0 && <p className="cw3-organizer-empty">No twists yet.</p>}
      <ul className="cw3-organizer-log">
        {twistLog.map((entry) => (
          <li key={entry.year}>
            Year {entry.year}: <strong>{entry.twist}</strong> — income x{entry.incomeMultiplier}, gross ₹
            {entry.grossIncome.toFixed(1)} Cr
          </li>
        ))}
      </ul>

      <a href="/civil-wars/v3" className="cw3-organizer-back">
        ← Back to team view
      </a>
    </div>
  );
}

export default OrganizerConsole;
