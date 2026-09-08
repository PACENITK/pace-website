const crypto = require('crypto');
const UrbanMayhemTeam = require('../models/UrbanMayhemTeam');

const COOKIE_NAME = 'um_session';

function newSessionId() {
  return crypto.randomBytes(24).toString('hex');
}

// No passwords: the join code is the only secret, and a session cookie
// (not a JWT) tracks who's in so multiple devices on one code can be
// enumerated and shown to each other -- see /join and /overview. A
// stateless JWT would work for auth but can't be listed/revoked per
// device without extra bookkeeping that a plain session lookup already
// gives for free.
async function requireTeamSession(req, res, next) {
  const sessionId = req.cookies && req.cookies[COOKIE_NAME];
  if (!sessionId) return res.status(401).json({ error: 'Not joined. POST /join with your team code first.' });

  const team = await UrbanMayhemTeam.findOne({ 'sessions.sessionId': sessionId });
  if (!team) return res.status(401).json({ error: 'Session expired or invalid. Join again.' });

  const session = team.sessions.find((s) => s.sessionId === sessionId);
  session.lastSeenAt = new Date();
  await team.save();

  req.umTeam = team;
  req.umSessionId = sessionId;
  next();
}

// One shared key for the one organizer laptop running the event --
// deliberately not a full admin login flow. Set URBAN_MAYHEM_ADMIN_KEY
// in the environment; requests carry it as `x-admin-key`.
function requireAdminKey(req, res, next) {
  const expected = process.env.URBAN_MAYHEM_ADMIN_KEY;
  if (!expected) return res.status(500).json({ error: 'URBAN_MAYHEM_ADMIN_KEY is not configured on the server.' });
  if (req.get('x-admin-key') !== expected) return res.status(401).json({ error: 'Bad or missing admin key.' });
  next();
}

module.exports = { requireTeamSession, requireAdminKey, newSessionId, COOKIE_NAME };
