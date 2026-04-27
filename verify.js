require("dotenv").config();
const mongoose = require("mongoose");
const Destination = require("./src/models/Destination");
const Hotel = require("./src/models/Hotel");
const Room = require("./src/models/Room");

const cleanup = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(" Connected to MongoDB\n");

  // 1. احتفظ بـ Cairo الجديدة بس (اللي عندها slug)
  const goodCairo = await Destination.findOne({ slug: "cairo" });
  console.log(` Good Cairo ID: ${goodCairo._id}`);

  // 2. احذف كل الـ Rooms اللي مش بتاعة فنادق القاهرة الجديدة
  const goodHotels = await Hotel.find({ destination: goodCairo._id });
  const goodHotelIds = goodHotels.map(h => h._id);
  const deletedRooms = await Room.deleteMany({ hotel: { $nin: goodHotelIds } });
  console.log(`  Deleted old rooms: ${deletedRooms.deletedCount}`);

  // 3. احذف كل الـ Hotels اللي مش بتاعة القاهرة الجديدة
  const deletedHotels = await Hotel.deleteMany({ destination: { $ne: goodCairo._id } });
  console.log(`  Deleted old hotels: ${deletedHotels.deletedCount}`);

  // 4. احذف كل الـ Destinations القديمة (اللي معندهاش slug)
  const deletedDests = await Destination.deleteMany({ slug: { $exists: false } });
  console.log(`  Deleted old destinations: ${deletedDests.deletedCount}`);

  // ===== تأكيد =====
  console.log("\n DATABASE AFTER CLEANUP:");
  console.log(`Destinations : ${await Destination.countDocuments()}`);
  console.log(`Hotels       : ${await Hotel.countDocuments()}`);
  console.log(`Rooms        : ${await Room.countDocuments()}`);

  process.exit(0);
};

cleanup().catch(err => { console.error(err); process.exit(1); });
