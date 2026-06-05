const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  subscription: { 
    type: String, 
    enum: ['Active', 'Trial', 'Suspended'], 
    default: 'Active' 
  },
  employeeCount: { type: Number, default: 0 },
  dbHealth: { type: String, default: 'Healthy' },
  apiKey: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', CompanySchema);
