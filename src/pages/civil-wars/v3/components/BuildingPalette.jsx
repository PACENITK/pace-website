import React, { useMemo, useState } from "react";
import { CaretDown, CaretLeft, CaretRight, HandGrabbing, DotsSixVertical, TrendUp } from "@phosphor-icons/react";
import { useActiveGameStore } from "../store/GameStoreContext.jsx";
import { buildingsById, CATEGORY, config } from "../engine.js";
import { BUILDING_ICON } from "../data/buildingMeta.js";
import { formatBuildingNote, fmtCr } from "../format.js";

// v4: nothing is year-gated anymore -- 22 buildings is a lot to scan
// on turn one, but gating it behind an unlock-year rule blocks a
// genuinely good early move (an early railway pays back by Year 5) for
// a UI problem, not a rules one. Two tabs instead: "Essentials" is
// exactly the survival set (everything needed to meet the mandatory
// floor and serve the inherited city), "Economy" is the rest -- city-
// wide transport and every commercial/industry building, none of
// which are sensibly affordable or usable before a team has a city to
// grow from anyway.
const TAB_CATEGORY_ORDER = {
  essentials: [
    { key: CATEGORY.PROTECTION, label: "Protection" },
    { key: CATEGORY.ESSENTIAL, label: "Essentials" },
    { key: CATEGORY.RESIDENTIAL, label: "Residential" },
  ],
  economy: [
    { key: CATEGORY.TRANSPORT, label: "Transport" },
    { key: CATEGORY.ECONOMY, label: "Economy" },
    { key: CATEGORY.INDUSTRY, label: "Industry" },
  ],
};

// bus_stand is the one Transport building that belongs in Essentials
// (every other essential-service building needs it as a prerequisite
// chain root); railway/metro/airport are city-scale investments that
// belong with the rest of Economy.
function tabFor(def) {
  if (def.category === CATEGORY.TRANSPORT) return def.id === "bus_stand" ? "essentials" : "economy";
  if (def.category === CATEGORY.ECONOMY || def.category === CATEGORY.INDUSTRY) return "economy";
  return "essentials";
}

const buildingsByCategory = Object.values(buildingsById).reduce((acc, def) => {
  (acc[def.category] ||= []).push(def);
  return acc;
}, {});
const essentialsBusStand = [buildingsById.bus_stand];
const economyTransport = Object.values(buildingsById).filter((d) => d.category === CATEGORY.TRANSPORT && d.id !== "bus_stand");

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

function BuildingCard({ def, cash, selectedBuilding, onSelect, onBeginDrag }) {
  const Icon = BUILDING_ICON[def.id];
  const affordable = cash >= def.cost;
  const dim = !affordable;
  const classes = [
    "cw3-card",
    dim ? "cw3-card--dim cw3-card--unaffordable" : "",
    selectedBuilding === def.id ? "cw3-card--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const note = !affordable ? `Short ₹${fmtCr(def.cost - cash)} Cr` : formatBuildingNote(def);

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
        <span className={`cw3-card-note${!affordable ? " cw3-card-note--rust" : ""}`}>{note}</span>
      </span>
      <span className={`cw3-card-cost${!affordable ? " cw3-card-cost--rust" : ""}`}>₹{fmtCr(def.cost)} Cr</span>
    </button>
  );
}

function BuildingPalette({ collapsed, onToggleCollapse }) {
  const [tab, setTab] = useState("essentials");
  const cash = useActiveGameStore((s) => s.cash);
  const placed = useActiveGameStore((s) => s.placed);
  const selectedBuilding = useActiveGameStore((s) => s.selectedBuilding);
  const selectBuilding = useActiveGameStore((s) => s.selectBuilding);
  const beginDrag = useActiveGameStore((s) => s.beginDrag);
  const lastError = useActiveGameStore((s) => s.lastError);
  const { grossIncome, buckets, totalSpend } = useTreasury(placed);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapse}
        title="Expand building palette"
        className="cw3-panel bg-[color:var(--game-paper)] border border-[color:var(--game-rule)] flex flex-col items-center pt-3 gap-2 cursor-pointer text-[color:var(--game-mute)] hover:text-[color:var(--game-ink)]"
      >
        <CaretRight size={14} weight="duotone" />
      </button>
    );
  }

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
        <div className="sticky top-0 z-[2] flex items-center justify-between gap-2 px-3 pt-[9px] pb-2 bg-[color:var(--game-paper)] border-b border-[color:var(--game-rule)]">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse building palette"
            className="text-[color:var(--game-mute)] hover:text-[color:var(--game-ink)] flex shrink-0 cursor-pointer"
          >
            <CaretLeft size={12} weight="duotone" />
          </button>
          <span className="flex items-center gap-1 text-[9.5px] text-[color:var(--game-rust)] shrink-0">
            <HandGrabbing size={13} weight="duotone" />
            drag to place
          </span>
        </div>
        <div className="sticky top-[33px] z-[2] flex bg-[color:var(--game-paper)] border-b border-[color:var(--game-rule)]">
          {[
            { key: "essentials", label: "Essentials" },
            { key: "economy", label: "Economy" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-[10px] font-bold tracking-[0.1em] uppercase cursor-pointer border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-[color:var(--game-slate)] text-[color:var(--game-ink)]"
                  : "border-transparent text-[color:var(--game-mute)] hover:text-[color:var(--game-ink)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {lastError && (
          <div className="mx-2.5 mt-2 px-2 py-1.5 bg-[#f8ecea] border border-[#d9a9a4] rounded-sm text-[11px] leading-[1.35] text-[#8f1e18]">
            {lastError}
          </div>
        )}

        <div className="px-2.5 pt-1 pb-3 flex flex-col gap-0.5">
          {TAB_CATEGORY_ORDER[tab].map(({ key, label }) => {
            const defs = key === CATEGORY.TRANSPORT ? (tab === "essentials" ? essentialsBusStand : economyTransport) : buildingsByCategory[key];
            return (
              <React.Fragment key={key}>
                <div className="flex items-center gap-2 pt-[13px] pb-[5px] px-0.5">
                  <span className="text-[12px] text-[color:var(--game-mute)] shrink-0 flex">
                    <CaretDown size={12} weight="duotone" />
                  </span>
                  <span className="text-[11px] font-bold tracking-[0.1em] uppercase">{label}</span>
                  <span className="flex-1 h-px bg-[color:var(--game-rule)]" />
                  <span className="text-[9.5px] text-[#a09684]">{defs.length}</span>
                </div>
                {defs.map((def) => (
                  <BuildingCard
                    key={def.id}
                    def={def}
                    cash={cash}
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
