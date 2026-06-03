/**
 * Middleware to authorize requests based on user roles.
 * @param {string[]} roles 
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.rol))) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    next();
  };
};

module.exports = authorize;
