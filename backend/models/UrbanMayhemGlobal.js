const mongoose = require('mongoose');

// One shared clock for the whole event -- the organizer advances the
// year for every team at once ("twists apply to all teams at the same
// moment," rules.md Part H/K), unlike the old client-only prototype
// where each browser tab rolled its own twist order for solo testing.
// Singleton by convention: always look up/create the document with
// _id "singleton" (see game/globalState.js).
const urbanMayhemGlobalSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  year: { type: Number, default: 0 },
  // True during the "lock" phase of a year transition: every /action
  // is rejected while true, so a flood/pandemic resolution can never
  // race a team's in-flight click.
  locked: { type: Boolean, default: false },
  // Twist order for years 1-3, drawn once at event start; year 4 is
  // always Olympics, year 5 always Treasure (see game/state.js).
  twistOrder: { type: [String], default: [] },
  treasureTile: { type: String, default: null },
  twistLog: { type: [mongoose.Schema.Types.Mixed], default: [] },
  // Optional pre-game practice window (rules.md Part L): 'practice'
  // while teams can build freely on a throwaway board, 'live' once the
  // organizer ends it and the real, scored game starts. Defaults to
  // 'live' so events that skip a practice period behave exactly as
  // before -- this is opt-in via POST /start-practice.
  phase: { type: String, enum: ['practice', 'live'], default: 'live' },
  practiceEndsAt: { type: Date, default: null },
});

module.exports = mongoose.model('UrbanMayhemGlobal', urbanMayhemGlobalSchema);
