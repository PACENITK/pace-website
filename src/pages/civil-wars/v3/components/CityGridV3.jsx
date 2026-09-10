import React, { useMemo } from "react";
import { CursorClick, ArrowsOutCardinal, CheckCircle, Prohibit, ArrowFatLinesUp, Check, Wrench } from "@phosphor-icons/react";
import TileV3 from "./TileV3.jsx";
import { useActiveGameStore } from "../store/GameStoreContext.jsx";
import useCityStats from "../store/useCityStats.js";
import { buildingsById, chebyshev, config } from "../engine.js";
import { SERVICES, SERVICE_LABEL, SERVICE_ICON } from "../data/serviceMeta.js";
import { colLabel, fmtCr } from "../format.js";
import { explainUnmet } from "./explainUnmet.js";

const COLS = 16;
const ROWS = 12;

const TILE_LABEL = { empty: "Residential", slum: "Slum", colony: "Colony" };

// Sum of population within `radius` tiles of (row,col) -- powers the
// radius ghost's "COVERS N x N - X PEOPLE" caption. Deliberately kept
// local (a duplicate of the one-liner inside useGameStore's evaluatePlacement
// ctx) rather than refactored into a shared export, so this display-only
// helper never risks touching validated placement logic.
function popInRadius(tileStats, row, col, radius) {
  let sum = 0;
  Object.values(tileStats).forEach((t) => {
    if (t.pop > 0 && chebyshev(row, col, t.row, t.col) <= radius) sum += t.pop;
  });
  return sum;
}

