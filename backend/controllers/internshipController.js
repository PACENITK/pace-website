const Internship = require('../models/Internship');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const emailService = require('../services/emailService');

// Notify all pending/shortlisted applicants when an internship closes
const notifyPendingApplicants = async (internshipId) => {
  try {
    const internship = await Internship.findById(internshipId);
    if (!internship) return;

    const pendingApps = await Application.find({
      internshipId,
      status: { $in: ['applied', 'shortlisted'] }
    }).populate('studentId');

    for (const app of pendingApps) {
      if (app.studentId && app.studentId.email) {
        await emailService.sendInternshipClosedEmail(
          app.studentId.email,
          app.studentId.name,
          internship.title
        );
      }
    }
  } catch (err) {
    console.error('Failed to notify pending applicants on internship closure:', err);
  }
};

/**
 * POST /internships
 * Create a new internship listing (Professor only)
 */
exports.createInternship = async (req, res, next) => {
  const {
    title,
    description,
    eligibility,
    scope,
    specificColleges,
    stipend,
    duration,
    deadline,
    openings,
    customFields
  } = req.body;

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
      openings,
      customFields: customFields || []
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
 * Get all internship listings (Guests get limited fields)
 */
exports.getInternships = async (req, res, next) => {
  try {
    const filter = {};

    // Apply filtering query params
    if (req.query.branch) {
      filter['eligibility.branches'] = req.query.branch;
    }
    if (req.query.duration) {
      filter.duration = req.query.duration;
    }
    if (req.query.stipend) {
      filter.stipend = req.query.stipend;
    }
    if (req.query.deadline) {
      filter.deadline = { $lte: new Date(req.query.deadline) };
    }
    if (req.query.scope) {
      filter.scope = req.query.scope;
    }

    if (!req.user) {
      // Guest: reduced field set (title, professor name, deadline only)
      const internships = await Internship.find(filter)
        .populate('professorId', 'name')
        .select('title professorId deadline')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: internships.length,
        data: internships
      });
    }

    // Authenticated users get full detail
    const internships = await Internship.find(filter)
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
    if (!req.user) {
      // Guest: reduced field set
      const internship = await Internship.findById(id)
        .populate('professorId', 'name')
        .select('title professorId deadline');

      if (!internship) {
        return res.status(404).json({ success: false, message: 'Internship listing not found.' });
      }

      return res.status(200).json({
        success: true,
        data: internship
      });
    }

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
    const internship = req.internship; // attached by requireOwnership middleware

    // Prevent overwriting internal fields
    delete updates.plateId;
    delete updates.professorId;
    delete updates._id;

    // Check if customFields is being updated
    if (updates.customFields) {
      const applicationCount = await Application.countDocuments({ internshipId: id });

      if (applicationCount > 0) {
        // Enforce append-only rules
        const existingFieldsMap = new Map(internship.customFields.map(f => [f.fieldId, f]));
        const updatedFields = updates.customFields;

        // Ensure every existing field is still present with the same type and label/settings
        for (const [fieldId, originalField] of existingFieldsMap) {
          const updatedField = updatedFields.find(f => f.fieldId === fieldId);
          if (!updatedField) {
            return res.status(400).json({
              success: false,
              message: `Validation Error: Existing custom field '${originalField.label}' cannot be removed because this listing already has applications.`
            });
          }
          if (updatedField.type !== originalField.type) {
            return res.status(400).json({
              success: false,
              message: `Validation Error: The type of custom field '${originalField.label}' cannot be changed because this listing already has applications.`
            });
          }
          if (!originalField.required && updatedField.required) {
            return res.status(400).json({
              success: false,
              message: `Validation Error: Custom field '${originalField.label}' cannot be changed from optional to required because this listing already has applications.`
            });
          }
        }

        // Ensure any new fields are optional
        for (const updatedField of updatedFields) {
          if (!existingFieldsMap.has(updatedField.fieldId)) {
            if (updatedField.required) {
              return res.status(400).json({
                success: false,
                message: `Validation Error: Newly added custom fields must be optional because this listing already has applications.`
              });
            }
          }
        }
      }
    }

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

/**
 * PATCH /internships/:id/close
 * Close an internship listing (Professor owner or Admin only)
 */
exports.closeInternship = async (req, res, next) => {
  try {
    const internship = req.internship; // attached by requireOwnership middleware

    if (internship.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Internship listing is already closed.'
      });
    }

    internship.status = 'closed';
    await internship.save();

    // Trigger notification side-effect
    await notifyPendingApplicants(internship._id);

    await AuditLog.create({
      actorId: req.user._id,
      action: 'CLOSE_INTERNSHIP',
      targetType: 'Internship',
      targetId: internship._id,
      metadata: { plateId: internship.plateId }
    });

    res.status(200).json({
      success: true,
      message: 'Internship listing closed successfully.',
      data: internship
    });
  } catch (error) {
    next(error);
  }
};
