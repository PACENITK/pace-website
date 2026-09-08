import React from "react";
import { Buildings, UsersThree, BookmarkSimple, ArrowCounterClockwise, Sliders } from "@phosphor-icons/react";
import useGameStore from "./store/useGameStore.js";
import { MID_GAME_CHECKPOINT } from "./data/mockGameState.js";
import BuildingPalette from "./components/BuildingPalette.jsx";
import CityGridV3 from "./components/CityGridV3.jsx";
import CityStatusPanel from "./components/CityStatusPanel.jsx";
import TwistModal from "./components/TwistModal.jsx";
import "./civil-wars-v3.css";

const YEARS = [0, 1, 2, 3, 4, 5];

const BTN_BASE =
  "inline-flex items-center gap-1.5 h-[30px] px-[11px] rounded-sm text-xs font-semibold transition-[transform,box-shadow,background-color,border-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--game-slate)] focus-visible:outline-offset-2";
const BTN_SECONDARY =
  "bg-[color:var(--game-paper-2)] border border-[color:var(--game-rule)] text-[color:var(--game-ink)] shadow-[inset_0_1px_0_#fffdf6,0_1px_0_#e2ddd0] hover:border-[color:var(--game-slate)]";
const BTN_GHOST = "bg-transparent border border-[color:var(--game-rule)] text-[#5c5548] hover:border-[color:var(--game-mute)] hover:text-[color:var(--game-ink)]";
const BTN_PRIMARY =
  "bg-[color:var(--game-slate)] border border-[#16283c] text-[color:var(--game-paper)] shadow-[inset_0_1px_0_rgba(255,255,255,.22)] hover:bg-[color:var(--game-slate-dk)]";

function CivilWarsV3() {
  const year = useGameStore((s) => s.year);
  const resetGame = useGameStore((s) => s.resetGame);
  const loadCheckpoint = useGameStore((s) => s.loadCheckpoint);

  return (
    <div className="cw3-root">
      <header className="flex items-stretch h-14 bg-[color:var(--game-paper)] border-b-2 border-[color:var(--game-ink)] shadow-[inset_0_1px_0_#fffdf6,0_2px_8px_rgba(32,28,26,.08)]">
        <div className="flex items-center gap-3.5 px-[18px] border-r border-[color:var(--game-rule)]">
          <div className="w-[26px] h-[26px] border-[1.5px] border-[color:var(--game-ink)] rounded-sm bg-[color:var(--game-slate)] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,.28)] shrink-0 text-[color:var(--game-paper)]">
            <Buildings size={15} weight="duotone" />
          </div>
          <div className="flex flex-col gap-px">
            <div className="text-[17px] font-bold leading-none tracking-[0.02em]">Urban Mayhem</div>
            <div className="text-[8.5px] font-semibold leading-none tracking-[0.2em] uppercase text-[color:var(--game-mute)]">
              Civil Wars III
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 px-[18px] border-r border-[color:var(--game-rule)]">
          <div className="flex items-baseline gap-[9px]">
            <span className="text-[26px] font-bold leading-none text-[color:var(--game-slate)] tabular-nums">
              Year {year}
            </span>
            <span className="text-[9px] font-semibold leading-none tracking-[0.16em] uppercase text-[color:var(--game-mute)]">
              {year === 0 ? "Planning" : "Build phase"}
            </span>
          </div>
          <div className="flex gap-1 items-center">
            {YEARS.map((i) => (
              <span
                key={i}
                className={`h-[7px] rounded-[4px] ${
                  i < year
                    ? "w-[7px] bg-[#6b8aa3]"
                    : i === year
                    ? "w-4 bg-[color:var(--game-slate)]"
                    : "w-[7px] bg-[color:var(--game-rule)]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-[18px] border-r border-[color:var(--game-rule)] text-[color:var(--game-mute)]">
          <UsersThree size={16} weight="duotone" />
          <div className="flex flex-col gap-px">
            <div className="text-[8.5px] font-semibold leading-none tracking-[0.16em] uppercase text-[color:var(--game-mute)]">
              Team
            </div>
            <div className="text-xs font-semibold leading-none text-[color:var(--game-ink)]">Your City</div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 px-4">
          <button
            type="button"
            className={`${BTN_BASE} ${BTN_SECONDARY}`}
            onClick={() => loadCheckpoint(MID_GAME_CHECKPOINT)}
          >
            <BookmarkSimple size={14} weight="duotone" />
            Checkpoint
          </button>
          <button type="button" className={`${BTN_BASE} ${BTN_GHOST}`} onClick={resetGame}>
            <ArrowCounterClockwise size={14} weight="duotone" />
            Reset
          </button>
          <a className={`${BTN_BASE} ${BTN_PRIMARY}`} href="/civil-wars/v3/organizer">
            <Sliders size={14} weight="duotone" />
            Organizer console
          </a>
        </div>
      </header>

      <main className="grid grid-cols-[minmax(238px,296px)_minmax(0,1fr)_minmax(262px,340px)] gap-3 p-3 min-h-0">
        <BuildingPalette />
        <CityGridV3 />
        <CityStatusPanel />
      </main>

      <TwistModal />
    </div>
  );
}

export default CivilWarsV3;
