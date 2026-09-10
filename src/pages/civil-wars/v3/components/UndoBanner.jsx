import React, { useEffect, useRef, useState } from "react";
import { useActiveGameStore } from "../store/GameStoreContext.jsx";
import { buildingsById } from "../engine.js";
import { colLabel, fmtCr } from "../format.js";

const UNDO_MS = 5000;

// The 5s reversal window for the action confirmPendingAction just
// committed. Owns its own countdown (rather than a timer living inside
// the store) so it's just a plain effect keyed on `undoable` changing.
// Reads through the active store context so it works for both the local
// sandbox (synchronous undo) and the networked game (POST /action undo).
function UndoBanner() {
  const undoable = useActiveGameStore((s) => s.undoable);
  const undoLastAction = useActiveGameStore((s) => s.undoLastAction);
  const clearUndoable = useActiveGameStore((s) => s.clearUndoable);
  const [remaining, setRemaining] = useState(UNDO_MS);
  const startRef = useRef(0);

  useEffect(() => {
    if (!undoable) return undefined;
    startRef.current = Date.now();
    setRemaining(UNDO_MS);
    const interval = setInterval(() => {
      const left = UNDO_MS - (Date.now() - startRef.current);
      if (left <= 0) {
        clearInterval(interval);
        clearUndoable();
      } else {
        setRemaining(left);
      }
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoable]);

  if (!undoable) return null;

  const label =
    undoable.type === "place"
      ? `Placed ${buildingsById[undoable.buildingId].name} at ${colLabel(undoable.row, undoable.col)}`
      : undoable.type === "rehouse"
      ? `Rehoused slum at ${colLabel(undoable.row, undoable.col)}`
      : undoable.type === "move"
      ? `Moved ${buildingsById[undoable.buildingId].name} from ${colLabel(undoable.fromRow, undoable.fromCol)} to ${colLabel(
          undoable.toRow,
          undoable.toCol
        )}`
      : `Repaired ${colLabel(undoable.row, undoable.col)}`;
  const pct = Math.max(0, Math.min(100, (remaining / UNDO_MS) * 100));

  return (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-[3000] flex items-center gap-3 pl-4 pr-3 py-2.5 bg-[#201e1d] text-white rounded shadow-[0_8px_24px_rgba(0,0,0,.35)] text-[13px] overflow-hidden">
      <span>
        {label} — refund ₹{fmtCr(undoable.refund)} Cr
      </span>
      <button
        type="button"
        onClick={undoLastAction}
        className="px-3 py-1.5 rounded-sm bg-[#2b4c6f] text-white font-semibold cursor-pointer border-none whitespace-nowrap"
      >
        Undo ({Math.ceil(remaining / 1000)}s)
      </button>
      <div className="absolute left-0 bottom-0 h-[2px] bg-[#8fd694]" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default UndoBanner;
