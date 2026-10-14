const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

async function presentCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return { items: [], grandTotal: 0 };

  const items = await CartItem.find({ cart: cart._id }).populate('product');
  const images = await ProductImage.find({
    product: { $in: items.map((item) => item.product?._id).filter(Boolean) },
    isPrimary: true,
  }).lean();
  const imageByProduct = new Map(images.map((image) => [String(image.product), image.url]));

  const shaped = items
    .filter((item) => item.product)
    .map((item) => {
      const price = item.product.price;
      return {
        id: item._id,
        productId: item.product._id,
        name: item.product.name,
        itemCode: item.product.itemCode,
        price,
        quantity: item.quantity,
        stock: item.product.stockQuantity,
        status: item.product.status,
        image: imageByProduct.get(String(item.product._id)) || '',
        subtotal: Math.round(price * item.quantity * 100) / 100,
      };
    });

  const grandTotal = Math.round(shaped.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100;
  return { items: shaped, grandTotal };
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId });
  return cart;
}

const getCart = asyncHandler(async (req, res) => {
  res.json(await presentCart(req.user._id));
});

const addItem = asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity || 1);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError('Quantity must be a whole number of at least 1.', 400);
  }

  const product = await Product.findById(req.body.productId);
  if (!product || product.status !== 'Active') throw new AppError('That product is not available.', 404);

  const cart = await getOrCreateCart(req.user._id);
  const existing = await CartItem.findOne({ cart: cart._id, product: product._id });
  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > product.stockQuantity) {
    throw new AppError(`Only ${product.stockQuantity} in stock for ${product.name}.`, 400);
  }

  if (existing) {
    existing.quantity = nextQuantity;
    await existing.save();
  } else {
    await CartItem.create({ cart: cart._id, product: product._id, quantity });
  }

  res.status(201).json(await presentCart(req.user._id));
});

const updateItem = asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError('Quantity must be a whole number of at least 1.', 400);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart ? await CartItem.findOne({ _id: req.params.id, cart: cart._id }).populate('product') : null;
  if (!item) throw new AppError('That cart item was not found.', 404);
  if (quantity > item.product.stockQuantity) {
    throw new AppError(`Only ${item.product.stockQuantity} in stock for ${item.product.name}.`, 400);
  }

  item.quantity = quantity;
  await item.save();
  res.json(await presentCart(req.user._id));
});

const removeItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new AppError('That cart item was not found.', 404);
  const deleted = await CartItem.findOneAndDelete({ _id: req.params.id, cart: cart._id });
  if (!deleted) throw new AppError('That cart item was not found.', 404);
  res.json(await presentCart(req.user._id));
});

module.exports = { getCart, addItem, updateItem, removeItem };
