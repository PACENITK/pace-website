// Generates one join code per team for Civil Wars III "Urban Mayhem"
// and inserts them fresh. Run before the event, print the output,
// hand one code per slip -- see backend/README section on this script
// for the full flow.
//
// Usage:
//   node scripts/seedUrbanMayhem.js teams.json
// where teams.json is: [{ "teamName": "Spandan Engineers", "leaderRollNumber": "21CV045" }, ...]
//
// MONGO_URI env var overrides config/env.js's default if set (used by
// the standalone integration test to point at a scratch database
// instead of whatever's configured for the rest of the backend).
const fs = require('fs');
const path = require('path');

async function main() {
  const teamsFile = process.argv[2];
  if (!teamsFile) {
    console.error('Usage: node scripts/seedUrbanMayhem.js <teams.json>');
    process.exit(1);
  }
  const teams = JSON.parse(fs.readFileSync(path.resolve(teamsFile), 'utf8'));
  if (!Array.isArray(teams) || teams.length === 0) {
    console.error('teams.json must be a non-empty array of { teamName, leaderRollNumber }');
    process.exit(1);
  }

  const connectDB = require('../config/db');
  const UrbanMayhemTeam = require('../models/UrbanMayhemTeam');
  const UrbanMayhemGlobal = require('../models/UrbanMayhemGlobal');
  const { createInitialTeamState, createInitialGlobal } = require('../game/state');
  const { loadEngine } = require('../game/engine');

  await connectDB();
  const engine = await loadEngine();

  // Unambiguous alphabet -- no O/0 or I/1, so a code read off a printed
  // slip under event lighting can't be misread character-by-character.
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const existingCodes = new Set(await UrbanMayhemTeam.distinct('code'));

  function generateCode() {
    let code;
    do {
      code = Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
    } while (existingCodes.has(code));
    existingCodes.add(code);
    return code;
  }

  const created = [];
  for (const { teamName, leaderRollNumber } of teams) {
    const code = generateCode();
    await UrbanMayhemTeam.create({
      code,
      teamName,
      leaderRollNumber,
      state: createInitialTeamState(engine),
    });
    created.push({ code, teamName, leaderRollNumber });
  }

  await UrbanMayhemGlobal.findByIdAndUpdate('singleton', createInitialGlobal(engine), {
    upsert: true,
    setDefaultsOnInsert: true,
  });

  console.log(`\nCreated ${created.length} team(s):\n`);
  console.log('code\tteamName\tleaderRollNumber');
  created.forEach((t) => console.log(`${t.code}\t${t.teamName}\t${t.leaderRollNumber}`));

  const csvPath = path.resolve(path.dirname(teamsFile), 'urban-mayhem-codes.csv');
  fs.writeFileSync(
    csvPath,
    ['code,teamName,leaderRollNumber', ...created.map((t) => `${t.code},${t.teamName},${t.leaderRollNumber}`)].join(
      '\n'
    )
  );
  console.log(`\nWrote ${csvPath}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
