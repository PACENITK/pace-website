import React, { useMemo, useState } from "react";
import { CaretDown, CaretUp, CaretLeft, CaretRight, WarningDiamond, ArrowFatLinesUp } from "@phosphor-icons/react";
import { useActiveGameStore } from "../store/GameStoreContext.jsx";
import useCityStats from "../store/useCityStats.js";
import { SERVICES, SERVICE_LABEL, SERVICE_ICON } from "../data/serviceMeta.js";
import { BUILDING_ICON } from "../data/buildingMeta.js";
import {
  computeServicePopulation,
  computeServiceCapacity,
  computeServiceStatus,
  computeNeeds,
  computeRiskWatch,
  computeBuiltChips,
} from "../selectors/cityStatus.js";

const STATUS_STYLE = {
  ok: "bg-[#e7f0e2] border-[#b9cfae] text-[#2e5c22]",
  short: "bg-[#f7efdc] border-[#dfcb9a] text-[#7a5c14]",
  "at cap": "bg-[#eef2f6] border-[#bacbd8] text-[color:var(--game-slate-dk)]",
  critical: "bg-[#f8ecea] border-[#d9a9a4] text-[#8f1e18]",
};

function nf(n) {
  return Math.round(n).toLocaleString("en-IN");
}

// Replaces the old ScorePanel -- the design's explicit product decision
// is that teams see population/service/needs status, never the live
// score ("scoring sealed until Year 5"); the score itself still exists
// under the hood for the Organizer Console, untouched by this screen.
function CityStatusPanel({ collapsed, onToggleCollapse }) {
  const placed = useActiveGameStore((s) => s.placed);
  const map = useActiveGameStore((s) => s.map);
  const slumUpgraded = useActiveGameStore((s) => s.slumUpgraded);
  const stats = useCityStats();
  const [openNeed, setOpenNeed] = useState(null);

  const ledgerRows = useMemo(
    () =>
      SERVICES.map((service) => {
        const { servedPop, demandPop, demandUnits } = computeServicePopulation(stats.tileStats, service);
        const capacityPop = computeServiceCapacity(placed, service, demandPop, demandUnits);
        const status = computeServiceStatus({ servedPop, demandPop, capacityPop });
        return { service, servedPop, demandPop, capacityPop, status };
      }),
    [stats, placed]
  );

  const needs = useMemo(() => computeNeeds(stats, placed, slumUpgraded, map), [stats, placed, slumUpgraded, map]);
  const riskLines = useMemo(() => computeRiskWatch(stats, placed, map), [stats, placed, map]);
  const builtChips = useMemo(() => computeBuiltChips(placed), [placed]);

  const inheritedSlumPop = Object.values(stats.tileStats).reduce((sum, t) => sum + (t.isSlum ? t.pop : 0), 0);
  const missingPop = stats.totalPop - stats.fullyServedPop;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapse}
        title="Expand city status"
        className="cw3-panel bg-[color:var(--game-paper)] border border-[color:var(--game-rule)] flex flex-col items-center pt-3 gap-2 cursor-pointer text-[color:var(--game-mute)] hover:text-[color:var(--game-ink)]"
      >
        <CaretLeft size={14} weight="duotone" />
      </button>
    );
  }

  return (
    <div className="cw3-panel bg-[color:var(--game-paper)] border border-[color:var(--game-rule)] overflow-y-auto min-h-0">
      <div className="sticky top-0 z-[2] px-3.5 pt-2.5 pb-2 bg-[color:var(--game-paper)] border-b-2 border-[color:var(--game-ink)]">
        <div className="flex items-baseline justify-between gap-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse city status"
            className="text-[color:var(--game-mute)] hover:text-[color:var(--game-ink)] flex shrink-0 cursor-pointer mr-0.5"
          >
            <CaretRight size={12} weight="duotone" />
          </button>
          <span className="text-[13px] font-bold tracking-[0.02em] flex-1">City status</span>
          <span className="text-[10px] text-[color:var(--game-mute)] text-right shrink-0">
            scoring sealed until Year 5
          </span>
        </div>
      </div>

      <div className="px-3.5 pt-3 pb-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="py-2 px-2.5 bg-[color:var(--game-paper-2)] border border-[#e2ddd0] rounded-sm min-w-0">
            <div className="text-[8.5px] font-semibold tracking-[0.16em] uppercase text-[color:var(--game-mute)] mb-1">
              Population
            </div>
            <div className="text-[19px] font-bold tabular-nums">{nf(stats.totalPop)}</div>
            <div className="text-[10px] leading-[1.3] text-[#6b6459] mt-0.5">{nf(inheritedSlumPop)} inherited slum</div>
          </div>
          <div className="py-2 px-2.5 bg-[color:var(--game-paper-2)] border border-[#e2ddd0] rounded-sm min-w-0">
            <div className="text-[8.5px] font-semibold tracking-[0.16em] uppercase text-[color:var(--game-mute)] mb-1">
              Fully served
            </div>
            <div className="flex items-baseline gap-[3px]">
              <span className="text-[19px] font-bold tabular-nums text-[color:var(--game-ok)]">
                {nf(stats.fullyServedPop)}
              </span>
              <span className="text-[11px] text-[color:var(--game-mute)]">/ {nf(stats.totalPop)}</span>
            </div>
            <div className="text-[10px] leading-[1.3] text-[color:var(--game-rust)] mt-0.5">
              {nf(missingPop)} missing ≥1 service
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2 gap-2">
            <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[color:var(--game-mute)]">
              Service ledger
            </span>
            <span className="text-[9.5px] text-[#a09684] text-right">served / demand · spare capacity</span>
          </div>
          <div className="flex flex-col gap-[7px]">
            {ledgerRows.map(({ service, servedPop, demandPop, capacityPop, status }) => {
              const Icon = SERVICE_ICON[service];
              const critical = status === "critical";
              const servedPct = demandPop > 0 ? Math.min(100, (servedPop / demandPop) * 100) : 0;
              const capPct =
                demandPop > 0
                  ? Math.max(0, Math.min(100 - servedPct, ((capacityPop - servedPop) / demandPop) * 100))
                  : 0;
              return (
                <div className="grid grid-cols-[16px_1fr_auto] items-center gap-2" key={service}>
                  <span
                    className={`flex ${critical ? "text-[color:var(--game-rust)]" : "text-[color:var(--game-slate)]"}`}
                  >
                    <Icon size={15} weight="duotone" />
                  </span>
                  <span className="flex flex-col gap-[3px] min-w-0">
                    <span className="flex items-baseline justify-between gap-1.5">
                      <span className="text-[11.5px]">{SERVICE_LABEL[service]}</span>
                      <span
                        className={`text-[11px] font-semibold tabular-nums whitespace-nowrap ${
                          critical ? "text-[#8f1e18]" : "text-[#201e1d]"
                        }`}
                      >
                        {nf(servedPop)} <span className="text-[#a09684]">/ {nf(demandPop)}</span>
                      </span>
                    </span>
                    <span className="cw3-ledger-track">
                      <span
                        className={`cw3-ledger-served ${critical ? "cw3-ledger-served--critical" : ""}`}
                        style={{ width: `${servedPct}%` }}
                      />
                      <span className="cw3-ledger-cap" style={{ left: `${servedPct}%`, width: `${capPct}%` }} />
                    </span>
                  </span>
                  <span
                    className={`shrink-0 min-w-[52px] text-center px-[5px] py-[2px] rounded-sm border text-[9px] font-semibold tracking-[0.06em] uppercase ${STATUS_STYLE[status]}`}
                  >
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2.5 mt-2 text-[9.5px] text-[color:var(--game-mute)]">
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-[5px] rounded-[3px] bg-[color:var(--game-slate)]" />
              served
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-[5px] rounded-[3px] cw3-ledger-legend-swatch--cap" />
              spare capacity, out of range
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[color:var(--game-mute)]">
              Open needs
            </span>
            <span className="flex items-center gap-1 px-[7px] py-[2px] bg-[#f8ecea] border border-[#d9a9a4] rounded-sm text-[9.5px] font-semibold text-[#8f1e18] whitespace-nowrap">
              {needs.length} unresolved
            </span>
          </div>
          <div className="flex flex-col gap-px">
            {needs.length === 0 && (
              <div className="px-2.5 py-2 text-[11px] leading-[1.4] text-[color:var(--game-mute)]">
                No open needs — every populated tile is fully served.
              </div>
            )}
            {needs.map((n) => {
              const open = openNeed === n.key;
              const Icon = n.icon === "rehouse" ? ArrowFatLinesUp : SERVICE_ICON[n.icon];
              return (
                <button
                  type="button"
                  key={n.key}
                  className={`grid grid-cols-[18px_1fr] gap-2 px-[9px] py-2 rounded-sm text-left w-full transition-colors duration-150 border ${
                    open
                      ? "bg-[#f2f6f9] border-[#a9bccd]"
                      : "bg-[color:var(--game-paper-2)] border-[#e2ddd0] hover:bg-[#f2f6f9] hover:border-[#a9bccd]"
                  }`}
                  onClick={() => setOpenNeed(open ? null : n.key)}
                >
                  <span className="text-[color:var(--game-rust)] mt-px flex">
                    <Icon size={16} weight="duotone" />
                  </span>
                  <span className="flex flex-col gap-[3px] min-w-0">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[11.5px] font-semibold leading-[1.2]">{n.where}</span>
                      <span className="text-[10px] text-[color:var(--game-mute)] tabular-nums">{nf(n.pop)} people</span>
                      <span className="flex-1" />
                      <span className="text-[#a09684] shrink-0 flex">
                        {open ? <CaretUp size={12} weight="duotone" /> : <CaretDown size={12} weight="duotone" />}
                      </span>
                    </span>
                    {open && (
                      <span className="flex flex-col gap-[3px] min-w-0">
                        <span className="text-[11px] leading-[1.35] text-[#5c5548]" style={{ textWrap: "pretty" }}>
                          {n.why}
                        </span>
                        <span className="inline-flex items-center self-start gap-1 mt-0.5 px-1.5 py-[2px] bg-[#eef2f6] border border-[#cddbe5] rounded-sm text-[10px] font-semibold text-[color:var(--game-slate-dk)]">
                          {n.fix}
                        </span>
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[color:var(--game-mute)] mb-2">
            Built this far
          </div>
          <div className="flex flex-wrap gap-1">
            {builtChips.length === 0 && (
              <span className="text-[11px] text-[color:var(--game-mute)]">Nothing built yet.</span>
            )}
            {builtChips.map((b) => {
              const Icon = BUILDING_ICON[b.id];
              return (
                <span
                  key={b.id}
                  className="flex items-center gap-1 px-[7px] py-[3px] bg-[#eae6da] border border-[color:var(--game-rule)] rounded-sm text-[10.5px] text-[#3f3a33]"
                >
                  {Icon && <Icon size={12} weight="duotone" className="text-[color:var(--game-slate)]" />}
                  {b.name} × {b.count}
                </span>
              );
            })}
          </div>
        </div>

        {riskLines.length > 0 && (
          <div className="py-[10px] px-[11px] bg-[#eef1e4] border border-[#cdd4b8] rounded-sm">
            <div className="flex items-center gap-1.5 mb-[5px]">
              <WarningDiamond size={15} weight="duotone" className="text-[color:var(--game-rust)]" />
              <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#5c5548]">Risk watch</span>
            </div>
            {riskLines.map((line, i) => (
              <div key={i} className="text-[11.5px] leading-[1.45] text-[#3f3a33]" style={{ textWrap: "pretty" }}>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CityStatusPanel;
