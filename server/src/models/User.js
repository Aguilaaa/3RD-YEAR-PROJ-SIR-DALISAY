const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, default: '', index: true },
    authUids: [{ type: String, index: true }],
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    contactNumber: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    photoUrl: { type: String, default: '' },
    photoPublicId: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true, collection: 'users' }
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    username: this.username,
    email: this.email,
    contactNumber: this.contactNumber,
    address: this.address,
    photoUrl: this.photoUrl,
    role: this.role,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
