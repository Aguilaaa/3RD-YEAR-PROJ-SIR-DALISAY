const multer = require('multer');
const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError('The page or record you requested was not found.', 404));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('That image is too large for this upload.', 400);
  }

  const status = error.status || 500;
  if (status >= 500) console.error(error);

  const duplicate = error.code === 11000;
  const message = duplicate
    ? 'That value is already in use. Choose a different one.'
    : error.message || 'Something went wrong. Please try again.';

  res.status(duplicate ? 400 : status).json({
    message,
    errors: error.errors || null,
    code: error.code || null,
  });
}

module.exports = { notFound, errorHandler };
