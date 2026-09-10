import React from "react";
import { Buildings } from "@phosphor-icons/react";
import useNetworkGameStore from "../store/useNetworkGameStore.js";
import { TWIST_RULES } from "../data/twistRules.js";
import { fmtCr } from "../format.js";

// One row of the breakdown: label on the left, signed points on the right.
function Line({ label, value, muted, strong }) {
  const v = Math.round(value);
  return (
    <div
      className={`flex items-baseline justify-between gap-3 py-[3px] ${
        strong ? "font-bold" : ""
      } ${muted ? "text-[color:var(--game-mute)]" : ""}`}
    >
      <span>{label}</span>
      <span className="tabular-nums shrink-0">
        {v > 0 ? "+" : ""}
        {v}
      </span>
    </div>
  );
}

const BOARD_LINES = [
  ["servicePoints", "Services delivered"],
  ["unservedPenalty", "Unserved demand"],
  ["slumSanitationPenalty", "Slums with no sanitation"],
  ["pollutionPenalty", "Homes in pollution, no park"],
  ["sewagePenalty", "Homes next to a sewage plant"],
  ["allServedBonus", "Every home fully served"],
  ["coverageBonus", "Service coverage 90%+ citywide"],
  ["slumRehousedBonus", "Slums rehoused"],
];

function ResultsScreen() {
  const teamName = useNetworkGameStore((s) => s.teamName);
  const cash = useNetworkGameStore((s) => s.cash);
  const bd = useNetworkGameStore((s) => s.scoreBreakdown);

  if (!bd) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--game-paper)] text-[color:var(--game-mute)]">
        Loading your results…
      </div>
    );
  }

  const twistTitle = (t) => (TWIST_RULES[t] && TWIST_RULES[t].title) || t;

  return (
    <div className="min-h-screen bg-[color:var(--game-paper)] py-10 px-4">
      <div className="mx-auto w-full max-w-[440px] flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-11 h-11 border-[1.5px] border-[color:var(--game-ink)] rounded-sm bg-[color:var(--game-slate)] flex items-center justify-center text-[color:var(--game-paper)]">
            <Buildings size={22} weight="duotone" />
          </div>
          <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[color:var(--game-mute)]">
            Urban Mayhem — final score
          </div>
          <div className="text-xl font-bold">{teamName}</div>
        </div>

        <div className="flex flex-col items-center py-5 bg-[color:var(--game-paper-2)] border border-[color:var(--game-rule)] rounded-sm">
          <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[color:var(--game-mute)]">
            Total
          </div>
          <div className="text-[52px] font-bold leading-none tabular-nums">{Math.round(bd.total)}</div>
        </div>

        <section className="bg-[color:var(--game-paper-2)] border border-[color:var(--game-rule)] rounded-sm p-4 text-[13px]">
          <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[color:var(--game-mute)] mb-2">
            Board
          </div>
          {BOARD_LINES.map(([k, label]) =>
            bd.board[k] ? <Line key={k} label={label} value={bd.board[k]} /> : null
          )}
          <div className="border-t border-[color:var(--game-rule)] mt-2 pt-1">
            <Line label="Board score" value={bd.board.total} strong />
          </div>
        </section>

        <section className="bg-[color:var(--game-paper-2)] border border-[color:var(--game-rule)] rounded-sm p-4 text-[13px]">
          <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[color:var(--game-mute)] mb-2">
            Cash
          </div>
          <Line label={`₹${fmtCr(cash)} Cr unspent × 0.05`} value={bd.cashBonus} strong />
        </section>

        <section className="bg-[color:var(--game-paper-2)] border border-[color:var(--game-rule)] rounded-sm p-4 text-[13px]">
          <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[color:var(--game-mute)] mb-2">
            Each year's event
          </div>
          {bd.twists && bd.twists.length > 0 ? (
            bd.twists.map((t) => (
              <Line
                key={t.year}
                label={`Year ${t.year} — ${t.floorMissed ? "mandatory floor missed" : twistTitle(t.twist)}`}
                value={t.scoreDelta}
                muted={t.scoreDelta === 0 && !t.floorMissed}
              />
            ))
          ) : (
            <div className="text-[color:var(--game-mute)]">No event score changes.</div>
          )}
          <div className="border-t border-[color:var(--game-rule)] mt-2 pt-1">
            <Line label="Events total" value={bd.twistAdjustment} strong />
          </div>
        </section>

        <div className="flex items-baseline justify-between px-1 text-base font-bold">
          <span>Final score</span>
          <span className="tabular-nums">{Math.round(bd.total)}</span>
        </div>

        <p className="text-center text-[11px] text-[color:var(--game-mute)]">
          Scores are final. Thanks for playing.
        </p>
      </div>
    </div>
  );
}

export default ResultsScreen;
