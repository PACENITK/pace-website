import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlateTag } from '../components/PlateTag';
import { mockInternships, mockApplications } from '../mocks/fixtures';

export const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, role } = useAuth();

  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // Eligibility Warning calculation
  const [eligibilityWarning, setEligibilityWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    const fetchDetails = () => {
      const found = mockInternships.find((i) => i._id === id);
      if (found) {
        setInternship(found);
        
        // Check if student already applied
        if (isAuthenticated && role === 'student') {
          const applied = mockApplications.some(
            (a) => a.internshipId._id === found._id && a.studentId._id === user._id
          );
          setAlreadyApplied(applied);

          // Calculate eligibility warning
          if (found.eligibility) {
            const studentBranch = user.profile?.branch;
            const studentCGPA = user.profile?.cgpa || 0;
            const minCGPA = found.eligibility.minCGPA || 0;
            const eligibleBranches = found.eligibility.branches || [];

            let warn = false;
            let msg = [];

            if (studentCGPA < minCGPA) {
              warn = true;
              msg.push(`Your CGPA (${studentCGPA}) is below the required minimum (${minCGPA}).`);
            }
            if (eligibleBranches.length > 0 && !eligibleBranches.includes(studentBranch)) {
              warn = true;
              msg.push(`Your branch (${studentBranch}) is not in the eligible list (${eligibleBranches.join(', ')}).`);
            }

            setEligibilityWarning(warn);
            setWarningMessage(msg.join(' '));
          }
        }
      }
      setLoading(false);
    };

    fetchDetails();
  }, [id, isAuthenticated, role, user]);

  const handleCustomResponseChange = (fieldId, value) => {
    setResponses({
      ...responses,
      [fieldId]: value
    });
  };

  const handleApply = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate resumeUrl URL format
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if (!resumeUrl) {
      newErrors.resumeUrl = 'Resume URL is required.';
    } else if (!urlPattern.test(resumeUrl)) {
      newErrors.resumeUrl = 'Resume URL is malformed.';
    }

    // Validate custom fields
    if (internship.customFields) {
      internship.customFields.forEach((field) => {
        const val = responses[field.fieldId];
        if (field.required && (!val || val.trim() === '')) {
          newErrors[field.fieldId] = `${field.label} is required.`;
        }
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Success Mock Application
    console.log('[MOCK] Application submitted:', {
      internshipId: internship._id,
      studentId: user._id,
      coverNote,
      resumeUrl,
      responses,
      eligibilityWarning
    });

    setSuccessMsg('Your application was submitted successfully!');
    setAlreadyApplied(true);
    setErrors({});
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-paper font-mono text-xs text-concrete uppercase tracking-widest animate-pulse">
        Loading Listing Details...
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="text-center py-12 bg-paper border border-concrete/20 rounded">
        <h3 className="font-display font-bold text-lg mb-2">Internship Not Found</h3>
        <p className="text-sm text-concrete mb-4">The listing you requested could not be located.</p>
        <Link to="/portal" className="text-blueprint hover:underline font-mono text-xs uppercase tracking-wider">
          ← Back to Discovery
        </Link>
      </div>
    );
  }

  const isExpired = new Date(internship.deadline) < new Date();

  return (
    <div className="mx-auto max-w-4xl font-body text-ink space-y-6">
      {/* Detail Head */}
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <PlateTag text={internship.plateId} type="plate" />
          {isAuthenticated && (
            <PlateTag text={internship.scope} type={internship.scope} />
          )}
          <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
            internship.status === 'open' ? 'text-structural border-structural/30 bg-structural/5' : 'text-signal border-signal/30 bg-signal/5'
          }`}>
            {internship.status}
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">{internship.title}</h1>
        <p className="text-sm text-concrete mb-4">Posted by {internship.professorId?.name || 'Professor'}</p>

        {isAuthenticated ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-concrete/10 pt-4 font-mono text-xs">
            <div>
              <span className="block text-concrete uppercase tracking-wider text-[10px]">Stipend</span>
              <span className="font-semibold text-blueprint">{internship.stipend}</span>
            </div>
            <div>
              <span className="block text-concrete uppercase tracking-wider text-[10px]">Duration</span>
              <span className="font-semibold">{internship.duration}</span>
            </div>
            <div>
              <span className="block text-concrete uppercase tracking-wider text-[10px]">Openings</span>
              <span className="font-semibold">{internship.openings} Positions</span>
            </div>
            <div>
              <span className="block text-concrete uppercase tracking-wider text-[10px]">Deadline</span>
              <span className={`font-semibold ${isExpired ? 'text-signal' : 'text-structural'}`}>
                {new Date(internship.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        ) : (
          <div className="border-t border-concrete/10 pt-4 text-xs font-mono text-concrete uppercase tracking-wider">
            🔒 Details locked. Sign in to view stipend, duration, and eligibility criteria.
          </div>
        )}
      </div>

      {/* Description Section */}
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold mb-3">Project Description</h2>
        <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{internship.description}</p>
        
        {isAuthenticated && internship.eligibility && (
          <div className="mt-6 border-t border-concrete/10 pt-4">
            <h3 className="font-display text-sm font-bold mb-2">Eligibility Criteria</h3>
            <ul className="text-xs space-y-1.5 font-mono text-concrete">
              <li>• Required Branches: <span className="text-ink font-semibold">{internship.eligibility.branches.join(', ')}</span></li>
              <li>• Minimum CGPA: <span className="text-blueprint font-bold">{internship.eligibility.minCGPA}</span></li>
            </ul>
          </div>
        )}
      </div>

      {/* Application / guest login prompt section */}
      {!isAuthenticated ? (
        <div className="rounded-md border border-concrete/20 bg-blueprint/5 p-6 shadow-sm text-center">
          <h2 className="font-display text-lg font-bold mb-2">Apply for this Position</h2>
          <p className="text-sm text-concrete mb-4">You must sign in with your NITK IRIS credentials to submit applications.</p>
          <button
            onClick={() => navigate('/portal/login')}
            className="rounded bg-blueprint px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-blueprint/90 transition-colors"
          >
            Access Portal
          </button>
        </div>
      ) : role === 'student' ? (
        <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold mb-4">Application Form</h2>
          
          {successMsg ? (
            <div className="rounded bg-structural/10 border border-structural/30 p-4 text-sm text-structural font-medium">
              {successMsg}
            </div>
          ) : isExpired || internship.status === 'closed' ? (
            <div className="rounded bg-signal/10 border border-signal/30 p-4 text-sm text-signal font-medium">
              This internship listing is closed or has passed its application deadline.
            </div>
          ) : alreadyApplied ? (
            <div className="space-y-4">
              <div className="rounded bg-blueprint/10 border border-blueprint/30 p-4 text-sm text-blueprint font-medium">
                You have already submitted an application for this position.
              </div>
              <button
                onClick={() => {
                  setAlreadyApplied(false);
                  setSuccessMsg('');
                  console.log('[MOCK] Student withdrew application');
                }}
                className="rounded border border-signal text-signal px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider hover:bg-signal/5"
              >
                Withdraw Application
              </button>
            </div>
          ) : (
            <form onSubmit={handleApply} className="space-y-4">
              {/* Eligibility Alert Banner */}
              {eligibilityWarning && (
                <div className="rounded bg-signal/5 border border-signal/20 p-4 text-xs text-signal font-mono leading-relaxed">
                  <span className="font-bold uppercase tracking-wider block mb-1">⚠ Eligibility Warning</span>
                  {warningMessage} Your application will be accepted, but it will be flagged with a warning visible to the professor.
                </div>
              )}

              {/* Cover Note */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs uppercase tracking-wider text-concrete">Cover Note (Optional)</label>
                <textarea
                  rows="3"
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Introduce yourself and explain why you are suitable..."
                  className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
                />
              </div>

              {/* Resume URL */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs uppercase tracking-wider text-concrete">
                  Resume URL (Drive/PDF link) <span className="text-signal font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className={`rounded border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint ${
                    errors.resumeUrl ? 'border-signal' : 'border-concrete/30'
                  }`}
                />
                {errors.resumeUrl && (
                  <span className="text-xs text-signal font-mono">{errors.resumeUrl}</span>
                )}
              </div>

              {/* Custom Questions */}
              {internship.customFields && internship.customFields.length > 0 && (
                <div className="border-t border-concrete/10 pt-4 space-y-4">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-concrete font-bold">Custom Questionnaire</h3>
                  
                  {internship.customFields.map((field) => {
                    const error = errors[field.fieldId];
                    return (
                      <div key={field.fieldId} className="flex flex-col gap-1">
                        <label className="font-body text-sm font-semibold text-ink">
                          {field.label} {field.required && <span className="text-signal font-bold">*</span>}
                        </label>
                        
                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={responses[field.fieldId] || ''}
                            onChange={(e) => handleCustomResponseChange(field.fieldId, e.target.value)}
                            className={`rounded border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint ${
                              error ? 'border-signal' : 'border-concrete/30'
                            }`}
                          />
                        )}

                        {field.type === 'textarea' && (
                          <textarea
                            rows="2"
                            value={responses[field.fieldId] || ''}
                            onChange={(e) => handleCustomResponseChange(field.fieldId, e.target.value)}
                            className={`rounded border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint ${
                              error ? 'border-signal' : 'border-concrete/30'
                            }`}
                          />
                        )}

                        {field.type === 'number' && (
                          <input
                            type="number"
                            value={responses[field.fieldId] || ''}
                            onChange={(e) => handleCustomResponseChange(field.fieldId, e.target.value)}
                            className={`rounded border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint ${
                              error ? 'border-signal' : 'border-concrete/30'
                            }`}
                          />
                        )}

                        {field.type === 'select' && (
                          <select
                            value={responses[field.fieldId] || ''}
                            onChange={(e) => handleCustomResponseChange(field.fieldId, e.target.value)}
                            className={`rounded border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint ${
                              error ? 'border-signal' : 'border-concrete/30'
                            }`}
                          >
                            <option value="">Select option...</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}

                        {error && (
                          <span className="text-xs text-signal font-mono">{error}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded bg-signal py-3 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors"
              >
                Submit Application
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm text-center">
          <p className="text-sm font-mono text-concrete uppercase tracking-wider">
            Logged in as {role.replace('_', ' ')}. Application actions are restricted to student accounts.
          </p>
        </div>
      )}
    </div>
  );
};
export default Detail;
