const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },

  name: {
    type: String,
    required: true
  },

  // نوع الغرفة — متوافق مع الـ UI والفلتر
  type: {
    type: String,
    enum: ['Single', 'Double', 'Triple', 'Family', 'Suite', 'Penthouse'],
    required: true
  },

  pricePerNight: {
    type: Number,
    required: true
  },

  capacity: {
    type: Number,
    required: true
  },

  beds: {
    type: Number,
    default: 1
  },

  bathrooms: {
    type: Number,
    default: 1
  },

  images: [String],

  amenities: [String]

  // isAvailable اتحذف
  // الـ availability بيتحدد من الـ Bookings
  // لو عايزة تعرفي الغرفة متاحة في تاريخ معين:
  // const booked = await Booking.findOne({
  //   room: roomId,
  //   checkIn: { $lte: date },
  //   checkOut: { $gte: date },
  //   bookingStatus: { $ne: 'cancelled' }
  // });
  // const isAvailable = !booked;

}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
