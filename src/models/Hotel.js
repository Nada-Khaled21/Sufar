const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: true
  },
  description: {
    type: String
  },
  images: [String],

  stars: {
    type: Number,
    min: 1,
    max: 5
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewsCount: {
    type: Number,
    default: 0
  },

  // أقل سعر غرفة — بيتحسب تلقائي في الـ Seed من roomTypes
  // بيُستخدم في الـ Card والفلتر فقط
  startingFrom: {
    type: Number,
    default: 0
  },

  mealPlan: {
    type: String,
    enum: ['Breakfast', 'Half Board', 'Full Board', 'All Inclusive'],
    default: 'Breakfast'
  },

  locationType: {
    type: String,
    enum: ['City Center', 'Beach', 'Mountain', 'Desert', 'Countryside']
  },

  propertyType: {
    type: String,
    enum: ['Hotel', 'Resort', 'Villa', 'Apartment', 'Lodge', 'Cabin', 'Hostel'],
    default: 'Hotel'
  },

  location: {
    address: String,
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  facilities: [String],

  nearbyActivities: [String]

}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);
