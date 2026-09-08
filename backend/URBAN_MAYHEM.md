# Urban Mayhem backend (Civil Wars III)

Self-contained multiplayer backend for the live event version of the Team View game
(`src/pages/civil-wars/v3/`). Mounted at `/api/urban-mayhem/*` in `app.js`, entirely separate
from the internship-portal routes it lives alongside — delete `app.use('/api/urban-mayhem', ...)`
and this directory after the event if you want it gone.

## Why a backend at all

Not for scale — the whole event fits in a few megabytes of memory. It's for **trust**: every
laptop in the room has dev tools one keypress away, so budget/score can never be computed
client-side as the source of truth. The server owns every rule via the exact same engine the
client already uses (see "Shared engine" below) — the client only ever sends *intent*
(a building id + a tile), never a number.

## Environment variables

| Var | Required | Notes |
|---|---|---|
| `MONGO_URI` | yes | Same Mongo the rest of the backend uses is fine — this feature's collections (`urbanmayhemteams`, `urbanmayhemglobals`, `urbanmayhemactionlogs`) don't collide with anything. |
| `URBAN_MAYHEM_ADMIN_KEY` | yes, for the 4 organizer routes | One shared key for the one organizer laptop running the event — deliberately not a full admin login flow. Send it as the `x-admin-key` header. |

The rest of `config/env.js`'s required vars (JWT/IRIS/super-admin) are unrelated to this feature
but are still validated at startup outside `NODE_ENV=test` — see that file if you need to run the
whole backend standalone without the portal's other secrets configured.

## Before the event: seed team codes

```
node scripts/seedUrbanMayhem.js teams.json
```

`teams.json`: `[{ "teamName": "Spandan Engineers", "leaderRollNumber": "21CV045" }, ...]`

