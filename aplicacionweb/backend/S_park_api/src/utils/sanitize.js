/**
 * Sanitizes a string to prevent XSS.
 * @param {string} input 
 * @returns {string}
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Simple regex to remove HTML tags
  return input.replace(/<[^>]*>?/gm, '').trim();
};

module.exports = {
  sanitizeInput
};
