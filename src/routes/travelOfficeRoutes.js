const express = require('express');
const router = express.Router();
const {
  getOffices,
  getOfficeFullDetails,
  createOffice,
  updateOffice,
  deleteOffice,
  addReview,
  deleteReview
} = require('../controllers/travelOfficeController');
const { protect, isAdmin } = require('../middleware/auth');

// ─── Public ──────────────────────────────────────────────
router.get('/', getOffices);
router.get('/:id', getOfficeFullDetails);

// ─── Admin Only ───────────────────────────────────────────
router.post('/', protect, isAdmin, createOffice);
router.put('/:id', protect, isAdmin, updateOffice);
router.delete('/:id', protect, isAdmin, deleteOffice);

// ─── Logged-in Users ─────────────────────────────────────
router.post('/:id/reviews', protect, addReview);
router.delete('/:id/reviews/:reviewId', protect, deleteReview);

module.exports = router;
