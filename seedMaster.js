require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const axios = require("axios");
const cloudinary = require("./src/config/cloudinary");

// Models
const Destination = require("./src/models/Destination");
const Activity = require("./src/models/activities");
const Hotel = require("./src/models/Hotel");
const Room = require("./src/models/Room");
const TravelOffice = require("./src/models/travelOffice");

// =====================
// STATS
// =====================
const stats = {
  destinations: { added: 0 },
  activities: { added: 0 },
  hotels: { added: 0 },
  rooms: { added: 0 },
  travelOffices: { added: 0 },
};

// =====================
// HELPERS
// =====================
const generateSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

const getPexelsImage = async (query) => {
  try {
    if (!process.env.PEXELS_API_KEY) return null;
    const res = await axios.get(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    );
    return res.data.photos[0]?.src?.medium || null;
  } catch {
    return null;
  }
};

// رفع صورة واحدة على Cloudinary
const uploadImage = async (localPath, cloudinaryFolder) => {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: cloudinaryFolder,
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });
    return result.secure_url;
  } catch (err) {
    console.error(`   Upload failed: ${path.basename(localPath)}: ${err.message}`);
    return null;
  }
};

// جلب صورة الـ destination من فولدر Images/destinations/:slug
const getDestinationImage = async (slug) => {
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  const baseDir = path.join(__dirname, "Images", "destinations", slug);

  // نشوف لو في فولدر باسم الـ slug
  if (fs.existsSync(baseDir)) {
    const files = fs.readdirSync(baseDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    if (files.length > 0) {
      const localPath = path.join(baseDir, files[0]);
      const url = await uploadImage(localPath, `sufar/destinations`);
      if (url) return url;
    }
  }

  // نشوف لو في صورة مباشرة باسم الـ slug
  for (const ext of extensions) {
    const localPath = path.join(__dirname, "Images", "destinations", `${slug}.${ext}`);
    if (fs.existsSync(localPath)) {
      const url = await uploadImage(localPath, `sufar/destinations`);
      if (url) return url;
    }
  }

  return null;
};

// جلب صور الفندق من فولدر Images/:citySlug/:hotelSlug/general
const getHotelImages = async (citySlug, hotelSlug) => {
  const baseDir = path.join(__dirname, "Images", citySlug, hotelSlug, "general");
  let uploadedUrls = [];
  
  if (fs.existsSync(baseDir)) {
    const files = fs.readdirSync(baseDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    for (const file of files) {
      const localPath = path.join(baseDir, file);
      const url = await uploadImage(localPath, `sufar/hotels/${hotelSlug}/general`);
      if (url) uploadedUrls.push(url);
    }
  }
  return uploadedUrls;
};

// جلب صور الغرف من فولدر Images/:citySlug/:hotelSlug/rooms
const getRoomImages = async (citySlug, hotelSlug) => {
  const baseDir = path.join(__dirname, "Images", citySlug, hotelSlug, "rooms");
  let uploadedUrls = [];
  
  if (fs.existsSync(baseDir)) {
    const files = fs.readdirSync(baseDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    for (const file of files) {
      const localPath = path.join(baseDir, file);
      const url = await uploadImage(localPath, `sufar/hotels/${hotelSlug}/rooms`);
      if (url) uploadedUrls.push(url);
    }
  }
  return uploadedUrls;
};

// =====================
// 1. DESTINATIONS + ACTIVITIES
// =====================
const seedDestinations = async () => {
  const file = path.join(__dirname, "destination.json");
  if (!fs.existsSync(file)) return;

  const data = JSON.parse(fs.readFileSync(file, "utf-8"));

  for (const dest of data) {
    const slug = generateSlug(dest.name);

    const localImage = await getDestinationImage(slug);
    const destImage = localImage || "";

    const destination = await Destination.findOneAndUpdate(
      { slug },
      {
        $setOnInsert: {
          name: dest.name,
          name_ar: dest.name_ar || "",
          slug,
          country: dest.country,
          region: dest.region || "",
          description: dest.description || "",
          image: destImage,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    if (localImage) console.log(`  Destination image uploaded: ${dest.name}`);
    stats.destinations.added++;

    // ACTIVITIES — صورهم من Pexels بس
    for (const act of dest.activities || []) {
      await Activity.findOneAndUpdate(
        { destination: destination._id, title: act.title },
        {
          $setOnInsert: {
            destination: destination._id,
            title: act.title,
            description: act.description || "",
            image: await getPexelsImage(`${act.title} ${dest.name}`),
          },
        },
        { upsert: true }
      );
      stats.activities.added++;
    }
  }
};

// =====================
// 2. HOTELS + ROOMS
// =====================
const seedHotels = async () => {
  const file = path.join(__dirname, "citiesDataset.json");
  if (!fs.existsSync(file)) return;

  const data = JSON.parse(fs.readFileSync(file, "utf-8"));

  for (const city of data) {
    const citySlug = (city.slug || generateSlug(city.city)).toLowerCase();

    // صورة الـ destination من لوكال
    const localDestImage = await getDestinationImage(citySlug);

    const destination = await Destination.findOneAndUpdate(
      { slug: citySlug },
      {
        $setOnInsert: {
          name: city.city,
          name_ar: city.city_ar || "",
          slug: citySlug,
          country: city.country,
          country_ar: city.country_ar || "",
          region: city.region || "",
          description: city.description || "",
          image: localDestImage || "",
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const hotels = city.hotels || [];

    for (const h of hotels) {
      const hotelSlug = h.slug || generateSlug(h.name);

      const hotelImages = await getHotelImages(citySlug, hotelSlug);

      const hotel = await Hotel.findOneAndUpdate(
        { slug: hotelSlug },
        {
          $setOnInsert: {
            name: h.name,
            slug: hotelSlug,
            destination: destination._id,
            description: h.description || "",
            stars: h.stars,
            rating: h.rating || 0,
            reviewsCount: h.reviewsCount || 0,
            startingFrom: h.startingFrom || 0,
            mealPlan: h.mealPlan,
            locationType: h.locationType,
            location: h.location,
            facilities: h.facilities || [],
            nearbyActivities: h.nearbyActivities || [],
            images: hotelImages,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      stats.hotels.added++;

      const roomImages = await getRoomImages(citySlug, hotelSlug);

      const roomTypes = h.roomTypes || [];
      for (let i = 0; i < roomTypes.length; i++) {
        const r = roomTypes[i];
        const assignedImage = roomImages[i] ? [roomImages[i]] : [];

        await Room.findOneAndUpdate(
          {
            hotel: hotel._id,
            name: r.name,
          },
          {
            $setOnInsert: {
              hotel: hotel._id,
              name: r.name,
              type: r.type,
              pricePerNight: r.pricePerNight,
              capacity: r.capacity,
              beds: r.beds,
              bathrooms: r.bathrooms,
              images: assignedImage,
              amenities: r.amenities || [],
            },
          },
          { upsert: true }
        );

        stats.rooms.added++;
      }
    }
  }
};

// =====================
// 3. TRAVEL OFFICES
// =====================
const seedTravelOffices = async () => {
  const file = path.join(__dirname, "office.json");
  if (!fs.existsSync(file)) return;

  const data = JSON.parse(fs.readFileSync(file, "utf-8"));

  for (const o of data) {
    const cleanedReviews = (o.reviews || []).map((r) => ({
      name: r.name,
      comment: r.comment,
      rating: r.rating,
      date: r.date ? new Date(r.date) : new Date(),
    }));

    await TravelOffice.findOneAndUpdate(
      { name: o.name, "location.city": o.location?.city },
      {
        $setOnInsert: {
          ...o,
          reviews: cleanedReviews,
        },
      },
      { upsert: true }
    );

    stats.travelOffices.added++;
  }
};

// =====================
// MAIN
// =====================
const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" Connected to MongoDB");

    if (process.argv.includes("--clean")) {
      console.log(" Cleaning old data (--clean flag detected)...");
      await Destination.deleteMany({});
      await Activity.deleteMany({}); 
      await Hotel.deleteMany({});
      await Room.deleteMany({});
      await TravelOffice.deleteMany({});
    } else {
      console.log(" Skipping data cleaning. Existing data will be preserved.");
      console.log(" (To delete old data, run: node seedMaster.js --clean)");
    }

    await seedDestinations();
    await seedHotels();
    await seedTravelOffices();

    console.log("\n DONE SEEDING");
    console.log(stats);

    process.exit(0);
  } catch (err) {
    console.error(" Seed error:", err.message);
    process.exit(1);
  }
};

main();