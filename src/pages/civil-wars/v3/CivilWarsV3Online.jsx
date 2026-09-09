import React, { useState } from "react";
import { Buildings } from "@phosphor-icons/react";
import useNetworkGameStore from "./store/useNetworkGameStore.js";
import { GameStoreContext } from "./store/GameStoreContext.jsx";
import JoinScreen from "./JoinScreen.jsx";
import BuildingPalette from "./components/BuildingPalette.jsx";
import CityGridV3 from "./components/CityGridV3.jsx";
import CityStatusPanel from "./components/CityStatusPanel.jsx";
import TwistModal from "./components/TwistModal.jsx";
import PlacementConfirmModal from "./components/PlacementConfirmModal.jsx";
import "./civil-wars-v3.css";

function CivilWarsV3Board() {
  const teamName = useNetworkGameStore((s) => s.teamName);
  const year = useNetworkGameStore((s) => s.year);
  const locked = useNetworkGameStore((s) => s.locked);
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

        {locked && (
          <div className="flex items-center px-[18px] text-xs font-semibold text-[#8f1e18]">
            Year is ending — building is paused
          </div>
        )}
      </header>

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
