const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: String,
  comment: String,
  rating: { type: Number, min: 1, max: 5 },
  date: { type: Date, default: Date.now }
});

const travelOfficeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: String,
  description: String,

  email: String,
  phone: String,
  website: String,

  location: {
    address: String,
    city: String,
    country: String,
    mapLink: String
  },

  services: [String],
  certifications: [String],

  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },

  stats: {
    totalBookings: { type: Number, default: 0 },
    countriesCovered: { type: Number, default: 0 },
    yearsInBusiness: { type: Number, default: 0 },
    customerSatisfaction: { type: Number, default: 0 }
  },

  reviews: [reviewSchema],

  isActive: { type: Boolean, default: true }

}, { timestamps: true });

/* METHODS */
travelOfficeSchema.methods.calculateRating = function () {
  if (!this.reviews.length) {
    this.rating = 0;
    this.reviewsCount = 0;
    return;
  }
  const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.rating = +(total / this.reviews.length).toFixed(1);
  this.reviewsCount = this.reviews.length;
};

travelOfficeSchema.methods.calculateSentimentScore = function () {
  if (!this.reviews.length) return 0;
  const positive = this.reviews.filter(r => r.rating >= 4).length;
  return Math.round((positive / this.reviews.length) * 100);
};

/* INDEXES */
travelOfficeSchema.index({ name: 'text' });
travelOfficeSchema.index({ rating: -1 });
travelOfficeSchema.index({ 'location.city': 1 });

module.exports = mongoose.model('TravelOffice', travelOfficeSchema);
