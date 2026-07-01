const Application = require('../models/Application');
const Internship = require('../models/Internship');
const AuditLog = require('../models/AuditLog');

exports.applyToInternship = async (req, res, next) => {
  const internshipId = req.params.id;
  const { coverNote } = req.body;
  const student = req.user;

  try {
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship listing not found.' });
    }

    if (internship.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Applications for this internship are closed.' });
    }

    const existing = await Application.findOne({ studentId: student._id, internshipId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied to this internship.' });
    }

    if (!student.profile.resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume to your profile before applying.'
      });
    }

    if (internship.scope === 'nitk_only' && student.studentType !== 'nitk') {
      return res.status(403).json({
        success: false,
        message: 'This internship is restricted to NITK students only.'
      });
    }

    if (internship.scope === 'specific_colleges') {
      const studentCollege = (student.profile.college || '').toLowerCase().trim();
      const allowedColleges = internship.specificColleges.map(c => c.toLowerCase().trim());
      if (!allowedColleges.includes(studentCollege)) {
        return res.status(403).json({
          success: false,
          message: 'Your college is not eligible for this internship.'
        });
      }
    }

    const studentCGPA = student.profile.cgpa || 0;
    const minCGPA = internship.eligibility.minCGPA || 0;
    if (studentCGPA < minCGPA) {
      return res.status(403).json({
        success: false,
        message: `Your CGPA (${studentCGPA}) does not meet the minimum requirement of ${minCGPA}.`
      });
    }

    if (internship.eligibility.branches && internship.eligibility.branches.length > 0) {
      const studentBranch = (student.profile.branch || '').toLowerCase().trim();
      const allowedBranches = internship.eligibility.branches.map(b => b.toLowerCase().trim());
      if (!allowedBranches.includes(studentBranch)) {
        return res.status(403).json({
          success: false,
          message: 'Your academic branch is not eligible for this internship.'
        });
      }
    }

    if (internship.eligibility.years && internship.eligibility.years.length > 0) {
      const studentYear = student.profile.year;
      if (!studentYear || !internship.eligibility.years.includes(studentYear)) {
        return res.status(403).json({
          success: false,
          message: 'Your academic year is not eligible for this internship.'
        });
      }
    }

    const application = await Application.create({
      studentId: student._id,
      internshipId: internship._id,
      resumeSnapshotUrl: student.profile.resumeUrl,
      coverNote: coverNote || '',
      status: 'applied'
    });

    await AuditLog.create({
      actorId: student._id,
      action: 'APPLY_INTERNSHIP',
      targetType: 'Application',
      targetId: application._id,
      metadata: { internshipId: internship._id, plateId: internship.plateId }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

exports.getApplicationsForInternship = async (req, res, next) => {
  try {
    const applications = await Application.find({ internshipId: req.internship._id })
      .populate('studentId', 'name email profile studentType rollNumber')
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

exports.updateApplicationStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['shortlisted', 'rejected', 'selected', 'withdrawn'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Please provide a valid status: ${validStatuses.join(', ')}`
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

    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      if (internship.professorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have ownership of the internship associated with this application.'
        });
      }
    }

    application.status = status;
    await application.save();

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
