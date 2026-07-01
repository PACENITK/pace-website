import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export const Profile = () => {
  const { user, restoreSession } = useAuth();
  
  const [name, setName] = useState('');
  const [college, setCollege] = useState('NITK Surathkal');
  const [branch, setBranch] = useState('Civil Engineering');
  const [year, setYear] = useState(3);
  const [cgpa, setCgpa] = useState(8.0);
  const [skills, setSkills] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [phone, setPhone] = useState('');

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCollege(user.profile?.college || 'NITK Surathkal');
      setBranch(user.profile?.branch || 'Civil Engineering');
      setYear(user.profile?.year || 3);
      setCgpa(user.profile?.cgpa || 8.0);
      setSkills(user.profile?.skills?.join(', ') || '');
      setResumeUrl(user.profile?.resumeUrl || '');
      setLinkedin(user.profile?.linkedin || '');
      setGithub(user.profile?.github || '');
      setPhone(user.profile?.phone || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMsg('');

    const newErrors = {};
    if (!name) newErrors.name = 'Name is required.';
    
    // Validate Resume URL
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if (resumeUrl && !urlPattern.test(resumeUrl)) {
      newErrors.resumeUrl = 'Resume URL is malformed.';
    }

    if (linkedin && !urlPattern.test(linkedin)) {
      newErrors.linkedin = 'LinkedIn link must be a valid URL.';
    }

    if (github && !urlPattern.test(github)) {
      newErrors.github = 'GitHub link must be a valid URL.';
    }

    if (cgpa < 0 || cgpa > 10) {
      newErrors.cgpa = 'CGPA must be between 0.0 and 10.0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await api.patch('/auth/profile', {
        name,
        profile: {
          college,
          branch,
          year: parseInt(year),
          cgpa: parseFloat(cgpa),
          skills: skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
          resumeUrl,
          linkedin,
          github,
          phone
        }
      });
      
      setSuccessMsg('Profile updated successfully!');
      await restoreSession();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setErrors({ cgpa: err.response?.data?.message || 'Failed to update profile details on server.' });
    }
  };

  return (
    <div className="mx-auto max-w-2xl font-body text-ink space-y-6">
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Student Profile Setup</h1>
        <p className="text-sm text-concrete">Manage your professional credentials, links, and contact parameters for applications.</p>
      </div>

      {successMsg && (
        <div className="rounded bg-structural/10 border border-structural/30 p-4 text-xs text-structural font-mono font-medium">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs uppercase tracking-wider text-concrete">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            />
            {errors.name && <span className="text-xs text-signal font-mono">{errors.name}</span>}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs uppercase tracking-wider text-concrete">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            />
          </div>

          {/* College */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs uppercase tracking-wider text-concrete">College / Institute</label>
            <input
              type="text"
              disabled
              value={college}
              className="rounded border border-concrete/20 bg-concrete/5 px-3 py-2 text-sm text-concrete outline-none"
            />
          </div>

          {/* Branch */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs uppercase tracking-wider text-concrete">Academic Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            >
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Mining Engineering">Mining Engineering</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
            </select>
          </div>

          {/* Year */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs uppercase tracking-wider text-concrete">Current Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            >
              <option value={1}>1st Year</option>
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
            </select>
          </div>

          {/* CGPA */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs uppercase tracking-wider text-concrete flex items-center justify-between">
              <span>Cumulative CGPA</span>
              <span className="text-[9px] text-concrete tracking-normal uppercase">cgpaSource: self_reported</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={cgpa}
              onChange={(e) => setCgpa(parseFloat(e.target.value) || 0)}
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            />
            {errors.cgpa && <span className="text-xs text-signal font-mono">{errors.cgpa}</span>}
          </div>
        </div>

        {/* Skills Tag input */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs uppercase tracking-wider text-concrete">Technical Skills (comma-separated list)</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. AutoCAD, Python, GIS, Excel"
            className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
          />
        </div>

        {/* Links */}
        <div className="space-y-4 border-t border-concrete/10 pt-4">
          <h3 className="font-display text-sm font-bold">External Verification Links</h3>
          
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs uppercase tracking-wider text-concrete">Resume PDF / Google Drive URL</label>
            <input
              type="text"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className={`rounded border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint ${
                errors.resumeUrl ? 'border-signal' : 'border-concrete/30'
              }`}
            />
            {errors.resumeUrl && <span className="text-xs text-signal font-mono">{errors.resumeUrl}</span>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs uppercase tracking-wider text-concrete">LinkedIn Profile URL</label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className={`rounded border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint ${
                  errors.linkedin ? 'border-signal' : 'border-concrete/30'
                }`}
              />
              {errors.linkedin && <span className="text-xs text-signal font-mono">{errors.linkedin}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs uppercase tracking-wider text-concrete">GitHub Profile URL</label>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                className={`rounded border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint ${
                  errors.github ? 'border-signal' : 'border-concrete/30'
                }`}
              />
              {errors.github && <span className="text-xs text-signal font-mono">{errors.github}</span>}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded bg-signal py-3 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors"
        >
          Save Profile Details
        </button>
      </form>
    </div>
  );
};
export default Profile;
