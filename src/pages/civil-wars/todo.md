# Urban Mayhem — TODO

Last updated: 2026-09-10. Node/npm/MongoDB are all available in this environment now
(`mongod` initially failed with a known kernel-6.19+ incompatibility — SERVER-121912 — since
fixed). The full test suite, including the Mongo-backed backend integration tests, is
runnable and has been run here.

Keep this file current: when something below gets done, check it off (or delete the line);
when new gaps turn up, add them here instead of just in chat.

---

## Done this session (client-side / local simulation only)

- [x] Flood band trimmed from 4 low-lying rows to 3 (`simulation/data/map.js`'s
      `buildMap()` gained a `skipBelowZoneB` param; the live map and `sweep.js`'s
      `baseMap()` both pass it).
- [x] Removed the 6 road tiles (bottom-left last row) from the live map — they read as a
      rendering glitch (grey stripe, nothing built on it, nothing explaining it) rather
      than a legible feature. `roadTiles` now defaults to `[]` in `buildMap()`.
- [x] Fixed a z-index bug (`civil-wars-v3.css`): `.cw3-tile--lowlying::after` had no
      explicit stacking order, so it painted on top of everything placed on that tile
      (building art/icon, slum badge, service pips) instead of behind it. Gave the overlay
      `z-index: 0` and the content layers `z-index: 1`.
  - **Backend/multiplayer implication:** none — this is a pure rendering fix, doesn't
    touch scoring or the engine.
- [x] Fixed slum art being fully replaced by the generic low-lying ground texture whenever
      a slum tile was flagged flood-risk (`TileV3.jsx`) — slum/colony now keep their own
      art with the flood tint layered on top instead of swapped out.
- [x] **New feature: move a placed building.** Click a building already on the board (with
      nothing selected from the palette) to pick it up, click an empty tile to drop it —
      costs 10% of the building's price (`config.moveCostRate`, new in
      `simulation/engine/config.js`), re-validated against the destination exactly like a
      fresh placement (dam still needs a river tile, hydro still needs a spare-capacity
      dam adjacent), reversible in the same 5s undo window as every other action. Service
      coverage/score recompute automatically since both are pure functions of `placed` —
      no separate "recalculate" step needed.
  - Implemented in: `simulation/engine/config.js` (`moveCostRate: 0.1`),
    `v3/store/useGameStore.js` (`evaluateMove`, `beginMove`/`cancelMove`/`proposeMove`/
    `previewMove`, plus `move` branches in `confirmPendingAction`/`undoLastAction`),
    `v3/components/CityGridV3.jsx` (click-to-pick-up / click-to-drop, radius ghost, drop
    preview, "Moving: X" badge), `v3/components/TileV3.jsx` (move-source highlight),
    `v3/components/PlacementConfirmModal.jsx` (`MoveDetails`), `v3/components/
    UndoBanner.jsx` (move label). Documented in rules.md Parts F/K/L.
  - ⚠️ **Only exists in the local single-browser simulation.** `backend/routes/
    urbanMayhem.js`'s `/action` route only accepts `type: "place"` or `"rehouse"`; there's
    no `"move"` branch, no `evaluateMove`/`applyMove` in `backend/game/state.js`. Add this
    when the network path needs it.

## Done this session (backend v4 parity — Phase 1 of connecting frontend↔backend)

