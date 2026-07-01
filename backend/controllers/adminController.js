const User = require('../models/User');
const FacultyList = require('../models/FacultyList');
const AuditLog = require('../models/AuditLog');

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
