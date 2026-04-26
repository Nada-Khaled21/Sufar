require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cloudinary = require("./src/config/cloudinary");

const Destination = require("./src/models/Destination");
const Hotel = require("./src/models/Hotel");
const Room = require("./src/models/Room");

// ===== HELPER: رفع صورة واحدة =====
const uploadImage = async (localPath, cloudinaryFolder) => {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: cloudinaryFolder,
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });
    console.log(`  ✅ ${path.basename(localPath)} → ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`  ❌ Failed: ${localPath}: ${err.message}`);
    return null;
  }
};

// ===== HELPER: رفع كل صور فولدر =====
const uploadFolder = async (folderPath, cloudinaryFolder) => {
  if (!fs.existsSync(folderPath)) return [];

  const files = fs
    .readdirSync(folderPath)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort();

  // رفع الصور بالتوازي لتسريع العملية
  const uploadPromises = files.map((file) =>
    uploadImage(path.join(folderPath, file), cloudinaryFolder)
  );

  const results = await Promise.all(uploadPromises);
  return results.filter((url) => url !== null);
};

// ===== SEED مدينة واحدة =====
const seedCity = async (cityData) => {
  const citySlug = cityData.slug;
  const cityImagesBase = path.join(__dirname, "Images", citySlug);

  console.log(`\n${"=".repeat(55)}`);
  console.log(`🏙️  Seeding: ${cityData.city} (${cityData.country})`);
  console.log(`${"=".repeat(55)}`);

  // مسح البيانات القديمة
  const oldDest = await Destination.findOne({ slug: citySlug });
  if (oldDest) {
    const oldHotels = await Hotel.find({ destination: oldDest._id });
    const hotelIds = oldHotels.map((h) => h._id);

    // مسح كل الغرف التابعة لفنادق المدينة مرة واحدة
    if (hotelIds.length > 0) {
      await Room.deleteMany({ hotel: { $in: hotelIds } });
    }
    await Hotel.deleteMany({ destination: oldDest._id });
    await Destination.deleteOne({ _id: oldDest._id });
    console.log(`🗑️  Cleared old data for ${cityData.city}`);
  }

  // رفع صورة الـ Destination
  const destImagePath = path.join(cityImagesBase, "cover.jpg");
  let destImage = "";
  if (fs.existsSync(destImagePath)) {
    destImage = await uploadImage(destImagePath, `sufar/${citySlug}`) || "";
  }

  // إنشاء الـ Destination
  const destination = await Destination.create({
    name: cityData.city,
    name_ar: cityData.city_ar,
    slug: citySlug,
    country: cityData.country,
    country_ar: cityData.country_ar || "",
    region: cityData.region || "",
    description: cityData.description || "",
    image: destImage,
    isFeatured: cityData.isFeatured || false,
  });
  console.log(`✅ Destination: ${destination.name} (${destination._id})`);

  // إنشاء الفنادق
  for (const hotelData of cityData.hotels) {
    console.log(`\n🏨 ${hotelData.name}`);

    const hotelSlug = hotelData.slug;
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
      slug: hotelData.slug,
      destination: destination._id,
      description: hotelData.description,
      stars: hotelData.stars,
      rating: hotelData.rating,
      reviewsCount: hotelData.reviewsCount,
      startingFrom: hotelData.startingFrom,
      mealPlan: hotelData.mealPlan,
      locationType: hotelData.locationType,
      location: hotelData.location,
      facilities: hotelData.facilities,
      nearbyActivities: hotelData.nearbyActivities || [],
      images: generalUrls,
    });
    console.log(`✅ Hotel saved (${generalUrls.length} images)`);

    // إنشاء الغرف
    let roomImageIndex = 0;
    const imagesPerRoom = hotelData.roomTypes.length > 0
      ? Math.ceil(roomUrls.length / hotelData.roomTypes.length)
      : 0;

    for (const roomType of hotelData.roomTypes) {
      const roomImages = roomUrls.slice(roomImageIndex, roomImageIndex + imagesPerRoom);
      roomImageIndex += imagesPerRoom;

      await Room.create({
        hotel: hotel._id,
        name: roomType.name,
        type: roomType.type,
        pricePerNight: roomType.pricePerNight,
        capacity: roomType.capacity,
        beds: roomType.beds || 1,
        bathrooms: roomType.bathrooms || 1,
        images: roomImages,
        amenities: roomType.amenities || [],
      });
      console.log(`  ✅ Room: ${roomType.name} — $${roomType.pricePerNight}/night`);
    }
  }

  console.log(`\n✅ ${cityData.city} seeded successfully!`);
};

// ===== MAIN =====
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // قراءة البيانات من ملف citiesDataset.json بدلاً من مجلد cities
    const dataPath = path.join(__dirname, "citiesDataset.json");
    const citiesData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    console.log(`\n🌍 Found ${citiesData.length} cities to seed\n`);

    for (const cityData of citiesData) {
      await seedCity(cityData);
    }

    console.log("\n" + "=".repeat(55));
    console.log("🎉 All cities seeded successfully!");
    console.log("=".repeat(55));
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

seed();