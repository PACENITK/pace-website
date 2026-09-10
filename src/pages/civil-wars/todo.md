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
  - Now wired to the backend too — see "repair + move on the backend" below.

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
      `placeBuilding`/`rehouseSlum`/`moveBuilding`/`repairBuilding` on confirm, pops the
      twist-reveal modal when the server's `lastTwistYear` advances past what's already
      been shown.
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

## Done this session (repair + move on the backend)

The two features that only worked in the local sandbox now work in the real,
backend-connected game too — closing the gap between what rules.md documents and what a
team can actually do online.

- [x] `backend/game/state.js` gained `evaluateMove`/`applyMove` (a direct port of the
      client's `evaluateMove`) and `applyRepair`.
- [x] `backend/routes/urbanMayhem.js`'s `/action` route now accepts `type: "move"` (body:
      `fromRow`/`fromCol`/`toRow`/`toCol`) and `type: "repair"` (body: `row`/`col`), on top
      of the existing `place`/`rehouse`. The building being moved is looked up from the
      team's own `placed` state server-side, never trusted from the request body, so a
      team can only ever move what's actually sitting on their own tile.
- [x] `v3/store/evaluatePlacement.js` gained `evaluateMove`/`moveFee` (moved out of
      `useGameStore.js`, which now imports them) so the local store, the network store, and
      the backend all share the same validation shape.
- [x] `v3/api/urbanMayhemClient.js` gained `moveBuilding`/`repairBuilding`;
      `useNetworkGameStore.js`'s `beginMove`/`cancelMove`/`proposeMove`/`previewMove`/
      `proposeRepair` are now real (mirroring the local store) instead of "not available
      online yet" stubs.
- [x] **Verified against the real running server + real Mongo**: seeded a team, placed a
      dam + hydro, forced a flood twist (via `mongosh`, same technique the vitest suite's
      own pandemic-regression test uses) to get a real damaged tile, repaired it (cash
      dropped by exactly the repair cost, `damagedTiles` cleared, repairing again correctly
      rejected), moved the hydro to a still-dam-adjacent tile (cash dropped by exactly the
      10% fee), then confirmed a move far from any dam was correctly rejected with the same
      `hasAdjacentDamWithCapacity` reason placement uses, and a move from an empty tile was
      rejected with "No building at that tile". Checked the action log directly in Mongo —
      `move`/`repair` entries recorded with the right cost/payload. Backend integration
      suite still 23/23 afterward, engine test suite still the same pre-existing 12
      failures, frontend build still clean.
  - Caught and fixed a process-management mistake mid-verification: an earlier test's
    backend server was still running in the background (killing it via `kill %1` in a later
    tool call didn't work — each shell invocation is its own process, so that job number
    didn't exist there), silently holding port 5000 and causing the *new* server process to
    crash on startup (`EADDRINUSE`) while curl kept hitting the stale one. Killed it by PID
    and confirmed the port was free before restarting.
- [x] Confirmed the participant page (`/civil-wars/v3/play`) has no reset/organizer
      controls reachable from it — grepped `v3/components/`, `JoinScreen.jsx`, and
      `CivilWarsV3Online.jsx` for "Organizer"/"Reset"; the only match was an unrelated code
      comment.

---

## Practice period (10 min) + admin reset-all

- [x] Decide the flow: teams join early and get ~10 minutes of free play on a throwaway
      board (to learn the interface / read the rules), then an organizer action wipes
      every board back to zero and the real, scored game begins from Year 0.
      — Implemented via `POST /start-practice` (sets phase to "practice" with a timed end)
      and `POST /end-practice` (wipes boards, preserves sessions, transitions to "live").
- [x] ~~Depends on the frontend↔backend wiring above existing~~ — that wiring now exists
      (see above); this can be picked up directly.
- [x] Backend reset: resolved by splitting into two endpoints.
      `POST /end-practice` wipes every team's board/cash back to fresh but **preserves
      sessions** (nobody has to re-enter their join code). `POST /reset` (dev/rehearsal
      only) still does the full wipe including sessions.
- [x] Add a visible countdown for the practice window (10:00 → 0:00). Server-driven via
      `practiceEndsAt` field on `UrbanMayhemGlobal`, `PracticeCountdown` component in
      `CivilWarsV3Online.jsx`, organizer console also shows it.
- [x] Organizer console now has dedicated "Start practice" and "End practice" buttons
      (double-click-to-confirm) alongside the dev-only "Full reset". Teams see a
      "Practice is over — the real game has begun. Your board was reset." banner
      (auto-dismisses after 8s) when the practice→live transition happens.
- [x] If players should be told about the practice period, add a line to rules.md's
      Player Brief (Part A) or Organiser Notes (Part L).
      — Done: Part A has a "10-minute practice run first" line; Part G's year table opens
      with a Practice row; Part L "Running the event" has a "Practice → live" paragraph and
      "What changed from v3" notes it.

---

## Done this session (fixed twist order — Flood → Outbreak → Immigration)

Years 1–3 were a random permutation; they are now always Flood (Y1), Waterborne outbreak
(Y2), Immigration (Y3). A known order is what lets the rules state, year by year, exactly
what each twist puts at stake — which was the other half of this request.

- [x] `src/pages/civil-wars/v3/store/useGameStore.js` — `shuffle([...])` replaced with a
      module-level `TWIST_ORDER = ["flood", "pandemic", "immigration"]`; `twistOrder:
      TWIST_ORDER.slice()` in `initialState()`. (`"pandemic"` kept as the internal key —
      renaming it to `"outbreak"` would touch the test suite, the sim harness, the
      action-log format string and DB-persisted values for no functional gain; the
      player-facing label in `TwistModal.jsx` is already "Waterborne outbreak".)
- [x] `backend/game/state.js` — same: `TWIST_ORDER` constant, `twistOrder:
      TWIST_ORDER.slice()` in `createInitialGlobal()`. `twistForYear()` unchanged (still
      reads `global.twistOrder[0..2]`), so `/advance-year` is now deterministic. The
      `shuffle()` helper is still defined/exported but no longer used for the twist order.
- [x] `backend/tests/urbanMayhem.vitest.js` — no change needed. The order-agnostic
      assertion (`expect(['flood','pandemic','immigration']).toContain(...)`) still holds,
      and the outbreak-regression test overrides `twistOrder` in the DB directly so it's
      unaffected by the new default.
- [x] `simulation/engine/simulate.js` — comment updated: the sweep still passes every
      permutation for balance analysis, but the shipped order is `[flood, pandemic,
      immigration]`. Sweep/run harness logic left as-is (it's a dev balance tool).
- [x] **rules.md** — Part A ("Five things happen, and you know the order"), Part G (year
      table names each twist; new "## What each year puts at stake" table with per-year
      score/cash stakes), Part H intro ("The order is fixed: Flood Y1, Outbreak Y2,
      Immigration Y3"), Part H Immigration (notes it lands after the outbreak, so the new
      slums don't count toward the Y2 hospital check), Part I (worked example + formula
      point 3 reference the new Part G table), Part K rule 9, Part L "What changed from v3".
- [x] Also fixed in rules.md while here: Part L orphan bullets (hospital cost / income ×2.5)
      given a "## Number changes carried into v4" heading instead of dangling under "Why the
      grid grew"; Part A flood-band description corrected (Zone B is one row on one bank,
      not "the next two out").

## Done this session (rules clarity: no-selling + flood protection)

- [x] **No selling.** rules.md Part F still had v3's "Selling a building refunds 50%" — the
      game has no sell/demolish-for-cash action. Replaced with: no selling, the 5-second
      full-refund undo window on every action, and moving (10%, no cash back) as the only
      post-commit option. Part K rule 5, Part J, Part L "What changed from v3" updated to
      match. Dead `sellRefundRate` constant removed from `simulation/engine/config.js`.
- [x] **Flood protection spelled out.** Part H Flood gained four subsections — "Dam
      protection — how the radius works" (6-column downstream strip, immunity by column not
      distance, both banks/all rows, no stacking), "Hydro station protection" (only on the
      dam's column or downstream; upstream-adjacent is unprotected; drainage doesn't help
      hydro), "Storm drainage" (5×5, halves repair cost only, no immunity, can't save Zone A
      park/drain/farm), and "Putting it together". Part E Protection table + prose tightened
      to match and cross-reference Part H.
