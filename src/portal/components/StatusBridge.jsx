import React from 'react';

const STEPS = [
  { key: 'applied', label: 'Applied', color: 'bg-blueprint text-blueprint' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'bg-structural text-structural' },
  { key: 'selected', label: 'Selected', color: 'bg-signal text-signal' }
];

export const StatusBridge = ({ status }) => {
  const isRejected = status === 'rejected';
  
  // Find current step index
  const activeIndex = isRejected 
    ? 1 // Show up to shortlisted, then break
    : STEPS.findIndex(step => step.key === status);

  return (
    <div className="w-full py-4 font-display">
      <div className="relative flex items-center justify-between">
        {/* The Bridge / Track Line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-concrete/20" />
        
        {/* Active Bridge Highlight */}
        <div 
          className={`absolute left-0 top-1/2 h-0.5 -translate-y-1/2 transition-all duration-500 ${
            isRejected ? 'bg-signal' : 'bg-blueprint'
          }`}
          style={{ 
            width: isRejected 
              ? '50%' 
              : activeIndex === 0 ? '0%' : activeIndex === 1 ? '50%' : '100%' 
          }}
        />

        {/* Pylons (Nodes) */}
        {STEPS.map((step, idx) => {
          const isCompleted = idx <= activeIndex;
          const isCurrent = idx === activeIndex;
          
          let pylonBg = 'bg-paper border-concrete/40';
          let labelColor = 'text-concrete';

          if (isCompleted) {
            pylonBg = idx === 0 
              ? 'bg-blueprint border-blueprint' 
              : idx === 1 
                ? 'bg-structural border-structural' 
                : 'bg-structural border-structural';
            labelColor = idx === 0 
              ? 'text-blueprint font-bold' 
              : idx === 1 
                ? 'text-structural font-bold' 
                : 'text-structural font-bold';
          }

          // Override for selected status or rejection
          if (idx === 2 && status === 'selected') {
            pylonBg = 'bg-signal border-signal animate-bounce';
            labelColor = 'text-signal font-extrabold';
          }

          if (idx === 2 && isRejected) {
            pylonBg = 'bg-signal border-signal';
            labelColor = 'text-signal font-bold';
          }

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              {/* Pylon Circle */}
              <div 
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm ${pylonBg} ${
                  isCurrent ? 'ring-4 ring-concrete/10' : ''
                }`}
              >
                {idx === 2 && isRejected ? (
                  <span className="text-white text-xs font-mono">✕</span>
                ) : isCompleted ? (
                  <span className="text-white text-xs font-mono">✓</span>
                ) : (
                  <span className="text-concrete text-xs font-mono">{idx + 1}</span>
                )}
              </div>
              
              {/* Label */}
              <div className="absolute top-10 flex flex-col items-center whitespace-nowrap">
                <span className={`text-xs uppercase tracking-wider ${labelColor}`}>
                  {idx === 2 && isRejected ? 'Rejected' : step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-8" /> {/* Spacing for absolute label placement */}
    </div>
  );
};
export default StatusBridge;
