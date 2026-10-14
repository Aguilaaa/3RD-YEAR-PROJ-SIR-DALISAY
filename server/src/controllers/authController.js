const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { userFromToken } = require('../middleware/auth');
const { hasErrors, validateIdentity, validatePassword, validateProfile } = require('../utils/validators');

function tokenFrom(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function isAdminEmail(email) {
  const adminEmail = String(process.env.ADMIN_EMAIL || '').toLowerCase();
  return Boolean(adminEmail) && adminEmail === String(email || '').toLowerCase();
}

const checkRegistration = asyncHandler(async (req, res) => {
  const identity = validateIdentity(req.body);
  const passwordErrors = validatePassword(req.body.password, req.body.confirmPassword);
  const profile = validateProfile(req.body);
  const errors = { ...identity.errors, ...passwordErrors, ...profile.errors };

  if (!identity.errors.username && identity.username) {
    const taken = await User.exists({ username: identity.username.toLowerCase() });
    if (taken) errors.username = 'That username is already registered.';
  }
  if (!identity.errors.email && identity.email) {
    const taken = await User.exists({ email: identity.email });
    if (taken) errors.email = 'That email is already registered.';
  }

  if (hasErrors(errors)) throw new AppError('Check the registration form and try again.', 400, errors);
  res.json({ ok: true });
});

const register = asyncHandler(async (req, res) => {
  const token = tokenFrom(req);
  if (!token) throw new AppError('Please log in to continue.', 401);

  const { decoded, user } = await userFromToken(token);
  if (user) {
    throw new AppError('That email is already registered.', 400, { email: 'That email is already registered.' });
  }

  const email = String(decoded.email || '').toLowerCase();
  const identity = validateIdentity({ ...req.body, email });
  const profile = validateProfile(req.body);
  const errors = { ...identity.errors, ...profile.errors };
  if (identity.email && identity.email !== email) {
    errors.email = 'Use the same email address you just registered.';
  }
  if (!identity.errors.username && identity.username) {
    const taken = await User.exists({ username: identity.username.toLowerCase() });
    if (taken) errors.username = 'That username is already registered.';
  }
  if (hasErrors(errors)) throw new AppError('Check the registration form and try again.', 400, errors);

  const created = await User.create({
    firebaseUid: decoded.uid,
    authUids: [decoded.uid],
    firstName: profile.value.firstName,
    lastName: profile.value.lastName,
    username: identity.username.toLowerCase(),
    email,
    contactNumber: profile.value.contactNumber,
    address: profile.value.address,
    role: isAdminEmail(email) ? 'admin' : 'customer',
    status: 'active',
  });

  res.status(201).json({ user: created.toPublic() });
});

const googleSignIn = asyncHandler(async (req, res) => {
  const token = tokenFrom(req);
  if (!token) throw new AppError('Please log in to continue.', 401);

  const { decoded, user } = await userFromToken(token);
  if (user) {
    if (!user.authUids.includes(decoded.uid)) user.authUids.push(decoded.uid);
    if (!user.firebaseUid) user.firebaseUid = decoded.uid;
    await user.save();
    if (user.status !== 'active') throw new AppError('This account has been deactivated.', 403);
    res.json({ user: user.toPublic() });
    return;
  }

  const email = String(decoded.email || '').toLowerCase();
  if (!email) throw new AppError('Your Google account did not share an email address.', 400);

  const parts = String(decoded.name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'Rider';
  const lastName = parts.slice(1).join(' ') || 'Customer';
  let base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16);
  if (base.length < 3) base = `${base}rider`.slice(0, 20);
  let username = base;
  let suffix = 1;
  while (await User.exists({ username })) {
    username = `${base}${suffix}`.slice(0, 20);
    suffix += 1;
  }

  const created = await User.create({
    firebaseUid: decoded.uid,
    authUids: [decoded.uid],
    firstName,
    lastName,
    username,
    email,
    contactNumber: '',
    address: '',
    photoUrl: decoded.picture || '',
    role: 'customer',
    status: 'active',
  });

  res.status(201).json({ user: created.toPublic() });
});

const resolveLogin = asyncHandler(async (req, res) => {
  const identifier = String(req.body.identifier || '').trim();
  const password = String(req.body.password || '');
  if (!identifier || !password) {
    throw new AppError('Invalid username/email or password.', 401);
  }

  if (!identifier.includes('@')) {
    const user = await User.findOne({ username: identifier.toLowerCase() });
    if (!user) throw new AppError('Invalid username/email or password.', 401);
    res.json({ email: user.email });
    return;
  }

  res.json({ email: identifier.toLowerCase() });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublic() });
});

module.exports = { checkRegistration, register, googleSignIn, resolveLogin, me };
