import React from "react";
import useGameStore from "./store/useGameStore.js";
import { MID_GAME_CHECKPOINT } from "./data/mockGameState.js";
import BuildingPalette from "./components/BuildingPalette.jsx";
import CityGridV3 from "./components/CityGridV3.jsx";
import ScorePanel from "./components/ScorePanel.jsx";
import TwistModal from "./components/TwistModal.jsx";
import "./civil-wars-v3.css";

function CivilWarsV3() {
  const year = useGameStore((s) => s.year);
  const resetGame = useGameStore((s) => s.resetGame);
  const loadCheckpoint = useGameStore((s) => s.loadCheckpoint);

  return (
    <div className="cw3-root">
      <div className="cw3-topbar">
        <span className="cw3-topbar-title">Urban Mayhem — v3</span>
        <span className="cw3-topbar-year">{year === 0 ? "Year 0 — Planning" : `Year ${year}`}</span>
        <div className="cw3-topbar-links">
          <button type="button" className="cw3-topbar-btn" onClick={() => loadCheckpoint(MID_GAME_CHECKPOINT)}>
            Load demo city
          </button>
          <button type="button" className="cw3-topbar-btn" onClick={resetGame}>
            Reset
          </button>
          <a href="/civil-wars/v3/organizer" className="cw3-topbar-btn cw3-topbar-btn--link">
            Organizer console →
          </a>
        </div>
      </div>
      <div className="cw3-layout">
        <BuildingPalette />
        <div className="cw3-grid-column">
          <CityGridV3 />
        </div>
        <ScorePanel />
      </div>
      <TwistModal />
    </div>
  );
}

export default CivilWarsV3;
