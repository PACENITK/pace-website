import React from "react";
import PropTypes from "prop-types";

function BuildingPalette({ buildingGroups, selectedBuilding, onSelect, onReset }) {
  return (
    <div className="cw-palette">
      <h2 className="cw-palette-title">Buildings</h2>
      <ul className="cw-palette-list">
        {buildingGroups.map((group) => {
          const isMultiTier = group.tiers.length > 1;
          const groupSelected = group.tiers.some((t) => t.id === selectedBuilding);
          return (
            <li
              key={group.type}
              className={`cw-palette-item${groupSelected ? " cw-palette-item--selected" : ""}`}
            >
              <img
                className="cw-palette-thumb"
                src={`/civil-wars/buildings/bld_${group.image}.png`}
                alt=""
              />
              <div className="cw-palette-info">
                <span className="cw-palette-name">{group.name}</span>
                {isMultiTier ? (
                  <div className="cw-palette-sizes">
                    {group.tiers.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        className={`cw-size-btn${selectedBuilding === tier.id ? " cw-size-btn--selected" : ""}`}
                        onClick={() => onSelect(tier.id)}
                      >
                        <span className="cw-size-btn-label">{tier.size}</span>
                        <span className="cw-size-btn-cost">₹{tier.cost} Cr</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`cw-size-btn cw-size-btn--single${
                      selectedBuilding === group.tiers[0].id ? " cw-size-btn--selected" : ""
                    }`}
                    onClick={() => onSelect(group.tiers[0].id)}
                  >
                    <span className="cw-size-btn-cost">₹{group.tiers[0].cost} Cr</span>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <button type="button" className="cw-reset-btn" onClick={onReset}>
        Reset city
      </button>
    </div>
  );
}

BuildingPalette.propTypes = {
  buildingGroups: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      tiers: PropTypes.array.isRequired,
    })
  ).isRequired,
  selectedBuilding: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default BuildingPalette;
