const express = require('express');
const router = express.Router();
const { getWeather } = require('../controllers/weatherController');

// GET /api/weather?city=Cairo&slug=cairo
router.get('/', getWeather);

module.exports = router;