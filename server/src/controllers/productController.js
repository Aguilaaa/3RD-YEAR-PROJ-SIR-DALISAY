const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const ProductCompatibility = require('../models/ProductCompatibility');
const Category = require('../models/Category');
const MotorcycleModel = require('../models/MotorcycleModel');
const OrderItem = require('../models/OrderItem');
const CartItem = require('../models/CartItem');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { hasErrors, validateProduct } = require('../utils/validators');
const { uploadBuffer, destroyImage } = require('../config/cloudinary');
const { PRICE_FILTERS } = require('../constants');

const MAX_IMAGES = 8;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function publicAuthor(user) {
  if (!user) return 'Rider';
  const last = user.lastName ? `${user.lastName.charAt(0)}.` : '';
  return `${user.firstName} ${last}`.trim();
}

async function uploadProductFiles(files) {
  const stored = [];
  try {
    for (const file of files || []) {
      const result = await uploadBuffer(file.buffer, 'mototech/products');
      stored.push({ url: result.secure_url, publicId: result.public_id });
    }
    return stored;
  } catch (error) {
    await Promise.all(stored.map((image) => destroyImage(image.publicId)));
    if (error.status === 503 || /not configured/i.test(error.message || '')) {
      throw new AppError('Add Cloudinary keys before uploading photos.', 503);
    }
    throw new AppError('Photo upload failed. Check the file and try again.', 502);
  }
}

async function assertCatalog(value, productId) {
  const category = await Category.findById(value.category);
  if (!category) {
    throw new AppError('Choose a valid category.', 400, { category: 'Choose a valid category.' });
  }

  const models = await MotorcycleModel.find({ _id: { $in: value.modelIds } });
  if (models.length !== value.modelIds.length) {
    throw new AppError('Choose valid motorcycle models.', 400, { modelIds: 'Choose valid motorcycle models.' });
  }

  const duplicate = await Product.findOne({
    itemCode: value.itemCode.toUpperCase(),
    ...(productId ? { _id: { $ne: productId } } : {}),
  });
  if (duplicate) {
    throw new AppError('That item code is already used.', 400, { itemCode: 'That item code is already used.' });
  }

  return { category, models };
}

async function shapeAdminProduct(product) {
  const [images, links] = await Promise.all([
    ProductImage.find({ product: product._id }).sort({ isPrimary: -1, createdAt: 1 }).lean(),
    ProductCompatibility.find({ product: product._id }).populate('model').lean(),
  ]);

  return {
    id: product._id,
    itemCode: product.itemCode,
    name: product.name,
    category: product.category
      ? { id: product.category._id || product.category, name: product.category.name || '' }
      : null,
    motorcycleBrand: product.motorcycleBrand,
    unit: product.unit,
    price: product.price,
    stockQuantity: product.stockQuantity,
    description: product.description,
    status: product.status,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    images: images.map((image) => ({
      id: image._id,
      url: image.url,
      isPrimary: image.isPrimary,
    })),
    modelIds: links.map((link) => link.model?._id).filter(Boolean),
    models: links
      .filter((link) => link.model)
      .map((link) => ({ id: link.model._id, brand: link.model.brand, name: link.model.name })),
  };
}

async function replaceCompatibility(productId, modelIds) {
  await ProductCompatibility.deleteMany({ product: productId });
  if (modelIds.length) {
    await ProductCompatibility.insertMany(modelIds.map((model) => ({ product: productId, model })));
  }
}

