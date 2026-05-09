const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const mongoose = require('mongoose');

// Get All Hotels — مع Search و Filter و Pagination
exports.getHotels = async (req, res) => {
  try {
    const {
      search, keyword, name, destination, // new search params
      city, stars, minPrice, maxPrice,
      mealPlan, locationType, propertyType, facilities, // added propertyType
      page = 1, limit = 10
    } = req.query;

    let filter = {};

    // Generic search by keyword, search or name
    const searchQuery = search || keyword || name;
    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { 'location.city': { $regex: searchQuery, $options: 'i' } },
        { 'location.country': { $regex: searchQuery, $options: 'i' } }
      ];
    }

    if (destination) {
      if (mongoose.isValidObjectId(destination)) {
        filter.destination = destination;
      }
    }

    if (city) {
      filter['location.city'] = { $regex: city, $options: 'i' };
    }
    if (stars) {
      filter.stars = Number(stars);
    }
    if (mealPlan) {
      filter.mealPlan = mealPlan;
    }
    if (locationType) {
      filter.locationType = locationType;
    }
    if (propertyType) {
      filter.propertyType = propertyType;
    }
    if (facilities) {
      const facilityList = facilities.split(',');
      filter.facilities = { $all: facilityList };
    }
    if (minPrice || maxPrice) {
      filter.startingFrom = {};
      if (minPrice) filter.startingFrom.$gte = Number(minPrice);
      if (maxPrice) filter.startingFrom.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [hotels, total] = await Promise.all([
      Hotel.find(filter)
        .populate('destination', 'name country')
        .skip(skip)
        .limit(Number(limit))
        .sort({ rating: -1 }),
      Hotel.countDocuments(filter)
    ]);

    res.json({
      hotels,
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

// =====================
// Get Single Hotel + Rooms
// =====================
exports.getHotel = async (req, res) => {
  try {
    const { id } = req.params;
    let hotel;

    if (mongoose.isValidObjectId(id)) {
      hotel = await Hotel.findById(id).populate('destination', 'name country');
    } else {
      hotel = await Hotel.findOne({ slug: id }).populate('destination', 'name country');
    }

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const rooms = await Room.find({ hotel: hotel._id });

    res.json({ hotel, rooms });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Create Hotel — Admin Only
// =====================
exports.createHotel = async (req, res) => {
  try {
    const {
      name, destination, description, images,
      stars, rating, reviewsCount,
      mealPlan, locationType, location,
      facilities, nearbyActivities
    } = req.body;

    if (!name || !destination || !stars) {
      return res.status(400).json({ message: 'name, destination and stars are required' });
    }

    const hotel = await Hotel.create({
      name, destination, description, images,
      stars, rating, reviewsCount,
      mealPlan, locationType, location,
      facilities, nearbyActivities
    });

    res.status(201).json(hotel);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Create Room — Admin Only
// =====================
exports.createRoom = async (req, res) => {
  try {
    const {
      hotel, name, type,
      pricePerNight, capacity,
      beds, bathrooms, images, amenities
    } = req.body;

    if (!hotel || !name || !type || !pricePerNight || !capacity) {
      return res.status(400).json({ message: 'hotel, name, type, pricePerNight and capacity are required' });
    }

    const room = await Room.create({
      hotel, name, type,
      pricePerNight, capacity,
      beds, bathrooms, images, amenities
    });

    // تحديث startingFrom في الفندق
    const rooms = await Room.find({ hotel });
    const minPrice = Math.min(...rooms.map(r => r.pricePerNight));
    await Hotel.findByIdAndUpdate(hotel, { startingFrom: minPrice });

    res.status(201).json(room);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Update Hotel — Admin Only
// =====================
exports.updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        returnDocument: 'after',
        runValidators: true
      }
    );
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Delete Hotel — Admin Only
// =====================
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};