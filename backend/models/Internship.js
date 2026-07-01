const mongoose = require('mongoose');
const Counter = require('./Counter');

const internshipSchema = new mongoose.Schema({
  plateId: {
    type: String,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  professorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eligibility: {
    branches: [{ type: String }],
    minCGPA: { type: Number, default: 0 },
    years: [{ type: Number }],
  },
  scope: {
    type: String,
    enum: ['open', 'nitk_only', 'specific_colleges'],
    required: true,
  },
  specificColleges: [{ type: String }],
  stipend: {
    type: String,
    default: 'Unpaid',
  },
  duration: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  openings: {
    type: Number,
    required: true,
    default: 1,
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
  },
}, {
  timestamps: true,
});

internshipSchema.pre('save', async function (next) {
  if (this.plateId) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { id: 'internship_plate_id' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seqStr = String(counter.seq).padStart(3, '0');
    this.plateId = `PACE-${seqStr}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Internship', internshipSchema);
