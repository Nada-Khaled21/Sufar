const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  toggleWishlist
} = require('../controllers/userController');

// All user routes require authentication
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/wishlist/:hotelId', toggleWishlist);

module.exports = router;
