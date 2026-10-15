const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'product_images' }
);

module.exports = mongoose.model('ProductImage', productImageSchema);
