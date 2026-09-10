import React, { useEffect, useState } from "react";
import { Buildings, Timer, Question } from "@phosphor-icons/react";
import { TWIST_RULES } from "./data/twistRules.js";
import useNetworkGameStore from "./store/useNetworkGameStore.js";
import { GameStoreContext } from "./store/GameStoreContext.jsx";
import JoinScreen from "./JoinScreen.jsx";
import BuildingPalette from "./components/BuildingPalette.jsx";
import CityGridV3 from "./components/CityGridV3.jsx";
import CityStatusPanel from "./components/CityStatusPanel.jsx";
import TwistModal from "./components/TwistModal.jsx";
import PlacementConfirmModal from "./components/PlacementConfirmModal.jsx";
import "./civil-wars-v3.css";

function fmtCountdown(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

// Ticks locally between polls (every second) rather than hitting the
// server every second -- practiceEndsAt is a fixed timestamp, so the
// countdown only needs re-syncing on each normal ~2.5s poll.
function PracticeCountdown({ practiceEndsAt }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const remaining = new Date(practiceEndsAt).getTime() - now;
  return (
    <div className="flex items-center gap-2 px-[18px] border-r border-[color:var(--game-rule)] text-[color:var(--game-rust)]">
      <Timer size={16} weight="duotone" />
      <div className="flex flex-col gap-px">
        <div className="text-[8.5px] font-semibold leading-none tracking-[0.16em] uppercase text-[color:var(--game-mute)]">
          Practice ends in
        </div>
        <div className="text-sm font-bold leading-none tabular-nums">
          {remaining > 0 ? fmtCountdown(remaining) : "any moment now"}
        </div>
      </div>
    </div>
  );
}

function CivilWarsV3Board() {
  const teamName = useNetworkGameStore((s) => s.teamName);
  const year = useNetworkGameStore((s) => s.year);
  const locked = useNetworkGameStore((s) => s.locked);
  const phase = useNetworkGameStore((s) => s.phase);
  const practiceEndsAt = useNetworkGameStore((s) => s.practiceEndsAt);
  const practiceJustEnded = useNetworkGameStore((s) => s.practiceJustEnded);
  const dismissPracticeBanner = useNetworkGameStore((s) => s.dismissPracticeBanner);
  const lastTwist = useNetworkGameStore((s) => s.lastTwist);
  const openTwistHelp = useNetworkGameStore((s) => s.openTwistHelp);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <div className="cw3-root">
      <header className="flex items-stretch h-14 bg-[color:var(--game-paper)] border-b-2 border-[color:var(--game-ink)]">
        <div className="flex items-center gap-3.5 px-[18px] border-r border-[color:var(--game-rule)]">
          <div className="w-[26px] h-[26px] border-[1.5px] border-[color:var(--game-ink)] rounded-sm bg-[color:var(--game-slate)] flex items-center justify-center shrink-0 text-[color:var(--game-paper)]">
            <Buildings size={15} weight="duotone" />
          </div>
          <div className="flex flex-col gap-px">
            <div className="text-[17px] font-bold leading-none tracking-[0.02em]">{teamName}</div>
            <div className="text-[8.5px] font-semibold leading-none tracking-[0.2em] uppercase text-[color:var(--game-mute)]">
              Urban Mayhem
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[9px] px-[18px] border-r border-[color:var(--game-rule)]">
          <span className="text-[26px] font-bold leading-none text-[color:var(--game-slate)] tabular-nums">
            Year {year}
          </span>
        </div>

        {phase === "practice" && practiceEndsAt && <PracticeCountdown practiceEndsAt={practiceEndsAt} />}

        {locked && (
          <div className="flex items-center px-[18px] text-xs font-semibold text-[#8f1e18]">
            Year is ending — building is paused
          </div>
        )}

        <div className="flex-1" />

        {lastTwist && (
          <button type="button" className="cw3-twist-help-btn" onClick={openTwistHelp}>
            <Question size={15} weight="duotone" />
            Year {lastTwist.year} rules — {TWIST_RULES[lastTwist.twist]?.title || lastTwist.twist}
          </button>
        )}
      </header>

      {practiceJustEnded && (
        <div className="flex items-center justify-between px-[18px] py-2 bg-[#f4e9c9] border-b border-[#d8c48c] text-sm font-semibold text-[#6b5a1e]">
          <span>Practice is over — the real game has begun. Your board was reset.</span>
          <button type="button" onClick={dismissPracticeBanner} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      <main
        className="grid gap-3 p-3 min-h-0"
        style={{
          gridTemplateColumns: `${leftCollapsed ? "36px" : "minmax(238px,296px)"} minmax(0,1fr) ${
            rightCollapsed ? "36px" : "minmax(262px,340px)"
          }`,
        }}
      >
        <BuildingPalette collapsed={leftCollapsed} onToggleCollapse={() => setLeftCollapsed((c) => !c)} />
        <CityGridV3 />
        <CityStatusPanel collapsed={rightCollapsed} onToggleCollapse={() => setRightCollapsed((c) => !c)} />
      </main>

      <TwistModal />
      <PlacementConfirmModal />
    </div>
  );
}

function CivilWarsV3Online() {
  const joined = useNetworkGameStore((s) => s.joined);

  return (
    <GameStoreContext.Provider value={useNetworkGameStore}>
      {joined ? <CivilWarsV3Board /> : <JoinScreen />}
    </GameStoreContext.Provider>
  );
}

export default CivilWarsV3Online;
