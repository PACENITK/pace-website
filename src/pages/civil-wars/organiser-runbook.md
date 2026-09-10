# URBAN MAYHEM — ORGANISER RUNBOOK

Everything the organiser does, in order, from setup to final scores. This is the
operational guide; `rules.md` Part L is the design rationale, `DOCKER_DEPLOY_GUIDE.md` is
the container ops.

---

## 0. THE SHAPE OF IT

One backend, one MongoDB, one shared "global" clock. Every team plays the same map with the
same fixed twist order. The organiser runs one laptop and drives the whole event from a
single web console.

| Who | URL | Auth |
|---|---|---|
| **Players** | `/civil-wars/v3/play` | 4-character join code (one per team) |
| **Organiser** | `/civil-wars/v3/organizer` | one shared admin key |
| Local sandbox (offline, no backend — for testing only) | `/civil-wars/v3` | none |

The organiser console does six things: **start practice**, **end practice**, **lock year**,
**advance year**, **full reset** (dev only), and shows a **live leaderboard**. That's the
entire control surface.

---

## 1. BEFORE THE EVENT

### 1.1 Server config

The backend needs two things set that a normal portal deploy does not provide:

| Variable | Where | Purpose |
|---|---|---|
| `URBAN_MAYHEM_ADMIN_KEY` | backend environment (`.env.production` / container env) | The organiser console's password. Pick any long random string. **Without it every organiser action returns HTTP 500.** |
| `VITE_API_URL` | frontend **build** environment | The backend's public origin, e.g. `https://pace.nitk.ac.in`. The player and organiser pages call `${VITE_API_URL}/api/urban-mayhem/...`; if unset it falls back to `http://localhost:5000`, which is wrong from a player's browser. (Alternative: reverse-proxy `/api` to the backend on the same origin and set `VITE_API_URL` to that origin.) |

MongoDB must be reachable at whatever `MONGO_URI` points to. With `network_mode: host` in
`docker-compose.yml`, that means `mongodb://127.0.0.1:27017/pace`, **not** `mongodb://mongo:27017`.

### 1.2 Seed the teams

Write a `teams.json`:

```json
[
  { "teamName": "Spandan Engineers", "leaderRollNumber": "21CV045" },
  { "teamName": "Concrete Jungle",   "leaderRollNumber": "21CV088" }
]
```

Run the seeder (from the backend directory, or inside the container):

```bash
node scripts/seedUrbanMayhem.js teams.json
# in Docker:
docker compose exec backend node scripts/seedUrbanMayhem.js /usr/src/app/backend/teams.json
```

It:

