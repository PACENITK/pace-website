const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'professor', 'student'],
    required: true,
  },
  studentType: {
    type: String,
    enum: ['nitk', 'external', null],
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  rollNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  irisVerified: {
    type: Boolean,
    default: false,
  },
  passwordHash: {
    type: String,
    default: null,
  },
  profile: {
    college: { type: String, default: '' },
    branch: { type: String, default: '' },
    year: { type: Number, default: null },
    cgpa: { type: Number, default: null },
    cgpaSource: {
      type: String,
      enum: ['self_reported', 'iris_verified', null],
      default: null,
    },
    skills: [{ type: String }],
    resumeUrl: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  verified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  verificationToken: {
    type: String,
    default: null,
  },
  deletionRequested: {
    type: Boolean,
    default: false,
  },
  proofOfStatus: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return next();
  }
  if (!this.passwordHash.startsWith('$2a$') && !this.passwordHash.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
