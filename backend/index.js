require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Plant = require("./models/Plant");
const Task = require("./models/Task");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

app.get("/api/plants/:id", async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: "Plant not found" });
    res.json(plant);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/plants", async (req, res) => {
  try {
    console.log("Creating new plant:", req.body.name);
    const newPlant = new Plant(req.body);
    await newPlant.save();
    console.log("Plant saved successfully");
    res.status(201).json(newPlant);
  } catch (error) {
    console.error("Error creating plant:", error.message);
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

// Task Routes
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().populate('plantId').sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const newTask = new Task(req.body);
    await newTask.save();
    const populatedTask = await Task.findById(newTask._id).populate('plantId');
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ error: "Error creating task" });
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('plantId');
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: "Error updating task" });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting task" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
