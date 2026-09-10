import React, { useEffect, useRef, useState } from "react";
import { fetchOverview, lockYear, advanceYear, resetAll, startPractice, endPractice } from "../api/urbanMayhemClient.js";
import "../civil-wars-v3.css";

const KEY_STORAGE = "um_admin_key";
const POLL_MS = 3000;

function fmt(n) {
  return Math.round(n).toLocaleString("en-IN");
}

function fmtCountdown(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

function useTicking() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

function AdminKeyForm({ onSubmit, error }) {
  const [key, setKey] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--game-paper)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (key.trim()) onSubmit(key.trim());
        }}
        className="flex flex-col gap-3 p-8 bg-[color:var(--game-paper-2)] border border-[color:var(--game-rule)] rounded-sm w-[320px]"
      >
        <div className="text-lg font-bold">Organizer console</div>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          autoFocus
          className="py-2 px-2.5 rounded-sm border border-[color:var(--game-rule)]"
        />
        {error && <div className="text-sm text-[#8f1e18]">{error}</div>}
        <button type="submit" className="py-2 rounded-sm bg-[color:var(--game-slate)] text-white font-semibold">
          Continue
        </button>
      </form>
    </div>
  );
}

function OrganizerConsole() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(KEY_STORAGE));
  const [keyError, setKeyError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [lastTwist, setLastTwist] = useState(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [endPracticeArmed, setEndPracticeArmed] = useState(false);
  const [practiceMinutes, setPracticeMinutes] = useState(10);
  const armTimer = useRef(null);
  const endPracticeArmTimer = useRef(null);
  const now = useTicking();

  function saveKey(key) {
    sessionStorage.setItem(KEY_STORAGE, key);
    setAdminKey(key);
  }

  useEffect(() => {
    if (!adminKey) return undefined;
    let cancelled = false;
    async function poll() {
      try {
        const data = await fetchOverview(adminKey);
        if (!cancelled) {
          setOverview(data);
          setKeyError(null);
        }
      } catch (err) {
        if (!cancelled && err.response?.status === 401) {
          sessionStorage.removeItem(KEY_STORAGE);
          setAdminKey(null);
          setKeyError("Bad or missing admin key.");
        }
      }
    }
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [adminKey]);

  function armReset() {
    if (resetArmed) {
      clearTimeout(armTimer.current);
      setResetArmed(false);
      resetAll(adminKey).then(() => setLastTwist(null));
      return;
    }
    setResetArmed(true);
    armTimer.current = setTimeout(() => setResetArmed(false), 4000);
  }

  function armEndPractice() {
    if (endPracticeArmed) {
      clearTimeout(endPracticeArmTimer.current);
      setEndPracticeArmed(false);
      endPractice(adminKey);
      return;
    }
    setEndPracticeArmed(true);
    endPracticeArmTimer.current = setTimeout(() => setEndPracticeArmed(false), 4000);
  }

  if (!adminKey) return <AdminKeyForm onSubmit={saveKey} error={keyError} />;
  if (!overview) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  const { global, teams } = overview;
  const ranked = [...teams].sort((a, b) => b.score - a.score);
  const practiceRemainingMs = global.practiceEndsAt ? new Date(global.practiceEndsAt).getTime() - now : 0;

  return (
    <div className="min-h-screen bg-[color:var(--game-paper)] p-8 max-w-[960px] mx-auto">
      <h1 className="text-xl font-bold mb-1">Organizer console</h1>
      <p className="text-sm text-[color:var(--game-mute)] mb-5">
        Year {global.year} of 5 · {global.locked ? "locked — ready to advance" : "open"}
        {global.phase === "practice" && (
          <>
            {" "}
            · <strong>Practice period</strong> — {practiceRemainingMs > 0 ? fmtCountdown(practiceRemainingMs) : "any moment now"} left
          </>
        )}
      </p>

      <div className="flex items-center gap-2.5 mb-3 p-3 bg-[color:var(--game-paper-2)] border border-[color:var(--game-rule)] rounded-sm">
        {global.phase === "practice" ? (
          <>
            <span className="text-sm">
              Practice ends in <strong className="tabular-nums">{fmtCountdown(practiceRemainingMs)}</strong> — teams can build
              freely on a throwaway board.
            </span>
            <span className="flex-1" />
            <button
              type="button"
              onClick={armEndPractice}
              className={`px-4 py-2 rounded-sm font-semibold border ${
                endPracticeArmed ? "bg-[color:var(--game-slate)] text-white border-[color:var(--game-slate)]" : "bg-white text-[color:var(--game-slate)] border-[color:var(--game-rule)]"
              }`}
            >
              {endPracticeArmed ? "Click again to end practice now" : "End practice & start the real game"}
            </button>
          </>
        ) : (
          <>
            <span className="text-sm">Start an optional practice window before the real game.</span>
            <span className="flex-1" />
            <input
              type="number"
              min={1}
              value={practiceMinutes}
              onChange={(e) => setPracticeMinutes(Number(e.target.value))}
              className="w-16 py-1.5 px-2 rounded-sm border border-[color:var(--game-rule)] text-sm"
            />
            <span className="text-sm text-[color:var(--game-mute)]">min</span>
            <button
              type="button"
              onClick={() => startPractice(adminKey, practiceMinutes)}
              className="px-4 py-2 rounded-sm bg-[color:var(--game-slate)] text-white font-semibold"
            >
              Start practice
            </button>
          </>
        )}
      </div>

      <div className="flex gap-2.5 mb-6">
        <button
          type="button"
          disabled={global.locked}
          onClick={() => lockYear(adminKey)}
          className="px-4 py-2.5 rounded-sm bg-[color:var(--game-slate)] text-white font-semibold disabled:opacity-40"
        >
          Lock year
        </button>
        <button
          type="button"
          disabled={!global.locked || global.year >= 5}
          onClick={() => advanceYear(adminKey).then((res) => setLastTwist(res.twist))}
          className="px-4 py-2.5 rounded-sm bg-[color:var(--game-slate)] text-white font-semibold disabled:opacity-40"
        >
          Advance year →
        </button>
        <button
          type="button"
          onClick={armReset}
          title="Dev/rehearsal only — wipes every board AND logs every team out. Use 'End practice' above for the real event."
          className={`px-4 py-2.5 rounded-sm font-semibold border ${
            resetArmed
              ? "bg-[#8f1e18] text-white border-[#8f1e18]"
              : "bg-white text-[#8f1e18] border-[#d9a9a4]"
          }`}
        >
          {resetArmed ? "Click again to confirm full reset" : "Full reset (dev, logs everyone out)"}
        </button>
      </div>

      {lastTwist && (
        <p className="text-sm mb-5">
          Year {global.year}'s twist: <strong>{lastTwist}</strong>
        </p>
      )}

      <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[color:var(--game-mute)] mb-2">
        Leaderboard
      </h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-[color:var(--game-mute)] border-b border-[color:var(--game-rule)]">
            <th className="py-1.5 pr-3">#</th>
            <th className="py-1.5 pr-3">Code</th>
            <th className="py-1.5 pr-3">Team</th>
            <th className="py-1.5 pr-3">Joined</th>
            <th className="py-1.5 pr-3">Sessions</th>
            <th className="py-1.5 pr-3">Cash</th>
            <th className="py-1.5 pr-3">Year</th>
            <th className="py-1.5 pr-3">Buildings</th>
            <th className="py-1.5 pr-3">Score</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((t, i) => (
            <tr key={t.code} className="border-b border-[color:var(--game-rule)]">
              <td className="py-1.5 pr-3 tabular-nums font-semibold">{i + 1}</td>
              <td className="py-1.5 pr-3 font-mono">{t.code}</td>
              <td className="py-1.5 pr-3">{t.teamName}</td>
              <td className="py-1.5 pr-3">{t.joined ? "yes" : "—"}</td>
              <td className="py-1.5 pr-3">{t.sessionsCount}</td>
              <td className="py-1.5 pr-3 tabular-nums">₹{fmt(t.cash)} Cr</td>
              <td className="py-1.5 pr-3 tabular-nums">{t.year}</td>
              <td className="py-1.5 pr-3 tabular-nums">{t.buildingsPlaced}</td>
              <td className="py-1.5 pr-3 tabular-nums font-semibold">{fmt(t.score)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <a href="/civil-wars/v3" className="inline-block mt-6 text-sm text-[color:var(--game-slate)]">
        ← Local sandbox (no network)
      </a>
    </div>
  );
}

export default OrganizerConsole;
