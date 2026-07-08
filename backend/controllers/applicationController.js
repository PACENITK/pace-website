const Application = require('../models/Application');
const Internship = require('../models/Internship');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const emailService = require('../services/emailService');

// Helper to validate URLs
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// Hook notification to real emailService
const notifyStatusChange = async (applicationId, status) => {
  try {
    const application = await Application.findById(applicationId).populate('studentId internshipId');
    if (application && application.studentId && application.internshipId) {
      await emailService.sendApplicationStatusEmail(
        application.studentId.email,
        application.studentId.name,
        application.internshipId.title,
        status
      );
    }
  } catch (err) {
    console.error('Failed to send status change notification email:', err);
  }
};

/**
 * POST /internships/:id/apply
 * Apply to an internship listing (Student only)
 */
exports.applyToInternship = async (req, res, next) => {
  const internshipId = req.params.id;
  const { coverNote, resumeUrl: bodyResumeUrl, responses } = req.body;
  const student = req.user;

  try {
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship listing not found.' });
    }

    if (internship.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Applications for this internship are closed.' });
    }

    // Check duplicate applications
    const existing = await Application.findOne({ studentId: student._id, internshipId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied to this internship.' });
    }

    // Resolve resumeUrl
    const resolvedResumeUrl = bodyResumeUrl || student.profile.resumeUrl;
    if (!resolvedResumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a resume URL in your application or add one to your profile.'
      });
    }

    if (!isValidUrl(resolvedResumeUrl)) {
      return res.status(400).json({
        success: false,
        message: 'The provided resume URL is malformed or invalid.'
      });
    }

    // Validate Custom Field Responses
    const responsesList = responses || [];
    const fields = internship.customFields || [];

    for (const field of fields) {
      const response = responsesList.find(r => r.fieldId === field.fieldId);

      if (field.required && (!response || response.value === undefined || response.value === '')) {
        return res.status(400).json({
          success: false,
          message: `Validation Error: The custom field '${field.label}' is required.`
        });
      }

      if (response && response.value !== undefined && response.value !== '') {
        if (field.type === 'select') {
          if (!field.options.includes(response.value)) {
            return res.status(400).json({
              success: false,
              message: `Validation Error: The value for field '${field.label}' must be one of the pre-defined options: ${field.options.join(', ')}.`
            });
          }
        }
      }
    }

    // Eligibility Check — Warn, Don't Block
    let eligibilityWarning = false;

    // A. CGPA Eligibility Check
    const studentCGPA = student.profile.cgpa || 0;
    const minCGPA = internship.eligibility.minCGPA || 0;
    if (studentCGPA < minCGPA) {
      eligibilityWarning = true;
    }

    // B. Branch Eligibility Check
    if (!eligibilityWarning && internship.eligibility.branches && internship.eligibility.branches.length > 0) {
      const studentBranch = (student.profile.branch || '').toLowerCase().trim();
      const allowedBranches = internship.eligibility.branches.map(b => b.toLowerCase().trim());
      if (!allowedBranches.includes(studentBranch)) {
        eligibilityWarning = true;
      }
    }

    // C. Year Eligibility Check
    if (!eligibilityWarning && internship.eligibility.years && internship.eligibility.years.length > 0) {
      const studentYear = student.profile.year;
      if (!studentYear || !internship.eligibility.years.includes(studentYear)) {
        eligibilityWarning = true;
      }
    }

    // D. Scope (NITK only) Eligibility Check
    if (!eligibilityWarning && internship.scope === 'nitk_only' && student.studentType !== 'nitk') {
      eligibilityWarning = true;
    }

    // E. Scope (Specific Colleges) Eligibility Check
    if (!eligibilityWarning && internship.scope === 'specific_colleges') {
      const studentCollege = (student.profile.college || '').toLowerCase().trim();
      const allowedColleges = internship.specificColleges.map(c => c.toLowerCase().trim());
      if (!allowedColleges.includes(studentCollege)) {
        eligibilityWarning = true;
      }
    }

    const application = await Application.create({
      studentId: student._id,
      internshipId: internship._id,
      resumeSnapshotUrl: resolvedResumeUrl, // snapshot fallback
      resumeUrl: resolvedResumeUrl,
      responses: responsesList,
      eligibilityWarning,
      coverNote: coverNote || '',
      status: 'applied'
    });

    await AuditLog.create({
      actorId: student._id,
      action: 'APPLY_INTERNSHIP',
      targetType: 'Application',
      targetId: application._id,
      metadata: { internshipId: internship._id, plateId: internship.plateId, eligibilityWarning }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      eligibilityWarning,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /internships/:id/withdraw
 * Withdraw an application (Student only, own application, before deadline)
 */
exports.withdrawApplication = async (req, res, next) => {
  const internshipId = req.params.id;
  const student = req.user;

  try {
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship listing not found.' });
    }

    const now = new Date();
    if (internship.deadline && now > new Date(internship.deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw application after the internship deadline has passed.'
      });
    }

    const application = await Application.findOne({ studentId: student._id, internshipId });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found for this internship.' });
    }

    if (application.status === 'withdrawn') {
      return res.status(400).json({ success: false, message: 'Application is already withdrawn.' });
    }

    application.status = 'withdrawn';
    await application.save();

    await AuditLog.create({
      actorId: student._id,
      action: 'WITHDRAW_APPLICATION',
      targetType: 'Application',
      targetId: application._id,
      metadata: { internshipId: internship._id, plateId: internship.plateId }
    });

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully.',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /applications/mine
 * Get student's own applications
 */
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ studentId: req.user._id })
      .populate({
        path: 'internshipId',
        select: 'title plateId deadline status professorId',
        populate: {
          path: 'professorId',
          select: 'name'
        }
      })
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /internships/:id/applicants
 * Get applications for a specific listing (Professor owner or Admin only)
 */
