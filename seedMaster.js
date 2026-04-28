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

// =====================
// STATS
// =====================
const stats = {
  destinations: { added: 0 },
  activities: { added: 0 },
  hotels: { added: 0 },
  rooms: { added: 0 },
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

// =====================
// 1. DESTINATIONS + ACTIVITIES
// =====================
const seedDestinations = async () => {
  const file = path.join(__dirname, "destination.json");
  if (!fs.existsSync(file)) return;

  const data = JSON.parse(fs.readFileSync(file, "utf-8"));

  for (const dest of data) {
    const slug = generateSlug(dest.name);

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
          image: await getPexelsImage(dest.name + " city"),
        },
      },
      { upsert: true, new: true }
    );

    stats.destinations.added++;

    // ACTIVITIES (no duplicates)
    for (const act of dest.activities || []) {
      await Activity.findOneAndUpdate(
        {
          destination: destination._id,
          title: act.title,
        },
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
    const citySlug = city.slug || generateSlug(city.city);

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
        },
      },
      { upsert: true, new: true }
    );

    const hotels = city.hotels || [];

    for (const h of hotels) {
      const hotelSlug = h.slug || generateSlug(h.name);

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
            images: [],
          },
        },
        { upsert: true, new: true }
      );

      stats.hotels.added++;

      // ROOMS (no duplicates)
      for (const r of h.roomTypes || []) {
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
              images: [],
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
// MAIN
// =====================
const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" Connected to MongoDB");

    await seedDestinations();
    await seedHotels();

    console.log("\n DONE SEEDING");
    console.log(stats);

    process.exit(0);
  } catch (err) {
    console.error(" Seed error:", err.message);
    process.exit(1);
  }
};

main();