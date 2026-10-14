const multer = require('multer');
const AppError = require('../utils/AppError');

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);

function imageUpload(maxBytes) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 8 },
    fileFilter: (req, file, callback) => {
      if (!allowed.has(file.mimetype)) {
        callback(new AppError('Only JPG, PNG, and WEBP images are allowed.', 400));
        return;
      }
      callback(null, true);
    },
  });

  return (field, many = false) => (req, res, next) => {
    const runner = many ? upload.array(field, 8) : upload.single(field);
    runner(req, res, (error) => {
      if (!error) {
        next();
        return;
      }
      if (error.code === 'LIMIT_FILE_SIZE') {
        const mb = Math.round(maxBytes / (1024 * 1024));
        next(new AppError(`Each image must be ${mb} MB or smaller.`, 400));
        return;
      }
      next(error.status ? error : new AppError(error.message || 'Invalid image upload.', 400));
    });
  };
}

const productPhotos = imageUpload(5 * 1024 * 1024);
const profilePhoto = imageUpload(2 * 1024 * 1024);

module.exports = {
  productPhotos: productPhotos('photos', true),
  singleProductPhoto: productPhotos('photo', false),
  profilePhoto: profilePhoto('photo', false),
};
