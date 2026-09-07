import { buildingsById, chebyshev } from "../engine.js";

// Powers the tile hover tooltip's "why is this unserved" line (Part D
// Allocation) so players never have to reason about radius/capacity by
// hand -- the interface just says what's missing.
export function explainUnmet(service, row, col, placed) {
  const suppliers = Object.entries(placed)
    .map(([key, id]) => ({ key, def: buildingsById[id] }))
    .filter(({ def }) => def.serves === service);

  if (suppliers.length === 0) return `No ${service} supplier built yet`;

  const inRange = suppliers.some(({ key, def }) => {
    const [r, c] = key.split(",").map(Number);
    return !Number.isFinite(def.radius) || chebyshev(r, c, row, col) <= def.radius;
  });
  if (!inRange) return `Nearest ${service} supplier is out of range`;

  return `In range, but every nearby ${service} supplier is already full`;
}