- [x] `backend/game/engine.js` now re-exports `hasAdjacentDamWithCapacity`.
- [x] `backend/models/UrbanMayhemTeam.js`: added `damagedTiles`, `extraSlums`,
      `pollutionSpillTiles` (mirroring the client's v4 fields), plus `lastTwistResult` /
      `lastTwistYear` so a polling client can learn what a twist did to it without a new
      endpoint.
- [x] `backend/game/state.js`: `evaluatePlacement` now builds `ctx.hasAdjacentDamWithCapacity`
      and rejects placement on `extraSlums` tiles; `applyYearTransition` now calls
      `twists.applyOutbreak`/`applyImmigrationSlums` (not the removed `applyPandemic`/
      `applyImmigration`), runs `checkMandatoryFloor` at year 1, threads
      `damagedTiles`/`extraSlums`/`pollutionSpillTiles` through every `computeCityStats`
      call, and records `lastTwistResult`/`lastTwistYear`.
- [x] `backend/routes/urbanMayhem.js`: `stateForClient()` now returns the new fields;
      `/advance-year` marks the new Mixed fields modified so Mongoose actually persists them.
- [x] **Verified against a real MongoDB instance**: `npx vitest run backend/tests/
      urbanMayhem.vitest.js` → **23/23 passed**, including the pandemic-year-transition
      regression test (exercises `applyOutbreak`, the renamed function, without crashing),
      the full lock/advance-year flow, admin-key gating, `/overview`, and `/reset`. One
      test initially failed for an unrelated reason (`persists a second placement...`
      still placed the removed `power_plant`) — fixed by swapping it for `park`/
      `storm_drainage`, two buildings with no prerequisites, since the test only cares
      about the Mixed-field persistence regression, not power specifically.
- [x] Also verified with a standalone smoke script exercising `state.js` directly (no
      Mongo) before the DB was available: dam→hydro adjacency placement, mandatory-floor
      check, pandemic/flood/immigration transitions in sequence, immigration spawning 2 new
      slum tiles, flood protecting the dam-adjacent hydro and damaging the one unprotected
      slum — all consistent with the real-DB run above.
- [x] **Ran the existing simulation engine test suite**: `npx vitest run simulation` →
      **12 failed, 68 passed across 6 files** (was 45 passed across 5 before Mongo was
      available; the 6th file is the backend integration suite above). All 12 failures are
      pre-existing v4-migration breakage, none caused by this session's backend work:
      - `buildings.test.js` (2 failures) and `score.test.js` (2 failures): stale
        `power_plant` references, same issue already tracked below for `strategies.js`.
      - `twists.test.js` (8 failures): 6 call the removed `applyPandemic`/`applyImmigration`
        directly; 2 more (`applyFlood` protection tests) assume the old flat `lowLying` +
        chebyshev-radius dam model instead of v4's graded zones + column-span model — these
        need rewriting, not just renaming.

---

## Done this session (Phase 2/3 — frontend↔backend connection)

`src/pages/civil-wars/v3/*` now has a real networked path alongside the untouched local
sandbox. Frontend and backend are connected — the remaining gap is verifying it against a
real database (see below), not building it.

- [x] `v3/api/urbanMayhemClient.js` — axios client (`VITE_API_URL`, `withCredentials: true`,
      same pattern as `src/portal/utils/api.js`) for `/join`, `/state`, `/action`
      (place/rehouse), and the four admin routes.
- [x] `v3/store/evaluatePlacement.js` — the placement-preview logic extracted out of
      `useGameStore.js` so both the local and network stores share one implementation
      instead of drifting copies.
- [x] `v3/store/GameStoreContext.jsx` — a context whose default is the existing local
      `useGameStore` hook, plus `useActiveGameStore(selector)`. `CityGridV3`, `BuildingPalette`,
      `CityStatusPanel`, `TwistModal`, `PlacementConfirmModal`, and `useCityStats.js` now read
      through this instead of importing `useGameStore` directly — the local sandbox
      (`/civil-wars/v3`) is unaffected since the context's default *is* that same store.
      `UndoBanner.jsx` still imports the local store directly on purpose (no undo online).
- [x] `v3/store/useNetworkGameStore.js` — polls `GET /state` every 2.5s, calls
      `placeBuilding`/`rehouseSlum` on confirm, pops the twist-reveal modal when the
      server's `lastTwistYear` advances past what's already been shown. `repair`/`move`
      are stubbed with a clear `lastError` message rather than left to crash on an
      undefined function call.
- [x] `v3/JoinScreen.jsx` + `v3/CivilWarsV3Online.jsx`, routed at `/civil-wars/v3/play`
      (`src/App.jsx`) — join by code, then the same board UI as the local sandbox, wired to
      the network store.
- [x] `v3/organizer/OrganizerConsole.jsx` rewritten in place (was the "Phase 1 stand-in" —
      its own old comment said Phase 2 would swap it, this is that swap): admin key prompt
      (`sessionStorage`), polls `GET /overview` every 3s, Lock year / Advance year / Reset
      everyone (double-click-to-confirm) buttons, and a leaderboard table (rank # + sorted
      by score descending) below them. This is what the practice-period reset-all flow
      below now has to build on.
- [x] **Score visibility rule, clarified in rules.md**: Part I now has a "When you see it"
      section — score is **never** shown to a player, not even after a twist; only the
      organizer sees the live ranked leaderboard (Part L); Year 6 is the only reveal. An
      earlier pass this session briefly built a "show your score after each twist" reveal
      (in `TwistModal.jsx` + both stores + `backend/game/state.js`'s `lastTwistResult`) —
      that was a misread of the request and has been reverted; the per-twist score-*delta*
      text that was already in `TwistModal.jsx` (e.g. "-50 score" on a bad pandemic
      outcome) is unchanged and stays, since Part H already documents those numbers as
      public.
  - Kept from that pass: `simulation/engine/score.js` gained a shared
    `computeScore(stats, cash, cumulativeScoreAdjustment, config)` — `backend/game/
    state.js`'s own `computeScore` now calls it instead of duplicating the formula. Purely
    internal, still only used by the organizer-facing `/overview` and action-log score
    snapshots, never exposed to a team.
  - rules.md also gained a "## The full formula" subsection at the end of Part I — board
    score + cash score + every twist's own score change, with a worked numeric example —
    since that composition was never spelled out anywhere before.
- [x] **Verified**: `npm run build` succeeds, `npx vitest run simulation` still shows the
      same pre-existing 12 failures (no regression from this work), `node -e
      "require('./backend/app.js')"` loads every edited backend file (routes, models,
      middleware) with no syntax errors. `npm run lint` currently fails for an unrelated,
      pre-existing reason (`ESLint 9`'s flat config rejecting a `root` key somewhere in the
      project's eslint config) — not something this session touched.
  - MongoDB now works here too (see top of file). Beyond the 23/23 integration suite
    (Phase 1 above), also ran the actual server as a real process (`node server.js`) against
    real Mongo and drove it with `curl`, exactly as the frontend client would: seeded a real
    team (`scripts/seedUrbanMayhem.js`), joined, placed a dam + hydro + water tank (proving
    the hydro-adjacency fix works over a real HTTP request, not just in-process), hit
    `/overview` as the organizer, locked and advanced a year (drew "immigration"), and
    confirmed `/state` came back with `lastTwistResult`/`lastTwistYear` in exactly the shape
    `useNetworkGameStore.js` expects for the twist-reveal modal — mandatory floor correctly
    flagged as unmet, immigration correctly spawned 2 new slum tiles, cash/score deductions
    all correct. Reset afterward to leave the DB clean.
  - ⚠️ **Still not verified**: an actual browser rendering the React UI — the API contract
    is proven end to end, but nobody has clicked through `/civil-wars/v3/play` or the
    organizer console in a real browser yet. `npm run dev` + the backend (already has a
    working `.env.development` in this checkout) + a seeded team is all that's needed.

---

## Practice period (10 min) + admin reset-all

- [ ] Decide the flow: teams join early and get ~10 minutes of free play on a throwaway
      board (to learn the interface / read the rules), then an organizer action wipes
      every board back to zero and the real, scored game begins from Year 0.
- [x] ~~Depends on the frontend↔backend wiring above existing~~ — that wiring now exists
      (see above); this can be picked up directly.
- [ ] Backend already has most of what a reset needs: `POST /reset`
      (`backend/routes/urbanMayhem.js:259-271`, admin-key gated) wipes every team's
      `state` back to `createInitialTeamState()` (fresh ₹3,000 Cr, empty board, Year 0),
      resets the global clock/twist order/treasure tile, and clears the action log.
  - ⚠️ It **also clears every team's `sessions` array** (line 265), which logs everyone
    out and forces re-entering the join code. Decide if that's fine for a
    practice→real-game transition, or add a lighter reset that wipes the board/cash but
    keeps sessions alive.
- [ ] Add a visible countdown for the practice window (10:00 → 0:00). Should be
      server-driven (one clock everyone sees the same value for), not each browser's own
      timer — there's no server-side timer/clock concept in `UrbanMayhemGlobal` today,
      only a `locked` boolean and `year`.
- [x] Organizer console now has a "Reset everyone" button (double-click-to-confirm) that
      calls `POST /reset`.
- [ ] It's generic ("reset the game"), not framed as "end practice" specifically, and
      there's still no explicit signal on a team's screen when the board wipes out from
      under them mid-build — their next poll (≤2.5s) will just show an empty board with no
      banner explaining why.
- [ ] If players should be told about the practice period, add a line to rules.md's
      Player Brief (Part A) or Organiser Notes (Part L).

---

## Other known gaps (unrelated to the frontend↔backend connection work)

- [ ] `simulation/strategies.js:284,300` (`ensurePower()`) still references
      `buildingsById.power_plant`, which no longer exists in `buildings.js` — breaks any
      simulated strategy that calls it.
- [ ] `simulation/strategies.js:600` references `config.damDownstreamRadius`, renamed to
      `damProtectionSpan` in `config.js` — same kind of breakage.
- [ ] Both of the above break `simulation/sweep.js` (balance-simulation sweep) and
      `simulation/inheritedCost.js` — worth fixing before running the pre-event balance
      simulation rules.md Part L asks for. Same root cause as the `buildings.test.js`/
      `score.test.js` failures logged above.
- [ ] `backend/routes/urbanMayhem.js`'s `/action` route only accepts `type: "place"` or
      `"rehouse"` — the client-side "move a building" mechanic has no server-side
      equivalent yet. Needs an `evaluateMove`/`applyMove` pair in `backend/game/state.js`
      mirroring `useGameStore.js`'s `evaluateMove`, plus a `move` branch in the route.
