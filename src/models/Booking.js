const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingType: {
    type: String,
    enum: ['hotel', 'flight'],
    required: true
  },
  // Hotel Booking
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  checkIn: Date,
  checkOut: Date,
  nights: Number,

  // Flight Booking
  flight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight'
  },
  seatClass: {
    type: String,
    enum: ['economy', 'business']
  },
  selectedSeats: [String],
  passengers: [{
    firstName: String,
    lastName: String,
    passport: String
  }],

  // Payment
  totalPrice: {
    type: Number,
    required: true
  },
  initialPayment: Number,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending'],
    default: 'pending'
  },

  // Guest Info
  guestInfo: {
    firstName: String,
    lastName: String,
    email: String,
    country: String,
    phone: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);