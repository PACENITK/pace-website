import React from 'react';

export const PortalError = ({ message = 'An unexpected error occurred while loading this section.', onRetry }) => {
  return (
    <div className="rounded-md border border-signal/30 bg-signal/5 p-5 text-ink font-body shadow-sm max-w-lg mx-auto my-4">
      <div className="flex items-start gap-3">
        <div className="text-signal text-lg font-mono leading-none">⚠</div>
        <div className="flex-1 space-y-2">
          <h4 className="font-display font-bold text-sm text-signal uppercase tracking-wider">Section Load Failure</h4>
          <p className="text-xs text-concrete leading-relaxed">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded bg-signal px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors"
            >
              Retry Action ↻
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default PortalError;