function TileTooltip({ row, col, tileStat, buildingId, upgraded, placed }) {
  const identity = buildingId
    ? buildingsById[buildingId].name
    : tileStat.type === "slum"
    ? upgraded
      ? "Rehoused slum"
      : "Slum"
    : TILE_LABEL[tileStat.type] || tileStat.type;

  const unmet = SERVICES.filter((s) => tileStat.served[s] < tileStat.demand[s]);
  const met = SERVICES.filter((s) => tileStat.served[s] >= tileStat.demand[s]);

  const left = col < 9 ? `${((col + 1) / COLS) * 100}%` : undefined;
  const right = col >= 9 ? `${((COLS - col) / COLS) * 100}%` : undefined;
  const top = `${(Math.min(row, 6) / ROWS) * 100}%`;

  return (
    <div className="cw3-tile-tooltip" style={{ left, right, top }}>
      <div className="cw3-tile-tooltip-head">
        <span className="cw3-tile-tooltip-title">
          {identity} · {colLabel(row, col)}
        </span>
        <span className="cw3-tile-tooltip-pop">{Math.round(tileStat.pop).toLocaleString("en-IN")} residents</span>
      </div>
      <div className="cw3-tile-tooltip-body">
        {unmet.map((service) => {
          const Icon = SERVICE_ICON[service];
          return (
            <div className="cw3-tile-tooltip-unmet" key={service}>
              <Icon size={"1.9cqw"} weight="duotone" />
              <strong>{SERVICE_LABEL[service]}</strong>
              <span className="cw3-tile-tooltip-reason">{explainUnmet(service, row, col, placed)}</span>
            </div>
          );
        })}
        {met.length > 0 && (
          <>
            <div className="cw3-tile-tooltip-rule" />
            <div className="cw3-tile-tooltip-met">
              <Check size={"1.8cqw"} weight="bold" />
              {met.map((s) => SERVICE_LABEL[s]).join(" · ")}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CityGridV3() {
  const map = useActiveGameStore((s) => s.map);
  const year = useActiveGameStore((s) => s.year);
  const placed = useActiveGameStore((s) => s.placed);
  const slumUpgraded = useActiveGameStore((s) => s.slumUpgraded);
  const selectedBuilding = useActiveGameStore((s) => s.selectedBuilding);
  const moveFrom = useActiveGameStore((s) => s.moveFrom);
  const hoveredTile = useActiveGameStore((s) => s.hoveredTile);
  const hoverTile = useActiveGameStore((s) => s.hoverTile);
  const clearHover = useActiveGameStore((s) => s.clearHover);
  const proposePlacement = useActiveGameStore((s) => s.proposePlacement);
  const proposeRehouse = useActiveGameStore((s) => s.proposeRehouse);
  const proposeRepair = useActiveGameStore((s) => s.proposeRepair);
  const beginMove = useActiveGameStore((s) => s.beginMove);
  const cancelMove = useActiveGameStore((s) => s.cancelMove);
  const proposeMove = useActiveGameStore((s) => s.proposeMove);
  const previewMove = useActiveGameStore((s) => s.previewMove);
  const damagedTiles = useActiveGameStore((s) => s.damagedTiles);
  const previewPlacement = useActiveGameStore((s) => s.previewPlacement);
  const treasureRevealed = useActiveGameStore((s) => s.treasureRevealed);
  const treasureClaimed = useActiveGameStore((s) => s.treasureClaimed);
  const treasureTile = useActiveGameStore((s) => s.treasureTile);
  const proposeClaimTreasure = useActiveGameStore((s) => s.proposeClaimTreasure);
  const stats = useCityStats();

  const hoveredRC = hoveredTile ? hoveredTile.split(",").map(Number) : null;

  // The building whose radius ghost should show while hovering: either
  // a palette pick about to be placed, or a board building picked up
  // for a move (rules.md Part D -- moving recalculates coverage from
  // the new tile exactly like a fresh placement would).
  const activeBuildingId = selectedBuilding || (moveFrom ? moveFrom.buildingId : null);

  const radiusOverlay = useMemo(() => {
    if (!activeBuildingId || !hoveredRC) return null;
    const def = buildingsById[activeBuildingId];
    if (!def || !Number.isFinite(def.radius) || def.radius <= 0) return null;
    const [row, col] = hoveredRC;
    return { row, col, radius: def.radius };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBuildingId, hoveredTile]);

  let radiusBox = null;
  if (radiusOverlay) {
    const { row, col, radius } = radiusOverlay;
    const left = Math.max(0, col - radius);
    const top = Math.max(0, row - radius);
    const right = Math.min(COLS - 1, col + radius);
    const bottom = Math.min(ROWS - 1, row + radius);
    const spanCols = right - left + 1;
    const spanRows = bottom - top + 1;
    radiusBox = {
      leftPct: (left / COLS) * 100,
      topPct: (top / ROWS) * 100,
      widthPct: (spanCols / COLS) * 100,
      heightPct: (spanRows / ROWS) * 100,
      spanCols,
      spanRows,
      people: Math.round(popInRadius(stats.tileStats, row, col, radius)),
    };
  }

  function handleTileClick(row, col) {
    const key = `${row},${col}`;
    const type = map.tiles[row][col].type;

    // A move is in progress: this click either drops the picked-up
    // building here, or (clicking its own origin tile again) cancels.
    if (moveFrom) {
      if (row === moveFrom.row && col === moveFrom.col) {
        cancelMove();
      } else {
        proposeMove(row, col);
      }
      return;
    }

    if (!selectedBuilding && damagedTiles[key]) {
      proposeRepair(row, col);
      return;
    }
    if (!selectedBuilding && type === "slum" && !slumUpgraded.has(key)) {
      proposeRehouse(row, col);
      return;
    }
    if (!selectedBuilding && treasureRevealed && !treasureClaimed && treasureTile && row === treasureTile[0] && col === treasureTile[1] && !placed[key]) {
      proposeClaimTreasure();
      return;
    }
    // Clicking an already-placed building (with nothing selected from
    // the palette) picks it up to relocate it -- rules.md's new "move a
    // building" mechanic, 10% of its cost, service coverage recomputed
    // fresh from wherever it lands.
    if (!selectedBuilding && placed[key]) {
      beginMove(row, col);
      return;
    }
    if (selectedBuilding && !placed[key]) {
      proposePlacement(row, col);
    }
  }

  // Live validation while dragging/hovering with a building selected, or
  // while a picked-up building is looking for a new home -- runs the
  // exact canPlace() check the drop/click will make, so the green/red
  // overlay never promises something the drop can't do.
  const dropPreview = moveFrom
    ? hoveredTile
      ? previewMove(...hoveredTile.split(",").map(Number))
      : null
    : selectedBuilding && hoveredTile
    ? previewPlacement(...hoveredTile.split(",").map(Number))
    : null;

  function handleDragOver(row, col, e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const key = `${row},${col}`;
    if (hoveredTile !== key) hoverTile(key);
  }

  function handleDrop(row, col, e) {
    e.preventDefault();
    if (selectedBuilding) proposePlacement(row, col);
    clearHover();
  }

  let dropBox = null;
  if (dropPreview && hoveredRC) {
    const [row, col] = hoveredRC;
    dropBox = {
      leftPct: (col / COLS) * 100,
      topPct: (row / ROWS) * 100,
      widthPct: 100 / COLS,
      heightPct: 100 / ROWS,
      chipAbove: row > 0,
    };
  }

  const hoveredKey = hoveredTile;
  const hoveredTileStat = hoveredKey ? stats.tileStats[hoveredKey] : null;
  const showTooltip = !selectedBuilding && !moveFrom && hoveredTileStat && hoveredTileStat.pop > 0;

  const hoveredIsUnupgradedSlum =
    !selectedBuilding &&
    !moveFrom &&
    hoveredRC &&
    map.tiles[hoveredRC[0]][hoveredRC[1]].type === "slum" &&
    !slumUpgraded.has(hoveredKey);

  const hoveredIsUnclaimedTreasure =
    !selectedBuilding &&
    !moveFrom &&
    hoveredRC &&
    treasureRevealed &&
    !treasureClaimed &&
    treasureTile &&
    hoveredRC[0] === treasureTile[0] &&
    hoveredRC[1] === treasureTile[1];

  const hoveredDamage =
    !selectedBuilding && !moveFrom && hoveredKey ? damagedTiles[hoveredKey] || null : null;

  const selectedDef = selectedBuilding ? buildingsById[selectedBuilding] : null;
  const movingDef = moveFrom ? buildingsById[moveFrom.buildingId] : null;
  const moveFeeCr = movingDef ? movingDef.cost * config.moveCostRate : 0;

  const legendItem = "flex items-center gap-[5px] text-[11px] text-[#3f3a33]";
  const legendSwatch = "w-[9px] h-[9px] rounded-[1px] shrink-0";

  return (
    <section className="grid grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] gap-2 min-h-0 min-w-0">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-0.5 min-w-0">
        <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[color:var(--game-mute)]">
          City grid — {COLS} × {ROWS}
        </span>
        <span className="w-px h-3 bg-[color:var(--game-rule)]" />
        <span className={legendItem}>
          <span className={`${legendSwatch} bg-[color:var(--game-ok)]`} />
          legal placement
        </span>
        <span className={legendItem}>
          <span className={`${legendSwatch} bg-[color:var(--game-bad)]`} />
          blocked
        </span>
        <span className={legendItem}>
          <span className={`${legendSwatch} bg-[#c9d6e2] border border-[#6b8aa3]`} />
          service radius
        </span>
        <span className="flex-1" />
        {selectedDef && (
          <span className="flex items-center gap-[5px] px-2 py-[3px] bg-[#f4e9c9] border border-[#d8c48c] rounded-sm text-[10px] font-semibold text-[#6b5a1e]">
            <CursorClick size={12} weight="duotone" />
            Placing: {selectedDef.name}
          </span>
        )}
        {movingDef && (
          <span className="flex items-center gap-[5px] px-2 py-[3px] bg-[#dbe6f0] border border-[#a9bccd] rounded-sm text-[10px] font-semibold text-[#2b4c6f]">
            <ArrowsOutCardinal size={12} weight="duotone" />
            Moving: {movingDef.name} — pick a tile (₹{fmtCr(moveFeeCr)} Cr fee), or click it again to cancel
          </span>
        )}
      </div>

      <div className="cw3-board-wrap flex items-center justify-center min-h-0 min-w-0">
        <div className="cw3-board relative border-2 border-[color:var(--game-ink)] rounded-[3px] overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-[repeat(16,1fr)] grid-rows-[repeat(12,1fr)]">
            {map.tiles.map((rowTiles, row) =>
              rowTiles.map((tile, col) => {
                const key = `${row},${col}`;
                const isTreasure = treasureRevealed && treasureTile && row === treasureTile[0] && col === treasureTile[1];
                return (
                  <TileV3
                    key={key}
                    row={row}
                    col={col}
                    tile={tile}
                    buildingId={placed[key] || null}
                    previewBuildingId={hoveredTile === key ? selectedBuilding : null}
                    tileStat={stats.tileStats[key]}
                    upgraded={slumUpgraded.has(key)}
                    damaged={!!damagedTiles[key]}
                    isMoveSource={!!moveFrom && moveFrom.row === row && moveFrom.col === col}
                    isTreasure={isTreasure}
                    isTreasureClaimed={treasureClaimed}
                    onClick={() => handleTileClick(row, col)}
                    onMouseEnter={() => hoverTile(key)}
                    onMouseLeave={clearHover}
                    onDragOver={(e) => handleDragOver(row, col, e)}
                    onDrop={(e) => handleDrop(row, col, e)}
                  />
                );
              })
            )}
          </div>

          {radiusBox && (
            <>
              <div
                className="cw3-radius-ghost"
                style={{
                  left: `${radiusBox.leftPct}%`,
                  top: `${radiusBox.topPct}%`,
                  width: `${radiusBox.widthPct}%`,
                  height: `${radiusBox.heightPct}%`,
                }}
              />
              <div
                className="cw3-radius-caption"
                style={{ left: `${radiusBox.leftPct}%`, top: `${radiusBox.topPct}%` }}
              >
                covers {radiusBox.spanCols} × {radiusBox.spanRows} · {radiusBox.people.toLocaleString("en-IN")} people
              </div>
            </>
          )}

          {dropBox && (
            <>
              <div
                className={`cw3-drop-target cw3-drop-target--${dropPreview.ok ? "legal" : "illegal"}`}
                style={{
                  left: `${dropBox.leftPct}%`,
                  top: `${dropBox.topPct}%`,
                  width: `${dropBox.widthPct}%`,
                  height: `${dropBox.heightPct}%`,
                }}
              />
              <div
                className={`cw3-drop-chip cw3-drop-chip--${dropPreview.ok ? "legal" : "illegal"}`}
                style={{
                  left: `${dropBox.leftPct}%`,
                  top: dropBox.chipAbove ? `${dropBox.topPct}%` : `${dropBox.topPct + dropBox.heightPct}%`,
                  transform: dropBox.chipAbove ? "translateY(calc(-100% - 4px))" : "translateY(4px)",
                }}
              >
                {dropPreview.ok ? (
                  <>
                    <CheckCircle size={"1.9cqw"} weight="duotone" />
                    Buildable — {colLabel(...hoveredRC)}
                  </>
                ) : (
                  <>
                    <Prohibit size={"1.9cqw"} weight="duotone" />
                    {dropPreview.reason.charAt(0).toUpperCase() + dropPreview.reason.slice(1)}
                  </>
                )}
              </div>
            </>
          )}

          {(hoveredDamage || hoveredIsUnupgradedSlum || hoveredIsUnclaimedTreasure) && (
            <div
              className="cw3-chip-stack"
              style={{
                left: `${(hoveredRC[1] / COLS) * 100}%`,
                top: hoveredRC[0] > 0 ? `${(hoveredRC[0] / ROWS) * 100}%` : `${((hoveredRC[0] + 1) / ROWS) * 100}%`,
                transform: hoveredRC[0] > 0 ? "translateY(calc(-100% - 4px))" : "translateY(4px)",
              }}
            >
              {hoveredDamage && (
                <button
                  type="button"
                  className="cw3-rehouse-chip cw3-chip--repair"
                  onClick={(e) => {
                    e.stopPropagation();
                    proposeRepair(hoveredRC[0], hoveredRC[1]);
                  }}
                >
                  <Wrench size={"1.8cqw"} weight="duotone" />
                  Repair flood damage — ₹{fmtCr(hoveredDamage.repairCost)} Cr
                </button>
              )}

              {hoveredIsUnupgradedSlum && (
                <button
                  type="button"
                  className="cw3-rehouse-chip cw3-chip--rehouse"
                  onClick={(e) => {
                    e.stopPropagation();
                    proposeRehouse(hoveredRC[0], hoveredRC[1]);
                  }}
                >
                  <ArrowFatLinesUp size={"1.8cqw"} weight="duotone" />
                  Rehouse slum — ₹{config.slumUpgradeCost} Cr
                </button>
              )}

              {hoveredIsUnclaimedTreasure && (
                <button
                  type="button"
                  className="cw3-rehouse-chip cw3-chip--treasure"
                  onClick={(e) => {
                    e.stopPropagation();
                    proposeClaimTreasure();
                  }}
                >
                  Claim treasure — net ₹
                  {fmtCr(300 - 50 - (placed[hoveredKey] ? Math.round(buildingsById[placed[hoveredKey]].cost * 0.5) : 0))} Cr
                </button>
              )}
            </div>
          )}

          {showTooltip && (
            <TileTooltip
              row={hoveredRC[0]}
              col={hoveredRC[1]}
              tileStat={hoveredTileStat}
              buildingId={placed[hoveredKey] || null}
              upgraded={slumUpgraded.has(hoveredKey)}
              placed={placed}
            />
          )}

          <div className="cw3-plate">
            <span className="cw3-plate-text">Y{year} · plate</span>
            <span className="cw3-plate-mark" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-0.5 min-w-0">
        <span className="flex items-center gap-1.5 text-[11px] text-[#6b6459]">
          <span className="flex gap-0.5">
            <span className="w-[5px] h-[5px] rounded-full bg-[color:var(--game-ok)]" />
            <span className="w-[5px] h-[5px] rounded-full bg-[color:var(--game-ok)]" />
            <span className="w-[5px] h-[5px] rounded-full bg-[color:var(--game-ok)]" />
            <span className="w-[5px] h-[5px] rounded-full border border-[color:var(--game-paper)] bg-white/25" />
          </span>
          service pips under each home — filled = served
        </span>
        <span className="flex-1" />
        <span className="flex items-center gap-1.5 text-[11px] text-[#6b6459]">
          <span className="cw3-caption-lowlying-swatch" />
          low-lying / flood risk
        </span>
      </div>
    </section>
  );
}

export default CityGridV3;
