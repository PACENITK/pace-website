import React from 'react';

export const FilterBar = ({ filters, onChange }) => {
  const branches = ['All Branches', 'Civil Engineering', 'Mining Engineering', 'Computer Science', 'Mechanical Engineering'];
  const durations = ['All Durations', '1 Month', '2 Months', '3 Months', '6 Months'];
  const stipends = ['All Stipends', 'Paid Only', 'Unpaid Only'];

  const handleSelectChange = (key, value) => {
    onChange({
      ...filters,
      [key]: value === `All ${key.charAt(0).toUpperCase() + key.slice(1)}s` || value.startsWith('All') ? '' : value
    });
  };

  const handleTextChange = (e) => {
    onChange({
      ...filters,
      search: e.target.value
    });
  };

  const resetFilters = () => {
    onChange({
      search: '',
      branch: '',
      duration: '',
      stipend: ''
    });
  };

  return (
    <div className="w-full rounded-md border border-concrete/20 bg-paper p-4 font-body shadow-sm">
      <div className="grid gap-4 md:grid-cols-4 sm:grid-cols-2">
        {/* Search */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs uppercase tracking-wider text-concrete">Search Keyword</label>
          <input
            type="text"
            placeholder="e.g. Structural, Soil"
            value={filters.search || ''}
            onChange={handleTextChange}
            className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
          />
        </div>

        {/* Branch Filter */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs uppercase tracking-wider text-concrete">Academic Branch</label>
          <select
            value={filters.branch || 'All Branches'}
            onChange={(e) => handleSelectChange('branch', e.target.value)}
            className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
          >
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Duration Filter */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs uppercase tracking-wider text-concrete">Duration</label>
          <select
            value={filters.duration || 'All Durations'}
            onChange={(e) => handleSelectChange('duration', e.target.value)}
            className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
          >
            {durations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Stipend Filter */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs uppercase tracking-wider text-concrete">Stipend Scope</label>
          <select
            value={filters.stipend ? (filters.stipend === 'Paid' ? 'Paid Only' : 'Unpaid Only') : 'All Stipends'}
            onChange={(e) => {
              const val = e.target.value;
              const mapped = val === 'Paid Only' ? 'Paid' : val === 'Unpaid Only' ? 'Unpaid' : '';
              onChange({ ...filters, stipend: mapped });
            }}
            className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
          >
            {stipends.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reset filters chip */}
      {(filters.search || filters.branch || filters.duration || filters.stipend) && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={resetFilters}
            className="font-mono text-xs uppercase tracking-wider text-signal hover:underline"
          >
            Reset All Filters ✕
          </button>
        </div>
      )}
    </div>
  );
};
export default FilterBar;
