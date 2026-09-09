import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useActiveGameStore } from "../store/GameStoreContext.jsx";
import { colLabel, fmtCr } from "../format.js";

const TWIST_TITLE = {
  flood: "Flood",
  pandemic: "Waterborne outbreak",
  immigration: "Immigration",
  olympics: "Olympics",
  treasure: "Treasure",
};

function renderBody(twist, result) {
  if (!result) return null;
  switch (twist) {
    case "flood":
      return (
        <>
          <p>{result.destroyed.length} building(s) destroyed outright (park/drainage/farm, Zone A, unprotected).</p>
          <p>{result.damaged.length} tile(s) damaged and now need repair before they work again:</p>
          {result.damaged.length > 0 && (
            <ul>
              {result.damaged.map((d) => (
                <li key={d.key}>
                  {colLabel(...d.key.split(",").map(Number))} — Zone {d.zone} — ₹{fmtCr(d.repairCost)} Cr to repair
                </li>
              ))}
            </ul>
          )}
        </>
      );
    case "pandemic":
      return (
        <>
          <p>
            {result.infectedPop > 0
              ? `${Math.round(result.infectedPop).toLocaleString("en-IN")} people infected (no sewage plant in range, or water-tank-only supply with no nearby sewage plant).`
              : "No infections -- every home is either sewage-covered or off a water-treatment plant."}
          </p>
          {result.infectedPop > 0 && (
            <p>
              Hospitals required: {result.required} — you have {result.hospitalsBuilt}.
            </p>
          )}
          <p>
            {result.tier === "none"
              ? `+₹${fmtCr(result.cashBonus)} Cr, +${result.scoreDelta} score.`
              : result.tier === "treated"
              ? "Fully treated — no penalty."
              : result.tier === "short"
              ? `Short by ${result.shortfall} hospital(s) — income halved this year, ${result.scoreDelta} score.`
              : `No hospital at all — income zero this year, ${result.scoreDelta} score.`}
          </p>
        </>
      );
    case "immigration":
      return (
        <>
          <p>2,500 new arrivals settle in each of 2 new slum tiles near your existing city:</p>
          <ul>
            {result.spawned.map((key) => (
              <li key={key}>{colLabel(...key.split(",").map(Number))}</li>
            ))}
          </ul>
        </>
      );
    case "olympics":
      return <p>{result.qualified ? "Olympics qualified! +₹500 Cr, +150 score." : "Olympics bid failed. -50 score."}</p>;
    case "treasure":
      return (
        <p>
          {result.demolished
            ? `You built on the treasure tile — the building is lost, but you still claim ₹${result.cashGain} Cr.`
            : `The treasure tile was empty. You receive ₹${result.cashGain} Cr.`}
        </p>
      );
    default:
      return null;
  }
}

function renderFloor(floorResult) {
  if (!floorResult) return null;
  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px solid #dedad0",
        color: floorResult.met ? "#2e7d32" : "#b3261e",
      }}
    >
      {floorResult.met ? (
        <p>Mandatory Year 0 floor met — dam+hydro, full water coverage, a sewage plant, and a hospital all in place.</p>
      ) : (
        <>
          <p>
            <strong>Mandatory Year 0 floor missed:</strong> {floorResult.failed.join(", ")}.
          </p>
          <p>-100 score, income halved this year.</p>
        </>
      )}
    </div>
  );
}

function TwistModal() {
  const activeModal = useActiveGameStore((s) => s.activeModal);
  const closeModal = useActiveGameStore((s) => s.closeModal);

  return (
    <AnimatePresence>
      {activeModal && (
        <motion.div
          className="cw3-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
        >
          <motion.div
            className="cw3-modal"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cw3-modal-year">Year {activeModal.year}</div>
            <h2 className="cw3-modal-title">{TWIST_TITLE[activeModal.twist] || activeModal.twist}</h2>
            <div className="cw3-modal-body">
              {renderBody(activeModal.twist, activeModal.result)}
              {renderFloor(activeModal.floorResult)}
            </div>
            <button type="button" className="cw3-modal-close" onClick={closeModal}>
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TwistModal;
