// Every tunable number from rules.md Parts C-I. Nothing below this file
// (or anywhere in simulation/) should hard-code a score/cost constant --
// change tuning here, or via sweep.js's SWEEP_GRID for A/B config runs.
const config = {
  startingBudget: 3000,
  gridWidth: 16,
  gridHeight: 12,

  slumUpgradeCost: 60,
  slumUpgradeBonus: 75,
  slumUpgradedPop: 2500,
  slumUpgradedDemandUnits: 3,

  pointsPerServiceUnit: 10,
  unservedPenaltyPerUnit: 5,
  slumUnservedPenaltyPerUnit: 10,
  slumNoSanitationPenalty: 50,
  pollutionPenaltyNoPark: 30,
  sewageAdjacencyPenalty: 20,
  allServedBonus: 200,
  serviceCoverageBonusThreshold: 0.9,
  serviceCoverageBonus: 25,
  slumRehousedBonus: 75,
  cashPointsPer1Cr: 0.05,

  pandemicPopPerHospital: 2500,
  pandemicSlumMultiplier: 2,
  pandemicMetBonusCash: 50,
  pandemicShort1IncomeMultiplier: 0.5,
  pandemicShort2PlusIncomeMultiplier: 0,
  pandemicShort2PlusScorePenalty: 100,

  floodDrainageRadius: 2,
  floodDrainageRepairFraction: 0.3,
  damDownstreamRadius: 4,

  immigrationPeople: 5000,

  olympicsRequirements: { stadium: 1, hotel: 5, restaurant: 3 },
  olympicsQualifiedCash: 500,
  olympicsQualifiedScore: 150,
  olympicsFailScore: -50,

  treasureValue: 300,

  sellRefundRate: 0.5,

  incomeHalvedUnservedShare: 1 / 3,
  incomeHalvedMinServicesUnserved: 3,

  yearDurationsMin: { 0: 15, 1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 0 },
};

export default config;
