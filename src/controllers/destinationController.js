const Destination = require('../models/Destination');
const Hotel = require('../models/Hotel');
const mongoose = require('mongoose');

// =====================
// Get All Destinations
// =====================
exports.getDestinations = async (req, res) => {
  try {
    const { featured } = req.query;
    let filter = {};

    if (featured) {
      filter.isFeatured = true;
    }

    const destinations = await Destination.find(filter);
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Get Single Destination + Hotels فيها
// =====================
exports.getDestination = async (req, res) => {
  try {
    const { id } = req.params;
    let destination;

    // لو الـ id المبعوث عبارة عن ObjectId صحيح، ابحث بيه، لو لأ ابحث كأنه Slug
    if (mongoose.isValidObjectId(id)) {
      destination = await Destination.findById(id);
    } else {
      destination = await Destination.findOne({ slug: id });
    }
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    const hotels = await Hotel.find({ destination: destination._id });

    res.json({ destination, hotels });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Create Destination (Admin)
// =====================
exports.createDestination = async (req, res) => {
  try {
    const destination = await Destination.create(req.body);
    res.status(201).json(destination);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Delete Destination (Admin)
// =====================
exports.deleteDestination = async (req, res) => {
  try {
    const destination = await Destination.findByIdAndDelete(req.params.id);
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};