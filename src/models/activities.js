const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Destination",
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  description: String,

  image: String,
}, { timestamps: true });

module.exports = mongoose.model("Activity", activitySchema);