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

// ===== COUNTERS (عشان نطبع ملخص في الآخر) =====
const stats = {
  destinations: { added: 0, skipped: 0 },
  activities: { added: 0, skipped: 0 },
  hotels: { added: 0, skipped: 0 },
  rooms: { added: 0, skipped: 0 },
};

// =============================================
//  HELPERS
// =============================================

// جلب صورة من Pexels
const getPexelsImage = async (query) => {
  try {
    if (!process.env.PEXELS_API_KEY) return null;
    const res = await axios.get(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    );
    return res.data.photos[0]?.src?.medium || null;
  } catch (err) {
    console.log(`  ⚠️  Pexels error: ${err.message}`);
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
    console.error(`  ❌ Upload failed: ${path.basename(localPath)}: ${err.message}`);
    return null;
  }
};

// رفع كل صور فولدر على Cloudinary
const uploadFolder = async (folderPath, cloudinaryFolder) => {
  if (!fs.existsSync(folderPath)) return [];

  const files = fs
    .readdirSync(folderPath)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort();

  if (files.length === 0) return [];

  console.log(`   Uploading ${files.length} images...`);
  const uploadPromises = files.map((file) =>
    uploadImage(path.join(folderPath, file), cloudinaryFolder)
  );

  const results = await Promise.all(uploadPromises);
  return results.filter((url) => url !== null);
};

// توليد slug من اسم
const generateSlug = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
};

// =============================================
//  PHASE 1: المدن والأنشطة (من destination.json)
// =============================================
const seedDestinationsAndActivities = async () => {
  const filePath = path.join(__dirname, "destination.json");
  if (!fs.existsSync(filePath)) {
    console.log("\n⚠️  ملف destination.json غير موجود — تخطي Phase 1");
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`\n${"=".repeat(55)}`);
  console.log(` Phase 1: Destinations & Activities (${data.length} cities)`);
  console.log(`${"=".repeat(55)}`);

  for (const dest of data) {
    const slug = generateSlug(dest.name);

    // تحقق إذا المدينة موجودة
    const existing = await Destination.findOne({
      $or: [{ slug }, { name: dest.name }],
    });

    if (existing) {
      console.log(`    Skip: ${dest.name} (already exists)`);
      stats.destinations.skipped++;
      continue;
    }

    // جلب صورة من Pexels
    const destImage = await getPexelsImage(dest.name + " city");

    // إنشاء المدينة
    const createdDest = await Destination.create({
      name: dest.name,
      name_ar: dest.name_ar || "",
      slug,
      country: dest.country,
      region: dest.region || "",
      description: dest.description || "",
      image: destImage || "",
    });

    console.log(`  ✅ Added: ${dest.name}`);
    stats.destinations.added++;

    // إنشاء الأنشطة
    if (dest.activities && dest.activities.length > 0) {
      for (const act of dest.activities.slice(0, 4)) {
        const activityImage = await getPexelsImage(`${act.title} ${dest.name}`);

        await Activity.create({
          destination: createdDest._id,
          title: act.title,
          description: act.description || "",
          image: activityImage || "",
        });

        console.log(`     Activity: ${act.title}`);
        stats.activities.added++;
      }
    }
  }
};