Generates one random 4-character code per team (alphabet excludes `O/0/I/1` so a code read off a
printed slip under event lighting can't be misread), inserts fresh teams, and writes
`urban-mayhem-codes.csv` next to the input file for printing slips. Re-running with the same file
adds more teams (codes are checked for collisions against what's already in the DB); it does not
touch existing teams.

## Identification: join codes, not passwords

No registration step, no password reset queue on the day. `POST /join` with the printed code sets
an httpOnly session cookie and returns just the team name — the client is expected to show that
name large and get an explicit "yes, this is us" before calling `/state`, so a mistyped code
(landing on a *different real team*) is caught in seconds, not ten minutes in.

Multiple sessions on one code are allowed (a dead laptop shouldn't lock a team out) — `sessions`
is an array on the team document, and `/join`'s response includes `otherActiveSessions` so the
client can show a banner. Nothing currently pushes a live update to the *other* session when a
new one joins; that'd need the polling `/state` response to carry `sessionsCount` (it already
does) and the client to render a banner when it's `> 1`.

## Shared engine

`game/engine.js` dynamically `import()`s `simulation/engine/*.js` once and caches it — necessary
because this backend is CommonJS and `simulation/` is ESM ("type": "module" at the repo root), and
a CJS file cannot `require()` an ESM file directly. Every route calls `await loadEngine()` first.
Nothing in `game/state.js` reimplements a rule; it's a straight port of
`src/pages/civil-wars/v3/store/useGameStore.js`'s mutating actions (`proposePlacement` →
`evaluatePlacement`, `advanceYear` → `applyYearTransition`) onto a plain team-state object instead
of Zustand state, so a bug fix or rule tweak in one should be mirrored in the other by hand until
the frontend is wired to call this API directly (see "Not done yet" below).

**Caught while wiring this up:** `applyPandemic` needs `state.slumUpgraded` as a `Set` (via
`computeCityStats`), and neither this backend's first draft *nor the original client store's
`advanceYear`* ever included it in the mutable state object passed to twists — any pandemic year
crashed with `Cannot read properties of undefined (reading 'has')`. Fixed in both places; see
`backend/tests/urbanMayhem.vitest.js`'s "resolves a pandemic year without crashing" test, which
forces the twist order so this can't silently regress.

## Game state model

One Mongo document per team (`models/UrbanMayhemTeam.js`) holding the whole board as JSON —
`state.placed`, `state.slumUpgraded`, `state.cash`, etc. — not normalized into per-building
collections; every action loads the whole document, mutates it, saves it back. There's no query
shape here that ever needs "all hospitals across all teams."

**`state.placed` is a Mongoose `Mixed` field, and that has a sharp edge**: Mongoose does not
detect nested mutations or path-level reassignment on `Mixed` fields the way it does for properly
schema-typed fields (`state.cash`, `state.slumUpgraded: [String]`). Every place that mutates
`team.state.placed` — `/action`'s place branch, `/advance-year`'s per-team loop, `/reset` — calls
`team.markModified('state.placed')` before `.save()`. Forgetting this doesn't error; it just
silently never reaches MongoDB while the in-memory response for *that one request* still looks
correct, which is exactly the shape of bug that only shows up on the *next* independent read. See
`urbanMayhem.vitest.js`'s "persists a second placement on top of a first" test, written
specifically to catch this class of regression (it re-fetches via a separate request rather than
trusting the mutated in-memory document).

The year/twist order/treasure tile live in a **separate singleton document**
(`models/UrbanMayhemGlobal.js`, `_id: "singleton"`) shared by every team — unlike the old
client-only prototype where each browser tab drew its own random twist order for solo testing,
a real event needs everyone hit by the same flood at the same moment.

## Year transitions are two-phase, and idempotent

1. `POST /lock-year` (admin) — every `/action` starts returning `423` immediately. Do this first
   and announce it; it closes the race where a click lands mid-flood-calculation and it's
   ambiguous whether that hospital existed when the flood hit.
2. `POST /advance-year` (admin) — refuses with `400` if the year isn't locked. For every team not
   already at or past the target year (the idempotency guard — see below), pays income *then*
   resolves the twist (a team about to lose income to the pandemic still collected the year that
   just ended), writes one `UrbanMayhemActionLog` entry per team (`action: "twist_<name>"`,
   the full twist result as `payload`), saves, then unlocks.

**Idempotency**: a team's `state.year` only ever advances via this exact path, so "already at or
past `nextYear` → skip" is the whole guard — no separate `twistsApplied` list needed. This
specifically covers a retried/double `POST /advance-year` where some teams already got processed
(e.g. a request that timed out client-side but actually succeeded) without double-charging anyone
income or double-applying a flood. Covered by `urbanMayhem.vitest.js`'s idempotency test, which
manually sets one seeded team's `state.year` ahead of the others to force the skip path
deterministically rather than relying on a real double-click race.

## Concurrency

`game/concurrency.js`'s `runSerialized(teamId, task)` chains every `/action` for a given team onto
the same promise, so two teammates on one join code clicking "place" at the same instant can't
produce a lost update — the second one's `findById` inside the queued task always sees the first
one's already-saved write. **This depends on the server running as a single Node process** for the
event; there's no clustering on this route, and there mustn't be, or each process gets its own
independent queue and the guarantee silently stops holding.

## Audit trail

`models/UrbanMayhemActionLog.js` — append-only, one row per committed action (`place`, `rehouse`,
`twist_<name>`), with a per-team `seq` counter (not a global one, so it doesn't contend across
teams), `cashAfter`, and `scoreAfter`. Never read during normal play; it's what you pull up when a
team disputes their score ("built this at Year 2, cash went from X to Y, here's exactly why") and
what a future replay-from-empty-state sanity check would walk.

## Endpoints

| Method & path | Auth | Notes |
|---|---|---|
| `POST /join` | — | `{ code }` → sets session cookie, returns `{ teamName, otherActiveSessions }` |
| `GET /state` | team session | current board + `locked` + `sessionsCount` |
| `POST /action` | team session | `{ type: "place", row, col, buildingId }` or `{ type: "rehouse", row, col }` |
| `POST /lock-year` | admin key | phase 1 of a year transition |
| `POST /advance-year` | admin key | phase 2; 400 if not locked first |
| `GET /overview` | admin key | every team: joined?, last-seen, cash, year, score |
| `POST /reset` | admin key | dev/rehearsal only — wipes all boards + sessions, keeps identities |

## Running the tests

`backend/tests/urbanMayhem.vitest.js` runs under the **root project's Vitest**, not this backend's
own Jest (`npm test`) — Jest's CommonJS loader can't execute a dynamic `import()` of a local ESM
file (`simulation/`) without `--experimental-vm-modules`, which isn't configured here. This is
purely a test-runner limitation (a plain `node server.js` + curl exercises every route fine); it's
why the file is named `*.vitest.js` rather than `*.test.js` — Jest's default `testMatch` won't try
and fail to pick it up.

```
TEST_MONGO_URI=mongodb://127.0.0.1:27017/urban_mayhem_test npx vitest run backend/tests/urbanMayhem.vitest.js
```

(from the repo root — needs a real Mongo reachable at that URI; defaults to
`mongodb://127.0.0.1:27017/pace_test` if `TEST_MONGO_URI` isn't set, matching the existing
`integration.test.js` convention.)

## Not done yet

- **The frontend still only talks to its local Zustand store**, not this API. Wiring it up means
  replacing the store's mutating actions with calls to `/action`/`/advance-year`, keeping the
  existing client-side `canPlace` dry-run for instant hover/drag feedback but treating every
  server response as the actual source of truth.
- **No live push** — `GET /state` is meant to be polled (every ~2s is plenty at this scale;
  self-heals through a wifi drop, which a websocket reconnect wouldn't do for free). Nothing polls
  it yet because nothing on the client calls this API yet.
- **No "banner naming the other session"** UI for the multi-session-per-code case — the data
  (`sessionsCount`) is already in every `/state` response, just not rendered anywhere.
- **Organizer Console** (`src/pages/civil-wars/v3/organizer/OrganizerConsole.jsx`) still drives the
  same client-only store as the team view; it doesn't call `/lock-year`/`/advance-year`/`/overview`
  yet.
