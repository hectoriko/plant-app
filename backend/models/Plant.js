const mongoose = require("mongoose");

const plantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  species: { type: String, required: false },
  description: { type: String, required: false }, // Text about the plant
  imageUri: { type: String, required: false }, // Base64 or local URI from Device
  photos: { type: [String], default: [] }, // Additional photos for the carousel
  lastWatered: { type: Date, default: Date.now },
  wateredDates: { type: [Date], default: [Date.now] }, // History of waterings
  isDead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Plant", plantSchema);
