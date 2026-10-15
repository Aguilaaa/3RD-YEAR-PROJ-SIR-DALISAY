const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getFirebase } = require('../config/firebase');
const User = require('../models/User');

async function userFromToken(token) {
  const firebase = getFirebase();
  if (!firebase) {
    throw new AppError('Firebase Authentication is not configured on the server.', 503);
  }

  let decoded;
  try {
    decoded = await firebase.auth().verifyIdToken(token);
  } catch {
    throw new AppError('Please log in to continue.', 401);
  }

  const user = await User.findOne({
    $or: [{ firebaseUid: decoded.uid }, { authUids: decoded.uid }, { email: String(decoded.email || '').toLowerCase() }],
  });

  return { decoded, user };
}

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new AppError('Please log in to continue.', 401);

  const { decoded, user } = await userFromToken(token);
  if (!user) throw new AppError('Finish creating your MotoTech profile.', 401, null, 'PROFILE_REQUIRED');
  if (user.deletedAt || user.status !== 'active') throw new AppError('This account has been deactivated.', 403);

  if (!user.authUids.includes(decoded.uid)) {
    user.authUids.push(decoded.uid);
    if (!user.firebaseUid) user.firebaseUid = decoded.uid;
    await user.save();
  }

  req.user = user;
  req.firebase = decoded;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    next();
    return;
  }

  try {
    const { user } = await userFromToken(token);
    if (user && user.status === 'active') req.user = user;
  } catch {
    req.user = null;
  }
  next();
});

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    next(new AppError('Access Denied', 403));
    return;
  }
  next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin, userFromToken };
