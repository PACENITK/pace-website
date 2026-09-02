// Fixed population and per-service demand carried by each tile type,
// independent of whatever building sits on top of it. A hospital built
// on a slum tile does not remove the slum's demand.
const tileTypes = {
  slum: { pop: 4, water: 4, health: 5, education: 2, environment: 4, sanitation: 4 },
  apartment: { pop: 3, water: 3, health: 3, education: 3, environment: 2, sanitation: 3 },
  colony: { pop: 2, water: 2, health: 2, education: 2, environment: 1, sanitation: 2 },
  commercial: { pop: 1, water: 2, health: 1, education: 0, environment: 1, sanitation: 1 },
  factory: { pop: 0, water: 3, health: 0, education: 0, environment: 0, sanitation: 2 },
  empty: { pop: 0, water: 0, health: 0, education: 0, environment: 0, sanitation: 0 },
  lowland: { pop: 0, water: 0, health: 0, education: 0, environment: 0, sanitation: 0 },
};

export const SERVICES = ["water", "health", "education", "environment", "sanitation"];

export default tileTypes;
