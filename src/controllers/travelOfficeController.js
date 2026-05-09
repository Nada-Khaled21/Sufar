const TravelOffice = require('../models/travelOffice');

// =====================
// GET ALL — مع Search و Filter و Pagination
// =====================
exports.getOffices = async (req, res) => {
  try {
    const { search, city, minRating, page = 1 } = req.query;

    let filter = { isActive: true };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (city) {
      filter['location.city'] = { $regex: city, $options: 'i' };
    }

    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    const limit = 6;
    const skip = (Number(page) - 1) * limit;

    const [offices, total] = await Promise.all([
      TravelOffice.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ rating: -1 })
        .select('-reviews'), // الـ reviews مش محتاجينها في الـ listing
      TravelOffice.countDocuments(filter)
    ]);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: offices
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =====================
// GET SINGLE — Full Details مع الـ reviews
// =====================
exports.getOfficeFullDetails = async (req, res) => {
  try {
    const office = await TravelOffice.findById(req.params.id)
      .populate('reviews.user', 'fullName profilePicture');

    if (!office) return res.status(404).json({ message: 'Travel office not found' });

    res.json({
      office,
      sentimentScore: office.calculateSentimentScore()
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =====================
// CREATE — Admin Only
// =====================
exports.createOffice = async (req, res) => {
  try {
    const office = await TravelOffice.create(req.body);
    res.status(201).json({ message: 'Travel office created successfully', office });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: err.message });
  }
};

// =====================
// UPDATE — Admin Only
// =====================
exports.updateOffice = async (req, res) => {
  try {
    // منع تعديل الـ reviews عن طريق هذا الـ endpoint
    const { reviews, rating, reviewsCount, ...updateData } = req.body;

   const office = await TravelOffice.findByIdAndUpdate(
  req.params.id,
  updateData,
  {
    returnDocument: 'after',
    runValidators: true
  }
);

    if (!office) return res.status(404).json({ message: 'Travel office not found' });

    res.json({ message: 'Travel office updated successfully', office });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: err.message });
  }
};

// =====================
// DELETE — Admin Only (Soft Delete)
// =====================
exports.deleteOffice = async (req, res) => {
  try {
  const office = await TravelOffice.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { returnDocument: 'after' }
  );

    if (!office) return res.status(404).json({ message: 'Travel office not found' });

    res.json({ message: 'Travel office deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =====================
// ADD REVIEW — Logged-in users فقط
// =====================
exports.addReview = async (req, res) => {
  try {
    const { comment, rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const office = await TravelOffice.findById(req.params.id);
    if (!office) return res.status(404).json({ message: 'Travel office not found' });

    // تحقق لو اليوزر ده عمل review قبل كده
    const alreadyReviewed = office.reviews.some(
      r => r.user && r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this office' });
    }

    office.reviews.push({
      user: req.user._id,
      name: req.user.fullName,
      comment,
      rating
    });

    office.calculateRating();
    await office.save();

    res.status(201).json({ message: 'Review added successfully', rating: office.rating });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =====================
// DELETE REVIEW — Admin أو صاحب الـ review
// =====================
exports.deleteReview = async (req, res) => {
  try {
    const office = await TravelOffice.findById(req.params.id);
    if (!office) return res.status(404).json({ message: 'Travel office not found' });

    const review = office.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // بس Admin أو صاحب الـ review يقدر يحذفه
    const isOwner = review.user && review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    review.deleteOne();
    office.calculateRating();
    await office.save();

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
