const mongoose = require('mongoose');

// One document per team, holding the entire board as a JSON blob --
// deliberately not normalized into per-building collections. Every
// action loads this whole document, mutates it, and saves it back;
// there's no query shape here that ever needs "all hospitals across
// all teams," so normalizing would only buy joins nobody asked for.
const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const urbanMayhemTeamSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  teamName: { type: String, required: true, trim: true },
  leaderRollNumber: { type: String, required: true, trim: true },

  state: {
    cash: { type: Number, required: true },
    // "row,col" -> buildingId. Mixed rather than a typed Map so the
    // whole document can be read/written as one plain object without
    // Map<->Object conversion at every call site.
    placed: { type: mongoose.Schema.Types.Mixed, default: {} },
    slumUpgraded: { type: [String], default: [] },
    residentialDemandMultiplier: { type: Number, default: 1 },
    immigrationOverflow: { type: Number, default: 0 },
    cumulativeScoreAdjustment: { type: Number, default: 0 },
    // Mirrors the global clock (see UrbanMayhemGlobal) but lives here
    // too so /advance-year can tell, per team, whether this team's
    // twist for the year in question has already been applied --
    // that's the whole idempotency guard for a double-clicked advance.
    year: { type: Number, default: 0 },
    // Per-team counter for the action log's `seq` field -- gives a
    // strict order even when two actions land in the same millisecond.
    actionSeq: { type: Number, default: 0 },
    lastError: { type: String, default: null },
  },

  sessions: { type: [sessionSchema], default: [] },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UrbanMayhemTeam', urbanMayhemTeamSchema);
