// Every tunable number for the scoring engine lives here. Nothing below
// this file should ever hard-code a score constant — change tuning by
// editing this object (or via the in-page tuning panel, which edits a
// copy of it at runtime).
const config = {
  // Money a team starts with, in ₹ Cr.
  startingBudget: 100,

  // Points awarded per unit of demand served, any service type.
  pointsPerServiceUnit: 10,

  // Extra penalty (on top of simply not scoring) per unit of unmet
  // demand on a slum tile, summed across all five services.
  slumUnmetPenalty: 5,

  // Penalty per populated tile sitting at Chebyshev distance 1 from a
  // factory, unless a park is within distance <=1 of that tile.
  pollutionPenalty: 15,

  // Penalty per populated tile sitting at Chebyshev distance 1 from a
  // sewage plant.
  sewageNuisancePenalty: 10,

  // Bonus points per whole ₹1 Cr of remaining budget. Applies as-is
  // when budget is negative, so overspending costs points.
  savingsRatePer1Cr: 0.5,
};

export default config;
