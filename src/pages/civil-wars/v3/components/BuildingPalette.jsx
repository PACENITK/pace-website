import React from "react";
import { Lock, MousePointerClick, Move } from "lucide-react";
import useGameStore from "../store/useGameStore.js";
import { buildingsById, CATEGORY } from "../engine.js";

// Tiered visibility per rules.md Part L's own suggestion: "showing only
// Essentials and Residential in Year 0, unlocking Economy and Transport
// at Year 1" -- extended here to Protection/Industry too, so a
// first-time team isn't choosing from all 26 buildings on turn one.
const CATEGORY_ORDER = [
  { key: CATEGORY.ESSENTIAL, label: "Essentials", unlockYear: 0 },
  { key: CATEGORY.RESIDENTIAL, label: "Residential", unlockYear: 0 },
  { key: CATEGORY.PROTECTION, label: "Protection", unlockYear: 1 },
  { key: CATEGORY.TRANSPORT, label: "Transport", unlockYear: 1 },
  { key: CATEGORY.ECONOMY, label: "Economy", unlockYear: 1 },
  { key: CATEGORY.INDUSTRY, label: "Industry", unlockYear: 1 },
];

const buildingsByCategory = Object.values(buildingsById).reduce((acc, def) => {
  (acc[def.category] ||= []).push(def);
  return acc;
}, {});

function BuildingPalette() {
  const year = useGameStore((s) => s.year);
  const cash = useGameStore((s) => s.cash);
  const selectedBuilding = useGameStore((s) => s.selectedBuilding);
  const selectBuilding = useGameStore((s) => s.selectBuilding);
  const beginDrag = useGameStore((s) => s.beginDrag);
  const lastError = useGameStore((s) => s.lastError);

  return (
    <div className="cw3-palette">
      <div className="cw3-palette-cash">₹{cash.toFixed(1)} Cr</div>
      {lastError && <div className="cw3-palette-error">{lastError}</div>}

      {CATEGORY_ORDER.map(({ key, label, unlockYear }) => {
        const locked = year < unlockYear;
        return (
          <div className="cw3-palette-group" key={key}>
            <div className="cw3-palette-group-label">
              {label}
              {locked && <Lock size={12} />}
            </div>
            {locked ? (
              <div className="cw3-palette-locked">Unlocks Year {unlockYear}</div>
            ) : (
              <div className="cw3-palette-buttons">
                {buildingsByCategory[key].map((def) => {
                  const affordable = cash >= def.cost;
                  return (
                    <button
                      key={def.id}
                      type="button"
                      className={`cw3-building-btn${selectedBuilding === def.id ? " cw3-building-btn--selected" : ""}`}
                      onClick={() => selectBuilding(def.id)}
                      disabled={!affordable}
                      title={def.name}
                      draggable={affordable}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", def.id);
                        e.dataTransfer.effectAllowed = "copy";
                        beginDrag(def.id);
                      }}
                    >
                      <span className="cw3-building-btn-name">
                        {affordable && <Move size={10} className="cw3-building-btn-drag" />}
                        {def.name}
                      </span>
                      <span className="cw3-building-btn-cost">₹{def.cost} Cr</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {selectedBuilding && (
        <div className="cw3-palette-hint">
          <MousePointerClick size={12} /> Drag onto the grid, or click a tile to place
        </div>
      )}
    </div>
  );
}

export default BuildingPalette;
