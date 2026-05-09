const express = require('express');
const router = express.Router();
const {
  getDestinations,
  getDestination,
  createDestination,
  updateDestination,
  deleteDestination
} = require('../controllers/destinationController');
const { protect, isAdmin } = require('../middleware/auth');

// Public
router.get('/', getDestinations);
router.get('/:id', getDestination);

// Admin Only
router.post('/', protect, isAdmin, createDestination);
router.put('/:id', protect, isAdmin, updateDestination);
router.delete('/:id', protect, isAdmin, deleteDestination);

module.exports = router;

// // ## تجربة على Postman

// // ### Get All Destinations
// // ```
// // GET http://localhost:5000/api/destinations
// // ```

// // ### Get Featured Destinations
// // ```
// // GET http://localhost:5000/api/destinations?featured=true
// // ```

// // ### Get Single Destination + Hotels
// // ```
// // GET http://localhost:5000/api/destinations/69a8c963078a6bd0103389b1