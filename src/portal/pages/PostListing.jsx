import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const PostListing = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('open');
  const [stipend, setStipend] = useState('');
  const [duration, setDuration] = useState('2 Months');
  const [deadline, setDeadline] = useState('');
  const [openings, setOpenings] = useState(1);
  const [minCGPA, setMinCGPA] = useState(7.0);
  const [selectedBranches, setSelectedBranches] = useState(['Civil Engineering']);

  // Custom Fields state
  const [customFields, setCustomFields] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const branches = ['Civil Engineering', 'Mining Engineering', 'Computer Science', 'Mechanical Engineering'];

  const handleBranchChange = (branch) => {
    if (selectedBranches.includes(branch)) {
      setSelectedBranches(selectedBranches.filter((b) => b !== branch));
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        fieldId: `mock-cf-${Date.now()}`,
        label: '',
        type: 'text',
        options: '',
        required: false
      }
    ]);
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, idx) => idx !== index));
  };

  const updateCustomField = (index, key, val) => {
    setCustomFields(
      customFields.map((field, idx) => {
        if (idx === index) {
          return { ...field, [key]: val };
        }
        return field;
      })
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!title || !description || !deadline) {
      setErrorMsg('Please fill in all mandatory fields.');
      return;
    }

    // Validate select custom fields have non-empty options
    for (let field of customFields) {
      if (field.type === 'select') {
        const parsedOptions = field.options
          .split(',')
          .map((o) => o.trim())
          .filter((o) => o.length > 0);
        if (parsedOptions.length === 0) {
          setErrorMsg(`Select custom field "${field.label || 'unnamed'}" must have options (comma-separated list).`);
          return;
        }
      }
    }

    // Success Mock submit
    console.log('[MOCK] Internship Proposal Created:', {
      title,
      description,
      scope,
      stipend,
      duration,
      deadline,
      openings,
      eligibility: {
        branches: selectedBranches,
        minCGPA
      },
      customFields: customFields.map((field) => ({
        ...field,
        options: field.type === 'select' ? field.options.split(',').map((o) => o.trim()) : []
      }))
    });

    navigate('/portal/professor');
  };

  return (
    <div className="mx-auto max-w-2xl font-body text-ink space-y-6">
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Create Internship Proposal</h1>
        <p className="text-sm text-concrete">Fill out the proposal details. You can attach custom application questions below.</p>
      </div>

      {errorMsg && (
        <div className="rounded bg-signal/10 border border-signal/30 p-4 text-xs text-signal font-mono font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm space-y-6">
        {/* Core fields */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs uppercase tracking-wider text-concrete">Project Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bridge Health Monitoring"
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs uppercase tracking-wider text-concrete">Project Description</label>
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the research goals, student responsibilities, and methodologies..."
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs uppercase tracking-wider text-concrete">Access Scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
              >
                <option value="open">Open (All applicants allowed)</option>
                <option value="internal">Internal (Restricted to Civil/Mining NITK)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs uppercase tracking-wider text-concrete">Stipend Amount</label>
              <input
                type="text"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                placeholder="e.g. ₹15,000 / month, or Unpaid"
                className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs uppercase tracking-wider text-concrete">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
              >
                <option value="1 Month">1 Month</option>
                <option value="2 Months">2 Months</option>
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs uppercase tracking-wider text-concrete font-bold text-signal">Application Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs uppercase tracking-wider text-concrete">Positions Open</label>
              <input
                type="number"
                value={openings}
                onChange={(e) => setOpenings(parseInt(e.target.value) || 1)}
                min="1"
                className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs uppercase tracking-wider text-concrete">Minimum Required CGPA</label>
              <input
                type="number"
                step="0.1"
                value={minCGPA}
                onChange={(e) => setMinCGPA(parseFloat(e.target.value) || 0)}
                className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-concrete/10 pt-4">
            <label className="font-mono text-xs uppercase tracking-wider text-concrete">Eligible Branches</label>
            <div className="flex flex-wrap gap-4">
              {branches.map((b) => (
                <label key={b} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(b)}
                    onChange={() => handleBranchChange(b)}
                    className="accent-blueprint rounded"
                  />
                  {b}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic custom questions */}
        <div className="border-t border-concrete/20 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base">Posting Custom Fields</h3>
            <button
              type="button"
              onClick={addCustomField}
              className="rounded border border-blueprint text-blueprint px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider hover:bg-blueprint/5 transition-colors"
            >
              + Add Custom Field
            </button>
          </div>

          {customFields.length > 0 ? (
            <div className="space-y-4">
              {customFields.map((field, index) => (
                <div key={field.fieldId} className="p-4 border border-concrete/25 rounded bg-paper/50 relative space-y-3">
                  <button
                    type="button"
                    onClick={() => removeCustomField(index)}
                    className="absolute right-3 top-3 text-concrete hover:text-signal font-mono text-sm"
                  >
                    ✕
                  </button>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] uppercase tracking-wider text-concrete">Question Label</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                        placeholder="e.g. Preferred Software, Link to project"
                        className="rounded border border-concrete/35 bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-blueprint"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] uppercase tracking-wider text-concrete">Field Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateCustomField(index, 'type', e.target.value)}
                        className="rounded border border-concrete/35 bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-blueprint"
                      >
                        <option value="text">Text (short line)</option>
                        <option value="textarea">Textarea (paragraphs)</option>
                        <option value="number">Number</option>
                        <option value="link">Link (validated URL)</option>
                        <option value="select">Select (dropdown options)</option>
                      </select>
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] uppercase tracking-wider text-concrete">
                        Dropdown Options (comma-separated list)
                      </label>
                      <input
                        type="text"
                        value={field.options}
                        onChange={(e) => updateCustomField(index, 'options', e.target.value)}
                        placeholder="Option A, Option B, Option C"
                        className="rounded border border-concrete/35 bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-blueprint"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-xs text-ink cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateCustomField(index, 'required', e.target.checked)}
                      className="accent-blueprint rounded"
                    />
                    Required field
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-concrete italic">No custom fields added. Applications will default to standard fields (Resume + Cover Note).</p>
          )}
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-3 justify-end border-t border-concrete/10 pt-6">
          <button
            type="button"
            onClick={() => navigate('/portal/professor')}
            className="rounded border border-concrete/40 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-concrete hover:border-ink hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-signal px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors"
          >
            Submit proposal
          </button>
        </div>
      </form>
    </div>
  );
};
export default PostListing;
