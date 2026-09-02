// Three saved `placed` states for the starter map, used to sanity-check
// that the scoring engine actually separates a careless city from an
// optimal one. Scores against the default config (see data/config.js):
//   careless   -157
//   reasonable  232
//   optimal     359
const presets = [
  {
    id: "careless",
    label: "Careless city",
    placed: {
      "0,0": "drainage",
      "0,1": "drainage",
      "0,2": "drainage",
      "0,3": "park",
      "7,9": "hospital_l",
    },
  },
  {
    id: "reasonable",
    label: "Reasonable city",
    placed: {
      "3,4": "water_m",
      "3,5": "hospital_m",
      "2,5": "school_m",
      "5,4": "sewage_s",
      "4,4": "park",
    },
  },
  {
    id: "optimal",
    label: "Optimal city",
    placed: {
      "3,4": "water_l",
      "3,5": "hospital_l",
      "2,4": "school_l",
      "4,3": "school_s",
      "6,6": "sewage_l",
      "4,8": "park",
    },
  },
];

export default presets;
