const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createReview,
  getHotelReviews,
  getDestinationReviews
} = require('../controllers/reviewController');

// Public routes (Viewing reviews)
router.get('/hotel/:hotelId', getHotelReviews);
router.get('/destination/:destinationId', getDestinationReviews);

// Protected routes (Writing reviews)
router.post('/', protect, createReview);

module.exports = router;
