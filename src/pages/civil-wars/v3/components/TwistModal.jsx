import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HouseLine, Warning, XCircle, ShieldCheck, UsersThree, Trophy, Coins } from "@phosphor-icons/react";
import { useActiveGameStore } from "../store/GameStoreContext.jsx";
import { colLabel, fmtCr } from "../format.js";
import { buildingsById } from "../engine.js";
import { BUILDING_ICON } from "../data/buildingMeta.js";
import { TWIST_RULES, MANDATORY_FLOOR_RULES } from "../data/twistRules.js";
import TwistRulesContent from "./TwistRulesContent.jsx";

function nameFor(id) {
  if (id === "slum") return "Slum";
  return buildingsById[id]?.name || id;
}

function IconFor({ id, ...props }) {
  const Ico = BUILDING_ICON[id] || HouseLine;
  return <Ico weight="duotone" {...props} />;
}

function intCr(n) {
  return Math.round(n).toLocaleString("en-IN");
}

// One line in the "what happened to your city" breakdown: an icon, the
// building name + tile coordinate, the rule that decided its fate, and
// an optional cash tag.
function OutcomeRow({ id, name, coord, reason, tag, tone }) {
  return (
    <li className={`cw3-outcome-row cw3-outcome-row--${tone}`}>
      <span className="cw3-outcome-icon">
        <IconFor id={id} size={15} />
      </span>
      <div className="cw3-outcome-text">
        <div className="cw3-outcome-head">
          <strong>{name || nameFor(id)}</strong>
          {coord && <span className="cw3-outcome-coord">{coord}</span>}
          {tag && <span className="cw3-outcome-tag">{tag}</span>}
        </div>
        {reason && <div className="cw3-outcome-reason">{reason}</div>}
      </div>
    </li>
  );
}

function Group({ title, children }) {
  return (
    <div className="cw3-outcome-group">
      <div className="cw3-outcome-group-title">{title}</div>
      <ul className="cw3-outcome-list">{children}</ul>
    </div>
  );
}

function keyCoord(key) {
  return colLabel(...key.split(",").map(Number));
}

function FloodOutcome({ result }) {
  const destroyed = result.destroyed || [];
  const damaged = result.damaged || [];
  const spared = result.spared || [];
  const totalRepair = damaged.reduce((sum, d) => sum + (d.repairCost || 0), 0);

  if (destroyed.length === 0 && damaged.length === 0 && spared.length === 0) {
    return <p>The flood missed your city — nothing you built sits in a flood zone.</p>;
  }

  return (
    <>
      {destroyed.length > 0 && (
        <Group title={`Destroyed outright — ${destroyed.length}`}>
          {destroyed.map((d) => (
            <OutcomeRow key={d.key} id={d.id} coord={keyCoord(d.key)} reason={d.reason} tone="bad" />
          ))}
        </Group>
      )}
      {damaged.length > 0 && (
        <Group title={`Damaged — needs repair before it works again — ${damaged.length}`}>
          {damaged.map((d) => (
            <OutcomeRow
              key={d.key}
              id={d.id}
              coord={keyCoord(d.key)}
              reason={d.reason}
              tag={`₹${fmtCr(d.repairCost)} Cr to repair`}
              tone="warn"
            />
          ))}
        </Group>
      )}
      {spared.length > 0 && (
        <details className="cw3-outcome-details" open={destroyed.length === 0 && damaged.length === 0}>
          <summary>
            {spared.length} building(s) in a flood zone were spared — why
          </summary>
          <ul className="cw3-outcome-list">
            {spared.map((d) => (
              <OutcomeRow key={d.key} id={d.id} coord={keyCoord(d.key)} reason={d.reason} tone="ok" />
            ))}
          </ul>
        </details>
      )}
      {totalRepair > 0 && (
        <p className="cw3-outcome-total">
          Total repair bill: <strong>₹{fmtCr(totalRepair)} Cr</strong>. Damaged tiles deliver nothing until you repair them
          from the board.
        </p>
      )}
    </>
  );
}

