const express = require('express');
const router = express.Router();
const {
  createHotelBooking,
  createFlightBooking,
  payBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  checkAvailability
} = require('../controllers/bookingController');
const protect = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');

// Check availability — public
router.get('/check-availability', checkAvailability);

// User routes — لازم logged in
router.post('/hotel', protect, createHotelBooking);
router.post('/flight', protect, createFlightBooking);
router.get('/my', protect, getMyBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/pay', protect, payBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
