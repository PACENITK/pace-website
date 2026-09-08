import React, { useMemo } from "react";
import { CaretDown, LockSimple, HandGrabbing, DotsSixVertical, TrendUp } from "@phosphor-icons/react";
import useGameStore from "../store/useGameStore.js";
import { buildingsById, CATEGORY, config } from "../engine.js";
import { BUILDING_ICON } from "../data/buildingMeta.js";
import { formatBuildingNote, fmtCr } from "../format.js";

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

// The treasury card's 4-bucket spend breakdown -- folds Protection into
// Essentials (both are city infrastructure) and Industry into Economy
// (the card's own legend already reads "Economy & industry"), computed
// straight from what's actually been placed rather than any sample data.
const SPEND_BUCKETS = [
  { label: "Essentials", categories: [CATEGORY.ESSENTIAL, CATEGORY.PROTECTION] },
  { label: "Housing", categories: [CATEGORY.RESIDENTIAL] },
  { label: "Transport", categories: [CATEGORY.TRANSPORT] },
  { label: "Economy & industry", categories: [CATEGORY.ECONOMY, CATEGORY.INDUSTRY] },
];
const BAR_SEG_COLORS = ["#c9d6e2", "#a9bccd", "#8fa8bd", "#6b8aa3"];

function useTreasury(placed) {
  return useMemo(() => {
    const defs = Object.values(placed).map((id) => buildingsById[id]);
    const grossIncome = defs.reduce((sum, def) => sum + def.yearly, 0);
    const buckets = SPEND_BUCKETS.map(({ label, categories }) => ({
      label,
      spend: defs.filter((def) => categories.includes(def.category)).reduce((sum, def) => sum + def.cost, 0),
    }));
    const totalSpend = buckets.reduce((sum, b) => sum + b.spend, 0);
    return { grossIncome, buckets, totalSpend };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed]);
}

function BuildingCard({ def, cash, locked, selectedBuilding, onSelect, onBeginDrag }) {
  const Icon = BUILDING_ICON[def.id];
  const affordable = cash >= def.cost;
  const dim = locked || !affordable;
  const classes = [
    "cw3-card",
    dim ? "cw3-card--dim" : "",
    !affordable && !locked ? "cw3-card--unaffordable" : "",
    locked ? "cw3-card--locked" : "",
    selectedBuilding === def.id ? "cw3-card--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const note = locked ? "Unlocks Year 1" : !affordable ? `Short ₹${fmtCr(def.cost - cash)} Cr` : formatBuildingNote(def);

  return (
    <button
      type="button"
      className={classes}
      disabled={dim}
      draggable={!dim}
      title={def.name}
      onClick={() => !dim && onSelect(def.id)}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", def.id);
        e.dataTransfer.effectAllowed = "copy";
        onBeginDrag(def.id);
      }}
    >
      <span className="cw3-card-grip">
        <DotsSixVertical size={13} weight="duotone" />
      </span>
      <span className="cw3-card-thumb">{Icon && <Icon size={17} weight="duotone" />}</span>
      <span className="cw3-card-info">
        <span className="cw3-card-name">{def.name}</span>
        <span className={`cw3-card-note${!locked && !affordable ? " cw3-card-note--rust" : ""}`}>{note}</span>
      </span>
      <span
        className={`cw3-card-cost${!locked && !affordable ? " cw3-card-cost--rust" : ""}${
          locked ? " cw3-card-cost--locked" : ""
        }`}
      >
        ₹{fmtCr(def.cost)} Cr
      </span>
    </button>
  );
}

