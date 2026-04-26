const Review = require('../models/Review');
const Hotel = require('../models/Hotel');

// =====================
// Create a Review
// =====================
exports.createReview = async (req, res) => {
  try {
    const { hotelId, destinationId, rating, comment, images } = req.body;

    if (!hotelId && !destinationId) {
      return res.status(400).json({ message: 'Review must belong to a hotel or destination' });
    }

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    const review = await Review.create({
      user: req.user._id,
      hotel: hotelId,
      destination: destinationId,
      rating,
      comment,
      images
    });

    // If it's a hotel review, update the hotel's average rating and reviews count
    if (hotelId) {
      const reviews = await Review.find({ hotel: hotelId });
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;

      await Hotel.findByIdAndUpdate(hotelId, {
        rating: Number(avgRating.toFixed(1)),
        reviewsCount: reviews.length
      });
    }

    // Populate user info before returning
    const populatedReview = await Review.findById(review._id).populate('user', 'fullName profilePicture');
    res.status(201).json(populatedReview);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Get Reviews for a Hotel
// =====================
exports.getHotelReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ hotel: req.params.hotelId })
      .populate('user', 'fullName profilePicture')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Get Reviews for a Destination
// =====================
exports.getDestinationReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ destination: req.params.destinationId })
      .populate('user', 'fullName profilePicture')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
