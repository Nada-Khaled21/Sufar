const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  name_ar: {
    type: String
  },
  slug: {
    type: String,
    unique: true
  },
  country: {
    type: String,
    required: true
  },
  country_ar: {
    type: String
  },
  region: {
    type: String
  },
  description: {
    type: String
  },
  highlights: [String],
  image: {
    type: String
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Destination', destinationSchema);
