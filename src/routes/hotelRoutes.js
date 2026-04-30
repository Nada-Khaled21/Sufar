const express = require('express');
const router = express.Router();
const {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  createRoom
} = require('../controllers/hotelController');
const { protect, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', getHotels);
router.get('/:id', getHotel);

// Admin only routes
router.post('/', protect, isAdmin, createHotel);
router.put('/:id', protect, isAdmin, updateHotel);
router.delete('/:id', protect, isAdmin, deleteHotel);
router.post('/rooms', protect, isAdmin, createRoom);

module.exports = router;