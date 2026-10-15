const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderStatusHistory = require('../models/OrderStatusHistory');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { hasErrors, validateCheckout, validateStatus } = require('../utils/validators');
const { withOptionalTransaction, bind } = require('../utils/transaction');
const { sendOrderPlacedEmail, sendOrderStatusEmail } = require('../utils/email');

function makeOrderNumber() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MT-${date}-${suffix}`;
}

async function presentOrder(orderId) {
  const order = await Order.findById(orderId).populate('user', 'firstName lastName username email').lean();
  if (!order) return null;
  const [items, history] = await Promise.all([
    OrderItem.find({ order: order._id }).lean(),
    OrderStatusHistory.find({ order: order._id }).sort({ createdAt: 1 }).lean(),
  ]);

  return {
    id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    shippingName: order.shippingName,
    contactNumber: order.contactNumber,
    address: order.address,
    customerEmail: order.customerEmail,
    paymentMethod: order.paymentMethod,
    grandTotal: order.grandTotal,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: order.user
      ? { id: order.user._id, name: `${order.user.firstName} ${order.user.lastName}`, username: order.user.username }
      : null,
    items: items.map((item) => ({
      id: item._id,
      productId: item.product,
      productName: item.productName,
      itemCode: item.itemCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
    history: history.map((entry) => ({
      id: entry._id,
      status: entry.status,
      emailSent: entry.emailSent,
      emailError: entry.emailError,
      createdAt: entry.createdAt,
    })),
  };
}

function createOptions(session) {
  return session ? { session } : undefined;
}

const checkout = asyncHandler(async (req, res) => {
  const { errors, value } = validateCheckout(req.body);
  if (hasErrors(errors)) throw new AppError('Check the checkout form and try again.', 400, errors);

  const order = await withOptionalTransaction(async (session) => {
    const cart = await bind(Cart.findOne({ user: req.user._id }), session);
    if (!cart) throw new AppError('Your cart is empty.', 400);

    const items = await bind(CartItem.find({ cart: cart._id }).populate('product'), session);
    if (!items.length) throw new AppError('Your cart is empty.', 400);

    const lines = [];
    for (const item of items) {
      const product = item.product;
      if (!product || product.status !== 'Active' || product.deletedAt) {
        throw new AppError('A product in your cart is no longer available.', 400);
      }

      const updated = await Product.findOneAndUpdate(
        { _id: product._id, status: 'Active', $nor: [{ deletedAt: { $type: 'date' } }], stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity } },
        { new: true, ...(session ? { session } : {}) }
      );
      if (!updated) throw new AppError(`${product.name} does not have enough stock.`, 400);

      lines.push({
        product: product._id,
        productName: product.name,
        itemCode: product.itemCode,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: Math.round(product.price * item.quantity * 100) / 100,
      });
    }

    let orderNumber = makeOrderNumber();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const exists = await bind(Order.exists({ orderNumber }), session);
      if (!exists) break;
      orderNumber = makeOrderNumber();
    }

    const grandTotal = Math.round(lines.reduce((sum, line) => sum + line.subtotal, 0) * 100) / 100;
    const [created] = await Order.create(
      [
        {
          orderNumber,
          user: req.user._id,
          customerEmail: req.user.email,
          status: 'Pending',
          grandTotal,
          ...value,
        },
      ],
      createOptions(session)
    );

    await OrderItem.insertMany(
      lines.map((line) => ({ ...line, order: created._id })),
      createOptions(session)
    );
    await OrderStatusHistory.create(
      [
        {
          order: created._id,
          status: 'Pending',
          updatedBy: req.user._id,
          emailSent: false,
          emailError: '',
        },
      ],
      createOptions(session)
    );
    await CartItem.deleteMany({ cart: cart._id }, createOptions(session));
    return created;
  });

  const items = await OrderItem.find({ order: order._id }).lean();
  const email = await sendOrderPlacedEmail(order.toObject(), items);
  await OrderStatusHistory.updateOne(
    { order: order._id, status: 'Pending' },
    { emailSent: email.sent, emailError: email.error || '' }
  );

  res.status(201).json({
    order: await presentOrder(order._id),
    emailSent: email.sent,
    message: email.sent
      ? 'Order placed. A receipt was emailed with a PDF attached.'
      : 'Order placed. The receipt email could not be sent.',
  });
});

const listMine = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({
    orders: orders.map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      grandTotal: order.grandTotal,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    })),
  });
});

const getMine = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || String(order.user) !== String(req.user._id)) {
    throw new AppError('That order was not found.', 404);
  }
  res.json({ order: await presentOrder(order._id) });
});

const listAll = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter).sort({ createdAt: -1 }).populate('user', 'firstName lastName username').lean();
  res.json({
    orders: orders.map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      grandTotal: order.grandTotal,
      paymentMethod: order.paymentMethod,
      shippingName: order.shippingName,
      customerEmail: order.customerEmail,
      createdAt: order.createdAt,
      customerName: order.user ? `${order.user.firstName} ${order.user.lastName}` : order.shippingName,
    })),
  });
});

const getOneAdmin = asyncHandler(async (req, res) => {
  const order = await presentOrder(req.params.id);
  if (!order) throw new AppError('That order was not found.', 404);
  res.json({ order });
});

async function restoreStock(orderId) {
  const items = await OrderItem.find({ order: orderId });
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stockQuantity: item.quantity } });
  }
}

async function deductStock(orderId) {
  const items = await OrderItem.find({ order: orderId }).populate('product');
  for (const item of items) {
    if (!item.product || item.product.stockQuantity < item.quantity) {
      throw new AppError('Not enough stock to move this order out of Cancelled.', 400);
    }
  }
  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product._id, stockQuantity: { $gte: item.quantity } },
      { $inc: { stockQuantity: -item.quantity } }
    );
    if (!updated) throw new AppError('Not enough stock to move this order out of Cancelled.', 400);
  }
}

const updateStatus = asyncHandler(async (req, res) => {
  const statusError = validateStatus(req.body.status);
  if (statusError) throw new AppError(statusError, 400);

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('That order was not found.', 404);
  if (order.status === req.body.status) {
    throw new AppError('That order is already in this status.', 400);
  }

  const previous = order.status;
  const next = req.body.status;
  if (next === 'Cancelled' && previous !== 'Cancelled') await restoreStock(order._id);
  if (previous === 'Cancelled' && next !== 'Cancelled') await deductStock(order._id);

  order.status = next;
  await order.save();

  const items = await OrderItem.find({ order: order._id }).lean();
  const email = await sendOrderStatusEmail(order.toObject(), items);
  await OrderStatusHistory.create({
    order: order._id,
    status: next,
    updatedBy: req.user._id,
    emailSent: email.sent,
    emailError: email.error || '',
  });

  res.json({
    order: await presentOrder(order._id),
    emailSent: email.sent,
    message: email.sent
      ? 'Order status updated and the customer was emailed with a PDF receipt.'
      : 'Order status updated. The email could not be sent, and the failure was logged.',
  });
});

module.exports = { checkout, listMine, getMine, listAll, getOneAdmin, updateStatus };
