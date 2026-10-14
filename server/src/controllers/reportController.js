const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function manilaParts(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date(date))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    key: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function eachDay(startKey, endKey) {
  const days = [];
  const cursor = new Date(`${startKey}T00:00:00Z`);
  const end = new Date(`${endKey}T00:00:00Z`);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    days.push(key);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

const summary = asyncHandler(async (req, res) => {
  const [salesRow] = await Order.aggregate([
    { $match: { status: 'Completed' } },
    { $group: { _id: null, totalSales: { $sum: '$grandTotal' }, completedOrders: { $sum: 1 } } },
  ]);

  const totalSales = salesRow?.totalSales || 0;
  const completedOrders = salesRow?.completedOrders || 0;
  const [orders, pendingOrders, best] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'Pending' }),
    OrderItem.aggregate([
      { $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'order' } },
      { $unwind: '$order' },
      { $match: { 'order.status': 'Completed' } },
      { $group: { _id: '$productName', quantity: { $sum: '$quantity' }, sales: { $sum: '$subtotal' } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
  ]);

  res.json({
    totalSales,
    orders,
    completedOrders,
    pendingOrders,
    averageOrderValue: completedOrders ? Math.round((totalSales / completedOrders) * 100) / 100 : 0,
    bestSellers: best.map((row) => ({ name: row._id, quantity: row.quantity, sales: row.sales })),
  });
});

const monthly = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new AppError('Choose a valid year.', 400);
  }

  const orders = await Order.find({ status: 'Completed' }).select('createdAt grandTotal').lean();
  const totals = Array(12).fill(0);
  orders.forEach((order) => {
    const parts = manilaParts(order.createdAt);
    if (parts.year === year) totals[parts.month - 1] += order.grandTotal;
  });

  res.json({
    year,
    points: MONTHS.map((label, index) => ({
      label,
      total: Math.round(totals[index] * 100) / 100,
    })),
  });
});

const range = asyncHandler(async (req, res) => {
  const start = String(req.query.start || '');
  const end = String(req.query.end || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    throw new AppError('Choose a valid start and end date.', 400);
  }
  if (start > end) throw new AppError('Start date cannot be after the end date.', 400);

  const days = eachDay(start, end);
  if (days.length > 366) throw new AppError('Choose a date range of one year or less.', 400);

  const orders = await Order.find({ status: 'Completed' }).select('createdAt grandTotal').lean();
  const buckets = new Map(days.map((day) => [day, 0]));
  orders.forEach((order) => {
    const key = manilaParts(order.createdAt).key;
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + order.grandTotal);
  });

  const points = days.map((day) => ({
    label: day,
    total: Math.round(buckets.get(day) * 100) / 100,
  }));
  const hasSales = points.some((point) => point.total > 0);

  res.json({
    points: hasSales ? points : [],
    message: hasSales ? '' : 'No sales exist for that date range.',
  });
});

module.exports = { summary, monthly, range };
