const mongoose = require('mongoose');

const CheckInSchema = new mongoose.Schema({
  salespersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  region: { type: String, required: true }, // Inherited from salesperson
  shopName: { type: String, required: true },
  summary: { type: String, required: true },
  imageUrl: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  location: {
    type: { 
      type: String, 
      enum: ['Point'], 
      default: 'Point', 
      required: true 
    },
    coordinates: { 
      type: [Number], 
      required: true 
    } // [longitude, latitude]
  },
  // Refined for Anomaly Alerts
  isAnomaly: { type: Boolean, default: false },
  distance: { type: Number, default: 0 }, // distance in meters from shop target
  anomalyStatus: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }
});

CheckInSchema.index({ location: '2dsphere', region: 1 });

module.exports = mongoose.model('CheckIn', CheckInSchema);
