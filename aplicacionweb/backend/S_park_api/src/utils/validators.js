const validator = require('validator');

/**
 * Validates an email address.
 * @param {string} email 
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  return validator.isEmail(email || '');
};

/**
 * Validates a phone number.
 * @param {string} phone 
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  return validator.isMobilePhone(phone || '', 'any');
};

/**
 * Validates if a string is not empty.
 * @param {string} str 
 * @returns {boolean}
 */
const isNotEmpty = (str) => {
  return typeof str === 'string' && str.trim().length > 0;
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isNotEmpty
};
