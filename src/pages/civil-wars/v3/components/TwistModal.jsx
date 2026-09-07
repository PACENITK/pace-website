import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import useGameStore from "../store/useGameStore.js";

const TWIST_TITLE = {
  flood: "Flood",
  pandemic: "Pandemic",
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
          <p>{result.destroyed.length} building(s) destroyed by the flood.</p>
          <p>Repair cost paid: ₹{result.repairCost.toFixed(1)} Cr</p>
        </>
      );
    case "pandemic":
      return (
        <>
          <p>
            Hospitals required: {result.required} — you have {result.hospitalsBuilt}.
          </p>
          <p>
            {result.met
              ? "Requirement met — +₹50 Cr, no penalty."
              : result.shortfall === 1
              ? "Short by 1 — income halved this year."
              : `Short by ${result.shortfall} — income zero this year, and -100 score.`}
          </p>
        </>
      );
    case "immigration":
      return (
        <p>
          5,000 people arrived. Every home you built now carries {(1 + (result.overflowFactor || 0)).toFixed(2)}x
          its rated demand.
        </p>
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

function TwistModal() {
  const activeModal = useGameStore((s) => s.activeModal);
  const closeModal = useGameStore((s) => s.closeModal);

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
            <div className="cw3-modal-body">{renderBody(activeModal.twist, activeModal.result)}</div>
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
