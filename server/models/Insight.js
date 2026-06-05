const mongoose = require('mongoose');

const InsightSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  region: { type: String, required: true },
  content: { type: String, required: true },
  metrics: {
    totalCheckIns: { type: Number, default: 0 },
    activeSalespeople: { type: Number, default: 0 },
    anomaliesCount: { type: Number, default: 0 }
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Insight', InsightSchema);
