import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useActiveGameStore } from "../store/GameStoreContext.jsx";
import { buildingsById, config } from "../engine.js";
import { colLabel, fmtCr } from "../format.js";

// Every placement/rehouse goes through this modal before it touches
// `placed`/`cash` -- a fast-paced in-person event means a mis-tap on a
// ₹100+ Cr building is easy to make, so nothing commits without an
// explicit confirm naming the building and the exact tile.
function PlacementConfirmModal() {
  const pendingAction = useActiveGameStore((s) => s.pendingAction);
  const confirmPendingAction = useActiveGameStore((s) => s.confirmPendingAction);
  const cancelPendingAction = useActiveGameStore((s) => s.cancelPendingAction);
  const cash = useActiveGameStore((s) => s.cash);
  const damagedTiles = useActiveGameStore((s) => s.damagedTiles);

  useEffect(() => {
    if (!pendingAction) return undefined;
    function onKey(e) {
      if (e.key === "Escape") cancelPendingAction();
      if (e.key === "Enter") confirmPendingAction();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingAction, confirmPendingAction, cancelPendingAction]);

  return (
    <AnimatePresence>
      {pendingAction && (
        <motion.div
          className="cw3-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={cancelPendingAction}
        >
          <motion.div
            className="cw3-modal"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {pendingAction.type === "place" ? (
              <PlaceDetails pendingAction={pendingAction} cash={cash} />
            ) : pendingAction.type === "rehouse" ? (
              <RehouseDetails pendingAction={pendingAction} cash={cash} />
            ) : pendingAction.type === "move" ? (
              <MoveDetails pendingAction={pendingAction} cash={cash} />
            ) : (
              <RepairDetails pendingAction={pendingAction} cash={cash} damagedTiles={damagedTiles} />
            )}
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                autoFocus
                onClick={confirmPendingAction}
                className="px-[18px] py-2 rounded-sm bg-[#2b4c6f] text-white text-sm font-semibold cursor-pointer border-none"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={cancelPendingAction}
                className="px-[18px] py-2 rounded-sm bg-white border border-[#dedad0] text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PlaceDetails({ pendingAction, cash }) {
  const def = buildingsById[pendingAction.buildingId];
  const coord = colLabel(pendingAction.row, pendingAction.col);
  return (
    <>
      <div className="cw3-modal-year">Confirm placement</div>
      <h2 className="cw3-modal-title">{def.name}</h2>
      <div className="cw3-modal-body">
        <p>
          Tile: <strong>{coord}</strong>
        </p>
        <p>
          Cost: <strong>₹{fmtCr(def.cost)} Cr</strong>
        </p>
        <p>Cash after: ₹{fmtCr(cash - def.cost)} Cr</p>
      </div>
    </>
  );
}

function RehouseDetails({ pendingAction, cash }) {
  const coord = colLabel(pendingAction.row, pendingAction.col);
  return (
    <>
      <div className="cw3-modal-year">Confirm rehousing</div>
      <h2 className="cw3-modal-title">Rehouse slum</h2>
      <div className="cw3-modal-body">
        <p>
          Tile: <strong>{coord}</strong>
        </p>
        <p>
          Cost: <strong>₹{fmtCr(config.slumUpgradeCost)} Cr</strong>
        </p>
        <p>Cash after: ₹{fmtCr(cash - config.slumUpgradeCost)} Cr</p>
      </div>
    </>
  );
}

function MoveDetails({ pendingAction, cash }) {
  const def = buildingsById[pendingAction.buildingId];
  const from = colLabel(pendingAction.fromRow, pendingAction.fromCol);
  const to = colLabel(pendingAction.toRow, pendingAction.toCol);
  return (
    <>
      <div className="cw3-modal-year">Confirm move</div>
      <h2 className="cw3-modal-title">{def.name}</h2>
      <div className="cw3-modal-body">
        <p>
          From <strong>{from}</strong> to <strong>{to}</strong>
        </p>
        <p>
          Move fee (10% of ₹{fmtCr(def.cost)} Cr): <strong>₹{fmtCr(pendingAction.fee)} Cr</strong>
        </p>
        <p>Cash after: ₹{fmtCr(cash - pendingAction.fee)} Cr</p>
      </div>
    </>
  );
}

function RepairDetails({ pendingAction, cash, damagedTiles }) {
  const coord = colLabel(pendingAction.row, pendingAction.col);
  const entry = damagedTiles[`${pendingAction.row},${pendingAction.col}`];
  const repairCost = entry ? entry.repairCost : 0;
  return (
    <>
      <div className="cw3-modal-year">Confirm repair</div>
      <h2 className="cw3-modal-title">{entry && entry.id === "slum" ? "Restore slum" : "Repair building"}</h2>
      <div className="cw3-modal-body">
        <p>
          Tile: <strong>{coord}</strong>
        </p>
        <p>
          Cost: <strong>₹{fmtCr(repairCost)} Cr</strong>
        </p>
        <p>Cash after: ₹{fmtCr(cash - repairCost)} Cr</p>
      </div>
    </>
  );
}

export default PlacementConfirmModal;
