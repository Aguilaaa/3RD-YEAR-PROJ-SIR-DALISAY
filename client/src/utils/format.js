export function peso(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value) || 0);
}

export function when(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(value));
}

export const PRICE_OPTIONS = [
  { value: '', label: 'Any price' },
  { value: 'under-500', label: 'Under PHP 500' },
  { value: '500-1000', label: 'PHP 500–1,000' },
  { value: '1000-5000', label: 'PHP 1,000–5,000' },
  { value: 'above-5000', label: 'Above PHP 5,000' },
];

export const RATING_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars & above' },
  { value: '3', label: '3 stars & above' },
];

export const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Ready to Ship',
  'Shipped',
  'Completed',
  'Cancelled',
];
