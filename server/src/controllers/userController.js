const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { hasErrors, validateProfile } = require('../utils/validators');
const { uploadBuffer, destroyImage } = require('../config/cloudinary');

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

const updateStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('That user was not found.', 404);
  if (String(user._id) === String(req.user._id)) {
    throw new AppError('You cannot change your own account status.', 400);
  }
  if (!['active', 'inactive'].includes(req.body.status)) {
    throw new AppError('Status must be active or inactive.', 400);
  }

  user.status = req.body.status;
  await user.save();
  res.json({ user: user.toPublic(), message: `${user.username} is now ${user.status}.` });
});

module.exports = { updateProfile, listUsers, updateStatus };
