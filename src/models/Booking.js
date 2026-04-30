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
  pricePerNight: Number,   
  totalGuests: { type: Number, default: 1 },

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
  paymentOption: {
    type: String,
    enum: ['partial', 'full'],   
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partially_paid', 'paid', 'failed'],
    default: 'pending'
  },
  paidAt: Date,
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