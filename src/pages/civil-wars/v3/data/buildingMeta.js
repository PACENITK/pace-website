// Per-building icon, one distinct glyph per id (mirrors the handoff's
// palette icon choices) -- used by both the palette thumbnail and the
// on-tile building icon fallback (when no commissioned art exists yet,
// see art.js).
import {
  Lightning,
  Drop,
  DropHalf,
  FirstAidKit,
  GraduationCap,
  Tree,
  ShieldCheck,
  Recycle,
  Plant,
  HouseLine,
  House,
  Buildings,
  Waves,
  Wall,
  Bus,
  Train,
  TrainSimple,
  AirplaneTilt,
  Storefront,
  ForkKnife,
  Bed,
  ShoppingBag,
  Trophy,
  Factory,
} from "@phosphor-icons/react";

export const BUILDING_ICON = {
  hydro_station: Lightning,
  water_tank: Drop,
  water_treatment: DropHalf,
  hospital: FirstAidKit,
  school: GraduationCap,
  park: Tree,
  safety_station: ShieldCheck,
  sewage_plant: Recycle,
  farm: Plant,

  residential_small: HouseLine,
  residential_medium: House,
  residential_large: Buildings,

  storm_drainage: Waves,
  dam: Wall,

  bus_stand: Bus,
  railway: Train,
  metro: TrainSimple,
  airport: AirplaneTilt,

  market: Storefront,
  restaurant: ForkKnife,
  hotel: Bed,
  mall: ShoppingBag,
  stadium: Trophy,

  industry_small: Factory,
  industry_medium: Factory,
  industry_large: Factory,
};
