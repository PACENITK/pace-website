const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const UrbanMayhemTeam = require('../models/UrbanMayhemTeam');
const UrbanMayhemGlobal = require('../models/UrbanMayhemGlobal');
const UrbanMayhemActionLog = require('../models/UrbanMayhemActionLog');
const { loadEngine } = require('../game/engine');
const { createInitialTeamState } = require('../game/state');

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/pace_test';
const ADMIN_KEY = 'test-admin-key';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.URBAN_MAYHEM_ADMIN_KEY = ADMIN_KEY;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI);
  }
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await UrbanMayhemTeam.deleteMany({});
  await UrbanMayhemGlobal.deleteMany({});
  await UrbanMayhemActionLog.deleteMany({});
});

async function makeTeam(overrides = {}) {
  const engine = await loadEngine();
  return UrbanMayhemTeam.create({
    code: 'ABCD',
    teamName: 'Test Team',
    leaderRollNumber: '21CV001',
    state: createInitialTeamState(engine),
    ...overrides,
  });
}

async function joinAs(code) {
  const res = await request(app).post('/api/urban-mayhem/join').send({ code });
  const cookie = res.headers['set-cookie'];
  return { res, cookie };
}

describe('Urban Mayhem backend', () => {
  describe('POST /join', () => {
    it('rejects an unknown code', async () => {
      const res = await request(app).post('/api/urban-mayhem/join').send({ code: 'ZZZZ' });
      expect(res.status).toBe(404);
    });

    it('accepts a real code, creates a session, and returns only the team name', async () => {
      await makeTeam({ code: 'WXYZ' });
      const res = await request(app).post('/api/urban-mayhem/join').send({ code: 'wxyz' }); // lowercase input
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ teamName: 'Test Team', otherActiveSessions: 0 });
      expect(res.headers['set-cookie']).toBeDefined();

      const team = await UrbanMayhemTeam.findOne({ code: 'WXYZ' });
      expect(team.sessions).toHaveLength(1);
    });

    it('allows a second session on the same code and reports the other one', async () => {
      await makeTeam({ code: 'WXYZ' });
      await joinAs('WXYZ');
      const { res } = await joinAs('WXYZ');
      expect(res.body.otherActiveSessions).toBe(1);
    });
  });

  describe('GET /state', () => {
    it('rejects a request with no session cookie', async () => {
      const res = await request(app).get('/api/urban-mayhem/state');
      expect(res.status).toBe(401);
    });

    it('returns the fresh state for a joined team', async () => {
      await makeTeam({ code: 'WXYZ' });
      const { cookie } = await joinAs('WXYZ');
      const res = await request(app).get('/api/urban-mayhem/state').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.cash).toBe(3000);
      expect(res.body.placed).toEqual({});
      expect(res.body.locked).toBe(false);
    });
  });

  describe('POST /action (place)', () => {
    it('places a prerequisite-free building and deducts cost', async () => {
      await makeTeam({ code: 'WXYZ' });
      const { cookie } = await joinAs('WXYZ');
      const res = await request(app)
        .post('/api/urban-mayhem/action')
        .set('Cookie', cookie)
        .send({ type: 'place', row: 2, col: 2, buildingId: 'park' });
      expect(res.status).toBe(200);
      expect(res.body.cash).toBe(3000 - 10);
      expect(res.body.placed).toEqual({ '2,2': 'park' });
    });

    it('persists a second placement on top of a first (regression: Mongoose Mixed-field dirty tracking)', async () => {
      await makeTeam({ code: 'WXYZ' });
      const { cookie } = await joinAs('WXYZ');
      await request(app)
        .post('/api/urban-mayhem/action')
        .set('Cookie', cookie)
        .send({ type: 'place', row: 3, col: 3, buildingId: 'park' });
      const second = await request(app)
        .post('/api/urban-mayhem/action')
        .set('Cookie', cookie)
        .send({ type: 'place', row: 3, col: 4, buildingId: 'storm_drainage' });

      expect(second.body.placed).toEqual({ '3,3': 'park', '3,4': 'storm_drainage' });

      // Independent read (a fresh request, not the mutated in-memory
      // doc from the write above) -- this is what actually catches a
      // Mixed-field write that looked fine in-process but never
      // reached MongoDB.
      const reread = await request(app).get('/api/urban-mayhem/state').set('Cookie', cookie);
      expect(reread.body.placed).toEqual({ '3,3': 'park', '3,4': 'storm_drainage' });
    });

    it('rejects placing on an already-occupied tile', async () => {
      await makeTeam({ code: 'WXYZ' });
      const { cookie } = await joinAs('WXYZ');
      await request(app)
        .post('/api/urban-mayhem/action')
        .set('Cookie', cookie)
        .send({ type: 'place', row: 2, col: 2, buildingId: 'park' });
      const res = await request(app)
        .post('/api/urban-mayhem/action')
        .set('Cookie', cookie)
        .send({ type: 'place', row: 2, col: 2, buildingId: 'farm' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already has a building/);
    });

    it('rejects a building whose prerequisite is missing, with the engine reason verbatim', async () => {
      await makeTeam({ code: 'WXYZ' });
      const { cookie } = await joinAs('WXYZ');
      const res = await request(app)
        .post('/api/urban-mayhem/action')
        .set('Cookie', cookie)
        .send({ type: 'place', row: 2, col: 2, buildingId: 'water_tank' }); // requires power
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('requires power');
    });
  });

  describe('POST /action (rehouse)', () => {
    it('rehouses a real slum tile and deducts the upgrade cost', async () => {
      const engine = await loadEngine();
      await makeTeam({ code: 'WXYZ' });
      const { cookie } = await joinAs('WXYZ');
      const res = await request(app)
        .post('/api/urban-mayhem/action')
        .set('Cookie', cookie)
        .send({ type: 'rehouse', row: 5, col: 2 }); // real map slum tile
      expect(res.status).toBe(200);
      expect(res.body.cash).toBe(3000 - engine.config.slumUpgradeCost);
      expect(res.body.slumUpgraded).toEqual(['5,2']);
    });

    it('rejects rehousing a non-slum tile', async () => {
      await makeTeam({ code: 'WXYZ' });
      const { cookie } = await joinAs('WXYZ');
      const res = await request(app)
        .post('/api/urban-mayhem/action')
        .set('Cookie', cookie)
        .send({ type: 'rehouse', row: 0, col: 0 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not a slum/);
    });

    it('rejects rehousing the same slum twice', async () => {
      await makeTeam({ code: 'WXYZ' });
      const { cookie } = await joinAs('WXYZ');
      await request(app).post('/api/urban-mayhem/action').set('Cookie', cookie).send({ type: 'rehouse', row: 5, col: 2 });
      const res = await request(app)
        .post('/api/urban-mayhem/action')
        .set('Cookie', cookie)
        .send({ type: 'rehouse', row: 5, col: 2 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already rehoused/);
    });
  });

  describe('admin key gating', () => {
    it.each(['/lock-year', '/advance-year', '/overview', '/reset'])('rejects %s with no admin key', async (route) => {
      const method = route === '/overview' ? 'get' : 'post';
      const res = await request(app)[method](`/api/urban-mayhem${route}`);
      expect(res.status).toBe(401);
    });
  });

  describe('year lock / advance', () => {
    it('blocks actions while locked, and unblocks after advance-year unlocks', async () => {
      await makeTeam({ code: 'WXYZ' });
      const { cookie } = await joinAs('WXYZ');

      await request(app).post('/api/urban-mayhem/lock-year').set('x-admin-key', ADMIN_KEY);
      const blocked = await request(app)
        .post('/api/urban-mayhem/action')
        .set('Cookie', cookie)
        .send({ type: 'place', row: 2, col: 2, buildingId: 'park' });
      expect(blocked.status).toBe(423);

      const advance = await request(app).post('/api/urban-mayhem/advance-year').set('x-admin-key', ADMIN_KEY);
      expect(advance.status).toBe(200);
      expect(advance.body.year).toBe(1);
      expect(['flood', 'pandemic', 'immigration']).toContain(advance.body.twist);

      const afterState = await request(app).get('/api/urban-mayhem/state').set('Cookie', cookie);
      expect(afterState.body.locked).toBe(false);
      expect(afterState.body.year).toBe(1);

      const unblocked = await request(app)
        .post('/api/urban-mayhem/action')
        .set('Cookie', cookie)
        .send({ type: 'place', row: 2, col: 2, buildingId: 'park' });
      expect(unblocked.status).toBe(200);
    });

    it('resolves a pandemic year without crashing (regression: applyPandemic needs state.slumUpgraded as a Set)', async () => {
      // applyPandemic() calls computeCityStats(...).slumUpgraded.has(...);
      // the year-transition code originally forgot to pass slumUpgraded
      // into the mutable state twists operate on at all, which crashed
      // with "Cannot read properties of undefined (reading 'has')" any
      // time pandemic was the drawn twist -- caught here, and fixed in
      // both this backend port and the identical bug in the client
      // store's own advanceYear.
      await makeTeam({ code: 'WXYZ' });
      await request(app).post('/api/urban-mayhem/lock-year').set('x-admin-key', ADMIN_KEY);
      await UrbanMayhemGlobal.findByIdAndUpdate('singleton', { twistOrder: ['pandemic', 'flood', 'immigration'] });

      const res = await request(app).post('/api/urban-mayhem/advance-year').set('x-admin-key', ADMIN_KEY);
      expect(res.status).toBe(200);
      expect(res.body.twist).toBe('pandemic');

      const team = await UrbanMayhemTeam.findOne({ code: 'WXYZ' });
      expect(team.state.year).toBe(1);
    });

    it('refuses to advance without locking first', async () => {
      const res = await request(app).post('/api/urban-mayhem/advance-year').set('x-admin-key', ADMIN_KEY);
      expect(res.status).toBe(400);
    });

    it('skips a team already at or past the target year (idempotency guard), but still advances the rest', async () => {
      const engine = await loadEngine();
      const caughtUp = await makeTeam({ code: 'AAAA', state: { ...createInitialTeamState(engine), year: 1, cash: 1234 } });
      const behind = await makeTeam({ code: 'BBBB' });

      await request(app).post('/api/urban-mayhem/lock-year').set('x-admin-key', ADMIN_KEY);
      const advance = await request(app).post('/api/urban-mayhem/advance-year').set('x-admin-key', ADMIN_KEY);
      expect(advance.status).toBe(200);
      expect(advance.body.year).toBe(1);
      // Only the team that hadn't already reached year 1 gets processed.
      expect(advance.body.teamsProcessed).toBe(1);

      const untouchedTeam = await UrbanMayhemTeam.findById(caughtUp._id);
      expect(untouchedTeam.state.cash).toBe(1234); // unchanged -- skipped
      const advancedTeam = await UrbanMayhemTeam.findById(behind._id);
      expect(advancedTeam.state.year).toBe(1);
    });

    it('writes one action-log entry per team per twist, with cash/score snapshots', async () => {
      await makeTeam({ code: 'WXYZ' });
      await request(app).post('/api/urban-mayhem/lock-year').set('x-admin-key', ADMIN_KEY);
      await request(app).post('/api/urban-mayhem/advance-year').set('x-admin-key', ADMIN_KEY);

      const team = await UrbanMayhemTeam.findOne({ code: 'WXYZ' });
      const logs = await UrbanMayhemActionLog.find({ teamId: team._id });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toMatch(/^twist_/);
      expect(logs[0].cashAfter).toBe(team.state.cash);
      expect(logs[0].year).toBe(1);
    });
  });

  describe('GET /overview', () => {
    it('lists every team with join status, regardless of whether they have joined', async () => {
      await makeTeam({ code: 'AAAA', teamName: 'Alpha' });
      await makeTeam({ code: 'BBBB', teamName: 'Beta' });
      await joinAs('AAAA');

      const res = await request(app).get('/api/urban-mayhem/overview').set('x-admin-key', ADMIN_KEY);
      expect(res.status).toBe(200);
      expect(res.body.teams).toHaveLength(2);
      const alpha = res.body.teams.find((t) => t.code === 'AAAA');
      const beta = res.body.teams.find((t) => t.code === 'BBBB');
      expect(alpha.joined).toBe(true);
      expect(beta.joined).toBe(false);
    });
  });

  describe('POST /reset', () => {
    it('wipes board state and sessions but keeps team identity', async () => {
      await makeTeam({ code: 'WXYZ' });
      const { cookie } = await joinAs('WXYZ');
      await request(app)
        .post('/api/urban-mayhem/action')
        .set('Cookie', cookie)
        .send({ type: 'place', row: 2, col: 2, buildingId: 'park' });

      const res = await request(app).post('/api/urban-mayhem/reset').set('x-admin-key', ADMIN_KEY);
      expect(res.status).toBe(200);

      const team = await UrbanMayhemTeam.findOne({ code: 'WXYZ' });
      expect(team.teamName).toBe('Test Team');
      expect(team.state.cash).toBe(3000);
      expect(team.state.placed).toEqual({});
      expect(team.sessions).toHaveLength(0);
    });
  });
});
