const mongoose = require('mongoose');

const productCompatibilitySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'MotorcycleModel', required: true },
  },
  { collection: 'product_compatibility' }
);

productCompatibilitySchema.index({ product: 1, model: 1 }, { unique: true });

module.exports = mongoose.model('ProductCompatibility', productCompatibilitySchema);
