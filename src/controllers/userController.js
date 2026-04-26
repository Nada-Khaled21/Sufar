const User = require('../models/User');

// =====================
// Get User Profile
// =====================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('wishlist', 'name location images stars rating startingFrom propertyType');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Update User Profile
// =====================
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, profilePicture } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (fullName) user.fullName = fullName;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();
    
    // Return user without password
    const updatedUser = await User.findById(req.user._id).select('-password');
    res.json(updatedUser);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Toggle Wishlist (Add / Remove)
// =====================
exports.toggleWishlist = async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const index = user.wishlist.indexOf(hotelId);
    
    if (index === -1) {
      // Add to wishlist
      user.wishlist.push(hotelId);
    } else {
      // Remove from wishlist
      user.wishlist.splice(index, 1);
    }

    await user.save();
    
    const updatedUser = await User.findById(req.user._id)
      .select('-password')
      .populate('wishlist', 'name location images stars rating startingFrom propertyType');
      
    res.json({
      message: index === -1 ? 'Added to wishlist' : 'Removed from wishlist',
      wishlist: updatedUser.wishlist
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
