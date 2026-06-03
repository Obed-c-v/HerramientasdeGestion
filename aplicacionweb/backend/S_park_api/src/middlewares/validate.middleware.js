const { sanitizeInput } = require('../utils/sanitize');

/**
 * Middleware to validate and sanitize request body.
 * @param {Function} schema 
 */
const validate = (schema) => {
  return (req, res, next) => {
    // Basic sanitization of all body strings
    if (req.body) {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeInput(req.body[key]);
        }
      }
    }

    // If a schema validation function is provided, run it
    if (schema && typeof schema === 'function') {
      const { error, value } = schema(req.body);
      if (error) {
        return res.status(400).json({ message: error.message || 'Validation error' });
      }
      req.body = value;
    }

    next();
  };
};

module.exports = validate;
