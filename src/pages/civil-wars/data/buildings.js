// Buildings grouped by type, each with one or more size tiers. The
// palette renders one card per group with a segmented S/M/L control;
// the engine works off the flat BUILDINGS_BY_ID index below, keyed by
// tier id (e.g. "water_s").
const buildings = [
  {
    type: "water",
    name: "Water plant",
    image: "water",
    serves: "water",
    tiers: [
      { size: "S", id: "water_s", cost: 8, capacity: 6, radius: 2 },
      { size: "M", id: "water_m", cost: 12, capacity: 10, radius: 3 },
      { size: "L", id: "water_l", cost: 18, capacity: 16, radius: 4 },
    ],
  },
  {
    type: "hospital",
    name: "Hospital",
    image: "hospital",
    serves: "health",
    tiers: [
      { size: "S", id: "hospital_s", cost: 10, capacity: 4, radius: 2 },
      { size: "M", id: "hospital_m", cost: 15, capacity: 7, radius: 3 },
      { size: "L", id: "hospital_l", cost: 22, capacity: 12, radius: 4 },
    ],
  },
  {
    type: "school",
    name: "School",
    image: "school",
    serves: "education",
    tiers: [
      { size: "S", id: "school_s", cost: 5, capacity: 3, radius: 2 },
      { size: "M", id: "school_m", cost: 8, capacity: 5, radius: 2 },
      { size: "L", id: "school_l", cost: 12, capacity: 9, radius: 3 },
    ],
  },
  {
    type: "sewage",
    name: "Sewage plant",
    image: "sewage",
    serves: "sanitation",
    tiers: [
      { size: "S", id: "sewage_s", cost: 7, capacity: 8, radius: 2 },
      { size: "L", id: "sewage_l", cost: 12, capacity: 16, radius: 3 },
    ],
  },
  {
    type: "park",
    name: "Park",
    image: "park",
    serves: "environment",
    tiers: [{ size: null, id: "park", cost: 3, capacity: 4, radius: 1 }],
  },
  {
    type: "drainage",
    name: "Drainage",
    image: "drainage",
    // Flood defence — arrives in Phase 3. Serves nothing yet, scores
    // zero, stays placeable so the art stays in use.
    serves: null,
    tiers: [{ size: null, id: "drainage", cost: 3, capacity: 0, radius: 0 }],
  },
];

export const BUILDINGS_BY_ID = buildings.reduce((index, group) => {
  group.tiers.forEach((tier) => {
    index[tier.id] = {
      ...tier,
      type: group.type,
      name: group.name,
      image: group.image,
      serves: group.serves,
    };
  });
  return index;
}, {});

export default buildings;
