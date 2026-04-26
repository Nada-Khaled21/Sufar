const express = require('express');
const router = express.Router();
const {
  searchFlights,
  getFlight,
  createFlight,
  getSeats
} = require('../controllers/flightController');
const protect = require('../middleware/auth');

router.get('/', searchFlights);
router.get('/:id', getFlight);
router.get('/:id/seats', getSeats);
router.post('/', protect, createFlight);

module.exports = router;