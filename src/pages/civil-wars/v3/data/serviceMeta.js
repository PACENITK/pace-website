// Single source for service display metadata (label + icon), reused by
// the palette sub-notes, the board's pip row/tooltip, and the City
// Status ledger -- previously duplicated inline in three components.
import {
  Lightning,
  Drop,
  Heartbeat,
  GraduationCap,
  Tree,
  ShieldCheck,
  Recycle,
  Bus,
  BowlFood,
} from "@phosphor-icons/react";
import { SERVICES } from "../engine.js";

export { SERVICES };

export const SERVICE_LABEL = {
  power: "Power",
  water: "Water",
  health: "Health",
  education: "Education",
  environment: "Environment",
  safety: "Safety",
  sanitation: "Sanitation",
  transport: "Transport",
  food: "Food",
};

export const SERVICE_ICON = {
  power: Lightning,
  water: Drop,
  health: Heartbeat,
  education: GraduationCap,
  environment: Tree,
  safety: ShieldCheck,
  sanitation: Recycle,
  transport: Bus,
  food: BowlFood,
};
