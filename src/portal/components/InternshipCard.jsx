import React from 'react';
import { PlateTag } from './PlateTag';
import { useAuth } from '../context/AuthContext';

export const InternshipCard = ({ internship, onClick }) => {
  const { isAuthenticated } = useAuth();

  const {
    plateId,
    title,
    description,
    scope,
    stipend,
    duration,
    openings,
    deadline,
    professorId,
    eligibility
  } = internship;

  const formattedDeadline = new Date(deadline).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div 
      onClick={onClick}
      className="group relative cursor-pointer rounded-md border border-concrete/20 bg-paper p-5 transition-all duration-300 hover:border-blueprint hover:shadow-md font-body text-ink"
    >
      {/* Plate ID & Scope Badge */}
      <div className="flex items-center justify-between mb-3">
        <PlateTag text={plateId || 'PACE-XXX'} type="plate" />
        {isAuthenticated && scope && (
          <PlateTag text={scope} type={scope} />
        )}
      </div>

      {/* Title */}
      <h3 className="font-display text-lg font-bold group-hover:text-blueprint leading-tight transition-colors duration-300 mb-1">
        {title}
      </h3>

      {/* Professor */}
      <p className="text-sm font-medium text-concrete mb-3">
        by {professorId?.name || 'Unknown Professor'}
      </p>

      {/* Description Snippet */}
      {isAuthenticated && (
        <p className="text-xs text-concrete line-clamp-2 mb-4 leading-relaxed">
          {description}
        </p>
      )}

      {/* Meta Grid */}
      <div className={`grid gap-2 border-t border-concrete/10 pt-4 text-xs font-mono ${isAuthenticated ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {isAuthenticated && (
          <>
            <div className="flex flex-col">
              <span className="uppercase text-concrete tracking-wider text-[10px]">Stipend</span>
              <span className="font-semibold text-blueprint">{stipend || 'Unpaid'}</span>
            </div>
            <div className="flex flex-col">
              <span className="uppercase text-concrete tracking-wider text-[10px]">Duration</span>
              <span className="font-semibold">{duration || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="uppercase text-concrete tracking-wider text-[10px]">Openings</span>
              <span className="font-semibold">{openings || 0} Positions</span>
            </div>
          </>
        )}
        <div className="flex flex-col">
          <span className="uppercase text-concrete tracking-wider text-[10px]">Deadline</span>
          <span className={`font-semibold ${new Date(deadline) < new Date() ? 'text-signal' : 'text-structural'}`}>
            {formattedDeadline}
          </span>
        </div>
      </div>

      {/* Eligibility Details for Authenticated Students */}
      {isAuthenticated && eligibility && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-concrete/10 pt-3">
          <span className="font-mono text-[9px] uppercase tracking-wider text-concrete mr-1 self-center">Eligible:</span>
          {eligibility.branches?.map((b) => (
            <span key={b} className="rounded bg-concrete/10 px-1.5 py-0.5 text-[10px] font-medium text-concrete">
              {b.split(' ')[0]}
            </span>
          ))}
          <span className="rounded bg-blueprint/10 px-1.5 py-0.5 text-[10px] font-semibold text-blueprint">
            CGPA ≥ {eligibility.minCGPA || '0.0'}
          </span>
        </div>
      )}
    </div>
  );
};
export default InternshipCard;
