import React from "react";

// Renders one rules object from data/twistRules.js -- shared by the
// twist reveal modal and the header "Year N rules" review panel.
function TwistRulesContent({ rules }) {
  if (!rules) return null;
  return (
    <div className="cw3-rules">
      {rules.tagline && <p className="cw3-rules-tagline">{rules.tagline}</p>}

      {rules.stakes && rules.stakes.length > 0 && (
        <div className="cw3-rules-stakes">
          {rules.stakes.map((s) => (
            <div key={s.label} className="cw3-rules-stake">
              <span className="cw3-rules-stake-label">{s.label}</span>
              <span className="cw3-rules-stake-value">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {rules.sections.map((section) => (
        <div key={section.heading} className="cw3-rules-section">
          <h4 className="cw3-rules-heading">{section.heading}</h4>
          <ul className="cw3-rules-list">
            {section.points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default TwistRulesContent;
