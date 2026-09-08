const express = require('express');
const { loadEngine } = require('../game/engine');
const {
  createInitialTeamState,
  createInitialGlobal,
  evaluatePlacement,
  applyPlacement,
  applyRehouse,
  computeScore,
  applyYearTransition,
  twistForYear,
  tileKey,
} = require('../game/state');
const { runSerialized } = require('../game/concurrency');
const { requireTeamSession, requireAdminKey, newSessionId, COOKIE_NAME } = require('../middleware/urbanMayhemAuth');
const UrbanMayhemTeam = require('../models/UrbanMayhemTeam');
const UrbanMayhemGlobal = require('../models/UrbanMayhemGlobal');
const UrbanMayhemActionLog = require('../models/UrbanMayhemActionLog');

const router = express.Router();

async function getOrCreateGlobal(engine) {
  let global = await UrbanMayhemGlobal.findById('singleton');
  if (!global) {
    global = await UrbanMayhemGlobal.create({ _id: 'singleton', ...createInitialGlobal(engine) });
  }
  return global;
}

function stateForClient(team, global) {
  return {
    cash: team.state.cash,
    placed: team.state.placed,
    slumUpgraded: team.state.slumUpgraded,
    residentialDemandMultiplier: team.state.residentialDemandMultiplier,
    immigrationOverflow: team.state.immigrationOverflow,
    cumulativeScoreAdjustment: team.state.cumulativeScoreAdjustment,
    year: team.state.year,
    lastError: team.state.lastError,
    locked: global.locked,
    sessionsCount: team.sessions.length,
  };
}

// ---------- Team-facing ----------

router.post('/join', async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'code is required' });

  const team = await UrbanMayhemTeam.findOne({ code });
  if (!team) return res.status(404).json({ error: 'No team has that code.' });

  const sessionId = newSessionId();
  team.sessions.push({ sessionId, createdAt: new Date(), lastSeenAt: new Date() });
  await team.save();

  res.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 12, // 12h -- comfortably longer than any one event day
  });
  // Deliberately returns only the team name, not the board -- the
  // client shows it large and asks "is this you?" before ever calling
  // /state, so a mistyped code (landing on the wrong real team) is
  // caught in the two seconds after joining, not ten minutes in.
  res.json({ teamName: team.teamName, otherActiveSessions: team.sessions.length - 1 });
});

router.get('/state', requireTeamSession, async (req, res) => {
  const engine = await loadEngine();
  const global = await getOrCreateGlobal(engine);
  res.json(stateForClient(req.umTeam, global));
});

router.post('/action', requireTeamSession, async (req, res) => {
  const { type, row, col, buildingId } = req.body || {};
  if (!['place', 'rehouse'].includes(type)) return res.status(400).json({ error: 'type must be "place" or "rehouse"' });
  if (!Number.isInteger(row) || !Number.isInteger(col)) return res.status(400).json({ error: 'row/col must be integers' });

  const engine = await loadEngine();
  const teamId = req.umTeam._id;

  try {
    const result = await runSerialized(teamId, async () => {
      // Re-fetch inside the queue: another queued action for this same
      // team may have committed between the middleware's load and this
      // task actually running.
      const team = await UrbanMayhemTeam.findById(teamId);
      const global = await getOrCreateGlobal(engine);

      if (global.locked) {
        return { status: 423, body: { error: 'Year is ending -- building is paused.' } };
      }

      if (type === 'place') {
        if (!buildingId || !engine.buildingsById[buildingId]) {
          return { status: 400, body: { error: 'Unknown buildingId' } };
        }
        const evaluation = evaluatePlacement(engine, buildingId, row, col, team.state);
        if (!evaluation.ok) {
          team.state.lastError = evaluation.reason;
          await team.save();
          return { status: 400, body: { error: evaluation.reason } };
        }
        const def = engine.buildingsById[buildingId];
        applyPlacement(team.state, buildingId, row, col, def.cost);
        team.state.lastError = null;
        team.state.actionSeq += 1;
        const score = computeScore(engine, team.state);
        await UrbanMayhemActionLog.create({
          teamId,
          seq: team.state.actionSeq,
          year: team.state.year,
          action: 'place',
          payload: { buildingId, row, col },
          cost: def.cost,
          cashAfter: team.state.cash,
          scoreAfter: score,
        });
        // state.placed is Mongoose Mixed -- nested mutations on it
        // (applyPlacement writes placed["r,c"] = id) aren't detected by
        // Mongoose's dirty-checking without this, and the write would
        // silently never reach MongoDB even though the in-memory
        // response for *this* request still looks correct.
        team.markModified('state.placed');
        await team.save();
        return { status: 200, body: stateForClient(team, global) };
      }

      // type === "rehouse"
      const key = tileKey(row, col);
      if (engine.map.tiles[row][col].type !== 'slum') {
        return { status: 400, body: { error: 'That tile is not a slum.' } };
      }
      if (team.state.slumUpgraded.includes(key)) {
        return { status: 400, body: { error: 'That slum is already rehoused.' } };
      }
      if (team.state.cash < engine.config.slumUpgradeCost) {
        return { status: 400, body: { error: 'Not enough cash to rehouse this slum.' } };
      }
      applyRehouse(team.state, row, col, engine.config.slumUpgradeCost);
      team.state.lastError = null;
      team.state.actionSeq += 1;
      const score = computeScore(engine, team.state);
      await UrbanMayhemActionLog.create({
        teamId,
        seq: team.state.actionSeq,
        year: team.state.year,
        action: 'rehouse',
        payload: { row, col },
        cost: engine.config.slumUpgradeCost,
        cashAfter: team.state.cash,
        scoreAfter: score,
      });
      await team.save();
      return { status: 200, body: stateForClient(team, global) };
    });

    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(500).json({ error: `Action failed: ${err.message}` });
  }
});

