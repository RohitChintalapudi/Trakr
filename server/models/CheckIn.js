const mongoose = require('mongoose');

const CheckInSchema = new mongoose.Schema({
  salespersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  region: { type: String, required: true },
  shopName: { type: String, required: true },
  // 'summary' is the canonical field; 'notes' is an alias stored here too for Flutter compatibility
  summary: { type: String, required: true },
  // Extended fields from Flutter mobile app
  contactName: { type: String, default: '' },
  outcome: { type: String, default: 'Interested' },
  products: { type: [String], default: [] },
  address: { type: String, default: '' },
  // Image storage: URL string OR base64 encoded image from mobile
  imageUrl: { type: String, default: '' },
  imageBase64: { type: String, default: '' }, // base64-encoded geotagged photo from mobile
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
  isAnomaly: { type: Boolean, default: false },
  distance: { type: Number, default: 0 },
  anomalyStatus: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }
});

CheckInSchema.index({ location: '2dsphere', region: 1 });

module.exports = mongoose.model('CheckIn', CheckInSchema);
