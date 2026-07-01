const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  internshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: true,
  },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'rejected', 'selected', 'withdrawn'],
    default: 'applied',
  },
  resumeSnapshotUrl: {
    type: String,
    required: true,
  },
  coverNote: {
    type: String,
    default: '',
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  statusUpdatedAt: {
    type: Date,
    default: Date.now,
  },
});

applicationSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusUpdatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
