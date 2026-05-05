const Gallery = require('../models/Gallery');

// Add Image to Gallery
exports.addGalleryImage = async (req, res) => {
  try {
    const { destinationId, imageUrl, caption } = req.body;

    if (!destinationId || !imageUrl) {
      return res.status(400).json({ message: 'destinationId and imageUrl are required' });
    }

    const galleryItem = await Gallery.create({
      user: req.user._id,
      destination: destinationId,
      imageUrl,
      caption,
      isApproved: true // Auto-approve for now
    });

    const populatedItem = await Gallery.findById(galleryItem._id)
      .populate('user', 'fullName profilePicture')
      .populate('destination', 'name');

    res.status(201).json(populatedItem);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// Get Gallery Images
// =====================
exports.getGallery = async (req, res) => {
  try {
    const { destinationId } = req.query;
    
    // Filter by destination if provided, and only show approved images
    let filter = { isApproved: true };
    if (destinationId) {
      filter.destination = destinationId;
    }

    const gallery = await Gallery.find(filter)
      .populate('user', 'fullName profilePicture')
      .populate('destination', 'name')
      .sort({ createdAt: -1 });

    res.json(gallery);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
