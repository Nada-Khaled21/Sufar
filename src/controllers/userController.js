const User = require('../models/User');

// =====================
// Get User Profile (UI Ready)
// =====================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('wishlist');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const response = {
      fullName: user.fullName || "John Doe",
      email: user.email || "",
      location: user.location || "Unknown",
      avatarInitials: getInitials(user.fullName),
      memberSince: user.createdAt,

      stats: {
        destinations: user.wishlist?.length || 0,
        travelPlans: user.travelPlans?.length || 0,
        bookmarks: user.wishlist?.length || 0
      },

      savedDestinations: (user.wishlist || []).map(item => ({
        id: item._id,
        name: item.name,
        location: item.location?.city || item.location || "",
        image: item.images?.[0] || "",
        price: item.startingFrom || 0
      }))
    };

    res.json(response);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Update Profile
// =====================
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, profilePicture, location } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (fullName) user.fullName = fullName;
    if (profilePicture) user.profilePicture = profilePicture;
    if (location) user.location = location;

    await user.save();

    const updatedUser = await User.findById(req.user._id).select('-password');

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Toggle Wishlist
// =====================
exports.toggleWishlist = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use .toString() to compare ObjectIds correctly
    const index = user.wishlist.findIndex(id => id.toString() === hotelId.toString());

    if (index === -1) {
      user.wishlist.push(hotelId);
    } else {
      user.wishlist.splice(index, 1);
    }

    await user.save();

    const updatedUser = await User.findById(req.user._id)
      .select('-password')
      .populate('wishlist');

    res.json({
      message: index === -1 ? 'Added to wishlist' : 'Removed from wishlist',
      wishlistCount: updatedUser.wishlist.length,
      wishlist: updatedUser.wishlist.map(item => ({
        id: item._id,
        name: item.name,
        location: item.location?.city || item.location,
        image: item.images?.[0] || "",
        price: item.startingFrom || 0
      }))
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Helper
// =====================
function getInitials(name = "") {
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}