const mongoose = require('mongoose');
const { ORDER_STATUSES, PAYMENT_METHODS } = require('../constants');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerEmail: { type: String, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
    shippingName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    grandTotal: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, collection: 'orders' }
);

module.exports = mongoose.model('Order', orderSchema);
