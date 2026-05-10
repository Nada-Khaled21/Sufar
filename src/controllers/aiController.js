const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/ai/recommend
exports.recommend = async (req, res) => {
  try {
    const { activities, budget, duration, travelers } = req.body;

    if (!activities || !budget || !duration) {
      return res.status(400).json({
        message: 'activities, budget, and duration are required'
      });
    }

    const response = await axios.post(`${AI_SERVICE_URL}/recommend`, {
      activities,
      budget,
      duration,
      travelers: travelers || 2
    });

    res.json(response.data);

  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(503).json({ message: 'AI service unavailable. Please try again.' });
  }
};

// POST /api/ai/chat
exports.chat = async (req, res) => {
  try {
    const { message, language } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'message is required' });
    }

    const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
      message,
      language: language || 'both'
    });

    res.json(response.data);

  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(503).json({ message: 'AI service unavailable. Please try again.' });
  }
};

// GET /api/ai/cities
exports.getCities = async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/cities`);
    res.json(response.data);
  } catch (error) {
    res.status(503).json({ message: 'AI service unavailable.' });
  }
};

// =====================
// GET /api/ai/activities
// =====================
exports.getActivities = async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/activities`);
    res.json(response.data);
  } catch (error) {
    res.status(503).json({ message: 'AI service unavailable.' });
  }
};
