const Destination = require('../models/Destination');
const Hotel = require('../models/Hotel');
const mongoose = require('mongoose');

// Get All Destinations — مع search و pagination
exports.getDestinations = async (req, res) => {
  try {
    const { featured, search, region, page = 1, limit = 12 } = req.query;

    let filter = {};

    if (featured) filter.isFeatured = true;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { region: { $regex: search, $options: 'i' } }
      ];
    }

    if (region) filter.region = { $regex: region, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [destinations, total] = await Promise.all([
      Destination.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .sort({ isFeatured: -1, name: 1 }),
      Destination.countDocuments(filter)
    ]);

    res.json({
      destinations,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Destination + Top 3 Hotels
exports.getDestination = async (req, res) => {
  try {
    const { id } = req.params;
    let destination;

    if (mongoose.isValidObjectId(id)) {
      destination = await Destination.findById(id);
    } else {
      destination = await Destination.findOne({ slug: id });
    }

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    // Top 3 فنادق مرتبة بالـ rating للـ destination page
    const topHotels = await Hotel.find({ destination: destination._id })
      .sort({ rating: -1 })
      .limit(3)
      .select('name slug images rating startingFrom locationType');

    res.json({ destination, topHotels });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Create Destination — Admin Only
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
// Update Destination — Admin Only
// =====================
exports.updateDestination = async (req, res) => {
  try {
    const destination = await Destination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
         returnDocument: 'after' ,
         runValidators: true 
      }
    );
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.json(destination);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Delete Destination — Admin Only
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