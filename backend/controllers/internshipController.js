const Internship = require('../models/Internship');
const AuditLog = require('../models/AuditLog');

/**
 * POST /internships
 * Create a new internship listing (Professor only)
 */
exports.createInternship = async (req, res, next) => {
  const { title, description, eligibility, scope, specificColleges, stipend, duration, deadline, openings } = req.body;

  try {
    const internship = await Internship.create({
      title,
      description,
      professorId: req.user._id,
      eligibility,
      scope,
      specificColleges: scope === 'specific_colleges' ? specificColleges : [],
      stipend,
      duration,
      deadline,
      openings
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'CREATE_INTERNSHIP',
      targetType: 'Internship',
      targetId: internship._id,
      metadata: { title, plateId: internship.plateId }
    });

    res.status(201).json({
      success: true,
      message: 'Internship listing created successfully.',
      data: internship
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /internships
 * Get all internship listings
 */
exports.getInternships = async (req, res, next) => {
  try {
    const internships = await Internship.find()
      .populate('professorId', 'name email profile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: internships.length,
      data: internships
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /internships/:id
 * Get a single internship listing by ID
 */
exports.getInternshipById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const internship = await Internship.findById(id).populate('professorId', 'name email profile');

    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship listing not found.' });
    }

    res.status(200).json({
      success: true,
      data: internship
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /internships/:id
 * Update an internship listing (Professor owner or Admin only)
 */
exports.updateInternship = async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const internship = req.internship;

    delete updates.plateId;
    delete updates.professorId;
    delete updates._id;

    Object.assign(internship, updates);
    await internship.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'UPDATE_INTERNSHIP',
      targetType: 'Internship',
      targetId: internship._id,
      metadata: { plateId: internship.plateId }
    });

    res.status(200).json({
      success: true,
      message: 'Internship listing updated successfully.',
      data: internship
    });
  } catch (error) {
    next(error);
  }
};
