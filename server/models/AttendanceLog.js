const mongoose = require('mongoose');

const AttendanceLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['Active', 'Break', 'Hold'], 
    required: true 
  },
  reason: { type: String, default: "" }, // Reason from dropdown if on Hold
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AttendanceLog', AttendanceLogSchema);
