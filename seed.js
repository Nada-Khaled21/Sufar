require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const axios = require("axios");

const Destination = require("./src/models/Destination");
const Activity = require("./src/models/activities");

mongoose.connect(process.env.MONGO_URI);

const getPexelsImage = async (query) => {
  try {
    const res = await axios.get(
      `https://api.pexels.com/v1/search?query=${query}&per_page=1`,
      {
        headers: {
          Authorization: process.env.PEXELS_API_KEY,
        },
      }
    );

    return res.data.photos[0]?.src?.medium || null;
  } catch (err) {
    console.log("Pexels error:", err.message);
    return null;
  }
};

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./destination.json"), "utf-8")
);

const seed = async () => {
  try {
    console.log("Seeding started");

    await Destination.deleteMany();
    await Activity.deleteMany();

    for (const dest of data) {
      const destImage = await getPexelsImage(dest.name + " city");

      const createdDestination = await Destination.create({
        name: dest.name,
        name_ar: dest.name_ar,
        country: dest.country,
        region: dest.region,
        description: dest.description,
        image: destImage,
      });

      console.log(`Destination created: ${dest.name}`);

      for (const act of dest.activities.slice(0, 4)) {
        const query = `${act.title} ${dest.name}`;

        const activityImage = await getPexelsImage(query);

        await Activity.create({
          destination: createdDestination._id,
          title: act.title,
          description: act.description,
          image: activityImage,
        });

        console.log(`Activity created: ${act.title}`);
      }
    }

    console.log("Seed completed successfully");
    process.exit();
  } catch (err) {
    console.log("Error:", err);
    process.exit(1);
  }
};

seed();