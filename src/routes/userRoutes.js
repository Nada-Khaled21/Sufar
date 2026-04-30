const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getProfile,
  updateProfile,
  toggleWishlist
} = require('../controllers/userController');

// Auth Middleware
router.use(protect);

// User Profile Routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Wishlist
router.post('/wishlist/:hotelId', toggleWishlist);

module.exports = router;