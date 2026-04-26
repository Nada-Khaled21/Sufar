const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  airline: {
    name: String,
    logo: String
  },
  flightNumber: {
    type: String,
    required: true
  },
  from: {
    city: String,
    airport: String,
    code: String
  },
  to: {
    city: String,
    airport: String,
    code: String
  },
  departureTime: {
    type: Date,
    required: true
  },
  arrivalTime: {
    type: Date,
    required: true
  },
  duration: {
    type: String
  },
  stops: {
    type: Number,
    default: 0
  },
  price: {
    economy: Number,
    business: Number
  },
  seats: {
    economy: { total: Number, available: Number },
    business: { total: Number, available: Number }
  },
  bookedSeats: [String]
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);