const listPublic = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 24);
  const search = String(req.query.search || '').trim().slice(0, 80);
  const match = { status: 'Active' };

  if (req.query.category) {
    if (!mongoose.isValidObjectId(req.query.category)) {
      res.json({ products: [], page, limit, total: 0, pages: 1 });
      return;
    }
    match.category = new mongoose.Types.ObjectId(req.query.category);
  }

  if (req.query.price && PRICE_FILTERS[req.query.price]) {
    match.price = PRICE_FILTERS[req.query.price];
  }

  const pipeline = [
    { $match: match },
    { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryDocs' } },
    { $unwind: { path: '$categoryDocs', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'product_images', localField: '_id', foreignField: 'product', as: 'images' } },
    { $lookup: { from: 'product_compatibility', localField: '_id', foreignField: 'product', as: 'compatibility' } },
    {
      $lookup: {
        from: 'motorcycle_models',
        localField: 'compatibility.model',
        foreignField: '_id',
        as: 'models',
      },
    },
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'product', as: 'reviewDocs' } },
    {
      $addFields: {
        ratingCount: { $size: '$reviewDocs' },
        averageRating: {
          $cond: [
            { $gt: [{ $size: '$reviewDocs' }, 0] },
            { $round: [{ $avg: '$reviewDocs.rating' }, 1] },
            0,
          ],
        },
        imageUrl: {
          $let: {
            vars: {
              primary: {
                $first: {
                  $filter: { input: '$images', as: 'img', cond: { $eq: ['$$img.isPrimary', true] } },
                },
              },
            },
            in: { $ifNull: ['$$primary.url', { $ifNull: [{ $arrayElemAt: ['$images.url', 0] }, ''] }] },
          },
        },
      },
    },
  ];

  if (search) {
    const pattern = escapeRegex(search);
    pipeline.push({
      $match: {
        $or: [
          { name: { $regex: pattern, $options: 'i' } },
          { itemCode: { $regex: pattern, $options: 'i' } },
          { 'models.name': { $regex: pattern, $options: 'i' } },
          { 'models.brand': { $regex: pattern, $options: 'i' } },
        ],
      },
    });
  }

  if (req.query.model && mongoose.isValidObjectId(req.query.model)) {
    pipeline.push({ $match: { 'models._id': new mongoose.Types.ObjectId(req.query.model) } });
  }

  if (req.query.rating === '5') pipeline.push({ $match: { averageRating: 5 } });
  else if (req.query.rating === '4') pipeline.push({ $match: { averageRating: { $gte: 4 } } });
  else if (req.query.rating === '3') pipeline.push({ $match: { averageRating: { $gte: 3 } } });

  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({
    $facet: {
      items: [
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $project: {
            name: 1,
            itemCode: 1,
            price: 1,
            stockQuantity: 1,
            motorcycleBrand: 1,
            unit: 1,
            averageRating: 1,
            ratingCount: 1,
            imageUrl: 1,
            categoryName: '$categoryDocs.name',
            models: {
              $map: {
                input: '$models',
                as: 'model',
                in: { brand: '$$model.brand', name: '$$model.name' },
              },
            },
          },
        },
      ],
      total: [{ $count: 'count' }],
    },
  });

  const [result] = await Product.aggregate(pipeline);
  const total = result?.total?.[0]?.count || 0;
  res.json({
    products: (result?.items || []).map((item) => ({ ...item, id: item._id })),
    page,
    limit,
    total,
    pages: Math.max(Math.ceil(total / limit), 1),
  });
});

const listAdmin = asyncHandler(async (req, res) => {
  const products = await Product.find().populate('category').sort({ createdAt: -1 });
  const shaped = [];
  for (const product of products) {
    shaped.push(await shapeAdminProduct(product));
  }
  res.json({ products: shaped });
});

