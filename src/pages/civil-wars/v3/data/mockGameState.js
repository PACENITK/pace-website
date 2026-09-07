// Hand-placed checkpoint for instant UI testing -- lets you see a
// populated board, a mixed coverage state, and a twist already logged
// without manually replaying Year 0-2 on every reload. Loaded via
// useGameStore's loadCheckpoint(), which skips canPlace validation on
// purpose: this is fixture data, not a real playthrough.
export const MID_GAME_CHECKPOINT = {
  year: 2,
  cash: 1180,
  placed: {
    "3,3": "power_plant",
    "3,4": "water_tank",
    "4,3": "hospital",
    "4,4": "school",
    "5,3": "park",
    "4,5": "safety_station",
    "7,3": "sewage_plant",
    "7,4": "bus_stand",
    "2,2": "farm",
    "3,5": "residential_small",
    "3,6": "residential_medium",
    "9,3": "storm_drainage",
    "8,8": "market",
    "8,9": "restaurant",
  },
  slumUpgraded: ["5,2"],
  residentialDemandMultiplier: 1.42,
  immigrationOverflow: 0.42,
  cumulativeScoreAdjustment: -100,
  twistLog: [
    {
      year: 1,
      twist: "immigration",
      result: { overflowFactor: 0.42 },
      grossIncome: -12.5,
      incomeMultiplier: 1,
    },
    {
      year: 2,
      twist: "pandemic",
      result: {
        required: 5,
        hospitalsBuilt: 1,
        shortfall: 4,
        incomeMultiplier: 0,
        scorePenalty: 100,
        cashBonus: 0,
        met: false,
      },
      grossIncome: -12.5,
      incomeMultiplier: 0,
    },
  ],
};
