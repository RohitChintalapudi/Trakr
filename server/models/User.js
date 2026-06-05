const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Owner', 'SuperOfficial', 'Manager', 'Salesperson'], 
    required: true 
  },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  path: { type: String, required: true }, // e.g. ",OwnerID,SuperOfficialID,ManagerID,"
  region: { type: String, required: true, default: 'Global' } // Scoping region (e.g. "North Zone")
});

// Strategic index for rapid hierarchical subtree and regional lookup
UserSchema.index({ path: 1, region: 1 });

module.exports = mongoose.model('User', UserSchema);
