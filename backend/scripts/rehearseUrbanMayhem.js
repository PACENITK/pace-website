/* eslint-disable no-console */
//
// Full-event rehearsal for Urban Mayhem, compressed into ~5 minutes.
//
// Spins up N bot "players" that each join with a throwaway code and play
// the game over real HTTP -- exactly the requests a browser makes. A
// separate conductor loop fires the twists on a timer: lock -> advance,
// once per `--year-seconds`, walking Flood -> Outbreak -> Immigration ->
// Olympics -> Treasure. The bots keep building the whole time and react
// after each twist (repair flood damage, emergency hospitals, reach the
// new slums, claim the treasure).
//
// It's a dress rehearsal for the deployed stack: nginx routing, the
// container's ESM engine, Mongoose Mixed-field persistence, the twist
// order, score sanity, and concurrency all get exercised at once.
//
// USAGE
//   node scripts/rehearseUrbanMayhem.js --admin <ADMIN_KEY> [options]
//
//   --url <base>          API base URL (default http://localhost:5000)
//   --admin <key>         URBAN_MAYHEM_ADMIN_KEY (required)
//   --teams <n>           bot count (default 6)
//   --year-seconds <s>    seconds between twists (default 60 -> ~5 min run)
//   --warmup <s>          Year 0 build time before the first twist (default = year-seconds)
//   --no-cleanup          leave the RHRS* teams and board in place for inspection
//   --mongo <uri>         Mongo URI (default: config/env.js)
//
// Run it against a local `docker compose` stack first, then against prod
// (it only ever touches teams whose code starts with RHRS, and resets
// the global clock -- so run it BEFORE seeding the real teams, or accept
// that it wipes the shared clock and re-seed afterward).

const path = require('path');

// ---------- args ----------
const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
}
const BASE_URL = String(arg('url', 'http://localhost:5000')).replace(/\/$/, '');
const ADMIN_KEY = arg('admin', process.env.URBAN_MAYHEM_ADMIN_KEY);
const TEAM_COUNT = Number(arg('teams', 6));
const YEAR_SECONDS = Number(arg('year-seconds', 60));
const WARMUP_SECONDS = Number(arg('warmup', YEAR_SECONDS));
const NO_CLEANUP = arg('cleanup') === false || args.includes('--no-cleanup');
const MONGO_URI = arg('mongo', null);

if (!ADMIN_KEY) {
  console.error('Missing --admin <ADMIN_KEY> (or URBAN_MAYHEM_ADMIN_KEY in the env).');
  process.exit(1);
}

const CODE_PREFIX = 'RHRS';
const EXPECTED_TWISTS = ['flood', 'pandemic', 'immigration', 'olympics', 'treasure'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (base) => base + Math.floor(Math.random() * base);
const tileKey = (r, c) => `${r},${c}`;
const chebyshev = (r1, c1, r2, c2) => Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));

// ---------- shared failure log ----------
const failures = [];
const notes = [];
function fail(msg) {
  failures.push(msg);
  console.log(`  ✗ ${msg}`);
}
function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function note(msg) {
  notes.push(msg);
  console.log(`  · ${msg}`);
}

