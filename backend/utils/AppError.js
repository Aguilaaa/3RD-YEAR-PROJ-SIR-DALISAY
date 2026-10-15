class AppError extends Error {
  constructor(message, status = 500, errors = null, code = null) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

module.exports = AppError;