- [x] **Flagged: transport buildings take zero flood damage.** `simulation/engine/
      twists.js`'s `floodCategory()` has no `transport` branch → bus stand / railway / metro
      / airport are flood-immune. Documented as-is in Part H ("Transport buildings ... are
      not affected by the flood") and flagged in Part L "Known risks" as possibly a v3→v4
      migration gap — fix is a one-line `transport` branch in `floodCategory` at the
      commercial/industry rates if it should flood.

## Other known gaps (unrelated to the frontend↔backend connection work)

- [ ] `simulation/` was **not** removed — it's the shared rules engine (`simulation/engine/
      *.js` is imported by both `src/pages/civil-wars/v3/engine.js` and
      `backend/game/engine.js`). The three struck-through items below were marked "moot,
      directory removed" in error.
- [ ] `simulation/strategies.js` (`ensurePower()`, ~line 284/300) still references
      `buildingsById.power_plant`, and (~line 600) `config.damDownstreamRadius` — both gone
      in v4. Breaks `simulation/sweep.js` / `simulation/run.js` / `simulation/
      inheritedCost.js` and is part of the pre-existing 12 failing engine tests. `strategies.js`
      needs a v4 pass (power_plant → dam+hydro, damDownstreamRadius → damProtectionSpan) or
      the balance harness stays broken.
- [ ] `simulation/engine/twists.test.js` (8 failures) and `simulate.js` still call the
      removed `applyPandemic`/`applyImmigration` and read the dead `config.pandemic*` keys —
      needs rewriting against `applyOutbreak`/`applyImmigrationSlums`, not just renaming.
- [ ] `simulation/engine/config.js` still carries a dead `pandemic*` constant block
      (lines 26–31) alongside the live `outbreak*` keys — safe to delete once the stale
      tests above stop reading it.
