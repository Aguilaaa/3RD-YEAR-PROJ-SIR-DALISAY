const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { hasErrors, validateProfile, validateAdminUser } = require('../utils/validators');
const { uploadBuffer, destroyImage } = require('../config/cloudinary');
const { getFirebase } = require('../config/firebase');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const updateProfile = asyncHandler(async (req, res) => {
  const { errors, value } = validateProfile(req.body, { usernameRequired: true });
  if (hasErrors(errors)) throw new AppError('Check your profile and try again.', 400, errors);

  const taken = await User.findOne({ username: value.username, _id: { $ne: req.user._id } });
  if (taken) {
    throw new AppError('That username is already registered.', 400, {
      username: 'That username is already registered.',
    });
  }

  if (req.file) {
    let uploaded;
    try {
      const result = await uploadBuffer(req.file.buffer, 'mototech/profiles');
      uploaded = { url: result.secure_url, publicId: result.public_id };
    } catch (error) {
      if (error.status === 503 || /not configured/i.test(error.message || '')) {
        throw new AppError('Add Cloudinary keys before uploading a profile photo.', 503);
      }
      throw new AppError('Profile photo upload failed. Check the file and try again.', 502);
    }

    if (req.user.photoPublicId) await destroyImage(req.user.photoPublicId);
    req.user.photoUrl = uploaded.url;
    req.user.photoPublicId = uploaded.publicId;
  }

  req.user.firstName = value.firstName;
  req.user.lastName = value.lastName;
  req.user.username = value.username;
  req.user.contactNumber = value.contactNumber;
  req.user.address = value.address;
  await req.user.save();
  res.json({ user: req.user.toPublic() });
});

const listUsers = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim().slice(0, 80);
  const filter = {};
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ username: pattern }, { email: pattern }, { firstName: pattern }, { lastName: pattern }];
  }

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ users: users.map((user) => user.toPublic()) });
});

async function setFirebaseDisabled(user, disabled) {
  const firebase = getFirebase();
  const uid = user.firebaseUid || user.authUids?.[0];
  if (!firebase || !uid) return;
  try {
    await firebase.auth().updateUser(uid, { disabled });
  } catch {
    // Profile change still stands if the Firebase account is missing.
  }
}

const updateStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.deletedAt) throw new AppError('That user was not found.', 404);
  if (String(user._id) === String(req.user._id)) {
    throw new AppError('You cannot change your own account status.', 400);
  }
  if (!['active', 'inactive'].includes(req.body.status)) {
    throw new AppError('Status must be active or inactive.', 400);
  }

  user.status = req.body.status;
  await user.save();
  await setFirebaseDisabled(user, user.status !== 'active');
  res.json({ user: user.toPublic(), message: `${user.username} is now ${user.status}.` });
});

const createUser = asyncHandler(async (req, res) => {
  const { errors, value } = validateAdminUser(req.body, { requirePassword: true });
  if (hasErrors(errors)) throw new AppError('Check the user form and try again.', 400, errors);

  const takenUsername = await User.exists({ username: value.username });
  if (takenUsername) {
    throw new AppError('That username is already registered.', 400, { username: 'That username is already registered.' });
  }
  const takenEmail = await User.exists({ email: value.email });
  if (takenEmail) {
    throw new AppError('That email is already registered.', 400, { email: 'That email is already registered.' });
  }

  const firebase = getFirebase();
  if (!firebase) throw new AppError('Firebase Authentication is not configured on the server.', 503);

  let record;
  try {
    record = await firebase.auth().createUser({
      email: value.email,
      password: value.password,
      displayName: `${value.firstName} ${value.lastName}`,
      disabled: value.status !== 'active',
    });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      throw new AppError('That email is already registered.', 400, { email: 'That email is already registered.' });
    }
    throw new AppError(error.message || 'The account could not be created in Firebase.', 400);
  }

  try {
    const created = await User.create({
      firebaseUid: record.uid,
      authUids: [record.uid],
      firstName: value.firstName,
      lastName: value.lastName,
      username: value.username,
      email: value.email,
      contactNumber: value.contactNumber,
      address: value.address,
      role: value.role,
      status: value.status,
    });
    res.status(201).json({ user: created.toPublic(), message: `${created.username} was created.` });
  } catch (error) {
    await firebase.auth().deleteUser(record.uid).catch(() => {});
    throw error;
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.deletedAt) throw new AppError('That user was not found.', 404);

  const { errors, value } = validateAdminUser({ ...req.body, email: user.email }, { requirePassword: false });
  if (hasErrors(errors)) throw new AppError('Check the user form and try again.', 400, errors);

  const takenUsername = await User.findOne({ username: value.username, _id: { $ne: user._id } });
  if (takenUsername) {
    throw new AppError('That username is already registered.', 400, { username: 'That username is already registered.' });
  }

  if (String(user._id) === String(req.user._id) && value.role !== user.role) {
    throw new AppError('You cannot change your own role.', 400);
  }

  user.firstName = value.firstName;
  user.lastName = value.lastName;
  user.username = value.username;
  user.contactNumber = value.contactNumber;
  user.address = value.address;
  user.role = value.role;
  if (String(user._id) !== String(req.user._id)) {
    user.status = value.status;
    await setFirebaseDisabled(user, user.status !== 'active');
  }
  await user.save();

  if (value.password) {
    const firebase = getFirebase();
    const uid = user.firebaseUid || user.authUids?.[0];
    if (firebase && uid) {
      await firebase.auth().updateUser(uid, { password: value.password });
    }
  }

  res.json({ user: user.toPublic(), message: `${user.username} was updated.` });
});

const removeUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.deletedAt) throw new AppError('That user was not found.', 404);
  if (String(user._id) === String(req.user._id)) {
    throw new AppError('You cannot delete your own account.', 400);
  }

  user.deletedAt = new Date();
  user.status = 'inactive';
  await user.save();
  await setFirebaseDisabled(user, true);
  res.json({ user: user.toPublic(), message: `${user.username} was deleted. Restore them from the user list if needed.` });
});

const restoreUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('That user was not found.', 404);
  if (!user.deletedAt) throw new AppError(`${user.username} is not deleted.`, 400);

  user.deletedAt = null;
  user.status = 'active';
  await user.save();
  await setFirebaseDisabled(user, false);
  res.json({ user: user.toPublic(), message: `${user.username} was restored.` });
});

module.exports = { updateProfile, listUsers, updateStatus, createUser, updateUser, removeUser, restoreUser };
