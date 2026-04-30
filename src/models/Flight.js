const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({

  airline: {
    name: { type: String, required: true },
    logo: String
  },

  flightNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  from: {
    city: String,
    airport: String,
    code: { type: String, required: true } // مهم للفلاتر
  },

  to: {
    city: String,
    airport: String,
    code: { type: String, required: true } // مهم للفلاتر
  },

  departureTime: {
    type: Date,
    required: true
  },

  arrivalTime: {
    type: Date,
    required: true
  },

  durationMinutes: Number, 
  
  stops: {
    type: Number,
    default: 0
  },

  price: {
    economy: { type: Number, required: true },
    business: { type: Number }
  },

  seats: {
    economy: {
      total: { type: Number, required: true },
      available: { type: Number, required: true }
    },
    business: {
      total: { type: Number },
      available: { type: Number }
    }
  },

  bookedSeats: [
    {
      seatNumber: String,
      class: { type: String, enum: ['economy', 'business'] }
    }
  ],

  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TravelOffice'
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

/* =========================
   AUTO DURATION
========================= */
flightSchema.pre('save', function (next) {
  if (this.departureTime && this.arrivalTime) {
    const diff = (this.arrivalTime - this.departureTime) / (1000 * 60);
    this.durationMinutes = Math.floor(diff);
  }
  next();
});

/* =========================
   UPDATE SEATS
========================= */
flightSchema.methods.updateAvailableSeats = function () {

  const economyBooked = this.bookedSeats.filter(s => s.class === 'economy').length;
  const businessBooked = this.bookedSeats.filter(s => s.class === 'business').length;

  this.seats.economy.available =
    this.seats.economy.total - economyBooked;

  if (this.seats.business?.total) {
    this.seats.business.available =
      this.seats.business.total - businessBooked;
  }
};

flightSchema.index({ agency: 1 });
flightSchema.index({ departureTime: 1 });
flightSchema.index({ 'from.code': 1, 'to.code': 1 });

module.exports = mongoose.model('Flight', flightSchema);