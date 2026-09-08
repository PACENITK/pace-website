// Small pure formatters shared across the palette, board and status
// panel -- kept here instead of duplicated per-component.
import { SERVICE_LABEL } from "./data/serviceMeta.js";

// "H-3" style tile coordinates, used by the tooltip, needs list and
// risk watch alike.
export function colLabel(row, col) {
  return `${String.fromCharCode(65 + col)}-${row + 1}`;
}

// Trims a trailing ".0" but keeps genuine decimals (yearly upkeep is
// often -0.5) -- avoids "-0.5" rendering as "-1" or "-0.50".
export function fmtCr(n) {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

// The palette card's sub-note line -- derived from the building's real
// engine fields (never copied from the mockup's flavor numbers, which
// don't correspond to this ruleset's capacity units).
export function formatBuildingNote(def) {
  if (def.category === "residential") {
    return `houses ${def.populates.pop.toLocaleString("en-IN")}`;
  }
  if (def.category === "protection") {
    return def.riverOnly ? "flood mitigation · river tiles only" : "flood mitigation";
  }
  if (def.serves) {
    const label = SERVICE_LABEL[def.serves];
    return def.yearly > 0 ? `${label} · +₹${fmtCr(def.yearly)}/yr` : `${label} · capacity ${def.capacity}`;
  }
  if (def.category === "industry") {
    const tier = { 1: "pollutes", 2: "pollutes more", 3: "pollutes most" }[def.pollutionRadius] || "pollutes";
    return `+₹${fmtCr(def.yearly)}/yr · ${tier}`;
  }
  if (def.yearly) {
    return `+₹${fmtCr(def.yearly)}/yr`;
  }
  return "";
}