function PandemicOutcome({ result }) {
  const infected = result.infectedTiles || [];
  const safe = result.safeTiles || [];
  const perHospital = result.popPerHospital || 2500;

  const headline =
    result.tier === "none"
      ? `No infections. +₹${fmtCr(result.cashBonus)} Cr and +${result.scoreDelta} score.`
      : result.tier === "treated"
      ? "Every infected home was fully treated — no penalty."
      : result.tier === "short"
      ? `Short by ${result.shortfall} hospital(s) — income halved this year, ${result.scoreDelta} score.`
      : `No hospital anywhere — income zero this year, ${result.scoreDelta} score.`;

  return (
    <>
      <p className="cw3-outcome-headline">{headline}</p>

      {infected.length > 0 && (
        <>
          <p>
            <strong>{intCr(result.infectedPop)} people infected</strong> across {infected.length} tile(s). Hospitals needed{" "}
            <strong>{result.required}</strong> (1 per {perHospital.toLocaleString("en-IN")}, slums counting double) — you
            have <strong>{result.hospitalsBuilt}</strong>.
          </p>
          <Group title="Infected">
            {infected.map((t) => (
              <OutcomeRow
                key={`${t.row},${t.col}`}
                id={t.isSlum ? "slum" : "residential_medium"}
                name={t.isSlum ? "Slum" : "Home"}
                coord={colLabel(t.row, t.col)}
                reason={t.reason}
                tag={`${intCr(t.pop)} people`}
                tone="bad"
              />
            ))}
          </Group>
        </>
      )}

      {safe.length > 0 && (
        <details className="cw3-outcome-details">
          <summary>{safe.length} home(s) stayed contained — why</summary>
          <ul className="cw3-outcome-list">
            {safe.map((t) => (
              <OutcomeRow
                key={`${t.row},${t.col}`}
                id={t.isSlum ? "slum" : "residential_medium"}
                name={t.isSlum ? "Slum" : "Home"}
                coord={colLabel(t.row, t.col)}
                reason={t.reason}
                tone="ok"
              />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function ImmigrationOutcome({ result }) {
  const tiles = result.spawnedTiles || (result.spawned || []).map((key) => {
    const [row, col] = key.split(",").map(Number);
    return { row, col, pop: result.perSlumPop, reason: null };
  });
  return (
    <>
      <Group title={`New slums settled — ${tiles.length}`}>
        {tiles.map((t) => (
          <OutcomeRow
            key={`${t.row},${t.col}`}
            id="slum"
            coord={colLabel(t.row, t.col)}
            reason={t.reason}
            tag={`${intCr(t.pop || 2500)} people, unserved`}
            tone="warn"
          />
        ))}
      </Group>
      {result.reason && <p className="cw3-outcome-reason">{result.reason}</p>}
    </>
  );
}

function OlympicsOutcome({ result }) {
  const reqs = result.requirements || [];
  return (
    <>
      <p className="cw3-outcome-headline">
        {result.qualified
          ? `IPL bid qualified! +₹${fmtCr(result.cashBonus)} Cr and +${result.scoreDelta} score.`
          : `IPL bid failed. ${result.scoreDelta} score, no cash.`}
      </p>
      <Group title="Venue requirements">
        {reqs.map((r) => (
          <li key={r.id} className={`cw3-outcome-row cw3-outcome-row--${r.met ? "ok" : "bad"}`}>
            <span className="cw3-outcome-icon">
              {r.met ? <ShieldCheck size={15} weight="duotone" /> : <XCircle size={15} weight="duotone" />}
            </span>
            <div className="cw3-outcome-text">
              <div className="cw3-outcome-head">
                <strong>{r.label}</strong>
                <span className="cw3-outcome-coord">
                  {r.have} / {r.need}
                </span>
              </div>
              <div className="cw3-outcome-reason">{r.reason}</div>
            </div>
          </li>
        ))}
      </Group>
    </>
  );
}

function TreasureOutcome({ result }) {
  const coord = result.tile ? colLabel(result.tile.row, result.tile.col) : keyCoord(String(result.treasureTile));
  return (
    <>
      <p className="cw3-outcome-headline">
        The treasure tile is <strong>{coord}</strong>.
      </p>
      {result.buildingName ? (
        <>
          <p>
            Your <strong>{result.buildingName}</strong> is standing on it. Your options:
          </p>
          <ul className="cw3-outcome-list">
            <OutcomeRow
              id={result.buildingId}
              name="Demolish & claim"
              reason={`Pay ₹${fmtCr(result.miningCost)} Cr mining + ₹${fmtCr(
                result.demolishCost
              )} Cr demolition. The building and its services are gone.`}
              tag={`net +₹${fmtCr(result.netIfDemolish)} Cr`}
              tone="warn"
            />
            <OutcomeRow
              id={result.buildingId}
              name="Move first, then claim"
              reason={`Move the building (₹${fmtCr(
                result.moveCost
              )} Cr), then claim the empty tile for ₹${fmtCr(result.miningCost)} Cr mining. Building kept.`}
              tag={`net +₹${fmtCr(result.netIfMoveFirst)} Cr`}
              tone="ok"
            />
            <OutcomeRow
              id={result.buildingId}
              name="Do nothing"
              reason="Keep the building, forfeit the treasure."
              tag="₹0"
              tone="mute"
            />
          </ul>
        </>
      ) : (
        <p>
          The tile is empty. Claim it for <strong>₹{fmtCr(result.miningCost)} Cr</strong> mining and receive ₹
          {fmtCr(result.treasureValue)} Cr — <strong>net +₹{fmtCr(result.netIfEmpty)} Cr</strong>.
        </p>
      )}
      <p className="cw3-outcome-reason">
        The tile glows gold on your map. Select it to claim, any time before Year 5 ends — or leave it.
      </p>
    </>
  );
}

function renderOutcome(twist, result) {
  if (!result) return null;
  switch (twist) {
    case "flood":
      return <FloodOutcome result={result} />;
    case "pandemic":
      return <PandemicOutcome result={result} />;
    case "immigration":
      return <ImmigrationOutcome result={result} />;
    case "olympics":
      return <OlympicsOutcome result={result} />;
    case "treasure":
      return <TreasureOutcome result={result} />;
    default:
      return null;
  }
}

function FloorBlock({ floorResult }) {
  if (!floorResult) return null;
  return (
    <div className={`cw3-floor-block cw3-floor-block--${floorResult.met ? "ok" : "bad"}`}>
      {floorResult.met ? (
        <p>
          <strong>Mandatory Year 0 floor met.</strong> Dam + hydro, full water coverage, a sewage plant and a hospital are
          all in place.
        </p>
      ) : (
        <>
          <p>
            <strong>Mandatory Year 0 floor missed:</strong> {floorResult.failed.join(", ")}.
          </p>
          <p>−100 score, and your income is halved this year.</p>
        </>
      )}
    </div>
  );
}

const TWIST_ICON = {
  flood: Warning,
  pandemic: Warning,
  immigration: UsersThree,
  olympics: Trophy,
  treasure: Coins,
};

function TwistModalCard({ twist, result, floorResult, year, mode, onClose }) {
  const rules = TWIST_RULES[twist];
  const HeaderIcon = TWIST_ICON[twist] || Warning;
  const isReview = mode === "review";

  return (
    <motion.div
      className="cw3-modal cw3-modal--twist"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="cw3-modal-year">
        Year {year}
        {isReview ? " · rules & recap" : " · twist"}
      </div>
      <h2 className="cw3-modal-title">
        <HeaderIcon size={22} weight="duotone" /> {rules?.title || twist}
      </h2>
      {rules?.tagline && <p className="cw3-modal-tagline">{rules.tagline}</p>}

      <div className="cw3-modal-body">
        <section className="cw3-modal-part">
          <h3 className="cw3-modal-part-title">What happened to your city</h3>
          {renderOutcome(twist, result)}
          <FloorBlock floorResult={floorResult} />
        </section>

        <details className="cw3-modal-rules" open>
          <summary>The full rule for this twist</summary>
          <TwistRulesContent rules={rules} />
          {floorResult && (
            <div className="cw3-rules-extra">
              <h4 className="cw3-rules-heading">{MANDATORY_FLOOR_RULES.title}</h4>
              <TwistRulesContent rules={{ ...MANDATORY_FLOOR_RULES, title: undefined }} />
            </div>
          )}
        </details>
      </div>

      <button type="button" className="cw3-modal-close" onClick={onClose}>
        {isReview ? "Close" : "Got it — continue"}
      </button>
    </motion.div>
  );
}

function TwistModal() {
  const activeModal = useActiveGameStore((s) => s.activeModal);
  const closeModal = useActiveGameStore((s) => s.closeModal);
  const twistHelpOpen = useActiveGameStore((s) => s.twistHelpOpen);
  const closeTwistHelp = useActiveGameStore((s) => s.closeTwistHelp);
  const lastTwist = useActiveGameStore((s) => s.lastTwist);

  // The reveal modal takes precedence; the review panel is only shown
  // when nothing is being revealed right now.
  const reveal = activeModal && activeModal.twist ? activeModal : null;
  const review = !reveal && twistHelpOpen && lastTwist ? lastTwist : null;
  const shown = reveal || review;

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          className="cw3-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={reveal ? closeModal : closeTwistHelp}
        >
          <TwistModalCard
            twist={shown.twist}
            result={shown.result}
            floorResult={shown.floorResult}
            year={shown.year}
            mode={reveal ? "reveal" : "review"}
            onClose={reveal ? closeModal : closeTwistHelp}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TwistModal;
