const mongoose = require('mongoose');
const { ORDER_STATUSES } = require('../constants');

const orderStatusHistorySchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    status: { type: String, enum: ORDER_STATUSES, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emailSent: { type: Boolean, default: false },
    emailError: { type: String, default: '' },
  },
  { timestamps: true, collection: 'order_status_history' }
);

module.exports = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
