const express = require('express');
const router = express.Router();
const {
  getHotels,
  getHotel,
  createHotel,
  createRoom
} = require('../controllers/hotelController');
const protect = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', getHotels);
router.get('/:id', getHotel);

// Admin only routes
router.post('/', protect, isAdmin, createHotel);
router.post('/rooms', protect, isAdmin, createRoom);

module.exports = router;
