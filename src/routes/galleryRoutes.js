const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  addGalleryImage,
  getGallery
} = require('../controllers/galleryController');

// Public route (Viewing gallery)
router.get('/', getGallery);

// Protected route (Uploading to gallery)
router.post('/', protect, addGalleryImage);

module.exports = router;
