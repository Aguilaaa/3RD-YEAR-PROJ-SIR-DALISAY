const { ORDER_STATUSES, PAYMENT_METHODS } = require('../constants');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
const itemCodePattern = /^[A-Za-z0-9-]{3,20}$/;
const phonePattern = /^[0-9+\-\s()]{7,20}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

function parseModelIds(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

function validateProduct(body) {
  const errors = {};
  const itemCode = String(body.itemCode || '').trim();
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const price = Number(body.price);
  const stockQuantity = Number(body.stockQuantity);
  const modelIds = parseModelIds(body.modelIds);

  if (!itemCode) errors.itemCode = 'Item code is required.';
  else if (!itemCodePattern.test(itemCode)) errors.itemCode = 'Use 3–20 letters, numbers, or dashes.';

  if (name.length < 2) errors.name = 'Product name is required.';
  if (!body.category) errors.category = 'Category is required.';
  if (!String(body.motorcycleBrand || '').trim()) errors.motorcycleBrand = 'Motorcycle brand is required.';
  if (!String(body.unit || '').trim()) errors.unit = 'Unit is required.';
  if (!Number.isFinite(price) || price <= 0) errors.price = 'Price must be a number greater than zero.';
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    errors.stockQuantity = 'Stock must be a whole number, zero or more.';
  }
  if (description.length < 10) errors.description = 'Description must be at least 10 characters.';
  if (body.status && !['Active', 'Inactive'].includes(body.status)) {
    errors.status = 'Status must be Active or Inactive.';
  }
  if (modelIds.length === 0) errors.modelIds = 'Select at least one compatible motorcycle model.';

  return {
    errors,
    value: {
      itemCode,
      name,
      category: body.category,
      motorcycleBrand: String(body.motorcycleBrand || '').trim(),
      unit: String(body.unit || '').trim(),
      price,
      stockQuantity,
      description,
      status: body.status || 'Active',
      modelIds,
    },
  };
}

function validateIdentity(body) {
  const errors = {};
  const username = String(body.username || '').trim();
  const email = String(body.email || '').trim().toLowerCase();

  if (!username) errors.username = 'Username is required.';
  else if (!usernamePattern.test(username)) {
    errors.username = 'Username must be 3–20 letters, numbers, or underscores.';
  }

  if (!email) errors.email = 'Email is required.';
  else if (!emailPattern.test(email)) errors.email = 'Enter a valid email address.';

  return { errors, username, email };
}

function validatePassword(password, confirmPassword) {
  const errors = {};
  if (!password) errors.password = 'Password is required.';
  else if (!passwordPattern.test(password)) {
    errors.password = 'Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.';
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

function validateProfile(body, { usernameRequired = false } = {}) {
  const errors = {};
  const firstName = String(body.firstName || '').trim();
  const lastName = String(body.lastName || '').trim();
  const contactNumber = String(body.contactNumber || '').trim();
  const address = String(body.address || '').trim();
  const username = String(body.username || '').trim();

  if (firstName.length < 1) errors.firstName = 'First name is required.';
  if (lastName.length < 1) errors.lastName = 'Last name is required.';
  if (!contactNumber) errors.contactNumber = 'Contact number is required.';
  else if (!phonePattern.test(contactNumber)) errors.contactNumber = 'Enter a valid contact number.';
  if (address.length < 8) errors.address = 'Enter a complete address.';

  if (usernameRequired || username) {
    if (!usernamePattern.test(username)) {
      errors.username = 'Username must be 3–20 letters, numbers, or underscores.';
    }
  }

  return { errors, value: { firstName, lastName, contactNumber, address, username: username.toLowerCase() } };
}

function validateReview(body) {
  const errors = {};
  const rating = Number(body.rating);
  const comment = String(body.comment || '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Choose a rating from 1 to 5 stars.';
  }
  if (comment.length < 2) errors.comment = 'Write a short review.';
  if (comment.length > 500) errors.comment = 'Reviews can be at most 500 characters.';

  return { errors, value: { rating, comment } };
}

function validateCheckout(body) {
  const errors = {};
  const shippingName = String(body.shippingName || '').trim();
  const contactNumber = String(body.contactNumber || '').trim();
  const address = String(body.address || '').trim();
  const paymentMethod = body.paymentMethod;

  if (shippingName.length < 2) errors.shippingName = 'Shipping name is required.';
  if (!phonePattern.test(contactNumber)) errors.contactNumber = 'Enter a valid contact number.';
  if (address.length < 8) errors.address = 'Enter a complete shipping address.';
  if (!PAYMENT_METHODS.includes(paymentMethod)) errors.paymentMethod = 'Choose a payment method.';

  return { errors, value: { shippingName, contactNumber, address, paymentMethod } };
}

function validateStatus(status) {
  if (!ORDER_STATUSES.includes(status)) {
    return 'Choose a valid order status.';
  }
  return '';
}

module.exports = {
  hasErrors,
  validateProduct,
  validateIdentity,
  validatePassword,
  validateProfile,
  validateReview,
  validateCheckout,
  validateStatus,
};
