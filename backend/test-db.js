require("dotenv").config();
const mongoose = require("mongoose");
const Plant = require("./models/Plant");

async function check() {
  const uri = process.env.MONGODB_URI;
  console.log("URI from .env:", uri);
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");
    
    // Check which database we are connected to:
    const dbName = mongoose.connection.name;
    console.log("Current Database Name:", dbName);
    
    // Check how many documents exist
    const plants = await Plant.find({});
    console.log("Number of documents found:", plants.length);
    console.log("Plant Names:", plants.map(p => ({ id: p._id, name: p.name })));
    
    // List all collections in the current DB to see where the data might be hiding
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections in this DB:", collections.map(c => c.name));
    
    process.exit(0);
  } catch(e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

check();
