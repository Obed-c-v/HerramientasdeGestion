const crypto = require('crypto');

/**
 * Generates a cryptographically secure 6-digit OTP.
 * @returns {string} OTP code
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generates a secure temporary password.
 * 12 characters: letters and numbers.
 * @returns {string} Temporary password
 */
const generateTempPassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  // Ensure at least one uppercase, one lowercase, one number for complexity rules if needed
  password += 'A';
  password += 'a';
  password += '1';
  
  for (let i = 3; i < 12; i++) {
    password += chars[crypto.randomInt(0, chars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Returns an expiration date 15 minutes from now.
 * @returns {Date} Expiration date
 */
const getOTPExpiration = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 15);
  return now;
};

module.exports = {
  generateOTP,
  generateTempPassword,
  getOTPExpiration
};
