import React, { useEffect, useMemo, useState } from "react";
import CityGrid from "./components/CityGrid";
import BuildingPalette from "./components/BuildingPalette";
import StatsPanel from "./components/StatsPanel";
import map from "./data/map.json";
import buildingGroups, { BUILDINGS_BY_ID } from "./data/buildings.js";
import defaultConfig from "./data/config.js";
import presets from "./data/presets.js";
import { computeCityStats } from "./engine/score.js";
import "./civil-wars.css";

function CivilWars() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [placed, setPlaced] = useState({});
  const [hoveredTile, setHoveredTile] = useState(null);
  const [inspectMode, setInspectMode] = useState(false);
  const [inspectedTileKey, setInspectedTileKey] = useState(null);
  const [tuningOpen, setTuningOpen] = useState(false);
  const [config, setConfig] = useState(() => ({ ...defaultConfig }));

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setSelectedBuilding(null);
        setInspectedTileKey(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const cityStats = useMemo(() => computeCityStats(map, placed, config), [placed, config]);

  const handleSelectBuilding = (id) => {
    setSelectedBuilding((current) => (current === id ? null : id));
  };

  const handleTileClick = (row, col, e) => {
    const key = `${row},${col}`;

    if (inspectMode || (e && e.altKey)) {
      setInspectedTileKey((current) => (current === key ? null : key));
      return;
    }

    if (placed[key]) {
      setPlaced((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      return;
    }

    if (selectedBuilding) {
      setPlaced((current) => ({ ...current, [key]: selectedBuilding }));
    }
  };

  const handleReset = () => {
    setPlaced({});
  };

  const handleConfigChange = (key, value) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const handleLoadPreset = (presetPlaced) => {
    setPlaced({ ...presetPlaced });
  };

  const handleImportPlaced = (parsed) => {
    if (parsed && typeof parsed === "object") {
      setPlaced(parsed);
    }
  };

  const totalTiles = map.width * map.height;
  const tilesUsed = Object.keys(placed).length;

  const radiusOverlay = useMemo(() => {
    if (selectedBuilding && hoveredTile) {
      const def = BUILDINGS_BY_ID[selectedBuilding];
      if (!def || def.radius <= 0) return null;
      const [row, col] = hoveredTile.split(",").map(Number);
      return { row, col, radius: def.radius, used: 0, total: def.capacity };
    }
    if (!selectedBuilding && hoveredTile && placed[hoveredTile]) {
      const def = BUILDINGS_BY_ID[placed[hoveredTile]];
      if (!def || def.radius <= 0) return null;
      const [row, col] = hoveredTile.split(",").map(Number);
      const usage = cityStats.buildingUsage[hoveredTile] || { used: 0, total: def.capacity };
      return { row, col, radius: def.radius, used: usage.used, total: usage.total };
    }
    return null;
  }, [selectedBuilding, hoveredTile, placed, cityStats.buildingUsage]);

  const inspectedTile = inspectedTileKey ? cityStats.tileStats[inspectedTileKey] : null;

  return (
    <div className="cw-root">
      <div className="cw-layout">
        <BuildingPalette
          buildingGroups={buildingGroups}
          selectedBuilding={selectedBuilding}
          onSelect={handleSelectBuilding}
          onReset={handleReset}
        />
        <div className="cw-grid-column">
          <CityGrid
            map={map}
            placed={placed}
            selectedBuilding={selectedBuilding}
            onTileClick={handleTileClick}
            hoveredTile={hoveredTile}
            onHoverTile={setHoveredTile}
            onLeaveTile={() => setHoveredTile(null)}
            inspectedTile={inspectedTileKey}
            radiusOverlay={radiusOverlay}
          />
        </div>
        <StatsPanel
          breakdown={cityStats.breakdown}
          budget={cityStats.budget}
          coverage={cityStats.coverage}
          tilesUsed={tilesUsed}
          totalTiles={totalTiles}
          inspectMode={inspectMode}
          onToggleInspectMode={() => setInspectMode((v) => !v)}
          inspectedTile={inspectedTile}
          onCloseInspector={() => setInspectedTileKey(null)}
          tuningOpen={tuningOpen}
          onToggleTuning={() => setTuningOpen((v) => !v)}
          config={config}
          onConfigChange={handleConfigChange}
          presets={presets}
          map={map}
          onLoadPreset={handleLoadPreset}
          placed={placed}
          onImportPlaced={handleImportPlaced}
        />
      </div>
    </div>
  );
}

export default CivilWars;
