import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PortalError } from '../components/PortalError';
import api from '../utils/api';

export const PostListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isEditMode, setIsEditMode] = useState(false);
  const [hasApplications, setHasApplications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Proposal fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('open');
  const [specificColleges, setSpecificColleges] = useState('');
  const [stipend, setStipend] = useState('');
  const [duration, setDuration] = useState('2 Months');
  const [deadline, setDeadline] = useState('');
  const [openings, setOpenings] = useState(1);
  const [minCGPA, setMinCGPA] = useState(7.0);
  const [selectedBranches, setSelectedBranches] = useState(['Civil Engineering']);

  // Custom Questionnaire builder
  const [customFields, setCustomFields] = useState([]);
  const [originalCustomFieldsCount, setOriginalCustomFieldsCount] = useState(0);

  const branches = ['Civil Engineering', 'Mining Engineering', 'Computer Science', 'Mechanical Engineering'];

  const fetchListingDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/internships/${id}`);
      const found = res.data.data;
      if (found) {
        setIsEditMode(true);
        setTitle(found.title || '');
        setDescription(found.description || '');
        setScope(found.scope || 'open');
        setSpecificColleges(
          Array.isArray(found.specificColleges) 
            ? found.specificColleges.join(', ') 
            : found.specificColleges || ''
        );
        setStipend(found.stipend || '');
        setDuration(found.duration || '2 Months');
        // Format ISO deadline date string to datetime-local input format
        setDeadline(found.deadline ? found.deadline.slice(0, 16) : '');
        setOpenings(found.openings || 1);
        setMinCGPA(found.eligibility?.minCGPA || 7.0);
        setSelectedBranches(found.eligibility?.branches || ['Civil Engineering']);
        
        // Custom fields loading
        const fields = found.customFields || [];
        setCustomFields(fields.map(f => ({ ...f, isOriginal: true })));
        setOriginalCustomFieldsCount(fields.length);

        // Query active applications for this posting
        const appRes = await api.get(`/internships/${id}/applicants`);
        const apps = appRes.data.data || [];
        setHasApplications(apps.length > 0);
      }
    } catch (err) {
      console.error('Error fetching listing details for editor:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to retrieve internship details for editing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchListingDetails();
    }
  }, [id]);

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
        fieldId: `cf-new-${Date.now()}`,
        label: '',
        type: 'text',
        options: '',
        required: false,
        isOriginal: false
      }
    ]);
  };

  const removeCustomField = (index) => {
    const field = customFields[index];
    if (hasApplications && field.isOriginal) return; // locked
    setCustomFields(customFields.filter((_, idx) => idx !== index));
  };

  const updateCustomField = (index, key, val) => {
    setCustomFields(
      customFields.map((field, idx) => {
        if (idx === index) {
          if (hasApplications && !field.isOriginal && key === 'required') {
            return { ...field, required: false }; // lock false
          }
          return { ...field, [key]: val };
        }
        return field;
      })
    );
  };

  const moveField = (index, direction) => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= customFields.length) return;
    const updated = [...customFields];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setCustomFields(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title || !description || !deadline) {
      setErrorMsg('Please fill out all mandatory fields.');
      return;
    }

    if (hasApplications) {
      const currentOriginalIds = customFields.filter(f => f.isOriginal).map(f => f.fieldId);
      if (currentOriginalIds.length < originalCustomFieldsCount) {
        setErrorMsg('Validation Error: Existing fields cannot be removed once applications have been submitted.');
        return;
      }
      const hasRequiredNew = customFields.filter(f => !f.isOriginal).some(f => f.required);
      if (hasRequiredNew) {
        setErrorMsg('Validation Error: Newly added custom fields must be optional.');
        return;
      }
    }

    // Format fields
    const formattedCustomFields = customFields.map((field) => ({
      fieldId: field.fieldId,
      label: field.label,
      type: field.type,
      required: field.required,
      options: typeof field.options === 'string'
        ? field.options.split(',').map((o) => o.trim()).filter((o) => o.length > 0)
        : field.options || []
    }));

    // Verify option constraints
    for (let field of formattedCustomFields) {
      if (field.type === 'select' && field.options.length === 0) {
        setErrorMsg(`Select custom field "${field.label || 'unnamed'}" must have options (comma-separated list).`);
        return;
      }
    }

    const payload = {
      title,
      description,
      scope,
      specificColleges: scope === 'specific_colleges' 
        ? specificColleges.split(',').map(c => c.trim()).filter(c => c.length > 0) 
        : [],
      stipend,
      duration,
      deadline,
      openings: parseInt(openings) || 1,
      eligibility: {
        branches: selectedBranches,
        minCGPA: parseFloat(minCGPA) || 0
      },
      customFields: formattedCustomFields
    };

    try {
      if (isEditMode) {
        await api.patch(`/internships/${id}`, payload);
      } else {
        await api.post('/internships', payload);
      }
      navigate('/portal/professor');
    } catch (err) {
      console.error('Error submitting internship proposal:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit proposal details to server.');
    }
  };

  if (loading && !title) {
    return (
      <div className="flex h-64 items-center justify-center bg-paper font-mono text-xs text-concrete uppercase tracking-widest animate-pulse">
        Loading Proposal Editor...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl font-body text-ink space-y-6">
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          {isEditMode ? 'Edit Internship Proposal' : 'Create Internship Proposal'}
        </h1>
        <p className="text-sm text-concrete">
          {hasApplications 
            ? '⚠ Note: Applications exist for this posting. Existing custom fields are locked in append-only mode.' 
            : 'Fill out the proposal details. You can attach custom application questions below.'}
        </p>
      </div>

      {errorMsg && (
        <PortalError message={errorMsg} onRetry={isEditMode ? fetchListingDetails : undefined} />
      )}

      <form onSubmit={handleSubmit} className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm space-y-6">
        <div className="space-y-4">
          {/* Project Title */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs uppercase tracking-wider text-concrete">Project Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Concrete Compression Analytics"
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs uppercase tracking-wider text-concrete">Project Description</label>
            <textarea
              rows="4"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tasks, required skills, and key objectives..."
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            />
          </div>

          {/* Scope selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs uppercase tracking-wider text-concrete">Access Scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
              >
                <option value="open">Open (All students)</option>
                <option value="internal">Internal (Civil/Mining only)</option>
                <option value="specific_colleges">Specific Colleges</option>
              </select>
            </div>

            {/* Conditional Specific Colleges */}
            {scope === 'specific_colleges' && (
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs uppercase tracking-wider text-concrete">Target Colleges (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={specificColleges}
                  onChange={(e) => setSpecificColleges(e.target.value)}
                  placeholder="e.g. NITK, IIT Bombay"
                  className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs uppercase tracking-wider text-concrete">Stipend Amount</label>
              <input
                type="text"
                required
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                placeholder="e.g. ₹10,000 / month, or Unpaid"
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
                required
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
              <label className="font-mono text-xs uppercase tracking-wider text-concrete">Min Required CGPA</label>
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

        {/* Custom Questionnaire Custom Fields Builder */}
        <div className="border-t border-concrete/20 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base">Custom Proposal Fields</h3>
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
              {customFields.map((field, index) => {
                const isLocked = hasApplications && field.isOriginal;
                const canMoveUp = index > 0;
                const canMoveDown = index < customFields.length - 1;

                return (
                  <div key={field.fieldId} className="p-4 border border-concrete/25 rounded bg-paper/50 relative space-y-3">
                    {/* Controls Panel */}
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!canMoveUp}
                        onClick={() => moveField(index, 'up')}
                        className={`font-mono text-xs ${canMoveUp ? 'text-concrete hover:text-blueprint' : 'text-concrete/20 cursor-not-allowed'}`}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={!canMoveDown}
                        onClick={() => moveField(index, 'down')}
                        className={`font-mono text-xs ${canMoveDown ? 'text-concrete hover:text-blueprint' : 'text-concrete/20 cursor-not-allowed'}`}
                        title="Move Down"
                      >
                        ▼
                      </button>
                      
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => removeCustomField(index)}
                        className={`font-mono text-sm leading-none ${
                          isLocked 
                            ? 'text-concrete/20 cursor-not-allowed' 
                            : 'text-concrete hover:text-signal'
                        }`}
                        title={isLocked ? "Field locked: Applications exist." : "Delete Field"}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {/* Question Label */}
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[10px] uppercase tracking-wider text-concrete">Question Label</label>
                        <input
                          type="text"
                          required
                          disabled={isLocked}
                          value={field.label}
                          onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                          placeholder="e.g. Prior Projects, Choice of base location"
                          className={`rounded border bg-white px-2 py-1.5 text-xs text-ink outline-none ${
                            isLocked ? 'border-concrete/20 bg-concrete/5 text-concrete/75 cursor-not-allowed' : 'border-concrete/35 focus:border-blueprint'
                          }`}
                        />
                      </div>

                      {/* Field Type */}
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[10px] uppercase tracking-wider text-concrete">Field Type</label>
                        <select
                          disabled={isLocked}
                          value={field.type}
                          onChange={(e) => updateCustomField(index, 'type', e.target.value)}
                          className={`rounded border bg-white px-2 py-1.5 text-xs text-ink outline-none ${
                            isLocked ? 'border-concrete/20 bg-concrete/5 text-concrete/75 cursor-not-allowed' : 'border-concrete/35 focus:border-blueprint'
                          }`}
                        >
                          <option value="text">Text (short answer)</option>
                          <option value="textarea">Textarea (long answer)</option>
                          <option value="number">Number</option>
                          <option value="link">Link (validated URL)</option>
                          <option value="select">Select (dropdown options)</option>
                        </select>
                      </div>
                    </div>

                    {/* Conditional Options */}
                    {field.type === 'select' && (
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[10px] uppercase tracking-wider text-concrete">
                          Dropdown Options (comma-separated list)
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isLocked}
                          value={typeof field.options === 'string' ? field.options : field.options?.join(', ') || ''}
                          onChange={(e) => updateCustomField(index, 'options', e.target.value)}
                          placeholder="Option A, Option B, Option C"
                          className={`rounded border bg-white px-2 py-1.5 text-xs text-ink outline-none ${
                            isLocked ? 'border-concrete/20 bg-concrete/5 text-concrete/75 cursor-not-allowed' : 'border-concrete/35 focus:border-blueprint'
                          }`}
                        />
                      </div>
                    )}

                    {/* Required Checkbox */}
                    <label className={`flex items-center gap-2 text-xs cursor-pointer pt-1 ${
                      hasApplications && !field.isOriginal 
                        ? 'text-concrete/40 cursor-not-allowed' 
                        : 'text-ink'
                    }`}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        disabled={hasApplications && !field.isOriginal}
                        onChange={(e) => updateCustomField(index, 'required', e.target.checked)}
                        className="accent-blueprint rounded"
                      />
                      Required field {hasApplications && !field.isOriginal && <span className="text-[10px] text-concrete font-mono">(new fields must be optional)</span>}
                    </label>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-concrete italic">No custom fields added. Student applications will require Resume PDF and Cover Note only.</p>
          )}
        </div>

        {/* Form Actions */}
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
            className="rounded bg-signal px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors shadow-sm"
          >
            Submit proposal
          </button>
        </div>
      </form>
    </div>
  );
};
export default PostListing;
