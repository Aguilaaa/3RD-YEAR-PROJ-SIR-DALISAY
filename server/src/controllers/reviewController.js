const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const OrderItem = require('../models/OrderItem');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { hasErrors, validateReview } = require('../utils/validators');
const { maskProfanity } = require('../utils/badWords');

async function completedOrder(userId, productId) {
  const rows = await OrderItem.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'order' } },
    { $unwind: '$order' },
    { $match: { 'order.user': new mongoose.Types.ObjectId(userId), 'order.status': 'Completed' } },
    { $limit: 1 },
  ]);
  return rows[0]?.order || null;
}

function shape(review) {
  return {
    id: review._id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    product: review.product?.name
      ? { id: review.product._id, name: review.product.name }
      : { id: review.product },
    author: review.user
      ? { id: review.user._id, username: review.user.username, name: `${review.user.firstName} ${review.user.lastName}` }
      : null,
  };
}

const createReview = asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') {
    throw new AppError('Only customers can review a product they purchased.', 403);
  }
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('That product was not found.', 404);

  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('That product was not found.', 404);

  const { errors, value } = validateReview(req.body);
  if (hasErrors(errors)) throw new AppError('Check your review and try again.', 400, errors);

  const existing = await Review.findOne({ user: req.user._id, product: product._id });
  if (existing) throw new AppError('You already reviewed this product. You can update that review.', 400);

  const order = await completedOrder(req.user._id, product._id);
  if (!order) {
    throw new AppError('You can review this product after a completed order that includes it.', 403);
  }

  const review = await Review.create({
    user: req.user._id,
    product: product._id,
    order: order._id,
    rating: value.rating,
    comment: maskProfanity(value.comment).slice(0, 500),
  });

  res.status(201).json({ review: { id: review._id, rating: review.rating, comment: review.comment } });
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('That review was not found.', 404);
  if (String(review.user) !== String(req.user._id)) {
    throw new AppError('You can only update your own review.', 403);
  }

  const { errors, value } = validateReview(req.body);
  if (hasErrors(errors)) throw new AppError('Check your review and try again.', 400, errors);

  review.rating = value.rating;
  review.comment = maskProfanity(value.comment).slice(0, 500);
  await review.save();
  res.json({ review: { id: review._id, rating: review.rating, comment: review.comment } });
});

const listAdmin = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('user', 'firstName lastName username')
    .populate('product', 'name itemCode')
    .sort({ createdAt: -1 });
  res.json({ reviews: reviews.map(shape) });
});

const removeAdmin = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new AppError('That review was not found.', 404);
  res.json({ message: 'Review deleted.' });
});

module.exports = { createReview, updateReview, listAdmin, removeAdmin };
