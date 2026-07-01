import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="w-full rounded-md border border-concrete/20 bg-paper/60 p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-20 rounded bg-concrete/20" />
        <div className="h-5 w-16 rounded bg-concrete/20" />
      </div>
      <div className="h-6 w-3/4 rounded bg-concrete/30 mb-3" />
      <div className="h-4 w-1/3 rounded bg-concrete/20 mb-5" />
      <div className="space-y-2 mb-6">
        <div className="h-3 w-full rounded bg-concrete/20" />
        <div className="h-3 w-5/6 rounded bg-concrete/20" />
      </div>
      <div className="border-t border-concrete/10 pt-4 flex justify-between">
        <div className="h-4 w-24 rounded bg-concrete/20" />
        <div className="h-4 w-28 rounded bg-concrete/20" />
      </div>
    </div>
  );
};
export default SkeletonCard;