const getOne = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new AppError('That product was not found.', 404);
  }

  const product = await Product.findById(req.params.id).populate('category');
  const isAdmin = req.user?.role === 'admin';
  if (!product || (product.status !== 'Active' && !isAdmin)) {
    throw new AppError('That product was not found.', 404);
  }

  const [images, links, reviews] = await Promise.all([
    ProductImage.find({ product: product._id }).sort({ isPrimary: -1, createdAt: 1 }).lean(),
    ProductCompatibility.find({ product: product._id }).populate('model').lean(),
    Review.find({ product: product._id }).populate('user', 'firstName lastName').sort({ createdAt: -1 }),
  ]);

  const ratingCount = reviews.length;
  const averageRating = ratingCount
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount) * 10) / 10
    : 0;

  let canReview = false;
  let myReview = null;
  if (req.user && req.user.role === 'customer') {
    myReview = reviews.find((review) => String(review.user?._id || review.user) === String(req.user._id)) || null;
    if (!myReview) {
      const purchased = await OrderItem.aggregate([
        { $match: { product: product._id } },
        { $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'order' } },
        { $unwind: '$order' },
        { $match: { 'order.user': req.user._id, 'order.status': 'Completed' } },
        { $limit: 1 },
      ]);
      canReview = purchased.length > 0;
    }
  }

  res.json({
    product: {
      id: product._id,
      itemCode: product.itemCode,
      name: product.name,
      category: product.category ? { id: product.category._id, name: product.category.name } : null,
      motorcycleBrand: product.motorcycleBrand,
      unit: product.unit,
      price: product.price,
      stockQuantity: product.stockQuantity,
      description: product.description,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      images: images.map((image) => ({ id: image._id, url: image.url, isPrimary: image.isPrimary })),
      models: links.filter((link) => link.model).map((link) => ({
        id: link.model._id,
        brand: link.model.brand,
        name: link.model.name,
      })),
      averageRating,
      ratingCount,
    },
    canReview,
    myReview: myReview
      ? { id: myReview._id, rating: myReview.rating, comment: myReview.comment }
      : null,
    reviews: reviews.map((review) => ({
      id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      verifiedPurchase: true,
      author: publicAuthor(review.user),
      mine: req.user ? String(review.user?._id || review.user) === String(req.user._id) : false,
    })),
  });
});

const create = asyncHandler(async (req, res) => {
  const { errors, value } = validateProduct(req.body);
  if (hasErrors(errors)) throw new AppError('Check the product form and try again.', 400, errors);
  if ((req.files || []).length > MAX_IMAGES) {
    throw new AppError('A product can have at most 8 photos.', 400);
  }

  await assertCatalog(value);
  const uploaded = await uploadProductFiles(req.files);
  const { modelIds, ...fields } = value;
  const product = await Product.create(fields);
  try {
    if (uploaded.length) {
      await ProductImage.insertMany(
        uploaded.map((image, index) => ({
          product: product._id,
          url: image.url,
          publicId: image.publicId,
          isPrimary: index === 0,
        }))
      );
    }
    await replaceCompatibility(product._id, modelIds);
  } catch (error) {
    await Promise.all(uploaded.map((image) => destroyImage(image.publicId)));
    await ProductImage.deleteMany({ product: product._id });
    await ProductCompatibility.deleteMany({ product: product._id });
    await product.deleteOne();
    throw error;
  }

  const saved = await Product.findById(product._id).populate('category');
  res.status(201).json({ product: await shapeAdminProduct(saved) });
});

const update = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('That product was not found.', 404);

  const { errors, value } = validateProduct(req.body);
  if (hasErrors(errors)) throw new AppError('Check the product form and try again.', 400, errors);
  await assertCatalog(value, product._id);

  const existingCount = await ProductImage.countDocuments({ product: product._id });
  if (existingCount + (req.files || []).length > MAX_IMAGES) {
    throw new AppError('A product can have at most 8 photos.', 400);
  }

  const uploaded = await uploadProductFiles(req.files);
  const { modelIds, ...fields } = value;
  Object.assign(product, fields);
  await product.save();
  await replaceCompatibility(product._id, modelIds);

  if (uploaded.length) {
    const hasPrimary = await ProductImage.exists({ product: product._id, isPrimary: true });
    await ProductImage.insertMany(
      uploaded.map((image, index) => ({
        product: product._id,
        url: image.url,
        publicId: image.publicId,
        isPrimary: !hasPrimary && index === 0,
      }))
    );
  }

  const saved = await Product.findById(product._id).populate('category');
  res.json({ product: await shapeAdminProduct(saved) });
});

async function deleteOrArchive(productId) {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('That product was not found.', 404);

  const ordered = await OrderItem.exists({ product: product._id });
  if (ordered) {
    product.status = 'Inactive';
    await product.save();
    return { id: product.id, archived: true, name: product.name };
  }

  const images = await ProductImage.find({ product: product._id });
  await Promise.all(images.map((image) => destroyImage(image.publicId)));
  await ProductImage.deleteMany({ product: product._id });
  await ProductCompatibility.deleteMany({ product: product._id });
  await CartItem.deleteMany({ product: product._id });
  await product.deleteOne();
  return { id: product.id, archived: false, name: product.name };
}

