const express = require('express');
const { requireAuth, optionalAuth, requireAdmin } = require('../middlewares/auth');
const { productPhotos, singleProductPhoto, profilePhoto } = require('../middlewares/upload');
const auth = require('../controllers/authController');
const products = require('../controllers/productController');
const users = require('../controllers/userController');
const cart = require('../controllers/cartController');
const orders = require('../controllers/orderController');
const reviews = require('../controllers/reviewController');
const reports = require('../controllers/reportController');

const router = express.Router();

router.post('/auth/check', auth.checkRegistration);
router.post('/auth/register', auth.register);
router.post('/auth/google', auth.googleSignIn);
router.post('/auth/resolve-login', auth.resolveLogin);
router.get('/auth/me', requireAuth, auth.me);

router.get('/categories', products.listCategories);
router.get('/models', products.listModels);

router.get('/products', products.listPublic);
router.get('/products/manage/all', requireAuth, requireAdmin, products.listAdmin);
router.get('/products/manage/next-code', requireAuth, requireAdmin, products.previewItemCode);
router.post('/products/bulk-delete', requireAuth, requireAdmin, products.bulkDelete);
router.get('/products/:id', optionalAuth, products.getOne);
router.post('/products', requireAuth, requireAdmin, productPhotos, products.create);
router.put('/products/:id', requireAuth, requireAdmin, productPhotos, products.update);
router.delete('/products/:id', requireAuth, requireAdmin, products.remove);
router.patch('/products/:id/restore', requireAuth, requireAdmin, products.restore);
router.put('/products/:id/images/:imageId', requireAuth, requireAdmin, singleProductPhoto, products.replaceImage);
router.delete('/products/:id/images/:imageId', requireAuth, requireAdmin, products.deleteImage);
router.patch('/products/:id/images/:imageId/primary', requireAuth, requireAdmin, products.setPrimary);
router.post('/products/:id/reviews', requireAuth, reviews.createReview);

router.put('/reviews/:id', requireAuth, reviews.updateReview);

router.put('/users/me', requireAuth, profilePhoto, users.updateProfile);

router.get('/cart', requireAuth, cart.getCart);
router.post('/cart/items', requireAuth, cart.addItem);
router.patch('/cart/items/:id', requireAuth, cart.updateItem);
router.delete('/cart/items/:id', requireAuth, cart.removeItem);

router.post('/orders/checkout', requireAuth, orders.checkout);
router.get('/orders/mine', requireAuth, orders.listMine);
router.get('/orders/:id', requireAuth, orders.getMine);

router.get('/admin/users', requireAuth, requireAdmin, users.listUsers);
router.post('/admin/users', requireAuth, requireAdmin, users.createUser);
router.put('/admin/users/:id', requireAuth, requireAdmin, users.updateUser);
router.patch('/admin/users/:id/status', requireAuth, requireAdmin, users.updateStatus);
router.patch('/admin/users/:id/restore', requireAuth, requireAdmin, users.restoreUser);
router.delete('/admin/users/:id', requireAuth, requireAdmin, users.removeUser);
router.get('/admin/reviews', requireAuth, requireAdmin, reviews.listAdmin);
router.delete('/admin/reviews/:id', requireAuth, requireAdmin, reviews.removeAdmin);
router.get('/admin/orders', requireAuth, requireAdmin, orders.listAll);
router.get('/admin/orders/:id', requireAuth, requireAdmin, orders.getOneAdmin);
router.patch('/admin/orders/:id/status', requireAuth, requireAdmin, orders.updateStatus);
router.get('/admin/reports/summary', requireAuth, requireAdmin, reports.summary);
router.get('/admin/reports/monthly', requireAuth, requireAdmin, reports.monthly);
router.get('/admin/reports/range', requireAuth, requireAdmin, reports.range);

module.exports = router;