function BuildingPalette() {
  const year = useGameStore((s) => s.year);
  const cash = useGameStore((s) => s.cash);
  const placed = useGameStore((s) => s.placed);
  const selectedBuilding = useGameStore((s) => s.selectedBuilding);
  const selectBuilding = useGameStore((s) => s.selectBuilding);
  const beginDrag = useGameStore((s) => s.beginDrag);
  const lastError = useGameStore((s) => s.lastError);
  const { grossIncome, buckets, totalSpend } = useTreasury(placed);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-2.5 min-h-0 min-w-0">
      <div className="cw3-treasury-bg rounded-[3px] border border-[#16283c] pt-3 px-3.5 pb-[11px] text-[#fffdf6]">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[#a9bccd]">Treasury</span>
          <span className="text-[10px] text-[#a9bccd] tabular-nums">of ₹{fmtCr(config.startingBudget)} Cr</span>
        </div>
        <div className="flex items-baseline gap-[5px]">
          <span className="text-[22px] text-[#c9d6e2]">₹</span>
          <span className="text-[40px] font-bold leading-[0.92] text-[#fffdf6] tabular-nums tracking-[-0.01em]">
            {Math.round(cash)}
          </span>
          <span className="text-sm font-semibold text-[#c9d6e2]">Cr</span>
          <span
            className={`ml-auto flex items-center gap-1 text-xs font-semibold tabular-nums whitespace-nowrap ${
              grossIncome >= 0 ? "text-[#8fd694]" : "text-[#f2a49a]"
            }`}
          >
            <TrendUp size={14} weight="duotone" style={grossIncome < 0 ? { transform: "scaleY(-1)" } : undefined} />
            {grossIncome >= 0 ? "+" : ""}
            {fmtCr(grossIncome)} / yr
          </span>
        </div>
        <div className="flex h-[5px] rounded-[3px] overflow-hidden mt-2.5 mb-1.5 bg-white/[0.16]">
          {buckets.map((b, i) => (
            <span
              key={b.label}
              style={{ width: `${totalSpend > 0 ? (b.spend / totalSpend) * 100 : 0}%`, background: BAR_SEG_COLORS[i] }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] leading-[1.4] text-[#c9d6e2] tabular-nums">
          {buckets.map((b) => (
            <span key={b.label}>
              {b.label} ₹{fmtCr(b.spend)}
            </span>
          ))}
        </div>
      </div>

      <div className="cw3-panel bg-[color:var(--game-paper)] border border-[color:var(--game-rule)] overflow-y-auto min-h-0">
        <div className="sticky top-0 z-[2] flex items-center justify-between px-3 pt-[9px] pb-2 bg-[color:var(--game-paper)] border-b border-[color:var(--game-rule)]">
          <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[color:var(--game-mute)]">
            Building palette
          </span>
          <span className="flex items-center gap-1 text-[9.5px] text-[color:var(--game-rust)]">
            <HandGrabbing size={13} weight="duotone" />
            drag to place
          </span>
        </div>
        {lastError && (
          <div className="mx-2.5 mt-2 px-2 py-1.5 bg-[#f8ecea] border border-[#d9a9a4] rounded-sm text-[11px] leading-[1.35] text-[#8f1e18]">
            {lastError}
          </div>
        )}

        <div className="px-2.5 pt-1 pb-3 flex flex-col gap-0.5">
          {CATEGORY_ORDER.map(({ key, label, unlockYear }) => {
            const locked = year < unlockYear;
            const defs = buildingsByCategory[key];
            return (
              <React.Fragment key={key}>
                <div className={`flex items-center gap-2 pt-[13px] pb-[5px] px-0.5 ${locked ? "opacity-70" : ""}`}>
                  <span className="text-[12px] text-[color:var(--game-mute)] shrink-0 flex">
                    {locked ? <LockSimple size={12} weight="duotone" /> : <CaretDown size={12} weight="duotone" />}
                  </span>
                  <span className="text-[11px] font-bold tracking-[0.1em] uppercase">{label}</span>
                  <span className="flex-1 h-px bg-[color:var(--game-rule)]" />
                  {locked ? (
                    <span className="px-1.5 py-0.5 bg-[#eae6da] border border-[color:var(--game-rule)] rounded-sm text-[8.5px] font-semibold tracking-[0.1em] uppercase text-[color:var(--game-mute)]">
                      Unlocks Y1
                    </span>
                  ) : (
                    <span className="text-[9.5px] text-[#a09684]">{defs.length}</span>
                  )}
                </div>
                {defs.map((def) => (
                  <BuildingCard
                    key={def.id}
                    def={def}
                    cash={cash}
                    locked={locked}
                    selectedBuilding={selectedBuilding}
                    onSelect={selectBuilding}
                    onBeginDrag={beginDrag}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BuildingPalette;