const remove = asyncHandler(async (req, res) => {
  const result = await deleteOrArchive(req.params.id);
  res.json({
    ...result,
    message: result.archived
      ? `${result.name} is on an existing order, so it was archived and set to Inactive.`
      : `${result.name} was deleted.`,
  });
});

const bulkDelete = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(Boolean) : [];
  if (!ids.length) throw new AppError('Select at least one product to delete.', 400);

  const results = [];
  for (const id of ids) {
    results.push(await deleteOrArchive(id));
  }

  const archived = results.filter((item) => item.archived).length;
  const deleted = results.length - archived;
  res.json({
    results,
    deleted,
    archived,
    message: `${deleted} deleted. ${archived} archived because they are already on orders.`,
  });
});

async function findOwnedImage(productId, imageId) {
  const image = await ProductImage.findOne({ _id: imageId, product: productId });
  if (!image) throw new AppError('That photo was not found.', 404);
  return image;
}

const addImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('That product was not found.', 404);
  if (!req.files?.length) throw new AppError('Choose at least one photo.', 400);

  const existingCount = await ProductImage.countDocuments({ product: product._id });
  if (existingCount + req.files.length > MAX_IMAGES) {
    throw new AppError('A product can have at most 8 photos.', 400);
  }

  const uploaded = await uploadProductFiles(req.files);
  const hasPrimary = await ProductImage.exists({ product: product._id, isPrimary: true });
  await ProductImage.insertMany(
    uploaded.map((image, index) => ({
      product: product._id,
      url: image.url,
      publicId: image.publicId,
      isPrimary: !hasPrimary && index === 0,
    }))
  );

  const saved = await Product.findById(product._id).populate('category');
  res.json({ product: await shapeAdminProduct(saved) });
});

const replaceImage = asyncHandler(async (req, res) => {
  const image = await findOwnedImage(req.params.id, req.params.imageId);
  if (!req.file) throw new AppError('Choose a replacement photo.', 400);

  const [uploaded] = await uploadProductFiles([req.file]);
  await destroyImage(image.publicId);
  image.url = uploaded.url;
  image.publicId = uploaded.publicId;
  await image.save();

  const saved = await Product.findById(req.params.id).populate('category');
  res.json({ product: await shapeAdminProduct(saved) });
});

const deleteImage = asyncHandler(async (req, res) => {
  const image = await findOwnedImage(req.params.id, req.params.imageId);
  const wasPrimary = image.isPrimary;
  await destroyImage(image.publicId);
  await image.deleteOne();

  if (wasPrimary) {
    const next = await ProductImage.findOne({ product: req.params.id }).sort({ createdAt: 1 });
    if (next) {
      next.isPrimary = true;
      await next.save();
    }
  }

  const saved = await Product.findById(req.params.id).populate('category');
  res.json({ product: await shapeAdminProduct(saved) });
});

const setPrimary = asyncHandler(async (req, res) => {
  const image = await findOwnedImage(req.params.id, req.params.imageId);
  await ProductImage.updateMany({ product: req.params.id }, { isPrimary: false });
  image.isPrimary = true;
  await image.save();

  const saved = await Product.findById(req.params.id).populate('category');
  res.json({ product: await shapeAdminProduct(saved) });
});

const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  res.json({ categories: categories.map((category) => ({ id: category._id, name: category.name, slug: category.slug })) });
});

const listModels = asyncHandler(async (req, res) => {
  const models = await MotorcycleModel.find().sort({ brand: 1, name: 1 }).lean();
  res.json({
    models: models.map((model) => ({ id: model._id, brand: model.brand, name: model.name })),
  });
});

module.exports = {
  listPublic,
  listAdmin,
  getOne,
  create,
  update,
  remove,
  bulkDelete,
  addImages,
  replaceImage,
  deleteImage,
  setPrimary,
  listCategories,
  listModels,
};
