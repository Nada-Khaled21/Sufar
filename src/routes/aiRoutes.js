const express = require('express');
const router = express.Router();
const { recommend, chat, getCities, getActivities } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// Public
router.get('/cities', getCities);
router.get('/activities', getActivities);

router.post('/recommend', protect, recommend);
router.post('/chat', chat); 

module.exports = router;