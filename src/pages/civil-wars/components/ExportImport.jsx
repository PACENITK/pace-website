import React, { useState } from "react";
import PropTypes from "prop-types";

function ExportImport({ placed, onImport }) {
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);

  const handleCopy = async () => {
    const json = JSON.stringify(placed);
    try {
      await navigator.clipboard.writeText(json);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus(null);
    }
    setTimeout(() => setCopyStatus(null), 1500);
  };

  const handleLoad = () => {
    try {
      const parsed = JSON.parse(importText);
      onImport(parsed);
      setImportError(null);
      setImportText("");
      setShowImport(false);
    } catch {
      setImportError("Invalid JSON");
    }
  };

  return (
    <div className="cw-export">
      <div className="cw-stats-section-label">Export / import</div>
      <div className="cw-export-actions">
        <button type="button" className="cw-reset-btn" onClick={handleCopy}>
          {copyStatus || "Copy city JSON"}
        </button>
        <button type="button" className="cw-reset-btn" onClick={() => setShowImport((v) => !v)}>
          {showImport ? "Cancel" : "Paste city JSON"}
        </button>
      </div>
      {showImport && (
        <div className="cw-import-box">
          <textarea
            className="cw-import-textarea"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"3,4":"water_l"}'
          />
          <button type="button" className="cw-reset-btn" onClick={handleLoad}>
            Load
          </button>
          {importError && <div className="cw-import-error">{importError}</div>}
        </div>
      )}
    </div>
  );
}

ExportImport.propTypes = {
  placed: PropTypes.object.isRequired,
  onImport: PropTypes.func.isRequired,
};

export default ExportImport;
