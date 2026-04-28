const jwt = require('jsonwebtoken');
const User = require('../models/User');

// =====================
// Protect — لازم تكوني logged in
// =====================
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

// =====================
// isAdmin — لازم تكوني admin
// =====================
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized, admin only' });
  }
  next();
};

module.exports = protect;
module.exports.isAdmin = isAdmin;
module.exports.protect = protect;