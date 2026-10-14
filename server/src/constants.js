const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Ready to Ship',
  'Shipped',
  'Completed',
  'Cancelled',
];

const PAYMENT_METHODS = ['Cash on Delivery', 'Manual Payment'];

const CATEGORY_NAMES = [
  'Exhaust',
  'Braking',
  'Suspension',
  'Electrical',
  'Engine',
  'Body/Protection',
  'Lighting',
  'Accessories',
  'Riding Gear',
];

const PRICE_FILTERS = {
  'under-500': { $lt: 500 },
  '500-1000': { $gte: 500, $lte: 1000 },
  '1000-5000': { $gt: 1000, $lte: 5000 },
  'above-5000': { $gt: 5000 },
};

module.exports = { ORDER_STATUSES, PAYMENT_METHODS, CATEGORY_NAMES, PRICE_FILTERS };