// =============================================
//  PHASE 2: الفنادق والغرف (من citiesDataset.json)
// =============================================
const seedHotelsAndRooms = async () => {
  const filePath = path.join(__dirname, "citiesDataset.json");
  if (!fs.existsSync(filePath)) {
    console.log("\n⚠️  ملف citiesDataset.json غير موجود — تخطي Phase 2");
    return;
  }

  const citiesData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`\n${"=".repeat(55)}`);
  console.log(` Phase 2: Hotels & Rooms (${citiesData.length} cities)`);
  console.log(`${"=".repeat(55)}`);

  for (const cityData of citiesData) {
    const citySlug = cityData.slug || generateSlug(cityData.city);
    const cityImagesBase = path.join(__dirname, "Images", citySlug);

    console.log(`\n  ${cityData.city} (${cityData.country})`);

    // البحث عن المدينة أو إنشاؤها
    let destination = await Destination.findOne({
      $or: [{ slug: citySlug }, { name: cityData.city }],
    });

    if (!destination) {
      // رفع صورة الـ Destination من Cloudinary
      const destImagePath = path.join(cityImagesBase, "cover.jpg");
      let destImage = "";
      if (fs.existsSync(destImagePath)) {
        destImage = (await uploadImage(destImagePath, `sufar/${citySlug}`)) || "";
      }

      destination = await Destination.create({
        name: cityData.city,
        name_ar: cityData.city_ar || "",
        slug: citySlug,
        country: cityData.country,
        country_ar: cityData.country_ar || "",
        region: cityData.region || "",
        description: cityData.description || "",
        image: destImage,
        isFeatured: cityData.isFeatured || false,
      });

      console.log(`  ✅ Destination added: ${cityData.city}`);
      stats.destinations.added++;
    } else {
      console.log(`    Destination exists: ${cityData.city}`);
      stats.destinations.skipped++;
    }

    // إنشاء الفنادق
    const hotels = cityData.hotels || [];
    for (const hotelData of hotels) {
      const hotelSlug = hotelData.slug || generateSlug(hotelData.name);

      // تحقق إذا الفندق موجود
      const existingHotel = await Hotel.findOne({
        $or: [{ slug: hotelSlug }, { name: hotelData.name, destination: destination._id }],
      });

      if (existingHotel) {
        console.log(`    Skip hotel: ${hotelData.name}`);
        stats.hotels.skipped++;
        continue;
      }

      const hotelImagesBase = path.join(cityImagesBase, hotelSlug);

      // رفع صور الفندق العامة
      const generalUrls = await uploadFolder(
        path.join(hotelImagesBase, "general"),
        `sufar/${citySlug}/${hotelSlug}/general`
      );

      // رفع صور الغرف
      const roomUrls = await uploadFolder(
        path.join(hotelImagesBase, "rooms"),
        `sufar/${citySlug}/${hotelSlug}/rooms`
      );

      // إنشاء الفندق
      const hotel = await Hotel.create({
        name: hotelData.name,
        slug: hotelSlug,
        destination: destination._id,
        description: hotelData.description || "",
        stars: hotelData.stars,
        rating: hotelData.rating || 0,
        reviewsCount: hotelData.reviewsCount || 0,
        startingFrom: hotelData.startingFrom || 0,
        mealPlan: hotelData.mealPlan,
        locationType: hotelData.locationType,
        location: hotelData.location,
        facilities: hotelData.facilities || [],
        nearbyActivities: hotelData.nearbyActivities || [],
        images: generalUrls,
      });

      console.log(`  ✅ Hotel added: ${hotelData.name} (${generalUrls.length} images)`);
      stats.hotels.added++;

      // إنشاء الغرف
      const roomTypesList = hotelData.roomTypes || [];
      const imagesPerRoom =
        roomTypesList.length > 0
          ? Math.ceil(roomUrls.length / roomTypesList.length)
          : 0;

      let roomImageIndex = 0;
      for (const roomType of roomTypesList) {
        const roomImages = roomUrls.slice(roomImageIndex, roomImageIndex + imagesPerRoom);
        roomImageIndex += imagesPerRoom;

        await Room.create({
          hotel: hotel._id,
          name: roomType.name || "Standard Room",
          type: roomType.type || "Standard",
          pricePerNight: roomType.pricePerNight || hotelData.startingFrom || 100,
          capacity: roomType.capacity || 2,
          beds: roomType.beds || 1,
          bathrooms: roomType.bathrooms || 1,
          images: roomImages,
          amenities: roomType.amenities || [],
        });

        console.log(`      Room: ${roomType.name || "Standard"} — $${roomType.pricePerNight || "N/A"}/night`);
        stats.rooms.added++;
      }
    }
  }
};

// =============================================
//  MAIN — تشغيل كل المراحل
// =============================================
const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    console.log(` Database: ${mongoose.connection.name}`);

    // Phase 1: المدن والأنشطة
    await seedDestinationsAndActivities();

    // Phase 2: الفنادق والغرف
    await seedHotelsAndRooms();

    // ملخص نهائي
    console.log(`\n${"=".repeat(55)}`);
    console.log(" Seeding Complete! Summary:");
    console.log(`${"=".repeat(55)}`);
    console.log(`   Destinations — Added: ${stats.destinations.added}, Skipped: ${stats.destinations.skipped}`);
    console.log(`   Activities   — Added: ${stats.activities.added}, Skipped: ${stats.activities.skipped}`);
    console.log(`   Hotels       — Added: ${stats.hotels.added}, Skipped: ${stats.hotels.skipped}`);
    console.log(`   Rooms        — Added: ${stats.rooms.added}, Skipped: ${stats.rooms.skipped}`);
    console.log(`${"=".repeat(55)}\n`);

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

main();