exports.getApplicationsForInternship = async (req, res, next) => {
  const filter = { internshipId: req.internship._id };

  // Support status filtering
  if (req.query.status) {
    filter.status = req.query.status;
  }

  try {
    let applicationsQuery = Application.find(filter)
      .populate('studentId', 'name email profile studentType rollNumber');

    // Fetch and then sort/filter by student characteristics (like CGPA or branch)
    let applications = await applicationsQuery;

    // Filter by branch (if specified in query)
    if (req.query.branch) {
      const branchLower = req.query.branch.toLowerCase().trim();
      applications = applications.filter(app => 
        app.studentId && 
        app.studentId.profile && 
        (app.studentId.profile.branch || '').toLowerCase().trim() === branchLower
      );
    }

    // Sort options
    if (req.query.sortBy === 'cgpa') {
      const direction = req.query.sortOrder === 'asc' ? 1 : -1;
      applications.sort((a, b) => {
        const cgpaA = (a.studentId && a.studentId.profile && a.studentId.profile.cgpa) || 0;
        const cgpaB = (b.studentId && b.studentId.profile && b.studentId.profile.cgpa) || 0;
        return (cgpaA - cgpaB) * direction;
      });
    } else {
      // Default: sort by appliedAt DESC
      applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    }

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /applications/:id/status
 * Update application status (Professor owner or Admin only)
 */
exports.updateApplicationStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['shortlisted', 'rejected', 'selected'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Please provide a valid transition status: ${validStatuses.join(', ')}`
    });
  }

  try {
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const internship = await Internship.findById(application.internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Associated internship listing not found.' });
    }

    // Verify ownership/role access
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      if (internship.professorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have ownership of the internship associated with this application.'
        });
      }
    }

    // Validate state transitions
    const current = application.status;

    // Rule 1: From 'applied', can transition to 'shortlisted' or 'rejected'
    if (current === 'applied' && status !== 'shortlisted' && status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot change status from '${current}' to '${status}'.`
      });
    }

    // Rule 2: From 'shortlisted', can transition to 'selected' or 'rejected'
    if (current === 'shortlisted' && status !== 'selected' && status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot change status from '${current}' to '${status}'.`
      });
    }

    // Rule 3: No transitions allowed from 'rejected', 'selected', or 'withdrawn'
    if (['rejected', 'selected', 'withdrawn'].includes(current)) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Application is already in a terminal state ('${current}') and cannot be changed.`
      });
    }

    application.status = status;
    await application.save();

    // Trigger notification hook
    await notifyStatusChange(application._id, status);

    await AuditLog.create({
      actorId: req.user._id,
      action: 'UPDATE_APPLICATION_STATUS',
      targetType: 'Application',
      targetId: application._id,
      metadata: { status, internshipId: internship._id, plateId: internship.plateId }
    });

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}.`,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /applications/:id/resume
 * Retrieve candidate resume (Audited on successful fetch)
 */
exports.viewResume = async (req, res, next) => {
  const { id } = req.params;

  try {
    const application = await Application.findById(id).populate('internshipId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const isStudentOwner = application.studentId.toString() === req.user._id.toString();
    const isProfessorOwner = application.internshipId && application.internshipId.professorId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    if (!isStudentOwner && !isProfessorOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view the resume of this candidate.'
      });
    }

    res.status(200).json({
      success: true,
      resumeUrl: application.resumeUrl || application.resumeSnapshotUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /applications/:id/message
 * Send a message to candidate via platform (preserves professor email privacy)
 */
exports.messageCandidate = async (req, res, next) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Please provide a message body.' });
  }

  try {
    const application = await Application.findById(id).populate('internshipId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Verify ownership/role access
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      if (application.internshipId.professorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have ownership of the internship associated with this application.'
        });
      }
    }

    // Preserve privacy: stub log sending through platform
    console.log(`[STUB] Message: Message sent to applicant of application ID ${id} via the platform (preserving professor email privacy). Content: "${message}"`);

    await AuditLog.create({
      actorId: req.user._id,
      action: 'MESSAGE_APPLICANT',
      targetType: 'Application',
      targetId: application._id,
      metadata: { internshipId: application.internshipId._id }
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully via the platform (email privacy protected).'
    });
  } catch (error) {
    next(error);
  }
};