// ---------- tiny HTTP client with a one-cookie jar ----------
function makeClient() {
  let cookie = null;
  async function req(method, urlPath, { body, admin } = {}) {
    const headers = { 'content-type': 'application/json' };
    if (cookie) headers.cookie = cookie;
    if (admin) headers['x-admin-key'] = ADMIN_KEY;
    const res = await fetch(`${BASE_URL}/api/urban-mayhem${urlPath}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const setCookie = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie')].filter(Boolean);
    for (const sc of setCookie) {
      if (sc && sc.startsWith('um_session=')) cookie = sc.split(';')[0];
    }
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data };
  }
  return {
    get: (p, o) => req('GET', p, o),
    post: (p, body, o) => req('POST', p, { ...o, body }),
  };
}

// ---------- strategy plans ----------
// Each entry: { id, count, hint }. The bot walks the list top to bottom,
// building the first item it's short on, once per tick.
const PLANS = {
  solid: [
    { id: 'dam', count: 1, hint: 'river' },
    { id: 'hydro_station', count: 1, hint: 'nextToDam' },
    { id: 'water_treatment', count: 2, hint: 'centralPop' },
    { id: 'sewage_plant', count: 2, hint: 'nearSlum' },
    { id: 'farm', count: 2, hint: 'anywhere' },
    { id: 'hospital', count: 4, hint: 'nearPop' },
    { id: 'school', count: 3, hint: 'nearPop' },
    { id: 'safety_station', count: 3, hint: 'nearPop' },
    { id: 'park', count: 6, hint: 'nearPop' },
    { id: 'bus_stand', count: 3, hint: 'nearPop' },
    { id: 'railway', count: 1, hint: 'centralPop' },
    { id: 'residential_medium', count: 5, hint: 'empty' },
    { id: 'market', count: 2, hint: 'nearPop' },
    { id: 'restaurant', count: 3, hint: 'nearPop' },
  ],
  olympics: [
    { id: 'dam', count: 1, hint: 'river' },
    { id: 'hydro_station', count: 1, hint: 'nextToDam' },
    { id: 'water_treatment', count: 2, hint: 'centralPop' },
    { id: 'sewage_plant', count: 2, hint: 'nearSlum' },
    { id: 'farm', count: 1, hint: 'anywhere' },
    { id: 'hospital', count: 3, hint: 'nearPop' },
    { id: 'school', count: 2, hint: 'nearPop' },
    { id: 'park', count: 4, hint: 'nearPop' },
    { id: 'bus_stand', count: 2, hint: 'nearPop' },
    { id: 'railway', count: 1, hint: 'centralPop' },
    { id: 'residential_medium', count: 4, hint: 'empty' },
    { id: 'restaurant', count: 3, hint: 'nearPop' },
    { id: 'hotel', count: 5, hint: 'nearPop' },
    { id: 'stadium', count: 1, hint: 'empty' },
  ],
  // deliberately fails the mandatory floor on all four items
  sloppy: [
    { id: 'residential_small', count: 12, hint: 'empty' },
    { id: 'park', count: 3, hint: 'nearPop' },
  ],
  // has power + water but no sewage / no hospital -> fails floor on two,
  // and no sewage near the slums -> the outbreak should bite
  halfbaked: [
    { id: 'dam', count: 1, hint: 'river' },
    { id: 'hydro_station', count: 1, hint: 'nextToDam' },
    { id: 'water_tank', count: 4, hint: 'nearPop' },
    { id: 'school', count: 2, hint: 'nearPop' },
    { id: 'residential_medium', count: 6, hint: 'empty' },
  ],
  industrialist: [
    { id: 'dam', count: 1, hint: 'river' },
    { id: 'hydro_station', count: 2, hint: 'nextToDam' },
    { id: 'water_treatment', count: 2, hint: 'centralPop' },
    { id: 'sewage_plant', count: 2, hint: 'nearSlum' },
    { id: 'farm', count: 1, hint: 'anywhere' },
    { id: 'hospital', count: 3, hint: 'nearPop' },
    { id: 'school', count: 2, hint: 'nearPop' },
    { id: 'park', count: 8, hint: 'nearPop' },
    { id: 'bus_stand', count: 2, hint: 'nearPop' },
    { id: 'residential_medium', count: 3, hint: 'empty' },
    { id: 'industry_medium', count: 2, hint: 'edge' },
  ],
};
const STRATEGY_CYCLE = ['solid', 'olympics', 'halfbaked', 'industrialist', 'solid', 'sloppy'];

// ---------- the bot ----------
function makeBot({ code, strategy, map, buildings }) {
  const client = makeClient();
  const plan = PLANS[strategy];
  let stopped = false;
  let reactedYear = 0;
  const seen = { placed: {}, extraSlums: {}, cash: 3000, year: 0, damagedTiles: {} };
  const stats = { placed: 0, rejected: 0, repairs: 0, errors: 0, claimedTreasure: false, everHadDamage: false };
  let treasureClaimTried = false;

  const width = map.width;
  const height = map.height;
  const RIVER_ROW = (() => {
    for (let r = 0; r < height; r++) if (map.tiles[r].some((t) => t.type === 'river')) return r;
    return Math.floor(height / 2);
  })();
  const SLUMS = [];
  const POP_ANCHORS = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const t = map.tiles[r][c].type;
      if (t === 'slum') { SLUMS.push([r, c]); POP_ANCHORS.push([r, c]); }
      if (t === 'colony') POP_ANCHORS.push([r, c]);
    }
  }

  function isEmptyBuildable(r, c) {
    if (r < 0 || c < 0 || r >= height || c >= width) return false;
    if (map.tiles[r][c].type !== 'empty') return false;
    if (seen.placed[tileKey(r, c)]) return false;
    if (seen.extraSlums && seen.extraSlums[tileKey(r, c)]) return false;
    return true;
  }

  // return [row,col] or null
  function pickTile(hint) {
    const ownDams = Object.entries(seen.placed).filter(([, id]) => id === 'dam').map(([k]) => k.split(',').map(Number));
    const ownRes = Object.entries(seen.placed)
      .filter(([, id]) => buildings[id] && buildings[id].category === 'residential')
      .map(([k]) => k.split(',').map(Number));
    const anchors = [...POP_ANCHORS, ...ownRes];

    if (hint === 'river') {
      // downstream half, spread the dams out
      const taken = ownDams.map(([, c]) => c);
      for (const c of [5, 8, 3, 10, 6, 4, 9, 7, 2, 11]) {
        if (!seen.placed[tileKey(RIVER_ROW, c)] && !taken.includes(c)) return [RIVER_ROW, c];
      }
      return null;
    }
    if (hint === 'nextToDam') {
      for (const [dr, dc] of ownDams) {
        // prefer downstream (higher column) so the hydro sits inside the protection strip
        for (const [rr, cc] of [[dr, dc + 1], [dr - 1, dc + 1], [dr + 1, dc + 1], [dr - 1, dc], [dr + 1, dc]]) {
          if (isEmptyBuildable(rr, cc)) return [rr, cc];
        }
      }
      return null;
    }
    const scan = (score) => {
      let best = null;
      let bestScore = -Infinity;
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          if (!isEmptyBuildable(r, c)) continue;
          const s = score(r, c) + Math.random() * 0.5;
          if (s > bestScore) { bestScore = s; best = [r, c]; }
        }
      }
      return best;
    };
    if (hint === 'nearSlum') {
      return scan((r, c) => -Math.min(...SLUMS.map(([sr, sc]) => chebyshev(r, c, sr, sc))));
    }
    if (hint === 'nearPop' || hint === 'centralPop') {
      if (anchors.length === 0) return scan(() => 0);
      return scan((r, c) => -Math.min(...anchors.map(([ar, ac]) => chebyshev(r, c, ar, ac))));
    }
    if (hint === 'edge') {
      return scan((r, c) => Math.min(r, c, height - 1 - r, width - 1 - c) === 0 ? 5 : 0);
    }
    // 'anywhere' / 'empty'
    return scan(() => 0);
  }

  async function tryPlace(id, hint) {
    const tile = pickTile(hint);
    if (!tile) return false;
    const [row, col] = tile;
    const { status, data } = await client.post('/action', { type: 'place', row, col, buildingId: id });
    if (status === 200) {
      applyState(data);
      stats.placed += 1;
      return true;
    }
    if (status >= 500) {
      stats.errors += 1;
      fail(`[${code}] 500 placing ${id} at ${row},${col}: ${data && data.error}`);
      return false;
    }
    // 400/423 are normal (can't afford yet, prereq missing, tile taken, year locked)
    stats.rejected += 1;
    return false;
  }

  function applyState(s) {
    if (!s || typeof s !== 'object') return;
    if (s.placed) seen.placed = s.placed;
    if (s.extraSlums) seen.extraSlums = s.extraSlums;
    if (s.damagedTiles) seen.damagedTiles = s.damagedTiles;
    if (s.damagedTiles && Object.keys(s.damagedTiles).length > 0) stats.everHadDamage = true;
    if (typeof s.cash === 'number') seen.cash = s.cash;
    if (typeof s.year === 'number') seen.year = s.year;
    seen.locked = s.locked;
    seen.phase = s.phase;
    seen.lastTwistYear = s.lastTwistYear;
    seen.lastTwistResult = s.lastTwistResult;
    seen.treasureRevealed = s.treasureRevealed;
    seen.treasureTile = s.treasureTile;
  }

  function planCounts() {
    const counts = {};
    for (const id of Object.values(seen.placed)) counts[id] = (counts[id] || 0) + 1;
    return counts;
  }

  async function doNextBuild() {
    const counts = planCounts();
    for (const step of plan) {
      if ((counts[step.id] || 0) >= step.count) continue;
      const placed = await tryPlace(step.id, step.hint);
      return placed; // one attempt per tick, success or not
    }
    return false; // plan exhausted
  }

  async function react() {
    const twist = seen.lastTwistResult && seen.lastTwistResult.twist;

    // repair everything affordable
    for (const [key, entry] of Object.entries(seen.damagedTiles || {})) {
      if (!entry || seen.cash < entry.repairCost) continue;
      const [row, col] = key.split(',').map(Number);
      const { status, data } = await client.post('/action', { type: 'repair', row, col });
      if (status === 200) { applyState(data); stats.repairs += 1; }
      else if (status >= 500) { stats.errors += 1; fail(`[${code}] 500 repairing ${key}: ${data && data.error}`); }
    }

    if (twist === 'pandemic') {
      const tier = seen.lastTwistResult.result && seen.lastTwistResult.result.tier;
      if (tier === 'short' || tier === 'noHospital') {
        await tryPlace('hospital', 'nearSlum');
        await tryPlace('hospital', 'nearPop');
      }
    }

    if (twist === 'immigration') {
      for (const key of Object.keys(seen.extraSlums || {})) {
        const [sr, sc] = key.split(',').map(Number);
        // drop a cluster of services next to each new slum
        for (const id of ['water_tank', 'sewage_plant', 'hospital', 'school']) {
          const tile = (() => {
            for (let d = 1; d <= 3; d++)
              for (let dr = -d; dr <= d; dr++)
                for (let dc = -d; dc <= d; dc++)
                  if (isEmptyBuildable(sr + dr, sc + dc)) return [sr + dr, sc + dc];
            return null;
          })();
          if (!tile) continue;
          const { status, data } = await client.post('/action', { type: 'place', row: tile[0], col: tile[1], buildingId: id });
          if (status === 200) { applyState(data); stats.placed += 1; }
          else if (status >= 500) { stats.errors += 1; fail(`[${code}] 500 (immigration) ${id}: ${data && data.error}`); }
        }
      }
    }

    if (seen.treasureRevealed && seen.treasureTile && !treasureClaimTried) {
      treasureClaimTried = true;
      const { status, data } = await client.post('/action', { type: 'claim_treasure' });
      if (status === 200) { applyState(data); stats.claimedTreasure = true; }
      else if (status >= 500) { stats.errors += 1; fail(`[${code}] 500 claiming treasure: ${data && data.error}`); }
      else note(`[${code}] treasure claim rejected (ok if not on the tile): ${data && data.error}`);
    }
  }

  return {
    code,
    strategy,
    stats,
    seen,
    client,
    async join() {
      const { status, data } = await client.post('/join', { code });
      if (status !== 200) throw new Error(`join ${code} -> ${status} ${data && data.error}`);
      const first = await client.get('/state');
      if (first.status === 200) applyState(first.data);
      return data;
    },
    stop() { stopped = true; },
    async run() {
      while (!stopped) {
        try {
          const { status, data } = await client.get('/state');
          if (status >= 500) { stats.errors += 1; fail(`[${code}] 500 on /state`); }
          if (status === 200) {
            applyState(data);
            if (!seen.locked) {
              if ((seen.lastTwistYear || 0) > reactedYear) {
                reactedYear = seen.lastTwistYear;
                await react();
              } else {
                await doNextBuild();
              }
            }
          }
        } catch (e) {
          stats.errors += 1;
          fail(`[${code}] request threw: ${e.message}`);
        }
        await sleep(jitter(900));
      }
    },
  };
}

// ---------- seed / cleanup (direct DB, like seedUrbanMayhem.js) ----------
async function withDb(fn) {
  const mongoose = require('mongoose');
  const uri = MONGO_URI || require('../config/env').MONGO_URI;
  await mongoose.connect(uri);
  try {
    return await fn(mongoose);
  } finally {
    await mongoose.disconnect();
  }
}

async function seedTeams(count) {
  return withDb(async () => {
    const UrbanMayhemTeam = require('../models/UrbanMayhemTeam');
    const UrbanMayhemGlobal = require('../models/UrbanMayhemGlobal');
    const UrbanMayhemActionLog = require('../models/UrbanMayhemActionLog');
    const { createInitialTeamState, createInitialGlobal } = require('../game/state');
    const { loadEngine } = require('../game/engine');
    const engine = await loadEngine();

    await UrbanMayhemTeam.deleteMany({ code: { $regex: `^${CODE_PREFIX}` } });
    await UrbanMayhemActionLog.deleteMany({});

    const codes = [];
    for (let i = 1; i <= count; i++) {
      const code = `${CODE_PREFIX}${String(i).padStart(2, '0')}`;
      const strategy = STRATEGY_CYCLE[(i - 1) % STRATEGY_CYCLE.length];
      await UrbanMayhemTeam.create({
        code,
        teamName: `Rehearsal ${i} (${strategy})`,
        leaderRollNumber: 'REHEARSAL',
        state: createInitialTeamState(engine),
      });
      codes.push({ code, strategy });
    }
    await UrbanMayhemGlobal.findByIdAndUpdate('singleton', createInitialGlobal(engine), { upsert: true, setDefaultsOnInsert: true });
    return codes;
  });
}

async function cleanup() {
  return withDb(async () => {
    const UrbanMayhemTeam = require('../models/UrbanMayhemTeam');
    const UrbanMayhemGlobal = require('../models/UrbanMayhemGlobal');
    const UrbanMayhemActionLog = require('../models/UrbanMayhemActionLog');
    const { createInitialGlobal } = require('../game/state');
    const { loadEngine } = require('../game/engine');
    const engine = await loadEngine();
    await UrbanMayhemTeam.deleteMany({ code: { $regex: `^${CODE_PREFIX}` } });
    await UrbanMayhemActionLog.deleteMany({});
    await UrbanMayhemGlobal.findByIdAndUpdate('singleton', createInitialGlobal(engine), { upsert: true });
  });
}

async function loadMapAndBuildings() {
  const mapMod = await import(path.join(__dirname, '../../simulation/data/map.js'));
  const buildMod = await import(path.join(__dirname, '../../simulation/engine/buildings.js'));
  return { map: mapMod.default, buildings: buildMod.default };
}

// ---------- conductor ----------
async function conductor(admin, dbTeamCount) {
  const seq = [];
  await sleep(WARMUP_SECONDS * 1000);
  for (let i = 0; i < 5; i++) {
    const lock = await admin.post('/lock-year', {}, { admin: true });
    if (lock.status !== 200) fail(`lock-year #${i + 1} -> ${lock.status} ${lock.data && lock.data.error}`);
    await sleep(3000); // let in-flight bot actions drain
    const adv = await admin.post('/advance-year', {}, { admin: true });
    if (adv.status !== 200) {
      fail(`advance-year #${i + 1} -> ${adv.status} ${adv.data && adv.data.error}`);
    } else {
      seq.push(adv.data.twist);
      const expected = EXPECTED_TWISTS[i];
      if (adv.data.twist === expected) ok(`Year ${adv.data.year}: ${adv.data.twist} (${adv.data.teamsProcessed} teams)`);
      else fail(`Year ${adv.data.year}: expected "${expected}", got "${adv.data.twist}"`);
      // Every team in the DB should advance -- the bots plus any stale
      // rows already present (which is itself worth knowing about).
      if (adv.data.teamsProcessed !== dbTeamCount) {
        fail(`Year ${adv.data.year}: processed ${adv.data.teamsProcessed} teams, expected ${dbTeamCount} (all rows in the DB)`);
      }
    }
    if (i < 4) await sleep(Math.max(0, YEAR_SECONDS * 1000 - 3000));
  }
  return seq;
}

// ---------- main ----------
async function main() {
  const t0 = Date.now();
  console.log(`\nUrban Mayhem rehearsal -> ${BASE_URL}`);
  console.log(`${TEAM_COUNT} bots, ${YEAR_SECONDS}s/year, ~${Math.round((WARMUP_SECONDS + YEAR_SECONDS * 5) / 60)} min total\n`);

  console.log('Seeding throwaway teams...');
  const codes = await seedTeams(TEAM_COUNT);
  const { map, buildings } = await loadMapAndBuildings();

  const bots = codes.map(({ code, strategy }) => makeBot({ code, strategy, map, buildings }));
  const admin = makeClient();

  console.log('Bots joining...');
  for (const bot of bots) {
    try {
      await bot.join();
    } catch (e) {
      fail(`bot ${bot.code} could not join: ${e.message}`);
    }
  }

  // overview should now show every bot joined
  const ov0 = await admin.get('/overview', { admin: true });
  let dbTeamCount = TEAM_COUNT;
  if (ov0.status !== 200) {
    fail(`/overview -> ${ov0.status} ${ov0.data && ov0.data.error} (URBAN_MAYHEM_ADMIN_KEY set on the server?)`);
  } else {
    dbTeamCount = ov0.data.teams.length;
    const joined = ov0.data.teams.filter((t) => t.joined).length;
    if (joined === TEAM_COUNT) ok(`all ${TEAM_COUNT} bots joined`);
    else fail(`only ${joined}/${TEAM_COUNT} bots show as joined`);
    const stale = ov0.data.teams.filter((t) => !String(t.code).startsWith(CODE_PREFIX));
    if (stale.length > 0) {
      note(`${stale.length} non-rehearsal team(s) already in the DB (${stale.map((t) => t.code).join(', ')}) -- they'll be advanced and scored too`);
    }
  }

  // undo smoke: place then undo on one bot, before real play starts
  if (bots.length > 0) {
    const b0 = bots[0];
    const c0 = (await b0.client.get('/state')).data.cash;
    await b0.client.post('/action', { type: 'place', row: 0, col: 0, buildingId: 'park' });
    const c1 = (await b0.client.get('/state')).data.cash;
    const un = await b0.client.post('/action', { type: 'undo' });
    const c2 = (await b0.client.get('/state')).data.cash;
    if (un.status === 200 && c1 === c0 - 10 && c2 === c0) ok('undo: place (₹10) then undo restored the cash');
    else fail(`undo smoke failed: cash ${c0} -> ${c1} (placed) -> ${c2} (undone), undo status ${un.status}`);
  }

  console.log('\nPlaying...\n');
  const botRuns = bots.map((b) => b.run());
  const twistSeq = await conductor(admin, dbTeamCount);

  // let the bots do a final treasure/spend pass, then stop
  await sleep(8000);
  bots.forEach((b) => b.stop());
  await Promise.all(botRuns);

  // ---------- assertions on the finished game ----------
  console.log('\nChecking the finished game:');
  if (twistSeq.join(',') === EXPECTED_TWISTS.join(',')) ok(`twist order: ${twistSeq.join(' -> ')}`);
  else fail(`twist order was ${twistSeq.join(' -> ')}, expected ${EXPECTED_TWISTS.join(' -> ')}`);

  const ov = await admin.get('/overview', { admin: true });
  let leaderboard = [];
  if (ov.status !== 200) {
    fail(`final /overview -> ${ov.status}`);
  } else {
    leaderboard = [...ov.data.teams].sort((a, b) => b.score - a.score);
    if (ov.data.global.year === 5) ok('global clock reached Year 5');
    else fail(`global year is ${ov.data.global.year}, expected 5`);

    for (const t of ov.data.teams) {
      if (!Number.isFinite(t.score)) fail(`${t.code}: score is not a finite number (${t.score})`);
      if (t.year !== 5) fail(`${t.code}: team year is ${t.year}, expected 5`);
    }
    if (ov.data.teams.every((t) => Number.isFinite(t.score))) ok('every team has a finite score');
  }

  // reveal results -> every team's /state should now carry a score
  // breakdown whose total matches the leaderboard
  const rev = await admin.post('/reveal-results', { show: true }, { admin: true });
  if (rev.status !== 200 || rev.data.phase !== 'results') {
    fail(`reveal-results -> ${rev.status} ${JSON.stringify(rev.data)}`);
  } else {
    let breakdownOk = true;
    for (const bot of bots) {
      const st = await bot.client.get('/state');
      const bd = st.data && st.data.scoreBreakdown;
      const lbScore = leaderboard.find((t) => t.code === bot.code)?.score;
      if (!bd || !Number.isFinite(bd.total)) { breakdownOk = false; fail(`${bot.code}: no scoreBreakdown after reveal`); continue; }
      if (Math.round(bd.total) !== Math.round(lbScore)) {
        breakdownOk = false;
        fail(`${bot.code}: breakdown total ${bd.total} != leaderboard ${lbScore}`);
      }
      const sum = Math.floor(bd.board.total + bd.cashBonus + bd.twistAdjustment);
      if (sum !== Math.round(bd.total)) { breakdownOk = false; fail(`${bot.code}: breakdown parts ${sum} != total ${bd.total}`); }
    }
    if (breakdownOk) ok('results revealed: every team has a breakdown whose total + parts check out');
    // building is refused once results are shown
    const blocked = await bots[0].client.post('/action', { type: 'place', row: 1, col: 1, buildingId: 'park' });
    if (blocked.status === 423) ok('building is refused after results are revealed');
    else fail(`expected 423 building after reveal, got ${blocked.status}`);
  }

  // per-bot state checks
  let anyFlood = false;
  let allImmigration = true;
  for (const bot of bots) {
    if (bot.stats.everHadDamage) anyFlood = true;
    if (Object.keys(bot.seen.extraSlums || {}).length !== 2) allImmigration = false;
  }
  if (anyFlood) ok('flood damaged buildings on at least one team (seen at the reveal)');
  else note('no bot ever saw flood damage -- possible if every bot built clear of the flood zones');
  if (allImmigration) ok('every bot has exactly 2 immigration slums');
  else fail('some bot does not have exactly 2 extraSlums after immigration');

  const totalErrors = bots.reduce((n, b) => n + b.stats.errors, 0);
  if (totalErrors === 0) ok('no 5xx responses to any bot');
  else fail(`${totalErrors} server errors hit by bots`);

  // ---------- report ----------
  console.log('\n---------- leaderboard ----------');
  console.log('  rank  code    strategy       cash    bld   score');
  leaderboard.forEach((t, i) => {
    const bot = bots.find((b) => b.code === t.code);
    console.log(
      `  ${String(i + 1).padStart(2)}    ${t.code}  ${(bot ? bot.strategy : '').padEnd(13)} ` +
        `${String(Math.round(t.cash)).padStart(6)}  ${String(t.buildingsPlaced).padStart(4)}  ${String(Math.round(t.score)).padStart(6)}`
    );
  });
  console.log('\n---------- bot activity ----------');
  for (const b of bots) {
    console.log(
      `  ${b.code} ${b.strategy.padEnd(13)} placed ${b.stats.placed}, repairs ${b.stats.repairs}, ` +
        `rejected ${b.stats.rejected}, treasure ${b.stats.claimedTreasure ? 'claimed' : '-'}, errors ${b.stats.errors}`
    );
  }

  if (!NO_CLEANUP) {
    console.log('\nCleaning up (RHRS* teams + global clock)...');
    await cleanup();
  } else {
    console.log(`\n--no-cleanup: ${TEAM_COUNT} RHRS* teams and the Year 5 board are left in place.`);
  }

  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`\n${'='.repeat(50)}`);
  if (failures.length === 0) {
    console.log(`REHEARSAL PASSED in ${secs}s  (${notes.length} note${notes.length === 1 ? '' : 's'})`);
    process.exit(0);
  } else {
    console.log(`REHEARSAL FAILED in ${secs}s  --  ${failures.length} problem${failures.length === 1 ? '' : 's'}:`);
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('\nRehearsal crashed:', e);
  process.exit(1);
});
