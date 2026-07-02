import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🚀 Connected smoothly to MongoDB'))
    .catch((err) => console.error('❌ MongoDB Connection failed:', err));

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to the backend of Pipeline Pilot!');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
  

