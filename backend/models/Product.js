const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    motorcycleBrand: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true, default: 'pc' },
    price: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'products' }
);

module.exports = mongoose.model('Product', productSchema);
