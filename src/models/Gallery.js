const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  caption: {
    type: String
  },
  isApproved: {
    type: Boolean,
    default: true // Set to false if you want admin to approve photos before they appear
  }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
