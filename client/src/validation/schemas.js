import * as yup from 'yup';

const phone = /^[0-9+\-\s()]{7,20}$/;
const password = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const loginSchema = yup.object({
  identifier: yup.string().trim().required('Username or email is required.'),
  password: yup.string().required('Password is required.'),
});

export const registerSchema = yup.object({
  firstName: yup.string().trim().required('First name is required.'),
  lastName: yup.string().trim().required('Last name is required.'),
  username: yup
    .string()
    .trim()
    .required('Username is required.')
    .matches(/^[a-zA-Z0-9_]{3,20}$/, 'Username must be 3–20 letters, numbers, or underscores.'),
  email: yup.string().trim().email('Enter a valid email address.').required('Email is required.'),
  password: yup
    .string()
    .required('Password is required.')
    .matches(password, 'Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.'),
  confirmPassword: yup
    .string()
    .required('Confirm your password.')
    .oneOf([yup.ref('password')], 'Passwords do not match.'),
  contactNumber: yup.string().trim().required('Contact number is required.').matches(phone, 'Enter a valid contact number.'),
  address: yup.string().trim().required('Enter a complete address.').min(8, 'Enter a complete address.'),
});

export const profileSchema = yup.object({
  firstName: yup.string().trim().required('First name is required.'),
  lastName: yup.string().trim().required('Last name is required.'),
  username: yup
    .string()
    .trim()
    .required('Username is required.')
    .matches(/^[a-zA-Z0-9_]{3,20}$/, 'Username must be 3–20 letters, numbers, or underscores.'),
  contactNumber: yup.string().trim().required('Contact number is required.').matches(phone, 'Enter a valid contact number.'),
  address: yup.string().trim().required('Enter a complete address.').min(8, 'Enter a complete address.'),
});

export const productSchema = yup.object({
  itemCode: yup
    .string()
    .trim()
    .required('Item code is required.')
    .matches(/^[A-Za-z0-9-]{3,20}$/, 'Use 3–20 letters, numbers, or dashes.'),
  name: yup.string().trim().required('Product name is required.').min(2, 'Product name is required.'),
  category: yup.string().required('Category is required.'),
  motorcycleBrand: yup.string().trim().required('Motorcycle brand is required.'),
  unit: yup.string().required('Unit is required.'),
  price: yup
    .number()
    .typeError('Price must be a number greater than zero.')
    .moreThan(0, 'Price must be a number greater than zero.')
    .required('Price must be a number greater than zero.'),
  stockQuantity: yup
    .number()
    .typeError('Stock must be a whole number, zero or more.')
    .integer('Stock must be a whole number, zero or more.')
    .min(0, 'Stock must be a whole number, zero or more.')
    .required('Stock must be a whole number, zero or more.'),
  description: yup
    .string()
    .trim()
    .required('Description must be at least 10 characters.')
    .min(10, 'Description must be at least 10 characters.'),
  status: yup.string().oneOf(['Active', 'Inactive'], 'Status must be Active or Inactive.').required(),
  modelIds: yup.array().of(yup.string()).min(1, 'Select at least one compatible motorcycle model.'),
});

export const reviewSchema = yup.object({
  rating: yup
    .number()
    .typeError('Choose a rating from 1 to 5 stars.')
    .integer('Choose a rating from 1 to 5 stars.')
    .min(1, 'Choose a rating from 1 to 5 stars.')
    .max(5, 'Choose a rating from 1 to 5 stars.')
    .required('Choose a rating from 1 to 5 stars.'),
  comment: yup.string().trim().required('Write a short review.').min(2, 'Write a short review.').max(500, 'Reviews can be at most 500 characters.'),
});

export const checkoutSchema = yup.object({
  shippingName: yup.string().trim().required('Shipping name is required.').min(2, 'Shipping name is required.'),
  contactNumber: yup.string().trim().required('Contact number is required.').matches(phone, 'Enter a valid contact number.'),
  address: yup.string().trim().required('Enter a complete shipping address.').min(8, 'Enter a complete shipping address.'),
  paymentMethod: yup
    .string()
    .oneOf(['Cash on Delivery', 'Manual Payment'], 'Choose a payment method.')
    .required('Choose a payment method.'),
});

export function imageError(files, maxBytes) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  for (const file of files) {
    if (!allowed.includes(file.type)) return 'Only JPG, PNG, and WEBP images are allowed.';
    if (file.size > maxBytes) return `Each image must be ${Math.round(maxBytes / (1024 * 1024))} MB or smaller.`;
  }
  return '';
}
