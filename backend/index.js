require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Plant = require("./models/Plant");

const app = express();
app.use(cors());
app.use(express.json());

// Set up MongoDB Connection. You can add MONGODB_URI in a .env file or rely on local mongodb
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plantapp";
mongoose
  .connect(uri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Routes
app.get("/api/plants", async (req, res) => {
  try {
    const plants = await Plant.find();
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/plants", async (req, res) => {
  try {
    const newPlant = new Plant(req.body);
    await newPlant.save();
    res.status(201).json(newPlant);
  } catch (error) {
    res.status(500).json({ error: "Error creating plant" });
  }
});

app.put("/api/plants/:id", async (req, res) => {
  try {
    const updatedPlant = await Plant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedPlant);
  } catch (error) {
    res.status(500).json({ error: "Error updating plant" });
  }
});

app.delete("/api/plants/:id", async (req, res) => {
  try {
    await Plant.findByIdAndDelete(req.params.id);
    res.json({ message: "Plant deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting plant" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
