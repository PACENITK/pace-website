import React, { useCallback, useEffect, useRef, useState } from "react";
import { fetchOverview, lockYear, advanceYear, resetAll, startPractice, endPractice } from "../api/urbanMayhemClient.js";
import "../civil-wars-v3.css";

const KEY_STORAGE = "um_admin_key";
const POLL_MS = 3000;

// The per-year twist schedule is fixed on the server (game/state.js:
// TWIST_ORDER is not shuffled, Year 4 is always Olympics, Year 5 always
// Treasure). Kept in sync here so the console can show what's coming
// without an extra round-trip.
const YEAR_TWISTS = ["Flood", "Waterborne outbreak", "Immigration", "Olympics", "Treasure reveal"];
const twistForYear = (year) => YEAR_TWISTS[year - 1] || null;

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
        {error && <div className="text-sm text-[color:var(--game-bad)]">{error}</div>}
        <button type="submit" className="py-2 rounded-sm bg-[color:var(--game-slate)] text-white font-semibold">
          Continue
        </button>
      </form>
    </div>
  );
}

function Card({ title, tone, children }) {
  const border =
    tone === "danger" ? "border-[color:var(--game-bad)]" : tone === "go" ? "border-[color:var(--game-ok)]" : "border-[color:var(--game-rule)]";
  return (
    <section className={`mb-4 bg-[color:var(--game-paper-2)] border ${border} rounded-sm`}>
      <div className="px-4 py-2 border-b border-[color:var(--game-rule)] text-[11px] font-bold uppercase tracking-[0.15em] text-[color:var(--game-mute)]">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

const btnPrimary =
  "px-5 py-3 rounded-sm bg-[color:var(--game-slate)] text-white font-semibold text-[15px] disabled:opacity-30 disabled:cursor-not-allowed";
const btnGo =
  "px-5 py-3 rounded-sm bg-[color:var(--game-ok)] text-white font-semibold text-[15px] disabled:opacity-30 disabled:cursor-not-allowed";
const btnDanger =
  "px-5 py-3 rounded-sm bg-[color:var(--game-bad)] text-white font-semibold text-[15px] disabled:opacity-30 disabled:cursor-not-allowed";
const btnGhost =
  "px-5 py-3 rounded-sm bg-white text-[color:var(--game-slate)] font-semibold text-[15px] border border-[color:var(--game-rule)] disabled:opacity-30 disabled:cursor-not-allowed";

function OrganizerConsole() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(KEY_STORAGE));
  const [keyError, setKeyError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(null);
  const [practiceMinutes, setPracticeMinutes] = useState(10);
  const [resetArmed, setResetArmed] = useState(false);
  const [stopTrialArmed, setStopTrialArmed] = useState(false);
  const armTimer = useRef(null);
  const stopTimer = useRef(null);
  const now = useTicking();

  function saveKey(key) {
    sessionStorage.setItem(KEY_STORAGE, key);
    setAdminKey(key);
  }

  const refresh = useCallback(async () => {
    if (!adminKey) return;
    try {
      const data = await fetchOverview(adminKey);
      setOverview(data);
      setKeyError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem(KEY_STORAGE);
        setAdminKey(null);
        setKeyError("Bad or missing admin key.");
      }
    }
  }, [adminKey]);

  useEffect(() => {
    if (!adminKey) return undefined;
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [adminKey, refresh]);

  async function run(fn, successMsg) {
    if (busy) return;
    setBusy(true);
    setFlash(null);
    try {
      const res = await fn();
      if (successMsg) setFlash({ ok: true, text: typeof successMsg === "function" ? successMsg(res) : successMsg });
      await refresh();
    } catch (err) {
      setFlash({ ok: false, text: err.response?.data?.error || err.message || "Request failed" });
    } finally {
      setBusy(false);
    }
  }

  function armStopTrial() {
    if (stopTrialArmed) {
      clearTimeout(stopTimer.current);
      setStopTrialArmed(false);
      run(() => endPractice(adminKey), "Trial run ended — real game started, all boards wiped fresh.");
      return;
    }
    setStopTrialArmed(true);
    stopTimer.current = setTimeout(() => setStopTrialArmed(false), 4000);
  }

  function armReset() {
    if (resetArmed) {
      clearTimeout(armTimer.current);
      setResetArmed(false);
      run(() => resetAll(adminKey), "Full reset done — every board wiped, everyone logged out.");
      return;
    }
    setResetArmed(true);
    armTimer.current = setTimeout(() => setResetArmed(false), 4000);
  }

  if (!adminKey) return <AdminKeyForm onSubmit={saveKey} error={keyError} />;
  if (!overview) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  const { global, teams } = overview;
  const ranked = [...teams].sort((a, b) => b.score - a.score);
  const joinedCount = teams.filter((t) => t.joined).length;
  const inPractice = global.phase === "practice";
  const practiceRemainingMs = global.practiceEndsAt ? new Date(global.practiceEndsAt).getTime() - now : 0;
  const gameOver = global.year >= 5;
  const nextYear = global.year + 1;
  const nextTwist = twistForYear(nextYear);

  return (
    <div className="min-h-screen bg-[color:var(--game-paper)] py-8 px-4">
      <div className="max-w-[960px] mx-auto">
        {/* Status bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <h1 className="text-xl font-bold mr-2">Organizer console</h1>
          <span className="px-2.5 py-1 rounded-sm bg-[color:var(--game-slate)] text-white text-sm font-semibold">
            {gameOver ? "Game complete" : `Year ${global.year} of 5`}
          </span>
          <span
            className={`px-2.5 py-1 rounded-sm text-sm font-semibold ${
              inPractice
                ? "bg-[color:var(--game-rust)] text-white"
                : "bg-white border border-[color:var(--game-rule)] text-[color:var(--game-ink)]"
            }`}
          >
            {inPractice ? "TRIAL RUN" : "Live game"}
          </span>
          {global.locked && !inPractice && (
            <span className="px-2.5 py-1 rounded-sm bg-[color:var(--game-bad)] text-white text-sm font-semibold">
              Building locked
            </span>
          )}
          <span className="flex-1" />
          <span className="text-sm text-[color:var(--game-mute)] tabular-nums">
            {joinedCount}/{teams.length} teams joined
          </span>
        </div>

        {flash && (
          <div
            className={`mb-4 px-4 py-2.5 rounded-sm text-sm font-medium border ${
              flash.ok
                ? "bg-[#eef5ee] border-[color:var(--game-ok)] text-[color:var(--game-ok)]"
                : "bg-[#faeceb] border-[color:var(--game-bad)] text-[color:var(--game-bad)]"
            }`}
          >
            {flash.text}
          </div>
        )}

        {/* ---- TRIAL RUN ---- */}
        <Card title="Trial run (practice)" tone={inPractice ? "go" : undefined}>
          {inPractice ? (
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <div className="text-2xl font-bold tabular-nums">
                  {practiceRemainingMs > 0 ? fmtCountdown(practiceRemainingMs) : "time's up"}
                </div>
                <div className="text-sm text-[color:var(--game-mute)]">
                  Teams are building on a throwaway board. Nothing here is scored.
                </div>
              </div>
              <span className="flex-1" />
              <button type="button" disabled={busy} onClick={armStopTrial} className={stopTrialArmed ? btnDanger : btnGhost}>
                {stopTrialArmed ? "Click again — wipes boards & starts real game" : "■ Stop trial run & start real game"}
              </button>
            </div>
          ) : global.year > 0 ? (
            <div className="text-sm text-[color:var(--game-mute)]">
              Real game is already underway (Year {global.year}) — the trial run is only available before Year 1.
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm">
                Let teams practice on a throwaway board before the scored game.
                <div className="text-[color:var(--game-mute)]">
                  Stopping it (or the timer running out) wipes every board and starts Year 1.
                </div>
              </div>
              <span className="flex-1" />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="number"
                  min={1}
                  value={practiceMinutes}
                  onChange={(e) => setPracticeMinutes(Number(e.target.value))}
                  className="w-16 py-2 px-2 rounded-sm border border-[color:var(--game-rule)]"
                />
                min
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => startPractice(adminKey, practiceMinutes), `Trial run started — ${practiceMinutes} min.`)}
                className={btnGo}
              >
                ▶ Start trial run
              </button>
            </div>
          )}
        </Card>

        {/* ---- TWISTS / YEARS ---- */}
        <Card title="Twists &amp; year control">
          {/* schedule strip */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {YEAR_TWISTS.map((label, i) => {
              const yr = i + 1;
              const done = global.year >= yr;
              const isNext = yr === nextYear && !gameOver;
              return (
                <div
                  key={yr}
                  className={`px-2.5 py-1.5 rounded-sm text-xs border ${
                    isNext
                      ? "bg-[color:var(--game-slate)] text-white border-[color:var(--game-slate)] font-semibold"
                      : done
                      ? "bg-[color:var(--game-rule)] text-[color:var(--game-mute)] border-[color:var(--game-rule)] line-through"
                      : "bg-white text-[color:var(--game-ink)] border-[color:var(--game-rule)]"
                  }`}
                >
                  Y{yr} · {label}
                </div>
              );
            })}
          </div>

          {gameOver ? (
            <div className="text-sm font-semibold">All 5 years played. Final standings are below.</div>
          ) : (
            <>
              <p className="text-sm text-[color:var(--game-mute)] mb-3">
                Each year's twist is fixed. <strong className="text-[color:var(--game-ink)]">Step 1</strong> freezes every
                team so nobody's mid-move; <strong className="text-[color:var(--game-ink)]">Step 2</strong> fires the twist
                for all teams at once and moves the clock to Year {nextYear}.
              </p>
              <div className="flex flex-wrap items-stretch gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--game-mute)]">Step 1</span>
                  <button
                    type="button"
                    disabled={busy || global.locked}
                    onClick={() => run(() => lockYear(adminKey), "Building locked — teams can't place or move now.")}
                    className={btnPrimary}
                  >
                    {global.locked ? "✓ Building locked" : "① Lock building"}
                  </button>
                </div>
                <div className="flex items-center text-[color:var(--game-mute)] pt-5">→</div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--game-mute)]">
                    Step 2 — Year {nextYear}
                  </span>
                  <button
                    type="button"
                    disabled={busy || !global.locked}
                    onClick={() =>
                      run(
                        () => advanceYear(adminKey),
                        (res) => `Year ${res.year} twist fired: ${twistForYear(res.year) || res.twist} · ${res.teamsProcessed} teams.`,
                      )
                    }
                    className={btnGo}
                  >
                    ② Trigger “{nextTwist}” twist →
                  </button>
                </div>
              </div>
              {!global.locked && (
                <p className="text-xs text-[color:var(--game-mute)] mt-2">Step 2 unlocks once building is locked.</p>
              )}
            </>
          )}
        </Card>

        {/* ---- LEADERBOARD ---- */}
        <Card title="Leaderboard">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-[color:var(--game-mute)] border-b border-[color:var(--game-rule)]">
                  <th className="py-1.5 pr-3">#</th>
                  <th className="py-1.5 pr-3">Code</th>
                  <th className="py-1.5 pr-3">Team</th>
                  <th className="py-1.5 pr-3">Joined</th>
                  <th className="py-1.5 pr-3">Devices</th>
                  <th className="py-1.5 pr-3">Cash</th>
                  <th className="py-1.5 pr-3">Yr</th>
                  <th className="py-1.5 pr-3">Bldgs</th>
                  <th className="py-1.5 pr-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((t, i) => (
                  <tr
                    key={t.code}
                    className={`border-b border-[color:var(--game-rule)] ${i < 3 ? "font-semibold" : ""}`}
                  >
                    <td className="py-1.5 pr-3 tabular-nums">{i + 1}</td>
                    <td className="py-1.5 pr-3 font-mono">{t.code}</td>
                    <td className="py-1.5 pr-3">{t.teamName}</td>
                    <td className="py-1.5 pr-3">{t.joined ? "✓" : "—"}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{t.sessionsCount}</td>
                    <td className="py-1.5 pr-3 tabular-nums">₹{fmt(t.cash)} Cr</td>
                    <td className="py-1.5 pr-3 tabular-nums">{t.year}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{t.buildingsPlaced}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{fmt(t.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ---- DANGER ZONE ---- */}
        <Card title="Danger zone" tone="danger">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm">
              Full reset — wipes every board, resets the clock to Year 0, <strong>and logs every team out</strong> (they
              must re-enter their code). For rehearsal only; use “Stop trial run” for the real event.
            </div>
            <span className="flex-1" />
            <button type="button" disabled={busy} onClick={armReset} className={resetArmed ? btnDanger : btnGhost}>
              {resetArmed ? "Click again to confirm full reset" : "Full reset"}
            </button>
          </div>
        </Card>

        <a href="/civil-wars/v3" className="inline-block mt-2 text-sm text-[color:var(--game-slate)]">
          ← Local sandbox (no network)
        </a>
      </div>
    </div>
  );
}

export default OrganizerConsole;
