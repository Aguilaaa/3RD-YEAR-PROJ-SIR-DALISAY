const mongoose = require('mongoose');

const motorcycleModelSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { collection: 'motorcycle_models' }
);

motorcycleModelSchema.index({ brand: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('MotorcycleModel', motorcycleModelSchema);
