const Filter = require('bad-words');

const filter = new Filter();

function maskProfanity(text) {
  const original = String(text || '');
  try {
    return filter.clean(original);
  } catch {
    return original;
  }
}

module.exports = { maskProfanity };