// ---------- Organizer-facing ----------

router.post('/lock-year', requireAdminKey, async (req, res) => {
  const engine = await loadEngine();
  const global = await getOrCreateGlobal(engine);
  global.locked = true;
  await global.save();
  res.json({ locked: true, year: global.year });
});

router.post('/advance-year', requireAdminKey, async (req, res) => {
  const engine = await loadEngine();
  const global = await getOrCreateGlobal(engine);

  if (!global.locked) {
    return res.status(400).json({ error: 'Lock the year first (POST /lock-year) before advancing it.' });
  }
  const nextYear = global.year + 1;
  if (nextYear > 5) return res.status(400).json({ error: 'Game is already complete (Year 5).' });

  const twistName = twistForYear(global, nextYear);
  const teams = await UrbanMayhemTeam.find({});
  let processed = 0;

  for (const team of teams) {
    // Idempotency: a team already at or past nextYear has already had
    // this transition applied (covers a double-clicked /advance-year
    // without needing a separate "twists applied" list, since year
    // only ever moves via this exact path).
    if (team.state.year >= nextYear) continue;

    const { twistResult, grossIncome, incomeMultiplier, scoreDelta } = applyYearTransition(
      engine,
      team.state,
      global,
      nextYear,
      twistName
    );
    team.state.actionSeq += 1;
    const score = computeScore(engine, team.state);
    await UrbanMayhemActionLog.create({
      teamId: team._id,
      seq: team.state.actionSeq,
      year: nextYear,
      action: `twist_${twistName}`,
      payload: { twistResult, grossIncome, incomeMultiplier, scoreDelta },
      cost: null,
      cashAfter: team.state.cash,
      scoreAfter: score,
    });
    // Same Mixed-field caveat as /action's place branch: applyYearTransition
    // reassigns team.state.placed (flood/treasure can remove entries),
    // which Mongoose won't persist without this.
    team.markModified('state.placed');
    await team.save();
    processed += 1;
  }

  global.year = nextYear;
  global.locked = false;
  global.twistLog.push({ year: nextYear, twist: twistName, teamsProcessed: processed, appliedAt: new Date() });
  await global.save();

  res.json({ year: nextYear, twist: twistName, teamsProcessed: processed });
});

router.get('/overview', requireAdminKey, async (req, res) => {
  const engine = await loadEngine();
  const global = await getOrCreateGlobal(engine);
  const teams = await UrbanMayhemTeam.find({});

  const rows = teams.map((team) => {
    const lastSeenAt = team.sessions.reduce((max, s) => (s.lastSeenAt > max ? s.lastSeenAt : max), null);
    return {
      code: team.code,
      teamName: team.teamName,
      leaderRollNumber: team.leaderRollNumber,
      joined: team.sessions.length > 0,
      sessionsCount: team.sessions.length,
      lastSeenAt,
      cash: team.state.cash,
      year: team.state.year,
      buildingsPlaced: Object.keys(team.state.placed).length,
      score: computeScore(engine, team.state),
    };
  });

  res.json({ global: { year: global.year, locked: global.locked }, teams: rows });
});

// Dev/rehearsal convenience -- wipes every team's board and the global
// clock back to fresh, keeps team identities (code/name/roll number)
// and drops all sessions. Admin-key-gated since it's destructive.
router.post('/reset', requireAdminKey, async (req, res) => {
  const engine = await loadEngine();
  const teams = await UrbanMayhemTeam.find({});
  for (const team of teams) {
    team.state = createInitialTeamState(engine);
    team.markModified('state.placed');
    team.sessions = [];
    await team.save();
  }
  await UrbanMayhemActionLog.deleteMany({});
  await UrbanMayhemGlobal.findByIdAndUpdate('singleton', createInitialGlobal(engine), { upsert: true });
  res.json({ reset: true, teams: teams.length });
});

module.exports = router;
