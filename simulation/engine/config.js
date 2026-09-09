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

  // v4 Part H rewrite: dam protection is column-span based (a dam at
  // column C protects columns [C, C+span-1], full immunity), not the
  // old chebyshev-radius model -- sweepable per the v4 spec's own
  // "does a second dam ever pay for itself" question (4/6/8).
  damProtectionSpan: 6,
  hydroStationCost: 70,
  damCost: 100,
  hydroAdjacencyRadius: 1, // "adjacent to a dam" -- chebyshev <= 1
  hydroMaxPerDam: 2,

  // Flood zones: graded bands either side of the river, replacing the
  // old flat lowLying boolean. Row distance from the river row, not
  // inclusive of the river tile itself.
  floodZoneARows: 1, // rows at exactly this distance -- "Severe"
  floodZoneBRows: 2, // rows at exactly this distance -- "Moderate"

  // Flood repair economics. Percentages are of the building's own
  // cost; slum figures are flat Cr (a slum isn't a "building" with a
  // cost to take a percentage of). "destroyed" means removed from the
  // board outright (cost lost, no repair option) rather than damaged.
  // Drainage-within-radius halves a *repair percentage*; it does not
  // downgrade a "destroyed" outcome to "damaged" -- a storm drain
  // reduces water volume, it doesn't stop a park from washing away in
  // the harshest band. (Interpretation call: the spec's damage table
  // doesn't spell out how drainage interacts with "destroyed" rows
  // specifically.)
  floodRepair: {
    slum: { A: 40, B: 20 }, // flat Cr, not a percentage
    residential: { A: 0.5, B: 0.25 },
    essentialService: { A: 0.4, B: 0.2 }, // hospital/school/sewage/water/safety/hydro
    commercialIndustry: { A: 0.4, B: 0.2 },
    destructible: { A: null, B: 0.3 }, // park/drainage/farm -- null = destroyed outright
  },
  floodDrainageHalvesRepair: true,
  industryFloodPollutionSpillRadius: 1, // permanent +1 pollutionRadius, Zone A only, on top of any repair cost

  // Mandatory floor, checked once at the Year 0 -> 1 transition (not a
  // twist -- rules.md v4 Part B). A penalty, never a block, so a
  // confused team keeps playing.
  mandatoryFloorScorePenalty: 100,
  mandatoryFloorIncomeMultiplier: 0.5,

  immigrationPeople: 5000,
  // v4 Part F rewrite: immigration spawns 2 new slum tiles instead of
  // inflating existing homes' demand -- see twists.js for why these
  // live in per-team state (extraSlums) rather than mutating the
  // shared map singleton.
  immigrationNewSlumCount: 2,
  immigrationNewSlumPop: 2500,
  immigrationNewSlumDemandUnits: 3, // matches the rehoused-slum tier's demand units (2,500 pop)

  olympicsRequirements: { stadium: 1, hotel: 5, restaurant: 3 },
  olympicsQualifiedCash: 500,
  olympicsQualifiedScore: 150,
  olympicsFailScore: -50,

  // v4 Part E rewrite: pandemic -> waterborne outbreak. Same
  // "1 per 2,500, slums count double" treatment-capacity formula as
  // before, now gated on containment (sewage range) first.
  outbreakPopPerHospital: 2500,
  outbreakSlumMultiplier: 2,
  outbreakNoneCashBonus: 50,
  outbreakNoneScoreBonus: 50,
  outbreakShortPenaltyPerHospital: 50,
  outbreakShortIncomeMultiplier: 0.5,
  outbreakNoHospitalScorePenalty: 150,
  outbreakNoHospitalIncomeMultiplier: 0,

  treasureValue: 300,

  sellRefundRate: 0.5,

  incomeHalvedUnservedShare: 1 / 3,
  incomeHalvedMinServicesUnserved: 3,

  yearDurationsMin: { 0: 15, 1: 6, 2: 6, 3: 6, 4: 6, 5: 5, 6: 0 },
};

export default config;
