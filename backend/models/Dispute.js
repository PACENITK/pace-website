const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Dispute', disputeSchema);
