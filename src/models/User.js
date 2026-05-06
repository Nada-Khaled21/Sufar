const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true, 
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: ""
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel'
  }],
  verifyCode: {
    type: String
  },
  verifyCodeExpire: {
    type: Date
  },
  resetPasswordCode: {
    type: String
  },
  resetPasswordExpire: {
    type: Date
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);