- generates **one unique 4-character code per team** from an unambiguous alphabet
  (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — no `O/0`, no `I/1`, so a code read off a printed
  slip can't be misread),
- creates each team with a fresh starting board (₹3,000 Cr, nothing built),
- resets the global clock to Year 0,
- prints a `code / teamName / leaderRollNumber` table and writes
  `urban-mayhem-codes.csv` next to `teams.json`.

Print the codes, one slip per team.

### 1.3 Open the organiser console

Go to `/civil-wars/v3/organizer`, enter the admin key. It's stored in the browser's
`sessionStorage` for the rest of the session (closing the tab forgets it; a wrong key
re-prompts). The console starts polling `/overview` every 3 seconds and shows the
leaderboard immediately — empty until teams join.

---

## 2. THE TRIAL (PRACTICE PERIOD) — optional but recommended

**Purpose:** teams join, learn the interface, read the rules, and get comfortable — on a
board that will be thrown away. Nothing here is scored.

### 2.1 Start it

On the console, top bar: set the minutes (default **10**), click **Start practice**.

- This sets the global phase to `practice` and a countdown deadline.
- Every player page shows a "Practice ends in M:SS" banner.
- **Building is not restricted during practice** — teams use the exact same rules, costs
  and map as the real game. The only difference is that it's about to be wiped.

### 2.2 Hand out codes and let teams join

Each team opens `/civil-wars/v3/play`, types their 4-character code, and confirms the team
name shown ("is this you?") before the board loads — so a mistyped code is caught in
seconds, not ten minutes in.

- A team can join from **multiple devices** on the same code. Each device gets its own
  session; the join screen tells them how many other devices are already active on that
  code. All devices see the same board, live (2.5-second poll).
- The session is a cookie, valid 12 hours — longer than the event day.
- The console's **Sessions** column shows how many devices each team has connected.

### 2.3 End it — this starts the real game

When practice time is up (or you're ready), click **End practice & start the real game**
(you'll need to click it twice — it arms for 4 seconds).

This does all of the following at once:

- **wipes every team's board** back to fresh (₹3,000 Cr, nothing built),
- clears the practice period's action log,
- re-initialises the global clock to Year 0, phase `live`,
- **keeps every session** — no team re-enters a code.

Players see a banner: *"Practice is over — the real game has begun. Your board was reset."*
(auto-dismisses after 8 seconds).

> If you skip the practice period entirely, the game is already in phase `live` at Year 0
> from the moment you seeded — just hand out codes and go.

---

## 3. THE MAIN GAME

### 3.1 Year 0 — planning (15 minutes)

- Phase is `live`, year is `0`, nothing is locked.
- Teams build freely. No income is paid and no yearly costs are charged in Year 0.
- **The mandatory floor** (1 dam + 1 hydro, water covering all inherited demand, 1 sewage
  plant, 1 hospital) is checked the moment you advance out of Year 0 — see 3.3. Remind
  teams; it's a −100 score hit and halves their Year 1 income if missed, but it never
  blocks them from playing.
- Give a verbal 2-minute warning before you lock.

### 3.2 Locking a year

Click **Lock year**. This sets `locked = true` globally. Every team's build action now
returns "Year is ending — building is paused." Use this to freeze the board so a twist
can't race an in-flight click.

The **Advance year** button only becomes clickable once the year is locked.

### 3.3 Advancing a year (this is what fires the twist)

Click **Advance year →**. The order is **fixed and the same for every team**:

| Advancing into | Twist applied | What it does to each team |
|---|---|---|
| **Year 1** | **Flood** | Damages/destroys unprotected buildings in the flood zones; produces per-team repair bills. Also runs the mandatory-floor check. |
| **Year 2** | **Waterborne outbreak** | Checks containment (sewage / treatment-plant coverage) then treatment (hospitals per infected population). Score/cash swing per team. |
| **Year 3** | **Immigration** | Spawns two new unserved slum tiles near each team's settlements. |
| **Year 4** | **Olympics** | Checks 1 stadium + 5 hotels + 3 restaurants. +₹500 Cr / +150 or −50 per team. |
| **Year 5** | **Treasure** | Reveals the treasure tile. Teams choose whether to claim it during the rest of Year 5. |

What happens on the server when you click:

1. Income for the new year is paid to every team from the buildings they had standing.
2. That year's twist is applied to each team individually — the result depends entirely on
   what they built.
3. Each team's score delta, cash bonus/penalty and income multiplier are recorded to the
   action log as a `twist_<name>` row.
4. The global year advances and unlocks automatically.
5. The console shows "Year N's twist: <name>".

**You do not "enable" twists separately.** Advancing the year *is* firing that year's
twist. Within ~2.5 seconds every team's page pops a modal showing **what that twist did to
them specifically** — their damage list, their infection count, their two new slums, their
Olympics result, or the treasure reveal. The organiser does nothing further.

Double-clicking **Advance year** is safe — teams already moved to the new year are skipped.

### 3.4 The per-year loop

For each of Years 1 → 5:

1. Let teams play (~5–6 minutes).
2. 2-minute verbal warning.
3. **Lock year.**
4. **Advance year →** (fires the twist; every team gets their modal).
5. Teams react to the twist — repair flood damage, emergency-build hospitals, reach the
   new slums, claim or ignore the treasure — during the *next* year's clock.

A year can be held open as long as you like — just don't lock/advance until you're ready.

### 3.5 The end (after Year 5)

There is no automated "Year 6". Once teams have finished spending in Year 5 (including the
treasure decision):

- **Lock year** one last time so nobody can keep building.
- Attempting to advance past Year 5 returns "Game is already complete."
- Read the final standings off the console leaderboard (see section 4) and announce them.

---

## 4. TRACKING SCORE

The console polls `/overview` every 3 seconds and shows a leaderboard, ranked by score
descending:

| Column | Meaning |
|---|---|
| # | Rank |
| Code | The team's join code |
| Team | Team name |
| Joined | Whether anyone has connected yet |
| Sessions | Number of connected devices |
| Cash | Current spendable balance |
| Year | Which year that team is on (should match the global year) |
| Buildings | Count of buildings placed |
| **Score** | Live score — board score + cash × 0.05 + every twist's cumulative adjustment |

**This is the only place any score is visible.** Players never see a score — not their
own, not anyone's — at any point before you announce the final standings. That's
deliberate (`rules.md` Part I): all a team ever sees is which service pips are filled.

The score shown is the same formula that produces the final number — it's been running the
whole time, just never shown to players. At the end, the leaderboard *is* the result.

---

## 5. IF SOMETHING GOES WRONG

| Symptom | Cause / fix |
|---|---|
| Organiser console: "Bad or missing admin key" on every action | `URBAN_MAYHEM_ADMIN_KEY` not set on the server, or you typed it wrong. Check the backend env; the console 500s if it's absent. |
| Players: page loads but "not joined" / can't reach the board | `VITE_API_URL` wasn't set at build time, so the browser is calling `localhost:5000`. Rebuild the frontend with `VITE_API_URL` pointing at the backend's public origin. |
| Backend won't start / can't connect to Mongo | With host networking, `MONGO_URI` must be `mongodb://127.0.0.1:27017/pace`, not `mongodb://mongo:...`. |
| A team joined the wrong code | They'll have seen the wrong team name on the confirm screen. Re-issue the correct slip; the bad session is harmless (it's just another device on that other team — visible in the Sessions count). |
| Team says their board is wrong / wants a do-over mid-event | There is no per-team reset. The only resets are **End practice** and **Full reset**, both of which wipe *everyone*. Don't. |
| You advanced a year too early | Not reversible from the console. The twist has been applied and logged. Decide whether to hold the next year open longer to compensate, or (worst case, pre-scoring) `Full reset` and restart — this logs everyone out and they re-enter codes. |
| Need to wipe everything and restart (rehearsal, or a broken event) | **Full reset** (dev button, arms on first click, confirms on second). Wipes all boards, clears all sessions, re-inits the clock. Teams must re-enter their codes. Codes and team names survive. |
| Double-clicked Lock or Advance | Both are idempotent — no harm. |

---

## 6. QUICK REFERENCE — the whole event on one page

```
BEFORE
  set URBAN_MAYHEM_ADMIN_KEY on backend, VITE_API_URL on frontend build
  node scripts/seedUrbanMayhem.js teams.json     -> print code slips
  open /civil-wars/v3/organizer, enter admin key

PRACTICE (optional, ~10 min)
  [Start practice]  (set minutes)
  hand out code slips; teams join at /civil-wars/v3/play
  [End practice & start the real game]  (double-click)  -> boards wiped, sessions kept

YEAR 0  (15 min)   planning, no income/costs, remind teams of the mandatory floor

YEARS 1..5  (~6 min each)
  let them play  ->  2-min warning  ->  [Lock year]  ->  [Advance year ->]
    Y1 Flood | Y2 Outbreak | Y3 Immigration | Y4 Olympics | Y5 Treasure
  each team's page auto-shows what the twist did to them

AFTER YEAR 5
  [Lock year]  (final)
  read leaderboard off the console  ->  announce standings

leaderboard (console only, polled every 3s) is the single source of score
players never see any score until you announce it
```
