const mongoose = require("mongoose");

const plantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  species: { type: String, required: false },
  imageUri: { type: String, required: false }, // Base64 or local URI from Device
  lastWatered: { type: Date, default: Date.now },
  isDead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Plant", plantSchema);
