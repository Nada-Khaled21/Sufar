const express = require('express');
const router = express.Router();

const {
  searchFlights,
  getFlight,
  getSeats,
  createFlight,
  updateFlight,
  deleteFlight
} = require('../controllers/flightController');

const { protect, isAdmin } = require('../middleware/auth');

// PUBLIC ROUTES
router.get('/', searchFlights);
router.get('/:id', getFlight);
router.get('/:id/seats', getSeats);

//  ADMIN ONLY
router.post('/', protect, isAdmin, createFlight);
router.put('/:id', protect, isAdmin, updateFlight);
router.delete('/:id', protect, isAdmin, deleteFlight);

module.exports = router;