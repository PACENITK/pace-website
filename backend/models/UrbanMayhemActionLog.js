const mongoose = require('mongoose');

// Append-only. State (UrbanMayhemTeam) is "what the city is now";
// this is "what they did" -- never updated, never read during normal
// play, only written alongside every state change (same operation,
// see game/state.js) and read back for disputes/replay/admin.
const urbanMayhemActionLogSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'UrbanMayhemTeam', required: true, index: true },
  // Per-team counter (UrbanMayhemTeam.state.actionSeq), not a global
  // one -- gives a strict per-team order even when two actions land
  // in the same millisecond, without contending across teams.
  seq: { type: Number, required: true },
  year: { type: Number, required: true },
  action: { type: String, required: true }, // "place" | "rehouse" | "twist_flood" | "twist_pandemic" | ...
  payload: { type: mongoose.Schema.Types.Mixed, default: null },
  cost: { type: Number, default: null },
  cashAfter: { type: Number, required: true },
  scoreAfter: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
});

urbanMayhemActionLogSchema.index({ teamId: 1, seq: 1 }, { unique: true });

module.exports = mongoose.model('UrbanMayhemActionLog', urbanMayhemActionLogSchema);
