const User = require('../models/User');
const FacultyList = require('../models/FacultyList');
const AuditLog = require('../models/AuditLog');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Report = require('../models/Report');
const Dispute = require('../models/Dispute');
const SystemConfig = require('../models/SystemConfig');
const { setMaintenanceCache } = require('../middleware/maintenance');

exports.getPendingProfessors = async (req, res, next) => {
  try {
    const professors = await User.find({
      role: 'professor',
      status: 'pending'
    }).select('-passwordHash');

    res.status(200).json({
      success: true,
      count: professors.length,
      data: professors
    });
  } catch (error) {
    next(error);
  }
};

exports.approveProfessor = async (req, res, next) => {
  const { id } = req.params;

  try {
    const professor = await User.findById(id);

    if (!professor) {
      return res.status(404).json({ success: false, message: 'Professor not found.' });
    }

    if (professor.role !== 'professor') {
      return res.status(400).json({ success: false, message: 'User is not a professor.' });
    }

    const onFacultyList = await FacultyList.findOne({
      email: professor.email.toLowerCase()
    });

    if (!onFacultyList) {
      return res.status(400).json({
        success: false,
        message: 'Professor email is not present in the pre-approved Faculty List. Add them to the Faculty List first.'
      });
    }

    professor.status = 'approved';
    professor.verified = true;
    
    if (!professor.profile.college) professor.profile.college = 'NITK Surathkal';
    if (!professor.profile.branch) professor.profile.branch = onFacultyList.department;

    await professor.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'APPROVE_PROFESSOR',
      targetType: 'User',
      targetId: professor._id,
      metadata: { email: professor.email, approvedFacultyName: onFacultyList.name }
    });

    res.status(200).json({
      success: true,
      message: `Professor ${professor.name} approved successfully.`,
      data: {
        id: professor._id,
        name: professor.name,
        email: professor.email,
        status: professor.status,
        verified: professor.verified
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectProfessor = async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const professor = await User.findById(id);

    if (!professor) {
      return res.status(404).json({ success: false, message: 'Professor not found.' });
    }

    if (professor.role !== 'professor') {
      return res.status(400).json({ success: false, message: 'User is not a professor.' });
    }

    professor.status = 'rejected';
    professor.verified = false;
    await professor.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'REJECT_PROFESSOR',
      targetType: 'User',
      targetId: professor._id,
      metadata: { email: professor.email, reason: reason || 'No reason provided' }
    });

    res.status(200).json({
      success: true,
      message: `Professor ${professor.name} rejected successfully.`,
      data: {
        id: professor._id,
        name: professor.name,
        email: professor.email,
        status: professor.status,
        verified: professor.verified
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.addFaculty = async (req, res, next) => {
  const { name, email, department } = req.body;

  if (!name || !email || !department) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and department.'
    });
  }

  try {
    const emailLower = email.toLowerCase();
    const existing = await FacultyList.findOne({ email: emailLower });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists in the pre-approved Faculty List.'
      });
    }

    const faculty = await FacultyList.create({
      name,
      email: emailLower,
      department,
      addedBy: req.user._id
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADD_FACULTY',
      targetType: 'FacultyList',
      targetId: faculty._id,
      metadata: { email: emailLower, department }
    });

    res.status(201).json({
      success: true,
      message: 'Faculty added to pre-approved list successfully.',
      data: faculty
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Admin Feature Endpoints
// ==========================================

exports.getFlaggedContent = async (req, res, next) => {
  try {
    const reports = await Report.find().populate('reporterId', 'name email');
    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

exports.takedownInternship = async (req, res, next) => {
  const { id } = req.params;
  try {
    const internship = await Internship.findByIdAndDelete(id);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship listing not found.' });
    }

    // Cascade delete any applications associated with it
    await Application.deleteMany({ internshipId: id });

    res.status(200).json({
      success: true,
      message: 'Internship listing taken down successfully.'
    });
  } catch (error) {
    next(error);
  }
};

exports.getDisputes = async (req, res, next) => {
  try {
    const disputes = await Dispute.find().populate('reporterId targetId', 'name email role');
    res.status(200).json({
      success: true,
      count: disputes.length,
      data: disputes
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const postingsCount = await Internship.countDocuments({});
    const applicationsCount = await Application.countDocuments({});
    const selectedCount = await Application.countDocuments({ status: 'selected' });
    const dropOffRate = applicationsCount > 0 ? ((applicationsCount - selectedCount) / applicationsCount) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        postingsCount,
        applicationsCount,
        selectedCount,
        dropOffRate: parseFloat(dropOffRate.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Super Admin Specific Endpoints
// ==========================================

exports.promoteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.role = 'admin';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} promoted to Admin successfully.`,
      data: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

exports.demoteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.role = 'student'; // demoted to default student role
    await user.save();

    res.status(200).json({
      success: true,
      message: `Admin ${user.name} demoted successfully.`,
      data: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteFaculty = async (req, res, next) => {
  const { id } = req.params;
  try {
    const faculty = await FacultyList.findByIdAndDelete(id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty entry not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Faculty removed from pre-approved list successfully.'
    });
  } catch (error) {
    next(error);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.actorId) {
      filter.actorId = req.query.actorId;
    }
    if (req.query.action) {
      filter.action = req.query.action;
    }
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    const logs = await AuditLog.find(filter)
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

exports.exportUserData = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const applications = await Application.find({ studentId: id });
    const auditLogs = await AuditLog.find({ actorId: id });

    res.status(200).json({
      success: true,
      data: {
        user,
        applications,
        auditLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Cascade delete applications
    await Application.deleteMany({ studentId: id });

    // Cascade delete internships if professor
    if (user.role === 'professor') {
      await Internship.deleteMany({ professorId: id });
    }

    // Anonymize AuditLogs
    await AuditLog.updateMany(
      { actorId: id },
      {
        $set: {
          actorId: null,
          'metadata.anonymized': true,
          'metadata.originalRole': user.role
        }
      }
    );

    // Delete user
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `User ${user.name} data exported and profile cascade deleted/anonymized.`
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleKillSwitch = async (req, res, next) => {
  const { active } = req.body;
  if (active === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide active status in request body.' });
  }

  try {
    const configDoc = await SystemConfig.findOneAndUpdate(
      { key: 'maintenanceMode' },
      { value: !!active },
      { new: true, upsert: true }
    );

    setMaintenanceCache(!!active);

    res.status(200).json({
      success: true,
      message: `Platform maintenance mode set to ${!!active}.`,
      maintenanceMode: !!active
    });
  } catch (error) {
    next(error);
  }
};

exports.getFacultyList = async (req, res, next) => {
  try {
    const list = await FacultyList.find().populate('addedBy', 'name email');
    res.status(200).json({
      success: true,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('name email role verified status');
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};
