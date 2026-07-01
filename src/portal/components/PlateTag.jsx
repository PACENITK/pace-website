import React from 'react';

export const PlateTag = ({ text, type = 'plate' }) => {
  // Types: 'plate' (e.g. PACE-001), 'open' (scope), 'internal' (scope), 'closed' (status)
  let bgStyles = 'bg-paper text-concrete border-concrete/40';
  
  if (type === 'plate') {
    bgStyles = 'bg-blueprint/10 text-blueprint border-blueprint/30';
  } else if (type === 'open') {
    bgStyles = 'bg-structural/10 text-structural border-structural/30';
  } else if (type === 'internal') {
    bgStyles = 'bg-signal/10 text-signal border-signal/30';
  } else if (type === 'closed') {
    bgStyles = 'bg-ink/10 text-ink border-ink/30';
  }

  return (
    <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-xs font-semibold tracking-wider uppercase ${bgStyles}`}>
      {text}
    </span>
  );
};
