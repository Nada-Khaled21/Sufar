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
const { protect } = require('../middleware/auth');

// Check availability — public
router.get('/check-availability', checkAvailability);

// User routes — لازم logged in
router.use(protect);

router.post('/hotel', createHotelBooking);
router.post('/flight', createFlightBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBooking);
router.put('/:id/pay', payBooking);
router.put('/:id/cancel', cancelBooking);

module.exports = router;